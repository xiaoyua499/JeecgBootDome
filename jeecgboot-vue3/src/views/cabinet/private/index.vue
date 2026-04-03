<template>
  <div class="private-cabinet">
    <div class="cabinet-toolbar">
      <a-space>
        <a-button type="primary" @click="handleCreateFolder">新建文件夹</a-button>
        <a-button @click="handleUpload">上传</a-button>
        <a-button danger :disabled="selectedItemIds.length === 0" @click="handleDelete">删除</a-button>
        <a-button @click="handleRefresh">刷新</a-button>
        <a-input-search
          v-model:value="searchKeyword"
          allow-clear
          class="toolbar-search"
          placeholder="搜索当前目录文件/文件夹"
          @search="handleSearch"
        />
        <a-dropdown :trigger="['click']" placement="bottomLeft" overlay-class-name="sort-dropdown-overlay">
          <a-button class="sort-trigger">
            排序：{{ sortFieldLabel }} / {{ sortOrderLabel }}<span class="sort-trigger-divider">|</span>分组：{{ groupFieldLabel }}
          </a-button>
          <template #overlay>
            <a-menu class="sort-menu">
              <a-menu-item @click="handleSortFieldChange('manual')">
                <span class="sort-dot" :class="{ active: sortField === 'manual' }"></span>
                手动排序
              </a-menu-item>
              <a-menu-item @click="handleSortFieldChange('name')">
                <span class="sort-dot" :class="{ active: sortField === 'name' }"></span>
                名称
              </a-menu-item>
              <a-menu-item @click="handleSortFieldChange('updateTime')">
                <span class="sort-dot" :class="{ active: sortField === 'updateTime' }"></span>
                修改日期
              </a-menu-item>
              <a-menu-item @click="handleSortFieldChange('ext')">
                <span class="sort-dot" :class="{ active: sortField === 'ext' }"></span>
                类型
              </a-menu-item>
              <a-sub-menu key="more">
                <template #title>
                  <div class="sort-submenu-title">
                    <span class="sort-dot" :class="{ active: sortField === 'size' }"></span>
                    更多
                  </div>
                </template>
                <a-menu-item @click="handleSortFieldChange('size')">大小</a-menu-item>
              </a-sub-menu>
              <a-menu-divider />
              <a-menu-item @click="handleSortOrderChange('asc')">
                <span class="sort-dot" :class="{ active: sortOrder === 'asc' }"></span>
                递增
              </a-menu-item>
              <a-menu-item @click="handleSortOrderChange('desc')">
                <span class="sort-dot" :class="{ active: sortOrder === 'desc' }"></span>
                递减
              </a-menu-item>
              <a-menu-divider />
              <a-sub-menu key="groupBy">
                <template #title>
                  <div class="sort-submenu-title">
                    <span class="sort-dot" :class="{ active: groupField !== 'none' }"></span>
                    分组依据
                  </div>
                </template>
                <a-menu-item @click="handleGroupFieldChange('none')">无</a-menu-item>
                <a-menu-item @click="handleGroupFieldChange('name')">名称</a-menu-item>
                <a-menu-item @click="handleGroupFieldChange('updateTime')">修改日期</a-menu-item>
                <a-menu-item @click="handleGroupFieldChange('type')">类型</a-menu-item>
                <a-menu-item @click="handleGroupFieldChange('size')">大小</a-menu-item>
              </a-sub-menu>
            </a-menu>
          </template>
        </a-dropdown>
      </a-space>
      <a-space>
        <a-radio-group v-if="viewMode === 'grid'" v-model:value="gridIconSize" size="small">
          <a-radio-button value="large">大图标</a-radio-button>
          <a-radio-button value="small">小图标</a-radio-button>
        </a-radio-group>
        <a-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="viewMode = 'grid'">
          图标视图
        </a-button>
        <a-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
          列表视图
        </a-button>
      </a-space>
    </div>

    <div class="cabinet-main">
      <div class="cabinet-tree">
        <a-tree
          :tree-data="treeData"
          :selected-keys="selectedTreeKeys"
          block-node
          @select="handleTreeSelect"
        />
      </div>

      <div
        ref="filePanelRef"
        class="cabinet-files"
        @click="hideContextMenu"
        @contextmenu.prevent="handleBlankContextMenu"
      >
        <div class="cabinet-path">
          <a-breadcrumb>
            <a-breadcrumb-item
              v-for="crumb in breadcrumbItems"
              :key="crumb.id"
              @click="enterFolderById(crumb.id)"
            >
              {{ crumb.name }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div
          v-if="viewMode === 'grid'"
          ref="gridPanelRef"
          class="grid-panel"
          @mousedown="handleGridBlankMouseDown"
        >
          <template v-for="group in groupedSections" :key="group.key">
            <div v-if="group.title" class="file-group-title">{{ group.title }}</div>
            <Draggable
              class="file-grid"
              :class="[`size-${gridIconSize}`, { 'sortable-disabled': sortField !== 'manual' }]"
              :model-value="group.items"
              item-key="id"
              :disabled="sortField !== 'manual'"
              ghost-class="file-drag-ghost"
              chosen-class="file-drag-chosen"
              drag-class="file-drag-active"
              :animation="180"
              @update:modelValue="handleGridOrderChange(group, $event)"
            >
              <template #item="{ element }">
                <FileItem
                  :data-file-id="element.id"
                  :name="element.name"
                  :icon-type="resolveIconType(element)"
                  :size="gridIconSize"
                  :selected="selectedIdSet.has(element.id)"
                  @click="handleItemClick(element, $event)"
                  @dblclick="handleOpen(element)"
                  @contextmenu="handleItemContextMenu(element, $event)"
                />
              </template>
            </Draggable>
          </template>

          <div
            v-if="selectionBox.visible"
            class="selection-marquee"
            :style="{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
            }"
          ></div>
        </div>

        <a-table
          v-else-if="groupField === 'none'"
          class="file-table"
          :columns="tableColumns"
          :data-source="sortedFilteredFolderItems"
          :pagination="false"
          :row-key="(record: CabinetItem) => record.id"
          :custom-row="buildTableRowEvent"
          :row-class-name="buildTableRowClass"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="table-name-cell">
                <span class="table-icon" :class="`icon-${resolveIconType(record)}`"></span>
                <span>{{ record.name }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'size'">
              {{ record.type === 'folder' ? '-' : record.size }}
            </template>
          </template>
        </a-table>

        <div v-else class="grouped-table">
          <div class="grouped-table-header">
            <div class="col-name">名称</div>
            <div class="col-create-date">创建日期</div>
            <div class="col-update-date">修改日期</div>
            <div class="col-type">类型</div>
            <div class="col-size">大小</div>
          </div>
          <div class="grouped-table-body">
            <div v-for="group in groupedSections" :key="group.key" class="grouped-table-section">
              <div class="grouped-table-group-title">
                <span class="grouped-table-group-arrow">⌄</span>
                <span>{{ group.title }}</span>
              </div>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="grouped-table-row"
                :class="{ selected: selectedIdSet.has(item.id) }"
                @click="handleItemClick(item, $event)"
                @dblclick="handleOpen(item)"
                @contextmenu.prevent="handleItemContextMenu(item, $event)"
              >
                <div class="grouped-cell col-name">
                  <span class="table-icon" :class="`icon-${resolveIconType(item)}`"></span>
                  <span class="grouped-file-name">{{ item.name }}</span>
                </div>
                <div class="grouped-cell col-create-date">{{ item.createTime }}</div>
                <div class="grouped-cell col-update-date">{{ item.updateTime }}</div>
                <div class="grouped-cell col-type">{{ resolveTypeLabel(item) }}</div>
                <div class="grouped-cell col-size">{{ item.type === 'folder' ? '-' : item.size }}</div>
              </div>
            </div>
          </div>
        </div>

        <ul
          v-if="contextMenu.visible && contextMenu.mode === 'item'"
          class="context-menu"
          :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
          @click.stop
        >
          <li @click="handleOpenMenuAction">打开</li>
          <li @click="handleRename">重命名</li>
          <li @click="handleDelete">删除</li>
          <li @click="handleViewProperty">属性</li>
        </ul>

        <ul
          v-if="contextMenu.visible && contextMenu.mode === 'blank'"
          class="context-menu context-menu-blank"
          :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
          @click.stop
        >
          <li @click="handleCreateFolder">新建文件夹</li>
          <li @click="handleUpload">上传</li>
          <li @click="handleRefresh">刷新</li>
          <li class="with-children">
            <span>排序方式</span>
            <span class="submenu-arrow">›</span>
            <ul class="context-submenu">
              <li @click="handleSortFieldChange('manual')">
                <span class="sort-dot" :class="{ active: sortField === 'manual' }"></span>
                手动排序
              </li>
              <li @click="handleSortFieldChange('name')">
                <span class="sort-dot" :class="{ active: sortField === 'name' }"></span>
                名称
              </li>
              <li @click="handleSortFieldChange('updateTime')">
                <span class="sort-dot" :class="{ active: sortField === 'updateTime' }"></span>
                修改日期
              </li>
              <li @click="handleSortFieldChange('ext')">
                <span class="sort-dot" :class="{ active: sortField === 'ext' }"></span>
                类型
              </li>
              <li @click="handleSortFieldChange('size')">
                <span class="sort-dot" :class="{ active: sortField === 'size' }"></span>
                大小
              </li>
              <li class="divider"></li>
              <li @click="handleSortOrderChange('asc')">
                <span class="sort-dot" :class="{ active: sortOrder === 'asc' }"></span>
                递增
              </li>
              <li @click="handleSortOrderChange('desc')">
                <span class="sort-dot" :class="{ active: sortOrder === 'desc' }"></span>
                递减
              </li>
            </ul>
          </li>
          <li class="with-children">
            <span>分组方式</span>
            <span class="submenu-arrow">›</span>
            <ul class="context-submenu">
              <li @click="handleGroupFieldChange('none')">
                <span class="sort-dot" :class="{ active: groupField === 'none' }"></span>
                无
              </li>
              <li @click="handleGroupFieldChange('name')">
                <span class="sort-dot" :class="{ active: groupField === 'name' }"></span>
                名称
              </li>
              <li @click="handleGroupFieldChange('updateTime')">
                <span class="sort-dot" :class="{ active: groupField === 'updateTime' }"></span>
                修改日期
              </li>
              <li @click="handleGroupFieldChange('type')">
                <span class="sort-dot" :class="{ active: groupField === 'type' }"></span>
                类型
              </li>
              <li @click="handleGroupFieldChange('size')">
                <span class="sort-dot" :class="{ active: groupField === 'size' }"></span>
                大小
              </li>
            </ul>
          </li>
          <li class="with-children">
            <span>视图模式</span>
            <span class="submenu-arrow">›</span>
            <ul class="context-submenu">
              <li @click="handleViewModeChange('grid')">
                <span class="sort-dot" :class="{ active: viewMode === 'grid' }"></span>
                图标视图
              </li>
              <li @click="handleViewModeChange('table')">
                <span class="sort-dot" :class="{ active: viewMode === 'table' }"></span>
                列表视图
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <a-modal v-model:open="propertyModalVisible" title="属性" :footer="null" width="420px">
      <div v-if="propertyItem" class="property-content">
        <div><span>名称：</span>{{ propertyItem.name }}</div>
        <div><span>类型：</span>{{ propertyItem.type === 'folder' ? '文件夹' : `文件(${propertyItem.ext})` }}</div>
        <div><span>大小：</span>{{ propertyItem.type === 'folder' ? '-' : propertyItem.size }}</div>
        <div><span>创建时间：</span>{{ propertyItem.createTime }}</div>
        <div><span>修改时间：</span>{{ propertyItem.updateTime }}</div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { DataNode } from 'ant-design-vue/es/tree';
import { message } from 'ant-design-vue';
import Draggable from 'vuedraggable';
import FileItem from './components/FileItem.vue';

type ItemType = 'folder' | 'file';
type ViewMode = 'grid' | 'table';
type GridIconSize = 'large' | 'small';
type SortField = 'manual' | 'name' | 'updateTime' | 'ext' | 'size';
type SortOrder = 'asc' | 'desc';
type GroupField = 'none' | 'name' | 'updateTime' | 'type' | 'size';

interface CabinetItem {
  id: string;
  name: string;
  type: ItemType;
  size: string;
  createTime: string;
  updateTime: string;
  ext: string;
  orderNo: number;
  parentId: string | null;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface GroupSection {
  key: string;
  title: string;
  items: CabinetItem[];
}

const itemList = ref<CabinetItem[]>([
  { id: 'root', name: '私柜', type: 'folder', size: '-', createTime: '2026-03-25 09:00', updateTime: '2026-04-03 08:00', ext: 'folder', orderNo: 0, parentId: null },
  { id: 'f-doc', name: '文档中心', type: 'folder', size: '-', createTime: '2026-03-26 10:00', updateTime: '2026-04-03 08:10', ext: 'folder', orderNo: 10, parentId: 'root' },
  { id: 'f-media', name: '媒体素材', type: 'folder', size: '-', createTime: '2026-03-26 10:30', updateTime: '2026-04-03 08:12', ext: 'folder', orderNo: 20, parentId: 'root' },
  { id: 'f-archive', name: '归档资料', type: 'folder', size: '-', createTime: '2026-03-27 11:10', updateTime: '2026-04-03 08:14', ext: 'folder', orderNo: 30, parentId: 'root' },
  { id: 'f-contract', name: '合同', type: 'folder', size: '-', createTime: '2026-03-27 13:20', updateTime: '2026-04-03 08:20', ext: 'folder', orderNo: 10, parentId: 'f-doc' },
  { id: 'f-report', name: '周报', type: 'folder', size: '-', createTime: '2026-03-27 16:00', updateTime: '2026-04-03 08:25', ext: 'folder', orderNo: 20, parentId: 'f-doc' },
  { id: 'f-photo', name: '图片', type: 'folder', size: '-', createTime: '2026-03-28 09:15', updateTime: '2026-04-03 08:26', ext: 'folder', orderNo: 10, parentId: 'f-media' },
  { id: 'f-video', name: '视频', type: 'folder', size: '-', createTime: '2026-03-28 09:30', updateTime: '2026-04-03 08:28', ext: 'folder', orderNo: 20, parentId: 'f-media' },
  { id: 'file-1', name: '项目规划.pdf', type: 'file', size: '2.4 MB', createTime: '2026-03-29 14:10', updateTime: '2026-04-01 11:20', ext: 'pdf', orderNo: 40, parentId: 'root' },
  { id: 'file-2', name: '制度说明.docx', type: 'file', size: '860 KB', createTime: '2026-03-29 09:20', updateTime: '2026-03-30 16:05', ext: 'doc', orderNo: 30, parentId: 'f-doc' },
  { id: 'file-3', name: '采购合同.pdf', type: 'file', size: '1.8 MB', createTime: '2026-03-30 08:30', updateTime: '2026-03-31 09:18', ext: 'pdf', orderNo: 10, parentId: 'f-contract' },
  { id: 'file-4', name: '第14周汇报.xlsx', type: 'file', size: '520 KB', createTime: '2026-04-01 17:05', updateTime: '2026-04-02 18:46', ext: 'xls', orderNo: 10, parentId: 'f-report' },
  { id: 'file-5', name: '宣传图.jpg', type: 'file', size: '5.1 MB', createTime: '2026-03-25 15:18', updateTime: '2026-03-26 10:30', ext: 'jpg', orderNo: 10, parentId: 'f-photo' },
  { id: 'file-6', name: '活动海报.png', type: 'file', size: '3.8 MB', createTime: '2026-03-26 13:40', updateTime: '2026-03-27 15:02', ext: 'png', orderNo: 20, parentId: 'f-photo' },
  { id: 'file-7', name: '发布会.mp4', type: 'file', size: '128 MB', createTime: '2026-03-28 18:20', updateTime: '2026-03-29 21:11', ext: 'mp4', orderNo: 10, parentId: 'f-video' },
  { id: 'file-8', name: '备份包.zip', type: 'file', size: '65 MB', createTime: '2026-03-27 11:42', updateTime: '2026-03-28 12:18', ext: 'zip', orderNo: 10, parentId: 'f-archive' },
  { id: 'file-9', name: 'readme.txt', type: 'file', size: '4 KB', createTime: '2026-03-31 08:12', updateTime: '2026-04-01 08:40', ext: 'txt', orderNo: 50, parentId: 'root' },
]);

const viewMode = ref<ViewMode>('grid');
const gridIconSize = ref<GridIconSize>('large');
const searchKeyword = ref('');
const sortField = ref<SortField>('manual');
const sortOrder = ref<SortOrder>('asc');
const groupField = ref<GroupField>('type');
const currentFolderId = ref('root');
const selectedItemIds = ref<string[]>([]);
const selectedTreeKeys = ref<string[]>(['root']);
const filePanelRef = ref<HTMLElement | null>(null);
const gridPanelRef = ref<HTMLElement | null>(null);
const propertyModalVisible = ref(false);
const propertyItem = ref<CabinetItem | null>(null);

const selectionBox = ref({
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  startX: 0,
  startY: 0,
  appendMode: false,
});

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  mode: 'item' as 'item' | 'blank',
  targetId: '',
});

const tableColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '修改时间', dataIndex: 'updateTime', key: 'updateTime', width: 180 },
  { title: '大小', dataIndex: 'size', key: 'size', width: 140 },
  { title: '类型', dataIndex: 'ext', key: 'ext', width: 120 },
];

const folderMap = computed(() => {
  const map = new Map<string, CabinetItem>();
  itemList.value.forEach((item) => {
    if (item.type === 'folder') {
      map.set(item.id, item);
    }
  });
  return map;
});

const currentFolderItems = computed(() =>
  itemList.value.filter((item) => item.parentId === currentFolderId.value),
);

const filteredFolderItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return currentFolderItems.value;
  }
  return currentFolderItems.value.filter((item) => {
    const nameMatched = item.name.toLowerCase().includes(keyword);
    const extMatched = item.ext.toLowerCase().includes(keyword);
    return nameMatched || extMatched;
  });
});

const parseSizeToBytes = (sizeText: string) => {
  if (!sizeText || sizeText === '-') {
    return 0;
  }
  const matched = sizeText.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!matched) {
    return 0;
  }
  const sizeValue = Number(matched[1]);
  const unit = matched[2].toUpperCase();
  const unitMap: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return sizeValue * (unitMap[unit] || 1);
};

const sortedFilteredFolderItems = computed(() => {
  const items = [...filteredFolderItems.value];
  if (sortField.value === 'manual') {
    return items.sort((left, right) => {
      if (left.orderNo === right.orderNo) {
        return left.name.localeCompare(right.name, 'zh-CN');
      }
      return left.orderNo - right.orderNo;
    });
  }
  const factor = sortOrder.value === 'asc' ? 1 : -1;
  return items.sort((left, right) => {
    let compareResult = 0;
    if (sortField.value === 'name') {
      compareResult = left.name.localeCompare(right.name, 'zh-CN');
    } else if (sortField.value === 'updateTime') {
      compareResult =
        new Date(left.updateTime).getTime() - new Date(right.updateTime).getTime();
    } else if (sortField.value === 'ext') {
      compareResult = left.ext.localeCompare(right.ext, 'zh-CN');
      if (compareResult === 0) {
        compareResult = left.name.localeCompare(right.name, 'zh-CN');
      }
    } else if (sortField.value === 'size') {
      compareResult = parseSizeToBytes(left.size) - parseSizeToBytes(right.size);
      if (compareResult === 0) {
        compareResult = left.name.localeCompare(right.name, 'zh-CN');
      }
    }
    return compareResult * factor;
  });
});

