<!-- 文件柜主容器：负责页面状态、业务编排，以及连接工具栏、目录树和文件区子组件。 -->
<template>
  <div class="cabinet-explorer">
    <CabinetToolbar ref="cabinetToolbarRef" :can-manage="props.canManage" :selected-count="selectedItemIds.length"
      :search-keyword="searchKeyword" :sort-field="sortField" :sort-order="sortOrder" :group-field="groupField"
      :sort-field-label="sortFieldLabel" :sort-order-label="sortOrderLabel" :group-field-label="groupFieldLabel"
      :view-mode="viewMode" :grid-icon-size="gridIconSize" :before-upload="handleToolbarBeforeUpload"
      @create-item="handleCreateItem" @open-upload-progress="uploadProgressOpen = true"
      @delete="handleDelete" @refresh="handleRefresh" @search="handleSearch"
      @update:searchKeyword="searchKeyword = $event" @update:gridIconSize="gridIconSize = $event"
      @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
      @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange" />

    <div class="cabinet-main">
      <CabinetTreePanel :tree-data="treeData" :selected-keys="selectedTreeKeys" @select="handleTreeSelect" />

      <CabinetFilePanel :can-manage="props.canManage" :breadcrumb-items="breadcrumbItems"
        :grouped-sections="groupedSections" :sorted-filtered-folder-items="sortedFilteredFolderItems"
        :table-columns="tableColumns" :selected-id-set="selectedIdSet" :clipboard-cut-id-set="clipboardCutIdSet"
        :selection-box="selectionBox" :context-menu="contextMenu"
        :can-paste-to-current-folder="canPasteToCurrentFolder" :can-paste-to-item-target="canPasteToItemTarget"
        :view-mode="viewMode" :grid-icon-size="gridIconSize" :sort-field="sortField" :sort-order="sortOrder"
        :group-field="groupField" :renaming-value="renamingValue" :property-modal-visible="propertyModalVisible"
        :property-item="propertyItem" :is-renaming="isRenaming" :build-table-row-event="buildTableRowEvent"
        :build-table-row-class="buildTableRowClass" :set-file-panel-ref="setFilePanelRef"
        :set-grid-panel-ref="setGridPanelRef" @hide-context-menu="hideContextMenu"
        @blank-contextmenu="handleBlankContextMenu" @enter-folder="enterFolderById"
        @grid-blank-mousedown="handleGridBlankMouseDown" @grid-order-change="handleGridOrderChange"
        @item-click="handleItemClick" @open="handleOpen" @item-contextmenu="handleItemContextMenu"
        @update:renamingValue="renamingValue = $event" @submit-rename="submitRename" @cancel-rename="cancelRename"
        @open-menu-action="handleOpenMenuAction" @copy="handleCopy" @cut="handleCut" @paste="handlePaste"
        @paste-to-item="handlePasteToItem" @rename="handleRename" @delete="handleDelete"
        @view-property="handleViewProperty" @create-item="handleCreateItem" @upload="handleUpload"
        @refresh="handleRefresh" @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
        @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange"
        @update:propertyModalVisible="propertyModalVisible = $event" @upload-drop="handleUploadDrop" />
    </div>

    <CabinetUploadProgressModal v-model:open="uploadProgressOpen" />
    <CabinetCreateItemModal @register="registerCreateItemModal" @success="handleCreateItemSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useModal } from '/@/components/Modal';
import { createMockCabinetItems } from '../mockData';
import { useCabinetClipboard } from '../composables/useCabinetClipboard';
import { useCabinetComputed } from '../composables/useCabinetComputed';
import { useCabinetSelection } from '../composables/useCabinetSelection';
import { useCabinetUpload } from '../composables/useCabinetUpload';
import { useCabinetUploadTasks } from '../composables/useCabinetUploadTasks';
import type { CabinetItem, ClipboardState, GridIconSize, GroupField, GroupSection, ItemType, SortField, SortOrder, ViewMode } from '../types';
import { buildIndexedSiblingName, formatNow, generateItemId, resolveCabinetFileExt } from '../utils';
import CabinetCreateItemModal from './CabinetCreateItemModal.vue';
import CabinetFilePanel from './CabinetFilePanel.vue';
import CabinetToolbar from './CabinetToolbar.vue';
import CabinetTreePanel from './CabinetTreePanel.vue';
import CabinetUploadProgressModal from './CabinetUploadProgressModal.vue';

