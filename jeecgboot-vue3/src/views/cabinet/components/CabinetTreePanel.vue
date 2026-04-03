<!-- 文件柜左侧目录树：负责目录结构展示和节点切换。 -->
<template>
  <div class="cabinet-tree">
    <a-tree :tree-data="treeData" :selected-keys="selectedKeys" block-node @select="emit('select', $event)" />
  </div>
</template>

<script lang="ts" setup>
  import type { PropType } from 'vue';
  import type { DataNode } from 'ant-design-vue/es/tree';

  // 左侧目录树：只负责目录结构展示和节点选中事件抛出。
  defineProps({
    treeData: { type: Array as PropType<DataNode[]>, required: true },
    selectedKeys: { type: Array as PropType<string[]>, required: true },
  });

  const emit = defineEmits<{
    (e: 'select', keys: Array<string | number>): void;
  }>();
</script>

<style lang="less" scoped>
  .cabinet-tree {
    width: 240px;
    padding: 12px 10px;
    background: #f9fbff;
    border-right: 1px solid #e4eaf2;
    overflow: auto;
  }
</style>
