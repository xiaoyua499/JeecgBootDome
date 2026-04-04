<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :footer="null"
    :width="modalWidth"
    destroyOnClose
    @update:open="emit('update:open', $event)"
  >
    <div class="cabinet-preview-modal">
      <div class="cabinet-preview-toolbar" v-if="item?.filePath">
        <a-button type="link" @click="openInNewWindow">在新窗口打开</a-button>
      </div>

      <a-spin :spinning="loading" tip="正在加载预览...">
        <template v-if="item">
          <div v-if="previewKind === 'image'" class="preview-image-shell">
            <a-image class="preview-image" :src="fileUrl" :alt="item.name" />
          </div>

          <iframe
            v-else-if="previewKind === 'pdf'"
            class="preview-frame"
            :src="fileUrl"
            frameborder="0"
            title="PDF 预览"
          />

          <JMarkdownEditor
            v-else-if="previewKind === 'markdown'"
            :value="textContent"
            :disabled="true"
            :preview="{ mode: 'view', action: [] }"
            :height="560"
          />

          <JCodeEditor
            v-else-if="previewKind === 'code'"
            :value="displayCodeContent"
            :disabled="true"
            :language="codeLanguage"
            height="560px"
          />

          <JEditor
            v-else-if="previewKind === 'html'"
            :value="textContent"
            :disabled="true"
            :autoFocus="false"
            :toolbar="false"
            :menubar="false"
            :height="560"
          />

          <a-result
            v-else-if="errorText"
            status="warning"
            title="预览加载失败"
            :sub-title="errorText"
          >
            <template #extra>
              <a-button v-if="item.filePath" type="primary" @click="openInNewWindow">在新窗口打开</a-button>
            </template>
          </a-result>

          <a-result
            v-else
            status="info"
            title="暂不支持此文件的内嵌预览"
            sub-title="可以先在新窗口中打开该文件。"
          >
            <template #extra>
              <a-button v-if="item.filePath" type="primary" @click="openInNewWindow">在新窗口打开</a-button>
            </template>
          </a-result>
        </template>
      </a-spin>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { JCodeEditor, JEditor } from '/@/components/Form';
import JMarkdownEditor from '/@/components/Form/src/jeecg/components/JMarkdownEditor.vue';
import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import { fetchCabinetFileText } from '../cabinet.api';
import type { CabinetItem } from '../types';

type PreviewKind = 'image' | 'pdf' | 'markdown' | 'code' | 'html' | 'unsupported';

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MARKDOWN_EXTS = new Set(['md', 'markdown']);
const HTML_EXTS = new Set(['html', 'htm']);
const CODE_EXTS = new Set(['txt', 'json', 'js', 'ts', 'java', 'sql', 'css', 'xml', 'vue', 'sh']);

const props = defineProps<{
  open: boolean;
  item: CabinetItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const textContent = ref('');
const errorText = ref('');
let requestToken = 0;

const normalizedExt = computed(() => props.item?.ext?.trim().toLowerCase() || '');
const fileUrl = computed(() => (props.item?.filePath ? getFileAccessHttpUrl(props.item.filePath) : ''));

const previewKind = computed<PreviewKind>(() => {
  if (!props.item || props.item.type !== 'file') {
    return 'unsupported';
  }
  if (IMAGE_EXTS.has(normalizedExt.value)) {
    return 'image';
  }
  if (normalizedExt.value === 'pdf') {
    return 'pdf';
  }
  if (MARKDOWN_EXTS.has(normalizedExt.value)) {
    return 'markdown';
  }
  if (HTML_EXTS.has(normalizedExt.value)) {
    return 'html';
  }
  if (CODE_EXTS.has(normalizedExt.value)) {
    return 'code';
  }
  return 'unsupported';
});

const modalTitle = computed(() => (props.item ? `预览 - ${props.item.name}` : '文件预览'));
const modalWidth = computed(() => (previewKind.value === 'image' ? 860 : 1080));

const codeLanguage = computed(() => {
  switch (normalizedExt.value) {
    case 'json':
      return 'javascript';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'javascript';
    case 'java':
      return 'text/x-java';
    case 'sql':
      return 'sql';
    case 'css':
      return 'css';
    case 'xml':
      return 'xml';
    case 'vue':
      return 'vue';
    case 'sh':
      return 'shell';
    default:
      return '';
  }
});

const displayCodeContent = computed(() => {
  if (normalizedExt.value !== 'json') {
    return textContent.value;
  }
  if (!textContent.value.trim()) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(textContent.value), null, 2);
  } catch (error) {
    return textContent.value;
  }
});

const openInNewWindow = () => {
  if (fileUrl.value) {
    window.open(fileUrl.value, '_blank');
  }
};

const needsTextContent = computed(() => ['markdown', 'code', 'html'].includes(previewKind.value));

const loadPreviewContent = async () => {
  const currentToken = ++requestToken;
  errorText.value = '';
  textContent.value = '';
  loading.value = false;

  if (!props.open || !props.item || props.item.type !== 'file') {
    return;
  }

  if (!needsTextContent.value) {
    return;
  }

  if (!props.item.filePath) {
    textContent.value = '';
    return;
  }

  loading.value = true;
  try {
    const content = await fetchCabinetFileText(props.item.filePath);
    if (currentToken !== requestToken) {
      return;
    }
    textContent.value = content;
  } catch (error: any) {
    if (currentToken !== requestToken) {
      return;
    }
    errorText.value = error?.message || '文件内容读取失败';
  } finally {
    if (currentToken === requestToken) {
      loading.value = false;
    }
  }
};

watch(
  () => [props.open, props.item?.id, props.item?.filePath, previewKind.value] as const,
  () => {
    void loadPreviewContent();
  },
  { immediate: true },
);
</script>

<style lang="less" scoped>
.cabinet-preview-modal {
  min-height: 320px;
}

.cabinet-preview-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.preview-image-shell {
  display: flex;
  justify-content: center;
  min-height: 320px;
  padding: 8px 0;
}

.preview-image {
  max-width: 100%;
  max-height: 68vh;
}

.preview-frame {
  width: 100%;
  height: 68vh;
  border: 1px solid #eef1f5;
  border-radius: 4px;
  background: #fff;
}
</style>
