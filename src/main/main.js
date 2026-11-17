const { app, BrowserWindow, ipcMain, dialog, shell, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

const VENDOR_ID = 0xfffe;
const PRODUCT_ID = 0x000b;
const UDEV_RULE_PATH = '/etc/udev/rules.d/70-akko-5075s-via.rules';
const UDEV_RULE =
  'KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="fffe", ATTRS{idProduct}=="000b", MODE="0660", TAG+="uaccess"';

app.setName('akkod');
if (process.platform === 'linux' && typeof app.setDesktopName === 'function') {
  app.setDesktopName('akkod.desktop');
}

let mainWindow = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

const isAkko = (d) => d && d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID;

function setupHidPermissions() {
  const ses = session.defaultSession;
  // Only the Akko 5075S is ever exposed to the page.
  ses.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    const dev = details.deviceList.find(isAkko);
    callback(dev ? dev.deviceId : '');
  });
  ses.setPermissionCheckHandler((_wc, permission) => permission === 'hid');
  ses.setDevicePermissionHandler((details) => details.deviceType === 'hid' && isAkko(details.device));
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
}

function iconPath() {
  const p = path.join(__dirname, '..', '..', 'assets', 'akkod.png');
  return fs.existsSync(p) ? p : undefined;
}

function createWindow() {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#000000',
    title: 'akkod',
    icon: iconPath(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));

  // Links never open inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url !== mainWindow.webContents.getURL()) e.preventDefault();
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => (mainWindow = null));
}

const backupsDir = () => path.join(app.getPath('userData'), 'backups');

// ---------------------------------------------------------------- IPC

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('backup:first', async (_e, json) => {
  const dir = backupsDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'original-keymap.akkod.json');
  if (fs.existsSync(file)) return { saved: false, path: file };
  fs.writeFileSync(file, String(json));
  return { saved: true, path: file };
});

ipcMain.handle('backup:open', async () => {
  fs.mkdirSync(backupsDir(), { recursive: true });
  return shell.openPath(backupsDir());
});

ipcMain.handle('file:save', async (_e, name, content) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Export profile',
    defaultPath: path.join(app.getPath('documents'), path.basename(String(name))),
    filters: [{ name: 'akkod profile', extensions: ['json'] }]
  });
  if (res.canceled || !res.filePath) return null;
  fs.writeFileSync(res.filePath, String(content));
  return { path: res.filePath };
});

ipcMain.handle('file:open', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Import profile',
    properties: ['openFile'],
    filters: [{ name: 'akkod profile', extensions: ['json'] }]
  });
  if (res.canceled || !res.filePaths[0]) return null;
  const stat = fs.statSync(res.filePaths[0]);
  if (stat.size > 2 * 1024 * 1024) throw new Error('File is too large to be a profile');
  return { content: fs.readFileSync(res.filePaths[0], 'utf8') };
});

function findHidraw() {
  try {
    for (const n of fs.readdirSync('/sys/class/hidraw')) {
      const base = `/sys/class/hidraw/${n}/device`;
      const ue = fs.readFileSync(`${base}/uevent`, 'utf8').toUpperCase();
      if (!ue.includes('0000FFFE:0000000B')) continue;
      const rd = fs.readFileSync(`${base}/report_descriptor`);
      if (rd[0] === 0x06 && rd[1] === 0x60 && rd[2] === 0xff) return `/dev/${n}`;
    }
  } catch {}
  return null;
}

function findUdevRule() {
  for (const dir of ['/etc/udev/rules.d', '/usr/lib/udev/rules.d', '/lib/udev/rules.d']) {
    try {
      for (const f of fs.readdirSync(dir)) {
        const text = fs.readFileSync(path.join(dir, f), 'utf8').toLowerCase();
        if (text.includes('fffe') && text.includes('000b')) return path.join(dir, f);
        if (text.includes('kernel=="hidraw*"') && text.includes('mode="0666"') && !text.includes('idvendor')) {
          return `${path.join(dir, f)} (opens all HID devices)`;
        }
      }
    } catch {}
  }
  return null;
}

ipcMain.handle('system:status', async () => {
  const status = { platform: process.platform, arch: os.arch() };
  if (process.platform === 'linux') {
    const hid = findHidraw();
    status.usbPresent = !!hid;
    status.hidrawPath = hid;
    status.udevRule = findUdevRule();
    if (hid) {
      try {
        fs.accessSync(hid, fs.constants.R_OK | fs.constants.W_OK);
        status.hidrawAccess = true;
      } catch {
        status.hidrawAccess = false;
      }
    } else {
      status.hidrawAccess = null;
    }
  }
  return status;
});

ipcMain.handle('system:installUdev', async () => {
  if (process.platform !== 'linux') return { ok: false, error: 'Only needed on Linux' };
  const script = `printf '%s\\n' '${UDEV_RULE}' > ${UDEV_RULE_PATH} && udevadm control --reload-rules && udevadm trigger --subsystem-match=hidraw`;
  return new Promise((resolve) => {
    execFile('pkexec', ['sh', '-c', script], { timeout: 120000 }, (err, _out, stderr) => {
      if (err) resolve({ ok: false, error: (stderr || err.message).trim() || 'Cancelled' });
      else resolve({ ok: true });
    });
  });
});

// ---------------------------------------------------------------- lifecycle

app.whenReady().then(() => {
  setupHidPermissions();
  createWindow();
  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
