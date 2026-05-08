<template>
  <div class="jeecg-container">
    <BasicTable @register="registerTable" rowKey="id" :bordered="true">
      <template #tableTitle>
        <a-button type="primary" @click="handleAdd()">
          <template #icon><PlusOutlined /></template>
          新增模板
        </a-button>
      </template>
      <template #action="{ record }">
        <a-button type="text" @click="handleEdit(record)">
          <template #icon><EditOutlined /></template>
          编辑
        </a-button>
        <a-button type="text" @click="handleCopy(record.id)">
          <template #icon><CopyOutlined /></template>
          复制
        </a-button>
        <a-button
            type="text"
            :disabled="record.status === '1'"
            @click="handleChangeStatus(record.id, '1')"
            style="color: #52c41a"
        >
          <template #icon><CheckCircleOutlined /></template>
          启用
        </a-button>
        <a-button
            type="text"
            :disabled="record.status === '0'"
            @click="handleChangeStatus(record.id, '0')"
            style="color: #f5222d"
        >
          <template #icon><CloseCircleOutlined /></template>
          禁用
        </a-button>
        <a-button type="text" @click="handleDelete(record.id)" style="color: #f5222d">
          <template #icon><DeleteOutlined /></template>
          删除
        </a-button>
      </template>
    </BasicTable>

    <!-- 新增/编辑弹窗 -->
    <sys-official-template-add
        ref="addOrEditRef"
        @ok="reload"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { BasicTable } from '/@/components/Table';
import SysOfficialTemplateAdd from './JlOfficialTemplateAdd.vue';
import { useListPage } from '/@/hooks/system/useListPage';
import { list, changeStatus, copyTemplate, deleteApi } from './JlOfficialTemplate.api';

// 列定义
const columns = [
  {
    title: '模板名称',
    dataIndex: 'templateName',
    key: 'templateName',
    ellipsis: true,
    width: 200,
  },
  {
    title: '模板编码',
    dataIndex: 'templateCode',
    key: 'templateCode',
    ellipsis: true,
    width: 150,
  },
  {
    title: '公文类型',
    dataIndex: 'docType',
    key: 'docType',
    dictCode: 'doc_type',
    ellipsis: true,
    width: 120,
  },
  {
    title: '公文级别',
    dataIndex: 'level',
    key: 'level',
    dictCode: 'doc_level',
    ellipsis: true,
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    dictCode: 'status',
    width: 100,
  },
  {
    title: '排序',
    dataIndex: 'sortNo',
    key: 'sortNo',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 300,
    fixed: 'right',
  },
];

// 初始化列表页钩子
const { tableContext } = useListPage({
  tableProps: {
    title: '公文模板列表',
    api: list,
    columns,
    formConfig: {
      schemas: [
        {
          field: 'templateName',
          label: '模板名称',
          component: 'Input',
          colProps: { span: 6 },
        },
        {
          field: 'docType',
          label: '公文类型',
          component: 'JDictSelectTag',
          componentProps: {
            dictCode: 'doc_type',
            placeholder: '请选择公文类型',
          },
          colProps: { span: 6 },
        },
        {
          field: 'level',
          label: '公文级别',
          component: 'JDictSelectTag',
          componentProps: {
            dictCode: 'doc_level',
            placeholder: '请选择公文级别',
          },
          colProps: { span: 6 },
        },
        {
          field: 'status',
          label: '状态',
          component: 'JDictSelectTag',
          componentProps: {
            dictCode: 'status',
            placeholder: '请选择状态',
          },
          colProps: { span: 6 },
        },
      ],
    },
  },
});

const [registerTable, { reload }] = tableContext;

// 新增/编辑组件引用
const addOrEditRef = ref(null);

// 新增模板
const handleAdd = () => {
  addOrEditRef.value.open();
};

// 编辑模板
const handleEdit = (record) => {
  addOrEditRef.value.open(record.id);
};

// 复制模板
const handleCopy = (id) => {
  Modal.confirm({
    title: '提示',
    content: '确定要复制该模板吗？复制后可手动编辑模板信息和变量',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      const res = await copyTemplate(id);
      if (res.success) {
        message.success('复制成功');
        reload();
      } else {
        message.error(res.message || '复制失败');
      }
    },
  });
};

// 启用/禁用模板
const handleChangeStatus = async (id, status) => {
  const res = await changeStatus(id, status);
  if (res.success) {
    message.success(res.message || (status === '1' ? '启用成功' : '禁用成功'));
    reload();
  } else {
    message.error(res.message || (status === '1' ? '启用失败' : '禁用失败'));
  }
};

// 删除模板
const handleDelete = (id) => {
  Modal.confirm({
    title: '警告',
    content: '确定要删除该模板吗？删除后关联的变量也会被删除，不可恢复！',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      const res = await deleteApi({ id });
      if (res.success) {
        message.success('删除成功');
        reload();
      } else {
        message.error(res.message || '删除失败');
      }
    },
  });
};
</script>

<style scoped>
.jeecg-container {
  height: 100%;
  padding: 16px;
}
</style>
