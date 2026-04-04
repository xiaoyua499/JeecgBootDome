import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import type { CabinetBootstrapDTO, CabinetBootstrapItemDTO } from './cabinet.api';
import type { CabinetItem } from './types';
import { formatBytesForCabinet } from './utils';

export const CABINET_ROOT_ID = 'root';

const CABINET_ROOT_NAME_MAP = {
  private: '私柜',
  public: '公柜',
} as const;

function resolveItemTime(value?: string, fallback?: string) {
  return value || fallback || '';
}

function resolveCustomIcon(customIconPath?: string) {
  if (!customIconPath) {
    return undefined;
  }
  if (customIconPath.startsWith('data:')) {
    return customIconPath;
  }
  return getFileAccessHttpUrl(customIconPath);
}

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
