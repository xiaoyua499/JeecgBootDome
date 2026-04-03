import type { DataNode } from 'ant-design-vue/es/tree';
import type { BreadcrumbItem, CabinetItem, GroupField, GroupSection, SortField, SortOrder } from './types';

export function parseSizeToBytes(sizeText: string) {
  if (!sizeText || sizeText === '-') {
    return 0;
  }
  const matched = sizeText.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!matched) {
    return 0;
  }
  const sizeValue = Number(matched[1]);
  const unit = matched[2].toUpperCase();
  const unitMap: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return sizeValue * (unitMap[unit] || 1);
}

export function sortCabinetItems(items: CabinetItem[], sortField: SortField, sortOrder: SortOrder) {
  const nextItems = [...items];
  if (sortField === 'manual') {
    return nextItems.sort((left, right) => {
      if (left.orderNo === right.orderNo) {
        return left.name.localeCompare(right.name, 'zh-CN');
      }
      return left.orderNo - right.orderNo;
    });
  }
  const factor = sortOrder === 'asc' ? 1 : -1;
  return nextItems.sort((left, right) => {
    let compareResult = 0;
    if (sortField === 'name') {
      compareResult = left.name.localeCompare(right.name, 'zh-CN');
    } else if (sortField === 'updateTime') {
      compareResult = new Date(left.updateTime).getTime() - new Date(right.updateTime).getTime();
    } else if (sortField === 'ext') {
      compareResult = left.ext.localeCompare(right.ext, 'zh-CN');
      if (compareResult === 0) {
        compareResult = left.name.localeCompare(right.name, 'zh-CN');
      }
    } else if (sortField === 'size') {
      compareResult = parseSizeToBytes(left.size) - parseSizeToBytes(right.size);
      if (compareResult === 0) {
        compareResult = left.name.localeCompare(right.name, 'zh-CN');
      }
    }
    return compareResult * factor;
  });
}

export function resolveNameGroupTitle(name: string) {
  const normalized = name.trim();
  if (!normalized) {
    return '#';
  }
  const firstChar = normalized.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
}

export function resolveGroupTitle(item: CabinetItem, groupField: GroupField) {
  if (groupField === 'none') {
    return '';
  }
  if (groupField === 'type') {
    return item.type === 'folder' ? '文件夹' : '文件';
  }
  if (groupField === 'name') {
    return resolveNameGroupTitle(item.name);
  }
  if (groupField === 'updateTime') {
    return item.updateTime.split(' ')[0] || '未知日期';
  }
  if (groupField === 'size') {
    if (item.type === 'folder') {
      return '文件夹';
    }
    const size = parseSizeToBytes(item.size);
    if (size < 1024 * 1024) {
      return '1 MB 以下';
    }
    if (size < 10 * 1024 * 1024) {
      return '1 MB - 10 MB';
    }
    return '10 MB 以上';
  }
  return '';
}

export function buildGroupedSections(items: CabinetItem[], groupField: GroupField): GroupSection[] {
  if (groupField === 'none') {
    return [{ key: 'all', title: '', items }];
  }
  const sectionMap = new Map<string, GroupSection>();
  items.forEach((item) => {
    const title = resolveGroupTitle(item, groupField);
    if (!sectionMap.has(title)) {
      sectionMap.set(title, { key: title || 'default', title, items: [] });
    }
    sectionMap.get(title)?.items.push(item);
  });
  const sections = Array.from(sectionMap.values());
  if (groupField === 'type') {
    const typeOrder: Record<string, number> = { 文件夹: 1, 文件: 2 };
    return sections.sort((left, right) => (typeOrder[left.title] || 99) - (typeOrder[right.title] || 99));
  }
  if (groupField === 'size') {
    const sizeOrder: Record<string, number> = { 文件夹: 1, '1 MB 以下': 2, '1 MB - 10 MB': 3, '10 MB 以上': 4 };
    return sections.sort((left, right) => (sizeOrder[left.title] || 99) - (sizeOrder[right.title] || 99));
  }
  if (groupField === 'updateTime') {
    return sections.sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'));
  }
  if (groupField === 'name') {
    return sections.sort((left, right) => {
      if (left.title === '#') return 1;
      if (right.title === '#') return -1;
      return left.title.localeCompare(right.title, 'en-US');
    });
  }
  return sections;
}

export function buildTreeData(items: CabinetItem[]): DataNode[] {
  const buildNodes = (parentId: string | null): DataNode[] => {
    return items
      .filter((item) => item.type === 'folder' && item.parentId === parentId)
      .map((folder) => ({ key: folder.id, title: folder.name, children: buildNodes(folder.id) }));
  };
  return buildNodes(null);
}

export function buildBreadcrumbItems(folderMap: Map<string, CabinetItem>, currentFolderId: string): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = [];
  let cursorId: string | null = currentFolderId;
  while (cursorId) {
    const folder = folderMap.get(cursorId);
    if (!folder) {
      break;
    }
    result.unshift({ id: folder.id, name: folder.name });
    cursorId = folder.parentId;
  }
  return result;
}

