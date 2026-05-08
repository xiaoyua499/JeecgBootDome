import {BasicColumn} from '/@/components/Table';
import {FormSchema} from '/@/components/Table';
import { rules} from '/@/utils/helper/validator';
import { render } from '/@/utils/common/renderUtils';
import { getWeekMonthQuarterYear } from '/@/utils';
//列表数据
export const columns: BasicColumn[] = [
   {
    title: '模板名称',
    align:"center",
    dataIndex: 'templateName'
   },
   {
    title: '模板编码（如 NOTICE001）',
    align:"center",
    dataIndex: 'templateCode'
   },
   {
    title: '公文类型：通知/请示/报告/函/决定/纪要',
    align:"center",
    dataIndex: 'docType_dictText'
   },
   {
    title: '级别：上行文/下行文/平行文',
    align:"center",
    dataIndex: 'level_dictText'
   },
   {
    title: '模板完整HTML内容（Tinymce生成）',
    align:"center",
    dataIndex: 'contentHtml'
   },
   {
    title: '备用：Word兼容富文本',
    align:"center",
    dataIndex: 'contentWord'
   },
   {
    title: '状态：0禁用 1启用',
    align:"center",
    dataIndex: 'status'
   },
   {
    title: '排序',
    align:"center",
    dataIndex: 'sortNo'
   },
   {
    title: '备注',
    align:"center",
    dataIndex: 'remark'
   },
   {
    title: '租户ID（JeecgBoot必填，可选删除）',
    align:"center",
    dataIndex: 'tenantId'
   },
];
//查询数据
export const searchFormSchema: FormSchema[] = [
];
//表单数据
export const formSchema: FormSchema[] = [
  {
    label: '模板名称',
    field: 'templateName',
    component: 'Input',
    dynamicRules: ({model,schema}) => {
          return [
                 { required: true, message: '请输入模板名称!'},
          ];
     },
  },
  {
    label: '模板编码（如 NOTICE001）',
    field: 'templateCode',
    component: 'Input',
  },
  {
    label: '公文类型：通知/请示/报告/函/决定/纪要',
    field: 'docType',
    component: 'JDictSelectTag',
    componentProps:{
        dictCode:"doc_type",
     },
  },
  {
    label: '级别：上行文/下行文/平行文',
    field: 'level',
    component: 'JDictSelectTag',
    componentProps:{
        dictCode:"doc_level",
     },
  },
  {
    label: '模板完整HTML内容（Tinymce生成）',
    field: 'contentHtml',
    component: 'InputTextArea',
  },
  {
    label: '备用：Word兼容富文本',
    field: 'contentWord',
    component: 'InputTextArea',
  },
  {
    label: '状态：0禁用 1启用',
    field: 'status',
    component: 'InputNumber',
  },
  {
    label: '排序',
    field: 'sortNo',
    component: 'InputNumber',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'Input',
  },
  {
    label: '租户ID（JeecgBoot必填，可选删除）',
    field: 'tenantId',
    component: 'Input',
  },
	// TODO 主键隐藏字段，目前写死为ID
	{
	  label: '',
	  field: 'id',
	  component: 'Input',
	  show: false
	},
];

// 高级查询数据
export const superQuerySchema = {
  templateName: {title: '模板名称',order: 0,view: 'text', type: 'string',},
  templateCode: {title: '模板编码（如 NOTICE001）',order: 1,view: 'text', type: 'string',},
  docType: {title: '公文类型：通知/请示/报告/函/决定/纪要',order: 2,view: 'list', type: 'string',dictCode: 'doc_type',},
  level: {title: '级别：上行文/下行文/平行文',order: 3,view: 'list', type: 'string',dictCode: 'doc_level',},
  contentHtml: {title: '模板完整HTML内容（Tinymce生成）',order: 4,view: 'textarea', type: 'string',},
  contentWord: {title: '备用：Word兼容富文本',order: 5,view: 'textarea', type: 'string',},
  status: {title: '状态：0禁用 1启用',order: 6,view: 'number', type: 'number',},
  sortNo: {title: '排序',order: 7,view: 'number', type: 'number',},
  remark: {title: '备注',order: 8,view: 'text', type: 'string',},
  tenantId: {title: '租户ID（JeecgBoot必填，可选删除）',order: 10,view: 'text', type: 'string',},
};

/**
* 流程表单调用这个方法获取formSchema
* @param param
*/
export function getBpmFormSchema(_formData): FormSchema[]{
  // 默认和原始表单保持一致 如果流程中配置了权限数据，这里需要单独处理formSchema
  return formSchema;
}