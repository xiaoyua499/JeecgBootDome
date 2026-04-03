import { computed, type Ref } from 'vue';
import type { ClipboardState, GroupField, SortField, SortOrder, CabinetItem } from '../types';
import { buildBreadcrumbItems, buildGroupedSections, buildTreeData, sortCabinetItems } from '../utils';

export function useCabinetComputed(params: {
  itemList: Ref<CabinetItem[]>;
  currentFolderId: Ref<string>;
  searchKeyword: Ref<string>;
  sortField: Ref<SortField>;
  sortOrder: Ref<SortOrder>;
  groupField: Ref<GroupField>;
  contextMenuTargetId: Ref<string>;
  clipboardState: Ref<ClipboardState | null>;
  canManage: Ref<boolean>;
}) {
  const folderMap = computed(() => {
    const map = new Map<string, CabinetItem>();
    params.itemList.value.forEach((item) => {
      if (item.type === 'folder') {
        map.set(item.id, item);
      }
    });
    return map;
  });

  const currentFolderItems = computed(() => params.itemList.value.filter((item) => item.parentId === params.currentFolderId.value));

  const filteredFolderItems = computed(() => {
    const keyword = params.searchKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return currentFolderItems.value;
    }
    return currentFolderItems.value.filter((item) => item.name.toLowerCase().includes(keyword) || item.ext.toLowerCase().includes(keyword));
  });

  const sortedFilteredFolderItems = computed(() => sortCabinetItems(filteredFolderItems.value, params.sortField.value, params.sortOrder.value));

  const groupedSections = computed(() => buildGroupedSections(sortedFilteredFolderItems.value, params.groupField.value));
  const breadcrumbItems = computed(() => buildBreadcrumbItems(folderMap.value, params.currentFolderId.value));
  const treeData = computed(() => buildTreeData(params.itemList.value));
  const currentVisibleItemIds = computed(() => sortedFilteredFolderItems.value.map((item) => item.id));
  const clipboardCutIdSet = computed(() => new Set(params.clipboardState.value?.mode === 'cut' ? params.clipboardState.value.itemIds : []));
  const canPasteToCurrentFolder = computed(() => params.canManage.value && Boolean(params.clipboardState.value?.itemIds.length));
  const canPasteToItemTarget = computed(() => {
    if (!params.canManage.value || !params.clipboardState.value?.itemIds.length) {
      return false;
    }
    const target = params.itemList.value.find((item) => item.id === params.contextMenuTargetId.value);
    return target?.type === 'folder';
  });

  const sortFieldLabel = computed(
    () => ({ manual: '手动排序', name: '名称', updateTime: '修改日期', ext: '类型', size: '大小' })[params.sortField.value]
  );
  const sortOrderLabel = computed(() => (params.sortOrder.value === 'asc' ? '递增' : '递减'));
  const groupFieldLabel = computed(() => ({ none: '无', name: '名称', updateTime: '修改日期', type: '类型', size: '大小' })[params.groupField.value]);

  return {
    folderMap,
    currentFolderItems,
    filteredFolderItems,
    sortedFilteredFolderItems,
    groupedSections,
    breadcrumbItems,
    treeData,
    currentVisibleItemIds,
    clipboardCutIdSet,
    canPasteToCurrentFolder,
    canPasteToItemTarget,
    sortFieldLabel,
    sortOrderLabel,
    groupFieldLabel,
  };
}
