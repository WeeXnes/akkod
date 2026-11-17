<script setup>
import { ref, computed } from 'vue';
import KeyboardView from './KeyboardView.vue';
import KeycodePicker from './KeycodePicker.vue';
import { kb, setKey, setEncoder, resetKeymap } from '../lib/store.js';
import { describe, legend } from '../lib/keycodes.js';
import { settings } from '../lib/settings.js';

const props = defineProps({ keys: { type: Array, required: true } });
const emit = defineEmits(['notify']);

// Names match how the stock firmware uses its six layers.
const LAYER_NAMES = ['Windows', 'Win · WASD arrows', 'Win · Fn', 'Mac', 'Mac · WASD arrows', 'Mac · Fn'];
const layer = ref(0);
const selected = ref(null); // { type: 'key', row, col } | { type: 'enc', dir: 'cw'|'ccw' }
const history = ref([]);

const selectedId = computed(() => (selected.value?.type === 'key' ? `${selected.value.row},${selected.value.col}` : ''));
const knobKey = computed(() => props.keys.find((k) => k.encoder !== null));

function codeAt(row, col) {
  return kb.keymap[layer.value]?.[row]?.[col] ?? 0;
}

const currentCode = computed(() => {
  const s = selected.value;
  if (!s) return null;
  if (s.type === 'key') return codeAt(s.row, s.col);
  return kb.encoders[layer.value]?.[s.dir] ?? null;
});

const selectedName = computed(() => {
  const s = selected.value;
  if (!s) return '';
  if (s.type === 'enc') return s.dir === 'cw' ? 'Knob · turn right' : 'Knob · turn left';
  if (knobKey.value && s.row === knobKey.value.row && s.col === knobKey.value.col) return 'Knob · press';
  return `Key ${s.row},${s.col}`;
});

const keyLabel = (k) => legend(codeAt(k.row, k.col), settings.legends);
const keyTitle = (k) => describe(codeAt(k.row, k.col)).title;
const keyDim = (k) => {
  const c = codeAt(k.row, k.col);
  return c === 0 || c === 1;
};

function select(k) {
  selected.value = { type: 'key', row: k.row, col: k.col };
}

const layerTarget = (code) => {
  if (code >= 0x5200 && code <= 0x52df) return code & 0x1f;
  if (code >= 0x4000 && code <= 0x4fff) return (code >> 8) & 0x0f;
  return null;
};

function wouldStrandLayer(oldCode) {
  const target = layerTarget(oldCode);
  if (target === null) return false;
  const holders = kb.keymap[layer.value].flat().filter((c) => layerTarget(c) === target);
  return holders.length <= 1;
}

async function assign(code, { record = true } = {}) {
  const s = selected.value;
  if (!s) return;
  const old = currentCode.value;
  if (old === code) return;
  if (s.type === 'key' && wouldStrandLayer(old)) {
    const ok = window.confirm(
      `This key is the only way to reach layer ${layerTarget(old)} (${describe(old).label}) from this layer.\n\n` +
        'If you replace it, use Undo or "Reset to default" in this app to get it back. Continue?'
    );
    if (!ok) return;
  }
  try {
    if (s.type === 'key') await setKey(layer.value, s.row, s.col, code);
    else await setEncoder(layer.value, s.dir, code);
    if (record) history.value.push({ layer: layer.value, sel: { ...s }, old });
    emit('notify', `${selectedName.value} → ${describe(code).title}`);
  } catch (err) {
    emit('notify', `Write failed: ${err.message}`);
  }
}

async function undo() {
  const last = history.value.pop();
  if (!last) return;
  layer.value = last.layer;
  selected.value = last.sel;
  await assign(last.old, { record: false });
}

async function doReset() {
  const ok = window.confirm(
    'Reset every layer and the knob to the keyboard firmware defaults?\n\nLighting is not affected. This cannot be undone with Undo, but you can re-apply a saved profile.'
  );
  if (!ok) return;
  try {
    await resetKeymap();
    history.value = [];
    emit('notify', 'Keymap reset to firmware defaults');
  } catch (err) {
    emit('notify', `Reset failed: ${err.message}`);
  }
}
</script>

