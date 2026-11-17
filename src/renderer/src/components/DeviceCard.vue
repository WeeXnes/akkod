<script setup>
import { computed } from 'vue';
import { kb } from '../lib/store.js';
import { EFFECTS } from '../lib/settings.js';

const emit = defineEmits(['connect', 'open-health']);

const effectName = computed(() => EFFECTS.find((e) => e.id === kb.lighting.effect)?.name ?? '—');
const connected = computed(() => kb.status === 'connected');
const fw = computed(() => {
  const v = kb.firmware;
  if (!v) return '—';
  return `0x${v.toString(16).padStart(8, '0')}`;
});
</script>

<template>
  <section class="device">
    <div class="device-card" :class="{ 'device-card--active': connected }">
      <div class="device-card__header">
        <span class="micro">Keyboard · 75% · QMK / VIA</span>
        <span class="micro">
          <span class="status-dot" :class="connected ? 'status-dot--success' : 'status-dot--danger'"></span>
          {{ connected ? (kb.simulator ? 'Simulator' : 'USB') : kb.status === 'connecting' ? 'Connecting' : 'Not connected' }}
        </span>
      </div>
      <div class="device-card__name">Akko 5075S</div>
      <div class="device-card__meta micro num">FFFE:000B</div>
    </div>

    <div v-if="connected" class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat__val num">{{ kb.layerCount }}</div>
        <div class="micro">Layers</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat__val num">{{ Math.round((kb.lighting.brightness / 255) * 100) }}%</div>
        <div class="micro">Brightness</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat__val micro-val">{{ effectName }}</div>
        <div class="micro">Effect</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat__val num">{{ kb.protocol }}</div>
        <div class="micro">VIA protocol</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat__val micro-val num">{{ fw }}</div>
        <div class="micro">Firmware</div>
      </div>
    </div>

    <div v-else class="box empty">
      <p class="empty__text">
        {{ kb.status === 'connecting' ? 'Connecting to the keyboard…' : kb.error || 'Plug the 5075S in with a USB cable.' }}
      </p>
      <div class="empty__actions">
        <button class="btn btn--primary" :disabled="kb.status === 'connecting'" @click="emit('connect')">Connect</button>
        <button class="btn btn--secondary" @click="emit('open-health')">Health check</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.device {
  display: flex;
  flex-direction: column;
}

.device-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  position: relative;
}

.device-card--active {
  border-color: var(--line-strong);
  background: var(--surface-2);
}

.device-card--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
}

.device-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.device-card__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 24px;
  border-bottom: 1px solid var(--line);
  padding: 24px 0;
}

.hero-stat__val {
  font-size: 32px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.1;
  margin-bottom: 4px;
}

.micro-val {
  font-size: 20px;
  line-height: 1.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.empty__text {
  font-size: 14px;
}

.empty__actions {
  display: flex;
  gap: 8px;
}
</style>
