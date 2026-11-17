<script setup>
import { ref, onMounted } from 'vue';
import { kb, snapshot, applySnapshot, validateSnapshot } from '../lib/store.js';
import { EFFECTS } from '../lib/settings.js';

const emit = defineEmits(['notify']);
const api = window.akkod;
const KEY = 'akkod-profiles';

const profiles = ref([]);
const newName = ref('');
const progress = ref('');

function load() {
  try {
    profiles.value = JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    profiles.value = [];
  }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles.value));
  } catch {}
}
onMounted(load);

function save() {
  const name = newName.value.trim() || `Profile ${profiles.value.length + 1}`;
  profiles.value.unshift({ id: crypto.randomUUID(), ...snapshot(name) });
  persist();
  newName.value = '';
  emit('notify', `Saved “${name}”`);
}

async function apply(p) {
  if (!window.confirm(`Write “${p.name}” to the keyboard? It replaces the current keymap, knob and lighting.`)) return;
  try {
    progress.value = 'Writing…';
    const n = await applySnapshot(p, (i, total) => (progress.value = `Writing ${i} / ${total}`));
    emit('notify', `Applied “${p.name}” (${n} key${n === 1 ? '' : 's'} changed)`);
  } catch (err) {
    emit('notify', `Could not apply: ${err.message}`);
  } finally {
    progress.value = '';
  }
}

function remove(p) {
  if (!window.confirm(`Delete “${p.name}” from this list? Exported files are not affected.`)) return;
  profiles.value = profiles.value.filter((x) => x.id !== p.id);
  persist();
}

async function exportProfile(p) {
  const { id, ...data } = p;
  const res = await api?.saveFile?.(`${p.name.replace(/[^\w -]+/g, '_')}.akkod.json`, JSON.stringify(data, null, 2));
  if (res?.path) emit('notify', `Exported to ${res.path}`);
}

async function importProfile() {
  const res = await api?.openFile?.();
  if (!res?.content) return;
  try {
    const data = JSON.parse(res.content);
    const problem = validateSnapshot(data);
    if (problem) throw new Error(problem);
    profiles.value.unshift({ ...data, id: crypto.randomUUID() });
    persist();
    emit('notify', `Imported “${data.name}”`);
  } catch (err) {
    emit('notify', `Import failed: ${err.message}`);
  }
}

const effectName = (id) => EFFECTS.find((e) => e.id === id)?.name ?? `Effect ${id}`;
const date = (iso) => new Date(iso).toLocaleString();
</script>

<template>
  <div class="profiles">
    <div class="section-header">
      <div>
        <h2 class="section-title">Profiles</h2>
        <p class="section-desc">
          The keyboard stores one setup in its own memory. Profiles let you keep several here and swap between them.
        </p>
      </div>
      <div class="actions">
        <button class="btn btn--secondary btn--small" @click="importProfile">Import</button>
        <button class="btn btn--secondary btn--small" @click="api?.openBackups?.()">Backups folder</button>
      </div>
    </div>

    <div class="box save-row">
      <input v-model="newName" class="input" placeholder="Profile name" aria-label="Profile name" @keydown.enter="save" />
      <button class="btn btn--primary" :disabled="kb.status !== 'connected'" @click="save">Save current setup</button>
    </div>

    <p v-if="progress" class="micro num">{{ progress }}</p>

    <div v-if="profiles.length" class="list">
      <div class="list__head micro">
        <span>Name</span>
        <span>Lighting</span>
        <span>Saved</span>
        <span></span>
      </div>
      <div v-for="p in profiles" :key="p.id" class="list__row">
        <span class="name">{{ p.name }}</span>
        <span class="meta">{{ effectName(p.lighting?.effect) }}</span>
        <span class="meta num">{{ date(p.createdAt) }}</span>
        <span class="row-actions">
          <button class="btn btn--secondary btn--small" :disabled="kb.status !== 'connected' || kb.busy" @click="apply(p)">Apply</button>
          <button class="btn btn--secondary btn--small" @click="exportProfile(p)">Export</button>
          <button class="btn btn--danger btn--small" @click="remove(p)">Delete</button>
        </span>
      </div>
    </div>
    <p v-else class="empty">No profiles yet. Save the current setup to make one.</p>

    <p class="hint">
      The first time the app connects to a keyboard it also saves the keymap it found as a file in the backups folder.
    </p>
  </div>
</template>

<style scoped>
.profiles {
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

.save-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.list {
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.list__head,
.list__row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.4fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
}

.list__head {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.list__row + .list__row {
  border-top: 1px solid var(--line);
}

.list__row:hover {
  background: var(--surface-2);
}

.name {
  color: var(--text);
  font-weight: 500;
}

.meta {
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.empty,
.hint {
  font-size: 13px;
  color: var(--text-3);
}
</style>