export const CABINET_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif'] as const;
export const CABINET_VIDEO_EXTS = ['mp4', 'avi', 'mov'] as const;
export const CABINET_CREATABLE_FILE_EXTS = ['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf'] as const;

export function resolveIconType(item: CabinetItem) {
  if (item.type === 'folder') return 'folder';
  if (CABINET_IMAGE_EXTS.includes(item.ext as (typeof CABINET_IMAGE_EXTS)[number])) return 'image';
  if (CABINET_VIDEO_EXTS.includes(item.ext as (typeof CABINET_VIDEO_EXTS)[number])) return 'video';
  if (item.ext === 'pdf') return 'pdf';
  if (['zip', 'rar', '7z'].includes(item.ext)) return 'zip';
  if (['doc', 'docx'].includes(item.ext)) return 'doc';
  if (['xls', 'xlsx'].includes(item.ext)) return 'xls';
  return 'file';
}

export function resolveTypeLabel(item: CabinetItem) {
  return item.type === 'folder' ? '文件夹' : `${item.ext.toUpperCase()} 文件`;
}

export function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** 将字节数格式化为列表展示用的大小文案（与 mock 中 "1.2 MB" 风格一致） */
export function formatBytesForCabinet(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unitIndex]}`;
}

export function generateItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDescendantIds(items: CabinetItem[], itemId: string): string[] {
  const ids: string[] = [];
  const stack = [itemId];
  while (stack.length) {
    const currentId = stack.pop();
    if (!currentId) continue;
    items.forEach((item) => {
      if (item.parentId === currentId) {
        ids.push(item.id);
        if (item.type === 'folder') stack.push(item.id);
      }
    });
  }
  return ids;
}

export function isDescendantFolder(items: CabinetItem[], folderId: string, possibleAncestorId: string) {
  let cursorId: string | null = folderId;
  while (cursorId) {
    if (cursorId === possibleAncestorId) return true;
    cursorId = items.find((item) => item.id === cursorId)?.parentId ?? null;
  }
  return false;
}

export function isDescendantItem(items: CabinetItem[], itemId: string, possibleAncestorId: string) {
  let cursorId = items.find((item) => item.id === itemId)?.parentId ?? null;
  while (cursorId) {
    if (cursorId === possibleAncestorId) return true;
    cursorId = items.find((item) => item.id === cursorId)?.parentId ?? null;
  }
  return false;
}

export function buildSiblingName(name: string, siblingNames: string[]) {
  const trimmed = name.trim();
  if (!siblingNames.includes(trimmed)) return trimmed;
  const dotIndex = trimmed.lastIndexOf('.');
  const hasExt = dotIndex > 0;
  const baseName = hasExt ? trimmed.slice(0, dotIndex) : trimmed;
  const extName = hasExt ? trimmed.slice(dotIndex) : '';
  let index = 2;
  let nextName = `${baseName} - 副本${extName}`;
  while (siblingNames.includes(nextName)) {
    nextName = `${baseName} - 副本 (${index})${extName}`;
    index += 1;
  }
  return nextName;
}

export function buildIndexedSiblingName(name: string, siblingNames: string[]) {
  const trimmed = name.trim();
  if (!siblingNames.includes(trimmed)) {
    return trimmed;
  }
  const dotIndex = trimmed.lastIndexOf('.');
  const hasExt = dotIndex > 0;
  const baseName = hasExt ? trimmed.slice(0, dotIndex) : trimmed;
  const extName = hasExt ? trimmed.slice(dotIndex) : '';
  let index = 2;
  let nextName = `${baseName}(${index})${extName}`;
  while (siblingNames.includes(nextName)) {
    index += 1;
    nextName = `${baseName}(${index})${extName}`;
  }
  return nextName;
}

export function ensureCabinetFileName(name: string, fallbackExt = 'txt') {
  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return `${trimmed}.${fallbackExt}`;
  }
  return trimmed;
}

export function resolveCabinetFileExt(name: string, fallbackExt = 'txt') {
  const normalized = ensureCabinetFileName(name, fallbackExt);
  const dotIndex = normalized.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
    return fallbackExt;
  }
  return normalized.slice(dotIndex + 1).toLowerCase();
}

// 新建文件采用白名单，避免图片/视频/压缩包等类型需要反复追加黑名单。
export function isCabinetCreatableFileExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_CREATABLE_FILE_EXTS.includes(normalized as (typeof CABINET_CREATABLE_FILE_EXTS)[number]);
}

export function reassignSiblingOrder(items: CabinetItem[], parentId: string | null) {
  const siblings = items.filter((item) => item.parentId === parentId).sort((left, right) => left.orderNo - right.orderNo);
  siblings.forEach((item, index) => {
    item.orderNo = (index + 1) * 10;
  });
}
