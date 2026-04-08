/**
 * 文件柜模块 - 工具函数库
 *
 * 提供文件柜所有纯函数工具，包括：
 * - 排序与分组：sortCabinetItems / buildGroupedSections / resolveGroupTitle
 * - 树形结构：buildTreeData / buildBreadcrumbItems / getDescendantIds / isDescendantFolder / isDescendantItem
 * - 图标解析：resolveIconType / resolveCabinetIconSrc / resolveCabinetItemIconSrc
 * - 文件类型判断：isCabinetImageExt / isCabinetVideoExt / isCabinetAudioExt / isCabinetEditableTextExt
 * - 文件名处理：buildSiblingName / buildIndexedSiblingName / ensureCabinetFileName / resolveCabinetFileExt
 * - 格式化：formatBytesForCabinet / formatNow / parseSizeToBytes
 * - 其他：generateItemId / reassignSiblingOrder
 */

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

/**
 * 将格式化的文件大小字符串解析为字节数
 * 用于按大小排序和分组时的数值比较
 *
 * 支持单位：B / KB / MB / GB / TB（大小写不敏感）
 * 示例：parseSizeToBytes('1.2 MB') → 1258291
 *
 * @param sizeText - 格式化的大小字符串，如 "1.2 MB"、"500 KB"
 * @returns 对应的字节数，无法解析时返回 0
 */
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

/**
 * 对文件柜条目列表进行排序
 *
 * 排序规则：
 * - manual（手动）：按 orderNo 升序，orderNo 相同时按名称中文排序
 * - name：按名称中文排序，受 sortOrder 控制升降序
 * - updateTime：按修改时间排序
 * - ext：先按扩展名排序，扩展名相同时按名称排序
 * - size：先按字节数排序，大小相同时按名称排序
 *
 * 注意：manual 模式忽略 sortOrder 参数，始终升序
 *
 * @param items     - 待排序的条目列表（不修改原数组，返回新数组）
 * @param sortField - 排序字段
 * @param sortOrder - 排序方向（asc/desc），manual 模式下忽略
 * @returns 排序后的新数组
 */
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

/**
 * 根据名称首字符解析分组标题
 * 首字母为 A-Z 时返回该字母，否则（中文、数字、符号等）返回 '#'
 *
 * @param name - 条目名称
 * @returns 单个大写字母或 '#'
 */
export function resolveNameGroupTitle(name: string) {
  const normalized = name.trim();
  if (!normalized) {
    return '#';
  }
  const firstChar = normalized.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
}

/**
 * 根据分组字段解析单个条目所属的分组标题
 *
 * 各字段分组规则：
 * - none / custom：返回空字符串（不分组或由外部逻辑处理）
 * - type：文件夹 → '文件夹'，文件 → '文件'
 * - name：按首字母，英文返回大写字母，其他返回 '#'
 * - updateTime：取日期部分 'YYYY-MM-DD'，无日期返回 '未知日期'
 * - size：文件夹 → '文件夹'；文件按字节数分三档：< 1MB / 1-10MB / > 10MB
 *
 * @param item       - 文件柜条目
 * @param groupField - 当前分组字段
 * @returns 该条目所属分组的标题字符串
 */
