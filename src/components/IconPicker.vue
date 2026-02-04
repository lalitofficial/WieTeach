<template>
  <div class="icon-picker-popover">
    <div class="icon-search-row">
      <div class="icon-search-meta">
        <span>Showing {{ filteredIcons.length }}</span>
        <span>Total {{ BOOTSTRAP_ICONS.length }}</span>
      </div>
      <input
        v-model="query"
        type="text"
        placeholder="Search icons..."
        class="icon-search-input"
        @keydown.escape="$emit('close')"
      />
    </div>

    <aside class="icon-preview-panel">
      <div class="icon-preview">
        <div class="icon-preview-box">
          <i :class="`bi bi-${previewIcon}`"></i>
        </div>
        <div class="icon-preview-meta">
          <div class="icon-preview-title">{{ previewIcon }}</div>
          <div class="icon-preview-sub">Bootstrap Icons</div>
        </div>
      </div>
    </aside>

    <section class="icon-picker-grid">
      <button
        v-for="icon in filteredIcons"
        :key="icon"
        @click="selectIcon(icon)"
        @mouseenter="previewIcon = icon"
        class="icon-picker-btn"
        :class="{ active: icon === previewIcon }"
        :title="icon"
      >
        <i :class="`bi bi-${icon}`"></i>
        <span class="icon-label">{{ icon }}</span>
      </button>

      <div v-if="filteredIcons.length === 0" class="icon-picker-empty">
        No icons found
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { BOOTSTRAP_ICONS } from "@/data/bootstrapIcons";

const query = ref("");
const previewIcon = ref(BOOTSTRAP_ICONS[0] || "star");

const filteredIcons = computed(() => {
  const searchTerm = query.value.trim().toLowerCase();

  if (!searchTerm) {
    return BOOTSTRAP_ICONS.slice(0, 50);
  }

  // Ranked search: startsWith > includes
  const startsWith = BOOTSTRAP_ICONS.filter((icon) =>
    icon.startsWith(searchTerm),
  ).slice(0, 50);

  if (startsWith.length >= 5) {
    return startsWith;
  }

  const includes = BOOTSTRAP_ICONS.filter(
    (icon) => icon.includes(searchTerm) && !icon.startsWith(searchTerm),
  ).slice(0, 50 - startsWith.length);

  return [...startsWith, ...includes];
});

const emit = defineEmits(["select", "close"]);

function selectIcon(iconName) {
  emit("select", iconName);
  query.value = "";
}

watch(filteredIcons, (list) => {
  if (list.length && !list.includes(previewIcon.value)) {
    previewIcon.value = list[0];
  }
});
</script>

<style scoped>
.icon-picker-popover {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "search search"
    "preview grid";
  gap: 10px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
  padding: 10px;
  width: min(720px, 86vw);
  max-height: 680px;
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

.icon-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.icon-preview-panel {
  grid-area: preview;
  display: flex;
  align-items: flex-start;
}

.icon-preview-box {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 18px;
}

.icon-preview-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.icon-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.icon-preview-sub {
  font-size: 10px;
  color: #6b7280;
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

.icon-picker-btn i {
  font-size: 18px;
  color: currentColor;
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
