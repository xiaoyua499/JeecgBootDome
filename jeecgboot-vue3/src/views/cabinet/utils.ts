import type { DataNode } from 'ant-design-vue/es/tree';
import type { BreadcrumbItem, CabinetItem, GroupField, GroupSection, SortField, SortOrder } from './types';
import iconDoc50 from '/@/assets/images/icon/icons8-doc-50.png';
import iconDoc100 from '/@/assets/images/icon/icons8-doc-100.png';
import iconDwg50 from '/@/assets/images/icon/icons8-.dwg-50.png';
import iconDwg100 from '/@/assets/images/icon/icons8-.dwg-100.png';
import icon7Zip50 from '/@/assets/images/icon/icons8-7zip-50.png';
import icon7Zip100 from '/@/assets/images/icon/icons8-7zip-100.png';
import iconCss50 from '/@/assets/images/icon/icons8-css文件类型-50.png';
import iconCss100 from '/@/assets/images/icon/icons8-css文件类型-100.png';
import iconExcel50 from '/@/assets/images/icon/icons8-xls-50.png';
import iconExcel100 from '/@/assets/images/icon/icons8-xls-100.png';
import iconFile50 from '/@/assets/images/icon/icons8-文件-50.png';
import iconFile100 from '/@/assets/images/icon/icons8-文件-100.png';
import iconFolder50 from '/@/assets/images/icon/icons8-文件夹-50.png';
import iconFolder100 from '/@/assets/images/icon/icons8-文件夹-100.png';
import iconHtml50 from '/@/assets/images/icon/icons8-html文件类型-50.png';
import iconHtml100 from '/@/assets/images/icon/icons8-html文件类型-100.png';
import iconImage50 from '/@/assets/images/icon/icons8-图像文件-50.png';
import iconImage100 from '/@/assets/images/icon/icons8-图像文件-100.png';
import iconJava50 from '/@/assets/images/icon/icons8-java-文件-50.png';
import iconJava100 from '/@/assets/images/icon/icons8-java-文件-100.png';
import iconJpg50 from '/@/assets/images/icon/icons8-jpg-50.png';
import iconJpg100 from '/@/assets/images/icon/icons8-jpg-100.png';
import iconJson50 from '/@/assets/images/icon/icons8-json-50.png';
import iconJson100 from '/@/assets/images/icon/icons8-json-100.png';
import iconMenu50 from '/@/assets/images/icon/icons8-菜单-50.png';
import iconMenu100 from '/@/assets/images/icon/icons8-菜单-100.png';
import iconMp350 from '/@/assets/images/icon/icons8-mp3-50.png';
import iconMp3100 from '/@/assets/images/icon/icons8-mp3-100.png';
import iconPdf50 from '/@/assets/images/icon/icons8-pdf-50.png';
import iconPdf100 from '/@/assets/images/icon/icons8-pdf-100.png';
import iconPng50 from '/@/assets/images/icon/icons8-png-50.png';
import iconPng100 from '/@/assets/images/icon/icons8-png-100.png';
import iconPpt50 from '/@/assets/images/icon/icons8-ppt-50.png';
import iconPpt100 from '/@/assets/images/icon/icons8-ppt-100.png';
import iconRar50 from '/@/assets/images/icon/icons8-rar-50.png';
import iconRar100 from '/@/assets/images/icon/icons8-rar-100.png';
import iconTar50 from '/@/assets/images/icon/icons8-tar-50.png';
import iconTar100 from '/@/assets/images/icon/icons8-tar-100.png';
import iconText50 from '/@/assets/images/icon/icons8-文本-50.png';
import iconText100 from '/@/assets/images/icon/icons8-文本-100.png';
import iconThumb50 from '/@/assets/images/icon/icons8-缩略图-50.png';
import iconThumb100 from '/@/assets/images/icon/icons8-缩略图-100.png';
import iconVideo50 from '/@/assets/images/icon/icons8-视频文件-50.png';
import iconVideo100 from '/@/assets/images/icon/icons8-视频文件-100.png';
import iconWord50 from '/@/assets/images/icon/icons8-microsoft-word-2019-50.png';
import iconWord100 from '/@/assets/images/icon/icons8-microsoft-word-2019-100.png';
import iconExcel201950 from '/@/assets/images/icon/icons8-microsoft-excel-2019-50.png';
import iconExcel2019100 from '/@/assets/images/icon/icons8-microsoft-excel-2019-100.png';
import iconZip50 from '/@/assets/images/icon/icons8-压缩-50.png';
import iconZip100 from '/@/assets/images/icon/icons8-压缩-100.png';

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

