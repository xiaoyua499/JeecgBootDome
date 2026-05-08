<template>
  <a-modal v-model:visible="visible" :title="isEdit ? '编辑公文模板' : '新增公文模板'" :width="1200" :mask-closable="false"
    :destroy-on-close="true" @cancel="handleCancel" @ok="handleOk" :confirm-loading="submitLoading">
    <a-form ref="formRef" :model="form" :rules="validatorRules" layout="vertical" :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="模板名称" name="templateName">
            <a-input v-model:value="form.templateName" placeholder="请输入" :maxlength="100" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="模板编码" name="templateCode">
            <a-input v-model:value="form.templateCode" placeholder="可选，如NOTICE001" :maxlength="50" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="公文类型" name="docType">
            <j-dict-select-tag v-model:value="form.docType" dictCode="doc_type" placeholder="请选择" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="公文级别" name="level">
            <j-dict-select-tag v-model:value="form.level" dictCode="doc_level" placeholder="请选择" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="状态" name="status">
            <j-dict-select-tag v-model:value="form.status" dictCode="status" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="排序" name="sortNo">
            <a-input-number v-model:value="form.sortNo" :min="0" style="width:100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="模板内容" name="contentHtml">
        <GovTemplateEditor v-model="htmlContent" />
      </a-form-item>

      <a-form-item label="备用Word兼容内容" name="contentWord">
        <a-textarea v-model:value="form.contentWord" :rows="4" />
      </a-form-item>

      <a-form-item label="备注" name="remark">
        <a-textarea v-model:value="form.remark" :rows="3" />
      </a-form-item>
    </a-form>

    <!-- 变量绑定：核心动态双向绑定 -->
    <div style="margin-top:24px">
      <h4 style="margin-bottom:12px">模板变量配置</h4>
      <var-form ref="varFormRef" v-model:varList="varList" />
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import VarForm from './components/VarForm.vue';
import { Tinymce } from '/@/components/Tinymce';
import { queryById, add, edit } from './JlOfficialTemplate.api';
import JDictSelectTag from '/@/components/Form/src/jeecg/components/JDictSelectTag.vue';
import GovTemplateEditor from './components/gov-template-editor/GovTemplateEditor.vue'
const visible = ref(false);
const submitLoading = ref(false);
const isEdit = ref(false);
const templateId = ref(null);
const htmlContent = ref('');
// 表单引用
const formRef = ref();
// VarForm 引用
const varFormRef = ref();

// 表单数据
const form = reactive({
  templateName: '',
  templateCode: '',
  docType: '',
  level: '',
  contentHtml: '1231',
  contentWord: '',
  status: '1',
  sortNo: 0,
  remark: ''
});
const tinymceContent = ref(`
        <div style="width: 794px; min-height: 1123px; margin: 0 auto; background: #ffffff; padding: 40px 70px 60px; box-sizing: border-box; font-family: 'SimSun','宋体','Songti SC',serif; color: #000; position: relative; line-height: 1.9;">
          <div style="margin-top: 220px; text-align: center; font-size: 54px; font-weight: 700; color: #d60000; letter-spacing: 1px; line-height: 1.25;">
            中共 XX 市委办公室文件
          </div>
          <div style="margin-top: 120px; text-align: center; font-size: 20px; color: #222; line-height: 1.6;">
            X 党办发〔2018〕2 号
          </div>
          <div style="margin: 16px 0 90px; border-top: 3px solid #d60000;"></div>
          <div style="text-align: center; font-size: 28px; font-weight: 700; color: #111; line-height: 1.8; margin-bottom: 40px;">
            关于在全市范围内开展 XXXX 普查的公告
          </div>
          <div style="font-size: 20px; color: #222; text-indent: 2em; line-height: 2; margin-bottom: 8px;">
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </div>
          <div style="font-size: 20px; color: #222; text-indent: 0; line-height: 2; margin-bottom: 8px;">
            XXXXXXXXXXXXXXXXXXXXXXXXXXXX。
          </div>
          <div style="font-size: 20px; color: #222; text-indent: 2em; line-height: 2; margin-bottom: 8px;">
            XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
          </div>
          <div style="font-size: 20px; color: #222; text-indent: 0; line-height: 2; margin-bottom: 22px;">
            XXXXXXXXXXXXXXXXXXXXXXXXXXXX。
          </div>
          <div style="font-size: 20px; color: #222; text-indent: 2em; line-height: 2; margin-bottom: 120px;">
            特此公告。
          </div>
          <div style="width: 280px; margin-left: auto; text-align: left; font-size: 20px; color: #222; line-height: 2.2;">
            <div>中共 XX 市委办公室</div>
            <div>2018 年 X 月 XX 日</div>
          </div>
          <div style="position: absolute; right: 70px; bottom: 38px; font-size: 18px; color: #333;">
            — 1 —
          </div>
        </div>
      `);
// 表单验证规则
const validatorRules = {
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  docType: [
    { required: true, message: '请选择公文类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择公文级别', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  contentHtml: [
    { required: true, message: '请输入模板内容', trigger: 'blur' }
  ]
};

// 变量列表（双向绑定）
const varList = ref([]);

// 打开
const open = async (id) => {
  visible.value = true;
  // 重置表单
  Object.assign(form, {
    templateName: '',
    templateCode: '',
    docType: '',
    level: '',
    contentHtml: '',
    contentWord: '',
    status: '1',
    sortNo: 0,
    remark: ''
  });
  varList.value = [{ varName: '', varCode: '', varDesc: '' }];
  isEdit.value = !!id;
  templateId.value = id;

  if (id) {
    const res = await queryById({ id });
    if (res.success && res.result) {
      Object.assign(form, res.result);
      varList.value = res.varList || [{ varName: '', varCode: '', varDesc: '' }];
    }
  }

  // 清除验证状态
  formRef.value?.clearValidate();
  varFormRef.value?.clearValidate();
};

// 提交
const handleOk = async () => {
  try {
    await formRef.value.validate();
    await varFormRef.value?.validate();
  } catch (error) {
    return;
  }

  submitLoading.value = true;

  try {
    const params = {
      ...form,
      varList: varList.value
    };

    let res;
    if (isEdit.value) {
      res = await edit(params);
    } else {
      res = await add(params);
    }

    if (res.success) {
      message.success('保存成功');
      visible.value = false;
    } else {
      message.error(res.message || '保存失败');
    }
  } catch (error) {
    message.error('操作失败');
  } finally {
    submitLoading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({ open });
</script>
