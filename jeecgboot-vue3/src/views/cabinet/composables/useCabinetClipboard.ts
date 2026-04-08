/**
 * useCabinetClipboard - 文件柜剪贴板操作管理
 *
 * 封装复制、剪切、粘贴、删除的完整业务逻辑，支持两种工作模式：
 *
 * 1. 本地模式（无 onMoveItems/onCopyItems/onDeleteItems 回调）：
 *    直接操作 itemList ref，适用于 mock 数据或纯前端演示
 *
 * 2. API 模式（传入回调函数）：
 *    调用回调触发后端接口，接口成功后由外部刷新 itemList
 *
 * 核心功能：
 * - handleCopy：将选中条目 id 写入剪贴板（mode: 'copy'）
 * - handleCut：将选中条目 id 写入剪贴板（mode: 'cut'），渲染半透明效果
 * - handlePaste：将剪贴板内容粘贴到当前文件夹
 * - handlePasteToItem：将剪贴板内容粘贴到右键目标文件夹
 * - handleDelete：删除选中条目（含后代）
 * - moveItemsToFolder：拖拽移动条目到目标文件夹（本地模式）
 *
 * 冲突处理：
 * - 复制时使用 buildSiblingName 自动生成"副本"名称
 * - 移动时同样检测同名冲突并重命名
 * - 防止将文件夹移动到自身或子文件夹（isDescendantFolder 检测）
 * - 批量操作时过滤冗余条目（normalizeItemIds 去除已被祖先覆盖的子条目）
 */
import { computed, type Ref } from 'vue';
import { message } from 'ant-design-vue';
import type { CabinetItem, ClipboardState } from '../types';
import { buildSiblingName, formatNow, generateItemId, getDescendantIds, isDescendantFolder, isDescendantItem, reassignSiblingOrder } from '../utils';

interface UseCabinetClipboardParams {
  /** 完整条目列表（本地模式下直接修改此 ref） */
  itemList: Ref<CabinetItem[]>;
  /** 当前所在文件夹 id */
  currentFolderId: Ref<string>;
  /** 当前已选中的条目 id 列表 */
  selectedItemIds: Ref<string[]>;
  /** 剪贴板状态（null 表示剪贴板为空） */
  clipboardState: Ref<ClipboardState | null>;
  /** 右键菜单目标条目 id（右键点击某条目时设置） */
  contextMenuTargetId: Ref<string>;
  /** 当前正在重命名的条目 id */
  renamingItemId: Ref<string>;
  /** 是否有管理权限 */
  canManage: Ref<boolean>;
  /** 隐藏右键菜单 */
  hideContextMenu: () => void;
  /** 清空选中状态 */
  clearSelection: () => void;
  /** 取消重命名 */
  cancelRename: () => void;
  /** API 模式：移动条目回调（传入则使用 API 模式，否则本地模式） */
  onMoveItems?: (itemIds: string[], targetFolderId: string) => Promise<void> | void;
  /** API 模式：复制条目回调 */
  onCopyItems?: (itemIds: string[], targetFolderId: string) => Promise<void> | void;
  /** API 模式：删除条目回调 */
  onDeleteItems?: (itemIds: string[]) => Promise<void> | void;
}

