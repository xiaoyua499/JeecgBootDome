/**
 * 文件柜模块 - API 接口层
 *
 * 封装所有与后端 /sys/cabinet/* 相关的 HTTP 请求。
 * 组件和 composable 层通过调用这里导出的函数与后端通信，不直接使用 defHttp。
 *
 * 接口分类：
 * - 初始化：bootstrapCabinet
 * - 文件夹视图（分页/排序/分组）：fetchCabinetFolderView
 * - 用户偏好设置：fetchCabinetPreference / updateCabinetPreference
 * - 自定义分组状态：fetchCabinetCustomGroupState / updateCabinetCustomGroupState
 * - CRUD：createCabinetFolder / createCabinetFile / renameCabinetItem / updateCabinetFileContent
 * - 批量操作：moveCabinetItems / copyCabinetItems / deleteCabinetItems
 * - 图标：updateCabinetIcon
 * - 排序：updateCabinetItemOrder
 * - 下载/上传/读取：downloadCabinetItems / uploadCabinetBinary / fetchCabinetFileText / fetchCabinetFileBlob
 */

import { defHttp } from '/@/utils/http/axios';
import type { UploadApiResult } from '/@/api/sys/model/uploadModel';
import { getFileblob } from '/@/api/common/api';
import { getHeaders } from '/@/utils/common/compUtils';
import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import type { CabinetScope, GridIconSize, GroupField, SortField, SortOrder, ViewMode } from './types';

/** 后端接口路径枚举，统一管理避免硬编码散落各处 */
enum Api {
  commonUpload = '/sys/common/upload',
  bootstrap = '/sys/cabinet/bootstrap',
  folderView = '/sys/cabinet/folder-view',
  preference = '/sys/cabinet/preference',
  customGroupState = '/sys/cabinet/custom-group-state',
  folder = '/sys/cabinet/folder',
  file = '/sys/cabinet/file',
  rename = '/sys/cabinet/rename',
  content = '/sys/cabinet/content',
  order = '/sys/cabinet/order',
  move = '/sys/cabinet/move',
  copy = '/sys/cabinet/copy',
  delete = '/sys/cabinet/delete',
  icon = '/sys/cabinet/icon',
  download = '/sys/cabinet/download',
}

// ─── 后端 DTO 类型定义 ────────────────────────────────────────────────────────

/**
 * 单个文件柜条目的后端数据结构（bootstrap 和 folder-view 接口共用）
 * 由 adapter.ts 的 adaptCabinetItem() 转换为前端 CabinetItem
 */
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

/**
 * bootstrap 接口响应体
 * 包含文件柜范围、管理权限标志和根目录下的直接子条目列表
 */
export interface CabinetBootstrapDTO {
  scope: CabinetScope;
  canManage: boolean;
  items: CabinetBootstrapItemDTO[];
}

/** folder-view 接口中单个分组的数据结构（groupField !== 'none' 时后端返回） */
export interface CabinetFolderViewGroupDTO {
  key: string;
  title: string;
  items: CabinetBootstrapItemDTO[];
}

/**
 * folder-view 接口响应体（分页 + 排序 + 分组）
 * 当 groupField === 'none' 时 groups 为空数组，items 包含当前页数据
 * 当 groupField !== 'none' 时 groups 包含分组数据，items 可能为空
 */
export interface CabinetFolderViewDTO {
  scope: CabinetScope;
  parentId: string | null;
  keyword?: string;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
  pageNo: number;
  pageSize: number;
  total: number;
  canManage: boolean;
  items: CabinetBootstrapItemDTO[];
  groups: CabinetFolderViewGroupDTO[];
}

/**
 * 用户偏好设置 DTO
 * 持久化存储用户在文件柜中的视图偏好，下次打开时自动恢复
 */
export interface CabinetPreferenceDTO {
  scope: CabinetScope;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
  viewMode: ViewMode;
  gridIconSize: GridIconSize;
}

/** 自定义分组定义（id + 名称 + 排序号） */
export interface CabinetCustomGroupDTO {
  id: string;
  name: string;
  sortNo?: number;
}