export function resolveGroupTitle(item: CabinetItem, groupField: GroupField) {
  if (groupField === 'none') {
    return '';
  }
  if (groupField === 'custom') {
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

/**
 * 将条目列表按分组字段构建分组区块数组
 *
 * - groupField === 'none' 或 'custom'：返回单个包含所有条目的区块（key='all'）
 * - 其他字段：按 resolveGroupTitle 分组，并对各字段做特定排序：
 *   - type：文件夹在前，文件在后
 *   - size：文件夹 > 1MB以下 > 1-10MB > 10MB以上
 *   - updateTime：按日期字符串升序
 *   - name：A-Z 升序，'#' 组排最后
 *
 * @param items      - 已排序的条目列表
 * @param groupField - 当前分组字段
 * @returns GroupSection 数组，每个区块含 key、title 和 items
 */
export function buildGroupedSections(items: CabinetItem[], groupField: GroupField): GroupSection[] {
  if (groupField === 'none' || groupField === 'custom') {
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

/**
 * 将扁平的 CabinetItem 列表构建为 Ant Design Tree 所需的树形节点结构
 * 只包含 type === 'folder' 的条目，用于左侧文件夹树面板
 *
 * 递归从 parentId === null 的根节点开始构建，每层按原始顺序排列
 *
 * @param items - 完整的条目列表（含文件和文件夹）
 * @returns Ant Design DataNode 树形数组
 */
export function buildTreeData(items: CabinetItem[]): DataNode[] {
  const buildNodes = (parentId: string | null): DataNode[] => {
    return items
      .filter((item) => item.type === 'folder' && item.parentId === parentId)
      .map((folder) => ({ key: folder.id, title: folder.name, children: buildNodes(folder.id) }));
  };
  return buildNodes(null);
}

/**
 * 根据当前文件夹 id 构建面包屑导航路径
 * 从当前文件夹向上追溯父节点，直到根节点（parentId === null）
 * 结果按从根到当前的顺序排列（unshift 插入头部）
 *
 * 示例：根 > 项目 > 文档 → [{ id:'root', name:'私柜' }, { id:'xxx', name:'项目' }, { id:'yyy', name:'文档' }]
 *
 * @param folderMap       - 文件夹 id → CabinetItem 的 Map（由 useCabinetComputed 维护）
 * @param currentFolderId - 当前所在文件夹的 id
 * @returns BreadcrumbItem 数组，从根到当前文件夹
 */
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
export const CABINET_AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'] as const;
export const CABINET_EDITABLE_TEXT_EXTS = [
  'txt',
  'text',
  'md',
  'markdown',
  'json',
  'js',
  'ts',
  'jsx',
  'tsx',
  'java',
  'sql',
  'css',
  'xml',
  'html',
  'htm',
  'vue',
  'sh',
  'yml',
  'yaml',
  'properties',
  'ini',
  'log',
  'csv',
  'conf',
] as const;
export const CABINET_CREATABLE_FILE_EXTS = [...CABINET_EDITABLE_TEXT_EXTS] as const;

/**
 * 判断文件扩展名是否为图片类型
 * 支持：jpg / jpeg / png / gif / webp
 *
 * @param ext - 扩展名（不含点，大小写不敏感）
 */
export function isCabinetImageExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_IMAGE_EXTS.includes(normalized as (typeof CABINET_IMAGE_EXTS)[number]);
}

/**
 * 判断文件扩展名是否为视频类型
 * 支持：mp4 / avi / mov
 *
 * @param ext - 扩展名（不含点，大小写不敏感）
 */
export function isCabinetVideoExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_VIDEO_EXTS.includes(normalized as (typeof CABINET_VIDEO_EXTS)[number]);
}

/**
 * 判断文件扩展名是否为音频类型
 * 支持：mp3 / wav / ogg / aac / flac / m4a
 *
 * @param ext - 扩展名（不含点，大小写不敏感）
 */
export function isCabinetAudioExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_AUDIO_EXTS.includes(normalized as (typeof CABINET_AUDIO_EXTS)[number]);
}

/**
 * 判断文件扩展名是否为可在线编辑的文本类型
 * 支持：txt / md / json / js / ts / jsx / tsx / java / sql / css / xml / html / vue / sh / yml 等
 * 使用白名单机制，避免图片/视频/压缩包等二进制文件被误判为可编辑
 *
 * @param ext - 扩展名（不含点，大小写不敏感）
 */
export function isCabinetEditableTextExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_EDITABLE_TEXT_EXTS.includes(normalized as (typeof CABINET_EDITABLE_TEXT_EXTS)[number]);
}

/**
 * 根据条目信息推断图标类型字符串
 * 优先级：文件夹 > 图片 > 视频 > pdf > 压缩包 > doc > xls > txt > 通用文件
 * 返回值对应 CABINET_ICON_ASSET_MAP 的键
 *
 * @param item - 文件柜条目
 * @returns 图标类型字符串，如 'folder' / 'image' / 'pdf' / 'file' 等
 */