export function useCabinetClipboard(params: UseCabinetClipboardParams) {
  /** 处于剪切状态的条目 id Set，用于渲染半透明效果 */
  const clipboardCutIdSet = computed(() => new Set(params.clipboardState.value?.mode === 'cut' ? params.clipboardState.value.itemIds : []));

  /** 当前文件夹是否可粘贴（有管理权限且剪贴板非空） */
  const canPasteToCurrentFolder = computed(() => params.canManage.value && Boolean(params.clipboardState.value?.itemIds.length));

  /**
   * 右键目标条目是否可粘贴
   * 需要：有管理权限 + 剪贴板非空 + 目标条目是文件夹
   */
  const canPasteToItemTarget = computed(() => {
    if (!params.canManage.value || !params.clipboardState.value?.itemIds.length) {
      return false;
    }
    const target = params.itemList.value.find((item) => item.id === params.contextMenuTargetId.value);
    return target?.type === 'folder';
  });

  /** 根据 id 从 itemList 中查找条目 */
  const getItemById = (itemId: string) => params.itemList.value.find((item) => item.id === itemId);

  /**
   * 过滤冗余条目：若某条目的祖先也在列表中，则移除该条目
   * 避免批量操作时重复处理已被祖先覆盖的子条目
   * 同时过滤掉根节点 'root'
   *
   * @param sourceIds - 原始条目 id 列表
   * @returns 去除冗余后的 id 列表
   */
  const normalizeItemIds = (sourceIds: string[]) =>
    sourceIds.filter(
      (itemId) =>
        itemId !== 'root' &&
        !sourceIds.some((possibleAncestorId) => possibleAncestorId !== itemId && isDescendantItem(params.itemList.value, itemId, possibleAncestorId))
    );

  /** 清空剪贴板状态 */
  const resetClipboard = () => {
    params.clipboardState.value = null;
  };

  /**
   * 本地模式：克隆条目树（用于复制粘贴）
   * 递归复制源条目及其所有后代，生成新的 id 并更新父子关系
   * 根节点名称通过 buildSiblingName 处理同名冲突
   *
   * @param sourceId      - 源条目 id
   * @param targetParentId - 目标父文件夹 id
   * @param siblingNames  - 目标文件夹中已有的名称列表（用于冲突检测）
   * @returns 克隆后的条目数组（第一个元素为根节点）
   */
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

  /**
   * 获取当前操作的目标条目 id 列表
   * 优先级逻辑：
   * - 若右键菜单目标在已选中列表中 → 使用全部已选中条目
   * - 若右键菜单目标不在已选中列表中 → 仅使用右键目标条目
   * - 无右键目标 → 使用全部已选中条目
   * 最后通过 normalizeItemIds 过滤冗余条目
   */
  const getActionTargetIds = () => {
    const selectedIdSet = new Set(params.selectedItemIds.value);
    const sourceIds = params.contextMenuTargetId.value
      ? selectedIdSet.has(params.contextMenuTargetId.value)
        ? [...params.selectedItemIds.value]
        : [params.contextMenuTargetId.value]
      : [...params.selectedItemIds.value];

    return normalizeItemIds(sourceIds);
  };

  /**
   * 本地模式：将条目移动到目标文件夹
   * 用于拖拽排序/移动场景，直接修改 itemList 中条目的 parentId
   *
   * 校验逻辑：
   * - 目标必须是文件夹
   * - 不能将文件夹移动到自身或其子文件夹
   * - 已在目标文件夹中的条目跳过
   * - 移动后自动处理同名冲突并重新分配排序序号
   *
   * @param sourceIds      - 要移动的条目 id 列表
   * @param targetFolderId - 目标文件夹 id
   * @param successMessage - 成功提示文案
   * @returns true 表示移动成功，false 表示校验失败
   */
  const moveItemsToFolderLocal = (sourceIds: string[], targetFolderId: string, successMessage = '已移动到目标文件夹') => {
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

  /**
   * 将剪贴板内容应用到目标文件夹（粘贴核心逻辑）
   *
   * copy 模式：
   * - API 模式：调用 onCopyItems 回调
   * - 本地模式：调用 cloneItemTree 深拷贝条目树并追加到 itemList
   *
   * cut 模式：
   * - API 模式：调用 onMoveItems 回调，成功后清空剪贴板
   * - 本地模式：直接修改条目的 parentId，重新分配排序序号，清空剪贴板
   *
   * 安全检查：cut 模式下防止将文件夹粘贴到自身或子文件夹
   *
   * @param targetFolderId - 粘贴目标文件夹 id
   */
  const applyClipboardToFolder = async (targetFolderId: string) => {
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
      if (params.onCopyItems) {
        try {
          await params.onCopyItems(clipboard.itemIds, targetFolderId);
          message.success('已复制到当前目录');
          params.hideContextMenu();
        } catch (error) {}
        return;
      }

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
      params.hideContextMenu();
      return;
    }

    if (params.onMoveItems) {
      const movableIds = sourceItems.filter((item) => item.parentId !== targetFolderId).map((item) => item.id);
      if (!movableIds.length) {
        params.hideContextMenu();
        return;
      }
      try {
        await params.onMoveItems(movableIds, targetFolderId);
        resetClipboard();
        message.success('已移动到当前目录');
        params.hideContextMenu();
      } catch (error) {}
      return;
    }

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
    params.hideContextMenu();
  };

  /**
   * 复制操作：将当前操作目标条目写入剪贴板（mode: 'copy'）
   * 不需要管理权限（复制是只读操作）
   * 过滤掉根节点，写入后显示成功提示
   */
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

  /**
   * 剪切操作：将当前操作目标条目写入剪贴板（mode: 'cut'）
   * 需要管理权限，剪切后条目渲染为半透明（通过 clipboardCutIdSet 控制）
   * 实际移动在粘贴时执行
   */
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

  /**
   * 粘贴操作：将剪贴板内容粘贴到当前文件夹
   * 委托给 applyClipboardToFolder(currentFolderId)
   */
  const handlePaste = () => {
    void applyClipboardToFolder(params.currentFolderId.value);
  };

  /**
   * 粘贴到指定文件夹：将剪贴板内容粘贴到右键目标文件夹
   * 目标必须是文件夹类型，否则直接关闭右键菜单
   */
  const handlePasteToItem = () => {
    const target = getItemById(params.contextMenuTargetId.value);
    if (!target || target.type !== 'folder') {
      params.hideContextMenu();
      return;
    }
    void applyClipboardToFolder(target.id);
  };

  /**
   * 删除操作：删除当前操作目标条目
   *
   * API 模式：调用 onDeleteItems 回调，成功后：
   * - 若剪贴板中有被删除的条目则清空剪贴板
   * - 若正在重命名被删除的条目则取消重命名
   * - 清空选中状态
   *
   * 本地模式：通过 getDescendantIds 收集所有后代 id，
   * 从 itemList 中过滤移除，同步清理剪贴板和重命名状态
   */
  const handleDelete = async () => {
    if (!params.canManage.value) {
      params.hideContextMenu();
      return;
    }
    const targetIds = getActionTargetIds().filter((id) => id !== 'root');
    if (!targetIds.length) {
      params.hideContextMenu();
      return;
    }

    if (params.onDeleteItems) {
      try {
        await params.onDeleteItems(targetIds);
        if (params.clipboardState.value?.itemIds.some((itemId) => targetIds.includes(itemId))) {
          resetClipboard();
        }
        if (params.renamingItemId.value && targetIds.includes(params.renamingItemId.value)) {
          params.cancelRename();
        }
        params.clearSelection();
        params.hideContextMenu();
        message.success('已删除');
      } catch (error) {}
      return;
    }

    const removeIdSet = new Set<string>();
    targetIds.forEach((id) => {
      [id, ...getDescendantIds(params.itemList.value, id)].forEach((removeId) => removeIdSet.add(removeId));
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
    moveItemsToFolder: moveItemsToFolderLocal,
    resetClipboard,
    handleCopy,
    handleCut,
    handlePaste,
    handlePasteToItem,
    handleDelete,
  };
}
