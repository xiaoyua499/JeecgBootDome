<!--
  新建文件/文件夹弹窗

  功能说明：
  - 通过 useModalInner 接收 CreateItemModalOpenPayload 打开，包含：
    - type: 'file' | 'folder'（决定标题、提示文案和校验规则）
    - defaultName: 预填的默认名称
    - siblingNames: 同级已有名称列表（用于同名校验）
  - 文件名提交前自动补全扩展名（ensureCabinetFileName）
  - 仅允许新建白名单内的文本类文件（isCabinetCreatableFileExt）
  - 同名校验：与 siblingNames 比对，重名时提示并阻止提交
  - 成功后抛出 success 事件，携带 { type, name }

  使用方式（父组件）：
  const [registerCreateModal, { openModal: openCreateModal }] = useModal();
  openCreateModal(true, { type: 'file', defaultName: '新建文件', siblingNames: [...] });
-->
<template>
  <BasicModal
    @register="registerModal"
    :title="modalTitle"
    width="480px"
    destroyOnClose
    v-bind="$attrs"
    @ok="handleSubmit"
  >
    <div class="px-2 pt-3">
      <div class="mb-3 text-[13px] leading-[20px] text-[#8a94a6]">
        {{ helperText }}
      </div>
      <BasicForm @register="registerForm" />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { computed, ref, unref } from 'vue';
  import { message } from 'ant-design-vue';
  import { BasicForm, type FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import type { ItemType } from '../types';
  import { CABINET_CREATABLE_FILE_EXTS, ensureCabinetFileName, isCabinetCreatableFileExt, resolveCabinetFileExt } from '../utils';

  /** 弹窗打开时传入的数据结构 */
  interface CreateItemModalOpenPayload {
    /** 新建类型：file 或 folder */
    type: ItemType;
    /** 预填的默认名称 */
    defaultName: string;
    /** 同级已有名称列表，用于同名校验 */
    siblingNames: string[];
  }

  const emit = defineEmits<{
    (e: 'register', modal: unknown, uuid: string): void;
    (e: 'success', payload: { type: ItemType; name: string }): void;
  }>();

  const itemType = ref<ItemType>('folder');
  const siblingNames = ref<string[]>([]);

  const formSchema: FormSchema[] = [
    {
      field: 'name',
      label: '名称',
      component: 'Input',
      required: true,
      componentProps: {
        maxlength: 120,
      },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, validate, updateSchema }] = useForm({
    labelWidth: 72,
    baseColProps: { span: 24 },
    schemas: formSchema,
    showActionButtonGroup: false,
  });

  /**
   * useModalInner 回调：弹窗打开时初始化表单
   * - 重置表单字段
   * - 根据 type 更新表单 label 和 placeholder
   * - 填入 defaultName
   * - 保存 siblingNames 用于后续同名校验
   */
  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data?: CreateItemModalOpenPayload) => {
    await resetFields();
    itemType.value = data?.type ?? 'folder';
    siblingNames.value = data?.siblingNames ?? [];
    setModalProps({ confirmLoading: false });
    await updateSchema({
      field: 'name',
      label: itemType.value === 'folder' ? '文件夹名' : '文件名',
      componentProps: {
        maxlength: 120,
        placeholder: itemType.value === 'folder' ? '请输入文件夹名称' : '请输入文件名称',
      },
    });
    await setFieldsValue({
      name: data?.defaultName ?? '',
    });
  });

  const modalTitle = computed(() => (itemType.value === 'folder' ? '新建文件夹' : '新建文件'));

  const helperText = computed(() =>
    itemType.value === 'folder'
      ? '请输入当前目录下新的文件夹名称。'
      : `请输入当前目录下新的文本文件名称；未填写扩展名时会默认补成 .txt，仅支持新建 ${CABINET_CREATABLE_FILE_EXTS.join(' / ')} 类型文件。`,
  );

  /**
   * 表单提交处理
   * 校验顺序：
   * 1. 表单必填校验（BasicForm validate）
   * 2. 文件名补全扩展名（ensureCabinetFileName）
   * 3. 文件类型白名单校验（isCabinetCreatableFileExt）
   * 4. 同名校验（与 siblingNames 比对）
   * 全部通过后抛出 success 事件并关闭弹窗
   */
  async function handleSubmit() {
    try {
      const values = (await validate()) as { name?: string };
      const rawName = values.name?.trim() || '';
      // 文件名统一在提交前补默认扩展名，避免调用方各自处理。
      const finalName = itemType.value === 'file' ? ensureCabinetFileName(rawName) : rawName;
      if (!finalName) {
        message.warning(itemType.value === 'folder' ? '请输入文件夹名称' : '请输入文件名称');
        return;
      }
      // 新建空文件只放行可编辑的文本类型，避免生成无法编辑的空壳文件。
      if (itemType.value === 'file' && !isCabinetCreatableFileExt(resolveCabinetFileExt(finalName))) {
        message.warning(`仅支持新建 ${CABINET_CREATABLE_FILE_EXTS.join(' / ')} 类型文件`);
        return;
      }
      if (unref(siblingNames).includes(finalName)) {
        message.warning(itemType.value === 'folder' ? '同名文件夹已存在' : '同名文件已存在');
        return;
      }
      emit('success', { type: itemType.value, name: finalName });
      closeModal();
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
