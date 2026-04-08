<!-- 单个文件项（网格视图）
  负责图标模式下单个文件/文件夹的展示、交互状态和就地重命名。

  视觉状态：
  - selected: 选中态（蓝色背景 + 边框）
  - cutting: 剪切态（半透明，opacity 0.56）
  - drop-target: 拖拽悬停目标态（蓝色边框 + 内阴影）
  - file-item-large / file-item-small: 大/小图标尺寸

  重命名交互：
  - editing=true 时显示 a-input 输入框，自动聚焦并全选文本
  - Enter / blur → submitRename
  - Esc → cancelRename
  - 输入框 click.stop 防止触发父级选中逻辑

  事件：
  - click/dblclick/contextmenu: 转发给父组件处理选中/打开/右键菜单
  - dragenter/dragover/dragleave/drop: 转发给父组件处理拖拽移动
  - update:editValue: 重命名输入框值变化
  - submitRename/cancelRename: 重命名确认/取消
-->
<template>
  <div
    class="file-item"
    :class="[`file-item-${size}`, { selected, cutting, 'drop-target': dropTarget }]"
    @click="emit('click', $event)"
    @dblclick="emit('dblclick', $event)"
    @contextmenu.prevent="emit('contextmenu', $event)"
    @dragenter.prevent="emit('dragenter', $event)"
    @dragover.prevent="emit('dragover', $event)"
    @dragleave="emit('dragleave', $event)"
    @drop.prevent="emit('drop', $event)"
  >
    <img class="file-icon" :src="iconSrc" :alt="name" draggable="false" />
    <template v-if="editing">
      <a-input
        ref="inputRef"
        :value="editValue"
        class="file-rename-input"
        size="small"
        @click.stop
        @update:value="emit('update:editValue', $event)"
        @pressEnter="emit('submitRename')"
        @blur="emit('submitRename')"
        @keydown.esc.stop.prevent="emit('cancelRename')"
      />
    </template>
    <div v-else class="file-name" :title="name">{{ name }}</div>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, ref, watch } from 'vue';

  const inputRef = ref();

  // 单个文件项：负责图标模式下的展示、选中态和就地重命名输入框。
  defineProps<{
    /** 文件/文件夹名称，显示在图标下方 */
    name: string;
    /** 图标图片路径（由 resolveCabinetItemIconSrc 解析） */
    iconSrc: string;
    /** 图标尺寸：large（72px）或 small（32px） */
    size: 'large' | 'small';
    /** 是否处于选中状态 */
    selected: boolean;
    /** 是否处于剪切状态（半透明显示） */
    cutting?: boolean;
    /** 是否为拖拽悬停的目标文件夹 */
    dropTarget?: boolean;
    /** 是否处于重命名编辑状态 */
    editing?: boolean;
    /** 重命名输入框的当前值（v-model:editValue） */
    editValue?: string;
  }>();

  const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void;
    (e: 'dblclick', event: MouseEvent): void;
    (e: 'contextmenu', event: MouseEvent): void;
    (e: 'dragenter', event: DragEvent): void;
    (e: 'dragover', event: DragEvent): void;
    (e: 'dragleave', event: DragEvent): void;
    (e: 'drop', event: DragEvent): void;
    (e: 'update:editValue', value: string): void;
    (e: 'submitRename'): void;
    (e: 'cancelRename'): void;
  }>();

  watch(
    () => inputRef.value,
    async (value) => {
      if (!value) {
        return;
      }
      // 进入重命名时自动聚焦并选中文本，贴近系统文件管理器交互。
      // nextTick 确保 DOM 已渲染完成再操作 input 元素
      await nextTick();
      const inputEl = value?.input as HTMLInputElement | undefined;
      inputEl?.focus();
      inputEl?.select();
    }
  );
</script>

<style lang="less" scoped>
  .file-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: default;
    user-select: none;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease;

    &:hover {
      background: #eef5ff;
      border-color: #d6e6ff;
    }

    &.selected {
      background: #dbe9ff;
      border-color: #8eb8ff;
    }

    &.cutting {
      opacity: 0.56;
    }

    &.drop-target {
      background: #e7f1ff;
      border-color: #4a90ff;
      box-shadow: inset 0 0 0 1px rgb(74 144 255 / 20%);
    }
  }

  .file-rename-input {
    width: 100%;
  }

  .file-item-large {
    width: 112px;
    min-height: 118px;
    padding: 10px 8px 8px;
    gap: 8px;

    .file-icon {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      font-size: 16px;
    }

    .file-name {
      width: 100%;
      overflow: hidden;
      color: #1f2d3d;
      font-size: 12px;
      line-height: 16px;
      text-align: center;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .file-item-small {
    width: 84px;
    min-height: 74px;
    padding: 8px 6px;
    gap: 6px;

    .file-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      font-size: 11px;
    }

    .file-name {
      width: 100%;
      overflow: hidden;
      color: #1f2d3d;
      font-size: 12px;
      line-height: 16px;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .file-icon {
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }
</style>
