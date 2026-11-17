// VIA protocol (v12) over a 32-byte raw HID transport.
//
// Safety: this module only implements reads, keymap/encoder writes, keymap
// reset to the firmware default, and lighting get/set/save. It deliberately
// has no EEPROM wipe (0x0A) and no bootloader jump (0x0B), and the transport
// guard below refuses to send those command ids even if asked to.

export const CMD = {
  GET_PROTOCOL_VERSION: 0x01,
  GET_KEYBOARD_VALUE: 0x02,
  DYNAMIC_KEYMAP_GET_KEYCODE: 0x04,
  DYNAMIC_KEYMAP_SET_KEYCODE: 0x05,
  DYNAMIC_KEYMAP_RESET: 0x06,
  CUSTOM_SET_VALUE: 0x07,
  CUSTOM_GET_VALUE: 0x08,
  CUSTOM_SAVE: 0x09,
  DYNAMIC_KEYMAP_MACRO_GET_COUNT: 0x0c,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE: 0x0d,
  DYNAMIC_KEYMAP_GET_LAYER_COUNT: 0x11,
  DYNAMIC_KEYMAP_GET_BUFFER: 0x12,
  DYNAMIC_KEYMAP_GET_ENCODER: 0x14,
  DYNAMIC_KEYMAP_SET_ENCODER: 0x15
};

const FORBIDDEN = new Set([0x0a /* eeprom reset */, 0x0b /* bootloader jump */]);

export const KB_VALUE = {
  UPTIME: 0x01,
  LAYOUT_OPTIONS: 0x02,
  SWITCH_MATRIX_STATE: 0x03,
  FIRMWARE_VERSION: 0x04
};

// qmk_rgb_matrix channel and value ids (match the 5075S VIA definition)
export const RGB = {
  CHANNEL: 3,
  BRIGHTNESS: 1,
  EFFECT: 2,
  SPEED: 3,
  COLOR: 4
};

export const PACKET = 32;

/**
 * A transport is `{ exchange(Uint8Array(32)) => Promise<Uint8Array(32)> }`.
 * Commands are serialised: one packet out, one reply in.
 */
export class Via {
  constructor(transport, { rows = 6, cols = 16 } = {}) {
    this.transport = transport;
    this.rows = rows;
    this.cols = cols;
    this.queue = Promise.resolve();
  }

