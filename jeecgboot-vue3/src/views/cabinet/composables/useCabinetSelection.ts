/**
 * useCabinetSelection - 文件柜条目选择管理
 *
 * 负责管理文件柜中条目的选中状态，支持以下交互方式：
 * - 单击：选中单个条目
 * - Ctrl/Cmd + 单击：追加/取消选中单个条目
 * - Shift + 单击：范围选中（从锚点到当前条目）
 * - Ctrl/Cmd + Shift + 单击：追加范围选中
 * - 空白区域拖拽：框选（marquee selection）
 * - Ctrl/Cmd + A：全选当前可见条目
 * - Delete：删除选中条目（需要管理权限）
 * - Ctrl/Cmd + C/X/V：复制/剪切/粘贴
 *
 * 框选实现原理：
 * 在空白区域按下鼠标时记录起始坐标，mousemove 时计算选框矩形，
 * 遍历所有 .file-item[data-file-id] 元素判断是否与选框相交，
 * mouseup 时结束框选并清理事件监听。
 */
import { computed, ref, type ComputedRef, type Ref } from 'vue';

interface UseCabinetSelectionParams {
  /** 当前可见条目 id 列表，用于全选和范围选中 */
  currentVisibleItemIds: ComputedRef<string[]>;
  /** 网格面板 DOM 引用，用于框选时计算坐标和查找条目元素 */
  gridPanelRef: Ref<HTMLElement | null>;
  /** 当前正在重命名的条目 id，重命名时屏蔽键盘快捷键 */
  renamingItemId: Ref<string>;
  /** 是否有管理权限，无权限时禁用删除/剪切操作 */
  canManage: Ref<boolean>;
  /** 隐藏右键菜单的回调 */
  hideContextMenu: () => void;
  /** 复制操作回调（Ctrl+C） */
  onCopy: () => void;
  /** 剪切操作回调（Ctrl+X） */
  onCut: () => void;
  /** 粘贴操作回调（Ctrl+V） */
  onPaste: () => void;
  /** 删除操作回调（Delete 键） */
  onDelete: () => void;
}

