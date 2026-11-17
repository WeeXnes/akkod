// Offline checks: layout parsing, keycode naming, protocol against the simulator.
// Never touches the real keyboard.
import assert from 'node:assert/strict';
import defn from '../src/renderer/src/data/5075s.via.json' with { type: 'json' };
import { parseKle, resolveLayout, layoutSize, applyPhysicalSpacing } from '../src/renderer/src/lib/layout.js';
import { describe, pickerCategories, modded, modTap, layerTap } from '../src/renderer/src/lib/keycodes.js';
import { Via } from '../src/renderer/src/lib/via.js';
import { SimulatorTransport } from '../src/renderer/src/lib/simulator.js';

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log('ok -', name);
};

const raw = parseKle(defn.layouts.keymap);

await t('ISO + split shift layout has 84 keys incl. knob', () => {
  const keys = resolveLayout(raw, { 0: 1, 1: 1 });
  assert.equal(keys.length, 84);
  const knob = keys.find((k) => k.encoder === 0);
  assert.deepEqual([knob.row, knob.col], [0, 15]);
});

await t('ANSI layout has 83 keys and ANSI enter', () => {
  const keys = resolveLayout(raw, { 0: 0, 1: 0 });
  assert.equal(keys.length, 83);
  assert.ok(keys.find((k) => k.row === 2 && k.col === 13 && k.w === 1.5));
});

await t('ISO enter and # land where ANSI keys were', () => {
  const ansi = resolveLayout(raw, { 0: 0, 1: 0 });
  const iso = resolveLayout(raw, { 0: 1, 1: 1 });
  const bs = ansi.find((k) => k.row === 2 && k.col === 13);
  const enter = iso.find((k) => k.row === 3 && k.col === 13);
  const hash = iso.find((k) => k.row === 3 && k.col === 12);
  assert.equal(enter.y, bs.y);
  assert.equal(enter.h, 2);
  assert.equal(enter.x + enter.x2, bs.x);
  assert.equal(hash.y, bs.y + 1);
  const shift = iso.find((k) => k.row === 4 && k.col === 0);
  const nubs = iso.find((k) => k.row === 4 && k.col === 11);
  assert.equal(shift.w, 1.25);
  assert.equal(nubs.x, shift.x + 1.25);
  const { width, height } = layoutSize(iso);
  assert.equal(width, 16);
  assert.equal(height, 6);
});

await t('physical spacing matches the 5075S case', () => {
  const keys = applyPhysicalSpacing(resolveLayout(raw, { 0: 1, 1: 1 }));
  const at = (r, c) => keys.find((k) => k.row === r && k.col === c);
  assert.deepEqual([at(0, 1).x, at(0, 5).x, at(0, 9).x, at(0, 13).x, at(0, 15).x], [1.25, 5.5, 9.75, 14, 15.5]);
  assert.equal(at(1, 0).y, 1.25);
  assert.equal(at(1, 15).x, 15.5);
  assert.equal(at(4, 15).x, 15.5);
  assert.equal(at(1, 13).x + at(1, 13).w, 15);
  assert.deepEqual([at(4, 14).x, at(4, 14).y], [14.25, 4.5]);
  assert.equal(at(4, 13).x + at(4, 13).w, 14);
  assert.deepEqual([at(5, 13).x, at(5, 15).x, at(5, 15).y], [13.25, 15.25, 5.5]);
  const { width, height } = layoutSize(keys);
  assert.equal(width, 16.5);
  assert.equal(height, 6.5);
});

await t('keycode names', () => {
  assert.equal(describe(0x04).label, 'A');
  assert.equal(describe(0x5222).label, 'MO(2)');
  assert.equal(describe(0x5261).label, 'TG(1)');
  assert.equal(describe(0x7821).label, 'RGB Mode +');
  assert.equal(describe(0x700b).label, 'Win Lock');
  assert.equal(describe(modded(0x01, 0x06)).label, 'Ctrl+C');
  assert.equal(modded(0x01, 0x06), 0x0106);
  assert.equal(modTap(0x02, 0x04), 0x2204);
  assert.equal(layerTap(1, 0x2c), 0x412c);
  assert.equal(describe(0x7e40).label, 'User 0');
});

await t('picker never offers bootloader or EEPROM clear', () => {
  const codes = pickerCategories(6).flatMap((c) => c.keys.map((k) => k.code));
  assert.ok(!codes.includes(0x7c00));
  assert.ok(!codes.includes(0x7c03));
});

await t('protocol round-trip against simulator', async () => {
  const via = new Via(new SimulatorTransport(), defn.matrix);
  assert.equal(await via.getProtocolVersion(), 12);
  assert.equal(await via.getLayerCount(), 6);
  const km = await via.readKeymap(6);
  assert.equal(km[0][0][0], 0x29);
  assert.equal(km[0][5][10], 0x5222);
  await via.setKeycode(0, 3, 0, 0xe0);
  assert.equal(await via.getKeycode(0, 3, 0), 0xe0);
  assert.equal((await via.readKeymap(6))[0][3][0], 0xe0);
  assert.equal(await via.getEncoder(2, 0, true), 0x7e40);
  const l = await via.getLighting();
  assert.deepEqual(l, { brightness: 255, effect: 4, speed: 127, hue: 0, sat: 255 });
  await via.setColor(120, 200);
  assert.equal((await via.getLighting()).hue, 120);
});

await t('forbidden commands are refused', async () => {
  const via = new Via(new SimulatorTransport(), defn.matrix);
  await assert.rejects(() => via.send([0x0a]), /Refusing/);
  await assert.rejects(() => via.send([0x0b]), /Refusing/);
});

await t('matrix state decoding', async () => {
  const sim = new SimulatorTransport();
  const via = new Via(sim, defn.matrix);
  sim.pressed.add('3,12');
  sim.pressed.add('0,2');
  const p = await via.getPressedKeys();
  assert.deepEqual([...p].sort(), ['0,2', '3,12']);
});

await t('matrix wire format matches QMK via.c', async () => {
  // Hand-built firmware reply: [0x02, 0x03, offset, row0 hi, row0 lo, row1 hi, ...].
  let request;
  const fake = {
    async exchange(pkt) {
      request = [...pkt.slice(0, 3)];
      const out = new Uint8Array(32);
      out.set(pkt.slice(0, 3));
      out[3 + 0 * 2 + 1] = 0x04; // row 0, col 2
      out[3 + 3 * 2 + 0] = 0x10; // row 3, col 12
      out[3 + 5 * 2 + 0] = 0x80; // row 5, col 15
      out[3 + 5 * 2 + 1] = 0x01; // row 5, col 0
      return out;
    },
  };
  const p = await new Via(fake, { rows: 6, cols: 16 }).getPressedKeys();
  assert.deepEqual(request, [0x02, 0x03, 0x00]);
  assert.deepEqual([...p].sort(), ['0,2', '3,12', '5,0', '5,15']);
});

console.log(`\n${passed} checks passed`);
