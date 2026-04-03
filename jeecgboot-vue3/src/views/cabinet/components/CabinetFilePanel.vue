<!-- 文件柜右侧文件区：负责文件展示、右键菜单、分组列表和属性弹窗。 -->
<template>
  <div :ref="setFilePanelRef" class="cabinet-files" @click="emit('hide-context-menu')"
    @contextmenu.prevent="emit('blank-contextmenu', $event)">
    <div class="cabinet-path">
      <a-breadcrumb>
        <a-breadcrumb-item v-for="crumb in breadcrumbItems" :key="crumb.id" @click="emit('enter-folder', crumb.id)">
          {{ crumb.name }}
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <div
      class="cabinet-upload-zone"
      :class="{ 'is-drag-over': uploadDragOver }"
      @dragenter.prevent="handleUploadDragEnter"
      @dragleave="handleUploadDragLeave"
      @dragover.prevent="handleUploadDragOver"
      @drop.prevent="handleUploadDrop"
    >
    <div v-if="viewMode === 'grid'" :ref="setGridPanelRef" class="grid-panel"
      @mousedown="emit('grid-blank-mousedown', $event)">
      <template v-for="group in groupedSections" :key="group.key">
        <div v-if="group.title" class="file-group-title">{{ group.title }}</div>
        <Draggable class="file-grid"
          :class="[`size-${gridIconSize}`, { 'sortable-disabled': sortField !== 'manual' }]"
          :model-value="group.items" item-key="id" :disabled="!canManage" :move="handleGridDragMove"
          ghost-class="file-drag-ghost" chosen-class="file-drag-chosen" drag-class="file-drag-active" :animation="180"
          :data-group-key="group.key" @start="resetSameGroupSortArm()"
          @end="resetSameGroupSortArm()" @update:modelValue="emit('grid-order-change', group, $event)">
          <template #item="{ element }">
            <FileItem :data-file-id="element.id" :name="element.name" :icon-src="resolveCabinetItemIconSrc(element, gridIconSize)"
              :size="gridIconSize" :selected="selectedIdSet.has(element.id)"
              :cutting="clipboardCutIdSet.has(element.id)" :drop-target="false"
              :editing="isRenaming(element.id)" :edit-value="renamingValue"
              @click="emit('item-click', element.id, $event)" @dblclick="emit('open', element)"
              @contextmenu="emit('item-contextmenu', element, $event)"
              @update:editValue="emit('update:renamingValue', $event)" @submitRename="emit('submit-rename')"
              @cancelRename="emit('cancel-rename')" />
          </template>
        </Draggable>
      </template>

      <div v-if="selectionBox.visible" class="selection-marquee" :style="{
        left: `${selectionBox.left}px`,
        top: `${selectionBox.top}px`,
        width: `${selectionBox.width}px`,
        height: `${selectionBox.height}px`,
      }"></div>
    </div>

    <div v-else-if="groupField === 'none'" class="grouped-table">
      <div class="grouped-table-header">
        <div class="col-name">名称</div>
        <div class="col-create-date">创建日期</div>
        <div class="col-update-date">修改日期</div>
        <div class="col-type">类型</div>
        <div class="col-size">大小</div>
      </div>
      <div class="grouped-table-body">
        <div v-for="item in sortedFilteredFolderItems" :key="item.id" class="grouped-table-row"
          :class="{ selected: selectedIdSet.has(item.id), cutting: clipboardCutIdSet.has(item.id) }"
          @click="emit('item-click', item.id, $event)" @dblclick="emit('open', item)"
          @contextmenu.prevent="emit('item-contextmenu', item, $event)">
          <div class="grouped-cell col-name">
            <img class="table-icon" :src="resolveCabinetItemIconSrc(item)" :alt="item.name" style="margin-right: 10px;" draggable="false" />
            <a-input v-if="isRenaming(item.id)" :value="renamingValue" class="rename-input" size="small" @click.stop
              @update:value="emit('update:renamingValue', $event)" @pressEnter="emit('submit-rename')"
              @blur="emit('submit-rename')" @keydown.esc.stop.prevent="emit('cancel-rename')" />
            <span v-else class="grouped-file-name">{{ item.name }}</span>
          </div>
          <div class="grouped-cell col-create-date">{{ item.createTime }}</div>
          <div class="grouped-cell col-update-date">{{ item.updateTime }}</div>
          <div class="grouped-cell col-type">{{ resolveTypeLabel(item) }}</div>
          <div class="grouped-cell col-size">{{ item.type === 'folder' ? '-' : item.size }}</div>
        </div>
      </div>
    </div>

    <div v-else class="grouped-table">
      <div class="grouped-table-header">
        <div class="col-name">名称</div>
        <div class="col-create-date">创建日期</div>
        <div class="col-update-date">修改日期</div>
        <div class="col-type">类型</div>
        <div class="col-size">大小</div>
      </div>
      <div class="grouped-table-body">
        <div v-for="group in groupedSections" :key="group.key" class="grouped-table-section">
          <div class="grouped-table-group-title">
            <span class="grouped-table-group-arrow">⌄</span>
            <span>{{ group.title }}</span>
          </div>
          <div v-for="item in group.items" :key="item.id" class="grouped-table-row"
          :class="{ selected: selectedIdSet.has(item.id), cutting: clipboardCutIdSet.has(item.id) }"
          @click="emit('item-click', item.id, $event)" @dblclick="emit('open', item)"
            @contextmenu.prevent="emit('item-contextmenu', item, $event)"
        >
            <div class="grouped-cell col-name">
              <img class="table-icon" :src="resolveCabinetItemIconSrc(item)" :alt="item.name" style="margin-right: 10px;" draggable="false" />
              <a-input v-if="isRenaming(item.id)" :value="renamingValue" class="rename-input" size="small" @click.stop
                @update:value="emit('update:renamingValue', $event)" @pressEnter="emit('submit-rename')"
                @blur="emit('submit-rename')" @keydown.esc.stop.prevent="emit('cancel-rename')" />
              <span v-else class="grouped-file-name">{{ item.name }}</span>
            </div>
            <div class="grouped-cell col-create-date">{{ item.createTime }}</div>
            <div class="grouped-cell col-update-date">{{ item.updateTime }}</div>
            <div class="grouped-cell col-type">{{ resolveTypeLabel(item) }}</div>
            <div class="grouped-cell col-size">{{ item.type === 'folder' ? '-' : item.size }}</div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <ul v-if="contextMenu.visible && contextMenu.mode === 'item'" class="context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <li @click="emit('open-menu-action')">打开</li>
      <li @click="emit('copy')">复制</li>
      <li v-if="canManage" @click="emit('cut')">剪切</li>
      <li v-if="canPasteToItemTarget" @click="emit('paste-to-item')">粘贴</li>
      <li v-if="canCustomizeIcons" @click="emit('customize-icon')">自定义图标</li>
      <li v-if="canManage" @click="emit('rename')">重命名</li>
      <li v-if="canManage" @click="emit('delete')">删除</li>
      <li @click="emit('view-property')">属性</li>
    </ul>

    <ul v-if="contextMenu.visible && contextMenu.mode === 'blank'" class="context-menu context-menu-blank"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @click.stop>
      <li v-if="canPasteToCurrentFolder" @click="emit('paste')">粘贴</li>
      <li v-if="canManage" @click="emit('create-item', 'file')">新建文件</li>
      <li v-if="canManage" @click="emit('create-item', 'folder')">新建文件夹</li>
      <li v-if="canManage" @click="emit('upload')">上传</li>
      <li @click="emit('refresh')">刷新</li>
      <li class="with-children">
        <span>排序方式</span>
        <span class="submenu-arrow">›</span>
        <ul class="context-submenu">
          <li @click="emit('change-sort-field', 'manual')"><span class="sort-dot"
              :class="{ active: sortField === 'manual' }"></span>手动排序</li>
          <li @click="emit('change-sort-field', 'name')"><span class="sort-dot"
              :class="{ active: sortField === 'name' }"></span>名称</li>
          <li @click="emit('change-sort-field', 'updateTime')"><span class="sort-dot"
              :class="{ active: sortField === 'updateTime' }"></span>修改日期</li>
          <li @click="emit('change-sort-field', 'ext')"><span class="sort-dot"
              :class="{ active: sortField === 'ext' }"></span>类型</li>
          <li @click="emit('change-sort-field', 'size')"><span class="sort-dot"
              :class="{ active: sortField === 'size' }"></span>大小</li>
          <li class="divider"></li>
          <li @click="emit('change-sort-order', 'asc')"><span class="sort-dot"
              :class="{ active: sortOrder === 'asc' }"></span>递增</li>
          <li @click="emit('change-sort-order', 'desc')"><span class="sort-dot"
              :class="{ active: sortOrder === 'desc' }"></span>递减</li>
        </ul>
      </li>
      <li class="with-children">
        <span>分组方式</span>
        <span class="submenu-arrow">›</span>
        <ul class="context-submenu">
          <li @click="emit('change-group-field', 'none')"><span class="sort-dot"
              :class="{ active: groupField === 'none' }"></span>无</li>
          <li @click="emit('change-group-field', 'name')"><span class="sort-dot"
              :class="{ active: groupField === 'name' }"></span>名称</li>
          <li @click="emit('change-group-field', 'updateTime')"><span class="sort-dot"
              :class="{ active: groupField === 'updateTime' }"></span>修改日期</li>
          <li @click="emit('change-group-field', 'type')"><span class="sort-dot"
              :class="{ active: groupField === 'type' }"></span>类型</li>
          <li @click="emit('change-group-field', 'size')"><span class="sort-dot"
              :class="{ active: groupField === 'size' }"></span>大小</li>
        </ul>
      </li>
      <li class="with-children">
        <span>视图模式</span>
        <span class="submenu-arrow">›</span>
        <ul class="context-submenu">
          <li @click="emit('change-view-mode', 'grid')"><span class="sort-dot"
              :class="{ active: viewMode === 'grid' }"></span>图标视图</li>
          <li @click="emit('change-view-mode', 'table')"><span class="sort-dot"
              :class="{ active: viewMode === 'table' }"></span>列表视图</li>
        </ul>
      </li>
    </ul>

    <a-modal :open="propertyModalVisible" title="属性" :footer="null" width="420px"
      @update:open="emit('update:propertyModalVisible', $event)">
      <div v-if="propertyItem" class="property-content">
        <div><span>名称：</span>{{ propertyItem.name }}</div>
        <div><span>类型：</span>{{ propertyItem.type === 'folder' ? '文件夹' : `文件(${propertyItem.ext})` }}</div>
        <div><span>大小：</span>{{ propertyItem.type === 'folder' ? '-' : propertyItem.size }}</div>
        <div><span>创建时间：</span>{{ propertyItem.createTime }}</div>
        <div><span>修改时间：</span>{{ propertyItem.updateTime }}</div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import Draggable from 'vuedraggable';