export function useCabinetSelection(params: UseCabinetSelectionParams) {
  /** 当前已选中的条目 id 列表 */
  const selectedItemIds = ref<string[]>([]);
  /** 范围选中的锚点 id（Shift 点击时的起始条目） */
  const selectionAnchorId = ref('');
  /** 已选中 id 的 Set，用于 O(1) 查找 */
  const selectedIdSet = computed(() => new Set(selectedItemIds.value));

  /**
   * 框选（marquee）状态
   * visible: 是否正在框选
   * left/top/width/height: 选框的位置和尺寸（相对于面板滚动坐标系）
   * startX/startY: 鼠标按下时的起始坐标
   * appendMode: 是否为追加模式（Ctrl 按下时框选不清除已有选中）
   */
  const selectionBox = ref({
    visible: false,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0,
    appendMode: false,
  });

  /** 框选开始时已选中的条目 id 列表（追加模式下保留） */
  let marqueeBaseSelection: string[] = [];

  /** 清空所有选中状态和锚点 */
  const clearSelection = () => {
    selectedItemIds.value = [];
    selectionAnchorId.value = '';
  };

  /** 全选当前可见的所有条目，并隐藏右键菜单 */
  const selectAllVisibleItems = () => {
    selectedItemIds.value = [...params.currentVisibleItemIds.value];
    selectionAnchorId.value = selectedItemIds.value[0] || '';
    params.hideContextMenu();
  };

  /** 选中单个条目并设置为锚点 */
  const selectSingleItem = (itemId: string) => {
    selectedItemIds.value = [itemId];
    selectionAnchorId.value = itemId;
  };

  /**
   * 处理条目点击事件，支持三种选择模式：
   * - Shift + 单击：从锚点到当前条目的范围选中
   * - Ctrl/Cmd + 单击：追加或取消单个条目
   * - 普通单击：仅选中当前条目
   *
   * @param itemId - 被点击的条目 id
   * @param event  - 鼠标事件，用于读取修饰键状态
   */
  const handleItemClick = (itemId: string, event: MouseEvent) => {
    const visibleIds = params.currentVisibleItemIds.value;
    const itemIndex = visibleIds.indexOf(itemId);
    const append = event.ctrlKey || event.metaKey;
    const rangeSelect = event.shiftKey && selectionAnchorId.value;

    if (rangeSelect) {
      const anchorIndex = visibleIds.indexOf(selectionAnchorId.value);
      if (anchorIndex !== -1 && itemIndex !== -1) {
        const [startIndex, endIndex] = anchorIndex < itemIndex ? [anchorIndex, itemIndex] : [itemIndex, anchorIndex];
        const rangeIds = visibleIds.slice(startIndex, endIndex + 1);
        selectedItemIds.value = append ? Array.from(new Set([...selectedItemIds.value, ...rangeIds])) : rangeIds;
        params.hideContextMenu();
        return;
      }
    }

    if (append) {
      if (selectedIdSet.value.has(itemId)) {
        selectedItemIds.value = selectedItemIds.value.filter((id) => id !== itemId);
      } else {
        selectedItemIds.value = [...selectedItemIds.value, itemId];
      }
      selectionAnchorId.value = itemId;
    } else {
      selectSingleItem(itemId);
    }
    params.hideContextMenu();
  };

  /**
   * 在框选过程中更新选框尺寸和命中的条目
   * 计算当前鼠标位置与起始点形成的矩形，遍历所有 .file-item 元素判断相交
   * 追加模式下合并 marqueeBaseSelection 和新命中的条目
   *
   * @param event - mousemove 事件
   */
  const updateMarqueeSelection = (event: MouseEvent) => {
    if (!selectionBox.value.visible || !params.gridPanelRef.value) {
      return;
    }
    const panel = params.gridPanelRef.value;
    const rect = panel.getBoundingClientRect();
    const currentX = event.clientX - rect.left + panel.scrollLeft;
    const currentY = event.clientY - rect.top + panel.scrollTop;
    const left = Math.min(selectionBox.value.startX, currentX);
    const top = Math.min(selectionBox.value.startY, currentY);
    const width = Math.abs(currentX - selectionBox.value.startX);
    const height = Math.abs(currentY - selectionBox.value.startY);

    selectionBox.value.left = left;
    selectionBox.value.top = top;
    selectionBox.value.width = width;
    selectionBox.value.height = height;

    const hitIds: string[] = [];
    const itemNodes = panel.querySelectorAll<HTMLElement>('.file-item[data-file-id]');
    itemNodes.forEach((node) => {
      const fileId = node.dataset.fileId;
      if (!fileId) {
        return;
      }
      const nodeRect = node.getBoundingClientRect();
      const nodeLeft = nodeRect.left - rect.left + panel.scrollLeft;
      const nodeTop = nodeRect.top - rect.top + panel.scrollTop;
      const nodeRight = nodeLeft + nodeRect.width;
      const nodeBottom = nodeTop + nodeRect.height;
      const isIntersect = nodeLeft < left + width && nodeRight > left && nodeTop < top + height && nodeBottom > top;
      if (isIntersect) {
        hitIds.push(fileId);
      }
    });

    selectedItemIds.value = selectionBox.value.appendMode ? Array.from(new Set([...marqueeBaseSelection, ...hitIds])) : hitIds;
  };

  /** mousemove 事件处理器，委托给 updateMarqueeSelection */
  const handleMarqueeMouseMove = (event: MouseEvent) => {
    updateMarqueeSelection(event);
  };

  /** mouseup 事件处理器：结束框选，隐藏选框，移除全局事件监听 */
  const handleMarqueeMouseUp = () => {
    selectionBox.value.visible = false;
    selectionBox.value.width = 0;
    selectionBox.value.height = 0;
    window.removeEventListener('mousemove', handleMarqueeMouseMove);
    window.removeEventListener('mouseup', handleMarqueeMouseUp);
  };

  /**
   * 网格空白区域 mousedown 事件处理器，启动框选
   * 仅响应左键（button === 0），点击在 .file-item 上时不触发
   * Ctrl/Cmd 按下时为追加模式，保留已有选中；否则先清空选中
   *
   * @param event - mousedown 事件
   */
  const handleGridBlankMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || !params.gridPanelRef.value) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('.file-item')) {
      return;
    }
    params.hideContextMenu();

    const panel = params.gridPanelRef.value;
    const rect = panel.getBoundingClientRect();
    const startX = event.clientX - rect.left + panel.scrollLeft;
    const startY = event.clientY - rect.top + panel.scrollTop;
    const appendMode = event.ctrlKey || event.metaKey;

    marqueeBaseSelection = appendMode ? [...selectedItemIds.value] : [];
    if (!appendMode) {
      clearSelection();
    }

    selectionBox.value.visible = true;
    selectionBox.value.left = startX;
    selectionBox.value.top = startY;
    selectionBox.value.startX = startX;
    selectionBox.value.startY = startY;
    selectionBox.value.width = 0;
    selectionBox.value.height = 0;
    selectionBox.value.appendMode = appendMode;

    window.addEventListener('mousemove', handleMarqueeMouseMove);
    window.addEventListener('mouseup', handleMarqueeMouseUp);
  };

  /**
   * 判断是否应忽略键盘快捷键
   * 当焦点在输入框、文本域或可编辑元素内时返回 true，避免干扰用户输入
   *
   * @param event - keydown 事件
   * @returns true 表示应忽略该快捷键
   */
  const shouldIgnoreShortcut = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }
    return Boolean(target.closest('input, textarea, [contenteditable="true"], .ant-input, .ant-input-affix-wrapper'));
  };

  /**
   * 全局 keydown 事件处理器，响应文件柜键盘快捷键
   * 在重命名状态或输入框聚焦时自动忽略
   *
   * 支持的快捷键：
   * - Ctrl/Cmd + A：全选
   * - Delete：删除选中条目（需管理权限）
   * - Ctrl/Cmd + C：复制
   * - Ctrl/Cmd + X：剪切（需管理权限）
   * - Ctrl/Cmd + V：粘贴
   *
   * @param event - keydown 事件
   */
  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event) || params.renamingItemId.value) {
      return;
    }
    const withCommand = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (withCommand && key === 'a') {
      event.preventDefault();
      selectAllVisibleItems();
      return;
    }
    if (key === 'delete' && selectedItemIds.value.length && params.canManage.value) {
      event.preventDefault();
      params.onDelete();
      return;
    }
    if (!withCommand) {
      return;
    }
    if (key === 'c' && selectedItemIds.value.length) {
      event.preventDefault();
      params.onCopy();
      return;
    }
    if (key === 'x' && selectedItemIds.value.length && params.canManage.value) {
      event.preventDefault();
      params.onCut();
      return;
    }
    if (key === 'v') {
      event.preventDefault();
      params.onPaste();
    }
  };

  return {
    selectedItemIds,
    selectionAnchorId,
    selectedIdSet,
    selectionBox,
    clearSelection,
    selectAllVisibleItems,
    selectSingleItem,
    handleItemClick,
    handleGridBlankMouseDown,
    handleMarqueeMouseMove,
    handleMarqueeMouseUp,
    handleGlobalKeydown,
  };
}
