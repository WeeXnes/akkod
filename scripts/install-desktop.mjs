#!/usr/bin/env node
// Installs akkod from this checkout into the user's app menu (no root needed):
//   ~/.local/bin/akkod, ~/.local/share/applications/akkod.desktop, and the icon.
// `--uninstall` removes exactly those files again.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const projectDir = path.resolve(import.meta.dirname, '..');
const home = os.homedir();
const dataHome = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');

const binDir = path.join(home, '.local', 'bin');
const appsDir = path.join(dataHome, 'applications');
const iconDir = path.join(dataHome, 'icons', 'hicolor', 'scalable', 'apps');

const launcherPath = path.join(binDir, 'akkod');
const desktopPath = path.join(appsDir, 'akkod.desktop');
const iconPath = path.join(iconDir, 'akkod.svg');
const iconSrc = path.join(projectDir, 'assets', 'akkod.svg');
const runScript = path.join(projectDir, 'scripts', 'run-electron.sh');

function remove(p) {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed: ${p}`);
  }
}

function refreshCaches() {
  for (const cmd of [`update-desktop-database "${appsDir}"`, `gtk-update-icon-cache -q -t "${path.join(dataHome, 'icons', 'hicolor')}"`]) {
    try { execSync(cmd, { stdio: 'ignore' }); } catch { /* optional tools */ }
  }
}

if (process.platform !== 'linux') {
  console.error('install:desktop is for Linux. On Windows use the installer (npm run dist:win).');
  process.exit(1);
}

if (process.argv.includes('--uninstall') || process.argv.includes('-u')) {
  remove(launcherPath);
  remove(desktopPath);
  remove(iconPath);
  refreshCaches();
  console.log('✓ akkod removed from the app menu. Profiles in ~/.config/akkod are kept.');
  process.exit(0);
}

fs.chmodSync(runScript, 0o755);

console.log('Building the UI (dist/)...');
execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });

fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(launcherPath, `#!/usr/bin/env bash\nexec "${runScript}" "$@"\n`, { mode: 0o755 });
fs.chmodSync(launcherPath, 0o755);
console.log(`✓ Launcher:      ${launcherPath}`);

fs.mkdirSync(iconDir, { recursive: true });
fs.copyFileSync(iconSrc, iconPath);
console.log(`✓ Icon:          ${iconPath}`);

fs.mkdirSync(appsDir, { recursive: true });
fs.writeFileSync(desktopPath, `[Desktop Entry]
Version=1.0
Type=Application
Name=akkod
GenericName=Keyboard Configuration
Comment=Configure the Akko 5075S (QMK / VIA): keymap, knob and lighting
Exec=${launcherPath} %U
TryExec=${launcherPath}
Path=${projectDir}
Icon=akkod
Terminal=false
Categories=Settings;HardwareSettings;Utility;
Keywords=akko;5075s;keyboard;qmk;via;keymap;rgb;
StartupWMClass=akkod
StartupNotify=true
`);
console.log(`✓ Menu entry:    ${desktopPath}`);

refreshCaches();

const udev = '/etc/udev/rules.d';
const hasRule = fs.existsSync(udev) && fs.readdirSync(udev).some((f) => {
  try { return /fffe/i.test(fs.readFileSync(path.join(udev, f), 'utf8')); } catch { return false; }
});
console.log('\n✓ akkod is in your app menu. Run it from there or with: akkod');
if (!hasRule) {
  console.log('! No udev rule for the keyboard found. Open akkod > Health to install it, or copy');
  console.log(`  ${path.join(projectDir, 'scripts', '70-akko-5075s-via.rules')} to ${udev}/ with sudo.`);
}