const selectedIdSet = computed(() => new Set(selectedItemIds.value));

const sortFieldLabel = computed(() => {
  const labelMap: Record<SortField, string> = {
    manual: '手动排序',
    name: '名称',
    updateTime: '修改日期',
    ext: '类型',
    size: '大小',
  };
  return labelMap[sortField.value];
});

const sortOrderLabel = computed(() => (sortOrder.value === 'asc' ? '递增' : '递减'));

const groupFieldLabel = computed(() => {
  const labelMap: Record<GroupField, string> = {
    none: '无',
    name: '名称',
    updateTime: '修改日期',
    type: '类型',
    size: '大小',
  };
  return labelMap[groupField.value];
});

const resolveNameGroupTitle = (name: string) => {
  const normalized = name.trim();
  if (!normalized) {
    return '#';
  }
  const firstChar = normalized.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
};

const resolveGroupTitle = (item: CabinetItem) => {
  if (groupField.value === 'none') {
    return '';
  }
  if (groupField.value === 'type') {
    return item.type === 'folder' ? '文件夹' : '文件';
  }
  if (groupField.value === 'name') {
    return resolveNameGroupTitle(item.name);
  }
  if (groupField.value === 'updateTime') {
    return item.updateTime.split(' ')[0] || '未知日期';
  }
  if (groupField.value === 'size') {
    if (item.type === 'folder') {
      return '文件夹';
    }
    const size = parseSizeToBytes(item.size);
    if (size < 1024 * 1024) {
      return '1 MB 以下';
    }
    if (size < 10 * 1024 * 1024) {
      return '1 MB - 10 MB';
    }
    return '10 MB 以上';
  }
  return '';
};

