<template>
  <!-- 当前目录作为文件查重 demo 的前端入口，先挂载生成器产出的查重任务列表页面。 -->
  <DuplicateTaskList />
</template>

<script lang="ts" setup>
  defineOptions({ name: 'DuplicateTaskIndex' });
  import DuplicateTaskList from './DuplicateTaskList.vue';
</script>

<style lang="less" scoped></style>
