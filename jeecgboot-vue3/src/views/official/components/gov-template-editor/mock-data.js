import { v4 as uuidv4 } from 'uuid'

/**
 * @typedef {{ id: string, name: string, type: 'text' | 'table', desc: string, content: string }} TemplateItem
 * @typedef {{ id: string, name: string, desc: string }} FieldItem
 */

const clone = (value) => JSON.parse(JSON.stringify(value))

export const createUuid = () => uuidv4()
  .replace(/-/g, '')
  .toLowerCase()

export const TABLE_TH_STYLE =
  'width:16%;white-space:nowrap;border:1px solid #344054;padding:10px 12px;vertical-align:middle;background:#f8fafc;font-weight:600;color:#101828;text-align:center;'

export const TABLE_TD_STYLE =
  'border:1px solid #344054;padding:10px 12px;vertical-align:middle;'

const createFieldMarkup = ({ id, name, desc = '', value = '' }) => `
  <span class="doc-field-wrapper" data-field-wrapper="true" style="display:inline;margin:0;padding:0;vertical-align:baseline;">
    <span
      class="doc-field-tag"
      contenteditable="false"
      data-field-id="${id}"
      data-field-name="${name}"
      data-field-desc="${desc}"
      title="${desc || name}"
      style="display:inline;margin:0;padding:0;font:inherit;color:inherit;line-height:inherit;letter-spacing:inherit;white-space:inherit;background:transparent;border:none;border-radius:0;box-shadow:none;"
    >${name}</span>
    <span
      class="doc-field-text"
      style="display:inline;min-width:0;padding:0;font:inherit;color:inherit;line-height:inherit;"
    >${value || '&nbsp;'}</span>
  </span>
`.trim()

const BUILTIN_FIELDS = [
  { id: 'f2ad2e243c144f9abf722e7503d51f01', name: '发文单位', desc: '用于填写发文单位名称' },
  { id: '7ac26dadbf254c1384ad9adf30f9ec02', name: '发文字号', desc: '用于填写发文字号' },
  { id: '31e2fb7f0bba4700883b0f9ce7265203', name: '主题事项', desc: '用于填写公告主题' },
  { id: '7e83f58e980d42d188d51e9a8d23cd04', name: '姓名', desc: '用于填写人员姓名' },
  { id: '57230cf00a504977b2b9b2e27b00f405', name: '身份证号', desc: '用于填写身份证件号码' },
  { id: 'd91c70c18d534c09b6bbb6e93586f406', name: '电话', desc: '用于填写联系电话' },
  { id: 'bfd7ef90fcb14ff292c606ff17f0f907', name: '地址', desc: '用于填写联系地址' },
  { id: '0fd5ca8430f649a9a5a5ef69a2052d08', name: '单位名称', desc: '用于填写所属单位名称' },
  { id: '1d5058247602479291c0a0dd79974809', name: '发文日期', desc: '用于填写文件签发日期' },
  { id: 'fc3afc4f45a0488b8d5de2f1fbf8ab10', name: '备注', desc: '用于填写备注信息' },
]

const getBuiltinField = (fieldName) => BUILTIN_FIELDS.find((field) => field.name === fieldName)

const createTableFieldHeader = (field) => `
  <th
    data-field-id="${field.id}"
    data-field-name="${field.name}"
    data-field-desc="${field.desc || ''}"
    style="${TABLE_TH_STYLE}"
  >${field.name}</th>
`.trim()

const createTableValueCell = (colspan = 1, value = '&nbsp;') => `
  <td${colspan > 1 ? ` colspan="${colspan}"` : ''} style="${TABLE_TD_STYLE}">${value}</td>
`.trim()

