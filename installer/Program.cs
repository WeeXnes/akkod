using InstallerFramework.Core.Actions;
using InstallerFramework.Core.Builder;
using InstallerFramework.Core.Services;
using InstallerFramework.UI;

namespace AkkodInstaller
{
    internal class Program
    {
        [STAThread]
        public static void Main(string[] args)
        {
            var version = Payload.Version;
            var defaultDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "akkod");

            const string notice = @"akkod — configuration tool for the Akko 5075S (QMK / VIA)

Copyright (C) 2026 WeeXnes

This program is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html

akkod is built on Electron and Chromium. Their licenses are installed alongside the app
(LICENSE.electron.txt and LICENSES.chromium.html).

What akkod does to your keyboard: it reads and writes the keymap, knob and lighting through the
VIA interface, the same way the VIA app does. It never flashes firmware, never enters the
bootloader and never wipes the keyboard's memory.";

            var config = InstallerBuilder.Create("akkod")
                .WithVersion(version)
                .WithPublisher("WeeXnes")
                .WithDefaultDirectory(defaultDir)
                .RequireAdmin(ElevationMode.AutoDetect)

                .AddWelcomePage(
                    title: "Welcome to akkod Setup",
                    welcomeText:
                        $"This will install akkod {version}, the configuration tool for the Akko 5075S keyboard.\n\n" +
                        "Remap keys and the knob on all six layers, change the lighting, test switches and keep profiles.\n\n" +
                        "No drivers are needed. Click Next to continue.")
                .AddLicensePage(notice)
                .AddDirectoryPage()
                .AddConfigPage(c => c
                    .WithTitle("Shortcuts", "Choose where akkod should appear.")
                    .AddCheckbox("desktop_shortcut", "Create a desktop shortcut", defaultValue: true))

                .AddStep("Closing akkod", new CloseRunningAppAction())
                .AddStep("Installing akkod", new ExtractZipAction("Payload/akkod-win.zip", "{TargetDir}", overwrite: true, actionName: "Installing akkod"))
                .AddStep("Start menu shortcut", new CreateShortcutAction(
                    @"{StartMenu}\akkod.lnk", @"{TargetDir}\akkod.exe",
                    description: "Akko 5075S keyboard configuration", displayName: "akkod"))
                .AddStep("Desktop shortcut", new CreateShortcutAction(
                    @"{Desktop}\akkod.lnk", @"{TargetDir}\akkod.exe",
                    description: "Akko 5075S keyboard configuration", conditionVariableKey: "desktop_shortcut", displayName: "akkod"))
                .AddStep("Registering uninstaller", new RegisterUninstallAction())

                .AddCompletionPage(launchExecutableOnFinish: @"{TargetDir}\akkod.exe")
                .Build();

            if (args.Length == 2 && args[0] == "--self-test")
            {
                Environment.Exit(SelfTest(config, args[1]).GetAwaiter().GetResult());
            }

            InstallerRunner.Run(config, args);
        }

        /// <summary>
        /// Runs every install step without the GUI into a scratch folder (shortcuts land there too).
        /// Used to check the pipeline on a build machine; never writes to the real Start menu or desktop.
        /// </summary>
        private static async Task<int> SelfTest(InstallerFramework.Core.Models.InstallerConfig config, string dir)
        {
            dir = Path.GetFullPath(dir);
            Directory.CreateDirectory(dir);
            var ctx = new InstallerFramework.Core.Models.InstallerContext();
            ctx.Set("TargetDir", dir);
            ctx.Set("StartMenu", Path.Combine(dir, "_startmenu"));
            ctx.Set("Desktop", Path.Combine(dir, "_desktop"));
            ctx.Set("desktop_shortcut", "true");
            var log = new Progress<InstallerFramework.Core.Models.InstallerProgressReport>(_ => { });
            foreach (var step in config.Steps)
            {
                if (step.Action is CreateShortcutAction && !OperatingSystem.IsWindows())
                {
                    Console.WriteLine($"skip  {step.Title} (Windows only)");
                    continue;
                }
                try
                {
                    await step.Action.ExecuteAsync(ctx, log, CancellationToken.None);
                    Console.WriteLine($"ok    {step.Title}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"FAIL  {step.Title}: {ex.Message}");
                    return 1;
                }
            }
            return 0;
        }
    }
}
