-- 注意：该页面对应的前台目录为views/duplicate文件夹下
-- 如果你想更改到其他目录，请修改sql中component字段对应的值


-- 主菜单
INSERT INTO sys_permission(id, parent_id, name, url, component, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_route, is_leaf, keep_alive, hidden, hide_tab, description, status, del_flag, rule_flag, create_by, create_time, update_by, update_time, internal_or_external)
VALUES ('177821042466401', NULL, '查重任务表', '/duplicate/duplicateTaskList', 'duplicate/DuplicateTaskList', NULL, NULL, 0, NULL, '1', 0.00, 0, NULL, 1, 0, 0, 0, 0, NULL, '1', 0, 0, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0);

-- 新增
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466402', '177821042466401', '添加查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:add', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 编辑
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466403', '177821042466401', '编辑查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:edit', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466404', '177821042466401', '删除查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:delete', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 批量删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466405', '177821042466401', '批量删除查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:deleteBatch', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 导出excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466406', '177821042466401', '导出excel_查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:exportXls', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 导入excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177821042466407', '177821042466401', '导入excel_查重任务表', NULL, NULL, 0, NULL, NULL, 2, 'org.jeecg.modules.demo.duplicate:duplicate_task:importExcel', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-05-08 11:20:24', NULL, NULL, 0, 0, '1', 0);

-- 角色授权（以 admin 角色为例，role_id 可替换）
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466408', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466401', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466409', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466402', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466410', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466403', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466411', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466404', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466412', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466405', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466413', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466406', NULL, '2026-05-08 11:20:24', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177821042466414', 'f6817f48af4fb3af11b9e8bf182f618b', '177821042466407', NULL, '2026-05-08 11:20:24', '127.0.0.1');
