import { computed, ref, type ComputedRef, type Ref } from 'vue';

interface UseCabinetSelectionParams {
  currentVisibleItemIds: ComputedRef<string[]>;
  gridPanelRef: Ref<HTMLElement | null>;
  renamingItemId: Ref<string>;
  canManage: Ref<boolean>;
  hideContextMenu: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export function useCabinetSelection(params: UseCabinetSelectionParams) {
  const selectedItemIds = ref<string[]>([]);
  const selectionAnchorId = ref('');
  const selectedIdSet = computed(() => new Set(selectedItemIds.value));

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

  let marqueeBaseSelection: string[] = [];

  const clearSelection = () => {
    selectedItemIds.value = [];
    selectionAnchorId.value = '';
  };

  const selectAllVisibleItems = () => {
    selectedItemIds.value = [...params.currentVisibleItemIds.value];
    selectionAnchorId.value = selectedItemIds.value[0] || '';
    params.hideContextMenu();
  };

  const selectSingleItem = (itemId: string) => {
    selectedItemIds.value = [itemId];
    selectionAnchorId.value = itemId;
  };

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

  const handleMarqueeMouseMove = (event: MouseEvent) => {
    updateMarqueeSelection(event);
  };

  const handleMarqueeMouseUp = () => {
    selectionBox.value.visible = false;
    selectionBox.value.width = 0;
    selectionBox.value.height = 0;
    window.removeEventListener('mousemove', handleMarqueeMouseMove);
    window.removeEventListener('mouseup', handleMarqueeMouseUp);
  };

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

  const shouldIgnoreShortcut = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }
    return Boolean(target.closest('input, textarea, [contenteditable="true"], .ant-input, .ant-input-affix-wrapper'));
  };

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