// 文件柜主容器：负责状态管理、业务编排，以及把交互事件分发给各个子组件。
interface Props {
  cabinetName?: string;
  canManage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cabinetName: '私柜',
  canManage: true,
});

const itemList = ref<CabinetItem[]>(createMockCabinetItems(props.cabinetName));
const viewMode = ref<ViewMode>('grid');
const gridIconSize = ref<GridIconSize>('large');
const searchKeyword = ref('');
const sortField = ref<SortField>('manual');
const sortOrder = ref<SortOrder>('asc');
const groupField = ref<GroupField>('type');
const currentFolderId = ref('root');
const selectedTreeKeys = ref<string[]>(['root']);
const filePanelRef = ref<HTMLElement | null>(null);
const gridPanelRef = ref<HTMLElement | null>(null);
const cabinetToolbarRef = ref<InstanceType<typeof CabinetToolbar> | null>(null);
const uploadProgressOpen = ref(false);
const propertyModalVisible = ref(false);
const propertyItem = ref<CabinetItem | null>(null);
const renamingItemId = ref('');
const renamingValue = ref('');
const clipboardState = ref<ClipboardState | null>(null);
const canManageRef = computed(() => props.canManage);
const contextMenuTargetId = computed(() => contextMenu.value.targetId);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  mode: 'item' as 'item' | 'blank',
  targetId: '',
});

const tableColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '修改时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '大小', dataIndex: 'size', key: 'size', width: 140 },
  { title: '类型', dataIndex: 'ext', key: 'ext', width: 120 },
];

const setFilePanelRef = (element: Element | null) => {
  filePanelRef.value = element as HTMLElement | null;
};

const setGridPanelRef = (element: Element | null) => {
  gridPanelRef.value = element as HTMLElement | null;
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
  contextMenu.value.mode = 'item';
  contextMenu.value.targetId = '';
};

const cancelRename = () => {
  renamingItemId.value = '';
  renamingValue.value = '';
};

const {
  folderMap,
  sortedFilteredFolderItems,
  groupedSections,
  breadcrumbItems,
  treeData,
  currentVisibleItemIds,
  sortFieldLabel,
  sortOrderLabel,
  groupFieldLabel,
} = useCabinetComputed({
  itemList,
  currentFolderId,
  searchKeyword,
  sortField,
  sortOrder,
  groupField,
  contextMenuTargetId,
  clipboardState,
  canManage: canManageRef,
});

// 选择相关交互：单选、多选、框选、快捷键全选等。
const {
  selectedItemIds,
  selectedIdSet,
  selectionBox,
  clearSelection,
  selectSingleItem,
  handleItemClick,
  handleGridBlankMouseDown,
  handleMarqueeMouseMove,
  handleMarqueeMouseUp,
  handleGlobalKeydown,
} = useCabinetSelection({
  currentVisibleItemIds,
  gridPanelRef,
  renamingItemId,
  canManage: canManageRef,
  hideContextMenu,
  onCopy: () => handleCopy(),
  onCut: () => handleCut(),
  onPaste: () => {
    if (canPasteToCurrentFolder.value) {
      handlePaste();
    }
  },
  onDelete: () => handleDelete(),
});

// 剪贴板相关交互：复制、剪切、粘贴、批量删除。
const {
  clipboardCutIdSet,
  canPasteToCurrentFolder,
  canPasteToItemTarget,
  getItemById,
  handleCopy,
  handleCut,
  handlePaste,
  handlePasteToItem,
  handleDelete,
} = useCabinetClipboard({
  itemList,
  currentFolderId,
  selectedItemIds,
  clipboardState,
  contextMenuTargetId,
  renamingItemId,
  canManage: canManageRef,
  hideContextMenu,
  clearSelection,
  cancelRename,
});

const { ingestDataTransfer, ingestPlainFiles } = useCabinetUpload({
  itemList,
  currentFolderId,
  canManage: canManageRef,
});

const { enqueueFiles, disposeAllTimers } = useCabinetUploadTasks();
const [registerCreateItemModal, { openModal: openCreateItemModal }] = useModal();

const CABINET_UPLOAD_NO_AUTO_POPUP_KEY = 'cabinet-upload-no-auto-popup';

const uploadPickerQueue: File[] = [];
let uploadPickerFlushTimer: ReturnType<typeof setTimeout> | null = null;

