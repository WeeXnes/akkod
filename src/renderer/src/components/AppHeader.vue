<script setup>
import ThemeToggle from './ThemeToggle.vue';

const props = defineProps({
  currentSection: { type: String, required: true },
  sections: { type: Array, required: true },
  status: { type: String, default: 'disconnected' }
});

const emit = defineEmits(['navigate']);

const statusText = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'No keyboard',
  error: 'Error'
};
const statusDot = {
  connected: 'status-dot--success',
  connecting: 'status-dot--warning',
  disconnected: 'status-dot--danger',
  error: 'status-dot--danger'
};
</script>

<template>
  <header class="app-header">
    <div class="app-header__left">
      <div class="wordmark-group">
        <span class="app-wordmark">akkod</span>
        <span class="app-slash">/</span>
        <span class="app-section-name">{{ sections.find((s) => s.id === currentSection)?.label }}</span>
      </div>

      <nav class="app-nav">
        <a
          v-for="sec in sections"
          :key="sec.id"
          href="#"
          class="app-nav__link"
          :class="{ active: currentSection === sec.id }"
          :aria-current="currentSection === sec.id ? 'page' : undefined"
          @click.prevent="emit('navigate', sec.id)"
        >
          {{ sec.label }}
        </a>
      </nav>
    </div>

    <div class="app-header__right">
      <div class="conn-status">
        <span class="status-dot" :class="statusDot[props.status]"></span>
        <span class="micro">{{ statusText[props.status] }}</span>
      </div>
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
.wordmark-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 24px;
}

.conn-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
