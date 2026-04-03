import { type Ref } from 'vue';
import { useMessage } from '/@/hooks/web/useMessage';
import type { CabinetItem } from '../types';
import { buildSiblingName, formatBytesForCabinet, formatNow, generateItemId, reassignSiblingOrder } from '../utils';

function extFromFileName(name: string) {
  const index = name.lastIndexOf('.');
  return index === -1 ? 'file' : name.slice(index + 1).toLowerCase();
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
  itemList: Ref<CabinetItem[]>;
  currentFolderId: Ref<string>;
  canManage: Ref<boolean>;
}

export function useCabinetUpload(params: UseCabinetUploadParams) {
  const { createMessage } = useMessage();

  const siblingNames = (parentId: string | null) =>
    params.itemList.value.filter((item) => item.parentId === parentId).map((item) => item.name);

  const getOrCreateFolder = (parentId: string, folderName: string, touched: Set<string>) => {
    const trimmed = folderName.trim() || '未命名文件夹';
    const exact = params.itemList.value.find(
      (item) => item.parentId === parentId && item.type === 'folder' && item.name === trimmed,
    );
    if (exact) {
      return exact.id;
    }
    const names = siblingNames(parentId);
    const uniqueName = buildSiblingName(trimmed, names);
    const id = generateItemId('folder');
    const now = formatNow();
    params.itemList.value.push({
      id,
      name: uniqueName,
      type: 'folder',
      size: '-',
      createTime: now,
      updateTime: now,
      ext: 'folder',
      orderNo: Date.now(),
      parentId,
    });
    touched.add(parentId);
    return id;
  };

  const addFile = (file: File, parentId: string, touched: Set<string>) => {
    const names = params.itemList.value.filter((item) => item.parentId === parentId && item.type === 'file').map((item) => item.name);
    const uniqueName = buildSiblingName(file.name, names);
    const id = generateItemId('file');
    const now = formatNow();
    params.itemList.value.push({
      id,
      name: uniqueName,
      type: 'file',
      size: formatBytesForCabinet(file.size),
      createTime: now,
      updateTime: now,
      ext: extFromFileName(uniqueName),
      orderNo: Date.now(),
      parentId,
    });
    touched.add(parentId);
  };

  const walkDirectoryEntry = async (dirEntry: FileSystemDirectoryEntry, parentFolderId: string, touched: Set<string>) => {
    const entries = await readAllDirectoryEntries(dirEntry);
    for (const entry of entries) {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        addFile(file, parentFolderId, touched);
      } else if (entry.isDirectory) {
        const subDir = entry as FileSystemDirectoryEntry;
        const childId = getOrCreateFolder(parentFolderId, subDir.name, touched);
        await walkDirectoryEntry(subDir, childId, touched);
      }
    }
  };

  const processEntry = async (entry: FileSystemEntry, parentId: string, touched: Set<string>) => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      addFile(file, parentId, touched);
      return;
    }
    if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const folderId = getOrCreateFolder(parentId, dirEntry.name, touched);
      await walkDirectoryEntry(dirEntry, folderId, touched);
    }
  };

  const reassignTouched = (touched: Set<string>) => {
    touched.forEach((parentId) => {
      reassignSiblingOrder(params.itemList.value, parentId);
    });
  };

  /** 从「选择文件」得到的列表（可含 webkitRelativePath）；与表单中 JUpload / a-upload 选文件流程对齐，由业务侧写入本地列表或后续接上传接口 */
  const ingestPlainFiles = (files: File[], parentId: string) => {
    if (!params.canManage.value || !files.length) {
      return;
    }
    const touched = new Set<string>();
    let count = 0;
    for (const file of files) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      if (rel && rel.includes('/')) {
        const segments = rel.split('/').filter(Boolean);
        const fileName = segments.pop();
        if (!fileName) {
          continue;
        }
        let cursorParent = parentId;
        for (const segment of segments) {
          cursorParent = getOrCreateFolder(cursorParent, segment, touched);
        }
        addFile(file, cursorParent, touched);
      } else {
        addFile(file, parentId, touched);
      }
      count += 1;
    }
    if (count > 0) {
      reassignTouched(touched);
      createMessage.success(`已添加 ${count} 个文件`);
    }
  };

  const ingestDataTransfer = async (dataTransfer: DataTransfer) => {
    if (!params.canManage.value) {
      return;
    }
    const parentId = params.currentFolderId.value;
    const items = dataTransfer.items;
    const useEntryApi = typeof DataTransferItem !== 'undefined' && 'webkitGetAsEntry' in DataTransferItem.prototype;

    const touched = new Set<string>();

    if (useEntryApi && items?.length) {
      let topCount = 0;
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          await processEntry(entry as FileSystemEntry, parentId, touched);
          topCount += 1;
        }
      }
      if (topCount > 0) {
        reassignTouched(touched);
        createMessage.success(topCount > 1 ? `已处理 ${topCount} 项` : '上传完成');
      }
      return;
    }

    const fileList = dataTransfer.files;
    if (fileList?.length) {
      ingestPlainFiles(Array.from(fileList), parentId);
    }
  };

  return {
    ingestDataTransfer,
    ingestPlainFiles,
  };
}