import { ref } from 'vue';
import type { PropType } from 'vue';
import type { BreadcrumbItem, CabinetItem, GridIconSize, GroupField, GroupSection, ItemType, SortField, SortOrder, ViewMode } from '../types';
import { resolveCabinetItemIconSrc, resolveTypeLabel } from '../utils';
import FileItem from './FileItem.vue';

// 右侧文件区：负责面包屑、图标/列表展示、右键菜单和属性弹窗。
interface SelectionBox {
  visible: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  mode: 'item' | 'blank';
  targetId: string;
}

// 这里保持“展示组件”定位，所有状态变更都通过 emit 交回主容器处理。
const props = defineProps({
  canManage: { type: Boolean, required: true },
  breadcrumbItems: { type: Array as PropType<BreadcrumbItem[]>, required: true },
  groupedSections: { type: Array as PropType<GroupSection[]>, required: true },
  sortedFilteredFolderItems: { type: Array as PropType<CabinetItem[]>, required: true },
  tableColumns: { type: Array as PropType<Record<string, unknown>[]>, required: true },
  selectedIdSet: { type: Object as PropType<Set<string>>, required: true },
  clipboardCutIdSet: { type: Object as PropType<Set<string>>, required: true },
  selectionBox: { type: Object as PropType<SelectionBox>, required: true },
  contextMenu: { type: Object as PropType<ContextMenuState>, required: true },
  canPasteToCurrentFolder: { type: Boolean, required: true },
  canPasteToItemTarget: { type: Boolean, required: true },
  canCustomizeIcons: { type: Boolean, required: true },
  viewMode: { type: String as PropType<ViewMode>, required: true },
  gridIconSize: { type: String as PropType<GridIconSize>, required: true },
  sortField: { type: String as PropType<SortField>, required: true },
  sortOrder: { type: String as PropType<SortOrder>, required: true },
  groupField: { type: String as PropType<GroupField>, required: true },
  renamingValue: { type: String, required: true },
  propertyModalVisible: { type: Boolean, required: true },
  propertyItem: { type: Object as PropType<CabinetItem | null>, default: null },
  isRenaming: { type: Function as PropType<(itemId: string) => boolean>, required: true },
  buildTableRowEvent: { type: Function as PropType<(record: CabinetItem) => Record<string, unknown>>, required: true },
  buildTableRowClass: { type: Function as PropType<(record: CabinetItem) => string>, required: true },
  setFilePanelRef: { type: Function as PropType<(el: Element | null) => void>, required: true },
  setGridPanelRef: { type: Function as PropType<(el: Element | null) => void>, required: true },
});

