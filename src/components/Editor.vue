<template>
  <div class="editor">
    <div class="editor-main">
      <div class="svg-container">
        <div v-if="svgCode == ''" class="upload-container">
          <button class="upload-btn" @click="uploadSvg">
            Upload SVG
          </button>
          <div> or </div>
          <button class="upload-btn" @click="uploadWorkspace">
            Upload Workspace
          </button>
        </div>
        <div v-else class="svg-content" v-html="svgCode">
        </div>
      </div>
      <div class="tool-bar">
        <div class="button-bar">
          <button @click="clear">Clear</button>
          <button @click="historyViewer?.undo()">Undo</button>
          <button @click="historyViewer?.redo()">Redo</button>
          <button @click="exportWorkspace">Export Workspace</button>
          <button @click="exportSVG">Export SVG</button>
        </div>
        <div class="prompt-bar">
          <input type="text" v-model="prompt" placeholder="Enter prompt here...">
          <button @click="edit">Edit</button>
        </div>
      </div>
    </div>
    <div class="history-viewer-container">
      <HistoryViewer ref="historyViewer" @state-change="updateEditor" />
    </div>
    <div class="editor-mask" v-if="isLoading">

    </div>
    <div class="loading-info" v-if="isLoading">
      <div class="spinner"></div>
      <div>{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import HistoryViewer, { type HistoryItem } from './HistoryViewer.vue';
import { createSocket } from '../api';

const historyViewer = ref<InstanceType<typeof HistoryViewer>>();

const svgCode = ref('')
const prompt = ref('');
const isLoading = ref(false);
const loadingText = ref('Loading...');
let sceneGraph: string | null = null;
let dependecies: string | null = null;

onMounted(() => {
  const workspace = JSON.parse(localStorage.getItem('workspace') || 'null')
  if (workspace) {
    loadWorkspace(workspace);
  }
})

function loadWorkspace(workspace: any) {
  sceneGraph = workspace.sceneGraph;
  dependecies = workspace.dependencies;
  historyViewer.value?.setHistory(workspace.history);
}

function getWorkspace() {
  const history = historyViewer.value?.getHistory() || [];
  const workspace = {
    sceneGraph: sceneGraph,
    dependencies: dependecies,
    history,
  }
  return workspace;
}

function startLoading(text: string) {
  loadingText.value = text;
  isLoading.value = true;
}

function stopLoading() {
  isLoading.value = false;
}

function updateEditor(state: HistoryItem) {
  svgCode.value = state.answer;
  saveToLocalStorage();
}

function uploadSvg() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.svg';
  input.onchange = (e) => {
    if (e.target == null) {
      return;
    }
    const target = e.target as HTMLInputElement;
    if (target.files == null || target.files.length === 0) {
      return;
    }
    const file = target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      const code = reader.result as string;
      const thumbnail = await getThumbnail(code);

      startLoading("")

      const ws = await createSocket();
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'result') {
          sceneGraph = data["scene_graph"];
          dependecies = data["dependencies"];
          historyViewer.value?.addHistoryItem({
            prompt: 'Upload initial SVG',
            thumbnail,
            answer: code,
          });
          stopLoading();
        } else if (data.type === 'status') {
          const message = data["message"];
          loadingText.value = message;
        }
      };
      ws.send(JSON.stringify({
        type: 'initiate',
        svg: code,
      }));

    };
  };
  input.click();
}

function uploadWorkspace() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.work';

  input.onchange = (e) => {
    if (e.target == null) {
      return;
    }
    const target = e.target as HTMLInputElement;
    if (target.files == null || target.files.length === 0) {
      return;
    }
    const file = target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async () => {
      const workspace = JSON.parse(reader.result as string);
      loadWorkspace(workspace);
    };
  };
  input.click();
}

function clear() {
  svgCode.value = '';
  prompt.value = '';
  sceneGraph = null;
  dependecies = null;
  historyViewer.value?.clearHistory();
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const workspace = getWorkspace();
  localStorage.setItem('workspace', JSON.stringify(workspace));
}

function exportWorkspace() {
  const workspace = getWorkspace();
  const content = JSON.stringify(workspace, null, 2);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'workspace.work';
  a.click();
}

function exportSVG() {
  const svg = svgCode.value;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'image.svg';
  a.click();
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    historyViewer.value?.undo();
    e.preventDefault();
  } else if (e.ctrlKey && e.key === 'y') {
    historyViewer.value?.redo();
    e.preventDefault();
  } else if (e.key === 'Enter') {
    edit();
    e.preventDefault();
  }
});

async function edit() {
  const promptValue = prompt.value.trim();
  if (promptValue === '') {
    return;
  }
  startLoading("")
  const ws = await createSocket();
  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'result') {
      const svg = data["svg"];
      const thumbnail = await getThumbnail(svg);
      historyViewer.value?.addHistoryItem({
        prompt: promptValue,
        thumbnail,
        answer: svg,
      });
      prompt.value = '';
      stopLoading();
    } else if (data.type === 'status') {
      const message = data["message"];
      loadingText.value = message;
    }
  };
  ws.send(JSON.stringify({
    type: 'edit',
    svg: svgCode.value,
    instruction: promptValue,
    dependencies: dependecies,
    scene_graph: sceneGraph,
  }));
}

async function getThumbnail(svg: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc.getElementsByTagName('svg')[0];
  // get the width and height of the svg
  let width: number, height: number;
  // use the viewBox attribute if it exists
  const viewBox = svgEl.getAttribute('viewBox');

  if (viewBox) {
    const viewBoxArr = viewBox.split(' ');
    width = parseFloat(viewBoxArr[2]);
    height = parseFloat(viewBoxArr[3]);
  } else {
    // otherwise, use the width and height attributes
    width = parseFloat(svgEl.getAttribute('width') || '100');
    height = parseFloat(svgEl.getAttribute('height') || '100');
  }

  const maxDimension = 200;
  const scale = maxDimension / Math.max(width, height);

  // use canvas to convert to image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    canvas.width = width * scale;
    canvas.height = height * scale;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const image = new Image(width, height);
    image.src = url;
    await image.decode();
    ctx.drawImage(image, 0, 0, width * scale, height * scale);
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  }
  return '';
}

</script>

<style scoped>
.editor {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.editor-main {
  /* height: 100%; */
  flex: 2 2 0;
  display: flex;
  flex-direction: column;
  margin: 20px 0;
}

.history-viewer-container {
  flex: 1 1 0;
  height: 100%;
}

.svg-container {
  flex: 1 1 0;
  width: 100%;
  overflow: hidden;
}

.svg-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tool-bar {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 10px;
  gap: 10px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  height: 100%;
  border-radius: 10px;
  border: 1px dashed #999;
}

.upload-btn,
.prompt-bar button,
.button-bar button {

  color: white;
  background-color: #999;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.upload-btn {
  padding: 10px;
}

.prompt-bar button,
.button-bar button {
  padding: 5px 10px;
}

.upload-btn:hover,
.prompt-bar button:hover,
.button-bar button:hover {
  background-color: #666;
}

.button-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.prompt-bar {
  width: 80%;
  display: flex;
  align-items: center;
}

.prompt-bar input {
  flex: 1 1 0;
  padding: 5px;
  margin-right: 5px;
  border: 1px solid #999;
  border-radius: 5px;
  font-size: 16px;
}

.prompt-bar input:focus {
  outline: none;
}

.editor-mask {
  position: absolute;
  top: 5px;
  left: 0;
  right: 0;
  bottom: 5px;
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-size: 18px;
  font-weight: bold;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>

<style>
.svg-content svg {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
}
</style>