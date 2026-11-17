<script setup>
import { computed } from 'vue';
import { layoutSize } from '../lib/layout.js';

const props = defineProps({
  keys: { type: Array, required: true },
  label: { type: Function, required: true }, // (key) => string
  title: { type: Function, default: () => '' },
  selected: { type: String, default: '' }, // "row,col"
  pressed: { type: Object, default: () => new Set() },
  seen: { type: Object, default: () => new Set() },
  dim: { type: Function, default: () => false },
  unit: { type: Number, default: 54 }
});

const emit = defineEmits(['select']);

const size = computed(() => layoutSize(props.keys));
const gap = 4;

function rect(x, y, w, h) {
  const u = props.unit;
  return {
    left: `${x * u + gap / 2}px`,
    top: `${y * u + gap / 2}px`,
    width: `${w * u - gap}px`,
    height: `${h * u - gap}px`
  };
}

const id = (k) => `${k.row},${k.col}`;
const isIsoEnter = (k) => k.h === 2 && k.w2 !== k.w;

// ISO enter: the wide top piece is drawn in full; the stem covers only the
// lower row and reaches up over the top piece's bottom border, leaving the
// ledge on the left. Together they read as one L-shaped key.
function stemRect(k) {
  const r = rect(k.x, k.y + 1, k.w, k.h - 1);
  const u = props.unit;
  return { ...r, top: `${(k.y + 1) * u - gap / 2 - 1}px`, height: `${(k.h - 1) * u - gap / 2 + 1}px` };
}
</script>

<template>
  <div
    class="kbd"
    :style="{ width: `${size.width * unit}px`, height: `${size.height * unit}px` }"
    role="grid"
    aria-label="Keyboard layout"
  >
    <template v-for="k in keys" :key="`${id(k)}-${k.group}-${k.option}`">
      <div
        v-if="isIsoEnter(k)"
        class="key key--ghost"
        :class="{
          'key--selected': selected === id(k),
          'key--pressed': pressed.has(id(k)),
          'key--seen': seen.has(id(k))
        }"
        :style="rect(k.x + k.x2, k.y + k.y2, k.w2, k.h2)"
        aria-hidden="true"
        @click="emit('select', k)"
      ></div>
      <button
        class="key"
        :class="{
          'key--knob': k.encoder !== null,
          'key--selected': selected === id(k),
          'key--pressed': pressed.has(id(k)),
          'key--seen': seen.has(id(k)),
          'key--dim': dim(k),
          'key--iso': isIsoEnter(k)
        }"
        :data-key="id(k)"
        :style="isIsoEnter(k) ? stemRect(k) : rect(k.x, k.y, k.w, k.h)"
        :title="title(k)"
        @click="emit('select', k)"
      >
        <span class="key__label">{{ label(k) }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.kbd {
  position: relative;
  margin: 0 auto;
}

.key {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.15;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  white-space: pre-line;
}

.key:hover {
  background: var(--surface-2);
}

/* ISO enter: top piece plus a stem that overlaps its bottom border. */
.key--ghost {
  border-radius: 8px 8px 0 8px;
}

.key--iso {
  border-top: none;
  border-radius: 0 0 8px 8px;
  z-index: 1;
}

.key--knob {
  border-radius: 50%;
}

.key--dim .key__label {
  color: var(--text-3);
}

.key--seen {
  border-color: var(--text-3);
  background: var(--surface-2);
}

.key--selected,
.key--selected:hover,
.key--pressed,
.key--pressed:hover {
  background: var(--invert);
  border-color: var(--invert);
  color: var(--on-invert);
}

.key--selected .key__label,
.key--pressed .key__label {
  color: var(--on-invert);
}

.key__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
