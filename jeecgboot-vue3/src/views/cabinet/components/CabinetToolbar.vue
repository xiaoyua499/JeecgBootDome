<!-- 文件柜顶部工具栏：负责管理按钮、搜索、排序/分组入口和视图模式切换。 -->
<template>
  <div class="cabinet-toolbar">
    <a-space>
      <a-button v-if="canManage" type="primary" @click="emit('create-folder')">新建文件夹</a-button>
      <div v-if="canManage" ref="uploadWrapRef" class="cabinet-toolbar-upload-wrap">
        <a-upload :show-upload-list="false" :multiple="true" :before-upload="beforeUpload">
          <a-button>
            <Icon icon="ant-design:upload-outlined" />
            上传
          </a-button>
        </a-upload>
      </div>
      <a-button v-if="canManage" danger :disabled="selectedCount === 0" @click="emit('delete')">删除</a-button>
      <a-button @click="emit('refresh')">刷新</a-button>
      <a-input-search
        :value="searchKeyword"
        allow-clear
        class="toolbar-search"
        placeholder="搜索当前目录文件/文件夹"
        @update:value="emit('update:searchKeyword', $event)"
        @search="emit('search')"
      />
      <a-dropdown :trigger="['click']" placement="bottomLeft" overlay-class-name="sort-dropdown-overlay">
        <a-button class="sort-trigger">
          排序：{{ sortFieldLabel }} / {{ sortOrderLabel }}<span class="sort-trigger-divider">|</span>分组：{{ groupFieldLabel }}
        </a-button>
        <template #overlay>
          <a-menu class="sort-menu">
            <a-menu-item @click="emit('change-sort-field', 'manual')">
              <span class="sort-dot" :class="{ active: sortField === 'manual' }"></span>
              手动排序
            </a-menu-item>
            <a-menu-item @click="emit('change-sort-field', 'name')">
              <span class="sort-dot" :class="{ active: sortField === 'name' }"></span>
              名称
            </a-menu-item>
            <a-menu-item @click="emit('change-sort-field', 'updateTime')">
              <span class="sort-dot" :class="{ active: sortField === 'updateTime' }"></span>
              修改日期
            </a-menu-item>
            <a-menu-item @click="emit('change-sort-field', 'ext')">
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
              <a-menu-item @click="emit('change-sort-field', 'size')">大小</a-menu-item>
            </a-sub-menu>
            <a-menu-divider />
            <a-menu-item @click="emit('change-sort-order', 'asc')">
              <span class="sort-dot" :class="{ active: sortOrder === 'asc' }"></span>
              递增
            </a-menu-item>
            <a-menu-item @click="emit('change-sort-order', 'desc')">
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
              <a-menu-item @click="emit('change-group-field', 'none')">无</a-menu-item>
              <a-menu-item @click="emit('change-group-field', 'name')">名称</a-menu-item>
              <a-menu-item @click="emit('change-group-field', 'updateTime')">修改日期</a-menu-item>
              <a-menu-item @click="emit('change-group-field', 'type')">类型</a-menu-item>
              <a-menu-item @click="emit('change-group-field', 'size')">大小</a-menu-item>
            </a-sub-menu>
          </a-menu>
        </template>
      </a-dropdown>
    </a-space>
    <a-space>
      <a-radio-group v-if="viewMode === 'grid'" :value="gridIconSize" size="small" @update:value="emit('update:gridIconSize', $event)">
        <a-radio-button value="large">大图标</a-radio-button>
        <a-radio-button value="small">小图标</a-radio-button>
      </a-radio-group>
      <a-button :type="viewMode === 'grid' ? 'primary' : 'default'" @click="emit('change-view-mode', 'grid')">图标视图</a-button>
      <a-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="emit('change-view-mode', 'table')">列表视图</a-button>
    </a-space>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import type { PropType } from 'vue';
  import { Icon } from '/@/components/Icon';
  import type { GridIconSize, GroupField, SortField, SortOrder, ViewMode } from '../types';

  // 顶部工具栏：负责管理按钮、搜索、排序/分组入口和视图模式切换。
  const props = defineProps({
    canManage: { type: Boolean, required: true },
    selectedCount: { type: Number, required: true },
    searchKeyword: { type: String, required: true },
    sortField: { type: String as PropType<SortField>, required: true },
    sortOrder: { type: String as PropType<SortOrder>, required: true },
    groupField: { type: String as PropType<GroupField>, required: true },
    sortFieldLabel: { type: String, required: true },
    sortOrderLabel: { type: String, required: true },
    groupFieldLabel: { type: String, required: true },
    viewMode: { type: String as PropType<ViewMode>, required: true },
    gridIconSize: { type: String as PropType<GridIconSize>, required: true },
    /** 与项目内 JUpload / a-upload 一致：返回 false 走自定义逻辑（如写入本地列表或调业务上传） */
    beforeUpload: {
      type: Function as PropType<(file: File) => boolean | Promise<boolean>>,
      required: true,
    },
  });

  const uploadWrapRef = ref<HTMLElement | null>(null);

  /** 供右键菜单「上传」等场景触发与工具栏相同的文件选择框 */
  function openUploadDialog() {
    if (!props.canManage) {
      return;
    }
    const input = uploadWrapRef.value?.querySelector?.('input[type="file"]') as HTMLInputElement | undefined;
    input?.click();
  }

  defineExpose({
    openUploadDialog,
  });

  const emit = defineEmits<{
    (e: 'create-folder'): void;
    (e: 'delete'): void;
    (e: 'refresh'): void;
    (e: 'search'): void;
    (e: 'update:searchKeyword', value: string): void;
    (e: 'update:gridIconSize', value: GridIconSize): void;
    (e: 'change-sort-field', value: SortField): void;
    (e: 'change-sort-order', value: SortOrder): void;
    (e: 'change-group-field', value: GroupField): void;
    (e: 'change-view-mode', value: ViewMode): void;
  }>();
</script>

<style lang="less" scoped>
  .cabinet-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #ffffff;
    border-bottom: 1px solid #e4eaf2;
  }

  .cabinet-toolbar-upload-wrap {
    display: inline-flex;
    align-items: center;
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
</style>
