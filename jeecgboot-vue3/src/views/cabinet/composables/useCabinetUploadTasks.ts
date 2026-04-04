import { ref } from 'vue';

export type UploadTaskStatus = 'waiting' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadTaskView {
  id: string;
  fileName: string;
  status: UploadTaskStatus;
  progress: number;
  errorMessage?: string;
}

export interface UploadTaskContext {
  signal: AbortSignal;
  setProgress: (progress: number) => void;
}

export interface UploadTaskDefinition {
  fileName: string;
  run: (context: UploadTaskContext) => Promise<void>;
}

interface InternalTask extends UploadTaskView {
  run: (context: UploadTaskContext) => Promise<void>;
  controller?: AbortController;
}

const tasks = ref<InternalTask[]>([]);
let queueRunning = false;

function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }
  return Math.max(0, Math.min(100, progress));
}

function abortTask(task: InternalTask) {
  task.controller?.abort();
}

function isAbortError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  if (typeof error !== 'object' || error == null) {
    return false;
  }
  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === 'ERR_CANCELED' || maybeError.message === 'canceled';
}

async function runQueue() {
  if (queueRunning) {
    return;
  }
  queueRunning = true;
  try {
    while (true) {
      const task = tasks.value.find((item) => item.status === 'waiting');
      if (!task) {
        break;
      }
      const controller = new AbortController();
      task.controller = controller;
      task.status = 'uploading';
      task.errorMessage = '';
      try {
        await task.run({
          signal: controller.signal,
          setProgress: (progress) => {
            task.progress = clampProgress(progress);
          },
        });
        if (task.status === 'uploading') {
          task.progress = 100;
          task.status = 'completed';
        }
      } catch (error) {
        if (task.status === 'paused' || controller.signal.aborted || isAbortError(error)) {
          task.status = 'paused';
          task.progress = Math.min(task.progress, 99);
        } else {
          task.status = 'error';
          task.errorMessage = error instanceof Error ? error.message : '上传失败';
        }
      } finally {
        task.controller = undefined;
      }
    }
  } finally {
    queueRunning = false;
    if (tasks.value.some((item) => item.status === 'waiting')) {
      void runQueue();
    }
  }
}

export function useCabinetUploadTasks() {
  function enqueueTasks(definitions: UploadTaskDefinition[]) {
    for (const definition of definitions) {
      const task: InternalTask = {
        id: `ut-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fileName: definition.fileName,
        run: definition.run,
        status: 'waiting',
        progress: 0,
      };
      tasks.value.push(task);
    }
    void runQueue();
  }

  function pauseAll() {
    tasks.value.forEach((task) => {
      if (task.status === 'waiting') {
        task.status = 'paused';
        return;
      }
      if (task.status === 'uploading' && task.controller) {
        task.status = 'paused';
        abortTask(task);
      }
    });
  }

  function startAll() {
    tasks.value.forEach((task) => {
      if (task.status === 'completed') {
        return;
      }
      if (task.status === 'paused' || task.status === 'error') {
        task.status = 'waiting';
        task.progress = 0;
        task.errorMessage = '';
      }
    });
    void runQueue();
  }

  function removeAll() {
    tasks.value.forEach(abortTask);
    tasks.value = [];
  }

  function pauseTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) {
      return;
    }
    if (task.status === 'waiting') {
      task.status = 'paused';
      return;
    }
    if (task.status !== 'uploading' || !task.controller) {
      return;
    }
    task.status = 'paused';
    abortTask(task);
  }

  function resumeTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task || (task.status !== 'paused' && task.status !== 'error')) {
      return;
    }
    if (task.status === 'completed') {
      return;
    }
    task.status = 'waiting';
    task.progress = 0;
    task.errorMessage = '';
    void runQueue();
  }

  function removeTask(taskId: string) {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return;
    }
    const task = tasks.value[index];
    abortTask(task);
    tasks.value.splice(index, 1);
  }

  function disposeAllTimers() {
    tasks.value.forEach((task) => {
      if (task.status === 'uploading' && task.controller) {
        task.status = 'paused';
        abortTask(task);
      }
    });
  }

  return {
    tasks,
    enqueueTasks,
    pauseAll,
    startAll,
    removeAll,
    pauseTask,
    resumeTask,
    removeTask,
    disposeAllTimers,
  };
}
