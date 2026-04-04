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
        <div class="cabinet-preview-toolbar-actions">
          <a-button type="link" @click="openInNewWindow">在新窗口打开</a-button>
          <a-button v-if="canEditCurrentFile && !editing" type="primary" @click="startEditing">编辑</a-button>
          <template v-if="editing">
            <a-button @click="cancelEditing">取消</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">保存</a-button>
          </template>
        </div>
      </div>

      <a-spin :spinning="loading" tip="正在加载预览...">
        <template v-if="item">
          <iframe
            v-if="previewKind === 'pdf'"
            class="preview-frame"
            :src="fileUrl"
            frameborder="0"
            title="PDF 预览"
          />

          <JMarkdownEditor
            v-else-if="previewKind === 'markdown' && !editing"
            :value="textContent"
            :disabled="true"
            :preview="{ mode: 'view', action: [] }"
            :height="560"
          />

          <JMarkdownEditor v-else-if="previewKind === 'markdown'" v-model:value="draftContent" :height="560" />

          <JCodeEditor
            v-else-if="previewKind === 'code' && !editing"
            :value="displayCodeContent"
            :disabled="true"
            :language="codeLanguage"
            height="560px"
          />

          <JCodeEditor
            v-else-if="previewKind === 'code'"
            v-model:value="draftContent"
            :language="codeLanguage"
            height="560px"
          />

          <JEditor
            v-else-if="previewKind === 'html' && !editing"
            :value="richTextContent"
            :autoFocus="false"
            :options="{ readonly: true, toolbar: false, menubar: false }"
            :height="560"
          />

          <JEditor v-else-if="previewKind === 'html'" v-model:value="draftContent" :autoFocus="false" :height="560" />

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
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { JCodeEditor, JEditor } from '/@/components/Form';
import JMarkdownEditor from '/@/components/Form/src/jeecg/components/JMarkdownEditor.vue';
import { getFileAccessHttpUrl } from '/@/utils/common/compUtils';
import { fetchCabinetFileBlob, fetchCabinetFileText, updateCabinetFileContent } from '../cabinet.api';
import type { CabinetItem } from '../types';
import { isCabinetEditableTextExt, isCabinetImageExt } from '../utils';

type PreviewKind = 'pdf' | 'markdown' | 'code' | 'html' | 'unsupported';

const MARKDOWN_EXTS = new Set(['md', 'markdown']);
const HTML_EXTS = new Set(['html', 'htm']);
const CODE_EXTS = new Set([
  'txt',
  'text',
  'json',
  'js',
  'ts',
  'jsx',
  'tsx',
  'java',
  'sql',
  'css',
  'xml',
  'vue',
  'sh',
  'yml',
  'yaml',
  'properties',
  'ini',
  'log',
  'csv',
  'conf',
]);

const props = defineProps<{
  open: boolean;
  item: CabinetItem | null;
  canManage?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved'): void;
}>();

const loading = ref(false);
const saving = ref(false);
const editing = ref(false);
const textContent = ref('');
const draftContent = ref('');
const errorText = ref('');
const binaryPreviewUrl = ref('');
let requestToken = 0;

const normalizedExt = computed(() => props.item?.ext?.trim().toLowerCase() || '');
const sourceFileUrl = computed(() => (props.item?.filePath ? getFileAccessHttpUrl(props.item.filePath) : ''));
const fileUrl = computed(() => {
  if (binaryPreviewUrl.value) {
    return binaryPreviewUrl.value;
  }
  return props.item?.filePath ? getFileAccessHttpUrl(props.item.filePath) : '';
});

