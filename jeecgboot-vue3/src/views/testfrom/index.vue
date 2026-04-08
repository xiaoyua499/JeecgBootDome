<template>
  <div>
    <BasicTable @register="registerTable" :rowSelection="rowSelection">
      <template #tableTitle>
        <a-button type="primary" v-auth="'testdomefrom:testfrom:add'" @click="handleAdd" preIcon="ant-design:plus-outlined">
          新增
        </a-button>
        <a-button
          type="primary"
          v-auth="'testdomefrom:testfrom:exportXls'"
          preIcon="ant-design:export-outlined"
          @click="onExportXls"
        >
          导出
        </a-button>
        <j-upload-button
          type="primary"
          v-auth="'testdomefrom:testfrom:importExcel'"
          preIcon="ant-design:import-outlined"
          @click="onImportXls"
        >
          导入
        </j-upload-button>

        <a-dropdown v-if="selectedRowKeys.length > 0">
          <template #overlay>
            <a-menu>
              <a-menu-item key="1" @click="batchHandleDelete">
                <Icon icon="ant-design:delete-outlined" />
                删除
              </a-menu-item>
            </a-menu>
          </template>
          <a-button v-auth="'testdomefrom:testfrom:deleteBatch'">
            批量操作
            <Icon icon="mdi:chevron-down" />
          </a-button>
        </a-dropdown>

        <super-query :config="superQueryConfig" @search="handleSuperQuery" />
      </template>

      <template #action="{ record }">
        <TableAction :actions="getTableAction(record)" :dropDownActions="getDropDownAction(record)" />
      </template>
    </BasicTable>

    <TestfromModal @register="registerModal" @success="handleSuccess" />
  </div>
</template>

<script lang="ts" name="testdomefrom-testfrom" setup>
  import { reactive } from 'vue';
  import { BasicTable, TableAction } from '/@/components/Table';
  import { useModal } from '/@/components/Modal';
  import { useListPage } from '/@/hooks/system/useListPage';
  import { getDateByPicker } from '/@/utils';
  import TestfromModal from './components/TestfromModal.vue';
  import { columns, searchFormSchema, superQuerySchema } from './Testfrom.data';
  import { batchDelete, deleteOne, getExportUrl, getImportUrl, list } from './Testfrom.api';

  const fieldPickers = reactive<Record<string, string>>({});
  const queryParam = reactive<Record<string, any>>({});

  const [registerModal, { openModal }] = useModal();

  const { tableContext, onExportXls, onImportXls } = useListPage({
    tableProps: {
      title: 'testFrom',
      api: list,
      columns,
      canResize: true,
      formConfig: {
        schemas: searchFormSchema,
        autoSubmitOnEnter: true,
        showAdvancedButton: true,
        fieldMapToNumber: [],
        fieldMapToTime: [],
      },
      actionColumn: {
        width: 120,
        fixed: 'right',
      },
      beforeFetch: (params) => {
        if (params && fieldPickers) {
          for (const key in fieldPickers) {
            if (params[key]) {
              params[key] = getDateByPicker(params[key], fieldPickers[key]);
            }
          }
        }
        return Object.assign(params, queryParam);
      },
    },
    exportConfig: {
      name: 'testFrom',
      url: getExportUrl,
      params: queryParam,
    },
    importConfig: {
      url: getImportUrl,
      success: handleSuccess,
    },
  });

  const [registerTable, { reload, clearSelectedRowKeys }, { rowSelection, selectedRowKeys }] = tableContext;
  const superQueryConfig = reactive(superQuerySchema);

  function handleSuperQuery(params) {
    Object.keys(params).forEach((key) => {
      queryParam[key] = params[key];
    });
    reload();
  }

  function handleAdd() {
    openModal(true, {
      isUpdate: false,
      showFooter: true,
    });
  }

  function handleEdit(record: Recordable) {
    openModal(true, {
      record,
      isUpdate: true,
      showFooter: true,
    });
  }

  function handleDetail(record: Recordable) {
    openModal(true, {
      record,
      isUpdate: true,
      showFooter: false,
    });
  }

  async function handleDelete(record: Recordable) {
    await deleteOne({ id: record.id }, handleSuccess);
  }

  async function batchHandleDelete() {
    await batchDelete({ ids: selectedRowKeys.value }, handleSuccess);
  }

  function handleSuccess() {
    clearSelectedRowKeys();
    reload();
  }

  function getTableAction(record: Recordable) {
    return [
      {
        label: '编辑',
        onClick: handleEdit.bind(null, record),
        auth: 'testdomefrom:testfrom:edit',
      },
    ];
  }

  function getDropDownAction(record: Recordable) {
    return [
      {
        label: '详情',
        onClick: handleDetail.bind(null, record),
      },
      {
        label: '删除',
        popConfirm: {
          title: '是否确认删除',
          confirm: handleDelete.bind(null, record),
          placement: 'topLeft',
        },
        auth: 'testdomefrom:testfrom:delete',
      },
    ];
  }
</script>

<style lang="less" scoped>
  :deep(.ant-picker),
  :deep(.ant-input-number) {
    width: 100%;
  }
</style>
