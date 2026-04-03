import { ref } from 'vue';

export type UploadTaskStatus = 'waiting' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadTaskView {
  id: string;
  fileName: string;
  status: UploadTaskStatus;
  progress: number;
}

interface InternalTask extends UploadTaskView {
  file: File;
  parentId: string;
  commit: (file: File, parentId: string) => void;
  timerId?: ReturnType<typeof setInterval>;
}

const tasks = ref<InternalTask[]>([]);

function clearTimer(task: InternalTask) {
  if (task.timerId) {
    clearInterval(task.timerId);
    task.timerId = undefined;
  }
}

function startTaskProgress(task: InternalTask) {
  clearTimer(task);
  if (task.progress >= 100 || task.status === 'completed') {
    return;
  }
  if (task.status !== 'uploading') {
    return;
  }
  task.timerId = setInterval(() => {
    if (task.status !== 'uploading') {
      clearTimer(task);
      return;
    }
    task.progress = Math.min(100, task.progress + Math.random() * 14 + 4);
    if (task.progress >= 100) {
      task.progress = 100;
      clearTimer(task);
      task.status = 'completed';
      task.commit(task.file, task.parentId);
    }
  }, 260);
}

export function useCabinetUploadTasks() {
  function enqueueFiles(files: File[], parentId: string, commit: (file: File, parentId: string) => void) {
    for (const file of files) {
      const task: InternalTask = {
        id: `ut-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fileName: file.name,
        file,
        parentId,
        commit,
        status: 'uploading',
        progress: 0,
      };
      tasks.value.push(task);
      startTaskProgress(task);
    }
  }

  function pauseAll() {
    tasks.value.forEach((t) => {
      if (t.status === 'uploading') {
        clearTimer(t);
        t.status = 'paused';
      }
    });
  }

  function startAll() {
    tasks.value.forEach((t) => {
      if (t.status === 'completed' || t.progress >= 100) {
        return;
      }
      if (t.status === 'paused' || t.status === 'waiting') {
        t.status = 'uploading';
        startTaskProgress(t);
      }
    });
  }

  function removeAll() {
    tasks.value.forEach(clearTimer);
    tasks.value = [];
  }

  function pauseTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task || task.status !== 'uploading') {
      return;
    }
    clearTimer(task);
    task.status = 'paused';
  }

  function resumeTask(taskId: string) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task || task.status !== 'paused') {
      return;
    }
    if (task.progress >= 100) {
      return;
    }
    task.status = 'uploading';
    startTaskProgress(task);
  }

  function removeTask(taskId: string) {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return;
    }
    const task = tasks.value[index];
    clearTimer(task);
    tasks.value.splice(index, 1);
  }

  function disposeAllTimers() {
    tasks.value.forEach(clearTimer);
  }

  return {
    tasks,
    enqueueFiles,
    pauseAll,
    startAll,
    removeAll,
    pauseTask,
    resumeTask,
    removeTask,
    disposeAllTimers,
  };
}