const groupedSections = computed<GroupSection[]>(() => {
  if (groupField.value === 'none') {
    return [
      {
        key: 'all',
        title: '',
        items: sortedFilteredFolderItems.value,
      },
    ];
  }

  const sectionMap = new Map<string, GroupSection>();
  sortedFilteredFolderItems.value.forEach((item) => {
    const title = resolveGroupTitle(item);
    if (!sectionMap.has(title)) {
      sectionMap.set(title, {
        key: title || 'default',
        title,
        items: [],
      });
    }
    sectionMap.get(title)?.items.push(item);
  });

  const sections = Array.from(sectionMap.values());
  if (groupField.value === 'type') {
    const typeOrder: Record<string, number> = { 文件夹: 1, 文件: 2 };
    return sections.sort((left, right) => (typeOrder[left.title] || 99) - (typeOrder[right.title] || 99));
  }
  if (groupField.value === 'size') {
    const sizeOrder: Record<string, number> = { 文件夹: 1, '1 MB 以下': 2, '1 MB - 10 MB': 3, '10 MB 以上': 4 };
    return sections.sort((left, right) => (sizeOrder[left.title] || 99) - (sizeOrder[right.title] || 99));
  }
  if (groupField.value === 'updateTime') {
    return sections.sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'));
  }
  if (groupField.value === 'name') {
    return sections.sort((left, right) => {
      if (left.title === '#') {
        return 1;
      }
      if (right.title === '#') {
        return -1;
      }
      return left.title.localeCompare(right.title, 'en-US');
    });
  }
  return sections;
});

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const result: BreadcrumbItem[] = [];
  let cursorId: string | null = currentFolderId.value;
  while (cursorId) {
    const folder = folderMap.value.get(cursorId);
    if (!folder) {
      break;
    }
    result.unshift({ id: folder.id, name: folder.name });
    cursorId = folder.parentId;
  }
  return result;
});