const emit = defineEmits<{
  (e: 'hide-context-menu'): void;
  (e: 'blank-contextmenu', event: MouseEvent): void;
  (e: 'enter-folder', folderId: string): void;
  (e: 'grid-blank-mousedown', event: MouseEvent): void;
  (e: 'grid-order-change', group: GroupSection, nextItems: CabinetItem[]): void;
  (e: 'item-click', itemId: string, event: MouseEvent): void;
  (e: 'open', item: CabinetItem): void;
  (e: 'item-contextmenu', item: CabinetItem, event: MouseEvent): void;
  (e: 'update:renamingValue', value: string): void;
  (e: 'submit-rename'): void;
  (e: 'cancel-rename'): void;
  (e: 'open-menu-action'): void;
  (e: 'copy'): void;
  (e: 'cut'): void;
  (e: 'paste'): void;
  (e: 'paste-to-item'): void;
  (e: 'customize-icon'): void;
  (e: 'rename'): void;
  (e: 'delete'): void;
  (e: 'view-property'): void;
  (e: 'create-item', type: ItemType): void;
  (e: 'upload'): void;
  (e: 'refresh'): void;
  (e: 'change-sort-field', value: SortField): void;
  (e: 'change-sort-order', value: SortOrder): void;
  (e: 'change-group-field', value: GroupField): void;
  (e: 'change-view-mode', value: ViewMode): void;
  (e: 'update:propertyModalVisible', value: boolean): void;
  (e: 'upload-drop', dataTransfer: DataTransfer): void;
}>();

