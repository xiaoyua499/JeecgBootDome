import { computed, shallowRef } from 'vue'
import tinymce from 'tinymce/tinymce'
import 'tinymce/icons/default'
import 'tinymce/models/dom/model'
import 'tinymce/themes/silver'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce/skins/ui/oxide/content.min.css'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/autoresize'
import 'tinymce/plugins/code'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/quickbars'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/table'
import 'tinymce/plugins/visualblocks'
import { TABLE_TH_STYLE, TABLE_TD_STYLE } from './mock-data'

const GOV_PLUGIN_NAME = 'gov_template_plugin'
const GOV_BRIDGE_KEY = 'gov_bridge'

const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (match) => escapeMap[match] || match)

const getFieldTagLabel = (fieldName = '') => fieldName

const buildFieldHtml = (field, markerId = '') => {
  const fieldName = escapeHtml(field?.name || '')
  const fieldDesc = escapeHtml(field?.desc || '')
  const markerAttr = markerId ? ` data-field-marker="${markerId}"` : ''

  return `
    <span class="doc-field-wrapper" data-field-wrapper="true"${markerAttr}>
      <span
        class="doc-field-tag"
        contenteditable="false"
        data-field-id="${field?.id || ''}"
        data-field-name="${fieldName}"
        data-field-desc="${fieldDesc}"
        title="${fieldDesc || fieldName}"
      >${getFieldTagLabel(fieldName)}</span>
      <span class="doc-field-text">&nbsp;</span>
    </span>
  `.trim()
}

const buildTableFieldCellsHtml = (field, markerId = '') => {
  const fieldName = escapeHtml(field?.name || '')
  const fieldDesc = escapeHtml(field?.desc || '')
  const markerAttr = markerId ? ` data-field-cell-marker="${markerId}"` : ''

  return `
    <th
      data-field-id="${field?.id || ''}"
      data-field-name="${fieldName}"
      data-field-desc="${fieldDesc}"
      style="${TABLE_TH_STYLE}"
    >${fieldName}</th>
    <td${markerAttr} style="${TABLE_TD_STYLE}">&nbsp;</td>
  `.trim()
}

const buildTableFieldRowHtml = (field, columnCount = 2, markerId = '') => {
  const fieldName = escapeHtml(field?.name || '')
  const fieldDesc = escapeHtml(field?.desc || '')
  const markerAttr = markerId ? ` data-field-row-marker="${markerId}"` : ''
  const colspan = Math.max(columnCount - 1, 1)

  return `
    <tr${markerAttr}>
      <th
        data-field-id="${field?.id || ''}"
        data-field-name="${fieldName}"
        data-field-desc="${fieldDesc}"
        style="${TABLE_TH_STYLE}"
      >${fieldName}</th>
      <td${colspan > 1 ? ` colspan="${colspan}"` : ''} style="${TABLE_TD_STYLE}">&nbsp;</td>
    </tr>
  `.trim()
}

const getSelectedTableCell = (editor) => {
  const startNode = editor?.selection?.getStart()
  if (!startNode) {
    return null
  }

  return editor.dom.getParent(startNode, 'td,th')
}

const getSelectedTableRow = (editor) => {
  const startNode = editor?.selection?.getStart()
  if (!startNode) {
    return null
  }

  return editor.dom.getParent(startNode, 'tr')
}

const isSelectionInsideTableCell = (editor) => Boolean(getSelectedTableCell(editor))

const getEditorContentStyle = () => `
  body {
    margin: 0;
    padding: 24px 28px 40px;
    color: #1f2a37;
    background: #ffffff;
    font-family: "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 14px;
    line-height: 1.85;
  }

  p {
    margin: 0 0 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
  }

  th,
  td {
    border: 1px solid #344054;
    padding: 10px 12px;
    min-width: 92px;
    vertical-align: middle;
  }

  th {
    background: #f8fafc;
    font-weight: 600;
    color: #101828;
    text-align: center;
  }

  .doc-field-wrapper {
    display: inline;
    margin: 0;
    padding: 0;
    vertical-align: baseline;
  }

  .doc-field-tag {
    display: inline;
    margin: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    white-space: inherit;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .doc-field-text {
    display: inline;
    min-width: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    line-height: inherit;
  }

  .doc-field-text:empty::after {
    content: "\\00a0";
  }
`

let hasRegisteredGovPlugin = false

