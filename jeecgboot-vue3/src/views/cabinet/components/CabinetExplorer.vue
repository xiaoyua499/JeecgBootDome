<!-- 文件柜主容器：负责页面状态、业务编排，以及连接工具栏、目录树和文件区子组件。 -->
<template>
  <div class="cabinet-explorer">
    <CabinetToolbar ref="cabinetToolbarRef" :can-manage="canManageRef" :selected-count="selectedItemIds.length"
      :search-keyword="searchKeyword" :sort-field="sortField" :sort-order="sortOrder" :group-field="groupField"
      :sort-field-label="sortFieldLabel" :sort-order-label="sortOrderLabel" :group-field-label="groupFieldLabel"
      :view-mode="viewMode" :grid-icon-size="gridIconSize" :before-upload="handleToolbarBeforeUpload"
      @create-item="handleCreateItem" @open-upload-progress="uploadProgressOpen = true"
      @delete="handleDelete" @refresh="handleRefresh" @search="handleSearch"
      @update:searchKeyword="searchKeyword = $event" @update:gridIconSize="handleGridIconSizeChange"
      @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
      @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange" />

    <div class="cabinet-main">
      <CabinetTreePanel :tree-data="treeData" :selected-keys="selectedTreeKeys" @select="handleTreeSelect" />

    <CabinetFilePanel :can-manage="canManageRef" :breadcrumb-items="breadcrumbItems"
        :grouped-sections="groupedSections" :sorted-filtered-folder-items="sortedFilteredFolderItems"
        :table-columns="tableColumns" :selected-id-set="selectedIdSet" :clipboard-cut-id-set="clipboardCutIdSet"
        :selection-box="selectionBox" :context-menu="contextMenu" :context-menu-target-item="contextMenuTargetItem"
        :can-paste-to-current-folder="canPasteToCurrentFolder" :can-paste-to-item-target="canPasteToItemTarget"
        :can-customize-icons="canCustomizeIcons"
        :view-mode="viewMode" :grid-icon-size="gridIconSize" :sort-field="sortField" :sort-order="sortOrder"
        :group-field="groupField" :renaming-value="renamingValue" :property-modal-visible="propertyModalVisible"
        :property-item="propertyItem" :is-renaming="isRenaming" :build-table-row-event="buildTableRowEvent"
        :build-table-row-class="buildTableRowClass" :set-file-panel-ref="setFilePanelRef"
        :set-grid-panel-ref="setGridPanelRef" @hide-context-menu="hideContextMenu"
        @blank-contextmenu="handleBlankContextMenu" @enter-folder="enterFolderById"
        @grid-blank-mousedown="handleGridBlankMouseDown" @grid-order-change="handleGridOrderChange"
        @item-click="handleItemClick" @open="handleOpen" @item-contextmenu="handleItemContextMenu"
        @update:renamingValue="renamingValue = $event" @submit-rename="submitRename" @cancel-rename="cancelRename"
        @open-menu-action="handleOpenMenuAction" @preview="handlePreviewMenuAction" @copy="handleCopy" @cut="handleCut" @paste="handlePaste"
        @paste-to-item="handlePasteToItem" @customize-icon="handleCustomizeIcon" @rename="handleRename" @delete="handleDelete"
        @view-property="handleViewProperty" @create-item="handleCreateItem" @upload="handleUpload"
        @refresh="handleRefresh" @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
        @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange"
        @update:propertyModalVisible="propertyModalVisible = $event" @upload-drop="handleUploadDrop" />
    </div>

    <CabinetUploadProgressModal v-model:open="uploadProgressOpen" />
    <CabinetCreateItemModal @register="registerCreateItemModal" @success="handleCreateItemSuccess" />
    <CabinetCustomizeIconModal @register="registerCustomizeIconModal" @success="handleCustomizeIconSuccess" />
    <CabinetPreviewModal v-model:open="previewModalVisible" :item="previewItem" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useModal } from '/@/components/Modal';
