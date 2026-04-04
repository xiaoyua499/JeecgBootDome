import { defHttp } from '/@/utils/http/axios';
import type { UploadApiResult } from '/@/api/sys/model/uploadModel';
import type { CabinetScope } from './types';

enum Api {
  commonUpload = '/sys/common/upload',
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

const normalizeParentId = (parentId: string | null) => parentId ?? 'root';

export const bootstrapCabinet = (scope: CabinetScope) =>
  defHttp.get<CabinetBootstrapDTO>({ url: Api.bootstrap, params: { scope } });

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
