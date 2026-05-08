-- 注意：该页面对应的前台目录为views/official文件夹下
-- 如果你想更改到其他目录，请修改sql中component字段对应的值


-- 主菜单
INSERT INTO sys_permission(id, parent_id, name, url, component, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_route, is_leaf, keep_alive, hidden, hide_tab, description, status, del_flag, rule_flag, create_by, create_time, update_by, update_time, internal_or_external)
VALUES ('177572104216801', NULL, '公文模板主表', '/official/jlOfficialTemplateList', 'official/JlOfficialTemplateList', NULL, NULL, 0, NULL, '1', 0.00, 0, NULL, 1, 0, 0, 0, 0, NULL, '1', 0, 0, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0);

-- 新增
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216802', '177572104216801', '添加公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:add', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 编辑
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216803', '177572104216801', '编辑公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:edit', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216804', '177572104216801', '删除公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:delete', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 批量删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216805', '177572104216801', '批量删除公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:deleteBatch', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 导出excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216806', '177572104216801', '导出excel_公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:exportXls', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 导入excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572104216807', '177572104216801', '导入excel_公文模板主表', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template:importExcel', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:42', NULL, NULL, 0, 0, '1', 0);

-- 角色授权（以 admin 角色为例，role_id 可替换）
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216808', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216801', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216809', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216802', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216810', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216803', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216811', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216804', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216812', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216805', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216813', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216806', NULL, '2026-04-09 15:50:42', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572104216814', 'f6817f48af4fb3af11b9e8bf182f618b', '177572104216807', NULL, '2026-04-09 15:50:42', '127.0.0.1');