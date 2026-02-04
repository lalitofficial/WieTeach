<template>
  <div class="icon-picker-popover">
    <div class="icon-search-row">
      <div class="icon-search-meta">
        <span>Showing {{ filteredIcons.length }}</span>
        <span>Total {{ icons.length }}</span>
      </div>
      <input
        v-model="query"
        type="text"
        placeholder="Search icons..."
        class="icon-search-input"
        @keydown.escape="$emit('close')"
      />
    </div>

    <section class="icon-picker-grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon.id"
        @click="selectIcon(icon.id)"
        @mouseenter="previewIcon = icon"
        class="icon-picker-btn"
        :class="{ active: icon.id === previewIcon?.id }"
        :title="icon.label"
      >
        <svg viewBox="0 0 16 16">
          <path v-for="d in icon.paths" :key="d" :d="d" />
        </svg>
        <span class="icon-label">{{ icon.label }}</span>
      </button>

      <div v-if="filteredIcons.length === 0" class="icon-picker-empty">
        No icons found
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  icons: {
    type: Array,
    default: () => [],
  },
});

const query = ref("");
const previewIcon = ref(props.icons[0] || null);

const filteredIcons = computed(() => {
  const searchTerm = query.value.trim().toLowerCase();
  const list = props.icons || [];
  if (!searchTerm) return list.slice(0, 120);

  const startsWith = list
    .filter((icon) => icon.id.toLowerCase().startsWith(searchTerm))
    .slice(0, 120);

  if (startsWith.length >= 20) return startsWith;

  const includes = list
    .filter(
      (icon) =>
        !icon.id.toLowerCase().startsWith(searchTerm) &&
        (icon.id.toLowerCase().includes(searchTerm) ||
          icon.label.toLowerCase().includes(searchTerm)),
    )
    .slice(0, 120 - startsWith.length);

  return [...startsWith, ...includes];
});

const emit = defineEmits(["select", "close"]);

function selectIcon(iconName) {
  emit("select", iconName);
  query.value = "";
}

watch(
  () => props.icons,
  (list) => {
    if (list?.length && !previewIcon.value) {
      previewIcon.value = list[0];
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.icon-picker-popover {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "search"
    "grid";
  gap: 10px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
  padding: 10px;
  width: 100%;
  max-height: 64vh;
  overflow: hidden;
}

.icon-search-row {
  grid-area: search;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.icon-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
}

.icon-search-input:focus {
  outline: none;
  border-color: #3b63ff;
  box-shadow: 0 0 0 2px rgba(59, 99, 255, 0.12);
}

.icon-search-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6b7280;
  gap: 12px;
}

.icon-picker-grid {
  grid-area: grid;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 6px;
  overflow: auto;
  padding-right: 4px;
  max-height: 500px;
}

.icon-picker-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0;
  min-height: 64px;
}

.icon-picker-btn:hover {
  border-color: #3b63ff;
  background: #f4f7ff;
  transform: translateY(-1px);
}

.icon-picker-btn.active {
  border-color: #111827;
  background: #111827;
  color: #ffffff;
}

.icon-picker-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  margin-bottom: 2px;
}

.icon-label {
  font-size: 8px;
  color: currentColor;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

@media (max-width: 720px) {
  .icon-picker-popover {
    grid-template-columns: 1fr;
    grid-template-areas:
      "search"
      "preview"
      "grid";
    width: min(92vw, 560px);
    max-height: 80vh;
  }

  .icon-search-row {
    grid-template-columns: 1fr;
  }

  .icon-picker-grid {
    max-height: 52vh;
  }
}

.icon-picker-empty {
  grid-column: 1 / -1;
  padding: 24px 8px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.icon-picker-footer {
  border-top: 1px solid #ddd;
  padding-top: 8px;
  text-align: center;
  color: #666;
  font-size: 12px;
}
</style>
