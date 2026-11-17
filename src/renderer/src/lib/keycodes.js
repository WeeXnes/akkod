// QMK keycodes as used by VIA protocol 12 (QMK >= 0.19 numbering).

const basic = {};
const add = (code, id, label, title = label) => (basic[code] = { code, id, label, title });

add(0x0000, 'KC_NO', '', 'None');
add(0x0001, 'KC_TRNS', '▽', 'Transparent (use lower layer)');
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => add(0x04 + i, `KC_${c}`, c));
'1234567890'.split('').forEach((c, i) => add(0x1e + i, `KC_${c}`, c));
[
  [0x28, 'KC_ENT', 'Enter'],
  [0x29, 'KC_ESC', 'Esc'],
  [0x2a, 'KC_BSPC', 'Bksp', 'Backspace'],
  [0x2b, 'KC_TAB', 'Tab'],
  [0x2c, 'KC_SPC', 'Space'],
  [0x2d, 'KC_MINS', '-'],
  [0x2e, 'KC_EQL', '='],
  [0x2f, 'KC_LBRC', '['],
  [0x30, 'KC_RBRC', ']'],
  [0x31, 'KC_BSLS', '\\'],
  [0x32, 'KC_NUHS', '#', 'ISO # (non-US hash)'],
  [0x33, 'KC_SCLN', ';'],
  [0x34, 'KC_QUOT', "'"],
  [0x35, 'KC_GRV', '`'],
  [0x36, 'KC_COMM', ','],
  [0x37, 'KC_DOT', '.'],
  [0x38, 'KC_SLSH', '/'],
  [0x39, 'KC_CAPS', 'Caps', 'Caps Lock'],
  [0x46, 'KC_PSCR', 'PrtSc', 'Print Screen'],
  [0x47, 'KC_SCRL', 'ScrLk', 'Scroll Lock'],
  [0x48, 'KC_PAUS', 'Pause'],
  [0x49, 'KC_INS', 'Ins', 'Insert'],
  [0x4a, 'KC_HOME', 'Home'],
  [0x4b, 'KC_PGUP', 'PgUp', 'Page Up'],
  [0x4c, 'KC_DEL', 'Del', 'Delete'],
  [0x4d, 'KC_END', 'End'],
  [0x4e, 'KC_PGDN', 'PgDn', 'Page Down'],
  [0x4f, 'KC_RGHT', '→', 'Right'],
  [0x50, 'KC_LEFT', '←', 'Left'],
  [0x51, 'KC_DOWN', '↓', 'Down'],
  [0x52, 'KC_UP', '↑', 'Up'],
  [0x53, 'KC_NUM', 'NumLk', 'Num Lock'],
  [0x54, 'KC_PSLS', 'KP /'],
  [0x55, 'KC_PAST', 'KP *'],
  [0x56, 'KC_PMNS', 'KP -'],
  [0x57, 'KC_PPLS', 'KP +'],
  [0x58, 'KC_PENT', 'KP Ent', 'Keypad Enter'],
  [0x62, 'KC_P0', 'KP 0'],
  [0x63, 'KC_PDOT', 'KP .'],
  [0x64, 'KC_NUBS', '\\|', 'ISO \\ (non-US backslash)'],
  [0x65, 'KC_APP', 'Menu', 'Application / Menu'],
  [0x67, 'KC_PEQL', 'KP ='],
  [0x85, 'KC_PCMM', 'KP ,'],
  [0x87, 'KC_INT1', 'Ro', 'JIS Ro'],
  [0x88, 'KC_INT2', 'Kana', 'JIS Katakana/Hiragana'],
  [0x89, 'KC_INT3', '¥', 'JIS Yen'],
  [0x8a, 'KC_INT4', 'Henk', 'JIS Henkan'],
  [0x8b, 'KC_INT5', 'MHen', 'JIS Muhenkan'],
  [0x90, 'KC_LNG1', 'Lang1', 'Hangul / English'],
  [0x91, 'KC_LNG2', 'Lang2', 'Hanja'],
  [0xa5, 'KC_PWR', 'Power', 'System Power'],
  [0xa6, 'KC_SLEP', 'Sleep', 'System Sleep'],
  [0xa7, 'KC_WAKE', 'Wake', 'System Wake'],
  [0xa8, 'KC_MUTE', 'Mute'],
  [0xa9, 'KC_VOLU', 'Vol +', 'Volume Up'],
  [0xaa, 'KC_VOLD', 'Vol −', 'Volume Down'],
  [0xab, 'KC_MNXT', 'Next', 'Next Track'],
  [0xac, 'KC_MPRV', 'Prev', 'Previous Track'],
  [0xad, 'KC_MSTP', 'Stop', 'Stop Media'],
  [0xae, 'KC_MPLY', 'Play', 'Play / Pause'],
  [0xaf, 'KC_MSEL', 'Media', 'Media Select'],
  [0xb0, 'KC_EJCT', 'Eject'],
  [0xb1, 'KC_MAIL', 'Mail'],
  [0xb2, 'KC_CALC', 'Calc', 'Calculator'],
  [0xb3, 'KC_MYCM', 'My PC', 'My Computer / File Manager'],
  [0xb4, 'KC_WSCH', 'Search', 'Browser Search'],
  [0xb5, 'KC_WHOM', 'Home', 'Browser Home'],
  [0xb6, 'KC_WBAK', 'Back', 'Browser Back'],
  [0xb7, 'KC_WFWD', 'Fwd', 'Browser Forward'],
  [0xb8, 'KC_WSTP', 'WStop', 'Browser Stop'],
  [0xb9, 'KC_WREF', 'Reload', 'Browser Refresh'],
  [0xba, 'KC_WFAV', 'Fav', 'Browser Favorites'],
  [0xbb, 'KC_MFFD', 'FFwd', 'Fast Forward'],
  [0xbc, 'KC_MRWD', 'Rew', 'Rewind'],
  [0xbd, 'KC_BRIU', 'Bri +', 'Screen Brightness Up'],
  [0xbe, 'KC_BRID', 'Bri −', 'Screen Brightness Down'],
  [0xbf, 'KC_CPNL', 'Ctrl Pnl', 'Control Panel'],
  [0xc0, 'KC_ASST', 'Assist', 'Assistant'],
  [0xc1, 'KC_MCTL', 'MCtl', 'Mission Control (macOS)'],
  [0xc2, 'KC_LPAD', 'LPad', 'Launchpad (macOS)'],
  [0xcd, 'KC_MS_U', 'Mouse ↑', 'Mouse Up'],
  [0xce, 'KC_MS_D', 'Mouse ↓', 'Mouse Down'],
  [0xcf, 'KC_MS_L', 'Mouse ←', 'Mouse Left'],
  [0xd0, 'KC_MS_R', 'Mouse →', 'Mouse Right'],
  [0xd1, 'KC_BTN1', 'Click 1', 'Mouse Button 1'],
  [0xd2, 'KC_BTN2', 'Click 2', 'Mouse Button 2'],
  [0xd3, 'KC_BTN3', 'Click 3', 'Mouse Button 3'],
  [0xd4, 'KC_BTN4', 'Click 4', 'Mouse Button 4'],
  [0xd5, 'KC_BTN5', 'Click 5', 'Mouse Button 5'],
  [0xd9, 'KC_WH_U', 'Wheel ↑', 'Mouse Wheel Up'],
  [0xda, 'KC_WH_D', 'Wheel ↓', 'Mouse Wheel Down'],
  [0xdb, 'KC_WH_L', 'Wheel ←', 'Mouse Wheel Left'],
  [0xdc, 'KC_WH_R', 'Wheel →', 'Mouse Wheel Right'],
  [0xe0, 'KC_LCTL', 'Ctrl', 'Left Control'],
  [0xe1, 'KC_LSFT', 'Shift', 'Left Shift'],
  [0xe2, 'KC_LALT', 'Alt', 'Left Alt'],
  [0xe3, 'KC_LGUI', 'Win', 'Left Win / Cmd'],
  [0xe4, 'KC_RCTL', 'RCtrl', 'Right Control'],
  [0xe5, 'KC_RSFT', 'RShift', 'Right Shift'],
  [0xe6, 'KC_RALT', 'AltGr', 'Right Alt / AltGr'],
  [0xe7, 'KC_RGUI', 'RWin', 'Right Win / Cmd']
].forEach(([c, id, l, t]) => add(c, id, l, t));
for (let i = 1; i <= 12; i++) add(0x39 + i, `KC_F${i}`, `F${i}`);
for (let i = 13; i <= 24; i++) add(0x68 + i - 13, `KC_F${i}`, `F${i}`);
for (let i = 1; i <= 9; i++) add(0x58 + i, `KC_P${i}`, `KP ${i}`);

