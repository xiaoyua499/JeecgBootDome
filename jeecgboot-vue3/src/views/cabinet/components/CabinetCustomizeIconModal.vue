<template>
  <BasicModal
    @register="registerModal"
    :title="`自定义图标${itemName ? ` - ${itemName}` : ''}`"
    width="720px"
    destroyOnClose
    v-bind="$attrs"
    @ok="handleSubmit"
  >
    <div class="cabinet-icon-modal">
      <div class="cabinet-icon-preview">
        <div class="preview-card">
          <img :src="previewIconSrc" :alt="itemName || '预览图标'" class="preview-image" />
          <div class="preview-name">{{ itemName || '未命名项' }}</div>
          <div class="preview-tip">{{ previewModeText }}</div>
        </div>
      </div>

      <div class="cabinet-icon-section">
        <div class="section-title">系统内置图标</div>
        <div class="icon-grid">
          <button
            v-for="option in builtInOptions"
            :key="option.key"
            type="button"
            class="icon-option"
            :class="{ active: selectedMode === 'builtin' && selectedBuiltinKey === option.key }"
            @click="selectBuiltInIcon(option.key)"
          >
            <img :src="resolveCabinetIconSrc(option.key)" :alt="option.label" class="icon-option-image" />
            <span class="icon-option-label">{{ option.label }}</span>
          </button>
        </div>
      </div>

      <div class="cabinet-icon-section">
        <div class="section-title">自定义上传</div>
        <div class="upload-actions">
          <a-button @click="triggerUpload">上传图片</a-button>
          <span class="upload-tip">支持 PNG / JPG / GIF / WEBP</span>
        </div>
      </div>

      <div class="cabinet-icon-section">
        <div class="section-title">其他操作</div>
        <a-space>
          <a-button @click="resetToDefault">恢复默认图标</a-button>
          <a-button v-if="selectedMode === 'custom'" danger @click="clearCustomUpload">清除本次上传</a-button>
        </a-space>
      </div>

      <input
        ref="uploadInputRef"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        class="hidden"
        @change="handleFileChange"
      />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { message } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import {
    CABINET_BUILTIN_ICON_OPTIONS,
    type CabinetBuiltInIconKey,
    resolveCabinetIconSrc,
    resolveIconType,
  } from '../utils';
  import type { CabinetItem } from '../types';

  interface CustomizeIconModalPayload {
    item: CabinetItem;
  }

  const emit = defineEmits<{
    (e: 'register', modal: unknown, uuid: string): void;
    (
      e: 'success',
      payload: { itemId: string; iconKey?: string; customIconFile?: File; customIconPath?: string },
    ): void;
  }>();

  const uploadInputRef = ref<HTMLInputElement | null>(null);
  const itemId = ref('');
  const itemName = ref('');
  const defaultPreviewSrc = ref('');
  const selectedBuiltinKey = ref<CabinetBuiltInIconKey>('file');
  const uploadedCustomIcon = ref('');
  const uploadedCustomIconFile = ref<File | null>(null);
  const existingCustomIconPath = ref('');
  const selectedMode = ref<'default' | 'builtin' | 'custom'>('default');

  const builtInOptions = CABINET_BUILTIN_ICON_OPTIONS;

  const [registerModal, { closeModal }] = useModalInner(async (data?: CustomizeIconModalPayload) => {
    const item = data?.item;
    if (!item) {
      return;
    }
    itemId.value = item.id;
    itemName.value = item.name;
    defaultPreviewSrc.value = resolveCabinetIconSrc(resolveIconType({ ...item, iconKey: undefined, customIcon: undefined }), 'large');
    selectedBuiltinKey.value = (item.iconKey as CabinetBuiltInIconKey | undefined) || (resolveIconType(item) as CabinetBuiltInIconKey);
    uploadedCustomIcon.value = item.customIcon || '';
    uploadedCustomIconFile.value = null;
    existingCustomIconPath.value = item.customIconPath || '';
    selectedMode.value = item.customIcon || item.customIconPath ? 'custom' : item.iconKey ? 'builtin' : 'default';
  });

  const previewIconSrc = computed(() => {
    if (selectedMode.value === 'custom' && uploadedCustomIcon.value) {
      return uploadedCustomIcon.value;
    }
    if (selectedMode.value === 'builtin') {
      return resolveCabinetIconSrc(selectedBuiltinKey.value, 'large');
    }
    return defaultPreviewSrc.value;
  });

  const previewModeText = computed(() => {
    if (selectedMode.value === 'custom' && uploadedCustomIcon.value) {
      return '当前预览：自定义上传';
    }
    if (selectedMode.value === 'builtin') {
      return '当前预览：系统内置图标';
    }
    return '当前预览：默认图标';
  });

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  function selectBuiltInIcon(iconKey: CabinetBuiltInIconKey) {
    selectedBuiltinKey.value = iconKey;
    selectedMode.value = 'builtin';
  }

  function triggerUpload() {
    if (uploadInputRef.value) {
      uploadInputRef.value.value = '';
      uploadInputRef.value.click();
    }
  }

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      message.warning('请上传图片类型的图标文件');
      input.value = '';
      return;
    }
    try {
      uploadedCustomIcon.value = await readFileAsDataUrl(file);
      uploadedCustomIconFile.value = file;
      existingCustomIconPath.value = '';
      selectedMode.value = 'custom';
    } catch {
      message.error('图标读取失败，请重试');
    } finally {
      input.value = '';
    }
  }

  function resetToDefault() {
    selectedMode.value = 'default';
    uploadedCustomIcon.value = '';
    uploadedCustomIconFile.value = null;
    existingCustomIconPath.value = '';
  }

  function clearCustomUpload() {
    uploadedCustomIcon.value = '';
    uploadedCustomIconFile.value = null;
    existingCustomIconPath.value = '';
    selectedMode.value = 'default';
  }

  function handleSubmit() {
    emit('success', {
      itemId: itemId.value,
      iconKey: selectedMode.value === 'builtin' ? selectedBuiltinKey.value : undefined,
      customIconFile: selectedMode.value === 'custom' ? uploadedCustomIconFile.value || undefined : undefined,
      customIconPath:
        selectedMode.value === 'custom' && !uploadedCustomIconFile.value ? existingCustomIconPath.value || undefined : undefined,
    });
    closeModal();
  }