/** 自定义分组与条目的绑定关系（一个分组对应多个条目 id） */
export interface CabinetCustomGroupBindingDTO {
  groupId: string;
  itemIds: string[];
}

/**
 * 自定义分组完整状态 DTO
 * 包含当前文件夹下所有自定义分组定义、绑定关系和未分组条目的排序
 */
export interface CabinetCustomGroupStateDTO {
  scope: CabinetScope;
  parentId: string | null;
  groups: CabinetCustomGroupDTO[];
  bindings: CabinetCustomGroupBindingDTO[];
  ungroupedOrderItemIds: string[];
}

// ─── 请求 Payload 类型定义 ────────────────────────────────────────────────────

/** 带 scope 和 parentId 的基础请求载荷（多个接口共用） */
interface CabinetScopedParentPayload {
  scope: CabinetScope;
  parentId: string | null;
}

/** 支持 AbortSignal 的请求选项，用于取消正在进行的请求 */
interface CabinetRequestOptions {
  signal?: AbortSignal;
}

/** 创建文件夹的请求载荷 */
interface CabinetCreateFolderPayload extends CabinetScopedParentPayload {
  name: string;
}

/** 创建文件的请求载荷（上传后调用，传入服务器路径和元数据） */
interface CabinetCreateFilePayload extends CabinetScopedParentPayload {
  name: string;
  filePath?: string;
  sizeBytes?: number;
  ext?: string;
}

/** 重命名条目的请求载荷 */
interface CabinetRenamePayload {
  id: string;
  name: string;
}

/** 更新文件文本内容的请求载荷（在线编辑保存时使用） */
interface CabinetUpdateContentPayload {
  id: string;
  content: string;
}

/** 移动条目的请求载荷（支持批量移动到目标文件夹） */
interface CabinetMovePayload {
  itemIds: string[];
  targetParentId: string | null;
}

/** 复制条目的请求载荷（支持批量复制到目标文件夹） */
interface CabinetCopyPayload {
  itemIds: string[];
  targetParentId: string | null;
}

/** 更新图标的请求载荷（iconKey 和 customIconPath 二选一） */
interface CabinetUpdateIconPayload {
  id: string;
  iconKey?: string;
  customIconPath?: string;
}

/** 文件夹视图分页查询的请求载荷 */
interface CabinetFolderViewPayload extends CabinetScopedParentPayload {
  keyword?: string;
  sortField: SortField;
  sortOrder: SortOrder;
  groupField: GroupField;
  pageNo: number;
  pageSize: number;
}

