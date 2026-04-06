import { computed, type Ref } from 'vue';
import type { ClipboardState, GroupField, SortField, SortOrder, CabinetItem } from '../types';
import { buildBreadcrumbItems, buildGroupedSections, buildTreeData } from '../utils';

export function useCabinetComputed(params: {
  itemList: Ref<CabinetItem[]>;
  currentFolderItems: Ref<CabinetItem[]>;
  currentFolderId: Ref<string>;
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

  const sortedFilteredFolderItems = computed(() => params.currentFolderItems.value);
  const groupedSections = computed(() => buildGroupedSections(params.currentFolderItems.value, params.groupField.value));
  const breadcrumbItems = computed(() => buildBreadcrumbItems(folderMap.value, params.currentFolderId.value));
  const treeData = computed(() => buildTreeData(params.itemList.value));
  const currentVisibleItemIds = computed(() => params.currentFolderItems.value.map((item) => item.id));
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
  const groupFieldLabel = computed(() => ({ none: '无', name: '名称', updateTime: '修改日期', type: '类型', size: '大小', custom: '自定义分组' })[params.groupField.value]);

  return {
    folderMap,
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
