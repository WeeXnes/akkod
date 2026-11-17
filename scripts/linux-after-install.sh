#!/bin/sh
# akkod package install hook.

# Command-line launcher
ln -sf /opt/akkod/akkod /usr/bin/akkod

# Chromium sandbox: use user namespaces if the kernel allows them, else the SUID helper.
if ! { [ -L /proc/self/ns/user ] && unshare --user true 2>/dev/null; }; then
  chmod 4755 /opt/akkod/chrome-sandbox || true
else
  chmod 0755 /opt/akkod/chrome-sandbox || true
fi

# Give the logged-in user access to the Akko 5075S raw HID interface (this keyboard only).
install -Dm644 /opt/akkod/resources/70-akko-5075s-via.rules /etc/udev/rules.d/70-akko-5075s-via.rules
udevadm control --reload-rules >/dev/null 2>&1 || true
udevadm trigger --subsystem-match=hidraw >/dev/null 2>&1 || true

update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor >/dev/null 2>&1 || true