const treeData = computed<DataNode[]>(() => {
  const buildNodes = (parentId: string | null): DataNode[] => {
    return itemList.value
      .filter((item) => item.type === 'folder' && item.parentId === parentId)
      .map((folder) => ({
        key: folder.id,
        title: folder.name,
        children: buildNodes(folder.id),
      }));
  };
  return buildNodes(null);
});

const resolveIconType = (item: CabinetItem) => {
  if (item.type === 'folder') {
    return 'folder';
  }
  if (['jpg', 'jpeg', 'png', 'gif'].includes(item.ext)) {
    return 'image';
  }
  if (['mp4', 'avi', 'mov'].includes(item.ext)) {
    return 'video';
  }
  if (item.ext === 'pdf') {
    return 'pdf';
  }
  if (['zip', 'rar', '7z'].includes(item.ext)) {
    return 'zip';
  }
  if (['doc', 'docx'].includes(item.ext)) {
    return 'doc';
  }
  if (['xls', 'xlsx'].includes(item.ext)) {
    return 'xls';
  }
  return 'file';
};

const resolveTypeLabel = (item: CabinetItem) => {
  if (item.type === 'folder') {
    return '文件夹';
  }
  return `${item.ext.toUpperCase()} 文件`;
};

const clearSelection = () => {
  selectedItemIds.value = [];
};

const enterFolderById = (folderId: string) => {
  if (!folderMap.value.has(folderId)) {
    return;
  }
  currentFolderId.value = folderId;
  searchKeyword.value = '';
  selectedTreeKeys.value = [folderId];
  clearSelection();
  hideContextMenu();
};

const handleTreeSelect = (keys: Array<string | number>) => {
  if (!keys.length) {
    return;
  }
  enterFolderById(String(keys[0]));
};

const handleItemClick = (item: CabinetItem, event: MouseEvent) => {
  const append = event.ctrlKey || event.metaKey;
  if (append) {
    if (selectedIdSet.value.has(item.id)) {
      selectedItemIds.value = selectedItemIds.value.filter((id) => id !== item.id);
    } else {
      selectedItemIds.value = [...selectedItemIds.value, item.id];
    }
  } else {
    selectedItemIds.value = [item.id];
  }
  hideContextMenu();
};

const handleOpen = (item: CabinetItem) => {
  if (item.type === 'folder') {
    enterFolderById(item.id);
    return;
  }
  message.info(`打开文件：${item.name}`);
};

const handleSearch = () => {
  hideContextMenu();
  clearSelection();
};

const handleSortFieldChange = (field: SortField) => {
  sortField.value = field;
  hideContextMenu();
  clearSelection();
};

const handleSortOrderChange = (order: SortOrder) => {
  sortOrder.value = order;
  hideContextMenu();
  clearSelection();
};

const handleGroupFieldChange = (field: GroupField) => {
  groupField.value = field;
  hideContextMenu();
  clearSelection();
};

const handleViewModeChange = (mode: ViewMode) => {
  viewMode.value = mode;
  hideContextMenu();
};

const handleGridOrderChange = (group: GroupSection, nextItems: CabinetItem[]) => {
  if (!nextItems.length) {
    return;
  }
  const step = 10;
  nextItems.forEach((item, index) => {
    const currentItem = itemList.value.find((current) => current.id === item.id);
    if (currentItem) {
      currentItem.orderNo = (index + 1) * step;
    }
  });
  if (groupField.value !== 'none') {
    const otherItems = itemList.value
      .filter((item) => {
        if (item.parentId !== currentFolderId.value) {
          return false;
        }
        return resolveGroupTitle(item) !== group.key;
      })
      .sort((left, right) => left.orderNo - right.orderNo);
    otherItems.forEach((item, index) => {
      const currentItem = itemList.value.find((current) => current.id === item.id);
      if (currentItem) {
        currentItem.orderNo = 1000 + index * step;
      }
    });
  }
};

