import { reactive, watch } from 'vue';

const KEY = 'akkod-settings';
const defaults = {
  isoEnter: true, // layout option group 0
  splitShift: true, // layout option group 1 (ISO left shift + extra key)
  legends: 'de', // 'us' | 'de' — display only
  simulator: false
};

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export const settings = reactive(load());

watch(
  settings,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {}
  },
  { deep: true }
);

export const layoutOptions = () => ({ 0: settings.isoEnter ? 1 : 0, 1: settings.splitShift ? 1 : 0 });

// Readable names for the effect ids in the 5075S definition.
export const EFFECTS = [
  { id: 0, name: 'Off', desc: 'Lighting off' },
  { id: 1, name: 'Solid', desc: 'One constant colour', color: true },
  { id: 2, name: 'Breathing', desc: 'Pulses one colour', color: true, speed: true },
  { id: 3, name: 'Cycle All', desc: 'Whole board cycles hue', speed: true },
  { id: 4, name: 'Cycle Left/Right', desc: 'Rainbow sweeps sideways', speed: true },
  { id: 5, name: 'Cycle Up/Down', desc: 'Rainbow sweeps vertically', speed: true },
  { id: 6, name: 'Rainbow Chevron', desc: 'Moving rainbow arrows', speed: true },
  { id: 7, name: 'Cycle Out/In', desc: 'Rainbow from the edges', speed: true },
  { id: 8, name: 'Cycle Out/In Dual', desc: 'Mirrored edge rainbow', speed: true },
  { id: 9, name: 'Pinwheel', desc: 'Rotating rainbow', speed: true },
  { id: 10, name: 'Spiral', desc: 'Spiralling rainbow', speed: true },
  { id: 11, name: 'Dual Beacon', desc: 'Two rotating beams', color: true, speed: true },
  { id: 12, name: 'Rainbow Beacon', desc: 'Rotating rainbow beam', speed: true },
  { id: 13, name: 'Raindrops', desc: 'Random keys change colour', color: true, speed: true },
  { id: 14, name: 'Typing Heatmap', desc: 'Keys warm up as you type', speed: true },
  { id: 15, name: 'Reactive Simple', desc: 'Pressed key lights up', color: true, speed: true },
  { id: 16, name: 'Reactive', desc: 'Pressed key fades back', color: true, speed: true },
  { id: 17, name: 'Reactive Cross', desc: 'Row and column light up', color: true, speed: true },
  { id: 18, name: 'Multisplash', desc: 'Colour splashes from keys', color: true, speed: true }
];