const previewKind = computed<PreviewKind>(() => {
  if (!props.item || props.item.type !== 'file') {
    return 'unsupported';
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

const canEditCurrentFile = computed(() => {
  if (!props.item || props.item.type !== 'file' || !props.canManage) {
    return false;
  }
  if (!props.item.filePath) {
    return false;
  }
  return isCabinetEditableTextExt(normalizedExt.value);
});

const modalTitle = computed(() => (props.item ? `预览 - ${props.item.name}` : '文件预览'));
const modalWidth = computed(() => 1080);

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

const richTextContent = computed(() => {
  if (previewKind.value !== 'html') {
    return '';
  }
  return extractEditableHtml(textContent.value);
});

const sanitizePreviewHtml = (documentNode: Document) => {
  const body = documentNode.body;
  if (!body) {
    return textContent.value;
  }

  body.querySelectorAll('script, iframe, object, embed, form, input, button, textarea, select, option, base, meta, link, style').forEach((node) => {
    node.remove();
  });

  body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value;

      if (attributeName.startsWith('on')) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (attributeName === 'srcset') {
        element.removeAttribute(attribute.name);
        return;
      }

      if (attributeName === 'style' && containsTemplateMarker(attributeValue)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (['src', 'href', 'poster', 'background'].includes(attributeName)) {
        const normalizedUrl = normalizePreviewAssetUrl(attributeValue);
        if (normalizedUrl) {
          element.setAttribute(attribute.name, normalizedUrl);
        } else {
          element.removeAttribute(attribute.name);
        }
      }
    });

    if (element.tagName.toLowerCase() === 'a' && element.getAttribute('href')) {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return body.innerHTML.trim() || textContent.value;
};

const extractEditableHtml = (content: string) => {
  if (!content.trim()) {
    return '';
  }
  if (typeof DOMParser === 'undefined') {
    return content;
  }
  try {
    const documentNode = new DOMParser().parseFromString(content, 'text/html');
    return sanitizePreviewHtml(documentNode);
  } catch (error) {
    return content;
  }
};

const containsTemplateMarker = (value: string) => {
  return (
    value.includes('<') ||
    value.includes('>') ||
    value.includes('{{') ||
    value.includes('}}') ||
    value.includes('<%') ||
    value.includes('%>')
  );
};

const normalizePreviewAssetUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  const normalizedValue = trimmedValue.toLowerCase();
  if (
    containsTemplateMarker(trimmedValue) ||
    normalizedValue.startsWith('javascript:') ||
    normalizedValue.startsWith('vbscript:') ||
    normalizedValue.startsWith('data:text/html')
  ) {
    return '';
  }

  if (
    normalizedValue.startsWith('http://') ||
    normalizedValue.startsWith('https://') ||
    normalizedValue.startsWith('//') ||
    normalizedValue.startsWith('data:') ||
    normalizedValue.startsWith('blob:') ||
    normalizedValue.startsWith('mailto:') ||
    normalizedValue.startsWith('tel:') ||
    normalizedValue.startsWith('#')
  ) {
    return trimmedValue;
  }

  if (!sourceFileUrl.value) {
    return '';
  }

  try {
    return new URL(trimmedValue, sourceFileUrl.value).toString();
  } catch (error) {
    return '';
  }
};

const openInNewWindow = () => {
  if (fileUrl.value) {
    window.open(fileUrl.value, '_blank');
  }
};

const startEditing = () => {
  if (!canEditCurrentFile.value || loading.value) {
    return;
  }
  editing.value = true;
};

const cancelEditing = () => {
  editing.value = false;
  draftContent.value = previewKind.value === 'html' ? extractEditableHtml(textContent.value) : textContent.value;
};

const revokeBinaryPreviewUrl = () => {
  if (binaryPreviewUrl.value) {
    URL.revokeObjectURL(binaryPreviewUrl.value);
    binaryPreviewUrl.value = '';
  }
};

const needsTextContent = computed(() => ['markdown', 'code', 'html'].includes(previewKind.value));
const needsBinaryContent = computed(() => previewKind.value === 'pdf');

const loadPreviewContent = async () => {
  const currentToken = ++requestToken;
  errorText.value = '';
  textContent.value = '';
  draftContent.value = '';
  editing.value = false;
  saving.value = false;
  loading.value = false;
  revokeBinaryPreviewUrl();

  if (!props.open || !props.item || props.item.type !== 'file') {
    return;
  }

  if (isCabinetImageExt(normalizedExt.value)) {
    return;
  }

  if (needsBinaryContent.value && props.item.filePath) {
    loading.value = true;
    try {
      const blob = await fetchCabinetFileBlob(props.item.filePath);
      if (currentToken !== requestToken) {
        return;
      }
      binaryPreviewUrl.value = URL.createObjectURL(blob);
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
    draftContent.value = previewKind.value === 'html' ? extractEditableHtml(content) : content;
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

const buildHtmlContentForSave = (sourceContent: string, nextBodyContent: string) => {
  if (!sourceContent.trim() || typeof DOMParser === 'undefined') {
    return nextBodyContent;
  }
  const hasHtmlShell = /<html[\s>]/i.test(sourceContent) || /<body[\s>]/i.test(sourceContent);
  if (!hasHtmlShell) {
    return nextBodyContent;
  }
  try {
    const documentNode = new DOMParser().parseFromString(sourceContent, 'text/html');
    if (!documentNode.body) {
      return nextBodyContent;
    }
    documentNode.body.innerHTML = nextBodyContent;
    const doctypeMatch = sourceContent.match(/<!doctype[^>]*>/i);
    const doctype = doctypeMatch ? `${doctypeMatch[0]}\n` : '';
    return `${doctype}${documentNode.documentElement.outerHTML}`;
  } catch (error) {
    return nextBodyContent;
  }
};

const buildSaveContent = () => {
  if (previewKind.value === 'html') {
    return buildHtmlContentForSave(textContent.value, draftContent.value);
  }
  return draftContent.value;
};

const handleSave = async () => {
  if (!props.item || !canEditCurrentFile.value) {
    return;
  }
  saving.value = true;
  try {
    const nextContent = buildSaveContent();
    await updateCabinetFileContent({ id: props.item.id, content: nextContent });
    textContent.value = nextContent;
    draftContent.value = previewKind.value === 'html' ? extractEditableHtml(nextContent) : nextContent;
    editing.value = false;
    emit('saved');
    message.success('保存成功');
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

watch(
  () => [props.open, props.item?.id, props.item?.filePath, previewKind.value] as const,
  () => {
    void loadPreviewContent();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeBinaryPreviewUrl();
});
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

.cabinet-preview-toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-frame {
  width: 100%;
  height: 68vh;
  border: 1px solid #eef1f5;
  border-radius: 4px;
  background: #fff;
}
</style>