const registerGovTemplatePlugin = () => {
  if (hasRegisteredGovPlugin) {
    return
  }

  tinymce.PluginManager.add(GOV_PLUGIN_NAME, (editor) => {
    const getBridge = () => editor.getParam(GOV_BRIDGE_KEY, {})

    const fieldItemSetup = (api) => {
      api.setEnabled(true)
      return () => {}
    }

    editor.ui.registry.addButton('govInsertTemplateButton', {
      text: '模板',
      tooltip: '插入模板',
      onAction: () => getBridge().onInsertTemplate?.(),
    })

    editor.ui.registry.addButton('govInsertFieldButton', {
      text: '变量',
      tooltip: '插入变量',
      onAction: () => getBridge().onInsertField?.(),
      onSetup: fieldItemSetup,
    })

    editor.ui.registry.addMenuItem('govInsertTemplateMenu', {
      text: '插入模板',
      onAction: () => getBridge().onInsertTemplate?.(),
    })

    editor.ui.registry.addMenuItem('govInsertFieldMenu', {
      text: '插入变量',
      onAction: () => getBridge().onInsertField?.(),
      onSetup: fieldItemSetup,
    })

    editor.ui.registry.addContextMenu('govTemplateActions', {
      update: () => 'govInsertTemplateMenu govInsertFieldMenu',
    })

    return {
      getMetadata: () => ({
        name: 'Gov Template Plugin',
      }),
    }
  })

  hasRegisteredGovPlugin = true
}

registerGovTemplatePlugin()

