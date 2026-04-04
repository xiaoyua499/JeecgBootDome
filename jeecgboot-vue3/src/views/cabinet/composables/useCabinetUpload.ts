import { type Ref } from 'vue';

export interface CabinetUploadEntry {
  file: File;
  fileName: string;
  parentId: string;
  relativeFolders: string[];
}

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
  currentFolderId: Ref<string>;
  canManage: Ref<boolean>;
}

export function useCabinetUpload(params: UseCabinetUploadParams) {
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

  /** 解析「选择文件」结果，保留目录相对路径，交给业务侧串接上传接口。 */
  const ingestPlainFiles = (files: File[], parentId: string, _options?: { silent?: boolean }) => {
    if (!params.canManage.value || !files.length) {
      return [];
    }
    return files.map((file) => ({ ...resolvePlainFileEntry(file), parentId }));
  };

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