const handleItemContextMenu = (item: CabinetItem, event: MouseEvent) => {
  event.stopPropagation();
  if (!selectedIdSet.value.has(item.id)) {
    selectedItemIds.value = [item.id];
  }
  showContextMenu(event, 'item', item.id);
};

const handleBlankContextMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    target.closest('.file-item') ||
    target.closest('.grouped-table-row') ||
    target.closest('.ant-table-row')
  ) {
    return;
  }
  clearSelection();
  showContextMenu(event, 'blank');
};

let marqueeBaseSelection: string[] = [];

const updateMarqueeSelection = (event: MouseEvent) => {
  if (!selectionBox.value.visible || !gridPanelRef.value) {
    return;
  }
  const panel = gridPanelRef.value;
  const rect = panel.getBoundingClientRect();
  const currentX = event.clientX - rect.left + panel.scrollLeft;
  const currentY = event.clientY - rect.top + panel.scrollTop;
  const left = Math.min(selectionBox.value.startX, currentX);
  const top = Math.min(selectionBox.value.startY, currentY);
  const width = Math.abs(currentX - selectionBox.value.startX);
  const height = Math.abs(currentY - selectionBox.value.startY);

  selectionBox.value.left = left;
  selectionBox.value.top = top;
  selectionBox.value.width = width;
  selectionBox.value.height = height;

  const hitIds: string[] = [];
  const itemNodes = panel.querySelectorAll<HTMLElement>('.file-item[data-file-id]');
  itemNodes.forEach((node) => {
    const fileId = node.dataset.fileId;
    if (!fileId) {
      return;
    }
    const nodeRect = node.getBoundingClientRect();
    const nodeLeft = nodeRect.left - rect.left + panel.scrollLeft;
    const nodeTop = nodeRect.top - rect.top + panel.scrollTop;
    const nodeRight = nodeLeft + nodeRect.width;
    const nodeBottom = nodeTop + nodeRect.height;

    const isIntersect =
      nodeLeft < left + width &&
      nodeRight > left &&
      nodeTop < top + height &&
      nodeBottom > top;

    if (isIntersect) {
      hitIds.push(fileId);
    }
  });

  if (selectionBox.value.appendMode) {
    selectedItemIds.value = Array.from(new Set([...marqueeBaseSelection, ...hitIds]));
  } else {
    selectedItemIds.value = hitIds;
  }
};

const handleMarqueeMouseMove = (event: MouseEvent) => {
  updateMarqueeSelection(event);
};

const handleMarqueeMouseUp = () => {
  selectionBox.value.visible = false;
  selectionBox.value.width = 0;
  selectionBox.value.height = 0;
  window.removeEventListener('mousemove', handleMarqueeMouseMove);
  window.removeEventListener('mouseup', handleMarqueeMouseUp);
};

const handleGridBlankMouseDown = (event: MouseEvent) => {
  if (event.button !== 0 || !gridPanelRef.value) {
    return;
  }
  const target = event.target as HTMLElement;
  if (target.closest('.file-item')) {
    return;
  }
  hideContextMenu();

  const panel = gridPanelRef.value;
  const rect = panel.getBoundingClientRect();
  const startX = event.clientX - rect.left + panel.scrollLeft;
  const startY = event.clientY - rect.top + panel.scrollTop;
  const appendMode = event.ctrlKey || event.metaKey;

  marqueeBaseSelection = appendMode ? [...selectedItemIds.value] : [];
  if (!appendMode) {
    clearSelection();
  }

  selectionBox.value.visible = true;
  selectionBox.value.left = startX;
  selectionBox.value.top = startY;
  selectionBox.value.startX = startX;
  selectionBox.value.startY = startY;
  selectionBox.value.width = 0;
  selectionBox.value.height = 0;
  selectionBox.value.appendMode = appendMode;

  window.addEventListener('mousemove', handleMarqueeMouseMove);
  window.addEventListener('mouseup', handleMarqueeMouseUp);
};

const handleOpenMenuAction = () => {
  const target = itemList.value.find((item) => item.id === contextMenu.value.targetId);
  if (!target) {
    hideContextMenu();
    return;
  }
  handleOpen(target);
  hideContextMenu();
};

const collectDeleteIds = (targetId: string): string[] => {
  const result = [targetId];
  const stack = [targetId];
  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    itemList.value.forEach((item) => {
      if (item.parentId === current) {
        result.push(item.id);
        if (item.type === 'folder') {
          stack.push(item.id);
        }
      }
    });
  }
  return result;
};

const getActionTargetIds = () => {
  if (contextMenu.value.targetId) {
    if (selectedIdSet.value.has(contextMenu.value.targetId)) {
      return [...selectedItemIds.value];
    }
    return [contextMenu.value.targetId];
  }
  return [...selectedItemIds.value];
};

const handleDelete = () => {
  const targetIds = getActionTargetIds().filter((id) => id !== 'root');
  if (!targetIds.length) {
    hideContextMenu();
    return;
  }
  const removeIdSet = new Set<string>();
  targetIds.forEach((id) => {
    collectDeleteIds(id).forEach((removeId) => removeIdSet.add(removeId));
  });
  itemList.value = itemList.value.filter((item) => !removeIdSet.has(item.id));
  clearSelection();
  hideContextMenu();
  message.success('已删除');
};

