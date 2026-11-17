# akkod Windows installer

Built with [InstallerFramework](https://code.weexnes.dev/InstallerFramework) from the
[InstallerBase](https://code.weexnes.dev/InstallerFramework/InstallerBase) template.

The installer embeds `release/akkod-<version>-win.zip` and walks through: welcome, license notice, install folder
(default `%LOCALAPPDATA%\Programs\akkod`, no admin needed), desktop shortcut option, install, finish.

It also:
- closes a running akkod before replacing files,
- adds a Start menu shortcut and, if chosen, a desktop shortcut,
- registers akkod in **Apps & Features** with an uninstaller (`uninstall.ps1` in the install folder). The uninstaller
  removes only the files it installed, plus the shortcuts and the registry entry. Profiles and backups in
  `%APPDATA%\akkod` are kept.

## Build

```bash
./setup.sh   # once: clones InstallerFramework into lib/
./build.sh   # writes ../release/akkod-setup-<version>.exe
```

`REBUILD_APP=1 ./build.sh` rebuilds the Windows app zip first. On Windows, use `setup.ps1` and `build.ps1`.
