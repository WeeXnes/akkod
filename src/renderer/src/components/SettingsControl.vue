<script setup>
import { ref, onMounted } from 'vue';
import { settings } from '../lib/settings.js';
import { connect } from '../lib/store.js';

const version = ref('dev');
onMounted(async () => {
  version.value = (await window.akkod?.getVersion?.()) || 'dev';
});

function toggleSimulator(on) {
  settings.simulator = on;
  connect({ simulator: on });
}
</script>

<template>
  <div class="settings-control">
    <div class="section-header">
      <div>
        <h2 class="section-title">Settings</h2>
        <p class="section-desc">How the keyboard is drawn, and the hardware simulator.</p>
      </div>
    </div>

    <div class="box settings-box">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">ISO Enter</span>
          <span class="setting-hint">Tall Enter with the # key beside it. Turn off for the ANSI layout.</span>
        </div>
        <label class="switch">
          <input v-model="settings.isoEnter" type="checkbox" />
          <span class="switch__slider"></span>
        </label>
      </div>

      <div class="row-divider"></div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">Split left Shift</span>
          <span class="setting-hint">Short left Shift with the extra &lt; key, as on ISO boards.</span>
        </div>
        <label class="switch">
          <input v-model="settings.splitShift" type="checkbox" />
          <span class="switch__slider"></span>
        </label>
      </div>

      <div class="row-divider"></div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">Key legends</span>
          <span class="setting-hint">
            Display only. The keyboard sends the same codes either way; your OS layout decides the character.
          </span>
        </div>
        <div class="btn-group">
          <button class="btn btn--secondary btn--small" :class="{ active: settings.legends === 'us' }" @click="settings.legends = 'us'">
            US
          </button>
          <button class="btn btn--secondary btn--small" :class="{ active: settings.legends === 'de' }" @click="settings.legends = 'de'">
            German
          </button>
        </div>
      </div>

      <div class="row-divider"></div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-title">Hardware simulator</span>
          <span class="setting-hint">Use a virtual 5075S with the stock keymap. Nothing is sent to the real keyboard while this is on.</span>
        </div>
        <label class="switch">
          <input type="checkbox" :checked="settings.simulator" @change="toggleSimulator($event.target.checked)" />
          <span class="switch__slider"></span>
        </label>
      </div>
    </div>

    <div class="box about-box">
      <div class="about-header">
        <span class="about-brand">akkod</span>
        <span class="micro num">Version {{ version }}</span>
      </div>
      <p class="about-desc">
        Configuration tool for the Akko 5075S (QMK / VIA). Talks to the keyboard over the VIA raw-HID protocol, the same
        interface VIA uses. It never sends the bootloader or EEPROM-wipe commands.
      </p>
      <div class="about-meta micro">
        <span>Electron + Vue 3</span>
        <span>·</span>
        <span>VIA protocol 12</span>
        <span>·</span>
        <span>GPL-3.0-or-later</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-control {
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

.settings-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-info {
  display: flex;
  flex-direction: column;
  padding-right: 24px;
}

.setting-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 2px;
}

.setting-hint {
  font-size: 13px;
  color: var(--text-3);
}

.row-divider {
  height: 1px;
  background: var(--line);
}

.btn-group {
  display: flex;
  gap: 8px;
}

.about-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.about-brand {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.01em;
}

.about-desc {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.6;
}

.about-meta {
  display: flex;
  gap: 8px;
}
</style>