const handleRename = () => {
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  const target = itemList.value.find((item) => item.id === targetId);
  if (!target) {
    hideContextMenu();
    return;
  }
  const nextName = window.prompt('请输入新的名称', target.name);
  if (!nextName) {
    hideContextMenu();
    return;
  }
  const normalized = nextName.trim();
  if (!normalized) {
    message.warning('名称不能为空');
    hideContextMenu();
    return;
  }
  target.name = normalized;
  message.success('重命名成功');
  hideContextMenu();
};

const handleViewProperty = () => {
  const targetId = contextMenu.value.targetId || selectedItemIds.value[0];
  if (!targetId) {
    hideContextMenu();
    return;
  }
  const target = itemList.value.find((item) => item.id === targetId);
  if (!target) {
    hideContextMenu();
    return;
  }
  propertyItem.value = target;
  propertyModalVisible.value = true;
  hideContextMenu();
};

const handleUpload = () => {
  message.info('仅演示按钮，未接入上传接口');
};

const handleRefresh = () => {
  message.success('已刷新');
  hideContextMenu();
};

const handleCreateFolder = () => {
  const siblingFolders = itemList.value.filter(
    (item) => item.type === 'folder' && item.parentId === currentFolderId.value,
  );
  const baseName = '新建文件夹';
  let folderName = baseName;
  let index = 1;
  while (siblingFolders.some((item) => item.name === folderName)) {
    index += 1;
    folderName = `${baseName}(${index})`;
  }
  const id = `folder-${Date.now()}`;
  itemList.value.push({
    id,
    name: folderName,
    type: 'folder',
    size: '-',
    createTime: '2026-04-03 11:50',
    updateTime: '2026-04-03 12:00',
    ext: 'folder',
    orderNo: Date.now(),
    parentId: currentFolderId.value,
  });
  selectedItemIds.value = [id];
  message.success('文件夹已创建');
};

const showContextMenu = (
  event: MouseEvent,
  mode: 'item' | 'blank',
  itemId = '',
) => {
  contextMenu.value.mode = mode;
  contextMenu.value.targetId = itemId;
  if (!filePanelRef.value) {
    return;
  }
  const rect = filePanelRef.value.getBoundingClientRect();
  const menuWidth = mode === 'blank' ? 186 : 140;
  const menuHeight = mode === 'blank' ? 230 : 140;
  let left = event.clientX - rect.left + filePanelRef.value.scrollLeft;
  let top = event.clientY - rect.top + filePanelRef.value.scrollTop;
  const maxLeft = filePanelRef.value.clientWidth - menuWidth - 8;
  const maxTop = filePanelRef.value.clientHeight - menuHeight - 8;
  left = Math.max(8, Math.min(left, maxLeft));
  top = Math.max(8, Math.min(top, maxTop));
  contextMenu.value.visible = true;
  contextMenu.value.x = left;
  contextMenu.value.y = top;
};

const hideContextMenu = () => {
  contextMenu.value.visible = false;
  contextMenu.value.mode = 'item';
  contextMenu.value.targetId = '';
};

const buildTableRowEvent = (record: CabinetItem) => {
  return {
    onClick: (event: MouseEvent) => handleItemClick(record, event),
    onDblclick: () => handleOpen(record),
    onContextmenu: (event: MouseEvent) => {
      event.preventDefault();
      handleItemContextMenu(record, event);
    },
  };
};

const buildTableRowClass = (record: CabinetItem) => {
  return selectedIdSet.value.has(record.id) ? 'table-row-selected' : '';
};

const handleGlobalClick = () => {
  hideContextMenu();
};

onMounted(() => {
  window.addEventListener('click', handleGlobalClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('mousemove', handleMarqueeMouseMove);
  window.removeEventListener('mouseup', handleMarqueeMouseUp);
});
</script>

<style lang="less" scoped>
.private-cabinet {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 620px;
  background: #f4f6fa;
  border: 1px solid #d9e0ea;
  border-radius: 6px;
  overflow: hidden;
}

.cabinet-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e4eaf2;
}

.toolbar-search {
  width: 240px;
}

.sort-trigger {
  min-width: 160px;
  text-align: left;
}

.sort-trigger-divider {
  display: inline-block;
  margin: 0 8px;
  color: #b8c0cc;
}

:deep(.sort-dropdown-overlay) {
  .ant-dropdown-menu {
    min-width: 150px;
    padding: 8px 0;
    border: 1px solid #d9dee7;
    border-radius: 12px;
    box-shadow: 0 10px 28px rgb(20 39 85 / 18%);
  }

  .ant-dropdown-menu-item,
  .ant-dropdown-menu-submenu-title {
    display: flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 16px;
    color: #1f2d3d;
    font-size: 14px;
    border-radius: 0;
  }

  .ant-dropdown-menu-item:hover,
  .ant-dropdown-menu-submenu-title:hover {
    background: #f4f6f8;
  }

  .ant-dropdown-menu-submenu-arrow {
    top: 46%;
    color: #7b8794;
    transform: translateY(-58%);
  }

  .ant-dropdown-menu-sub {
    padding: 8px 0;
    border: 1px solid #d9dee7;
    border-radius: 12px;
    box-shadow: 0 10px 28px rgb(20 39 85 / 18%);
  }

  .ant-dropdown-menu-submenu-open > .ant-dropdown-menu-submenu-title {
    background: #f4f6f8;
  }

  .ant-dropdown-menu-item-divider {
    margin: 6px 0;
  }
}

.sort-submenu-title {
  display: flex;
  align-items: center;
}

.sort-dot {
  width: 10px;
  height: 10px;
  margin-right: 12px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;

  &.active {
    background: #4c5560;
  }
}