export function resolveIconType(item: CabinetItem) {
  if (item.type === 'folder') return 'folder';
  if (isCabinetImageExt(item.ext)) return 'image';
  if (isCabinetVideoExt(item.ext)) return 'video';
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

/**
 * 根据图标类型 key 和尺寸获取对应的图标资源路径
 * 图标资源统一从 CABINET_ICON_ASSET_MAP 映射，组件层只关心业务类型，不直接依赖具体文件名
 * 传入未知 key 时自动降级为 'file' 通用图标
 *
 * @param iconType - 图标类型 key，对应 CABINET_ICON_ASSET_MAP 的键
 * @param size     - 图标尺寸：large（100px）或 small（50px），默认 small
 * @returns 图标图片的 import 路径（编译时已解析为实际 URL）
 */
export function resolveCabinetIconSrc(iconType: string, size: 'large' | 'small' = 'small') {
  const normalizedType = iconType in CABINET_ICON_ASSET_MAP ? (iconType as keyof typeof CABINET_ICON_ASSET_MAP) : 'file';
  return CABINET_ICON_ASSET_MAP[normalizedType][size];
}

/**
 * 解析文件柜条目的最终显示图标路径
 * 优先级：用户自定义图标 > iconKey 内置图标 > 按扩展名自动推断图标
 *
 * @param item - 文件柜条目
 * @param size - 图标尺寸：large（100px）或 small（50px），默认 small
 * @returns 可直接用于 <img src> 的图标路径
 */
export function resolveCabinetItemIconSrc(item: CabinetItem, size: 'large' | 'small' = 'small') {
  if (item.customIcon) {
    return item.customIcon;
  }
  if (item.iconKey) {
    return resolveCabinetIconSrc(item.iconKey, size);
  }
  return resolveCabinetIconSrc(resolveIconType(item), size);
}

/**
 * 获取条目的类型显示标签
 * 文件夹返回 '文件夹'，文件返回 'XXX 文件'（如 'PDF 文件'、'TXT 文件'）
 *
 * @param item - 文件柜条目
 * @returns 类型标签字符串
 */
export function resolveTypeLabel(item: CabinetItem) {
  return item.type === 'folder' ? '文件夹' : `${item.ext.toUpperCase()} 文件`;
}

/**
 * 获取当前时间的格式化字符串
 * 格式：'YYYY-MM-DD HH:mm'，用于新建/修改条目时填充 createTime / updateTime
 *
 * @returns 当前时间字符串，如 '2024-01-15 09:30'
 */
export function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** 将字节数格式化为列表展示用的大小文案（与 mock 中 "1.2 MB" 风格一致）
 *
 * 自动选择合适的单位（B/KB/MB/GB/TB），保留一位小数（字节级别取整）
 * 示例：formatBytesForCabinet(1258291) → '1.2 MB'
 *
 * @param bytes - 字节数（非有限数或负数返回 '0 B'）
 * @returns 格式化后的大小字符串
 */
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

/**
 * 生成唯一条目 id
 * 格式：'{prefix}-{timestamp}-{random6chars}'
 * 用于本地 mock 或剪贴板复制时创建临时 id
 *
 * @param prefix - id 前缀，通常为条目类型（'folder' 或 'file'）
 * @returns 唯一 id 字符串
 */
export function generateItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 获取指定条目的所有后代条目 id（递归，含多层嵌套）
 * 用于删除文件夹时同步删除所有子条目，或复制时克隆整棵子树
 *
 * 使用迭代栈（非递归）避免深层嵌套时栈溢出
 *
 * @param items  - 完整条目列表
 * @param itemId - 起始条目 id（不含自身，只返回后代）
 * @returns 所有后代条目的 id 数组
 */
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

/**
 * 判断一个文件夹是否是另一个文件夹的后代（或本身）
 * 用于移动/粘贴时防止将文件夹移动到自身或其子文件夹中
 *
 * 从 folderId 向上追溯父节点，若途中遇到 possibleAncestorId 则返回 true
 *
 * @param items              - 完整条目列表
 * @param folderId           - 待检查的文件夹 id
 * @param possibleAncestorId - 可能的祖先文件夹 id
 * @returns true 表示 folderId 是 possibleAncestorId 的后代（或相同）
 */
export function isDescendantFolder(items: CabinetItem[], folderId: string, possibleAncestorId: string) {
  let cursorId: string | null = folderId;
  while (cursorId) {
    if (cursorId === possibleAncestorId) return true;
    cursorId = items.find((item) => item.id === cursorId)?.parentId ?? null;
  }
  return false;
}

/**
 * 判断一个条目是否是某个文件夹的后代
 * 与 isDescendantFolder 的区别：从条目的父节点开始向上追溯（不含自身）
 * 用于批量操作时过滤掉已被祖先覆盖的冗余条目
 *
 * @param items              - 完整条目列表
 * @param itemId             - 待检查的条目 id
 * @param possibleAncestorId - 可能的祖先文件夹 id
 * @returns true 表示 itemId 是 possibleAncestorId 的后代
 */
export function isDescendantItem(items: CabinetItem[], itemId: string, possibleAncestorId: string) {
  let cursorId = items.find((item) => item.id === itemId)?.parentId ?? null;
  while (cursorId) {
    if (cursorId === possibleAncestorId) return true;
    cursorId = items.find((item) => item.id === cursorId)?.parentId ?? null;
  }
  return false;
}

/**
 * 为条目生成不与同级名称冲突的副本名称
 * 用于复制粘贴时自动处理同名冲突
 *
 * 命名规则：
 * - 无冲突：直接返回原名
 * - 第一次冲突：'{baseName} - 副本{ext}'
 * - 后续冲突：'{baseName} - 副本 (2){ext}'、'{baseName} - 副本 (3){ext}'...
 *
 * 示例：buildSiblingName('report.pdf', ['report.pdf']) → 'report - 副本.pdf'
 *
 * @param name         - 原始名称（含扩展名）
 * @param siblingNames - 同级已存在的名称列表
 * @returns 不冲突的新名称
 */
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

/**
 * 为条目生成不与同级名称冲突的带序号名称
 * 与 buildSiblingName 的区别：使用数字序号而非"副本"后缀
 * 用于上传同名文件时自动重命名
 *
 * 命名规则：
 * - 无冲突：直接返回原名
 * - 第一次冲突：'{baseName}(2){ext}'
 * - 后续冲突：'{baseName}(3){ext}'、'{baseName}(4){ext}'...
 *
 * 示例：buildIndexedSiblingName('photo.jpg', ['photo.jpg']) → 'photo(2).jpg'
 *
 * @param name         - 原始名称（含扩展名）
 * @param siblingNames - 同级已存在的名称列表
 * @returns 不冲突的新名称
 */
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

/**
 * 确保文件名包含扩展名
 * 若文件名没有扩展名（无点、点在开头、点在末尾），则追加 fallbackExt
 *
 * 示例：
 * - ensureCabinetFileName('readme') → 'readme.txt'
 * - ensureCabinetFileName('report.pdf') → 'report.pdf'
 * - ensureCabinetFileName('.hidden') → '.hidden.txt'
 *
 * @param name        - 原始文件名
 * @param fallbackExt - 无扩展名时使用的默认扩展名，默认 'txt'
 * @returns 保证含扩展名的文件名，空字符串输入返回空字符串
 */
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

/**
 * 从文件名中解析扩展名（小写）
 * 内部先调用 ensureCabinetFileName 确保文件名有扩展名
 *
 * 示例：
 * - resolveCabinetFileExt('report.PDF') → 'pdf'
 * - resolveCabinetFileExt('readme') → 'txt'（使用 fallbackExt）
 *
 * @param name        - 文件名
 * @param fallbackExt - 无扩展名时的默认扩展名，默认 'txt'
 * @returns 小写扩展名字符串（不含点）
 */
export function resolveCabinetFileExt(name: string, fallbackExt = 'txt') {
  const normalized = ensureCabinetFileName(name, fallbackExt);
  const dotIndex = normalized.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
    return fallbackExt;
  }
  return normalized.slice(dotIndex + 1).toLowerCase();
}

