/**
 * useCabinetUploadTasks - 文件柜上传任务队列管理
 *
 * 实现一个全局单例的上传任务队列，支持：
 * - 顺序执行：同一时间只运行一个上传任务（避免并发过多占用带宽）
 * - 暂停/恢复：通过 AbortController 中断正在上传的任务
 * - 错误处理：上传失败时记录错误信息，可重试
 * - 批量操作：全部暂停、全部开始、全部移除
 * - 进度追踪：每个任务独立维护 0-100 的进度值
 *
 * 任务状态流转：
 * waiting → uploading → completed
 *                    ↘ paused（手动暂停或 AbortError）
 *                    ↘ error（上传失败）
 * paused/error → waiting（恢复后重新入队）
 *
 * 注意：tasks ref 是模块级单例，所有调用 useCabinetUploadTasks() 的组件共享同一队列
 * 这使得上传进度弹窗可以在任意位置显示全局上传状态
 */
import { ref } from 'vue';

/** 上传任务状态 */
export type UploadTaskStatus = 'waiting' | 'uploading' | 'paused' | 'completed' | 'error';

/** 上传任务的视图数据（暴露给 UI 组件使用） */
export interface UploadTaskView {
  /** 任务唯一 id */
  id: string;
  /** 文件名，显示在进度列表中 */
  fileName: string;
  /** 当前任务状态 */
  status: UploadTaskStatus;
  /** 上传进度 0-100 */
  progress: number;
  /** 错误信息（status === 'error' 时有值） */
  errorMessage?: string;
}

/** 上传任务执行时的上下文，由队列注入给 run 函数 */
export interface UploadTaskContext {
  /** AbortSignal，任务被暂停/取消时触发 abort */
  signal: AbortSignal;
  /** 更新任务进度的回调（0-100） */
  setProgress: (progress: number) => void;
}

/** 上传任务定义，由外部（CabinetExplorer）创建并传入 enqueueTasks */
export interface UploadTaskDefinition {
  /** 文件名，用于显示 */
  fileName: string;
  /**
   * 实际执行上传的异步函数
   * 接收 context 参数，通过 context.signal 响应取消，通过 context.setProgress 上报进度
   * 抛出异常时任务标记为 error 或 paused（AbortError）
   */
  run: (context: UploadTaskContext) => Promise<void>;
}

/** 内部任务结构，在 UploadTaskView 基础上增加 run 函数和 AbortController */
interface InternalTask extends UploadTaskView {
  run: (context: UploadTaskContext) => Promise<void>;
  /** 当前任务的 AbortController，任务完成后清空 */
  controller?: AbortController;
}

/** 全局单例任务列表，所有组件实例共享 */
const tasks = ref<InternalTask[]>([]);
/** 队列是否正在运行（防止重复启动 runQueue） */
let queueRunning = false;

/**
 * 将进度值限制在 0-100 范围内
 * 非有限数值（NaN/Infinity）返回 0
 */
function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }
  return Math.max(0, Math.min(100, progress));
}

/** 中止任务的 AbortController（触发 signal.abort()） */
function abortTask(task: InternalTask) {
  task.controller?.abort();
}

/**
 * 判断错误是否为中止错误（AbortError 或 axios canceled）
 * 用于区分"用户主动暂停"和"真实上传失败"
 */
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

/**
 * 顺序执行上传队列
 * 每次取一个 waiting 状态的任务执行，完成后继续取下一个，直到队列为空
 * 使用 queueRunning 标志防止并发启动多个队列循环
 *
 * 任务执行结果处理：
 * - 成功：progress → 100，status → 'completed'
 * - AbortError（暂停）：status → 'paused'，progress 上限 99
 * - 其他错误：status → 'error'，记录 errorMessage
 *
 * 队列结束后若仍有 waiting 任务（并发 enqueue 场景），自动重启队列
 */
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
  /**
   * 将一批上传任务定义加入队列并启动队列
   * 每个任务初始状态为 waiting，progress 为 0
   * 自动生成唯一 id（ut-{timestamp}-{random}）
   *
   * @param definitions - 上传任务定义数组
   */
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

  /**
   * 暂停所有任务
   * - waiting 状态：直接改为 paused
   * - uploading 状态：触发 AbortController.abort()，任务捕获 AbortError 后自动变为 paused
   */
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

  /**
   * 重新开始所有未完成的任务
   * 将 paused 和 error 状态的任务重置为 waiting（progress 归零），然后启动队列
   * completed 状态的任务不受影响
   */
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

  /**
   * 移除所有任务（含正在上传的任务）
   * 先中止所有正在上传的任务，再清空任务列表
   */
  function removeAll() {
    tasks.value.forEach(abortTask);
    tasks.value = [];
  }

  /**
   * 暂停单个任务
   * - waiting 状态：直接改为 paused
   * - uploading 状态：触发 abort，任务捕获 AbortError 后自动变为 paused
   *
   * @param taskId - 要暂停的任务 id
   */
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

  /**
   * 恢复单个任务（paused 或 error 状态）
   * 将任务重置为 waiting 状态（progress 归零），然后启动队列
   *
   * @param taskId - 要恢复的任务 id
   */
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

  /**
   * 移除单个任务
   * 若任务正在上传则先中止，再从列表中删除
   *
   * @param taskId - 要移除的任务 id
   */
  function removeTask(taskId: string) {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return;
    }
    const task = tasks.value[index];
    abortTask(task);
    tasks.value.splice(index, 1);
  }

  /**
   * 释放所有正在上传的任务（组件卸载时调用）
   * 将 uploading 状态的任务改为 paused 并中止请求
   * 避免组件销毁后仍有后台请求继续运行
   */
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
