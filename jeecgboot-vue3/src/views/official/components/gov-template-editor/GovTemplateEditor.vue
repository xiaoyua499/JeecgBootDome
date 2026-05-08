<template>
  <div class="gov-template-editor">
    <div class="gov-template-editor__toolbar">
      <a-button type="primary" @click="handleSaveTemplate">保存模板</a-button>
    </div>

    <div class="gov-template-editor__surface">
      <Editor v-model="localEditorValue" output-format="html" model-events="change input undo redo setcontent"
        :init="editorInit" :onInit="handleInit" />
    </div>

    <a-modal v-model:open="templateModalOpen" title="插入模板" width="1080px" :mask-closable="false"
      @ok="handleConfirmTemplate">
      <div class="template-modal">
        <div class="template-modal__list">
          <a-tabs v-model:activeKey="activeTemplateTab">
            <a-tab-pane :key="'text'" :tab="`文本模板（${textTemplates.length}）`" />
            <a-tab-pane :key="'table'" :tab="`表格模板（${tableTemplates.length}）`" />
          </a-tabs>

          <div v-if="activeTemplates.length" class="template-modal__items">
            <button v-for="template in activeTemplates" :key="template.id" type="button" class="template-item"
              :class="{ 'is-active': selectedTemplateId === template.id }" @click="selectedTemplateId = template.id">
              <div class="template-item__head">
                <strong>{{ template.name }}</strong>
                <span>{{ template.type === 'text' ? '文本模板' : '表格模板' }}</span>
              </div>
              <p>{{ template.desc }}</p>
            </button>
          </div>
          <a-empty v-else description="当前分类下暂无模板" />
        </div>

        <div class="template-modal__preview">
          <div class="template-modal__preview-head">
            <span>模板预览</span>
            <h3>{{ selectedTemplate?.name || '请选择一个模板' }}</h3>
            <p>{{ selectedTemplate?.desc || '左侧选择模板后，可在此查看插入效果。' }}</p>
          </div>

          <div v-if="selectedTemplate" class="template-modal__preview-body">
            <div class="template-preview" v-html="selectedTemplate.content" />
          </div>
          <a-empty v-else description="尚未选择模板" />
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="fieldModalOpen" title="插入变量" width="920px" :mask-closable="false" :footer="null">
      <div class="field-modal">
        <div class="field-modal__toolbar">
          <a-input v-model:value="fieldKeyword" allow-clear placeholder="搜索变量名称" />
          <a-button type="primary" @click="openCreateFieldModal">新增变量</a-button>
        </div>

        <a-alert v-if="!cursorInTableCell" type="info" show-icon message="当前光标不在表格单元格中。确认插入后，将以正文变量节点方式插入。" />

        <div class="field-modal__insert-config">
          <span>插入方式</span>
          <a-radio-group v-model:value="insertMode">
            <a-radio-button value="row">插入行</a-radio-button>
            <a-radio-button value="column">插入列</a-radio-button>
          </a-radio-group>
        </div>

        <div class="field-modal__insert-config">
          <span>{{ insertMode === 'row' ? '插入位置' : '插入方向' }}</span>
          <a-radio-group v-model:value="insertDirection" :disabled="!cursorInTableCell">
            <a-radio-button v-for="option in insertDirectionOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-radio-button>
          </a-radio-group>
        </div>

        <div v-if="filteredFields.length" class="field-modal__items">
          <div v-for="field in filteredFields" :key="field.id" class="field-item"
            :class="{ 'is-active': selectedFieldId === field.id }" @click="selectedFieldId = field.id">
            <div class="field-item__main">
              <div class="field-item__head">
                <strong>{{ field.name }}</strong>
                <span>{{ field.id }}</span>
              </div>
              <p>{{ field.desc || '暂无变量说明' }}</p>
            </div>

            <div class="field-item__actions">
              <a-button type="link" @click.stop="handleConfirmField(field)">
                插入
              </a-button>
              <a-button type="link" danger @click.stop="handleDeleteField(field)">
                删除
              </a-button>
            </div>
          </div>
        </div>
        <a-empty v-else description="没有匹配到变量，请尝试调整搜索词或新增变量。" />

        <div class="field-modal__footer">
          <a-button @click="fieldModalOpen = false">关闭</a-button>
          <a-button type="primary" :disabled="!selectedField" @click="handleConfirmField()">
            插入选中变量
          </a-button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="fieldCreateModalOpen" title="新增变量" ok-text="确认新增" cancel-text="取消" :mask-closable="false"
      @ok="handleConfirmCreateField">
      <div class="field-create-modal">
        <p class="field-create-modal__intro">
          变量 ID 由前端自动生成，使用 32 位字符编码，可直接作为模板变量主键使用。
        </p>

        <a-form layout="vertical">
          <a-form-item label="变量名称" required>
            <a-input v-model:value="fieldForm.name" maxlength="30" placeholder="请输入变量名称，例如：审批人" />
          </a-form-item>

          <a-form-item label="变量说明">
            <a-textarea v-model:value="fieldForm.desc" :rows="3" maxlength="120" placeholder="请输入变量说明，可为空" />
          </a-form-item>

          <a-form-item label="变量 ID">
            <a-input :value="fieldForm.id" readonly />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, toRef, watch } from 'vue'