import { createImgPreview } from '/@/components/Preview/index';
import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import { adaptCabinetBootstrap, adaptCabinetItem, CABINET_ROOT_ID } from '../adapter';
import {
  bootstrapCabinet,
  copyCabinetItems,
  createCabinetFile,
  createCabinetFolder,
  deleteCabinetItems,
  fetchCabinetFolderView,
  fetchCabinetPreference,
  moveCabinetItems,
  renameCabinetItem,
  updateCabinetIcon,
  updateCabinetItemOrder,
  updateCabinetPreference,
  uploadCabinetBinary,
} from '../cabinet.api';
import { useCabinetClipboard } from '../composables/useCabinetClipboard';
import { useCabinetComputed } from '../composables/useCabinetComputed';
import { useCabinetSelection } from '../composables/useCabinetSelection';
import { type CabinetUploadEntry, useCabinetUpload } from '../composables/useCabinetUpload';
import { useCabinetUploadTasks } from '../composables/useCabinetUploadTasks';
import type { CabinetItem, CabinetScope, ClipboardState, GridIconSize, GroupField, GroupSection, ItemType, SortField, SortOrder, ViewMode } from '../types';
import { buildIndexedSiblingName, buildSiblingName, isCabinetImageExt, resolveCabinetFileExt } from '../utils';
import CabinetCreateItemModal from './CabinetCreateItemModal.vue';
import CabinetCustomizeIconModal from './CabinetCustomizeIconModal.vue';
import CabinetFilePanel from './CabinetFilePanel.vue';
import CabinetPreviewModal from './CabinetPreviewModal.vue';
import CabinetToolbar from './CabinetToolbar.vue';
import CabinetTreePanel from './CabinetTreePanel.vue';
import CabinetUploadProgressModal from './CabinetUploadProgressModal.vue';

// 文件柜主容器：负责状态管理、业务编排，以及把交互事件分发给各个子组件。
interface Props {
  cabinetName?: string;
  canManage?: boolean;
  scope?: CabinetScope;
}

const props = withDefaults(defineProps<Props>(), {
  cabinetName: '私柜',
  canManage: true,
  scope: 'private',
});

const itemList = ref<CabinetItem[]>(adaptCabinetBootstrap({ scope: props.scope, canManage: props.canManage, items: [] }, props.cabinetName));
const viewMode = ref<ViewMode>('grid');
const gridIconSize = ref<GridIconSize>('large');
const searchKeyword = ref('');
const sortField = ref<SortField>('manual');
const sortOrder = ref<SortOrder>('asc');
const groupField = ref<GroupField>('none');
const currentFolderId = ref(CABINET_ROOT_ID);
const selectedTreeKeys = ref<string[]>([CABINET_ROOT_ID]);
const filePanelRef = ref<HTMLElement | null>(null);
const gridPanelRef = ref<HTMLElement | null>(null);
const cabinetToolbarRef = ref<InstanceType<typeof CabinetToolbar> | null>(null);
const uploadProgressOpen = ref(false);
const propertyModalVisible = ref(false);
const propertyItem = ref<CabinetItem | null>(null);
const previewModalVisible = ref(false);
const previewItem = ref<CabinetItem | null>(null);
const renamingItemId = ref('');
const renamingValue = ref('');
const clipboardState = ref<ClipboardState | null>(null);
const canManageState = ref<boolean>(props.canManage);
const canManageRef = computed(() => canManageState.value);
const canCustomizeIcons = computed(() => props.scope === 'private' && canManageRef.value);
const contextMenuTargetId = computed(() => contextMenu.value.targetId);
const contextMenuTargetItem = computed(() => itemList.value.find((item) => item.id === contextMenu.value.targetId) || null);

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

const resolveApiParentId = (folderId: string) => (folderId === CABINET_ROOT_ID ? null : folderId);

interface CabinetViewPreferenceState {
  viewMode: ViewMode;
  gridIconSize: GridIconSize;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
}

const getCurrentViewPreference = (): CabinetViewPreferenceState => ({
  viewMode: viewMode.value,
  gridIconSize: gridIconSize.value,
  sortField: sortField.value,
  sortOrder: sortOrder.value,
  groupField: groupField.value,
});