.cabinet-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.cabinet-tree {
  width: 240px;
  padding: 12px 10px;
  background: #f9fbff;
  border-right: 1px solid #e4eaf2;
  overflow: auto;
}

.cabinet-files {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  overflow: auto;
  background: #ffffff;
}

.cabinet-path {
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f7f9fc;
  border: 1px solid #e8edf4;
  border-radius: 4px;
}

.grid-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 2px 10px;
}

.file-group-title {
  margin: 6px 4px 8px;
  color: #66788a;
  font-size: 12px;
  font-weight: 600;
}

.file-grid {
  display: grid;
  justify-content: start;
  align-content: start;

  &.sortable-disabled {
    cursor: default;
  }
}

.file-drag-ghost {
  opacity: 0.35;
}

.file-drag-chosen,
.file-drag-active {
  .file-item {
    box-shadow: 0 8px 18px rgb(34 92 180 / 22%);
    background: #e8f2ff;
    border-color: #8eb8ff;
  }
}

.file-grid + .file-group-title {
  margin-top: 14px;
}

.file-grid.size-large {
  grid-template-columns: repeat(auto-fill, 112px);
  grid-auto-rows: minmax(118px, auto);
  gap: 8px 10px;
}

.file-grid.size-small {
  grid-template-columns: repeat(auto-fill, 84px);
  grid-auto-rows: minmax(74px, auto);
  gap: 8px;
}

.selection-marquee {
  position: absolute;
  z-index: 10;
  border: 1px solid #4a90ff;
  background: rgb(74 144 255 / 18%);
  pointer-events: none;
}

.file-table {
  :deep(.ant-table-tbody > tr > td) {
    cursor: pointer;
  }

  :deep(.ant-table-tbody > tr.table-row-selected > td) {
    background: #dbe9ff !important;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: #eef4ff;
  }
}

.grouped-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e6ebf2;
  border-radius: 4px;
  background: #fff;
}

.grouped-table-header,
.grouped-table-row {
  display: grid;
  grid-template-columns: minmax(240px, 1.7fr) 160px 160px 120px 120px;
  align-items: center;
}

.grouped-table-header {
  flex-shrink: 0;
  min-height: 36px;
  color: #526171;
  font-size: 13px;
  background: #fff;
  border-bottom: 1px solid #e6ebf2;

  > div {
    height: 100%;
    padding: 0 10px;
    line-height: 36px;
    border-right: 1px solid #edf1f6;
  }

  > div:last-child {
    border-right: 0;
  }
}

.grouped-table-body {
  flex: 1;
  overflow: auto;
  padding: 6px 0 10px;
}

.grouped-table-section + .grouped-table-section {
  margin-top: 8px;
}

.grouped-table-group-title {
  display: flex;
  align-items: center;
  padding: 2px 10px 4px;
  color: #2f5fb3;
  font-size: 13px;
  line-height: 20px;
}

.grouped-table-group-arrow {
  display: inline-block;
  width: 14px;
  margin-right: 2px;
  color: #61748a;
  font-size: 12px;
}

.grouped-table-row {
  min-height: 28px;
  color: #1f2d3d;
  font-size: 13px;
  cursor: default;
  user-select: none;

  &:hover {
    background: #f2f7ff;
  }

  &.selected {
    background: #dcecff;
  }
}

.grouped-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 10px;
  line-height: 28px;
}

.grouped-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-icon {
  position: relative;
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
  font-weight: 600;

  &::before {
    content: 'F';
  }
}

.icon-folder {
  background: #f7b731;

  &::before {
    content: 'DIR';
  }
}

.icon-image {
  background: #2f9e44;

  &::before {
    content: 'IMG';
  }
}

.icon-video {
  background: #e8590c;

  &::before {
    content: 'MOV';
  }
}

.icon-pdf {
  background: #c92a2a;

  &::before {
    content: 'PDF';
  }
}

.icon-zip {
  background: #5f3dc4;

  &::before {
    content: 'ZIP';
  }
}

.icon-doc {
  background: #1c7ed6;

  &::before {
    content: 'DOC';
  }
}

.icon-xls {
  background: #2b8a3e;

  &::before {
    content: 'XLS';
  }
}

.icon-file {
  background: #868e96;

  &::before {
    content: 'FILE';
  }
}

.context-menu {
  position: absolute;
  z-index: 1000;
  width: 140px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d7e2;
  border-radius: 4px;
  box-shadow: 0 8px 20px rgb(15 35 95 / 18%);

  li {
    padding: 8px 12px;
    color: #1f2d3d;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: #e9f2ff;
    }
  }
}

.context-menu-blank {
  width: 186px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .divider {
    min-height: 1px;
    margin: 5px 0;
    padding: 0;
    background: #edf1f6;
    cursor: default;

    &:hover {
      background: #edf1f6;
    }
  }
}

.submenu-arrow {
  margin-left: 16px;
  color: #7b8794;
  font-size: 14px;
}

.with-children:hover > .context-submenu {
  display: block;
}

.context-submenu {
  position: absolute;
  top: -6px;
  left: calc(100% - 6px);
  z-index: 1001;
  display: none;
  width: 176px;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d7e2;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 35 95 / 18%);

  li {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 12px;
    color: #1f2d3d;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: #e9f2ff;
    }
  }

  .sort-dot {
    margin-right: 10px;
  }
}

.property-content {
  line-height: 30px;
  color: #34495e;

  span {
    display: inline-block;
    width: 70px;
    color: #6b7785;
  }
}
</style>
