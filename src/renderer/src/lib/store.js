import { reactive } from 'vue';
import { Via } from './via.js';
import { WebHidTransport, findDevice, onHotplug, hidAvailable } from './hid.js';
import { SimulatorTransport } from './simulator.js';
import definition from '../data/5075s.via.json' with { type: 'json' };

const ENCODER_ID = 0;
const api = typeof window !== 'undefined' ? window.akkod : undefined;

export const kb = reactive({
  status: 'disconnected', // disconnected | connecting | connected | error
  simulator: false,
  error: '',
  name: '',
  protocol: 0,
  firmware: 0,
  layerCount: 0,
  macroCount: 0,
  keymap: [],
  encoders: [],
  lighting: { brightness: 0, effect: 0, speed: 0, hue: 0, sat: 0 },
  busy: false,
  lastWrite: 0
});

export const defn = definition;

let via = null;
let transport = null;

function setError(err) {
  kb.status = 'error';
  kb.error = err?.message || String(err);
}

export async function connect({ prompt = false, simulator = kb.simulator } = {}) {
  await disconnect();
  kb.simulator = simulator;
  kb.status = 'connecting';
  kb.error = '';
  try {
    if (simulator) {
      transport = new SimulatorTransport();
    } else {
      if (!hidAvailable()) throw new Error('WebHID is not available in this window');
      const dev = await findDevice({ prompt });
      if (!dev) {
        kb.status = 'disconnected';
        return false;
      }
      transport = new WebHidTransport(dev);
    }
    await transport.open();
    via = new Via(transport, definition.matrix);
    kb.name = transport.name;
    kb.protocol = await via.getProtocolVersion();
    if (kb.protocol < 9) throw new Error(`VIA protocol ${kb.protocol} is too old for this app`);
    kb.firmware = await via.getFirmwareVersion().catch(() => 0);
    kb.layerCount = await via.getLayerCount();
    kb.macroCount = await via.getMacroCount().catch(() => 0);
    await readAll();
    kb.status = 'connected';
    if (!simulator) backupOnce();
    return true;
  } catch (err) {
    setError(err);
    return false;
  }
}

export async function disconnect() {
  if (transport) {
    try {
      await transport.close();
    } catch {}
  }
  transport = null;
  via = null;
  kb.status = 'disconnected';
}

export async function readAll() {
  kb.keymap = await via.readKeymap(kb.layerCount);
  const enc = [];
  for (let l = 0; l < kb.layerCount; l++) {
    enc.push({ cw: await via.getEncoder(l, ENCODER_ID, true), ccw: await via.getEncoder(l, ENCODER_ID, false) });
  }
  kb.encoders = enc;
  kb.lighting = await via.getLighting();
}

async function write(fn) {
  if (!via) throw new Error('Keyboard not connected');
  kb.busy = true;
  try {
    await fn();
    kb.lastWrite = Date.now();
  } catch (err) {
    kb.error = err.message;
    throw err;
  } finally {
    kb.busy = false;
  }
}

export async function setKey(layer, row, col, code) {
  if (kb.keymap[layer][row][col] === code) return;
  await write(async () => {
    await via.setKeycode(layer, row, col, code);
    kb.keymap[layer][row][col] = await via.getKeycode(layer, row, col);
  });
}

export async function setEncoder(layer, dir, code) {
  if (kb.encoders[layer][dir] === code) return;
  await write(async () => {
    await via.setEncoder(layer, ENCODER_ID, dir === 'cw', code);
    kb.encoders[layer][dir] = await via.getEncoder(layer, ENCODER_ID, dir === 'cw');
  });
}

/** Resets keymap and knob to the firmware's built-in defaults. */
export async function resetKeymap() {
  await write(async () => {
    await via.resetKeymap();
    await readAll();
  });
}

// Lighting: live preview while dragging (latest value wins), save on commit.
let lightPending = null;
let lightRunning = false;