export const useTinymceEditor = ({
  disabledRef,
  onRequestTemplate,
  onRequestField,
  onSelectionChange,
  onContentChange,
}) => {
  const editorRef = shallowRef(null)
  const bookmarkRef = shallowRef(null)

  const emitSelectionState = () => {
    onSelectionChange?.({
      inTableCell: isSelectionInsideTableCell(editorRef.value),
    })
  }

  const saveSelection = () => {
    const editor = editorRef.value
    if (!editor) {
      return null
    }

    const bookmark = editor.selection.getBookmark(2, true)
    bookmarkRef.value = bookmark
    return bookmark
  }

  const restoreSelection = () => {
    const editor = editorRef.value
    if (!editor || !bookmarkRef.value) {
      return false
    }

    editor.focus()
    editor.selection.moveToBookmark(bookmarkRef.value)
    return true
  }

  const syncHtmlContent = () => {
    editorRef.value?.save?.()
    const html = editorRef.value?.getContent({ format: 'html' }) || ''
    onContentChange?.(html)
    return html
  }

  const moveCursorToBodyEnd = (editor) => {
    const body = editor?.getBody?.()
    if (!editor || !body) {
      return false
    }

    const range = editor.getDoc().createRange()
    range.selectNodeContents(body)
    range.collapse(false)
    editor.selection.setRng(range)
    return true
  }

  const moveCursorToCellEnd = (editor, cell) => {
    const range = editor.getDoc().createRange()
    range.selectNodeContents(cell)
    range.collapse(false)
    editor.selection.setRng(range)
  }

  const focusEditableFieldText = (editor, markerId) => {
    const wrapper = editor.getBody().querySelector(`[data-field-marker="${markerId}"]`)
    const textContainer = wrapper?.querySelector('.doc-field-text')

    if (!wrapper || !textContainer) {
      return
    }

    let textNode = textContainer.firstChild
    if (!textNode) {
      textNode = editor.getDoc().createTextNode('\u00a0')
      textContainer.appendChild(textNode)
    }

    const range = editor.getDoc().createRange()
    const offset = textNode.textContent?.length ?? 0
    range.setStart(textNode, offset)
    range.setEnd(textNode, offset)
    editor.selection.setRng(range)
    wrapper.removeAttribute('data-field-marker')
  }

  const focusTableRowValueCell = (editor, markerId) => {
    const row = editor.getBody().querySelector(`[data-field-row-marker="${markerId}"]`)
    const valueCell = row?.querySelector('td')

    if (!row || !valueCell) {
      return
    }

    moveCursorToCellEnd(editor, valueCell)
    row.removeAttribute('data-field-row-marker')
  }

  const focusTableCellByMarker = (editor, markerId) => {
    const cell = editor.getBody().querySelector(`[data-field-cell-marker="${markerId}"]`)

    if (!cell) {
      return
    }

    moveCursorToCellEnd(editor, cell)
    cell.removeAttribute('data-field-cell-marker')
  }

  const getTableColumnCount = (table) => {
    if (!table) {
      return 2
    }

    const rows = Array.from(table.rows || [])
    const columnCount = rows.reduce((maxCount, row) => {
      const count = Array.from(row.cells || []).reduce(
        (sum, cell) => sum + Number(cell.getAttribute('colspan') || cell.colSpan || 1),
        0,
      )
      return Math.max(maxCount, count)
    }, 0)

    return columnCount || 2
  }

  const getEffectiveRowColumnCount = (row) =>
    Array.from(row?.cells || []).reduce(
      (sum, cell) => sum + Number(cell.getAttribute('colspan') || cell.colSpan || 1),
      0,
    )

  const setCellColspan = (cell, colspan) => {
    if (!cell) {
      return
    }

    if (colspan > 1) {
      cell.setAttribute('colspan', String(colspan))
      cell.colSpan = colspan
      return
    }

    cell.removeAttribute('colspan')
    cell.colSpan = 1
  }

  const normalizeTableStructure = (table) => {
    const rows = Array.from(table?.rows || [])
    if (!rows.length) {
      return
    }

    const targetColumnCount = rows.reduce(
      (maxCount, row) => Math.max(maxCount, getEffectiveRowColumnCount(row)),
      0,
    )

    if (!targetColumnCount) {
      return
    }

    rows.forEach((row) => {
      const currentCount = getEffectiveRowColumnCount(row)
      const missingCount = targetColumnCount - currentCount

      if (missingCount <= 0) {
        return
      }

      const cells = Array.from(row.cells || [])
      const lastValueCell = [...cells].reverse().find((cell) => cell.tagName === 'TD')

      if (!lastValueCell) {
        return
      }

      const currentColspan = Number(lastValueCell.getAttribute('colspan') || lastValueCell.colSpan || 1)
      setCellColspan(lastValueCell, currentColspan + missingCount)
    })
  }

  const createRowElementFromHtml = (editor, rowHtml) => {
    const container = editor.getDoc().createElement('tbody')
    container.innerHTML = rowHtml
    return container.firstElementChild
  }

  const createCellsFromHtml = (editor, cellsHtml) => {
    const container = editor.getDoc().createElement('tr')
    container.innerHTML = cellsHtml
    return Array.from(container.children)
  }

  const insertFieldRowIntoTable = (editor, field, direction = 'below') => {
    const currentRow = getSelectedTableRow(editor)
    const currentCell = getSelectedTableCell(editor)
    const table =
      editor.dom.getParent(currentCell, 'table') || editor.getBody().querySelector('.gov-table-template table, table')

    if (!table) {
      return false
    }

    const markerId = `field-row-${Date.now()}`
    const rowHtml = buildTableFieldRowHtml(field, getTableColumnCount(table), markerId)
    const newRow = createRowElementFromHtml(editor, rowHtml)
    const rowContainer = currentRow?.parentNode || table.tBodies?.[0] || table

    if (!newRow || !rowContainer) {
      return false
    }

    if (currentRow?.parentNode === rowContainer && direction === 'above') {
      rowContainer.insertBefore(newRow, currentRow)
    } else if (currentRow?.parentNode === rowContainer && currentRow.nextSibling) {
      rowContainer.insertBefore(newRow, currentRow.nextSibling)
    } else {
      rowContainer.appendChild(newRow)
    }

    normalizeTableStructure(table)
    focusTableRowValueCell(editor, markerId)
    return true
  }

  const insertFieldColumnIntoRow = (editor, field, direction = 'right') => {
    const currentRow = getSelectedTableRow(editor)
    const currentCell = getSelectedTableCell(editor)
    const table =
      editor.dom.getParent(currentCell, 'table') || editor.getBody().querySelector('.gov-table-template table, table')

    if (!currentRow || !currentCell || !table) {
      return false
    }

    const markerId = `field-cell-${Date.now()}`
    const cells = createCellsFromHtml(editor, buildTableFieldCellsHtml(field, markerId))

    if (!cells.length) {
      return false
    }

    const pairAnchor =
      currentCell.tagName === 'TH'
        ? currentCell
        : currentCell.previousElementSibling?.tagName === 'TH'
          ? currentCell.previousElementSibling
          : currentCell

    const insertBeforeNode =
      direction === 'left'
        ? pairAnchor
        : pairAnchor.nextElementSibling?.nextElementSibling || null

    cells.forEach((cell) => {
      if (insertBeforeNode) {
        currentRow.insertBefore(cell, insertBeforeNode)
      } else {
        currentRow.appendChild(cell)
      }
    })

    normalizeTableStructure(table)
    focusTableCellByMarker(editor, markerId)
    return true
  }

  const editorInit = computed(() => ({
    language: 'zh-Hans',
    language_url: '/tinymce/langs/zh-Hans.js',
    menubar: false,
    branding: false,
    promotion: false,
    skin: false,
    content_css: false,
    readonly: disabledRef.value ? 1 : 0,
    plugins: [
      GOV_PLUGIN_NAME,
      'advlist',
      'autolink',
      'autoresize',
      'code',
      'link',
      'lists',
      'preview',
      'quickbars',
      'searchreplace',
      'table',
      'visualblocks',
    ],
    toolbar:
      'undo redo | blocks fontsize | bold italic underline forecolor | ' +
      'alignleft aligncenter alignright alignjustify | bullist numlist | ' +
      'table | govInsertTemplateButton govInsertFieldButton | visualblocks code preview',
    contextmenu: 'govTemplateActions | undo redo | table cell row column',
    toolbar_mode: 'sliding',
    min_height: 620,
    autoresize_bottom_margin: 24,
    quickbars_insert_toolbar: false,
    quickbars_selection_toolbar: 'bold italic underline | quicklink blockquote',
    table_advtab: false,
    table_default_attributes: {
      border: '1',
    },
    table_default_styles: {
      borderCollapse: 'collapse',
      width: '100%',
    },
    extended_valid_elements:
      'span[class|contenteditable|data-field-id|data-field-name|data-field-desc|data-field-wrapper|data-field-marker|title],' +
      'th[style|colspan|rowspan|width|data-field-id|data-field-name|data-field-desc],' +
      'td[style|colspan|rowspan|width|data-field-cell-marker],' +
      'tr[data-field-row-marker]',
    content_style: getEditorContentStyle(),
    gov_bridge: {
      onInsertTemplate: () => onRequestTemplate?.(),
      onInsertField: () => onRequestField?.(),
    },
    setup: (editor) => {
      editor.on('NodeChange keyup mouseup focus', () => {
        saveSelection()
        emitSelectionState()
      })
      editor.on('SetContent', emitSelectionState)
    },
  }))

  const handleInit = (_event, editor) => {
    editorRef.value = editor
    saveSelection()
    emitSelectionState()
  }

  const insertTemplate = (template) => {
    const editor = editorRef.value
    const templateHtml = typeof template === 'string' ? template : template?.content

    if (!editor || !templateHtml) {
      return false
    }

    const beforeHtml = editor.getContent({ format: 'html' })
    const restored = restoreSelection()

    if (!restored) {
      moveCursorToBodyEnd(editor)
    }

    editor.focus()
    editor.undoManager.transact(() => {
      editor.execCommand('mceInsertContent', false, templateHtml)
    })

    let afterHtml = editor.getContent({ format: 'html' })
    if (afterHtml === beforeHtml) {
      const mergedHtml = beforeHtml ? `${beforeHtml}${templateHtml}` : templateHtml
      editor.setContent(mergedHtml)
      afterHtml = editor.getContent({ format: 'html' })
    }

    saveSelection()
    onContentChange?.(afterHtml)
    emitSelectionState()
    return true
  }

  const insertField = (field, options = {}) => {
    const editor = editorRef.value
    if (!editor) {
      return {
        inserted: false,
        mode: 'inline',
      }
    }

    const insertMode = options.insertMode || 'row'
    const insertDirection =
      options.insertDirection || (insertMode === 'column' ? 'right' : 'below')

    restoreSelection()
    editor.focus()
    let insertedMode = 'inline'

    editor.undoManager.transact(() => {
      const insertedIntoTable =
        insertMode === 'column'
          ? insertFieldColumnIntoRow(editor, field, insertDirection)
          : insertFieldRowIntoTable(editor, field, insertDirection)

      if (!insertedIntoTable) {
        const markerId = `field-${Date.now()}`
        const fieldHtml = buildFieldHtml(field, markerId)

        if (!restoreSelection()) {
          moveCursorToBodyEnd(editor)
        }

        editor.insertContent(fieldHtml)
        focusEditableFieldText(editor, markerId)
      } else {
        insertedMode = insertMode
      }
    })

    saveSelection()
    syncHtmlContent()
    emitSelectionState()
    return {
      inserted: true,
      mode: insertedMode,
    }
  }

  const clearContent = () => {
    if (!editorRef.value) {
      return false
    }

    editorRef.value.setContent('')
    syncHtmlContent()
    emitSelectionState()
    return true
  }

  return {
    editorRef,
    editorInit,
    handleInit,
    getEditor: () => editorRef.value,
    getHtml: () => editorRef.value?.getContent({ format: 'html' }) || '',
    saveSelection,
    insertTemplate,
    insertField,
    clearContent,
  }
}
