CREATE TABLE IF NOT EXISTS `sys_cabinet_preference` (
  `id` varchar(32) NOT NULL COMMENT '主键ID',
  `scope` varchar(16) NOT NULL COMMENT '文件柜范围(private/public)',
  `user_name` varchar(64) NOT NULL COMMENT '用户名',
  `sort_field` varchar(32) NOT NULL COMMENT '排序字段',
  `sort_order` varchar(16) NOT NULL COMMENT '排序方向',
  `group_field` varchar(32) NOT NULL COMMENT '分组字段',
  `tenant_id` int DEFAULT 0 COMMENT '租户ID',
  `create_by` varchar(50) DEFAULT NULL COMMENT '创建人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(50) DEFAULT NULL COMMENT '更新人',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cabinet_preference` (`tenant_id`, `user_name`, `scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件柜视图偏好表';
