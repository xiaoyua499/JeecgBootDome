<!--
  公柜入口页面

  以固定参数挂载 CabinetExplorer：
  - cabinet-name="公柜"：根节点显示名称
  - scope="public"：请求公柜数据（所有用户共享）
  - can-manage=false：只读模式，禁用所有写操作（新建/上传/重命名/删除/移动等）

  路由：通常挂载在 /cabinet/public
-->
<template>
  <CabinetExplorer cabinet-name="公柜" scope="public" :can-manage="false" />
</template>

<script lang="ts" setup>
import CabinetExplorer from '../components/CabinetExplorer.vue';
</script>