</script>

<style lang="less" scoped>
  .cabinet-icon-modal {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .cabinet-icon-preview {
    display: flex;
    justify-content: center;
  }

  .preview-card {
    display: flex;
    min-width: 180px;
    align-items: center;
    flex-direction: column;
    gap: 8px;
    padding: 18px 20px;
    background: #f8fbff;
    border: 1px solid #dfe8f4;
    border-radius: 12px;
  }

  .preview-image {
    width: 72px;
    height: 72px;
    object-fit: contain;
  }

  .preview-name {
    color: #1f2d3d;
    font-weight: 500;
  }

  .preview-tip {
    color: #7b8794;
    font-size: 12px;
  }

  .cabinet-icon-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    color: #1f2d3d;
    font-size: 14px;
    font-weight: 600;
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 10px;
    max-height: 280px;
    overflow: auto;
    padding: 4px 2px;
  }

  .icon-option {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 8px;
    padding: 10px 8px;
    background: #fff;
    border: 1px solid #d9e2ec;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #8eb8ff;
      box-shadow: 0 6px 16px rgb(64 104 180 / 12%);
    }

    &.active {
      border-color: #1d7dfa;
      background: #eef5ff;
      box-shadow: 0 6px 16px rgb(29 125 250 / 16%);
    }
  }

  .icon-option-image {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .icon-option-label {
    color: #4a5568;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
  }

  .upload-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .upload-tip {
    color: #7b8794;
    font-size: 12px;
  }
</style>
