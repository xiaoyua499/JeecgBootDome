/**
 * useCabinetUpload - 文件柜上传入口解析
 *
 * 负责将用户的上传操作（拖拽或选择文件）解析为统一的 CabinetUploadEntry 列表，
 * 供上层（CabinetExplorer）转换为上传任务队列。
 *
 * 支持两种上传来源：
 * 1. ingestDataTransfer：处理拖拽上传（DataTransfer），支持整个文件夹拖入
 *    - 优先使用 webkitGetAsEntry API 递归读取目录结构
 *    - 降级到 dataTransfer.files 处理普通文件列表
 * 2. ingestPlainFiles：处理 <input type="file"> 选择的文件
 *    - 支持 webkitRelativePath（选择整个文件夹时保留相对路径）
 *
 * CabinetUploadEntry 结构：
 * - file: 原始 File 对象
 * - fileName: 文件名
 * - parentId: 上传到的目标文件夹 id（当前文件夹）
 * - relativeFolders: 相对路径中的文件夹层级数组
 *   例如拖入 "项目/文档/report.pdf" → relativeFolders: ['项目', '文档']
 *   上层根据此数组在文件柜中自动创建对应的文件夹层级
 */
import { type Ref } from 'vue';

export interface CabinetUploadEntry {
  /** 原始 File 对象，用于上传 */
  file: File;
  /** 文件名（不含路径） */
  fileName: string;
  /** 上传到的目标文件夹 id */
  parentId: string;
  /**
   * 相对路径中的文件夹层级数组（不含文件名）
   * 例如拖入 "项目/文档/report.pdf" → ['项目', '文档']
   * 上层根据此数组在文件柜中自动创建对应的文件夹层级
   */
  relativeFolders: string[];
}

/**
 * 读取目录条目下的所有子条目（处理 readEntries 分批返回的问题）
 * FileSystemDirectoryReader.readEntries 每次最多返回 100 条，需循环调用直到返回空数组
 *
 * @param dir - 目录条目
 * @returns 该目录下所有子条目的数组
 */
async function readAllDirectoryEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = dir.createReader();
  const result: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];
  do {
    batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    result.push(...batch);
  } while (batch.length > 0);
  return result;
}

interface UseCabinetUploadParams {
  /** 当前所在文件夹 id，上传文件默认放入此文件夹 */
  currentFolderId: Ref<string>;
  /** 是否有管理权限，无权限时拒绝所有上传操作 */
  canManage: Ref<boolean>;
}

export function useCabinetUpload(params: UseCabinetUploadParams) {
  /**
   * 解析普通 File 对象为 CabinetUploadEntry
   * 若 File 带有 webkitRelativePath（选择文件夹时），则提取相对路径中的文件夹层级
   * 否则视为单个文件，relativeFolders 为空数组
   *
   * @param file - 原始 File 对象
   * @returns CabinetUploadEntry（parentId 暂时使用当前文件夹，后续由调用方覆盖）
   */
  const resolvePlainFileEntry = (file: File): CabinetUploadEntry => {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (relativePath && relativePath.includes('/')) {
      const segments = relativePath.split('/').filter(Boolean);
      const fileName = segments.pop() || file.name;
      return {
        file,
        fileName,
        parentId: params.currentFolderId.value,
        relativeFolders: segments,
      };
    }
    return {
      file,
      fileName: file.name,
      parentId: params.currentFolderId.value,
      relativeFolders: [],
    };
  };

  /**
   * 递归遍历目录条目，收集所有文件
   * 遇到子目录时递归处理，并将目录名追加到 relativeFolders
   *
   * @param dirEntry       - 当前目录条目
   * @param parentId       - 上传目标文件夹 id
   * @param relativeFolders - 当前已累积的相对路径文件夹数组
   * @param entries        - 收集结果数组（原地追加）
   */
  const walkDirectoryEntry = async (
    dirEntry: FileSystemDirectoryEntry,
    parentId: string,
    relativeFolders: string[],
    entries: CabinetUploadEntry[],
  ) => {
    const childEntries = await readAllDirectoryEntries(dirEntry);
    for (const entry of childEntries) {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        entries.push({
          file,
          fileName: file.name,
          parentId,
          relativeFolders: [...relativeFolders],
        });
      } else if (entry.isDirectory) {
        const subDir = entry as FileSystemDirectoryEntry;
        await walkDirectoryEntry(subDir, parentId, [...relativeFolders, subDir.name], entries);
      }
    }
  };

  /**
   * 处理单个 FileSystemEntry（文件或目录）
   * - 文件：直接转为 CabinetUploadEntry，relativeFolders 为空
   * - 目录：调用 walkDirectoryEntry 递归收集，relativeFolders 以目录名开头
   *
   * @param entry    - FileSystem API 条目
   * @param parentId - 上传目标文件夹 id
   * @param entries  - 收集结果数组（原地追加）
   */
  const processEntry = async (entry: FileSystemEntry, parentId: string, entries: CabinetUploadEntry[]) => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      entries.push({
        file,
        fileName: file.name,
        parentId,
        relativeFolders: [],
      });
      return;
    }
    if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      await walkDirectoryEntry(dirEntry, parentId, [dirEntry.name], entries);
    }
  };

  /**
   * 解析「选择文件」结果，保留目录相对路径，交给业务侧串接上传接口
   * 无管理权限或文件列表为空时返回空数组
   *
   * @param files    - input[type=file] 选择的 File 数组
   * @param parentId - 上传目标文件夹 id
   * @returns CabinetUploadEntry 数组
   */
  const ingestPlainFiles = (files: File[], parentId: string, _options?: { silent?: boolean }) => {
    if (!params.canManage.value || !files.length) {
      return [];
    }
    return files.map((file) => ({ ...resolvePlainFileEntry(file), parentId }));
  };

  /**
   * 解析拖拽上传的 DataTransfer 对象
   * 优先使用 webkitGetAsEntry API 支持整个文件夹拖入（递归读取目录结构）
   * 若浏览器不支持 Entry API，则降级为普通文件列表处理
   * 无管理权限时返回空数组
   *
   * @param dataTransfer - 拖拽事件的 DataTransfer 对象
   * @returns CabinetUploadEntry 数组（含相对路径信息）
   */
  const ingestDataTransfer = async (dataTransfer: DataTransfer) => {
    if (!params.canManage.value) {
      return [];
    }
    const parentId = params.currentFolderId.value;
    const items = dataTransfer.items;
    const useEntryApi = typeof DataTransferItem !== 'undefined' && 'webkitGetAsEntry' in DataTransferItem.prototype;

    const entries: CabinetUploadEntry[] = [];

    if (useEntryApi && items?.length) {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          await processEntry(entry as FileSystemEntry, parentId, entries);
        }
      }
      if (entries.length > 0) {
        return entries;
      }
    }

    const fileList = dataTransfer.files;
    if (fileList?.length) {
      return ingestPlainFiles(Array.from(fileList), parentId);
    }

    return [];
  };

  return {
    ingestDataTransfer,
    ingestPlainFiles,
  };
}
