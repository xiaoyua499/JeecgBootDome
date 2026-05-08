<template>
  <div class="var-form-container">
    <a-form ref="formRef" :model="formModel">
      <div class="var-item" v-for="(item, index) in localVarList" :key="index">
        <a-row :gutter="16" style="margin-bottom: 12px;">
          <a-col :span="6">
            <a-form-item
              :name="['varItems', index, 'varName']"
              :rules="[{ required: true, message: '请输入变量名称', trigger: 'blur' }]"
            >
              <template #label>变量名称</template>
              <a-input
                v-model:value="item.varName"
                placeholder="如：发文单位"
                :maxlength="50"
                @change="syncVarList"
              />
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item
              :name="['varItems', index, 'varCode']"
              :rules="[{ required: true, message: '请输入占位符', trigger: 'blur' }]"
            >
              <template #label>占位符</template>
              <a-input
                v-model:value="item.varCode"
                placeholder="如：{{unit_name}}"
                :maxlength="50"
                @change="syncVarList"
              />
            </a-form-item>
          </a-col>

          <a-col :span="8">
            <a-form-item :name="['varItems', index, 'varDesc']">
              <template #label>变量说明</template>
              <a-input
                v-model:value="item.varDesc"
                placeholder="可选"
                :maxlength="100"
                @change="syncVarList"
              />
            </a-form-item>
          </a-col>

          <a-col :span="2" style="display: flex;align-items:center;justify-content:center">
            <a-button
              type="text"
              danger
              @click="handleDelete(index)"
              :disabled="localVarList.length <= 1"
            >
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-col>
        </a-row>
      </div>
    </a-form>

    <a-button type="dashed" block @click="handleAdd" style="margin-top:8px">
      <template #icon><PlusOutlined /></template>
      新增变量
    </a-button>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const formRef = ref();
const formModel = reactive({
  varItems: []
});

const props = defineProps({
  varList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:varList']);

// 本地数据，避免直接修改父组件
const localVarList = ref([]);

watch(
  () => props.varList,
  (val) => {
    localVarList.value = JSON.parse(JSON.stringify(val || []));
    formModel.varItems = localVarList.value;
    if (localVarList.value.length === 0) {
      localVarList.value.push({ varName: '', varCode: '', varDesc: '' });
      formModel.varItems = localVarList.value;
    }
  },
  { deep: true, immediate: true }
);

// 新增
const handleAdd = () => {
  localVarList.value.push({ varName: '', varCode: '', varDesc: '' });
  formModel.varItems = localVarList.value;
  syncVarList();
};

// 删除
const handleDelete = (index) => {
  localVarList.value.splice(index, 1);
  formModel.varItems = localVarList.value;
  syncVarList();
};

// 同步给父组件
const syncVarList = () => {
  emit('update:varList', localVarList.value);
};

// 暴露验证方法
const validate = () => {
  return formRef.value?.validate();
};

const clearValidate = () => {
  formRef.value?.clearValidate();
};

defineExpose({
  validate,
  clearValidate
});
</script>

<style scoped>
.var-form-container {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fafafa;
}
.var-item {
  padding-bottom: 8px;
  border-bottom: 1px dashed #eee;
  margin-bottom: 8px;
}
.var-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
</style>