// Quantum / lighting / magic keycodes that have a fixed value.
const special = {};
const sp = (code, id, label, title = label) => (special[code] = { code, id, label, title });
sp(0x7820, 'RGB_TOG', 'RGB On/Off', 'Lighting on / off');
sp(0x7821, 'RGB_MOD', 'RGB Mode +', 'Next lighting effect');
sp(0x7822, 'RGB_RMOD', 'RGB Mode −', 'Previous lighting effect');
sp(0x7823, 'RGB_HUI', 'Hue +', 'Lighting hue up');
sp(0x7824, 'RGB_HUD', 'Hue −', 'Lighting hue down');
sp(0x7825, 'RGB_SAI', 'Sat +', 'Lighting saturation up');
sp(0x7826, 'RGB_SAD', 'Sat −', 'Lighting saturation down');
sp(0x7827, 'RGB_VAI', 'Bright +', 'Lighting brightness up');
sp(0x7828, 'RGB_VAD', 'Bright −', 'Lighting brightness down');
sp(0x7829, 'RGB_SPI', 'Speed +', 'Effect speed up');
sp(0x782a, 'RGB_SPD', 'Speed −', 'Effect speed down');
sp(0x7000, 'CL_SWAP', 'Swap Ctrl/Caps');
sp(0x7001, 'CL_NORM', 'Unswap Ctrl/Caps');
sp(0x7002, 'CL_TOGG', 'Toggle Ctrl/Caps');
sp(0x7005, 'AG_SWAP', 'Swap Alt/Win');
sp(0x7006, 'AG_NORM', 'Unswap Alt/Win');
sp(0x7009, 'GU_OFF', 'Win Lock On', 'Disable Win key');
sp(0x700a, 'GU_ON', 'Win Lock Off', 'Enable Win key');
sp(0x700b, 'GU_TOGG', 'Win Lock', 'Toggle Win key lock');
sp(0x7c16, 'QK_GESC', 'Esc `', 'Grave Escape');
sp(0x7c73, 'CW_TOGG', 'Caps Word', 'Caps Word toggle');
sp(0x7c00, 'QK_BOOT', 'Boot', 'Enter bootloader (not offered)');
sp(0x7c01, 'QK_RBT', 'Reboot', 'Reboot keyboard');
sp(0x7c03, 'EE_CLR', 'EE Clear', 'Clear EEPROM (not offered)');