/**
 * 判断文件扩展名是否允许在文件柜中新建
 * 使用白名单机制（CABINET_CREATABLE_FILE_EXTS），只允许文本类文件
 * 避免用户新建图片/视频/压缩包等需要二进制内容的文件类型
 *
 * @param ext - 扩展名（不含点，大小写不敏感）
 * @returns true 表示可以新建该类型文件
 */
export function isCabinetCreatableFileExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  return CABINET_CREATABLE_FILE_EXTS.includes(normalized as (typeof CABINET_CREATABLE_FILE_EXTS)[number]);
}

/**
 * 重新分配同级条目的排序序号
 * 在移动/删除/新增条目后调用，将同级条目的 orderNo 重置为连续的 10 的倍数
 * 例如：[10, 20, 30, 40, ...] 避免序号空洞导致排序异常
 *
 * 直接修改传入的 items 数组中对应条目的 orderNo（原地修改）
 *
 * @param items    - 完整条目列表（原地修改）
 * @param parentId - 需要重新排序的父文件夹 id
 */
export function reassignSiblingOrder(items: CabinetItem[], parentId: string | null) {
  const siblings = items.filter((item) => item.parentId === parentId).sort((left, right) => left.orderNo - right.orderNo);
  siblings.forEach((item, index) => {
    item.orderNo = (index + 1) * 10;
  });
}
