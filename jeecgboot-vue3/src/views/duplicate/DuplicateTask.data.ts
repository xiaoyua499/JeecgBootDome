import {BasicColumn} from '/@/components/Table';
import {FormSchema} from '/@/components/Table';

//列表数据
export const columns: BasicColumn[] = [
   {
    title: '任务名称',
    align:"center",
    dataIndex: 'taskName'
   },
   {
    title: '文件名称',
    align:"center",
    dataIndex: 'fileName'
   },
   {
    title: '文件大小',
    align:"center",
    dataIndex: 'fileSize'
   },
   {
    title: '任务状态',
    align:"center",
    dataIndex: 'status_dictText'
   },
   {
    title: '任务进度',
    align:"center",
    dataIndex: 'progress'
   },
   {
    title: '当前步骤',
    align:"center",
    dataIndex: 'currentStep_dictText'
   },
   {
    title: '备注',
    align:"center",
    dataIndex: 'remark'
   },
];
//查询数据
export const searchFormSchema: FormSchema[] = [
  {
    label: "任务名称",
    field: "taskName",
    component: 'JInput',
  },
  {
    label: "文件名称",
    field: "fileName",
    component: 'JInput',
  },
];
//表单数据
export const formSchema: FormSchema[] = [
  {
    label: '任务名称',
    field: 'taskName',
    component: 'Input',
    dynamicRules: () => {
          return [
                 { required: true, message: '请输入任务名称!'},
          ];
     },
  },
  {
    label: '文件名称',
    field: 'fileName',
    component: 'Input',
    dynamicRules: () => {
          return [
                 { required: true, message: '请输入文件名称!'},
          ];
     },
  },
  {
    label: '是否立即查重',
    field: 'checkNow',
    defaultValue: "Y",
     component: 'JSwitch',
     componentProps:{
     },
    dynamicRules: () => {
          return [
                 { required: true, message: '请输入是否立即查重!'},
          ];
     },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
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
  taskName: {title: '任务名称',order: 0,view: 'text', type: 'string',},
  fileName: {title: '文件名称',order: 1,view: 'text', type: 'string',},
  fileSize: {title: '文件大小',order: 2,view: 'number', type: 'number',},
  status: {title: '任务状态',order: 4,view: 'list', type: 'string',dictCode: 'duplicate_task_status',},
  progress: {title: '任务进度',order: 5,view: 'number', type: 'number',},
  currentStep: {title: '当前步骤',order: 6,view: 'list', type: 'string',dictCode: 'duplicate_current_step',},
  remark: {title: '备注',order: 7,view: 'textarea', type: 'string',},
};

/**
* 流程表单调用这个方法获取formSchema
* 目前查重任务 demo 未按流程变量动态拆分字段权限，直接返回基础表单配置即可。
*/
export function getBpmFormSchema(): FormSchema[]{
  // 默认和原始表单保持一致 如果流程中配置了权限数据，这里需要单独处理formSchema
  return formSchema;
}