const DEFAULT_TEMPLATES = [
  {
    id: 'text-notice',
    name: '公文公告模板',
    type: 'text',
    desc: '适用于红头文件式公告、通知、通报等场景。',
    content: `
      <div class="official-document" style="max-width:860px;margin:0 auto;color:#2b2b2b;font-family:'Source Han Sans SC','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.85;">
        <div class="official-document__masthead" style="text-align:center;color:#b42318;">
          <div class="official-document__issuer" style="margin-bottom:10px;font-family:'Source Han Serif SC','Songti SC',serif;font-size:34px;font-weight:700;letter-spacing:2px;">
            ${createFieldMarkup(getBuiltinField('发文单位'))}文件
          </div>
          <div class="official-document__serial" style="margin-bottom:14px;font-size:16px;font-weight:600;">
            ${createFieldMarkup(getBuiltinField('发文字号'))}
          </div>
          <div class="official-document__divider" style="height:3px;background:linear-gradient(90deg,#b42318 0%,#d92d20 100%);margin:0 auto 24px;"></div>
        </div>
        <h1 class="official-document__title" style="margin:0 0 24px;color:#7a1c13;text-align:center;font-family:'Source Han Serif SC','Songti SC',serif;font-size:28px;line-height:1.5;font-weight:700;">
          关于在全市范围内开展 ${createFieldMarkup(getBuiltinField('主题事项'))} 的公告
        </h1>
        <p style="margin:0 0 14px;">各区县党委办公室、市直各单位：</p>
        <p style="margin:0 0 14px;">为全面掌握全市基础数据情况，进一步提升全市治理数字化、精细化水平，经研究，决定在全市范围内组织开展 ${createFieldMarkup(getBuiltinField('主题事项'))} 工作。现将有关事项公告如下。</p>
        <p style="margin:0 0 14px;">一、普查范围。按照“统一部署、全面覆盖、分级实施、准确填报”的原则，对全市机关事业单位、重点企业、重点场所及有关基础信息开展系统登记。</p>
        <p style="margin:0 0 14px;">二、时间安排。本次普查自 2018 年 3 月启动，于 2018 年 5 月底前完成信息填报、审核汇总和问题复核。</p>
        <p style="margin:0 0 14px;">三、工作要求。各单位要高度重视，明确责任部门，确保数据真实、完整、准确。对瞒报、漏报、错报等情形，将依规严肃处理。</p>
        <p style="margin:0 0 14px;">特此公告。</p>
        <p class="official-document__sign" style="margin:0 0 14px;text-align:right;">${createFieldMarkup(getBuiltinField('发文单位'))}</p>
        <p class="official-document__date" style="margin:0 0 14px;text-align:right;">${createFieldMarkup(getBuiltinField('发文日期'))}</p>
        <div class="official-document__page-number" style="margin-top:32px;color:#667085;text-align:center;letter-spacing:8px;">- 1 -</div>
      </div>
    `.trim(),
  },
  {
    id: 'table-register',
    name: '公文信息登记表',
    type: 'table',
    desc: '适用于办文信息登记、要素收集、信息留痕等场景。',
    content: `
      <div class="gov-table-template" style="color:#1f2a37;font-family:'Source Han Sans SC','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.85;">
        <h2 class="gov-table-template__title" style="margin:0 0 18px;text-align:center;font-family:'Source Han Serif SC','Songti SC',serif;color:#7a1c13;font-size:24px;line-height:1.5;">公文信息登记表</h2>
        <table class="doc-register-table" style="width:100%;border-collapse:collapse;margin:14px 0;">
          <tbody>
            <tr>
              ${createTableFieldHeader(getBuiltinField('姓名'))}
              ${createTableValueCell()}
              ${createTableFieldHeader(getBuiltinField('身份证号'))}
              ${createTableValueCell()}
            </tr>
            <tr>
              ${createTableFieldHeader({ ...getBuiltinField('电话'), name: '联系电话' })}
              ${createTableValueCell()}
              ${createTableFieldHeader(getBuiltinField('单位名称'))}
              ${createTableValueCell()}
            </tr>
            <tr>
              ${createTableFieldHeader(getBuiltinField('地址'))}
              ${createTableValueCell(3)}
            </tr>
            <tr>
              ${createTableFieldHeader(getBuiltinField('备注'))}
              ${createTableValueCell(3)}
            </tr>
          </tbody>
        </table>
        <p class="gov-table-template__tip" style="margin:0;color:#475467;font-size:13px;">提示：先将光标放入目标表格区域，再通过右键菜单或工具栏插入变量，可选择插入行或在当前行内插入变量列。</p>
      </div>
    `.trim(),
  },
]

const DEFAULT_FIELDS = BUILTIN_FIELDS

export const createDefaultTemplates = () => clone(DEFAULT_TEMPLATES)

export const createDefaultFields = () => clone(DEFAULT_FIELDS)
