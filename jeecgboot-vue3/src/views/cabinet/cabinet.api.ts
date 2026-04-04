import { defHttp } from '/@/utils/http/axios';
import type { UploadApiResult } from '/@/api/sys/model/uploadModel';
import type { CabinetScope, GridIconSize, GroupField, SortField, SortOrder, ViewMode } from './types';

enum Api {
  commonUpload = '/sys/common/upload',
  bootstrap = '/sys/cabinet/bootstrap',
  folderView = '/sys/cabinet/folder-view',
  preference = '/sys/cabinet/preference',
  folder = '/sys/cabinet/folder',
  file = '/sys/cabinet/file',
  rename = '/sys/cabinet/rename',
  order = '/sys/cabinet/order',
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

export interface CabinetFolderViewGroupDTO {
  key: string;
  title: string;
  items: CabinetBootstrapItemDTO[];
}

export interface CabinetFolderViewDTO {
  scope: CabinetScope;
  parentId: string | null;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
  canManage: boolean;
  items: CabinetBootstrapItemDTO[];
  groups: CabinetFolderViewGroupDTO[];
}

export interface CabinetPreferenceDTO {
  scope: CabinetScope;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
  viewMode: ViewMode;
  gridIconSize: GridIconSize;
}

interface CabinetScopedParentPayload {
  scope: CabinetScope;
  parentId: string | null;
}

interface CabinetRequestOptions {
  signal?: AbortSignal;
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

interface CabinetFolderViewPayload extends CabinetScopedParentPayload {
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
}

interface CabinetUpdateOrderPayload {
  parentId: string | null;
  itemOrders: Array<{
    id: string;
    sortNo: number;
  }>;
}

const normalizeParentId = (parentId: string | null) => parentId ?? 'root';

export const bootstrapCabinet = (scope: CabinetScope) =>
  defHttp.get<CabinetBootstrapDTO>({ url: Api.bootstrap, params: { scope } });

export const fetchCabinetFolderView = (payload: CabinetFolderViewPayload) =>
  defHttp.get<CabinetFolderViewDTO>({
    url: Api.folderView,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

export const fetchCabinetPreference = (scope: CabinetScope) =>
  defHttp.get<CabinetPreferenceDTO>({ url: Api.preference, params: { scope } });

export const updateCabinetPreference = (payload: CabinetPreferenceDTO) =>
  defHttp.put<CabinetPreferenceDTO>({ url: Api.preference, params: payload });

export const createCabinetFolder = (payload: CabinetCreateFolderPayload, options?: CabinetRequestOptions) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.folder,
    signal: options?.signal,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

export const createCabinetFile = (payload: CabinetCreateFilePayload, options?: CabinetRequestOptions) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.file,
    signal: options?.signal,
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

export const updateCabinetItemOrder = (payload: CabinetUpdateOrderPayload) =>
  defHttp.put<void>({
    url: Api.order,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

export const uploadCabinetBinary = (
  file: File,
  biz: 'cabinet/file' | 'cabinet/icon',
  options?: {
    signal?: AbortSignal;
    onProgress?: (progress: number) => void;
  },
) =>
  defHttp.uploadFile<UploadApiResult>(
    {
      url: Api.commonUpload,
      signal: options?.signal,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const loaded = Number(progressEvent.loaded || 0);
        const total = Number(progressEvent.total || 0);
        options?.onProgress?.(total > 0 ? (loaded / total) * 100 : 0);
      },
    },
    {
      file,
      filename: file.name,
      data: { biz },
    },
    { isReturnResponse: true },
  );
