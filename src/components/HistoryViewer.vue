<template>
  <div class="history-viewer">
    <div class="history-viewer-header">
      <div class="history-viewer-title">History Viewer</div>
    </div>
    <div class="history-viewer-content">
      <div v-for="(historyItem, index) in history" class="history-item" :class='{
        "selected-history-item": index == currentHistoryIndex,
        "history-item-deprecated": index > currentHistoryIndex,
      }' @click="setCurrentHistory(index)">
        <div class="history-item-prompt">{{ historyItem.prompt }}</div>
        <div class="history-item-thumbnail">
          <img :src="historyItem.thumbnail" alt="thumbnail">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue';
const emit = defineEmits<{
  (event: 'stateChange', item: HistoryItem): void;
}>();

export type HistoryItem = {
  prompt: string;
  answer: string;
  thumbnail: string;
}

const history: Ref<HistoryItem[]> = ref([]);

const currentHistoryIndex = ref(0);

function clearHistory() {
  history.value = [];
  currentHistoryIndex.value = 0;
}

function setHistory(newHistory: HistoryItem[]) {
  history.value = newHistory;
  currentHistoryIndex.value = history.value.length - 1;
  if (history.value.length > 0) {
    emit('stateChange', history.value[currentHistoryIndex.value]);
  }
}

function addHistoryItem(item: HistoryItem) {
  history.value.splice(currentHistoryIndex.value + 1);
  history.value.push(item);
  currentHistoryIndex.value = history.value.length - 1;
  emit('stateChange', item);
}

function setCurrentHistory(index: number) {
  currentHistoryIndex.value = index;
  emit('stateChange', history.value[index]);
}

function redo() {
  if (currentHistoryIndex.value < history.value.length - 1) {
    currentHistoryIndex.value++;
  }
  emit('stateChange', history.value[currentHistoryIndex.value]);
}

function undo() {
  if (currentHistoryIndex.value > 0) {
    currentHistoryIndex.value--;
    emit('stateChange', history.value[currentHistoryIndex.value]);
  }
}

function getHistory() {
  return history.value;
}

defineExpose({
  clearHistory,
  setHistory,
  addHistoryItem,
  redo,
  undo,
  getHistory,
});

</script>

<style scoped>
.history-viewer {
  margin: 20px 0px 20px 20px;
  box-sizing: border-box;
  border-radius: 5px 0px 0px 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

.history-viewer-header {
  border-radius: 5px 0px 0px 0px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 auto;
  /* background-color: #f5f5f5; */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.history-viewer-title {
  font-size: 18px;
  font-weight: bold;
}

.history-viewer-content {
  flex: 1 1 0;
  overflow-y: auto;
}

.history-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  gap: 10px;
}

.selected-history-item {
  box-shadow: 0 0 10px rgba(0, 123, 255, 1);
}

.history-item-prompt {
  font-size: 16px;
  font-weight: bold;
}

.history-item-thumbnail {
  /* width: calc(30%-40px); */
  width: 50%;
  aspect-ratio: 1/1;
  border-radius: 5px;
  overflow: hidden;
}

.history-item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.history-item-deprecated {
  filter: grayscale() contrast(0.2) brightness(1.5);
}
</style>