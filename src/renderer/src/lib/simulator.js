// In-memory emulation of the 5075S VIA firmware, for trying the app without
// touching the real keyboard. Speaks the same 32-byte protocol as the device.
import stock from '../data/stock-keymap.json' with { type: 'json' };
import { CMD, KB_VALUE, RGB } from './via.js';

export class SimulatorTransport {
  constructor() {
    this.name = 'AKKO 5075S (Simulator)';
    this.layers = structuredClone(stock.layers);
    this.encoders = structuredClone(stock.encoders);
    this.rgb = { 1: [255], 2: [4], 3: [127], 4: [0, 255] };
    this.pressed = new Set();
  }

  async open() {}
  async close() {}

  async exchange(pkt) {
    const out = new Uint8Array(32);
    out.set(pkt);
    const flat = () => this.layers.flat(2);
    switch (pkt[0]) {
      case CMD.GET_PROTOCOL_VERSION:
        out[1] = 0;
        out[2] = 12;
        break;
      case CMD.GET_KEYBOARD_VALUE:
        if (pkt[1] === KB_VALUE.SWITCH_MATRIX_STATE) {
          for (const k of this.pressed) {
            const [r, c] = k.split(',').map(Number);
            const i = 2 + r * 2 + (c >= 8 ? 0 : 1);
            out[i] |= 1 << (c % 8);
          }
        }
        break;
      case CMD.DYNAMIC_KEYMAP_GET_LAYER_COUNT:
        out[1] = this.layers.length;
        break;
      case CMD.DYNAMIC_KEYMAP_MACRO_GET_COUNT:
        out[1] = 16;
        break;
      case CMD.DYNAMIC_KEYMAP_GET_BUFFER: {
        const off = (pkt[1] << 8) | pkt[2];
        const all = flat();
        for (let i = 0; i < pkt[3]; i++) {
          const kc = all[(off + i) >> 1] ?? 0;
          out[4 + i] = (off + i) % 2 === 0 ? kc >> 8 : kc & 0xff;
        }
        break;
      }
      case CMD.DYNAMIC_KEYMAP_GET_KEYCODE: {
        const kc = this.layers[pkt[1]][pkt[2]][pkt[3]];
        out[4] = kc >> 8;
        out[5] = kc & 0xff;
        break;
      }
      case CMD.DYNAMIC_KEYMAP_SET_KEYCODE:
        this.layers[pkt[1]][pkt[2]][pkt[3]] = (pkt[4] << 8) | pkt[5];
        break;
      case CMD.DYNAMIC_KEYMAP_RESET:
        this.layers = structuredClone(stock.layers);
        this.encoders = structuredClone(stock.encoders);
        break;
      case CMD.DYNAMIC_KEYMAP_GET_ENCODER: {
        const kc = this.encoders[pkt[1]][pkt[2]][pkt[3] ? 'cw' : 'ccw'];
        out[4] = kc >> 8;
        out[5] = kc & 0xff;
        break;
      }
      case CMD.DYNAMIC_KEYMAP_SET_ENCODER:
        this.encoders[pkt[1]][pkt[2]][pkt[3] ? 'cw' : 'ccw'] = (pkt[4] << 8) | pkt[5];
        break;
      case CMD.CUSTOM_GET_VALUE:
        if (pkt[1] === RGB.CHANNEL) out.set(this.rgb[pkt[2]] || [0], 3);
        break;
      case CMD.CUSTOM_SET_VALUE:
        if (pkt[1] === RGB.CHANNEL) this.rgb[pkt[2]] = Array.from(pkt.slice(3, pkt[2] === RGB.COLOR ? 5 : 4));
        break;
      case CMD.CUSTOM_SAVE:
        break;
      default:
        out[0] = 0xff;
    }
    await new Promise((r) => setTimeout(r, 2));
    return out;
  }
}
