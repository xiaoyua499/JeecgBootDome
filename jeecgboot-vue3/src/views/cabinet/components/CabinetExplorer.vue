<!-- 文件柜主容器：负责页面状态、业务编排，以及连接工具栏、目录树和文件区子组件。 -->
<template>
  <div class="cabinet-explorer">
    <CabinetToolbar ref="cabinetToolbarRef" :can-manage="canManageRef" :selected-count="selectedItemIds.length"
      :search-keyword="searchKeyword" :sort-field="sortField" :sort-order="sortOrder" :group-field="groupField"
      :sort-field-label="sortFieldLabel" :sort-order-label="sortOrderLabel" :group-field-label="groupFieldLabel"
      :view-mode="viewMode" :grid-icon-size="gridIconSize" :is-custom-group-editing="isEditingCustomGroups"
      :before-upload="handleToolbarBeforeUpload"
      @create-item="handleCreateItem" @open-upload-progress="uploadProgressOpen = true" @download="handleDownload"
      @delete="handleDelete" @refresh="handleRefresh" @search="handleSearch"
      @update:searchKeyword="searchKeyword = $event" @update:gridIconSize="handleGridIconSizeChange"
      @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
      @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange"
      @edit-custom-groups="enterCustomGroupEditMode" @add-custom-group="handleAddCustomGroup"
      @save-custom-groups="handleSaveCustomGroups" @cancel-custom-group-edit="cancelCustomGroupEditMode" />

    <div class="cabinet-main">
      <CabinetTreePanel :tree-data="treeData" :selected-keys="selectedTreeKeys" @select="handleTreeSelect" />

    <CabinetFilePanel :can-manage="canManageRef" :breadcrumb-items="breadcrumbItems"
        :grouped-sections="groupedSections" :sorted-filtered-folder-items="sortedFilteredFolderItems"
        :table-columns="tableColumns" :selected-id-set="selectedIdSet" :clipboard-cut-id-set="clipboardCutIdSet"
        :selection-box="selectionBox" :context-menu="contextMenu" :context-menu-target-item="contextMenuTargetItem"
        :can-paste-to-current-folder="canPasteToCurrentFolder" :can-paste-to-item-target="canPasteToItemTarget"
        :can-customize-icons="canCustomizeIcons" :view-mode="viewMode" :grid-icon-size="gridIconSize"
        :sort-field="sortField" :sort-order="sortOrder" :group-field="groupField" :renaming-value="renamingValue"
        :custom-group-mode="isCustomGroupMode" :custom-group-sections="customGroupSections"
        :custom-groups-empty="customGroupsEmpty" :is-editing-custom-groups="isEditingCustomGroups"
        :editing-custom-group-id="editingCustomGroupId" :editing-custom-group-name="editingCustomGroupName"
        :custom-group-drag-over-id="customGroupDragOverId"
        :property-modal-visible="propertyModalVisible" :property-item="propertyItem" :is-renaming="isRenaming"
        :build-table-row-event="buildTableRowEvent" :build-table-row-class="buildTableRowClass"
        :set-file-panel-ref="setFilePanelRef" :current-page="currentPage" :page-size="pageSize"
        :total-items="totalItems" :set-grid-panel-ref="setGridPanelRef" @hide-context-menu="hideContextMenu"
        @blank-contextmenu="handleBlankContextMenu" @enter-folder="enterFolderById"
        @grid-blank-mousedown="handleGridBlankMouseDown" @grid-order-change="handleGridOrderChange"
        @item-click="handleItemClick" @open="handleOpen" @item-contextmenu="handleItemContextMenu"
        @update:renamingValue="renamingValue = $event" @submit-rename="submitRename" @cancel-rename="cancelRename"
        @open-menu-action="handleOpenMenuAction" @preview="handlePreviewMenuAction" @download="handleDownload"
        @copy="handleCopy" @cut="handleCut" @paste="handlePaste" @paste-to-item="handlePasteToItem"
        @customize-icon="handleCustomizeIcon" @rename="handleRename" @delete="handleDelete"
        @view-property="handleViewProperty" @create-item="handleCreateItem" @upload="handleUpload"
        @refresh="handleRefresh" @change-sort-field="handleSortFieldChange" @change-sort-order="handleSortOrderChange"
        @change-group-field="handleGroupFieldChange" @change-view-mode="handleViewModeChange"
        @update:editingCustomGroupName="editingCustomGroupName = $event"
        @start-custom-group-rename="startCustomGroupRename" @submit-custom-group-rename="submitCustomGroupRename"
        @delete-custom-group="handleDeleteCustomGroup" @custom-group-drag-start="handleCustomGroupDragStart"
        @custom-group-drag-end="handleCustomGroupDragEnd" @custom-group-drag-enter="handleCustomGroupDragEnter"
        @custom-group-drag-over="handleCustomGroupDragOver" @custom-group-drag-leave="handleCustomGroupDragLeave"
        @custom-group-drop="handleCustomGroupDrop" @custom-group-add-file="handleCustomGroupAddFile"
        @remove-file-from-custom-group="handleRemoveFileFromCustomGroup"
        @update:propertyModalVisible="propertyModalVisible = $event" @upload-drop="handleUploadDrop"
        @page-change="handlePageChange" />
    </div>

    <CabinetUploadProgressModal v-model:open="uploadProgressOpen" />
    <CabinetCreateItemModal @register="registerCreateItemModal" @success="handleCreateItemSuccess" />
    <CabinetCustomizeIconModal @register="registerCustomizeIconModal" @success="handleCustomizeIconSuccess" />
    <CabinetPreviewModal v-model:open="previewModalVisible" :item="previewItem" :can-manage="canManageRef" @saved="handlePreviewSaved" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useModal } from '/@/components/Modal';