/** 与工具栏 a-upload 一致：拦截默认上传，批量写入当前目录（后续可替换为 JUpload 同款服务端上传） */
const handleToolbarBeforeUpload = (file: File) => {
  uploadPickerQueue.push(file);
  if (uploadPickerFlushTimer) {
    clearTimeout(uploadPickerFlushTimer);
  }
  uploadPickerFlushTimer = setTimeout(() => {
    uploadPickerFlushTimer = null;
    const batch = uploadPickerQueue.splice(0, uploadPickerQueue.length);
    if (batch.length) {
      enqueueFiles(batch, currentFolderId.value, (f, pid) => {
        ingestPlainFiles([f], pid, { silent: true });
      });
      if (localStorage.getItem(CABINET_UPLOAD_NO_AUTO_POPUP_KEY) !== '1') {
        uploadProgressOpen.value = true;
      }
    }
  }, 0);
  return false;
};

const isRenaming = (itemId: string) => renamingItemId.value === itemId;

const startRename = (itemId: string) => {
  const target = getItemById(itemId);
  if (!target) {
    return;
  }
  renamingItemId.value = itemId;
  renamingValue.value = target.name;
  selectSingleItem(itemId);
  hideContextMenu();
};

const submitRename = () => {
  const targetId = renamingItemId.value;
  if (!targetId) {
    return;
  }
  const target = getItemById(targetId);
  if (!target) {
    cancelRename();
    return;
  }
  const normalized = renamingValue.value.trim();
  if (!normalized) {
    message.warning('名称不能为空');
    renamingValue.value = target.name;
    return;
  }
  target.name = normalized;
  cancelRename();
  message.success('重命名成功');
};

const enterFolderById = (folderId: string) => {
  if (!folderMap.value.has(folderId)) {
    return;
  }
  cancelRename();
  currentFolderId.value = folderId;
  searchKeyword.value = '';
  selectedTreeKeys.value = [folderId];
  clearSelection();
  hideContextMenu();
};

const handleTreeSelect = (keys: Array<string | number>) => {
  if (!keys.length) {
    return;
  }
  enterFolderById(String(keys[0]));
};

const handleOpen = (item: CabinetItem) => {
  if (item.type === 'folder') {
    enterFolderById(item.id);
    return;
  }
  message.info(`打开文件：${item.name}`);
};

const handleSearch = () => {
  hideContextMenu();
  clearSelection();
};

const handleSortFieldChange = (field: SortField) => {
  sortField.value = field;
  hideContextMenu();
  clearSelection();
};

const handleSortOrderChange = (order: SortOrder) => {
  sortOrder.value = order;
  hideContextMenu();
  clearSelection();
};

const handleGroupFieldChange = (field: GroupField) => {
  groupField.value = field;
  hideContextMenu();
  clearSelection();
};

const handleViewModeChange = (mode: ViewMode) => {
  viewMode.value = mode;
  hideContextMenu();
};

const handleGridOrderChange = (group: GroupSection, nextItems: CabinetItem[]) => {
  if (!nextItems.length) {
    return;
  }
  // 手动排序时仅更新当前分组内的顺序号，保持同目录其它分组顺序稳定。
  const step = 10;
  nextItems.forEach((item, index) => {
    const currentItem = getItemById(item.id);
    if (currentItem) {
      currentItem.orderNo = (index + 1) * step;
    }
  });
  if (groupField.value !== 'none') {
    const otherItems = itemList.value
      .filter((item) => item.parentId === currentFolderId.value && group.items.every((groupItem) => groupItem.id !== item.id))
      .sort((left, right) => left.orderNo - right.orderNo);
    otherItems.forEach((item, index) => {
      const currentItem = getItemById(item.id);
      if (currentItem) {
        currentItem.orderNo = 1000 + index * step;
      }
    });
  }
};

const handleItemContextMenu = (item: CabinetItem, event: MouseEvent) => {
  event.stopPropagation();
  if (!selectedIdSet.value.has(item.id)) {
    selectSingleItem(item.id);
  }
  showContextMenu(event, 'item', item.id);
};

const handleBlankContextMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest('.file-item') || target.closest('.grouped-table-row') || target.closest('.ant-table-row')) {
    return;
  }
  clearSelection();
  showContextMenu(event, 'blank');
};

const handleOpenMenuAction = () => {
  const target = getItemById(contextMenu.value.targetId);
  if (!target) {
    hideContextMenu();
    return;
  }
  handleOpen(target);
  hideContextMenu();
};

const handleRename = () => {
  if (!props.canManage) {
    hideContextMenu();
    return;
  }
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  startRename(targetId);
};

