#!/bin/sh
# akkod package removal hook.
rm -f /usr/bin/akkod
rm -f /etc/udev/rules.d/70-akko-5075s-via.rules
udevadm control --reload-rules >/dev/null 2>&1 || true
update-desktop-database /usr/share/applications >/dev/null 2>&1 || true