const applyViewPreference = (preference: CabinetViewPreferenceState) => {
  viewMode.value = preference.viewMode;
  gridIconSize.value = preference.gridIconSize;
  sortField.value = preference.sortField;
  sortOrder.value = preference.sortOrder;
  groupField.value = preference.groupField;
};

const mergeFolderViewItems = (items: Parameters<typeof adaptCabinetItem>[0][]) => {
  if (!items.length) {
    return;
  }
  const nextItemMap = new Map(items.map((item) => {
    const adapted = adaptCabinetItem(item);
    return [adapted.id, adapted] as const;
  }));
  itemList.value = itemList.value.map((item) => {
    const nextItem = nextItemMap.get(item.id);
    return nextItem ? { ...item, ...nextItem } : item;
  });
};

const loadViewPreference = async () => {
  const result = await fetchCabinetPreference(props.scope);
  applyViewPreference({
    viewMode: result.viewMode,
    gridIconSize: result.gridIconSize,
    sortField: result.sortField,
    sortOrder: result.sortOrder,
    groupField: result.groupField,
  });
};

const persistViewPreference = async () => {
  await updateCabinetPreference({
    scope: props.scope,
    viewMode: viewMode.value,
    gridIconSize: gridIconSize.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    groupField: groupField.value,
  });
};

const syncFolderView = async (options?: { showError?: boolean }) => {
  try {
    const result = await fetchCabinetFolderView({
      scope: props.scope,
      parentId: resolveApiParentId(currentFolderId.value),
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      groupField: groupField.value,
    });
    mergeFolderViewItems(result.items);
    canManageState.value = result.canManage;
  } catch (error) {
    if (options?.showError) {
      message.error('排序/分组视图加载失败');
    }
    throw error;
  }
};

const savePreferenceAndSyncFolderView = async (
  nextPreference: Partial<CabinetViewPreferenceState>,
  options?: { showError?: boolean },
) => {
  const previousPreference = getCurrentViewPreference();
  applyViewPreference({
    ...previousPreference,
    ...nextPreference,
  });
  hideContextMenu();
  clearSelection();
  try {
    await persistViewPreference();
    await syncFolderView(options);
  } catch (error) {
    applyViewPreference(previousPreference);
  }
};

const savePreferenceAndApplyLocally = async (
  nextPreference: Partial<CabinetViewPreferenceState>,
  options?: { showError?: boolean },
) => {
  const previousPreference = getCurrentViewPreference();
  applyViewPreference({
    ...previousPreference,
    ...nextPreference,
  });
  hideContextMenu();
  try {
    await persistViewPreference();
  } catch (error) {
    applyViewPreference(previousPreference);
    if (options?.showError) {
      message.error('视图偏好保存失败');
    }
  }
};

const reloadBootstrap = async (options?: { silent?: boolean }) => {
  try {
    const previousFolderId = currentFolderId.value;
    const activePropertyItemId = propertyItem.value?.id || '';
    const activePreviewItemId = previewItem.value?.id || '';
    const result = await bootstrapCabinet(props.scope);
    const nextItemList = adaptCabinetBootstrap(result, props.cabinetName);
    itemList.value = nextItemList;
    canManageState.value = result.canManage;

    const targetFolderExists = nextItemList.some((item) => item.type === 'folder' && item.id === previousFolderId);
    currentFolderId.value = targetFolderExists ? previousFolderId : CABINET_ROOT_ID;
    selectedTreeKeys.value = [currentFolderId.value];

    if (activePropertyItemId) {
      propertyItem.value = nextItemList.find((item) => item.id === activePropertyItemId) || null;
      if (!propertyItem.value) {
        propertyModalVisible.value = false;
      }
    }

    if (activePreviewItemId) {
      previewItem.value = nextItemList.find((item) => item.id === activePreviewItemId) || null;
      if (!previewItem.value) {
        previewModalVisible.value = false;
      }
    }

    cancelRename();
    hideContextMenu();
    clearSelection();
    await syncFolderView();

    if (!options?.silent) {
      message.success('已刷新');
    }
  } catch (error) {}
};

