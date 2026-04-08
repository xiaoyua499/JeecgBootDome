<!-- 上传进度弹窗
  标题栏包含"进度"文字和"不再主动弹出"复选框，主体内容见 CabinetUploadProgressContent。

  功能说明：
  - open prop 控制弹窗显示/隐藏（v-model:open）
  - "不再主动弹出"复选框状态持久化到 localStorage（key: cabinet-upload-no-auto-popup）
    - 勾选后 CabinetExplorer 不会在新上传任务开始时自动弹出此弹窗
    - 用户仍可通过工具栏按钮手动打开
  - destroy-on-close 确保每次打开时重新渲染内容
  - footer=null 隐藏默认的确认/取消按钮
-->
<template>
  <a-modal
    :open="open"
    :footer="null"
    width="720px"
    destroy-on-close
    wrap-class-name="cabinet-upload-progress-modal-wrap"
    @update:open="emit('update:open', $event)"
  >
    <template #title>
      <div class="cabinet-progress-modal-title">
        <span class="title-label">进度</span>
        <a-checkbox v-model:checked="dontShowAgainProxy">不再主动弹出</a-checkbox>
      </div>
    </template>
    <CabinetUploadProgressContent />
  </a-modal>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import CabinetUploadProgressContent from './CabinetUploadProgressContent.vue';

const STORAGE_KEY = 'cabinet-upload-no-auto-popup';

defineProps<{
  /** 弹窗是否显示（v-model:open） */
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

/**
 * "不再主动弹出"复选框的双向绑定代理
 * - get: 读取 localStorage，值为 '1' 时返回 true
 * - set: true 时写入 '1'，false 时删除该 key
 * CabinetExplorer 在新任务入队时检查此 key，决定是否自动弹出进度弹窗
 */
const dontShowAgainProxy = computed({
  get: () => localStorage.getItem(STORAGE_KEY) === '1',
  set: (value: boolean) => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
});
</script>

<style lang="less">
.cabinet-upload-progress-modal-wrap {
  .ant-modal-header {
    padding: 14px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .cabinet-progress-modal-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 36px;
    margin: 0;
    font-weight: 600;
  }

  .title-label {
    font-size: 16px;
    color: #1f2d3d;
  }
}
</style>