const uploadDragOver = ref(false);

const hasFilePayload = (event: DragEvent) => Boolean(event.dataTransfer?.types?.includes('Files'));

const handleUploadDragEnter = (event: DragEvent) => {
  if (!props.canManage || !hasFilePayload(event)) {
    return;
  }
  uploadDragOver.value = true;
};

const handleUploadDragLeave = (event: DragEvent) => {
  if (!props.canManage) {
    return;
  }
  const zone = event.currentTarget as HTMLElement;
  const related = event.relatedTarget as Node | null;
  if (related && zone.contains(related)) {
    return;
  }
  uploadDragOver.value = false;
};

const handleUploadDragOver = (event: DragEvent) => {
  if (!props.canManage || !hasFilePayload(event)) {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleUploadDrop = (event: DragEvent) => {
  if (!props.canManage || !hasFilePayload(event)) {
    return;
  }
  uploadDragOver.value = false;
  event.preventDefault();
  if (event.dataTransfer) {
    emit('upload-drop', event.dataTransfer);
  }
};

const sameGroupSortArmed = ref(false);
const sameGroupSortHoverKey = ref('');
const sameGroupSortTimer = ref<number | null>(null);

const clearSameGroupSortTimer = () => {
  if (sameGroupSortTimer.value) {
    clearTimeout(sameGroupSortTimer.value);
    sameGroupSortTimer.value = null;
  }
};

const resetSameGroupSortArm = () => {
  clearSameGroupSortTimer();
  sameGroupSortArmed.value = false;
  sameGroupSortHoverKey.value = '';
};

type DraggableMoveEvent = {
  from?: HTMLElement;
  to?: HTMLElement;
  related?: HTMLElement | null;
  draggedContext?: { futureIndex?: number; element?: CabinetItem };
  relatedContext?: { index?: number; element?: CabinetItem };
  willInsertAfter?: boolean;
  originalEvent?: MouseEvent;
};

const handleGridDragMove = (evt: DraggableMoveEvent) => {
  if (!props.canManage || props.sortField !== 'manual') {
    return false;
  }

  // 跨分组拖动：保持现有行为（立即允许排序/插入）。
  if (evt.from && evt.to && evt.from !== evt.to) {
    return true;
  }

  // 同组拖动：默认不触发排序，只有停在“两个项之间”的区域一会儿才启用排序。
  const relatedItem = evt.relatedContext?.element;
  const draggedIndex = evt.draggedContext?.futureIndex ?? -1;
  const relatedIndex = evt.relatedContext?.index ?? -1;
  const insertAfter = !!evt.willInsertAfter;

  // 当鼠标在同组列表里移动到插入位置（两项之间）并“停留”一段时间后，再放开排序。
  // 这里用一个短延时闸门：未闸门开启前返回 false，开启后返回 true（用户通常会有轻微移动触发排序）。
  const hoverKey = `${relatedItem?.id || 'edge'}:${draggedIndex}:${relatedIndex}:${insertAfter ? 'after' : 'before'}`;
  if (sameGroupSortArmed.value) {
    return true;
  }

  if (sameGroupSortHoverKey.value !== hoverKey) {
    sameGroupSortHoverKey.value = hoverKey;
    clearSameGroupSortTimer();
    sameGroupSortTimer.value = window.setTimeout(() => {
      sameGroupSortArmed.value = true;
      sameGroupSortTimer.value = null;
    }, 320);
  }

  return false;
};
</script>

<style lang="less" scoped>
.cabinet-files {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  overflow: auto;
  background: #ffffff;
}

.cabinet-path {
  margin-bottom: 10px;
  flex-shrink: 0;
  padding: 6px 10px;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 4px;
}

.cabinet-upload-zone {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.cabinet-upload-zone.is-drag-over::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 6;
  border: 2px dashed #4a90ff;
  background: rgb(74 144 255 / 12%);
  border-radius: 6px;
  pointer-events: none;
}

.grid-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 2px 10px;
}

.file-group-title {
  margin: 6px 4px 8px;
  color: #66788a;
  font-size: 12px;
  font-weight: 600;
}

.file-grid {
  display: grid;
  justify-content: start;
  align-content: start;

  &.sortable-disabled {
    cursor: default;
  }
}

.file-drag-ghost {
  opacity: 0.35;
}

.file-drag-chosen,
.file-drag-active {
  .file-item {
    box-shadow: 0 8px 18px rgb(34 92 180 / 22%);
    background: #e8f2ff;
    border-color: #8eb8ff;
  }
}

.file-grid+.file-group-title {
  margin-top: 14px;
}

.file-grid.size-large {
  grid-template-columns: repeat(auto-fill, 112px);
  grid-auto-rows: minmax(118px, auto);
  gap: 8px 10px;
}

.file-grid.size-small {
  grid-template-columns: repeat(auto-fill, 84px);
  grid-auto-rows: minmax(74px, auto);
  gap: 8px;
}

.selection-marquee {
  position: absolute;
  z-index: 10;
  border: 1px solid #4a90ff;
  background: rgb(74 144 255 / 18%);
  pointer-events: none;
}

.file-table {
  :deep(.ant-table-tbody > tr > td) {
    cursor: pointer;
  }

  :deep(.ant-table-tbody > tr.table-row-selected > td) {
    background: #dbe9ff !important;
  }

  :deep(.ant-table-tbody > tr.table-row-cutting > td) {
    opacity: 0.56;
  }

  :deep(.ant-table-tbody > tr.table-row-drop-target > td) {
    background: #e7f1ff !important;
    box-shadow: inset 0 0 0 1px #4a90ff;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: #eef4ff;
  }
}

.grouped-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e6ebf2;
  border-radius: 4px;
  background: #fff;
}

