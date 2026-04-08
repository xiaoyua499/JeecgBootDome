<!--
  自定义图标弹窗

  功能说明：
  - 通过 useModalInner 接收 CustomizeIconModalPayload（含 CabinetItem）打开
  - 支持三种图标模式（selectedMode）：
    - default: 恢复默认图标（按扩展名自动推断）
    - builtin: 从内置图标库选择（CABINET_BUILTIN_ICON_OPTIONS）
    - custom: 上传自定义图片（PNG/JPG/GIF/WEBP）
  - 左侧预览区实时显示当前选中的图标效果
  - 提交时抛出 success 事件，携带：
    - itemId: 条目 id
    - iconKey: 内置图标 key（builtin 模式）
    - customIconFile: 新上传的图片 File 对象（custom 模式且有新上传）
    - customIconPath: 已有自定义图标路径（custom 模式且未重新上传）
  - 父组件根据 success 事件调用 updateCabinetIcon API 保存

  图标优先级（与 resolveCabinetItemIconSrc 一致）：
  customIcon > iconKey > 按扩展名推断
-->
<template>
  <BasicModal @register="registerModal" :title="`自定义图标${itemName ? ` - ${itemName}` : ''}`" width="720px" destroyOnClose
    v-bind="$attrs" @ok="handleSubmit">
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
          <button v-for="option in builtInOptions" :key="option.key" type="button" class="icon-option"
            :class="{ active: selectedMode === 'builtin' && selectedBuiltinKey === option.key }"
            @click="selectBuiltInIcon(option.key)">
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

      <input ref="uploadInputRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden"
        @change="handleFileChange" />
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

/** 弹窗打开时传入的数据结构 */
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

/** 当前条目 id */
const itemId = ref('');
/** 当前条目名称，显示在预览卡片中 */
const itemName = ref('');
/** 默认图标路径（按扩展名推断，不含 iconKey/customIcon 的原始图标） */
const defaultPreviewSrc = ref('');
/** 当前选中的内置图标 key */
const selectedBuiltinKey = ref<CabinetBuiltInIconKey>('file');
/** 本次上传的自定义图标 data URL（用于预览） */
const uploadedCustomIcon = ref('');
/** 本次上传的自定义图标 File 对象（提交时传给父组件） */
const uploadedCustomIconFile = ref<File | null>(null);
/** 已有自定义图标的服务器路径（未重新上传时保留） */
const existingCustomIconPath = ref('');
/** 当前图标选择模式：default / builtin / custom */
const selectedMode = ref<'default' | 'builtin' | 'custom'>('default');
/** 隐藏的文件上传 input 引用 */
const uploadInputRef = ref<HTMLInputElement | null>(null);

const builtInOptions = CABINET_BUILTIN_ICON_OPTIONS;

/**
 * useModalInner 回调：弹窗打开时初始化状态
 * - 从 item 中读取当前图标设置，恢复 selectedMode
 * - defaultPreviewSrc 使用不含 iconKey/customIcon 的原始推断图标（large 尺寸）
 * - 若 item 有 customIcon/customIconPath → custom 模式
 * - 若 item 有 iconKey → builtin 模式
 * - 否则 → default 模式
 */
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

/**
 * 预览图标路径计算
 * - custom 模式且有上传图片 → 显示 data URL
 * - builtin 模式 → 显示内置图标（large 尺寸）
 * - default 模式 → 显示按扩展名推断的默认图标
 */
const previewIconSrc = computed(() => {
  if (selectedMode.value === 'custom' && uploadedCustomIcon.value) {
    return uploadedCustomIcon.value;
  }
  if (selectedMode.value === 'builtin') {
    return resolveCabinetIconSrc(selectedBuiltinKey.value, 'large');
  }
  return defaultPreviewSrc.value;
});

/** 预览区底部说明文字，显示当前图标来源 */
const previewModeText = computed(() => {
  if (selectedMode.value === 'custom' && uploadedCustomIcon.value) {
    return '当前预览：自定义上传';
  }
  if (selectedMode.value === 'builtin') {
    return '当前预览：系统内置图标';
  }
  return '当前预览：默认图标';
});

/**
 * 将 File 对象读取为 base64 data URL
 * 用于上传图标后在预览区实时显示，无需等待服务器返回
 */
const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** 选中内置图标：设置 selectedBuiltinKey 并切换到 builtin 模式 */
function selectBuiltInIcon(iconKey: CabinetBuiltInIconKey) {
  selectedBuiltinKey.value = iconKey;
  selectedMode.value = 'builtin';
}

/** 触发隐藏的图片 input，打开系统文件选择对话框 */
function triggerUpload() {
  if (uploadInputRef.value) {
    uploadInputRef.value.value = '';
    uploadInputRef.value.click();
  }
}

/**
 * 处理图片文件选择
 * - 校验文件类型必须为 image/*
 * - 读取为 data URL 用于预览
 * - 保存 File 对象供提交时上传
 * - 清除已有的服务器路径（existingCustomIconPath）
 * - 切换到 custom 模式
 */
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

/** 恢复默认图标：清除所有自定义设置，切换到 default 模式 */
function resetToDefault() {
  selectedMode.value = 'default';
  uploadedCustomIcon.value = '';
  uploadedCustomIconFile.value = null;
  existingCustomIconPath.value = '';
}

/** 清除本次上传的自定义图标，回退到 default 模式 */
function clearCustomUpload() {
  uploadedCustomIcon.value = '';
  uploadedCustomIconFile.value = null;
  existingCustomIconPath.value = '';
  selectedMode.value = 'default';
}

/**
 * 提交图标设置
 * 根据 selectedMode 决定抛出的 success payload：
 * - default: iconKey/customIconFile/customIconPath 均为 undefined（父组件清除图标设置）
 * - builtin: iconKey = selectedBuiltinKey
 * - custom + 新上传: customIconFile = uploadedCustomIconFile
 * - custom + 已有路径: customIconPath = existingCustomIconPath
 */
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