  send(bytes) {
    const run = async () => {
      if (FORBIDDEN.has(bytes[0])) {
        throw new Error(`Refusing to send VIA command 0x${bytes[0].toString(16)}`);
      }
      const pkt = new Uint8Array(PACKET);
      pkt.set(bytes.slice(0, PACKET));
      const res = await this.transport.exchange(pkt);
      if (res[0] === 0xff) throw new Error(`Keyboard does not support command 0x${bytes[0].toString(16)}`);
      if (res[0] !== pkt[0]) throw new Error(`Unexpected reply 0x${res[0].toString(16)} to 0x${pkt[0].toString(16)}`);
      return res;
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }

  async getProtocolVersion() {
    const r = await this.send([CMD.GET_PROTOCOL_VERSION]);
    return (r[1] << 8) | r[2];
  }

  async getFirmwareVersion() {
    const r = await this.send([CMD.GET_KEYBOARD_VALUE, KB_VALUE.FIRMWARE_VERSION]);
    return ((r[2] << 24) | (r[3] << 16) | (r[4] << 8) | r[5]) >>> 0;
  }

  async getLayerCount() {
    const r = await this.send([CMD.DYNAMIC_KEYMAP_GET_LAYER_COUNT]);
    return r[1];
  }

  async getMacroCount() {
    const r = await this.send([CMD.DYNAMIC_KEYMAP_MACRO_GET_COUNT]);
    return r[1];
  }

  /** Returns keymap[layer][row][col] of 16-bit keycodes. */
  async readKeymap(layers) {
    const { rows, cols } = this;
    const size = layers * rows * cols * 2;
    const bytes = new Uint8Array(size);
    for (let off = 0; off < size; off += 28) {
      const n = Math.min(28, size - off);
      const r = await this.send([CMD.DYNAMIC_KEYMAP_GET_BUFFER, off >> 8, off & 0xff, n]);
      bytes.set(r.slice(4, 4 + n), off);
    }
    const km = [];
    for (let l = 0; l < layers; l++) {
      const layer = [];
      for (let row = 0; row < rows; row++) {
        const line = [];
        for (let col = 0; col < cols; col++) {
          const i = ((l * rows + row) * cols + col) * 2;
          line.push((bytes[i] << 8) | bytes[i + 1]);
        }
        layer.push(line);
      }
      km.push(layer);
    }
    return km;
  }

  async getKeycode(layer, row, col) {
    const r = await this.send([CMD.DYNAMIC_KEYMAP_GET_KEYCODE, layer, row, col]);
    return (r[4] << 8) | r[5];
  }

  async setKeycode(layer, row, col, keycode) {
    await this.send([CMD.DYNAMIC_KEYMAP_SET_KEYCODE, layer, row, col, keycode >> 8, keycode & 0xff]);
  }

  async resetKeymap() {
    await this.send([CMD.DYNAMIC_KEYMAP_RESET]);
  }

  async getEncoder(layer, id, clockwise) {
    const r = await this.send([CMD.DYNAMIC_KEYMAP_GET_ENCODER, layer, id, clockwise ? 1 : 0]);
    return (r[4] << 8) | r[5];
  }

  async setEncoder(layer, id, clockwise, keycode) {
    await this.send([CMD.DYNAMIC_KEYMAP_SET_ENCODER, layer, id, clockwise ? 1 : 0, keycode >> 8, keycode & 0xff]);
  }

  /** Bitmask rows: returns a Set of "row,col" strings currently pressed. */
  // Switch matrix state (VIA protocol 12 / QMK via.c): request is [0x02, 0x03, rowOffset],
  // reply echoes those three bytes and then carries each row big-endian from index 3.
  async getPressedKeys() {
    const bytesPerRow = Math.ceil(this.cols / 8);
    const rowsPerQuery = Math.floor(28 / bytesPerRow);
    const pressed = new Set();
    for (let offset = 0; offset < this.rows; offset += rowsPerQuery) {
      const r = await this.send([CMD.GET_KEYBOARD_VALUE, KB_VALUE.SWITCH_MATRIX_STATE, offset]);
      for (let i = 0; i < rowsPerQuery && offset + i < this.rows; i++) {
        let v = 0;
        for (let b = 0; b < bytesPerRow; b++) v = v * 256 + r[3 + i * bytesPerRow + b];
        for (let col = 0; col < this.cols; col++) {
          if (Math.floor(v / 2 ** col) % 2) pressed.add(`${offset + i},${col}`);
        }
      }
    }
    return pressed;
  }

  async getLighting() {
    const get = async (id) => (await this.send([CMD.CUSTOM_GET_VALUE, RGB.CHANNEL, id])).slice(3);
    const [b, e, s, c] = [await get(RGB.BRIGHTNESS), await get(RGB.EFFECT), await get(RGB.SPEED), await get(RGB.COLOR)];
    return { brightness: b[0], effect: e[0], speed: s[0], hue: c[0], sat: c[1] };
  }

  async setBrightness(v) {
    await this.send([CMD.CUSTOM_SET_VALUE, RGB.CHANNEL, RGB.BRIGHTNESS, v]);
  }
  async setEffect(v) {
    await this.send([CMD.CUSTOM_SET_VALUE, RGB.CHANNEL, RGB.EFFECT, v]);
  }
  async setSpeed(v) {
    await this.send([CMD.CUSTOM_SET_VALUE, RGB.CHANNEL, RGB.SPEED, v]);
  }
  async setColor(hue, sat) {
    await this.send([CMD.CUSTOM_SET_VALUE, RGB.CHANNEL, RGB.COLOR, hue, sat]);
  }
  /** Lighting set_value changes are live but volatile until saved to EEPROM. */
  async saveLighting() {
    await this.send([CMD.CUSTOM_SAVE, RGB.CHANNEL]);
  }
}
