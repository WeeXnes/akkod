<script setup>
import { ref, computed, onMounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import DeviceCard from './components/DeviceCard.vue';
import KeymapControl from './components/KeymapControl.vue';
import LightingControl from './components/LightingControl.vue';
import TesterControl from './components/TesterControl.vue';
import ProfilesControl from './components/ProfilesControl.vue';
import HealthControl from './components/HealthControl.vue';
import SettingsControl from './components/SettingsControl.vue';
import { kb, defn, connect, watchHotplug } from './lib/store.js';
import { settings, layoutOptions } from './lib/settings.js';
import { parseKle, resolveLayout, applyPhysicalSpacing } from './lib/layout.js';

const sections = [
  { id: 'keymap', label: 'Keymap', needsDevice: true },
  { id: 'lighting', label: 'Lighting', needsDevice: true },
  { id: 'tester', label: 'Tester', needsDevice: true },
  { id: 'profiles', label: 'Profiles' },
  { id: 'health', label: 'Health' },
  { id: 'settings', label: 'Settings' }
];
const current = ref('keymap');
const notification = ref('');
let toastTimer = null;

const rawKeys = parseKle(defn.layouts.keymap);
const keys = computed(() => applyPhysicalSpacing(resolveLayout(rawKeys, layoutOptions())));
const connected = computed(() => kb.status === 'connected');
const needsDevice = computed(() => sections.find((s) => s.id === current.value)?.needsDevice);

function notify(msg) {
  notification.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (notification.value = ''), 3200);
}

async function doConnect() {
  const ok = await connect({ prompt: true, simulator: settings.simulator });
  if (!ok && kb.status === 'error') current.value = 'health';
}

onMounted(async () => {
  watchHotplug();
  await connect({ simulator: settings.simulator });
});
</script>

<template>
  <div class="app-layout">
    <AppHeader :current-section="current" :sections="sections" :status="kb.status" @navigate="current = $event" />

    <main class="main-content">
      <div class="content-container">
        <transition name="fade">
          <div v-if="notification" class="toast-notification micro" role="status">{{ notification }}</div>
        </transition>

        <DeviceCard @connect="doConnect" @open-health="current = 'health'" />

        <div class="view-container">
          <template v-if="needsDevice && !connected">
            <p class="waiting">Connect the keyboard to use {{ sections.find((s) => s.id === current).label.toLowerCase() }}.</p>
          </template>
          <KeymapControl v-else-if="current === 'keymap'" :keys="keys" @notify="notify" />
          <LightingControl v-else-if="current === 'lighting'" @notify="notify" />
          <TesterControl v-else-if="current === 'tester'" :keys="keys" />
          <ProfilesControl v-else-if="current === 'profiles'" @notify="notify" />
          <HealthControl v-else-if="current === 'health'" @notify="notify" />
          <SettingsControl v-else-if="current === 'settings'" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0 64px 0;
}

.content-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--invert);
  color: var(--on-invert);
  padding: 10px 18px;
  border-radius: 9999px;
  font-weight: 500;
  z-index: 1000;
  text-transform: none;
  letter-spacing: 0.02em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.view-container {
  margin-top: 24px;
}

.waiting {
  color: var(--text-3);
  font-size: 14px;
}
</style>