import { createImgPreview } from '/@/components/Preview/index';
import { useUserStore } from '/@/store/modules/user';
import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import { adaptCabinetBootstrap, adaptCabinetItem, CABINET_ROOT_ID } from '../adapter';
import {
  bootstrapCabinet,
  downloadCabinetItems,
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
import type { CabinetItem, CabinetScope, ClipboardState, CustomGroupItem, CustomGroupSection, GridIconSize, GroupField, GroupSection, ItemType, SortField, SortOrder, ViewMode } from '../types';
import { buildIndexedSiblingName, buildSiblingName, generateItemId, isCabinetImageExt, resolveCabinetFileExt } from '../utils';
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

const CUSTOM_GROUP_STORAGE_KEY_PREFIX = 'cabinet-custom-groups';
const CUSTOM_GROUP_PREFERENCE_KEY_PREFIX = 'cabinet-custom-group-preference';
const UNGROUPED_CUSTOM_GROUP_KEY = '__ungrouped__';

const props = withDefaults(defineProps<Props>(), {
  cabinetName: '私柜',
  canManage: true,
  scope: 'private',
});
const userStore = useUserStore();

const treeItemList = ref<CabinetItem[]>(adaptCabinetBootstrap({ scope: props.scope, canManage: props.canManage, items: [] }, props.cabinetName));
const currentFolderPageItems = ref<CabinetItem[]>([]);
const viewMode = ref<ViewMode>('grid');
const gridIconSize = ref<GridIconSize>('large');
const searchKeyword = ref('');
const sortField = ref<SortField>('manual');
const sortOrder = ref<SortOrder>('asc');
const groupField = ref<GroupField>('none');
const customGroupList = ref<CustomGroupItem[]>([]);
const customGroupAssignments = ref<Record<string, string[]>>({});
const draftCustomGroupList = ref<CustomGroupItem[]>([]);
const draftCustomGroupAssignments = ref<Record<string, string[]>>({});
const isEditingCustomGroups = ref(false);
const editingCustomGroupId = ref('');
const editingCustomGroupName = ref('');
const customGroupDragFileId = ref('');
const customGroupDragOverId = ref('');
const currentFolderId = ref(CABINET_ROOT_ID);
const currentPage = ref(1);
const pageSize = ref(40);
const totalItems = ref(0);
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
const folderViewAbortController = ref<AbortController | null>(null);
const folderViewRequestSeq = ref(0);
const itemList = computed<CabinetItem[]>(() => {
  const itemMap = new Map<string, CabinetItem>();
  treeItemList.value.forEach((item) => itemMap.set(item.id, item));
  currentFolderPageItems.value.forEach((item) => itemMap.set(item.id, item));
  return Array.from(itemMap.values());
});
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

const cloneCustomGroupList = (groups: CustomGroupItem[]) => groups.map((group) => ({ ...group }));

const cloneCustomGroupAssignments = (assignments: Record<string, string[]>) =>
  Object.fromEntries(Object.entries(assignments).map(([fileId, groupIds]) => [fileId, [...groupIds]]));

const getCustomGroupUserKey = () => userStore.getUserInfo?.username || userStore.getUserInfo?.id || 'anonymous';

const getCustomGroupStorageKey = () => `${CUSTOM_GROUP_STORAGE_KEY_PREFIX}:${props.scope}:${getCustomGroupUserKey()}`;
const getCustomGroupPreferenceKey = () => `${CUSTOM_GROUP_PREFERENCE_KEY_PREFIX}:${props.scope}:${getCustomGroupUserKey()}`;

const loadCustomGroupState = () => {
  try {
    const raw = localStorage.getItem(getCustomGroupStorageKey());
    if (!raw) {
      customGroupList.value = [];
      customGroupAssignments.value = {};
      return;
    }
    const parsed = JSON.parse(raw) as {
      groups?: CustomGroupItem[];
      assignments?: Record<string, string[]>;
    };
    customGroupList.value = Array.isArray(parsed?.groups)
      ? parsed.groups
          .map((group) => ({ id: String(group.id || ''), name: String(group.name || '').trim() }))
          .filter((group) => group.id && group.name)
      : [];
    customGroupAssignments.value = parsed?.assignments && typeof parsed.assignments === 'object'
      ? Object.fromEntries(
          Object.entries(parsed.assignments).map(([fileId, groupIds]) => [
            fileId,
            Array.isArray(groupIds) ? groupIds.map(String) : [],
          ]),
        )
      : {};
  } catch (error) {
    customGroupList.value = [];
    customGroupAssignments.value = {};
  }
};

const persistCustomGroupState = () => {
  localStorage.setItem(
    getCustomGroupStorageKey(),
    JSON.stringify({
      groups: customGroupList.value,
      assignments: customGroupAssignments.value,
    }),
  );
};

const readCustomGroupPreference = () => localStorage.getItem(getCustomGroupPreferenceKey()) === '1';

const persistCustomGroupPreference = (enabled: boolean) => {
  localStorage.setItem(getCustomGroupPreferenceKey(), enabled ? '1' : '0');
};

const resolveFolderViewGroupField = (): Exclude<GroupField, 'custom'> =>
  groupField.value === 'custom' ? 'none' : groupField.value;

const replaceCurrentFolderPageItems = (items: Parameters<typeof adaptCabinetItem>[0][]) => {
  currentFolderPageItems.value = items.map(adaptCabinetItem);
};

const loadViewPreference = async () => {
  const result = await fetchCabinetPreference(props.scope);
  applyViewPreference({
    viewMode: result.viewMode,
    gridIconSize: result.gridIconSize,
    sortField: result.sortField,
    sortOrder: result.sortOrder,
    groupField: readCustomGroupPreference() ? 'custom' : result.groupField,
  });
};

const persistViewPreference = async () => {
  persistCustomGroupPreference(groupField.value === 'custom');
  await updateCabinetPreference({
    scope: props.scope,
    viewMode: viewMode.value,
    gridIconSize: gridIconSize.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    groupField: resolveFolderViewGroupField(),
  });
};

const syncFolderView = async (options?: { showError?: boolean }) => {
  const requestSeq = folderViewRequestSeq.value + 1;
  folderViewRequestSeq.value = requestSeq;
  folderViewAbortController.value?.abort();
  const controller = new AbortController();
  folderViewAbortController.value = controller;
  try {
    const result = await fetchCabinetFolderView({
      scope: props.scope,
      parentId: resolveApiParentId(currentFolderId.value),
      keyword: searchKeyword.value.trim() || undefined,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      groupField: resolveFolderViewGroupField(),
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    }, { signal: controller.signal });
    if (requestSeq !== folderViewRequestSeq.value) {
      return;
    }
    replaceCurrentFolderPageItems(result.items);
    totalItems.value = result.total;
    currentPage.value = result.pageNo;
    pageSize.value = result.pageSize;
    canManageState.value = result.canManage;
    const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
    if (result.total > 0 && result.pageNo > totalPages) {
      currentPage.value = totalPages;
      await syncFolderView(options);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }
    if (options?.showError) {
      message.error('文件列表加载失败');
    }
    throw error;
  } finally {
    if (folderViewAbortController.value === controller) {
      folderViewAbortController.value = null;
    }
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
    const nextTreeItemList = adaptCabinetBootstrap(result, props.cabinetName);
    treeItemList.value = nextTreeItemList;
    currentFolderPageItems.value = [];
    canManageState.value = result.canManage;

    const targetFolderExists = nextTreeItemList.some((item) => item.type === 'folder' && item.id === previousFolderId);
    currentFolderId.value = targetFolderExists ? previousFolderId : CABINET_ROOT_ID;
    selectedTreeKeys.value = [currentFolderId.value];

    cancelRename();
    hideContextMenu();
    clearSelection();
    await syncFolderView();

    if (activePropertyItemId) {
      propertyItem.value = itemList.value.find((item) => item.id === activePropertyItemId) || null;
      if (!propertyItem.value) {
        propertyModalVisible.value = false;
      }
    }

    if (activePreviewItemId) {
      previewItem.value = itemList.value.find((item) => item.id === activePreviewItemId) || null;
      if (!previewItem.value) {
        previewModalVisible.value = false;
      }
    }

    if (!options?.silent) {
      message.success('已刷新');
    }
  } catch (error) { }
};

const initializeCabinet = async () => {
  loadCustomGroupState();
  try {
    await loadViewPreference();
  } catch (error) { }
  await reloadBootstrap({ silent: true });
};

const {
  folderMap,
  sortedFilteredFolderItems,
  groupedSections,
  breadcrumbItems,
  treeData,
  sortFieldLabel,
  sortOrderLabel,
  groupFieldLabel,
} = useCabinetComputed({
  itemList,
  currentFolderItems: currentFolderPageItems,
  currentFolderId,
  sortField,
  sortOrder,
  groupField,
  contextMenuTargetId,
  clipboardState,
  canManage: canManageRef,
});
const currentVisibleItemIds = computed(() =>
  isCustomGroupMode.value ? currentFolderGroupableItems.value.map((item) => item.id) : sortedFilteredFolderItems.value.map((item) => item.id),
);

const updateActiveCustomGroupAssignments = (nextAssignments: Record<string, string[]>) => {
  if (isEditingCustomGroups.value) {
    draftCustomGroupAssignments.value = nextAssignments;
    return;
  }
  customGroupAssignments.value = nextAssignments;
  persistCustomGroupState();
};

const addFileToCustomGroup = (fileId: string, groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  if (!fileId || !groupId || groupId === UNGROUPED_CUSTOM_GROUP_KEY) {
    return;
  }
  const nextAssignments = cloneCustomGroupAssignments(activeCustomGroupAssignments.value);
  const previous = nextAssignments[fileId] || [];
  if (previous.includes(groupId)) {
    return;
  }
  nextAssignments[fileId] = [...previous, groupId];
  updateActiveCustomGroupAssignments(nextAssignments);
  message.success('已加入分组');
};

const removeFileFromCustomGroupMapping = (fileId: string, groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  const nextAssignments = cloneCustomGroupAssignments(activeCustomGroupAssignments.value);
  const previous = nextAssignments[fileId] || [];
  nextAssignments[fileId] = previous.filter((id) => id !== groupId);
  if (!nextAssignments[fileId].length) {
    delete nextAssignments[fileId];
  }
  updateActiveCustomGroupAssignments(nextAssignments);
};

const enterCustomGroupEditMode = () => {
  draftCustomGroupList.value = cloneCustomGroupList(customGroupList.value);
  draftCustomGroupAssignments.value = cloneCustomGroupAssignments(customGroupAssignments.value);
  isEditingCustomGroups.value = true;
  editingCustomGroupId.value = '';
  editingCustomGroupName.value = '';
};

const cancelCustomGroupEditMode = () => {
  isEditingCustomGroups.value = false;
  draftCustomGroupList.value = [];
  draftCustomGroupAssignments.value = {};
  editingCustomGroupId.value = '';
  editingCustomGroupName.value = '';
};

const handleAddCustomGroup = () => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  const nextIndex = draftCustomGroupList.value.length + 1;
  const nextGroup = {
    id: generateItemId('custom-group'),
    name: `新分组 ${nextIndex}`,
  };
  draftCustomGroupList.value = [...draftCustomGroupList.value, nextGroup];
  editingCustomGroupId.value = nextGroup.id;
  editingCustomGroupName.value = nextGroup.name;
};