const initializeCabinet = async () => {
  try {
    await loadViewPreference();
  } catch (error) {}
  await reloadBootstrap({ silent: true });
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
  onMoveItems: async (itemIds, targetFolderId) => {
    await moveCabinetItems({ itemIds, targetParentId: resolveApiParentId(targetFolderId) });
    await reloadBootstrap({ silent: true });
  },
  onCopyItems: async (itemIds, targetFolderId) => {
    await copyCabinetItems({ itemIds, targetParentId: resolveApiParentId(targetFolderId) });
    await reloadBootstrap({ silent: true });
  },
  onDeleteItems: async (itemIds) => {
    await deleteCabinetItems(itemIds);
    await reloadBootstrap({ silent: true });
  },
});

const { ingestDataTransfer, ingestPlainFiles } = useCabinetUpload({
  currentFolderId,
  canManage: canManageRef,
});

const { enqueueTasks, disposeAllTimers } = useCabinetUploadTasks();
const [registerCreateItemModal, { openModal: openCreateItemModal }] = useModal();
const [registerCustomizeIconModal, { openModal: openCustomizeIconModal }] = useModal();

const CABINET_UPLOAD_NO_AUTO_POPUP_KEY = 'cabinet-upload-no-auto-popup';
const uploadFolderAliasMap = new Map<string, string>();

const uploadPickerQueue: File[] = [];
let uploadPickerFlushTimer: ReturnType<typeof setTimeout> | null = null;

const openUploadProgressIfNeeded = () => {
  if (localStorage.getItem(CABINET_UPLOAD_NO_AUTO_POPUP_KEY) !== '1') {
    uploadProgressOpen.value = true;
  }
};

const buildFolderAliasKey = (parentId: string, folderName: string) => `${parentId}::${folderName.trim() || '未命名文件夹'}`;

const appendOptimisticItem = (createdItem: Parameters<typeof adaptCabinetItem>[0]) => {
  const nextItem = adaptCabinetItem(createdItem);
  if (itemList.value.some((item) => item.id === nextItem.id)) {
    return nextItem;
  }
  itemList.value.push(nextItem);
  return nextItem;
};

const collectSiblingNames = (parentId: string) =>
  itemList.value
    .filter((item) => item.parentId === parentId)
    .map((item) => item.name);

const ensureUploadFolder = async (parentId: string, folderName: string, signal: AbortSignal) => {
  const normalizedName = folderName.trim() || '未命名文件夹';
  const aliasKey = buildFolderAliasKey(parentId, normalizedName);
  const aliasedFolderId = uploadFolderAliasMap.get(aliasKey);
  if (aliasedFolderId && itemList.value.some((item) => item.id === aliasedFolderId)) {
    return aliasedFolderId;
  }
  uploadFolderAliasMap.delete(aliasKey);
  const existingFolder = itemList.value.find(
    (item) => item.parentId === parentId && item.type === 'folder' && item.name === normalizedName,
  );
  if (existingFolder) {
    uploadFolderAliasMap.set(aliasKey, existingFolder.id);
    return existingFolder.id;
  }
  const uniqueName = buildSiblingName(normalizedName, collectSiblingNames(parentId));
  const createdFolder = await createCabinetFolder(
    {
      scope: props.scope,
      parentId: resolveApiParentId(parentId),
      name: uniqueName,
    },
    { signal },
  );
  const nextFolder = appendOptimisticItem(createdFolder);
  uploadFolderAliasMap.set(aliasKey, nextFolder.id);
  return nextFolder.id;
};

const ensureUploadFolderPath = async (baseParentId: string, relativeFolders: string[], signal: AbortSignal) => {
  let cursorParentId = baseParentId;
  for (const segment of relativeFolders) {
    cursorParentId = await ensureUploadFolder(cursorParentId, segment, signal);
  }
  return cursorParentId;
};

const resolveUploadTaskName = (entry: CabinetUploadEntry) =>
  entry.relativeFolders.length ? `${entry.relativeFolders.join('/')}/${entry.fileName}` : entry.fileName;

