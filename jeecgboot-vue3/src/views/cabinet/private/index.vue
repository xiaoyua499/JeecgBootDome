<!--
  私柜入口页面

  以固定参数挂载 CabinetExplorer：
  - cabinet-name="私柜"：根节点显示名称
  - scope="private"：请求私柜数据（当前登录用户专属）
  - can-manage=true：开启完整管理权限（新建/上传/重命名/删除/移动等）

  路由：通常挂载在 /cabinet/private
-->
<template>
  <CabinetExplorer cabinet-name="私柜" scope="private" :can-manage="true" />
</template>

<script lang="ts" setup>
import CabinetExplorer from '../components/CabinetExplorer.vue';
</script>