const MOD_NAMES = { 0x01: 'Ctrl', 0x02: 'Shift', 0x04: 'Alt', 0x08: 'Win' };

export function modsLabel(mods) {
  const right = mods & 0x10 ? 'R' : '';
  return Object.entries(MOD_NAMES)
    .filter(([bit]) => mods & Number(bit))
    .map(([, n]) => right + n)
    .join('+');
}

const LAYER_FNS = [
  [0x5200, 'TO', 'Go to layer'],
  [0x5220, 'MO', 'Hold for layer'],
  [0x5240, 'DF', 'Set default layer'],
  [0x5260, 'TG', 'Toggle layer'],
  [0x5280, 'OSL', 'One-shot layer'],
  [0x52c0, 'TT', 'Tap-toggle layer']
];

/** Describe any 16-bit keycode: { label, title, kind } */
export function describe(code) {
  if (basic[code]) return { ...basic[code], kind: code === 1 ? 'trns' : 'basic' };
  if (special[code]) return { ...special[code], kind: 'special' };
  const hex = '0x' + code.toString(16).padStart(4, '0');
  if (code >= 0x0100 && code <= 0x1fff) {
    const inner = basic[code & 0xff]?.label ?? '?';
    const mods = modsLabel((code >> 8) & 0x1f);
    return { code, label: `${mods}+${inner}`, title: `${mods} + ${basic[code & 0xff]?.title ?? hex}`, kind: 'mods' };
  }
  if (code >= 0x2000 && code <= 0x3fff) {
    const mods = modsLabel((code >> 8) & 0x1f);
    const inner = basic[code & 0xff]?.label ?? '?';
    return { code, label: `${inner}\n${mods}`, title: `${inner} on tap, ${mods} on hold`, kind: 'modtap' };
  }
  if (code >= 0x4000 && code <= 0x4fff) {
    const layer = (code >> 8) & 0x0f;
    const inner = basic[code & 0xff]?.label ?? '?';
    return { code, label: `${inner}\nL${layer}`, title: `${inner} on tap, layer ${layer} on hold`, kind: 'layer' };
  }
  for (const [base, name, title] of LAYER_FNS) {
    if (code >= base && code < base + 0x20) {
      const n = code - base;
      return { code, label: `${name}(${n})`, title: `${title} ${n}`, kind: 'layer' };
    }
  }
  if (code >= 0x7700 && code <= 0x777f) {
    const n = code - 0x7700;
    return { code, label: `M${n}`, title: `Macro ${n}`, kind: 'macro' };
  }
  if (code >= 0x7e00 && code <= 0x7e3f) {
    const n = code - 0x7e00;
    return { code, label: `KB ${n}`, title: `Keyboard-specific function ${n} (Akko firmware)`, kind: 'custom' };
  }
  if (code >= 0x7e40 && code <= 0x7e7f) {
    const n = code - 0x7e40;
    return { code, label: `User ${n}`, title: `Firmware user function ${n} (Akko firmware)`, kind: 'custom' };
  }
  return { code, label: hex, title: `Unknown keycode ${hex}`, kind: 'unknown' };
}

