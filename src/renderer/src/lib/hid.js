// WebHID transport for the VIA raw-HID interface (usage page 0xFF60, usage 0x61).
// Works the same on Windows and Linux; Electron's main process grants access
// to the Akko 5075S so no permission prompt appears.

export const VENDOR_ID = 0xfffe;
export const PRODUCT_ID = 0x000b;
const USAGE_PAGE = 0xff60;
const USAGE = 0x61;

export const hidAvailable = () => typeof navigator !== 'undefined' && !!navigator.hid;

function isViaInterface(dev) {
  return (
    dev.vendorId === VENDOR_ID &&
    dev.productId === PRODUCT_ID &&
    dev.collections.some((c) => c.usagePage === USAGE_PAGE && c.usage === USAGE)
  );
}

export async function findDevice({ prompt = false } = {}) {
  if (!hidAvailable()) return null;
  let devices = await navigator.hid.getDevices();
  let dev = devices.find(isViaInterface);
  if (!dev && prompt) {
    devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: VENDOR_ID, productId: PRODUCT_ID, usagePage: USAGE_PAGE, usage: USAGE }]
    });
    dev = devices.find(isViaInterface);
  }
  return dev || null;
}

export function onHotplug(cb) {
  if (!hidAvailable()) return () => {};
  const handler = (e) => {
    if (isViaInterface(e.device)) cb(e.type);
  };
  navigator.hid.addEventListener('connect', handler);
  navigator.hid.addEventListener('disconnect', handler);
  return () => {
    navigator.hid.removeEventListener('connect', handler);
    navigator.hid.removeEventListener('disconnect', handler);
  };
}

export class WebHidTransport {
  constructor(device) {
    this.device = device;
    this.pending = null;
    this.onReport = (e) => {
      if (!this.pending) return;
      const { resolve, timer } = this.pending;
      this.pending = null;
      clearTimeout(timer);
      resolve(new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength).slice(0, 32));
    };
  }

  get name() {
    return this.device.productName || 'AKKO Keyboard';
  }

  async open() {
    if (!this.device.opened) await this.device.open();
    this.device.addEventListener('inputreport', this.onReport);
  }

  async close() {
    this.device.removeEventListener('inputreport', this.onReport);
    if (this.device.opened) await this.device.close();
  }

  async exchange(packet, attempt = 0) {
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending = null;
          reject(new Error('Keyboard did not answer'));
        }, 600);
        this.pending = { resolve, timer };
        this.device.sendReport(0, packet).catch((err) => {
          clearTimeout(timer);
          this.pending = null;
          reject(err);
        });
      });
    } catch (err) {
      // Only reads are retried; a lost reply to a write is re-sent too, which is
      // harmless because every VIA write sets an absolute value.
      if (attempt < 1) return this.exchange(packet, attempt + 1);
      throw err;
    }
  }
}