.grouped-table-header,
.grouped-table-row {
  display: grid;
  grid-template-columns: minmax(240px, 1.7fr) 160px 160px 120px 120px;
  align-items: center;
}

.grouped-table-header {
  flex-shrink: 0;
  min-height: 36px;
  color: #526171;
  font-size: 13px;
  background: #fff;
  border-bottom: 1px solid #e6ebf2;

  >div {
    height: 100%;
    padding: 0 10px;
    line-height: 36px;
    border-right: 1px solid #edf1f6;
  }

  >div:last-child {
    border-right: 0;
  }
}

.grouped-table-body {
  flex: 1;
  overflow: auto;
  padding: 6px 0 10px;
}

.grouped-table-section+.grouped-table-section {
  margin-top: 8px;
}

.grouped-table-group-title {
  display: flex;
  align-items: center;
  padding: 2px 10px 4px;
  color: #2f5fb3;
  font-size: 13px;
  line-height: 20px;
}

.grouped-table-group-arrow {
  display: inline-block;
  width: 14px;
  margin-right: 2px;
  color: #61748a;
  font-size: 12px;
}

.grouped-table-row {
  min-height: 28px;
  color: #1f2d3d;
  font-size: 13px;
  cursor: default;
  user-select: none;

  &:hover {
    background: #f2f7ff;
  }

  &.selected {
    background: #dcecff;
  }

  &.cutting {
    opacity: 0.56;
  }

  &.drop-target {
    background: #e7f1ff;
    box-shadow: inset 0 0 0 1px #4a90ff;
  }
}

