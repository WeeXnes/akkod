<script setup>
import { computed, ref } from 'vue';
import { kb, setLighting } from '../lib/store.js';
import { EFFECTS } from '../lib/settings.js';

const emit = defineEmits(['notify']);

const L = computed(() => kb.lighting);
const effect = computed(() => EFFECTS.find((e) => e.id === L.value.effect) || { id: L.value.effect, name: `Effect ${L.value.effect}` });
const pct = (v) => Math.round((v / 255) * 100);
const lastOn = ref(L.value.brightness || 255);

// QMK hue/sat are 0–255. Preview converts to CSS hsl at full value.
function hsvToHex(h, s, v = 255) {
  const H = (h / 255) * 6;
  const S = s / 255;
  const V = v / 255;
  const i = Math.floor(H) % 6;
  const f = H - Math.floor(H);
  const p = V * (1 - S);
  const q = V * (1 - f * S);
  const t = V * (1 - (1 - f) * S);
  const [r, g, b] = [
    [V, t, p],
    [q, V, p],
    [p, V, t],
    [p, q, V],
    [t, p, V],
    [V, p, q]
  ][i];
  return '#' + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function hexToHs(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(((h < 0 ? h + 6 : h) / 6) * 255);
  const s = max ? Math.round((d / max) * 255) : 0;
  return { hue: h, sat: s };
}

const colorHex = computed(() => hsvToHex(L.value.hue, L.value.sat));

const swatches = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#ff0000' },
  { name: 'Orange', hex: '#ff6a00' },
  { name: 'Amber', hex: '#ffbf00' },
  { name: 'Green', hex: '#00ff40' },
  { name: 'Cyan', hex: '#00ffff' },
  { name: 'Blue', hex: '#0040ff' },
  { name: 'Violet', hex: '#8000ff' },
  { name: 'Pink', hex: '#ff00aa' }
];

function pickEffect(e) {
  const patch = { effect: e.id };
  if (e.id !== 0 && L.value.brightness === 0) patch.brightness = lastOn.value || 255;
  setLighting(patch, true);
  emit('notify', `Lighting: ${e.name}`);
}

function setHex(hex, commit) {
  const hs = hexToHs(hex);
  if (hs) setLighting(hs, commit);
}

function brightness(v, commit) {
  const n = Number(v);
  if (n > 0) lastOn.value = n;
  setLighting({ brightness: n }, commit);
}

function toggleOff() {
  if (L.value.brightness === 0) brightness(lastOn.value || 255, true);
  else {
    lastOn.value = L.value.brightness;
    brightness(0, true);
  }
}
</script>

