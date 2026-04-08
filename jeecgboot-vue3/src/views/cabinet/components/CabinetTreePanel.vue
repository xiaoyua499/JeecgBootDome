<!-- 文件柜左侧目录树
  负责目录结构展示和节点切换。

  功能说明：
  - 使用 Ant Design Vue 的 a-tree 组件渲染文件夹树
  - treeData 由 useCabinetComputed.buildTreeData 从扁平 itemList 构建
  - selectedKeys 由父组件（CabinetExplorer）维护，对应当前所在文件夹 id
  - 点击节点时抛出 select 事件，父组件响应后切换 currentFolderId

  注意：
  - 只显示文件夹（type === 'folder'），文件不出现在树中
  - block-node 属性使节点占满整行，便于点击
-->
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
