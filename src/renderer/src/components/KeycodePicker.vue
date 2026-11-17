<script setup>
import { ref, computed } from 'vue';
import { pickerCategories, MOD_BITS, modded, modTap, layerTap, describe } from '../lib/keycodes.js';

const props = defineProps({
  layerCount: { type: Number, default: 6 },
  current: { type: Number, default: null },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['pick']);

const categories = computed(() => [...pickerCategories(props.layerCount), { id: 'combo', label: 'Combos', keys: [] }]);
const active = ref('basic');
const query = ref('');

const visibleKeys = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (q) {
    const all = categories.value.flatMap((c) => c.keys);
    const seen = new Set();
    return all.filter((k) => {
      if (seen.has(k.code)) return false;
      seen.add(k.code);
      return [k.label, k.title, k.id].some((s) => s && s.toLowerCase().includes(q));
    });
  }
  return categories.value.find((c) => c.id === active.value)?.keys || [];
});

// Combo builder: modifier + key, mod-tap, layer-tap
const comboKind = ref('mods');
const comboMods = ref(0x01);
const comboRight = ref(false);
const comboLayer = ref(1);
const comboKey = ref(0x06);
const basicKeys = computed(() => pickerCategories(props.layerCount)[0].keys.filter((k) => k.code > 1 && k.code <= 0xff));

const comboCode = computed(() => {
  const mods = comboMods.value | (comboRight.value ? 0x10 : 0);
  if (comboKind.value === 'mods') return modded(mods, comboKey.value);
  if (comboKind.value === 'modtap') return modTap(mods, comboKey.value);
  return layerTap(comboLayer.value, comboKey.value);
});

function toggleMod(bit) {
  comboMods.value ^= bit;
  if (!comboMods.value) comboMods.value = bit;
}

const hex = (c) => '0x' + c.toString(16).padStart(4, '0');
</script>

<template>
  <div class="picker" :class="{ 'picker--disabled': disabled }">
    <div class="picker__bar">
      <div class="picker__tabs" role="tablist">
        <button
          v-for="c in categories"
          :key="c.id"
          class="tab"
          :class="{ active: active === c.id && !query }"
          role="tab"
          :aria-selected="active === c.id && !query"
          @click="active = c.id; query = ''"
        >
          {{ c.label }}
        </button>
      </div>
      <input v-model="query" class="input picker__search" placeholder="Search keys…" aria-label="Search keycodes" />
    </div>

    <div v-if="active === 'combo' && !query" class="combo">
      <div class="combo__row">
        <span class="micro">Type</span>
        <div class="btn-group">
          <button class="btn btn--secondary btn--small" :class="{ active: comboKind === 'mods' }" @click="comboKind = 'mods'">Modifier + key</button>
          <button class="btn btn--secondary btn--small" :class="{ active: comboKind === 'modtap' }" @click="comboKind = 'modtap'">Tap key / hold modifier</button>
          <button class="btn btn--secondary btn--small" :class="{ active: comboKind === 'layertap' }" @click="comboKind = 'layertap'">Tap key / hold layer</button>
        </div>
      </div>
      <div v-if="comboKind !== 'layertap'" class="combo__row">
        <span class="micro">Modifiers</span>
        <div class="btn-group">
          <button
            v-for="m in MOD_BITS"
            :key="m.bit"
            class="btn btn--secondary btn--small"
            :class="{ active: comboMods & m.bit }"
            @click="toggleMod(m.bit)"
          >
            {{ m.label }}
          </button>
          <button class="btn btn--secondary btn--small" :class="{ active: comboRight }" @click="comboRight = !comboRight">Right side</button>
        </div>
      </div>
      <div v-else class="combo__row">
        <span class="micro">Layer while held</span>
        <div class="btn-group">
          <button
            v-for="n in Math.min(layerCount, 16)"
            :key="n"
            class="btn btn--secondary btn--small num"
            :class="{ active: comboLayer === n - 1 }"
            @click="comboLayer = n - 1"
          >
            {{ n - 1 }}
          </button>
        </div>
      </div>
      <div class="combo__row">
        <span class="micro">Key</span>
        <select v-model.number="comboKey" class="input combo__select">
          <option v-for="k in basicKeys" :key="k.code" :value="k.code">{{ k.title }}</option>
        </select>
      </div>
      <div class="combo__row">
        <span class="micro">Result</span>
        <div class="combo__result">
          <span class="combo__label">{{ describe(comboCode).title }}</span>
          <span class="micro num">{{ hex(comboCode) }}</span>
          <button class="btn btn--primary" :disabled="disabled" @click="emit('pick', comboCode)">Assign</button>
        </div>
      </div>
    </div>

    <div v-else class="picker__grid">
      <button
        v-for="k in visibleKeys"
        :key="k.code"
        class="pick"
        :class="{ 'pick--current': current === k.code }"
        :title="`${k.title} (${hex(k.code)})`"
        :disabled="disabled"
        @click="emit('pick', k.code)"
      >
        {{ k.label || 'None' }}
      </button>
      <p v-if="!visibleKeys.length" class="empty">No keys match “{{ query }}”.</p>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.picker__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--line);
}

.picker__tabs {
  display: flex;
  gap: 20px;
  overflow-x: auto;
}

.tab {
  background: none;
  border: none;
  color: var(--text-2);
  font-size: 14px;
  padding: 8px 0 12px;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tab:hover,
.tab.active {
  color: var(--text);
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--text);
}

.picker__search {
  width: 220px;
  height: 32px;
  margin-bottom: 8px;
}

.picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}

.pick {
  height: 44px;
  padding: 2px 4px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
}

.pick:hover {
  background: var(--surface-2);
}

.pick--current {
  border-color: var(--text);
}

.empty {
  grid-column: 1 / -1;
  color: var(--text-3);
  font-size: 14px;
}

.combo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.combo__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 16px;
}

.combo__select {
  max-width: 360px;
}

.combo__result {
  display: flex;
  align-items: center;
  gap: 16px;
}

.combo__label {
  color: var(--text);
  font-size: 14px;
}

.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