export const CABINET_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
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
  if (item.ext === 'txt') return 'text';
  return 'file';
}

const CABINET_ICON_ASSET_MAP = {
  folder: { large: iconFolder100, small: iconFolder50 },
  image: { large: iconImage100, small: iconImage50 },
  video: { large: iconVideo100, small: iconVideo50 },
  pdf: { large: iconPdf100, small: iconPdf50 },
  zip: { large: iconZip100, small: iconZip50 },
  doc: { large: iconDoc100, small: iconDoc50 },
  xls: { large: iconExcel100, small: iconExcel50 },
  text: { large: iconText100, small: iconText50 },
  file: { large: iconFile100, small: iconFile50 },
  dwg: { large: iconDwg100, small: iconDwg50 },
  sevenZip: { large: icon7Zip100, small: icon7Zip50 },
  css: { large: iconCss100, small: iconCss50 },
  html: { large: iconHtml100, small: iconHtml50 },
  java: { large: iconJava100, small: iconJava50 },
  jpg: { large: iconJpg100, small: iconJpg50 },
  json: { large: iconJson100, small: iconJson50 },
  menu: { large: iconMenu100, small: iconMenu50 },
  mp3: { large: iconMp3100, small: iconMp350 },
  png: { large: iconPng100, small: iconPng50 },
  ppt: { large: iconPpt100, small: iconPpt50 },
  rar: { large: iconRar100, small: iconRar50 },
  tar: { large: iconTar100, small: iconTar50 },
  thumbnail: { large: iconThumb100, small: iconThumb50 },
  word: { large: iconWord100, small: iconWord50 },
  excel2019: { large: iconExcel2019100, small: iconExcel201950 },
} as const;

export type CabinetBuiltInIconKey = keyof typeof CABINET_ICON_ASSET_MAP;

export const CABINET_BUILTIN_ICON_OPTIONS: Array<{ key: CabinetBuiltInIconKey; label: string }> = [
  { key: 'folder', label: '文件夹' },
  { key: 'file', label: '通用文件' },
  { key: 'text', label: '文本' },
  { key: 'doc', label: 'DOC' },
  { key: 'word', label: 'Word 2019' },
  { key: 'xls', label: 'XLS' },
  { key: 'excel2019', label: 'Excel 2019' },
  { key: 'pdf', label: 'PDF' },
  { key: 'image', label: '图片文件' },
  { key: 'jpg', label: 'JPG' },
  { key: 'png', label: 'PNG' },
  { key: 'video', label: '视频文件' },
  { key: 'mp3', label: 'MP3' },
  { key: 'zip', label: '压缩包' },
  { key: 'rar', label: 'RAR' },
  { key: 'sevenZip', label: '7ZIP' },
  { key: 'tar', label: 'TAR' },
  { key: 'ppt', label: 'PPT' },
  { key: 'json', label: 'JSON' },
  { key: 'html', label: 'HTML' },
  { key: 'css', label: 'CSS' },
  { key: 'java', label: 'JAVA' },
  { key: 'dwg', label: 'DWG' },
  { key: 'thumbnail', label: '缩略图' },
  { key: 'menu', label: '菜单' },
] as const;

// 图标资源统一从这里映射，组件层只关心业务类型，不直接依赖具体文件名。
export function resolveCabinetIconSrc(iconType: string, size: 'large' | 'small' = 'small') {
  const normalizedType = iconType in CABINET_ICON_ASSET_MAP ? (iconType as keyof typeof CABINET_ICON_ASSET_MAP) : 'file';
  return CABINET_ICON_ASSET_MAP[normalizedType][size];
}

// 用户自定义图标优先级最高，未设置时再回退到系统默认图标映射。
export function resolveCabinetItemIconSrc(item: CabinetItem, size: 'large' | 'small' = 'small') {
  if (item.customIcon) {
    return item.customIcon;
  }
  if (item.iconKey) {
    return resolveCabinetIconSrc(item.iconKey, size);
  }
  return resolveCabinetIconSrc(resolveIconType(item), size);
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