const startCustomGroupRename = (groupId: string) => {
  const target = draftCustomGroupList.value.find((group) => group.id === groupId);
  if (!target) {
    return;
  }
  editingCustomGroupId.value = groupId;
  editingCustomGroupName.value = target.name;
};

const submitCustomGroupRename = () => {
  if (!isEditingCustomGroups.value || !editingCustomGroupId.value) {
    return;
  }
  const normalizedName = editingCustomGroupName.value.trim();
  if (!normalizedName) {
    message.warning('分组名称不能为空');
    return;
  }
  const hasDuplicate = draftCustomGroupList.value.some(
    (group) => group.id !== editingCustomGroupId.value && group.name === normalizedName,
  );
  if (hasDuplicate) {
    message.warning('分组名称不能重复');
    return;
  }
  draftCustomGroupList.value = draftCustomGroupList.value.map((group) =>
    group.id === editingCustomGroupId.value ? { ...group, name: normalizedName } : group,
  );
  editingCustomGroupId.value = '';
  editingCustomGroupName.value = '';
};

const handleDeleteCustomGroup = (groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  Modal.confirm({
    title: '删除分组',
    content: '删除分组不会删除文件，只会移除文件与该分组的归属关系。',
    onOk: () => {
      draftCustomGroupList.value = draftCustomGroupList.value.filter((group) => group.id !== groupId);
      const nextAssignments = cloneCustomGroupAssignments(draftCustomGroupAssignments.value);
      Object.keys(nextAssignments).forEach((fileId) => {
        nextAssignments[fileId] = nextAssignments[fileId].filter((id) => id !== groupId);
        if (!nextAssignments[fileId].length) {
          delete nextAssignments[fileId];
        }
      });
      draftCustomGroupAssignments.value = nextAssignments;
      if (editingCustomGroupId.value === groupId) {
        editingCustomGroupId.value = '';
        editingCustomGroupName.value = '';
      }
    },
  });
};