const b = (...codes) => codes.map((c) => basic[c]);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => basic[from + i]);

/** Categories offered in the keycode picker. QK_BOOT and EE_CLR are left out on purpose. */
export function pickerCategories(layerCount = 6) {
  const layers = [];
  for (const [base, name, title] of LAYER_FNS) {
    for (let n = 0; n < layerCount; n++) {
      layers.push({ code: base + n, id: `${name}(${n})`, label: `${name}(${n})`, title: `${title} ${n}` });
    }
  }
  return [
    {
      id: 'basic',
      label: 'Basic',
      keys: [
        ...b(0x0000, 0x0001, 0x29),
        ...range(0x3a, 0x45),
        ...range(0x1e, 0x27),
        ...b(0x2d, 0x2e, 0x2a, 0x2b),
        ...range(0x04, 0x1d),
        ...b(0x2f, 0x30, 0x31, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x32, 0x64),
        ...b(0x39, 0x28, 0x2c),
        ...range(0xe0, 0xe7),
        ...b(0x65, 0x46, 0x47, 0x48, 0x49, 0x4c, 0x4a, 0x4d, 0x4b, 0x4e),
        ...b(0x52, 0x51, 0x50, 0x4f)
      ]
    },
    {
      id: 'media',
      label: 'Media',
      keys: [
        ...b(0xa8, 0xa9, 0xaa, 0xae, 0xad, 0xab, 0xac, 0xbb, 0xbc, 0xb0),
        ...b(0xbd, 0xbe, 0xb2, 0xb3, 0xb1, 0xb4, 0xb5, 0xb6, 0xb7, 0xb9, 0xba, 0xbf, 0xc0, 0xc1, 0xc2),
        ...b(0xa5, 0xa6, 0xa7)
      ]
    },
    {
      id: 'mouse',
      label: 'Mouse',
      keys: b(0xcd, 0xce, 0xcf, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd9, 0xda, 0xdb, 0xdc)
    },
    { id: 'layers', label: 'Layers', keys: layers },
    {
      id: 'lighting',
      label: 'Lighting',
      keys: [0x7820, 0x7821, 0x7822, 0x7827, 0x7828, 0x7829, 0x782a, 0x7823, 0x7824, 0x7825, 0x7826].map((c) => special[c])
    },
    {
      id: 'special',
      label: 'Special',
      keys: [
        ...[0x700b, 0x7009, 0x700a, 0x7c16, 0x7c73, 0x7002, 0x7005, 0x7006].map((c) => special[c]),
        { code: 0x7e40, id: 'USER0', label: 'User 0', title: 'Akko firmware function 0 (stock: knob, Fn layer)' },
        { code: 0x7e41, id: 'USER1', label: 'User 1', title: 'Akko firmware function 1 (stock: knob, Fn layer)' }
      ]
    },
    {
      id: 'numpad',
      label: 'Numpad / F13+',
      keys: [...b(0x53, 0x54, 0x55, 0x56, 0x57, 0x58), ...range(0x59, 0x63), ...b(0x67, 0x85), ...range(0x68, 0x73)]
    },
    {
      id: 'intl',
      label: 'International',
      keys: b(0x87, 0x88, 0x89, 0x8a, 0x8b, 0x90, 0x91)
    }
  ];
}

export const MOD_BITS = [
  { bit: 0x01, label: 'Ctrl' },
  { bit: 0x02, label: 'Shift' },
  { bit: 0x04, label: 'Alt' },
  { bit: 0x08, label: 'Win' }
];

export const modded = (mods, kc) => ((mods & 0x1f) << 8) | (kc & 0xff);
export const modTap = (mods, kc) => 0x2000 | ((mods & 0x1f) << 8) | (kc & 0xff);
export const layerTap = (layer, kc) => 0x4000 | ((layer & 0x0f) << 8) | (kc & 0xff);
export const isBasic = (code) => code <= 0xff;

// German (QWERTZ) legends for the same HID positions, for display only.
const DE = {
  0x1c: 'Z',
  0x1d: 'Y',
  0x2d: 'ß',
  0x2e: '´',
  0x2f: 'Ü',
  0x30: '+',
  0x31: '#',
  0x32: '#',
  0x33: 'Ö',
  0x34: 'Ä',
  0x35: '^',
  0x36: ',',
  0x37: '.',
  0x38: '-',
  0x64: '<',
  0xe3: 'Win',
  0xe6: 'AltGr'
};

export function legend(code, lang = 'us') {
  if (lang === 'de' && DE[code]) return DE[code];
  return describe(code).label;
}