/** 更新手动排序序号的请求载荷 */
interface CabinetUpdateOrderPayload {
  parentId: string | null;
  itemOrders: Array<{
    id: string;
    sortNo: number;
  }>;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 将前端 parentId null 值规范化为后端期望的字符串 'root'
 * 后端接口不接受 null，根目录统一用 'root' 字符串表示
 */
const normalizeParentId = (parentId: string | null) => parentId ?? 'root';

// ─── API 函数 ─────────────────────────────────────────────────────────────────

/**
 * 初始化文件柜
 * 获取指定 scope 文件柜的根目录数据（直接子条目列表）和管理权限
 * 在 CabinetExplorer 挂载时调用一次
 *
 * @param scope - 文件柜范围（private | public）
 */
export const bootstrapCabinet = (scope: CabinetScope) =>
  defHttp.get<CabinetBootstrapDTO>({ url: Api.bootstrap, params: { scope } });

/**
 * 获取文件夹视图数据（分页 + 排序 + 分组 + 搜索）
 * 每次切换文件夹、翻页、修改排序/分组/搜索关键词时调用
 * 支持传入 AbortSignal 以取消上一次未完成的请求
 *
 * @param payload - 查询参数（scope、parentId、排序、分组、分页、关键词）
 * @param options - 可选的请求控制选项（signal）
 */
export const fetchCabinetFolderView = (payload: CabinetFolderViewPayload, options?: CabinetRequestOptions) =>
  defHttp.get<CabinetFolderViewDTO>({
    url: Api.folderView,
    signal: options?.signal,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

/**
 * 获取用户偏好设置
 * 在文件柜初始化时调用，恢复用户上次的视图模式、排序、分组等设置
 *
 * @param scope - 文件柜范围
 */
export const fetchCabinetPreference = (scope: CabinetScope) =>
  defHttp.get<CabinetPreferenceDTO>({ url: Api.preference, params: { scope } });

/**
 * 保存用户偏好设置
 * 用户修改视图模式、排序字段、分组字段、图标大小时调用
 *
 * @param payload - 完整的偏好设置对象
 */
export const updateCabinetPreference = (payload: CabinetPreferenceDTO) =>
  defHttp.put<CabinetPreferenceDTO>({ url: Api.preference, params: payload });

/**
 * 获取当前文件夹的自定义分组状态
 * 在切换到 groupField === 'custom' 或进入新文件夹时调用
 *
 * @param scope    - 文件柜范围
 * @param parentId - 当前文件夹 id（null 表示根目录）
 */
export const fetchCabinetCustomGroupState = (scope: CabinetScope, parentId: string | null) =>
  defHttp.get<CabinetCustomGroupStateDTO>({
    url: Api.customGroupState,
    params: {
      scope,
      parentId: normalizeParentId(parentId),
    },
  });

/**
 * 保存自定义分组状态
 * 用户创建/删除/重命名分组或调整条目归属时调用
 * 传入完整状态（全量覆盖，非增量更新）
 *
 * @param payload - 完整的自定义分组状态
 */
export const updateCabinetCustomGroupState = (payload: CabinetCustomGroupStateDTO) =>
  defHttp.put<CabinetCustomGroupStateDTO>({
    url: Api.customGroupState,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

/**
 * 创建文件夹
 * 返回新创建的文件夹 DTO，前端用于更新本地 itemList
 *
 * @param payload - 包含 scope、parentId 和文件夹名称
 * @param options - 可选的 AbortSignal
 */
export const createCabinetFolder = (payload: CabinetCreateFolderPayload, options?: CabinetRequestOptions) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.folder,
    signal: options?.signal,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

/**
 * 创建文件记录
 * 通常在 uploadCabinetBinary 上传成功后调用，将服务器文件路径注册到文件柜
 * 也用于新建空白文本文件（filePath 为空）
 *
 * @param payload - 包含 scope、parentId、文件名、服务器路径、大小、扩展名
 * @param options - 可选的 AbortSignal
 */
export const createCabinetFile = (payload: CabinetCreateFilePayload, options?: CabinetRequestOptions) =>
  defHttp.post<CabinetBootstrapItemDTO>({
    url: Api.file,
    signal: options?.signal,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

/**
 * 重命名文件或文件夹
 * 返回更新后的条目 DTO
 *
 * @param payload - 包含条目 id 和新名称
 */
export const renameCabinetItem = (payload: CabinetRenamePayload) =>
  defHttp.put<CabinetBootstrapItemDTO>({ url: Api.rename, params: payload });

/**
 * 更新文件文本内容（在线编辑保存）
 * 仅适用于可编辑文本类型（txt/md/json/js 等），由 CabinetPreviewModal 调用
 *
 * @param payload - 包含文件 id 和新的文本内容
 */
export const updateCabinetFileContent = (payload: CabinetUpdateContentPayload) =>
  defHttp.put<CabinetBootstrapItemDTO>({ url: Api.content, params: payload });

/**
 * 移动条目到目标文件夹（支持批量）
 * 剪切粘贴操作的后端实现
 *
 * @param payload - 包含条目 id 列表和目标文件夹 id
 */
export const moveCabinetItems = (payload: CabinetMovePayload) =>
  defHttp.put<void>({
    url: Api.move,
    params: {
      ...payload,
      targetParentId: normalizeParentId(payload.targetParentId),
    },
  });

/**
 * 复制条目到目标文件夹（支持批量）
 * 复制粘贴操作的后端实现，后端负责深拷贝文件夹树和文件
 *
 * @param payload - 包含条目 id 列表和目标文件夹 id
 */
export const copyCabinetItems = (payload: CabinetCopyPayload) =>
  defHttp.post<void>({
    url: Api.copy,
    params: {
      ...payload,
      targetParentId: normalizeParentId(payload.targetParentId),
    },
  });

/**
 * 删除条目（支持批量）
 * 后端会递归删除文件夹及其所有子条目和文件
 *
 * @param itemIds - 要删除的条目 id 列表
 */
export const deleteCabinetItems = (itemIds: string[]) =>
  defHttp.delete<void>(
    {
      url: Api.delete,
      params: { ids: itemIds.join(',') },
    },
    { joinParamsToUrl: true }
  );

/**
 * 更新条目图标
 * iconKey 和 customIconPath 二选一：
 * - iconKey: 使用内置图标（对应 utils.ts CABINET_ICON_ASSET_MAP 的键）
 * - customIconPath: 使用上传的自定义图标（服务器相对路径）
 *
 * @param payload - 包含条目 id 和图标信息
 */
export const updateCabinetIcon = (payload: CabinetUpdateIconPayload) =>
  defHttp.put<CabinetBootstrapItemDTO>({ url: Api.icon, params: payload });

/**
 * 更新手动排序序号
 * 拖拽排序完成后调用，将新的 sortNo 批量提交到后端
 *
 * @param payload - 包含父文件夹 id 和条目排序数组
 */
export const updateCabinetItemOrder = (payload: CabinetUpdateOrderPayload) =>
  defHttp.put<void>({
    url: Api.order,
    params: {
      ...payload,
      parentId: normalizeParentId(payload.parentId),
    },
  });

/**
 * 下载文件柜条目（支持批量，多个文件自动打包为 ZIP）
 * 通过创建隐藏 <a> 标签触发浏览器下载，下载完成后自动清理 DOM 和 ObjectURL
 *
 * @param itemIds  - 要下载的条目 id 列表
 * @param fileName - 下载文件名（单文件用原名，多文件用 zip 名）
 */
export const downloadCabinetItems = async (itemIds: string[], fileName: string) => {
  const blob = await getFileblob(Api.download, { ids: itemIds.join(',') });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = objectUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

/**
 * 上传文件二进制内容到服务器
 * 使用 multipart/form-data 格式，支持上传进度回调和取消
 *
 * biz 参数区分上传用途：
 * - 'cabinet/file': 普通文件上传，存储到文件柜文件目录
 * - 'cabinet/icon': 自定义图标上传，存储到图标目录
 *
 * 上传成功后需调用 createCabinetFile 将文件注册到文件柜
 *
 * @param file     - 要上传的 File 对象
 * @param biz      - 上传业务类型
 * @param options  - 可选的 signal（取消）和 onProgress（进度回调，0-100）
 */
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

/**
 * 读取文件柜文件的文本内容
 * 用于在线预览/编辑文本类文件（txt/md/json/代码文件等）
 * 携带认证请求头，支持需要鉴权的文件访问
 *
 * @param filePath - 文件在服务器上的相对路径（来自 CabinetItem.filePath）
 * @returns 文件的文本内容字符串
 * @throws 文件读取失败时抛出包含 HTTP 状态码的错误
 */
export const fetchCabinetFileText = async (filePath: string) => {
  const response = await fetch(getFileAccessHttpUrl(filePath), {
    method: 'GET',
    headers: {
      ...getHeaders(),
    } as HeadersInit,
  });
  if (!response.ok) {
    throw new Error(`文件读取失败(${response.status})`);
  }
  return response.text();
};

/**
 * 读取文件柜文件的二进制内容（Blob）
 * 用于预览图片、PDF、音视频等二进制文件
 * 携带认证请求头，支持需要鉴权的文件访问
 *
 * @param filePath - 文件在服务器上的相对路径（来自 CabinetItem.filePath）
 * @returns 文件的 Blob 对象
 * @throws 文件读取失败时抛出包含 HTTP 状态码的错误
 */
export const fetchCabinetFileBlob = async (filePath: string) => {
  const response = await fetch(getFileAccessHttpUrl(filePath), {
    method: 'GET',
    headers: {
      ...getHeaders(),
    } as HeadersInit,
  });
  if (!response.ok) {
    throw new Error(`文件读取失败(${response.status})`);
  }
  return response.blob();
};
