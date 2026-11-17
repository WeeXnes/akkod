# akkod

Configuration tool for the **Akko 5075S (QMK / VIA)**: keymap, layers, knob, lighting and a key tester.
It runs on Linux and Windows, with the same look as [razerd](../razerd) (`DESIGN.md`).

It talks to the keyboard over the VIA raw-HID interface (usage page `0xFF60`), the same channel the VIA app uses.
No VIA, Python, drivers or OpenRazer are needed.

## Features

- **Keymap**: all 6 layers, click a key, pick from basic, media, mouse, layer, lighting and special keys.
  Combos cover modifier + key, tap-key/hold-modifier, and tap-key/hold-layer. Changes are written straight to the
  keyboard's memory. Undo, and reset to firmware defaults.
- **Knob**: turn left, turn right and press, per layer.
- **Lighting**: the 19 effects of the stock firmware, brightness, speed, hue and saturation. Changes preview live and are
  saved to the keyboard when you let go of a slider.
- **Key tester**: reads the switch matrix directly, so it shows every switch whatever it is mapped to.
- **Profiles**: save, apply, export and import the full setup as JSON. The first time the app connects, it saves the
  keymap it found to `backups/original-keymap.akkod.json` in the app's data folder.
- **Health**: on Linux it checks the udev rule and hidraw permissions, and can install the rule (asks for your password).
- **Simulator**: a virtual 5075S, so you can try everything without touching the keyboard.
- Display options: ISO/ANSI Enter, split left Shift, and US or German key legends.

## Safety

The app only sends VIA read commands, keymap and knob writes, the firmware's own "reset keymap", and lighting
get/set/save. The protocol layer refuses the EEPROM-wipe (`0x0A`) and bootloader (`0x0B`) commands, and the key picker
never offers `QK_BOOT` or `EE_CLR`. Replacing the only key that reaches a layer asks for confirmation first.

## Install

### Arch Linux

```bash
sudo pacman -U release/akkod-1.0.0.pacman
```

The package installs the app to `/opt/akkod`, puts a launcher in the app menu, and installs
`/etc/udev/rules.d/70-akko-5075s-via.rules`. That rule gives the logged-in user access to this one keyboard.
Removing the package also removes the rule.

### Other Linux

Run `release/akkod-1.0.0.AppImage`. Then open **Health → Install rule** once, or install the rule by hand:

```bash
sudo install -Dm644 scripts/70-akko-5075s-via.rules /etc/udev/rules.d/70-akko-5075s-via.rules && sudo udevadm control --reload-rules && sudo udevadm trigger --subsystem-match=hidraw
```

### Windows

Run `release/akkod-setup-1.0.0.exe`. It installs to `%LOCALAPPDATA%\Programs\akkod` by default (no admin needed),
adds Start menu and optional desktop shortcuts, and registers an uninstaller in **Apps & Features**. No driver is needed.
The installer is not code-signed, so SmartScreen asks once ("More info → Run anyway").

`release/akkod-1.0.0-win.zip` is the same app as a portable zip.

## Development

```bash
npm install
npm test              # offline checks: layout, keycodes, protocol against the simulator
npm run probe         # Linux: read-only check against the real keyboard
npm run build && npm start
npm run dist:linux    # AppImage + pacman + deb into release/
npm run dist:win      # Windows installer (InstallerFramework, see installer/README.md)
npm run dist:win-zip  # portable Windows zip
```

Layout: `src/renderer/src/lib/via.js` (protocol), `hid.js` (WebHID transport), `layout.js` (VIA layout and the 5075S
case spacing), `keycodes.js` (QMK keycodes, protocol 12 numbering), `store.js` (keyboard state). The Electron main process
(`src/main/main.js`) only grants WebHID access to `FFFE:000B` and handles files and the udev rule.

## License

GPL-3.0-or-later.
