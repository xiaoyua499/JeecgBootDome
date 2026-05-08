import {BasicColumn} from '/@/components/Table';
import {FormSchema} from '/@/components/Table';
import { rules} from '/@/utils/helper/validator';
import { render } from '/@/utils/common/renderUtils';
import { getWeekMonthQuarterYear } from '/@/utils';
//列表数据
export const columns: BasicColumn[] = [
   {
    title: '模板ID（关联sys_official_template.id）',
    align:"center",
    dataIndex: 'templateId'
   },
   {
    title: '变量名',
    align:"center",
    dataIndex: 'varName'
   },
   {
    title: '占位符 {{unit_name}}',
    align:"center",
    dataIndex: 'varCode'
   },
   {
    title: '变量说明',
    align:"center",
    dataIndex: 'varDesc'
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
    label: '模板ID（关联sys_official_template.id）',
    field: 'templateId',
    component: 'Input',
    dynamicRules: ({model,schema}) => {
          return [
                 { required: true, message: '请输入模板ID（关联sys_official_template.id）!'},
          ];
     },
  },
  {
    label: '变量名',
    field: 'varName',
    component: 'Input',
    dynamicRules: ({model,schema}) => {
          return [
                 { required: true, message: '请输入变量名!'},
          ];
     },
  },
  {
    label: '占位符 {{unit_name}}',
    field: 'varCode',
    component: 'Input',
    dynamicRules: ({model,schema}) => {
          return [
                 { required: true, message: '请输入占位符 {{unit_name}}!'},
          ];
     },
  },
  {
    label: '变量说明',
    field: 'varDesc',
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
  templateId: {title: '模板ID（关联sys_official_template.id）',order: 0,view: 'text', type: 'string',},
  varName: {title: '变量名',order: 1,view: 'text', type: 'string',},
  varCode: {title: '占位符 {{unit_name}}',order: 2,view: 'text', type: 'string',},
  varDesc: {title: '变量说明',order: 3,view: 'text', type: 'string',},
  tenantId: {title: '租户ID（JeecgBoot必填，可选删除）',order: 5,view: 'text', type: 'string',},
};

/**
* 流程表单调用这个方法获取formSchema
* @param param
*/
export function getBpmFormSchema(_formData): FormSchema[]{
  // 默认和原始表单保持一致 如果流程中配置了权限数据，这里需要单独处理formSchema
  return formSchema;
}