const uploadCabinetEntry = async (
  entry: CabinetUploadEntry,
  context: { signal: AbortSignal; setProgress: (progress: number) => void },
) => {
  const targetParentId = await ensureUploadFolderPath(entry.parentId, entry.relativeFolders, context.signal);
  const fileName = buildSiblingName(entry.fileName, collectSiblingNames(targetParentId));
  const uploadResult = await uploadCabinetBinary(entry.file, 'cabinet/file', {
    signal: context.signal,
    onProgress: (progress) => {
      context.setProgress(progress * 0.92);
    },
  });
  if (!uploadResult?.message) {
    throw new Error('文件上传失败');
  }
  context.setProgress(96);
  await createCabinetFile(
    {
      scope: props.scope,
      parentId: resolveApiParentId(targetParentId),
      name: fileName,
      filePath: uploadResult.message,
      sizeBytes: entry.file.size,
      ext: resolveCabinetFileExt(fileName, 'file'),
    },
    { signal: context.signal },
  );
  context.setProgress(100);
  await reloadBootstrap({ silent: true });
};

const enqueueUploadEntries = (entries: CabinetUploadEntry[]) => {
  if (!entries.length) {
    return;
  }
  enqueueTasks(
    entries.map((entry) => ({
      fileName: resolveUploadTaskName(entry),
      run: ({ signal, setProgress }) => uploadCabinetEntry(entry, { signal, setProgress }),
    })),
  );
  openUploadProgressIfNeeded();
  message.success(entries.length === 1 ? '上传任务已开始' : `已加入 ${entries.length} 个上传任务`);
};