const handleSaveCustomGroups = () => {
  const normalizedGroups = draftCustomGroupList.value
    .map((group) => ({ ...group, name: group.name.trim() }))
    .filter((group) => group.name);
  customGroupList.value = cloneCustomGroupList(normalizedGroups);
  const validGroupIdSet = new Set(customGroupList.value.map((group) => group.id));
  customGroupAssignments.value = Object.fromEntries(
    Object.entries(draftCustomGroupAssignments.value)
      .map(([fileId, groupIds]) => [fileId, groupIds.filter((groupId) => validGroupIdSet.has(groupId))])
      .filter(([, groupIds]) => groupIds.length),
  );
  persistCustomGroupState();
  cancelCustomGroupEditMode();
  message.success('分组已保存');
};

const handleCustomGroupDragStart = (_groupId: string, fileId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  customGroupDragFileId.value = fileId;
};

const handleCustomGroupDragEnd = () => {
  customGroupDragFileId.value = '';
  customGroupDragOverId.value = '';
};

const handleCustomGroupDragEnter = (groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  if (groupId !== UNGROUPED_CUSTOM_GROUP_KEY) {
    customGroupDragOverId.value = groupId;
  }
};

const handleCustomGroupDragOver = (groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  if (groupId !== UNGROUPED_CUSTOM_GROUP_KEY) {
    customGroupDragOverId.value = groupId;
  }
};