import { Modal, message } from 'ant-design-vue'
import Editor from '@tinymce/tinymce-vue'
import { createDefaultFields, createDefaultTemplates, createUuid } from './mock-data'
import { useTinymceEditor } from './useTinymceEditor'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  templates: {
    type: Array,
    default: undefined,
  },
  fields: {
    type: Array,
    default: undefined,
  },
  useMockData: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'field-create',
  'field-delete',
  'save-template',
])

const localTemplates = ref([])
const localFields = ref([])
const localEditorValue = ref(props.modelValue || '')
const templateModalOpen = ref(false)
const fieldModalOpen = ref(false)
const fieldCreateModalOpen = ref(false)
const activeTemplateTab = ref('text')
const selectedTemplateId = ref('')
const fieldKeyword = ref('')
const selectedFieldId = ref('')
const cursorInTableCell = ref(false)
const insertMode = ref('row')
const insertDirection = ref('below')

const fieldForm = reactive({
  id: createUuid(),
  name: '',
  desc: '',
})

const clone = (value) => JSON.parse(JSON.stringify(value))

const resolveTemplates = () => {
  if (Array.isArray(props.templates)) {
    return clone(props.templates)
  }

  return props.useMockData ? createDefaultTemplates() : []
}

const resolveFields = () => {
  if (Array.isArray(props.fields)) {
    return clone(props.fields)
  }

  return props.useMockData ? createDefaultFields() : []
}

watch(
  [() => props.templates, () => props.useMockData],
  () => {
    localTemplates.value = resolveTemplates()
  },
  { immediate: true, deep: true },
)

watch(
  [() => props.fields, () => props.useMockData],
  () => {
    localFields.value = resolveFields()
  },
  { immediate: true, deep: true },
)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== localEditorValue.value) {
      localEditorValue.value = value || ''
    }
  },
  { immediate: true },
)