async function flushLighting() {
  if (lightRunning) return;
  lightRunning = true;
  try {
    while (lightPending) {
      const { patch, commit } = lightPending;
      lightPending = null;
      if ('brightness' in patch) await via.setBrightness(patch.brightness);
      if ('effect' in patch) await via.setEffect(patch.effect);
      if ('speed' in patch) await via.setSpeed(patch.speed);
      if ('hue' in patch || 'sat' in patch) await via.setColor(kb.lighting.hue, kb.lighting.sat);
      if (commit) await via.saveLighting();
      kb.lastWrite = Date.now();
    }
  } catch (err) {
    kb.error = err.message;
  } finally {
    lightRunning = false;
  }
}

export function setLighting(patch, commit = true) {
  if (!via) return;
  Object.assign(kb.lighting, patch);
  const prev = lightPending;
  lightPending = {
    patch: { ...(prev?.patch || {}), ...patch },
    commit: commit || prev?.commit || false
  };
  flushLighting();
}

export async function pressedKeys() {
  if (!via) return new Set();
  return via.getPressedKeys();
}

export function simulatorPress(key, down) {
  if (transport instanceof SimulatorTransport) {
    if (down) transport.pressed.add(key);
    else transport.pressed.delete(key);
  }
}

// Profiles -----------------------------------------------------------------

export function snapshot(name) {
  return {
    app: 'akkod',
    version: 1,
    device: { vendorId: definition.vendorId, productId: definition.productId, name: definition.name },
    name,
    createdAt: new Date().toISOString(),
    keymap: JSON.parse(JSON.stringify(kb.keymap)),
    encoders: JSON.parse(JSON.stringify(kb.encoders)),
    lighting: { ...kb.lighting }
  };
}

export function validateSnapshot(s) {
  const { rows, cols } = definition.matrix;
  if (!s || s.app !== 'akkod' || !Array.isArray(s.keymap)) return 'Not an akkod profile';
  if (s.keymap.length !== kb.layerCount) return `Profile has ${s.keymap.length} layers, keyboard has ${kb.layerCount}`;
  for (const layer of s.keymap) {
    if (layer.length !== rows || layer.some((r) => r.length !== cols)) return 'Profile matrix size does not match';
    if (layer.flat().some((c) => !Number.isInteger(c) || c < 0 || c > 0xffff)) return 'Profile has invalid keycodes';
    if (layer.flat().some((c) => c === 0x7c00 || c === 0x7c03)) return 'Profile contains bootloader / EEPROM-clear keys';
  }
  return null;
}

/** Writes only the keys that differ. Returns the number of writes. */
export async function applySnapshot(s, onProgress = () => {}) {
  const problem = validateSnapshot(s);
  if (problem) throw new Error(problem);
  const jobs = [];
  s.keymap.forEach((layer, l) =>
    layer.forEach((row, r) =>
      row.forEach((code, c) => {
        if (kb.keymap[l][r][c] !== code) jobs.push(() => via.setKeycode(l, r, c, code));
      })
    )
  );
  (s.encoders || []).forEach((e, l) => {
    if (l >= kb.layerCount) return;
    for (const dir of ['cw', 'ccw']) {
      if (Number.isInteger(e[dir]) && kb.encoders[l][dir] !== e[dir]) {
        jobs.push(() => via.setEncoder(l, ENCODER_ID, dir === 'cw', e[dir]));
      }
    }
  });
  await write(async () => {
    for (let i = 0; i < jobs.length; i++) {
      await jobs[i]();
      onProgress(i + 1, jobs.length);
    }
    if (s.lighting) {
      const L = s.lighting;
      await via.setEffect(L.effect);
      await via.setBrightness(L.brightness);
      await via.setSpeed(L.speed);
      await via.setColor(L.hue, L.sat);
      await via.saveLighting();
    }
    await readAll();
  });
  return jobs.length;
}

async function backupOnce() {
  try {
    await api?.saveFirstBackup?.(JSON.stringify(snapshot('Original keymap (automatic backup)'), null, 2));
  } catch {}
}

let unhook = null;
export function watchHotplug() {
  unhook?.();
  unhook = onHotplug((type) => {
    if (kb.simulator) return;
    if (type === 'disconnect') {
      transport = null;
      via = null;
      kb.status = 'disconnected';
    } else if (kb.status !== 'connected') {
      setTimeout(() => connect(), 300);
    }
  });
}