/** 与工具栏 a-upload 一致：拦截默认上传，批量排入真实上传队列。 */
const handleToolbarBeforeUpload = (file: File) => {
  uploadPickerQueue.push(file);
  if (uploadPickerFlushTimer) {
    clearTimeout(uploadPickerFlushTimer);
  }
  uploadPickerFlushTimer = setTimeout(() => {
    uploadPickerFlushTimer = null;
    const batch = uploadPickerQueue.splice(0, uploadPickerQueue.length);
    enqueueUploadEntries(ingestPlainFiles(batch, currentFolderId.value));
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

const submitRename = async () => {
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
  if (normalized === target.name) {
    cancelRename();
    return;
  }
  try {
    await renameCabinetItem({ id: targetId, name: normalized });
    cancelRename();
    await reloadBootstrap({ silent: true });
    message.success('重命名成功');
  } catch (error) {}
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
  void syncFolderView();
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
  if (item.filePath && isCabinetImageExt(item.ext)) {
    previewModalVisible.value = false;
    previewItem.value = null;
    createImgPreview({
      imageList: [getFileAccessHttpUrl(item.filePath)],
      index: 0,
      defaultWidth: 700,
      rememberState: true,
    });
    hideContextMenu();
    return;
  }
  previewItem.value = item;
  previewModalVisible.value = true;
  hideContextMenu();
};

const handleSearch = () => {
  hideContextMenu();
  clearSelection();
};

const handleSortFieldChange = (field: SortField) => {
  void savePreferenceAndSyncFolderView({ sortField: field }, { showError: true });
};

const handleSortOrderChange = (order: SortOrder) => {
  void savePreferenceAndSyncFolderView({ sortOrder: order }, { showError: true });
};

const handleGroupFieldChange = (field: GroupField) => {
  void savePreferenceAndSyncFolderView({ groupField: field }, { showError: true });
};

const handleViewModeChange = (mode: ViewMode) => {
  void savePreferenceAndApplyLocally({ viewMode: mode }, { showError: true });
};

const handleGridIconSizeChange = (size: GridIconSize) => {
  void savePreferenceAndApplyLocally({ gridIconSize: size }, { showError: true });
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
  void (async () => {
    try {
      const currentFolderItems = itemList.value
        .filter((item) => item.parentId === currentFolderId.value)
        .sort((left, right) => left.orderNo - right.orderNo);
      await updateCabinetItemOrder({
        parentId: resolveApiParentId(currentFolderId.value),
        itemOrders: currentFolderItems.map((item) => ({
          id: item.id,
          sortNo: item.orderNo,
        })),
      });
      await syncFolderView();
    } catch (error) {
      await reloadBootstrap({ silent: true });
      message.error('手动排序保存失败');
    }
  })();
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

const handlePreviewMenuAction = () => {
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  const target = getItemById(targetId);
  if (!target || target.type !== 'file') {
    hideContextMenu();
    return;
  }
  handleOpen(target);
};

const handleRename = () => {
  if (!canManageRef.value) {
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

const handleCustomizeIcon = () => {
  if (!canCustomizeIcons.value) {
    hideContextMenu();
    return;
  }
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  const target = getItemById(targetId);
  hideContextMenu();
  if (target) {
    openCustomizeIconModal(true, { item: { ...target } });
  }
};

const handleCustomizeIconSuccess = ({
  itemId,
  iconKey,
  customIconFile,
  customIconPath,
}: {
  itemId: string;
  iconKey?: string;
  customIconFile?: File;
  customIconPath?: string;
}) => {
  void (async () => {
    try {
      const uploadedCustomIconPath = customIconFile
        ? (await uploadCabinetBinary(customIconFile, 'cabinet/icon')).message
        : customIconPath;
      await updateCabinetIcon({ id: itemId, iconKey, customIconPath: uploadedCustomIconPath });
      await reloadBootstrap({ silent: true });
      message.success('图标已更新');
    } catch (error) {}
  })();
};

const handleUpload = () => {
  if (!canManageRef.value) {
    message.warning('当前页面无上传权限');
    hideContextMenu();
    return;
  }
  hideContextMenu();
  cabinetToolbarRef.value?.openUploadDialog?.();
};

const handleUploadDrop = async (dataTransfer: DataTransfer) => {
  hideContextMenu();
  const items = Array.from(dataTransfer.items || []);
  const hasDirectoryEntry = items.some((item) => item.webkitGetAsEntry?.()?.isDirectory);
  if (!hasDirectoryEntry && dataTransfer.files?.length) {
    enqueueUploadEntries(ingestPlainFiles(Array.from(dataTransfer.files), currentFolderId.value));
    return;
  }
  enqueueUploadEntries(await ingestDataTransfer(dataTransfer));
};

const handleRefresh = async () => {
  await reloadBootstrap();
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
  if (!canManageRef.value) {
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

const handleCreateItemSuccess = async ({ type, name }: { type: ItemType; name: string }) => {
  try {
    const parentId = resolveApiParentId(currentFolderId.value);
    const createdItem =
      type === 'folder'
        ? await createCabinetFolder({ scope: props.scope, parentId, name })
        : await createCabinetFile({
            scope: props.scope,
            parentId,
            name,
            ext: resolveCabinetFileExt(name),
            sizeBytes: 0,
          });
    await reloadBootstrap({ silent: true });
    if (createdItem?.id) {
      selectSingleItem(createdItem.id);
    }
    message.success(type === 'folder' ? '文件夹已创建' : '文件已创建');
  } catch (error) {}
};

const showContextMenu = (event: MouseEvent, mode: 'item' | 'blank', itemId = '') => {
  contextMenu.value.mode = mode;
  contextMenu.value.targetId = itemId;
  if (!filePanelRef.value) {
    return;
  }
  const rect = filePanelRef.value.getBoundingClientRect();
  const menuWidth = mode === 'blank' ? 186 : 140;
  const targetItem = itemId ? itemList.value.find((item) => item.id === itemId) || null : null;
  const menuHeight =
    mode === 'blank'
      ? 262
      : (targetItem?.type === 'file' ? 36 : 0) + (canCustomizeIcons.value ? 176 : 140);
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
  void initializeCabinet();
  window.addEventListener('click', handleGlobalClick);
  window.addEventListener('keydown', handleGlobalKeydown);
});

watch(
  () => props.scope,
  () => {
    void initializeCabinet();
  },
);

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
