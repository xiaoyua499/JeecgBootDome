<!-- 上传进度弹窗：标题栏「进度 + 不再主动弹出」，主体见 CabinetUploadProgressContent -->
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
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

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
