<script setup>
import { ref, computed, onMounted } from 'vue';
import { kb, connect } from '../lib/store.js';
import { hidAvailable } from '../lib/hid.js';

const emit = defineEmits(['notify']);
const api = window.akkod;
const sys = ref(null);
const working = ref(false);

async function refresh() {
  sys.value = (await api?.systemStatus?.()) || { platform: navigator.platform.toLowerCase().includes('win') ? 'win32' : 'linux' };
}
onMounted(refresh);

const checks = computed(() => {
  const s = sys.value || {};
  const list = [
    {
      name: 'WebHID',
      ok: hidAvailable(),
      detail: hidAvailable() ? 'Available' : 'Not available in this window'
    },
    {
      name: 'Keyboard on USB',
      ok: s.usbPresent ?? kb.status === 'connected',
      warn: s.usbPresent === undefined,
      detail: s.usbPresent === false ? 'No Akko 5075S (FFFE:000B) found. Use a USB cable; VIA does not work over 2.4G.' : s.usbPresent ? 'Akko 5075S found' : 'Unknown on this platform'
    }
  ];
  if (s.platform === 'linux') {
    list.push({
      name: 'udev access rule',
      ok: !!s.udevRule,
      detail: s.udevRule ? s.udevRule : 'Missing. Without it Linux only lets root open the keyboard.'
    });
    list.push({
      name: 'hidraw permission',
      ok: s.hidrawAccess === true,
      warn: s.hidrawAccess === null,
      detail: s.hidrawAccess === true ? s.hidrawPath : s.hidrawAccess === false ? `${s.hidrawPath} is not readable by your user` : 'Keyboard not found'
    });
  }
  list.push({
    name: 'VIA connection',
    ok: kb.status === 'connected',
    detail:
      kb.status === 'connected'
        ? `Protocol ${kb.protocol}, ${kb.layerCount} layers${kb.simulator ? ' (simulator)' : ''}`
        : kb.error || 'Not connected'
  });
  return list;
});

async function installRule() {
  working.value = true;
  try {
    const res = await api.installUdevRule();
    if (res?.ok) {
      emit('notify', 'udev rule installed');
      await refresh();
      setTimeout(() => connect(), 600);
    } else {
      emit('notify', res?.error || 'Install cancelled');
    }
  } finally {
    working.value = false;
  }
}
</script>

<template>
  <div class="health">
    <div class="section-header">
      <div>
        <h2 class="section-title">Health</h2>
        <p class="section-desc">Checks that the app can reach the keyboard's configuration interface.</p>
      </div>
      <div class="actions">
        <button class="btn btn--secondary btn--small" @click="refresh">Recheck</button>
        <button class="btn btn--secondary btn--small" @click="connect({ prompt: true })">Reconnect</button>
      </div>
    </div>

    <div class="list">
      <div v-for="c in checks" :key="c.name" class="list__row">
        <span class="name">
          <span class="status-dot" :class="c.ok ? 'status-dot--success' : c.warn ? 'status-dot--warning' : 'status-dot--danger'"></span>
          {{ c.name }}
        </span>
        <span class="detail">{{ c.detail }}</span>
      </div>
    </div>

    <div v-if="sys?.platform === 'linux' && !sys?.udevRule" class="box fix">
      <div>
        <span class="fix__title">Install the access rule</span>
        <p class="fix__text">
          Adds <code>/etc/udev/rules.d/70-akko-5075s-via.rules</code>, which gives the logged-in user access to this keyboard only.
          Asks for your password.
        </p>
      </div>
      <button class="btn btn--primary" :disabled="working" @click="installRule">Install rule</button>
    </div>
  </div>
</template>

<style scoped>
.health {
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

.list {
  border: 1px solid var(--line);
  border-radius: 12px;
}

.list__row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  padding: 14px 16px;
  align-items: center;
}

.list__row + .list__row {
  border-top: 1px solid var(--line);
}

.name {
  color: var(--text);
  font-weight: 500;
  font-size: 14px;
}

.detail {
  font-size: 13px;
  word-break: break-word;
}

.fix {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.fix__title {
  color: var(--text);
  font-weight: 500;
}

.fix__text {
  font-size: 13px;
  color: var(--text-2);
}
</style>
