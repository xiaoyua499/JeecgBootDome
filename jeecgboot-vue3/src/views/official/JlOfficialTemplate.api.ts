import { defHttp } from '/@/utils/http/axios';

enum Api {
  list = '/official/jlOfficialTemplate/list',
  queryById = '/official/jlOfficialTemplate/queryById',
  add = '/official/jlOfficialTemplate/add',
  edit = '/official/jlOfficialTemplate/edit',
  delete = '/official/jlOfficialTemplate/delete',
  changeStatus = '/official/jlOfficialTemplate/changeStatus',
  copy = '/official/jlOfficialTemplate/copy',
}

/**
 * 列表查询
 * @param params
 */
export const list = (params) => defHttp.get({ url: Api.list, params });

/**
 * 根据ID查询数据
 * @param params
 */
export const queryById = (params) => defHttp.get({ url: Api.queryById, params }, { isTransformResponse: false });

/**
 * 新增
 * @param params
 */
export const add = (params) => defHttp.post({ url: Api.add, data: params });

/**
 * 编辑
 * @param params
 */
export const edit = (params) => defHttp.put({ url: Api.edit, data: params });

/**
 * 删除
 * @param params
 */
export const deleteApi = (params) => defHttp.delete({ url: Api.delete, data: params }, { joinParamsToUrl: true });

/**
 * 改变状态
 * @param id
 * @param status
 */
export const changeStatus = (id, status) => defHttp.put({ url: Api.changeStatus, params: { id, status } });

/**
 * 复制
 * @param id
 */
export const copyTemplate = (id) => defHttp.get({ url: Api.copy, params: { id } });
