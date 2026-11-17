// "Start at login" for akkod, opening straight into the tray (--minimized).
//   Windows: the per-user Run key, via Electron's login item API.
//   Linux:   a systemd user service bound to graphical-session.target when the session has one
//            (Hyprland with uwsm, GNOME, KDE...), otherwise an XDG autostart entry.
const { app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const NAME = 'akkod';
const ARGS = ['--minimized'];

const configHome = () => process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
const servicePath = () => path.join(configHome(), 'systemd', 'user', 'akkod.service');
const desktopPath = () => path.join(configHome(), 'autostart', 'akkod.desktop');

/** The command that starts this copy of akkod. */
function launchCommand() {
  if (process.env.APPIMAGE) return process.env.APPIMAGE;
  // Built packages run from app.asar. (app.isPackaged is also true for a checkout run
  // with Arch's system electron, so it can't tell the two apart.)
  if (app.getAppPath().endsWith('.asar')) return process.execPath;
  const launcher = path.join(os.homedir(), '.local', 'bin', 'akkod'); // npm run install:desktop
  if (fs.existsSync(launcher)) return launcher;
  return path.join(__dirname, '..', '..', 'scripts', 'run-electron.sh');
}

function systemctl(...args) {
  return execFileSync('systemctl', ['--user', ...args], { timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

function hasGraphicalSession() {
  try {
    return systemctl('is-active', 'graphical-session.target') === 'active';
  } catch {
    return false;
  }
}

const quote = (s) => (/[\s"'\\]/.test(s) ? `"${s.replace(/(["\\])/g, '\\$1')}"` : s);

function isEnabled() {
  if (process.platform === 'win32') {
    return app.getLoginItemSettings({ path: process.execPath, args: ARGS, name: NAME }).openAtLogin;
  }
  if (process.platform !== 'linux') return false;
  if (fs.existsSync(servicePath())) {
    try {
      return systemctl('is-enabled', 'akkod.service') === 'enabled';
    } catch {
      return false;
    }
  }
  return fs.existsSync(desktopPath());
}

function setEnabled(on) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({ openAtLogin: on, path: process.execPath, args: ARGS, name: NAME });
    return isEnabled();
  }
  if (process.platform !== 'linux') return false;

  // Always clear both forms first so there is never a double start.
  if (fs.existsSync(servicePath())) {
    try { systemctl('disable', 'akkod.service'); } catch {}
    fs.rmSync(servicePath(), { force: true });
    try { systemctl('daemon-reload'); } catch {}
  }
  fs.rmSync(desktopPath(), { force: true });
  if (!on) return false;

  const cmd = `${quote(launchCommand())} ${ARGS.join(' ')}`;
  if (hasGraphicalSession()) {
    fs.mkdirSync(path.dirname(servicePath()), { recursive: true });
    fs.writeFileSync(
      servicePath(),
      `[Unit]
Description=akkod keyboard configuration (tray)
PartOf=graphical-session.target
After=graphical-session.target

[Service]
Type=simple
# Wait up to 15 s for the tray host (e.g. waybar) so the icon has somewhere to go.
ExecStartPre=/bin/sh -c 'for i in $(seq 1 30); do busctl --user list 2>/dev/null | grep -q StatusNotifierWatcher && exit 0; sleep 0.5; done; exit 0'
ExecStart=${cmd}
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
`
    );
    try {
      systemctl('daemon-reload');
      systemctl('enable', 'akkod.service');
    } catch {}
  } else {
    fs.mkdirSync(path.dirname(desktopPath()), { recursive: true });
    fs.writeFileSync(
      desktopPath(),
      `[Desktop Entry]
Type=Application
Name=akkod
Comment=Akko 5075S keyboard configuration (tray)
Exec=${cmd}
Icon=akkod
Terminal=false
X-GNOME-Autostart-enabled=true
`
    );
  }
  return isEnabled();
}

module.exports = { isEnabled, setEnabled };