<template>
  <div class="keymap">
    <div class="section-header">
      <div>
        <h2 class="section-title">Keymap</h2>
        <p class="section-desc">Pick a layer, click a key, then choose what it should do. Changes are written to the keyboard immediately.</p>
      </div>
      <div class="actions">
        <button class="btn btn--secondary btn--small" :disabled="!history.length || kb.busy" @click="undo">Undo</button>
        <button class="btn btn--danger btn--small" :disabled="kb.busy" @click="doReset">Reset to default</button>
      </div>
    </div>

    <div class="layers" role="tablist" aria-label="Layers">
      <button
        v-for="n in kb.layerCount"
        :key="n"
        class="layer"
        :class="{ active: layer === n - 1 }"
        role="tab"
        :aria-selected="layer === n - 1"
        @click="layer = n - 1"
      >
        <span class="layer__num num">{{ n - 1 }}</span>
        <span class="layer__name">{{ LAYER_NAMES[n - 1] || `Layer ${n - 1}` }}</span>
      </button>
    </div>

    <div class="board box">
      <div class="board__scroll">
        <KeyboardView
          :keys="keys"
          :label="keyLabel"
          :title="keyTitle"
          :dim="keyDim"
          :selected="selectedId"
          @select="select"
        />
      </div>
      <div class="knob">
        <span class="micro">Knob</span>
        <button
          class="btn btn--secondary btn--small"
          :class="{ active: selected?.type === 'enc' && selected.dir === 'ccw' }"
          @click="selected = { type: 'enc', dir: 'ccw' }"
        >
          ↺ {{ describe(kb.encoders[layer]?.ccw ?? 0).label }}
        </button>
        <button
          class="btn btn--secondary btn--small"
          :class="{ active: selectedId === `${knobKey?.row},${knobKey?.col}` }"
          @click="knobKey && select(knobKey)"
        >
          Press {{ knobKey ? describe(codeAt(knobKey.row, knobKey.col)).label : '' }}
        </button>
        <button
          class="btn btn--secondary btn--small"
          :class="{ active: selected?.type === 'enc' && selected.dir === 'cw' }"
          @click="selected = { type: 'enc', dir: 'cw' }"
        >
          ↻ {{ describe(kb.encoders[layer]?.cw ?? 0).label }}
        </button>
      </div>
    </div>

    <div class="assign">
      <div class="assign__head">
        <template v-if="selected">
          <span class="micro">{{ selectedName }} · Layer {{ layer }}</span>
          <span class="assign__current">
            Currently <strong>{{ describe(currentCode ?? 0).title }}</strong>
          </span>
        </template>
        <span v-else class="micro">Select a key or knob action above</span>
      </div>
      <KeycodePicker
        :layer-count="kb.layerCount"
        :current="currentCode"
        :disabled="!selected || kb.busy"
        @pick="assign"
      />
    </div>
  </div>
</template>

<style scoped>
.keymap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.actions {
  display: flex;
  gap: 8px;
}

.layers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.layer {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text-2);
  cursor: pointer;
  text-align: left;
  position: relative;
}

.layer:hover {
  background: var(--surface-2);
}

.layer.active {
  border-color: var(--line-strong);
  background: var(--surface-2);
  color: var(--text);
}

.layer.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
}

.layer__num {
  font-size: 18px;
  color: var(--text);
}

.layer__name {
  font-size: 13px;
}

.board {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.board__scroll {
  overflow-x: auto;
  padding: 4px 0;
}

.knob {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}

.knob .micro {
  margin-right: auto;
}

.assign {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assign__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  min-height: 24px;
}

.assign__current {
  font-size: 14px;
}

.assign__current strong {
  color: var(--text);
  font-weight: 500;
}
</style>
