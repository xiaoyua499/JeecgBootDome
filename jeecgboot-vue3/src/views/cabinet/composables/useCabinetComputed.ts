/**
 * useCabinetComputed - 文件柜计算属性集合
 *
 * 将 CabinetExplorer 中频繁使用的派生状态统一封装为 computed，
 * 避免在模板和其他 composable 中重复计算。
 *
 * 提供的计算属性：
 * - folderMap              - 文件夹 id → CabinetItem 的 Map，用于快速查找和面包屑构建
 * - sortedFilteredFolderItems - 当前文件夹已排序/过滤的条目列表（直接透传 currentFolderItems）
 * - groupedSections        - 按当前 groupField 分组后的区块数组
 * - breadcrumbItems        - 当前路径的面包屑导航数组
 * - treeData               - 左侧文件夹树的 Ant Design DataNode 数组
 * - currentVisibleItemIds  - 当前可见条目的 id 列表（用于全选和框选）
 * - clipboardCutIdSet      - 处于剪切状态的条目 id Set（用于渲染半透明效果）
 * - canPasteToCurrentFolder - 当前文件夹是否可粘贴（有管理权限且剪贴板非空）
 * - canPasteToItemTarget   - 右键目标文件夹是否可粘贴
 * - sortFieldLabel         - 当前排序字段的中文标签
 * - sortOrderLabel         - 当前排序方向的中文标签
 * - groupFieldLabel        - 当前分组字段的中文标签
 */
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
