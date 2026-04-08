import type { BasicColumn, FormSchema } from '/@/components/Table';

export const columns: BasicColumn[] = [
  {
    title: '姓名',
    align: 'center',
    dataIndex: 'name',
  },
  {
    title: '性别',
    align: 'center',
    dataIndex: 'sex',
  },
];

export const searchFormSchema: FormSchema[] = [];

export const formSchema: FormSchema[] = [
  {
    label: '姓名',
    field: 'name',
    component: 'Input',
  },
  {
    label: '性别',
    field: 'sex',
    component: 'Input',
  },
  {
    label: '',
    field: 'id',
    component: 'Input',
    show: false,
  },
];

export const superQuerySchema = {
  name: { title: '姓名', order: 0, view: 'text', type: 'string' },
  sex: { title: '性别', order: 1, view: 'text', type: 'string' },
};

export function getBpmFormSchema(_formData): FormSchema[] {
  return formSchema;
}
