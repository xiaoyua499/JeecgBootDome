/**
 * 文件柜模块 - 数据适配层
 *
 * 负责将后端返回的 DTO（数据传输对象）转换为前端内部使用的 CabinetItem 格式。
 * 所有与后端数据结构的耦合都集中在此文件，组件层只依赖 CabinetItem。
 */

import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import type { CabinetBootstrapDTO, CabinetBootstrapItemDTO } from './cabinet.api';
import type { CabinetItem } from './types';
import { formatBytesForCabinet } from './utils';

/** 根节点的固定 id，前端约定使用字符串 'root' 表示文件柜根目录 */
export const CABINET_ROOT_ID = 'root';

/**
 * 不同 scope 对应的根节点默认显示名称
 * 当 CabinetExplorer 未传入 cabinetName 时使用此映射
 */
const CABINET_ROOT_NAME_MAP = {
  private: '私柜',
  public: '公柜',
} as const;

/**
 * 解析条目时间字段
 * 后端有时只返回 createTime 或 updateTime 其中一个，此函数做兜底处理
 *
 * @param value    - 优先使用的时间字符串
 * @param fallback - 备用时间字符串
 * @returns 非空时间字符串，两者都为空时返回 ''
 */
function resolveItemTime(value?: string, fallback?: string) {
  return value || fallback || '';
}

/**
 * 解析自定义图标路径为可访问的 URL
 *
 * 处理两种情况：
 * 1. data: 开头的 base64 内联图片 → 直接返回，无需转换
 * 2. 服务器相对路径 → 通过 getFileAccessHttpUrl 拼接完整访问地址
 *
 * @param customIconPath - 后端返回的图标路径
 * @returns 可直接用于 <img src> 的 URL，无路径时返回 undefined
 */
function resolveCustomIcon(customIconPath?: string) {
  if (!customIconPath) {
    return undefined;
  }
  if (customIconPath.startsWith('data:')) {
    return customIconPath;
  }
  return getFileAccessHttpUrl(customIconPath);
}

/**
 * 将单个后端条目 DTO 转换为前端 CabinetItem
 *
 * 主要转换逻辑：
 * - itemType 'folder'/'file' → type 'folder'/'file'
 * - sizeBytes 字节数 → 格式化字符串（文件夹显示 '-'）
 * - sortNo → orderNo（默认值 10）
 * - parentId null → CABINET_ROOT_ID 'root'
 * - customIconPath → 完整可访问 URL
 *
 * @param item - 后端返回的原始条目数据
 * @returns 前端标准 CabinetItem 对象
 */
export function adaptCabinetItem(item: CabinetBootstrapItemDTO): CabinetItem {
  const isFolder = item.itemType === 'folder';
  const createTime = resolveItemTime(item.createTime, item.updateTime);
  const updateTime = resolveItemTime(item.updateTime, item.createTime);
  const sizeBytes = item.sizeBytes ?? 0;
  return {
    id: item.id,
    name: item.name,
    type: isFolder ? 'folder' : 'file',
    iconKey: item.iconKey || undefined,
    customIcon: resolveCustomIcon(item.customIconPath),
    customIconPath: item.customIconPath || undefined,
    size: isFolder ? '-' : formatBytesForCabinet(sizeBytes),
    sizeBytes,
    createTime,
    updateTime,
    ext: isFolder ? 'folder' : item.ext || 'file',
    orderNo: item.sortNo ?? 10,
    parentId: item.parentId ?? CABINET_ROOT_ID,
    scope: item.scope,
    filePath: item.filePath || undefined,
    hasChild: item.hasChild || '0',
  };
}

/**
 * 将后端 bootstrap 响应转换为完整的 CabinetItem 列表（含根节点）
 *
 * bootstrap 接口返回当前用户文件柜的初始数据（根目录下的直接子项）。
 * 此函数在列表头部插入一个虚拟根节点，使前端树形结构完整。
 *
 * 根节点特征：
 * - id: CABINET_ROOT_ID ('root')
 * - parentId: null（无父节点）
 * - type: 'folder'
 * - name: cabinetName 参数 > scope 映射名 > '文件柜'
 *
 * @param data        - 后端 bootstrap 响应体
 * @param cabinetName - 可选的自定义根节点名称
 * @returns [根节点, ...所有子条目] 的完整列表
 */
export function adaptCabinetBootstrap(data: CabinetBootstrapDTO, cabinetName?: string): CabinetItem[] {
  const rootName = cabinetName || CABINET_ROOT_NAME_MAP[data.scope] || '文件柜';
  const rootItem: CabinetItem = {
    id: CABINET_ROOT_ID,
    name: rootName,
    type: 'folder',
    size: '-',
    sizeBytes: 0,
    createTime: '',
    updateTime: '',
    ext: 'folder',
    orderNo: 0,
    parentId: null,
    scope: data.scope,
    hasChild: data.items.length ? '1' : '0',
  };
  return [rootItem, ...data.items.map(adaptCabinetItem)];
}
