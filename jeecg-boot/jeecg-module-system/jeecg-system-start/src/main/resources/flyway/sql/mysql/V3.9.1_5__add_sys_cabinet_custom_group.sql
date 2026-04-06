CREATE TABLE IF NOT EXISTS `sys_cabinet_custom_group` (
  `id` varchar(32) NOT NULL,
  `scope` varchar(16) NOT NULL,
  `user_name` varchar(64) NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `sort_no` int DEFAULT 0,
  `tenant_id` int NOT NULL DEFAULT 0,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cabinet_custom_group_name` (`tenant_id`,`scope`,`user_name`,`group_name`),
  KEY `idx_cabinet_custom_group_user_scope` (`tenant_id`,`scope`,`user_name`,`sort_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='文件柜自定义分组';

CREATE TABLE IF NOT EXISTS `sys_cabinet_custom_group_item` (
  `id` varchar(32) NOT NULL,
  `scope` varchar(16) NOT NULL,
  `user_name` varchar(64) NOT NULL,
  `group_id` varchar(32) NOT NULL,
  `item_id` varchar(32) NOT NULL,
  `sort_no` int DEFAULT 0,
  `tenant_id` int NOT NULL DEFAULT 0,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cabinet_custom_group_item` (`tenant_id`,`scope`,`user_name`,`group_id`,`item_id`),
  KEY `idx_cabinet_custom_group_item` (`tenant_id`,`scope`,`user_name`,`item_id`),
  KEY `idx_cabinet_custom_group_order` (`tenant_id`,`scope`,`user_name`,`group_id`,`sort_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='文件柜自定义分组项目';
