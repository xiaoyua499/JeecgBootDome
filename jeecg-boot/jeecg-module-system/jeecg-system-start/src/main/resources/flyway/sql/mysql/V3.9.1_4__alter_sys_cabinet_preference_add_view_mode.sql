ALTER TABLE `sys_cabinet_preference`
  ADD COLUMN `view_mode` varchar(16) DEFAULT NULL COMMENT '视图模式(grid/table)' AFTER `group_field`;