watch(localEditorValue, (value) => {
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

const textTemplates = computed(() =>
  localTemplates.value.filter((template) => template.type === 'text'),
)

const tableTemplates = computed(() =>
  localTemplates.value.filter((template) => template.type === 'table'),
)

const activeTemplates = computed(() =>
  activeTemplateTab.value === 'text' ? textTemplates.value : tableTemplates.value,
)

const selectedTemplate = computed(() => {
  const allTemplates = [...textTemplates.value, ...tableTemplates.value]
  return allTemplates.find((template) => template.id === selectedTemplateId.value) || null
})

const filteredFields = computed(() => {
  const keyword = fieldKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return localFields.value
  }

  return localFields.value.filter((field) => field.name.toLowerCase().includes(keyword))
})

const selectedField = computed(
  () => filteredFields.value.find((field) => field.id === selectedFieldId.value) || null,
)

const insertDirectionOptions = computed(() =>
  insertMode.value === 'column'
    ? [
      { label: '当前行左侧', value: 'left' },
      { label: '当前行右侧', value: 'right' },
    ]
    : [
      { label: '当前行上方', value: 'above' },
      { label: '当前行下方', value: 'below' },
    ],
)

watch(insertMode, (value) => {
  insertDirection.value = value === 'column' ? 'right' : 'below'
})

const syncSelectedTemplate = () => {
  if (!activeTemplates.value.length) {
    if (activeTemplateTab.value === 'text' && tableTemplates.value.length) {
      activeTemplateTab.value = 'table'
      return
    }

    if (activeTemplateTab.value === 'table' && textTemplates.value.length) {
      activeTemplateTab.value = 'text'
      return
    }
  }

  if (!activeTemplates.value.length) {
    selectedTemplateId.value = ''
    return
  }

  const existed = activeTemplates.value.some((template) => template.id === selectedTemplateId.value)
  if (!existed) {
    selectedTemplateId.value = activeTemplates.value[0].id
  }
}

watch([activeTemplateTab, textTemplates, tableTemplates], syncSelectedTemplate, { immediate: true })

watch(filteredFields, (fields) => {
  if (!fields.length) {
    selectedFieldId.value = ''
    return
  }

  const existed = fields.some((field) => field.id === selectedFieldId.value)
  if (!existed) {
    selectedFieldId.value = fields[0].id
  }
}, { immediate: true })

const handleOpenTemplateModal = () => {
  saveSelection()
  activeTemplateTab.value = textTemplates.value.length ? 'text' : 'table'
  syncSelectedTemplate()
  templateModalOpen.value = true
}

const handleOpenFieldModal = () => {
  saveSelection()
  fieldKeyword.value = ''
  insertMode.value = 'row'
  insertDirection.value = 'below'
  if (localFields.value.length) {
    selectedFieldId.value = localFields.value[0].id
  }
  fieldModalOpen.value = true
}

const {
  editorInit,
  handleInit,
  getEditor,
  saveSelection,
  insertTemplate,
  insertField,
  clearContent,
} = useTinymceEditor({
  disabledRef: toRef(props, 'disabled'),
  onRequestTemplate: handleOpenTemplateModal,
  onRequestField: handleOpenFieldModal,
  onSelectionChange: ({ inTableCell }) => {
    cursorInTableCell.value = inTableCell
  },
  onContentChange: (html) => {
    localEditorValue.value = html
  },
})

const resetFieldForm = () => {
  fieldForm.id = createUuid()
  fieldForm.name = ''
  fieldForm.desc = ''
}

const openCreateFieldModal = () => {
  resetFieldForm()
  fieldCreateModalOpen.value = true
}

const handleConfirmTemplate = async () => {
  if (!selectedTemplate.value) {
    return
  }

  templateModalOpen.value = false
  await nextTick()

  const inserted = insertTemplate(selectedTemplate.value)
  if (!inserted) {
    message.error('模板插入失败，请稍后重试。')
    return
  }

  message.success(`已插入模板“${selectedTemplate.value.name}”`)
}

const handleConfirmField = async (field = selectedField.value) => {
  if (!field) {
    return
  }

  fieldModalOpen.value = false
  await nextTick()

  const result = insertField(
    field,
    cursorInTableCell.value
      ? {
        insertMode: insertMode.value,
        insertDirection: insertDirection.value,
      }
      : {},
  )
  if (!result?.inserted) {
    message.warning('当前变量插入失败，请重新定位光标后重试。')
    return
  }

  const modeLabel =
    result.mode === 'column' ? '变量列' : result.mode === 'row' ? '变量行' : '正文变量'
  message.success(`已插入${modeLabel}“${field.name}”`)
}

const handleConfirmCreateField = () => {
  const name = fieldForm.name.trim()
  if (!name) {
    message.warning('请输入变量名称')
    return
  }

  const createdField = {
    id: fieldForm.id,
    name,
    desc: fieldForm.desc.trim(),
  }

  localFields.value = [createdField, ...localFields.value]
  selectedFieldId.value = createdField.id
  emit('field-create', createdField)
  fieldCreateModalOpen.value = false
  message.success(`变量“${createdField.name}”已新增`)
}

const handleDeleteField = (field) => {
  Modal.confirm({
    title: '删除变量',
    content: `确认删除变量“${field.name}”吗？当前删除仅作用于组件内本地数据。`,
    okText: '删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => {
      localFields.value = localFields.value.filter((item) => item.id !== field.id)
      emit('field-delete', field)
      message.success(`变量“${field.name}”已删除`)
    },
  })
}