<template>
  <div class="lighting-control">
    <div class="section-header">
      <div>
        <h2 class="section-title">Lighting</h2>
        <p class="section-desc">Effects, brightness, speed and colour. Changes preview live and are saved to the keyboard when you let go.</p>
      </div>
    </div>

    <div class="box brightness-box">
      <div class="brightness-header">
        <div class="bright-left">
          <span class="micro">Brightness</span>
          <span class="micro num">{{ pct(L.brightness) }}%</span>
        </div>
        <div class="bright-actions">
          <button v-if="L.brightness < 255" class="btn btn--secondary btn--small" @click="brightness(255, true)">
            <span class="micro">100%</span>
          </button>
          <button class="btn btn--secondary btn--small" @click="toggleOff">
            <span class="micro">{{ L.brightness === 0 ? 'On' : 'Off' }}</span>
          </button>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="255"
        :value="L.brightness"
        aria-label="Brightness"
        @input="brightness($event.target.value, false)"
        @change="brightness($event.target.value, true)"
      />
    </div>

    <div class="effects-section">
      <div class="effects-header">
        <span class="micro">Effect</span>
        <span class="micro">{{ effect.name }}</span>
      </div>
      <div class="effects-grid">
        <button
          v-for="e in EFFECTS"
          :key="e.id"
          class="effect-card"
          :class="{ 'effect-card--active': L.effect === e.id }"
          :aria-pressed="L.effect === e.id"
          @click="pickEffect(e)"
        >
          <span class="effect-top">
            <span class="effect-name">{{ e.name }}</span>
            <span class="select-dot" :class="{ 'select-dot--active': L.effect === e.id }"></span>
          </span>
          <span class="effect-desc micro">{{ e.desc }}</span>
        </button>
      </div>
    </div>

    <div v-if="effect.id !== 0" class="box params-box">
      <div v-if="effect.speed" class="param">
        <div class="param__head">
          <span class="micro">Effect speed</span>
          <span class="micro num">{{ pct(L.speed) }}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="255"
          :value="L.speed"
          aria-label="Effect speed"
          @input="setLighting({ speed: Number($event.target.value) }, false)"
          @change="setLighting({ speed: Number($event.target.value) }, true)"
        />
      </div>

      <div class="param">
        <div class="param__head">
          <span class="micro">Colour{{ effect.color ? '' : ' (used by colour effects only)' }}</span>
          <div class="color-inputs">
            <input
              type="color"
              class="color-picker-input"
              :value="colorHex"
              aria-label="Pick colour"
              @input="setHex($event.target.value, false)"
              @change="setHex($event.target.value, true)"
            />
            <input
              type="text"
              class="input input-num color-text-input"
              :value="colorHex"
              aria-label="Colour hex"
              @change="setHex($event.target.value, true)"
            />
          </div>
        </div>

        <div class="slider-row">
          <span class="micro slider-label">Hue</span>
          <input
            type="range"
            class="hue-range"
            min="0"
            max="255"
            :value="L.hue"
            aria-label="Hue"
            @input="setLighting({ hue: Number($event.target.value) }, false)"
            @change="setLighting({ hue: Number($event.target.value) }, true)"
          />
          <span class="micro num slider-val">{{ Math.round((L.hue / 255) * 360) }}°</span>
        </div>
        <div class="slider-row">
          <span class="micro slider-label">Saturation</span>
          <input
            type="range"
            min="0"
            max="255"
            :value="L.sat"
            aria-label="Saturation"
            @input="setLighting({ sat: Number($event.target.value) }, false)"
            @change="setLighting({ sat: Number($event.target.value) }, true)"
          />
          <span class="micro num slider-val">{{ pct(L.sat) }}%</span>
        </div>

        <div class="swatches-row">
          <button
            v-for="s in swatches"
            :key="s.hex"
            class="swatch-btn"
            :style="{ backgroundColor: s.hex }"
            :title="s.name"
            :aria-label="s.name"
            @click="setHex(s.hex, true)"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lighting-control {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text);
  margin-bottom: 4px;
}

.section-desc {
  font-size: 14px;
  color: var(--text-2);
}

.brightness-header,
.effects-header,
.param__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bright-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bright-actions {
  display: flex;
  gap: 8px;
}

.effects-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
}

.effect-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  color: inherit;
}

.effect-card:hover {
  background: var(--surface-2);
}

.effect-card--active {
  border-color: var(--line-strong);
  background: var(--surface-2);
}

.effect-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.effect-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.effect-desc {
  font-size: 11px;
  text-transform: none;
  letter-spacing: 0.02em;
}

.select-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
}

.select-dot--active {
  border-color: var(--text);
  background: var(--text);
  box-shadow: inset 0 0 0 2px var(--bg);
}

.params-box {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.param + .param {
  border-top: 1px solid var(--line);
  padding-top: 20px;
}

.color-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
}

.color-picker-input {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.color-text-input {
  width: 100px;
  height: 32px;
  font-size: 12px;
  text-align: center;
}

.slider-row {
  display: grid;
  grid-template-columns: 100px 1fr 48px;
  align-items: center;
  gap: 12px;
}

.slider-val {
  text-align: right;
}

/* The hue track is the one place a colour gradient carries meaning. */
.hue-range {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}

.swatches-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.swatch-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  cursor: pointer;
}

.swatch-btn:hover {
  opacity: 0.85;
}
</style>