const handleViewProperty = () => {
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  const target = getItemById(targetId);
  if (!target) {
    hideContextMenu();
    return;
  }
  propertyItem.value = target;
  propertyModalVisible.value = true;
  hideContextMenu();
};

const handleUpload = () => {
  if (!props.canManage) {
    message.warning('当前页面无上传权限');
    hideContextMenu();
    return;
  }
  hideContextMenu();
  cabinetToolbarRef.value?.openUploadDialog?.();
};

const handleUploadDrop = async (dataTransfer: DataTransfer) => {
  hideContextMenu();
  await ingestDataTransfer(dataTransfer);
};

const handleRefresh = () => {
  message.success('已刷新');
  hideContextMenu();
};

// 默认名统一基于当前目录全部同级名称生成，避免文件与文件夹重名。
const buildCreateItemDefaultName = (type: ItemType) => {
  const siblingNames = itemList.value
    .filter((item) => item.parentId === currentFolderId.value)
    .map((item) => item.name);
  const baseName = type === 'folder' ? '新建文件夹' : '新建文件.txt';
  return {
    siblingNames,
    defaultName: buildIndexedSiblingName(baseName, siblingNames),
  };
};

const handleCreateItem = (type: ItemType) => {
  if (!props.canManage) {
    message.warning('当前页面无新建权限');
    hideContextMenu();
    return;
  }
  const { defaultName, siblingNames } = buildCreateItemDefaultName(type);
  cancelRename();
  hideContextMenu();
  openCreateItemModal(true, {
    type,
    defaultName,
    siblingNames,
  });
};

const handleCreateItemSuccess = ({ type, name }: { type: ItemType; name: string }) => {
  const now = formatNow();
  const id = generateItemId(type);
  // 新建结果在这里统一落库，保持工具栏、右键菜单等入口行为一致。
  itemList.value.push({
    id,
    name,
    type,
    size: type === 'folder' ? '-' : '0 B',
    createTime: now,
    updateTime: now,
    ext: type === 'folder' ? 'folder' : resolveCabinetFileExt(name),
    orderNo: Date.now(),
    parentId: currentFolderId.value,
  });
  selectSingleItem(id);
  message.success(type === 'folder' ? '文件夹已创建' : '文件已创建');
};

const showContextMenu = (event: MouseEvent, mode: 'item' | 'blank', itemId = '') => {
  contextMenu.value.mode = mode;
  contextMenu.value.targetId = itemId;
  if (!filePanelRef.value) {
    return;
  }
  const rect = filePanelRef.value.getBoundingClientRect();
  const menuWidth = mode === 'blank' ? 186 : 140;
  const menuHeight = mode === 'blank' ? 262 : 140;
  let left = event.clientX - rect.left + filePanelRef.value.scrollLeft;
  let top = event.clientY - rect.top + filePanelRef.value.scrollTop;
  const maxLeft = filePanelRef.value.clientWidth - menuWidth - 8;
  const maxTop = filePanelRef.value.clientHeight - menuHeight - 8;
  left = Math.max(8, Math.min(left, maxLeft));
  top = Math.max(8, Math.min(top, maxTop));
  contextMenu.value.visible = true;
  contextMenu.value.x = left;
  contextMenu.value.y = top;
};

const buildTableRowEvent = (record: CabinetItem) => ({
  draggable: false,
  onClick: (event: MouseEvent) => handleItemClick(record.id, event),
  onDblclick: () => handleOpen(record),
  onContextmenu: (event: MouseEvent) => {
    event.preventDefault();
    handleItemContextMenu(record, event);
  },
});

const buildTableRowClass = (record: CabinetItem) =>
  [
    selectedIdSet.value.has(record.id) ? 'table-row-selected' : '',
    clipboardCutIdSet.value.has(record.id) ? 'table-row-cutting' : '',
  ]
    .filter(Boolean)
    .join(' ');

const handleGlobalClick = () => {
  hideContextMenu();
};

onMounted(() => {
  window.addEventListener('click', handleGlobalClick);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  disposeAllTimers();
  window.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('mousemove', handleMarqueeMouseMove);
  window.removeEventListener('mouseup', handleMarqueeMouseUp);
});
</script>

<style lang="less" scoped>
.cabinet-explorer {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 620px;
  background: #f4f6fa;
  border: 1px solid #d9e0ea;
  border-radius: 6px;
  overflow: hidden;
}

.cabinet-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

</style>
