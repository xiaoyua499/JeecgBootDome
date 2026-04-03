<!-- 单个文件项：负责图标模式下的文件展示、选中态和就地重命名输入。 -->
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
    name: string;
    iconSrc: string;
    size: 'large' | 'small';
    selected: boolean;
    cutting?: boolean;
    dropTarget?: boolean;
    editing?: boolean;
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