const handleCustomGroupDragLeave = (groupId: string, event: DragEvent) => {
  const current = event.currentTarget as HTMLElement | null;
  const related = event.relatedTarget as Node | null;
  if (current && related && current.contains(related)) {
    return;
  }
  if (customGroupDragOverId.value === groupId) {
    customGroupDragOverId.value = '';
  }
};

const handleCustomGroupDrop = (groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  if (groupId !== UNGROUPED_CUSTOM_GROUP_KEY) {
    customGroupDragOverId.value = '';
  }
};

const handleCustomGroupAddFile = (groupId: string, fileId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  addFileToCustomGroup(fileId, groupId);
};

const handleRemoveFileFromCustomGroup = (fileId: string, groupId: string) => {
  if (!isEditingCustomGroups.value) {
    return;
  }
  removeFileFromCustomGroupMapping(fileId, groupId);
  message.success('已移出分组');
};
const isCustomGroupMode = computed(() => groupField.value === 'custom');
const currentFolderGroupableItems = computed(() => currentFolderPageItems.value);
const activeCustomGroupList = computed(() => (isEditingCustomGroups.value ? draftCustomGroupList.value : customGroupList.value));
const activeCustomGroupAssignments = computed(() =>
  isEditingCustomGroups.value ? draftCustomGroupAssignments.value : customGroupAssignments.value,
);
const customGroupsEmpty = computed(() => false);
const customGroupSections = computed<CustomGroupSection[]>(() => {
  if (!isCustomGroupMode.value) {
    return [];
  }
  const sections: CustomGroupSection[] = activeCustomGroupList.value.map((group) => ({
    key: group.id,
    title: group.name,
    items: currentFolderGroupableItems.value.filter((item) => activeCustomGroupAssignments.value[item.id]?.includes(group.id)),
  }));
  const activeGroupIdSet = new Set(activeCustomGroupList.value.map((group) => group.id));
  sections.push({
    key: UNGROUPED_CUSTOM_GROUP_KEY,
    title: '未分组',
    isUngrouped: true,
    items: currentFolderGroupableItems.value.filter((item) => {
      const groupIds = activeCustomGroupAssignments.value[item.id] || [];
      return !groupIds.some((groupId) => activeGroupIdSet.has(groupId));
    }),
  });
  return sections;
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
  if (nextItem.type === 'folder') {
    treeItemList.value = [...treeItemList.value, nextItem];
  }
  if (nextItem.parentId === currentFolderId.value) {
    currentFolderPageItems.value = [...currentFolderPageItems.value, nextItem];
    totalItems.value += 1;
  }
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
  } catch (error) { }
};