const normalizeFieldValue = (value = '') =>
  String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const isTableTemplateContent = (doc) => Boolean(doc.querySelector('.gov-table-template table'))

const getLatestHtml = () => {
  const editor = getEditor()
  const html = editor?.getContent({ format: 'html' }) || localEditorValue.value || ''

  if (html !== localEditorValue.value) {
    localEditorValue.value = html
  }

  return html
}

const extractFieldsFromTextTemplate = (doc) =>
  Array.from(doc.querySelectorAll('.doc-field-wrapper')).map((wrapper) => {
    const fieldTag = wrapper.querySelector('.doc-field-tag')
    const fieldText = wrapper.querySelector('.doc-field-text')

    return {
      id: fieldTag?.getAttribute('data-field-id') || '',
      var_name: fieldTag?.getAttribute('data-field-name') || '',
      var_code: normalizeFieldValue(fieldText?.textContent || ''),
      var_desc: fieldTag?.getAttribute('data-field-desc') || '',
    }
  })

const extractFieldsFromTableTemplate = (doc) => {
  const tableRows = Array.from(doc.querySelectorAll('.gov-table-template table tr'))

  return tableRows.flatMap((row) => {
    const cells = Array.from(row.children).filter((cell) => ['TH', 'TD'].includes(cell.tagName))
    const fields = []

    for (let index = 0; index < cells.length; index += 2) {
      const th = cells[index]
      const td = cells[index + 1]

      if (!th || !td || th.tagName !== 'TH' || td.tagName !== 'TD') {
        continue
      }

      fields.push({
        id: th.getAttribute('data-field-id') || '',
        var_name:
          normalizeFieldValue(th.getAttribute('data-field-name') || '') ||
          normalizeFieldValue(th.textContent || ''),
        var_code: normalizeFieldValue(td.textContent || ''),
        var_desc: th.getAttribute('data-field-desc') || '',
      })
    }

    return fields
  })
}

const buildSavePayload = () => {
  const editor = getEditor()
  editor?.save?.()
  const html = getLatestHtml()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html || '', 'text/html')
  const fields = isTableTemplateContent(doc)
    ? extractFieldsFromTableTemplate(doc)
    : extractFieldsFromTextTemplate(doc)

  return {
    html,
    fieldJsonString: JSON.stringify(fields),
  }
}

const handleSaveTemplate = () => {
  const { html, fieldJsonString } = buildSavePayload()
  console.log(html, fieldJsonString, '123');

  emit('save-template', html, fieldJsonString)
  message.success('模板内容已整理完成')
}

defineExpose({
  getHtml: getLatestHtml,
  getEditor,
  insertTemplate,
  insertField,
  clearContent,
  saveTemplate: buildSavePayload,
})
</script>

<style scoped lang="less">
.gov-template-editor {
  width: 100%;
}

