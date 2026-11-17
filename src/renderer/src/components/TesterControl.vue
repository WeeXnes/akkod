<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import KeyboardView from './KeyboardView.vue';
import { kb, pressedKeys, simulatorPress } from '../lib/store.js';
import { legend } from '../lib/keycodes.js';
import { settings } from '../lib/settings.js';

const props = defineProps({ keys: { type: Array, required: true } });

const pressed = ref(new Set());
const seen = ref(new Set());
const supported = ref(true);
let timer = null;
let stopped = false;

async function poll() {
  if (stopped) return;
  try {
    const p = await pressedKeys();
    pressed.value = p;
    if (p.size) seen.value = new Set([...seen.value, ...p]);
  } catch {
    supported.value = false;
    return;
  }
  timer = setTimeout(poll, 30);
}

onMounted(poll);
onBeforeUnmount(() => {
  stopped = true;
  clearTimeout(timer);
});

const label = (k) => legend(kb.keymap[0]?.[k.row]?.[k.col] ?? 0, settings.legends);

// In the simulator, clicking a key "presses" it for a moment.
function onSelect(k) {
  if (!kb.simulator) return;
  const id = `${k.row},${k.col}`;
  simulatorPress(id, true);
  setTimeout(() => simulatorPress(id, false), 150);
}

// Keep typing in the app from triggering browser shortcuts while testing.
function swallow(e) {
  if (e.key === 'Tab' || e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
}
</script>

<template>
  <div class="tester" tabindex="0" @keydown="swallow">
    <div class="section-header">
      <div>
        <h2 class="section-title">Key tester</h2>
        <p class="section-desc">
          Press keys on the keyboard. This reads the switches directly, so it works for every key, including Fn and the knob press, whatever they are mapped to.
        </p>
      </div>
      <div class="stats">
        <span class="micro num">{{ seen.size }} / {{ props.keys.length }} tested</span>
        <button class="btn btn--secondary btn--small" @click="seen = new Set()">Clear</button>
      </div>
    </div>

    <div v-if="!supported" class="box empty">
      <span class="micro">This firmware does not report switch state.</span>
    </div>
    <div v-else class="box board">
      <KeyboardView :keys="keys" :label="label" :pressed="pressed" :seen="seen" @select="onSelect" />
    </div>
    <p class="hint">Labels show layer 0. Keys you have pressed stay outlined, so dead switches stand out.</p>
  </div>
</template>

<style scoped>
.tester {
  display: flex;
  flex-direction: column;
  gap: 24px;
  outline: none;
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
  max-width: 640px;
}

.stats {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.board {
  overflow-x: auto;
}

.empty {
  text-align: center;
  padding: 24px;
}

.hint {
  font-size: 13px;
  color: var(--text-3);
}
</style>