.grouped-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 10px;
  line-height: 28px;
}

.grouped-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rename-input {
  width: 100%;

  :deep(.ant-input) {
    height: 24px;
    padding: 0 6px;
    font-size: 12px;
  }
}

.table-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.table-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.context-menu {
  position: absolute;
  z-index: 1000;
  width: 140px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d7e2;
  border-radius: 4px;
  box-shadow: 0 8px 20px rgb(15 35 95 / 18%);

  li {
    padding: 8px 12px;
    color: #1f2d3d;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: #e9f2ff;
    }
  }
}

.context-menu-blank {
  width: 186px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .divider {
    min-height: 1px;
    margin: 5px 0;
    padding: 0;
    background: #edf1f6;
    cursor: default;

    &:hover {
      background: #edf1f6;
    }
  }
}

.submenu-arrow {
  margin-left: 16px;
  color: #7b8794;
  font-size: 14px;
}

.with-children:hover>.context-submenu {
  display: block;
}

.context-submenu {
  position: absolute;
  top: -6px;
  left: calc(100% - 6px);
  z-index: 1001;
  display: none;
  width: 176px;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d7e2;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 35 95 / 18%);

  li {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 12px;
    color: #1f2d3d;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: #e9f2ff;
    }
  }

  .sort-dot {
    margin-right: 10px;
  }
}

.sort-dot {
  width: 10px;
  height: 10px;
  margin-right: 12px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;

  &.active {
    background: #4c5560;
  }
}

.property-content {
  line-height: 30px;
  color: #34495e;

  span {
    display: inline-block;
    width: 70px;
    color: #6b7785;
  }
}
</style>