const enterFolderById = (folderId: string) => {
  if (!folderMap.value.has(folderId)) {
    return;
  }
  cancelRename();
  currentFolderId.value = folderId;
  currentPage.value = 1;
  searchKeyword.value = '';
  selectedTreeKeys.value = [folderId];
  clearSelection();
  hideContextMenu();
  void syncFolderView({ showError: true });
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
  currentPage.value = 1;
  hideContextMenu();
  clearSelection();
  void syncFolderView({ showError: true });
};

const handleSortFieldChange = (field: SortField) => {
  currentPage.value = 1;
  void savePreferenceAndSyncFolderView({ sortField: field }, { showError: true });
};

const handleSortOrderChange = (order: SortOrder) => {
  currentPage.value = 1;
  void savePreferenceAndSyncFolderView({ sortOrder: order }, { showError: true });
};

const handleGroupFieldChange = (field: GroupField) => {
  currentPage.value = 1;
  if (field === 'custom') {
    groupField.value = 'custom';
    hideContextMenu();
    clearSelection();
    void savePreferenceAndSyncFolderView({ groupField: field }, { showError: true });
    return;
  }
  if (groupField.value === 'custom') {
    cancelCustomGroupEditMode();
  }
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
  const step = 10;
  const replacedGroupIds = new Set(group.items.map((item) => item.id));
  const nextPageItems = groupedSections.value.flatMap((section) =>
    section.key === group.key
      ? nextItems
      : section.items.filter((item) => !replacedGroupIds.has(item.id))
  );
  const currentSortSlots = currentFolderPageItems.value
    .map((item) => item.orderNo)
    .filter((orderNo) => Number.isFinite(orderNo))
    .sort((left, right) => left - right);
  const nextSortSlots =
    currentSortSlots.length === nextPageItems.length
      ? currentSortSlots
      : nextPageItems.map((_, index) => (index + 1) * step);

  nextPageItems.forEach((item, index) => {
    const currentItem = getItemById(item.id);
    if (currentItem) {
      currentItem.orderNo = nextSortSlots[index] ?? (index + 1) * step;
    }
  });
  currentFolderPageItems.value = [...nextPageItems];

  void (async () => {
    try {
      await updateCabinetItemOrder({
        parentId: resolveApiParentId(currentFolderId.value),
        itemOrders: nextPageItems.map((item) => ({
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

const handlePreviewSaved = async () => {
  await reloadBootstrap({ silent: true });
};

const resolveDownloadItemIds = () => {
  const targetId = contextMenu.value.targetId;
  if (targetId) {
    if (selectedIdSet.value.has(targetId) && selectedItemIds.value.length > 1) {
      return [...selectedItemIds.value];
    }
    return [targetId];
  }
  return [...selectedItemIds.value];
};

const resolveDownloadFileName = (itemIds: string[]) => {
  if (itemIds.length !== 1) {
    return '文件柜批量下载.zip';
  }
  const item = getItemById(itemIds[0]);
  if (!item) {
    return '文件柜批量下载.zip';
  }
  return item.type === 'file' ? item.name : `${item.name}.zip`;
};

const handleDownload = async () => {
  const itemIds = resolveDownloadItemIds();
  if (!itemIds.length) {
    hideContextMenu();
    message.warning('请先选择要下载的文件或文件夹');
    return;
  }
  hideContextMenu();
  try {
    await downloadCabinetItems(itemIds, resolveDownloadFileName(itemIds));
  } catch (error) {
    message.error('下载失败');
  }
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
    } catch (error) { }
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

const handlePageChange = (page: number, size?: number) => {
  currentPage.value = page;
  if (size && size !== pageSize.value) {
    pageSize.value = size;
    currentPage.value = 1;
  }
  hideContextMenu();
  clearSelection();
  void syncFolderView({ showError: true });
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
  } catch (error) { }
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
