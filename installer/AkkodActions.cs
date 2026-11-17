using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using InstallerFramework.Core.Actions;
using InstallerFramework.Core.Models;

namespace AkkodInstaller
{
    internal static class Payload
    {
        public const string ResourceName = "AkkodInstaller.Payload.akkod-win.zip";

        public static Stream Open() =>
            Assembly.GetEntryAssembly()!.GetManifestResourceStream(ResourceName)
            ?? throw new FileNotFoundException("The akkod payload is missing from this installer.");

        public static string Version =>
            Assembly.GetEntryAssembly()!
                .GetCustomAttributes<AssemblyMetadataAttribute>()
                .FirstOrDefault(a => a.Key == "AkkodVersion")?.Value ?? "1.0.0";
    }

    /// <summary>Stops a running akkod so its files can be replaced.</summary>
    internal sealed class CloseRunningAppAction : IInstallerAction
    {
        public string Name => "Closing akkod";

        public async Task ExecuteAsync(InstallerContext context, IProgress<InstallerProgressReport> progress, CancellationToken cancellationToken)
        {
            var running = Process.GetProcessesByName("akkod");
            if (running.Length == 0)
            {
                progress.Report(InstallerProgressReport.CreateLog("akkod is not running [OK]"));
                return;
            }
            foreach (var p in running)
            {
                try
                {
                    p.Kill(entireProcessTree: true);
                    await p.WaitForExitAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    progress.Report(InstallerProgressReport.CreateLog($"Could not close process {p.Id}: {ex.Message}"));
                }
            }
            progress.Report(InstallerProgressReport.CreateLog($"Closed {running.Length} akkod process(es) [OK]"));
        }
    }

    /// <summary>
    /// Writes an uninstaller that removes exactly the files this installer put down (never the whole
    /// folder, in case the user picked an existing one), the shortcuts and the Apps &amp; Features entry.
    /// Profiles and backups in %APPDATA%\akkod are kept.
    /// </summary>
    internal sealed class RegisterUninstallAction : IInstallerAction
    {
        private const string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\akkod";
        public string Name => "Registering uninstaller";

        public async Task ExecuteAsync(InstallerContext context, IProgress<InstallerProgressReport> progress, CancellationToken cancellationToken)
        {
            var targetDir = Path.GetFullPath(context.ExpandVariables("{TargetDir}"));
            var startMenuLink = context.ExpandVariables(@"{StartMenu}\akkod.lnk");
            var desktopLink = context.ExpandVariables(@"{Desktop}\akkod.lnk");

            // Manifest of installed files, relative to the install folder.
            var files = new List<string>();
            long bytes = 0;
            using (var zip = new ZipArchive(Payload.Open(), ZipArchiveMode.Read))
            {
                foreach (var e in zip.Entries)
                {
                    if (string.IsNullOrEmpty(e.Name)) continue;
                    files.Add(e.FullName.Replace('/', '\\'));
                    bytes += e.Length;
                }
            }
            var manifestPath = Path.Combine(targetDir, "akkod-files.txt");
            await File.WriteAllLinesAsync(manifestPath, files, Encoding.UTF8, cancellationToken);

            var scriptPath = Path.Combine(targetDir, "uninstall.ps1");
            await File.WriteAllTextAsync(scriptPath, BuildScript(targetDir, startMenuLink, desktopLink), new UTF8Encoding(true), cancellationToken);
            progress.Report(InstallerProgressReport.CreateLog($"Wrote {scriptPath} [OK]"));

            if (!OperatingSystem.IsWindows())
            {
                progress.Report(InstallerProgressReport.CreateLog("Not on Windows: skipped Apps & Features entry."));
                return;
            }

            using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(UninstallKey);
            var exe = Path.Combine(targetDir, "akkod.exe");
            key.SetValue("DisplayName", "akkod");
            key.SetValue("DisplayVersion", Payload.Version);
            key.SetValue("Publisher", "WeeXnes");
            key.SetValue("DisplayIcon", $"\"{exe}\",0");
            key.SetValue("InstallLocation", targetDir);
            key.SetValue("UninstallString",
                $"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"{scriptPath}\"");
            key.SetValue("QuietUninstallString",
                $"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"{scriptPath}\" -Quiet");
            key.SetValue("NoModify", 1, Microsoft.Win32.RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, Microsoft.Win32.RegistryValueKind.DWord);
            key.SetValue("EstimatedSize", (int)(bytes / 1024), Microsoft.Win32.RegistryValueKind.DWord);
            progress.Report(InstallerProgressReport.CreateLog("Added akkod to Apps & Features [OK]"));
        }

        private static string Ps(string s) => "'" + s.Replace("'", "''") + "'";

        private static string BuildScript(string dir, string startMenuLink, string desktopLink) => $@"# akkod uninstaller (generated by akkod-setup)
param([switch]$Quiet)
$ErrorActionPreference = 'SilentlyContinue'
$dir = {Ps(dir)}

if (-not $Quiet) {{
  Add-Type -AssemblyName System.Windows.Forms
  $answer = [System.Windows.Forms.MessageBox]::Show(
    ""Remove akkod from this computer?`n`nYour profiles and backups in %APPDATA%\akkod are kept. Settings stored on the keyboard are not changed."",
    'Uninstall akkod', 'YesNo', 'Question')
  if ($answer -ne 'Yes') {{ exit 1 }}
}}

Get-Process -Name akkod | Stop-Process -Force
Start-Sleep -Milliseconds 500

$manifest = Join-Path $dir 'akkod-files.txt'
if (Test-Path $manifest) {{
  foreach ($rel in Get-Content $manifest) {{
    if ($rel -and -not $rel.Contains('..')) {{ Remove-Item -LiteralPath (Join-Path $dir $rel) -Force }}
  }}
  # Remove folders the payload created, deepest first, only if now empty.
  Get-ChildItem -LiteralPath $dir -Directory -Recurse | Sort-Object {{ $_.FullName.Length }} -Descending |
    Where-Object {{ -not (Get-ChildItem -LiteralPath $_.FullName -Force) }} | Remove-Item -Force
  Remove-Item -LiteralPath $manifest -Force
}}

Remove-Item -LiteralPath {Ps(startMenuLink)} -Force
Remove-Item -LiteralPath {Ps(desktopLink)} -Force
Remove-Item -Path 'HKCU:\{UninstallKey}' -Recurse -Force

# Remove this script, then the folder if nothing else is left in it.
$self = $MyInvocation.MyCommand.Path
Start-Process -WindowStyle Hidden cmd.exe -ArgumentList ('/c timeout /t 2 /nobreak >nul & del /f /q ""' + $self + '"" & rd ""' + $dir + '""')
";
    }
}
