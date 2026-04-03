import { computed, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import type { CabinetItem, ClipboardState } from '../types';
import { buildSiblingName, formatNow, generateItemId, getDescendantIds, isDescendantFolder, isDescendantItem, reassignSiblingOrder } from '../utils';

interface UseCabinetClipboardParams {
  itemList: Ref<CabinetItem[]>;
  currentFolderId: Ref<string>;
  selectedItemIds: Ref<string[]>;
  clipboardState: Ref<ClipboardState | null>;
  contextMenuTargetId: Ref<string>;
  renamingItemId: Ref<string>;
  canManage: Ref<boolean>;
  hideContextMenu: () => void;
  clearSelection: () => void;
  cancelRename: () => void;
}

export function useCabinetClipboard(params: UseCabinetClipboardParams) {
  const clipboardCutIdSet = computed(() => new Set(params.clipboardState.value?.mode === 'cut' ? params.clipboardState.value.itemIds : []));

  const canPasteToCurrentFolder = computed(() => params.canManage.value && Boolean(params.clipboardState.value?.itemIds.length));

  const canPasteToItemTarget = computed(() => {
    if (!params.canManage.value || !params.clipboardState.value?.itemIds.length) {
      return false;
    }
    const target = params.itemList.value.find((item) => item.id === params.contextMenuTargetId.value);
    return target?.type === 'folder';
  });

  const getItemById = (itemId: string) => params.itemList.value.find((item) => item.id === itemId);

  const normalizeItemIds = (sourceIds: string[]) =>
    sourceIds.filter(
      (itemId) =>
        itemId !== 'root' &&
        !sourceIds.some((possibleAncestorId) => possibleAncestorId !== itemId && isDescendantItem(params.itemList.value, itemId, possibleAncestorId))
    );

  const resetClipboard = () => {
    params.clipboardState.value = null;
  };

  const cloneItemTree = (sourceId: string, targetParentId: string | null, siblingNames: string[]) => {
    const sourceItem = getItemById(sourceId);
    if (!sourceItem) {
      return [] as CabinetItem[];
    }
    const nowText = formatNow();
    const newRootId = generateItemId(sourceItem.type);
    const clonedRootName = buildSiblingName(sourceItem.name, siblingNames);
    const clonedItems: CabinetItem[] = [
      {
        ...sourceItem,
        id: newRootId,
        name: clonedRootName,
        parentId: targetParentId,
        createTime: nowText,
        updateTime: nowText,
        orderNo: 0,
      },
    ];
    const idMap = new Map<string, string>([[sourceItem.id, newRootId]]);
    const descendants = getDescendantIds(params.itemList.value, sourceId);
    descendants.forEach((descendantId) => {
      const descendant = getItemById(descendantId);
      if (!descendant) {
        return;
      }
      const newId = generateItemId(descendant.type);
      idMap.set(descendant.id, newId);
      clonedItems.push({
        ...descendant,
        id: newId,
        parentId: idMap.get(descendant.parentId || '') || newRootId,
        createTime: nowText,
        updateTime: nowText,
        orderNo: descendant.orderNo,
      });
    });
    return clonedItems;
  };

  const getActionTargetIds = () => {
    const selectedIdSet = new Set(params.selectedItemIds.value);
    const sourceIds = params.contextMenuTargetId.value
      ? selectedIdSet.has(params.contextMenuTargetId.value)
        ? [...params.selectedItemIds.value]
        : [params.contextMenuTargetId.value]
      : [...params.selectedItemIds.value];

    return normalizeItemIds(sourceIds);
  };

  const moveItemsToFolder = (sourceIds: string[], targetFolderId: string, successMessage = '已移动到目标文件夹') => {
    if (!params.canManage.value) {
      return false;
    }
    const targetFolder = getItemById(targetFolderId);
    if (!targetFolder || targetFolder.type !== 'folder') {
      return false;
    }

    const normalizedIds = normalizeItemIds(sourceIds);
    const sourceItems = normalizedIds.map((itemId) => getItemById(itemId)).filter(Boolean) as CabinetItem[];
    if (!sourceItems.length) {
      return false;
    }

    if (sourceItems.some((item) => item.id === targetFolderId || isDescendantFolder(params.itemList.value, targetFolderId, item.id))) {
      message.warning('不能将文件夹移动到自身或其子文件夹中');
      return false;
    }

    const movableItems = sourceItems.filter((item) => item.parentId !== targetFolderId);
    if (!movableItems.length) {
      return false;
    }

    const siblings = params.itemList.value.filter((item) => item.parentId === targetFolderId).sort((left, right) => left.orderNo - right.orderNo);
    let nextOrderNo = siblings.length ? siblings[siblings.length - 1].orderNo + 10 : 10;
    const siblingNames = siblings.map((item) => item.name);
    const sourceParentIds = new Set<string | null>(movableItems.map((item) => item.parentId));

    movableItems.forEach((item) => {
      item.parentId = targetFolderId;
      item.orderNo = nextOrderNo;
      item.updateTime = formatNow();
      item.name = buildSiblingName(item.name, siblingNames);
      siblingNames.push(item.name);
      nextOrderNo += 10;
    });

    const affectedParentIds = new Set<string | null>(sourceParentIds);
    affectedParentIds.add(targetFolderId);
    affectedParentIds.forEach((parentId) => reassignSiblingOrder(params.itemList.value, parentId));
    params.selectedItemIds.value = movableItems.map((item) => item.id);
    params.cancelRename();
    message.success(successMessage);
    return true;
  };

  const applyClipboardToFolder = (targetFolderId: string) => {
    if (!params.canManage.value || !params.clipboardState.value?.itemIds.length) {
      return;
    }
    const clipboard = params.clipboardState.value;
    const sourceItems = clipboard.itemIds.map((itemId) => getItemById(itemId)).filter(Boolean) as CabinetItem[];
    if (!sourceItems.length) {
      resetClipboard();
      return;
    }

    if (
      clipboard.mode === 'cut' &&
      sourceItems.some((item) => item.id === targetFolderId || isDescendantFolder(params.itemList.value, targetFolderId, item.id))
    ) {
      message.warning('不能将文件夹移动到自身或其子文件夹中');
      params.hideContextMenu();
      return;
    }

    const siblings = params.itemList.value.filter((item) => item.parentId === targetFolderId).sort((left, right) => left.orderNo - right.orderNo);
    let nextOrderNo = siblings.length ? siblings[siblings.length - 1].orderNo + 10 : 10;
    const siblingNames = siblings.map((item) => item.name);

    if (clipboard.mode === 'copy') {
      const clonedItems: CabinetItem[] = [];
      sourceItems.forEach((item) => {
        const nextCloned = cloneItemTree(item.id, targetFolderId, siblingNames);
        if (!nextCloned.length) {
          return;
        }
        siblingNames.push(nextCloned[0].name);
        nextCloned[0].orderNo = nextOrderNo;
        nextOrderNo += 10;
        clonedItems.push(...nextCloned);
      });
      params.itemList.value.push(...clonedItems);
      params.selectedItemIds.value = clonedItems
        .filter((item) => item.parentId === targetFolderId)
        .map((item) => item.id)
        .slice(0, sourceItems.length);
      message.success('已复制到当前目录');
    } else {
      const sourceParentIds = new Set<string | null>(sourceItems.map((item) => item.parentId));
      sourceItems.forEach((item) => {
        if (item.parentId === targetFolderId) {
          item.orderNo = nextOrderNo;
          nextOrderNo += 10;
          return;
        }
        item.parentId = targetFolderId;
        item.orderNo = nextOrderNo;
        item.updateTime = formatNow();
        item.name = buildSiblingName(item.name, siblingNames);
        siblingNames.push(item.name);
        nextOrderNo += 10;
      });
      const affectedParentIds = new Set<string | null>(sourceParentIds);
      affectedParentIds.add(targetFolderId);
      affectedParentIds.forEach((parentId) => reassignSiblingOrder(params.itemList.value, parentId));
      params.selectedItemIds.value = sourceItems.map((item) => item.id);
      resetClipboard();
      message.success('已移动到当前目录');
    }
    params.hideContextMenu();
  };

  const handleCopy = () => {
    const targetIds = getActionTargetIds().filter((id) => id !== 'root');
    if (!targetIds.length) {
      params.hideContextMenu();
      return;
    }
    params.clipboardState.value = { mode: 'copy', itemIds: targetIds };
    params.hideContextMenu();
    message.success('已复制到剪贴板');
  };

  const handleCut = () => {
    if (!params.canManage.value) {
      params.hideContextMenu();
      return;
    }
    const targetIds = getActionTargetIds().filter((id) => id !== 'root');
    if (!targetIds.length) {
      params.hideContextMenu();
      return;
    }
    params.clipboardState.value = { mode: 'cut', itemIds: targetIds };
    params.hideContextMenu();
    message.success('已剪切到剪贴板');
  };

  const handlePaste = () => {
    applyClipboardToFolder(params.currentFolderId.value);
  };

  const handlePasteToItem = () => {
    const target = getItemById(params.contextMenuTargetId.value);
    if (!target || target.type !== 'folder') {
      params.hideContextMenu();
      return;
    }
    applyClipboardToFolder(target.id);
  };

  const collectDeleteIds = (targetId: string): string[] => [targetId, ...getDescendantIds(params.itemList.value, targetId)];

  const handleDelete = () => {
    if (!params.canManage.value) {
      params.hideContextMenu();
      return;
    }
    const targetIds = getActionTargetIds().filter((id) => id !== 'root');
    if (!targetIds.length) {
      params.hideContextMenu();
      return;
    }
    const removeIdSet = new Set<string>();
    targetIds.forEach((id) => {
      collectDeleteIds(id).forEach((removeId) => removeIdSet.add(removeId));
    });
    params.itemList.value = params.itemList.value.filter((item) => !removeIdSet.has(item.id));
    if (params.clipboardState.value?.itemIds.some((itemId) => removeIdSet.has(itemId))) {
      resetClipboard();
    }
    if (params.renamingItemId.value && removeIdSet.has(params.renamingItemId.value)) {
      params.cancelRename();
    }
    params.clearSelection();
    params.hideContextMenu();
    message.success('已删除');
  };

  return {
    clipboardState: params.clipboardState,
    clipboardCutIdSet,
    canPasteToCurrentFolder,
    canPasteToItemTarget,
    getItemById,
    moveItemsToFolder,
    resetClipboard,
    handleCopy,
    handleCut,
    handlePaste,
    handlePasteToItem,
    handleDelete,
  };
}
