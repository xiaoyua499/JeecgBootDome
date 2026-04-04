export type ItemType = 'folder' | 'file';
export type CabinetScope = 'private' | 'public';
export type ViewMode = 'grid' | 'table';
export type GridIconSize = 'large' | 'small';
export type SortField = 'manual' | 'name' | 'updateTime' | 'ext' | 'size';
export type SortOrder = 'asc' | 'desc';
export type GroupField = 'none' | 'name' | 'updateTime' | 'type' | 'size';
export type ClipboardMode = 'copy' | 'cut';

export interface CabinetExplorerProps {
  cabinetName?: string;
  canManage?: boolean;
  scope?: CabinetScope;
}

export interface CabinetItem {
  id: string;
  name: string;
  type: ItemType;
  iconKey?: string;
  customIcon?: string;
  size: string;
  createTime: string;
  updateTime: string;
  ext: string;
  orderNo: number;
  parentId: string | null;
  scope?: CabinetScope;
  filePath?: string;
  sizeBytes?: number;
  customIconPath?: string;
  hasChild?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface GroupSection {
  key: string;
  title: string;
  items: CabinetItem[];
}

export interface ClipboardState {
  mode: ClipboardMode;
  itemIds: string[];
}
