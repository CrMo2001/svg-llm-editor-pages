<template>
  <div class="app-container">
    <div class="top-nav-container">
      <TopNav />
    </div>
    <div class="body-container">
      <div class="tab-container"></div>
      <div class="editor-container">
        <Editor />
      </div>
    </div>
    <div class="footer-container">
      <PageFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import Editor from './components/Editor.vue';
import PageFooter from './components/PageFooter.vue';
import TopNav from './components/TopNav.vue';

</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* gap: 10px; */
}

.top-nav-container {
  flex: 0 0 auto;
  width: 100%;
  box-shadow: 0 5px 5px rgba(0, 0, 0, 0.1);
  /* border: 1px solid rgba(0, 0, 0, 0.1); */
  box-sizing: border-box;
}

.body-container {
  flex: 1 1 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tab-container {
  flex: 1 1 0;
  height: 100%;
}

.editor-container {
  flex: 4 4 0;
  height: 100%;
}

.footer-container {
  flex: 0 0 auto;
  width: 100%;
  box-shadow: 0 -5px 5px rgba(0, 0, 0, 0.2);
}
</style>