.gov-template-editor__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.gov-template-editor__surface {
  overflow: hidden;
  border: 1px solid rgba(31, 42, 55, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 60px rgba(31, 42, 55, 0.08);
}

.gov-template-editor__surface :deep(.tox) {
  border: none;
  background: transparent;
  font-family: 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.gov-template-editor__surface :deep(.tox-editor-header) {
  border-bottom: 1px solid rgba(31, 42, 55, 0.08);
  box-shadow: none;
}

.gov-template-editor__surface :deep(.tox-toolbar__primary) {
  background: rgba(255, 255, 255, 0.96);
}

.gov-template-editor__surface :deep(.tox-sidebar-wrap) {
  background: #fff;
}

.gov-template-editor__surface :deep(.tox-statusbar) {
  border-top: 1px solid rgba(31, 42, 55, 0.08);
  color: #667085;
}

.template-modal {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  gap: 20px;
  min-height: 560px;
}

.template-modal__list,
.template-modal__preview {
  min-width: 0;
  border: 1px solid rgba(31, 42, 55, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
}

.template-modal__list {
  padding: 8px 16px 16px;
}

.template-modal__items {
  display: flex;
  max-height: 460px;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.template-item {
  padding: 16px 18px;
  border: none;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px rgba(31, 42, 55, 0.08);
  }

  &.is-active {
    background:
      linear-gradient(90deg, rgba(180, 35, 24, 0.08), transparent 52%),
      #ffffff;
    box-shadow: inset 0 0 0 1px rgba(180, 35, 24, 0.2);
  }
}

.template-item__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  strong {
    color: #101828;
    font-size: 15px;
  }

  span {
    display: inline-flex;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(21, 94, 239, 0.08);
    color: #155eef;
    font-size: 12px;
    font-weight: 600;
  }
}

.template-item p {
  margin: 0;
  color: #667085;
  line-height: 1.7;
}

.template-modal__preview {
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.template-modal__preview-head {
  margin-bottom: 14px;

  span {
    color: #b42318;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h3 {
    margin: 6px 0 8px;
    color: #101828;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.7;
  }
}

.template-modal__preview-body {
  flex: 1;
  overflow: auto;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(247, 243, 236, 0.86), rgba(255, 255, 255, 0.98));
  padding: 22px;
}

.template-preview {
  color: #1f2a37;
  line-height: 1.75;
}

.template-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.template-preview :deep(th),
.template-preview :deep(td) {
  border: 1px solid rgba(31, 42, 55, 0.22);
  padding: 10px;
}

.template-preview :deep(.official-document__issuer) {
  color: #b42318;
  text-align: center;
  font-family: 'Source Han Serif SC', 'Songti SC', serif;
  font-size: 30px;
  font-weight: 700;
}

.template-preview :deep(.official-document__serial) {
  margin: 8px 0 12px;
  color: #b42318;
  text-align: center;
  font-weight: 600;
}

.template-preview :deep(.official-document__divider) {
  height: 3px;
  margin-bottom: 22px;
  background: linear-gradient(90deg, #b42318 0%, #d92d20 100%);
}

.template-preview :deep(.official-document__title),
.template-preview :deep(.gov-table-template__title) {
  color: #7a1c13;
  text-align: center;
  font-family: 'Source Han Serif SC', 'Songti SC', serif;
}

.field-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-modal__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.field-modal__insert-config {
  display: flex;
  align-items: center;
  gap: 12px;

  >span {
    min-width: 72px;
    color: #475467;
    font-size: 13px;
    font-weight: 600;
  }
}

.field-modal__items {
  display: flex;
  max-height: 420px;
  flex-direction: column;
  overflow: auto;
  border: 1px solid rgba(31, 42, 55, 0.1);
  border-radius: 20px;
}

.field-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(31, 42, 55, 0.08);
  cursor: pointer;
  transition: background-color 0.24s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(21, 94, 239, 0.05);
  }

  &.is-active {
    background:
      linear-gradient(90deg, rgba(21, 94, 239, 0.08), transparent 50%),
      rgba(255, 255, 255, 0.92);
  }
}

.field-item__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  strong {
    color: #101828;
    font-size: 15px;
  }

  span {
    display: inline-flex;
    max-width: 100%;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(31, 42, 55, 0.06);
    color: #667085;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }
}

.field-item__main p {
  margin: 0;
  color: #667085;
  line-height: 1.7;
}

.field-item__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.field-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.field-create-modal__intro {
  margin: 0 0 18px;
  color: #667085;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .template-modal {
    grid-template-columns: 1fr;
  }
}
</style>
