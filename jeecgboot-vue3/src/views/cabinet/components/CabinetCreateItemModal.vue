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

  interface CreateItemModalOpenPayload {
    type: ItemType;
    defaultName: string;
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
      : `请输入当前目录下新的文件名称；未填写扩展名时会默认补成 .txt，仅支持新建 ${CABINET_CREATABLE_FILE_EXTS.join(' / ')} 类型文件。`,
  );

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
      // 这里只放行文档类白名单，图片/视频/压缩包等都统一拦截。
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
