// Read-only check of the real keyboard on Linux, using the app's own protocol code.
// Sends only "get" commands. Usage: node test/probe-hw.mjs
import fs from 'node:fs';
import defn from '../src/renderer/src/data/5075s.via.json' with { type: 'json' };
import { Via } from '../src/renderer/src/lib/via.js';
import { describe } from '../src/renderer/src/lib/keycodes.js';

function findHidraw() {
  for (const n of fs.readdirSync('/sys/class/hidraw')) {
    const base = `/sys/class/hidraw/${n}/device`;
    const ue = fs.readFileSync(`${base}/uevent`, 'utf8').toUpperCase();
    const rd = fs.readFileSync(`${base}/report_descriptor`);
    if (ue.includes('0000FFFE:0000000B') && rd[0] === 0x06 && rd[1] === 0x60 && rd[2] === 0xff) return `/dev/${n}`;
  }
  return null;
}

class HidrawTransport {
  constructor(path) {
    this.fd = fs.openSync(path, fs.constants.O_RDWR | fs.constants.O_NONBLOCK);
  }
  async exchange(pkt) {
    const out = Buffer.alloc(33);
    out.set(pkt, 1);
    fs.writeSync(this.fd, out);
    const buf = Buffer.alloc(64);
    const start = Date.now();
    while (Date.now() - start < 1000) {
      try {
        const n = fs.readSync(this.fd, buf);
        if (n > 0) return new Uint8Array(buf.subarray(0, 32));
      } catch (e) {
        if (e.code !== 'EAGAIN') throw e;
      }
      await new Promise((r) => setTimeout(r, 1));
    }
    throw new Error('timeout');
  }
}

const path = findHidraw();
if (!path) throw new Error('Akko 5075S VIA interface not found');
const via = new Via(new HidrawTransport(path), defn.matrix);
const t0 = performance.now();
console.log('device   ', path);
console.log('protocol ', await via.getProtocolVersion());
const layers = await via.getLayerCount();
console.log('layers   ', layers);
const km = await via.readKeymap(layers);
console.log('keymap read in', Math.round(performance.now() - t0), 'ms');
console.log('layer 0 row 5', km[0][5].map((c) => describe(c).label || '·').join(' | '));
console.log('knob L0  ', describe(await via.getEncoder(0, 0, true)).label, '/', describe(await via.getEncoder(0, 0, false)).label);
console.log('lighting ', await via.getLighting());
console.log('pressed  ', [...(await via.getPressedKeys())]);
