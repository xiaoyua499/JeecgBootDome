import { defHttp } from '/@/utils/http/axios';
import type { CabinetScope } from './types';

enum Api {
  bootstrap = '/sys/cabinet/bootstrap',
  folder = '/sys/cabinet/folder',
  file = '/sys/cabinet/file',
  rename = '/sys/cabinet/rename',
  move = '/sys/cabinet/move',
  copy = '/sys/cabinet/copy',
  delete = '/sys/cabinet/delete',
  icon = '/sys/cabinet/icon',
}

export interface CabinetBootstrapItemDTO {
  id: string;
  parentId: string | null;
  scope: CabinetScope;
  itemType: 'folder' | 'file';
  name: string;
  ext?: string;
  filePath?: string;
  sizeBytes?: number;
  sortNo?: number;
  iconKey?: string;
  customIconPath?: string;
  hasChild?: string;
  createTime?: string;
  updateTime?: string;
}

export interface CabinetBootstrapDTO {
  scope: CabinetScope;
  canManage: boolean;
  items: CabinetBootstrapItemDTO[];
}

interface CabinetScopedParentPayload {
  scope: CabinetScope;
  parentId: string | null;
}

interface CabinetCreateFolderPayload extends CabinetScopedParentPayload {
  name: string;
}

interface CabinetCreateFilePayload extends CabinetScopedParentPayload {
  name: string;
  filePath?: string;
  sizeBytes?: number;
  ext?: string;
}

interface CabinetRenamePayload {
  id: string;
  name: string;
}

interface CabinetMovePayload {
  itemIds: string[];
  targetParentId: string | null;
}

interface CabinetCopyPayload {
  itemIds: string[];
  targetParentId: string | null;
}

interface CabinetUpdateIconPayload {
  id: string;
  iconKey?: string;
  customIconPath?: string;
}

const normalizeParentId = (parentId: string | null) => parentId ?? 'root';

export const bootstrapCabinet = (scope: CabinetScope) =>
  defHttp.get<CabinetBootstrapDTO>({ url: Api.bootstrap, params: { scope } });

export const createCabinetFolder = (payload: CabinetCreateFolderPayload) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.folder,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

export const createCabinetFile = (payload: CabinetCreateFilePayload) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.file,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

export const renameCabinetItem = (payload: CabinetRenamePayload) =>
  defHttp.put<CabinetBootstrapItemDTO>({ url: Api.rename, params: payload });

export const moveCabinetItems = (payload: CabinetMovePayload) =>
  defHttp.put<void>({
    url: Api.move,
    params: {
      ...payload,
      targetParentId: normalizeParentId(payload.targetParentId),
    },
  });

export const copyCabinetItems = (payload: CabinetCopyPayload) =>
  defHttp.post<void>({
    url: Api.copy,
    params: {
      ...payload,
      targetParentId: normalizeParentId(payload.targetParentId),
    },
  });

export const deleteCabinetItems = (itemIds: string[]) =>
  defHttp.delete<void>(
    {
      url: Api.delete,
      params: { ids: itemIds.join(',') },
    },
    { joinParamsToUrl: true }
  );

export const updateCabinetIcon = (payload: CabinetUpdateIconPayload) =>
  defHttp.put<CabinetBootstrapItemDTO>({ url: Api.icon, params: payload });
