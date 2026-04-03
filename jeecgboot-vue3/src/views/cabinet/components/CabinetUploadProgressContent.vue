<!-- 上传进度弹窗主体：展示上传任务列表、批量操作与筛选。 -->
<template>
  <div class="cabinet-upload-progress-content">
    <div class="progress-layout">
      <aside class="progress-sider">
        <div class="sider-item active">
          <Icon icon="ant-design:upload-outlined" :size="16" />
          <span>上传</span>
        </div>
      </aside>

      <div class="progress-main">
        <div class="progress-toolbar">
          <a-space>
            <a-button size="small" :disabled="bulkDisabled" @click="pauseAll">
              <template #icon>
                <Icon icon="ant-design:pause-circle-outlined" :size="14" />
              </template>
              全部暂停
            </a-button>
            <a-button size="small" :disabled="bulkDisabled" @click="startAll">
              <template #icon>
                <Icon icon="ant-design:caret-right-outlined" :size="14" />
              </template>
              全部开始
            </a-button>
            <a-button size="small" danger :disabled="bulkDisabled" @click="handleRemoveAll">
              <template #icon>
                <Icon icon="ant-design:delete-outlined" :size="14" />
              </template>
              全部删除
            </a-button>
          </a-space>
        </div>

        <div class="progress-filter">
          <a-checkbox :checked="selectAll" :indeterminate="selectIndeterminate" @update:checked="onSelectAll">
            共 {{ filteredTasks.length }} 项
          </a-checkbox>
          <div class="filter-right">
            <a-checkbox v-model:checked="filterInProgress">进行中</a-checkbox>
            <a-checkbox v-model:checked="filterCompleted">已完成</a-checkbox>
          </div>
        </div>

        <div class="progress-list-wrap">
          <a-empty v-if="!filteredTasks.length" class="progress-empty" description="暂无上传进度">
            <template #image>
              <div class="progress-empty-icon">
                <Icon icon="ant-design:file-text-outlined" :size="56" />
              </div>
            </template>
          </a-empty>
          <div v-else class="progress-list">
            <div v-for="task in filteredTasks" :key="task.id" class="progress-row">
              <a-checkbox
                :checked="selectedIds.has(task.id)"
                @update:checked="(c: boolean) => toggleSelect(task.id, c)"
              />
              <div class="progress-row-body">
                <div class="progress-row-name" :title="task.fileName">{{ task.fileName }}</div>
                <a-progress
                  :percent="Math.round(task.progress)"
                  :status="task.status === 'completed' ? 'success' : task.status === 'paused' ? 'normal' : 'active'"
                  :stroke-color="task.status === 'paused' ? '#b8c0cc' : undefined"
                />
              </div>
              <div class="progress-row-actions">
                <a-button
                  v-if="task.status === 'uploading'"
                  type="link"
                  size="small"
                  @click="pauseTask(task.id)"
                >
                  <Icon icon="ant-design:pause-circle-outlined" />
                </a-button>
                <a-button
                  v-if="task.status === 'paused'"
                  type="link"
                  size="small"
                  @click="resumeTask(task.id)"
                >
                  <Icon icon="ant-design:caret-right-outlined" />
                </a-button>
                <a-button type="link" size="small" danger @click="removeTask(task.id)">
                  <Icon icon="ant-design:delete-outlined" />
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { Icon } from '/@/components/Icon';
import { useCabinetUploadTasks } from '../composables/useCabinetUploadTasks';

const { tasks, pauseAll, startAll, removeAll, pauseTask, resumeTask, removeTask } = useCabinetUploadTasks();

const filterInProgress = ref(true);
const filterCompleted = ref(false);

const selectedIds = ref<Set<string>>(new Set());

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const inProg = t.status === 'waiting' || t.status === 'uploading' || t.status === 'paused';
    const done = t.status === 'completed';
    const noFilter = !filterInProgress.value && !filterCompleted.value;
    if (noFilter) {
      return true;
    }
    if (filterInProgress.value && filterCompleted.value) {
      return inProg || done;
    }
    if (filterInProgress.value) {
      return inProg;
    }
    if (filterCompleted.value) {
      return done;
    }
    return true;
  });
});

const bulkDisabled = computed(() => tasks.value.length === 0);

const selectAll = ref(false);
const selectIndeterminate = ref(false);

watch(
  [filteredTasks, selectedIds],
  () => {
    const ids = filteredTasks.value.map((t) => t.id);
    const selected = ids.filter((id) => selectedIds.value.has(id));
    if (!ids.length) {
      selectAll.value = false;
      selectIndeterminate.value = false;
      return;
    }
    selectAll.value = selected.length === ids.length;
    selectIndeterminate.value = selected.length > 0 && selected.length < ids.length;
  },
  { deep: true },
);

function onSelectAll(checked: boolean) {
  if (checked) {
    filteredTasks.value.forEach((t) => selectedIds.value.add(t.id));
  } else {
    filteredTasks.value.forEach((t) => selectedIds.value.delete(t.id));
  }
  selectedIds.value = new Set(selectedIds.value);
}

function toggleSelect(id: string, checked: boolean) {
  const next = new Set(selectedIds.value);
  if (checked) {
    next.add(id);
  } else {
    next.delete(id);
  }
  selectedIds.value = next;
}

function handleRemoveAll() {
  removeAll();
  selectedIds.value = new Set();
}
</script>

<style lang="less" scoped>
.cabinet-upload-progress-content {
  min-height: 360px;
}

.progress-layout {
  display: flex;
  min-height: 360px;
  border: 1px solid #e8edf4;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.progress-sider {
  width: 148px;
  flex-shrink: 0;
  padding: 8px 0;
  background: #f7f9fc;
  border-right: 1px solid #e8edf4;
}

.sider-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin: 2px 8px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgb(0 0 0 / 4%);
  }

  &.active {
    position: relative;
    color: #1d7dfa;
    font-weight: 500;
    background: #e8f2ff;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background: #1d7dfa;
    }
  }
}

.progress-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
}

.progress-toolbar {
  margin-bottom: 12px;

  :deep(.ant-btn[disabled]) {
    opacity: 0.45;
  }
}

.progress-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f3f8;
  font-size: 13px;
  color: #5c6b7a;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-list-wrap {
  flex: 1;
  min-height: 220px;
  overflow: auto;
}

.progress-empty {
  margin: 48px auto;
}

.progress-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin: 0 auto 8px;
  color: #8eb8ff;
  background: linear-gradient(145deg, #f0f6ff 0%, #e8f2ff 100%);
  border-radius: 12px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: #fafbfd;
  border: 1px solid #eef1f6;
  border-radius: 8px;
}

.progress-row-body {
  flex: 1;
  min-width: 0;
}

.progress-row-name {
  margin-bottom: 4px;
  overflow: hidden;
  font-size: 13px;
  color: #1f2d3d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-row-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0;
  padding-top: 2px;
}
</style>
