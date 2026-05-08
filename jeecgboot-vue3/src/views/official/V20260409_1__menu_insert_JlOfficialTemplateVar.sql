-- 注意：该页面对应的前台目录为views/official文件夹下
-- 如果你想更改到其他目录，请修改sql中component字段对应的值


-- 主菜单
INSERT INTO sys_permission(id, parent_id, name, url, component, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_route, is_leaf, keep_alive, hidden, hide_tab, description, status, del_flag, rule_flag, create_by, create_time, update_by, update_time, internal_or_external)
VALUES ('177572102721301', NULL, '公文模板变量', '/official/jlOfficialTemplateVarList', 'official/JlOfficialTemplateVarList', NULL, NULL, 0, NULL, '1', 0.00, 0, NULL, 1, 0, 0, 0, 0, NULL, '1', 0, 0, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0);

-- 新增
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721302', '177572102721301', '添加公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:add', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 编辑
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721303', '177572102721301', '编辑公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:edit', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721304', '177572102721301', '删除公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:delete', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 批量删除
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721305', '177572102721301', '批量删除公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:deleteBatch', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 导出excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721306', '177572102721301', '导出excel_公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:exportXls', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 导入excel
INSERT INTO sys_permission(id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, perms_type, sort_no, always_show, icon, is_leaf, keep_alive, hidden, hide_tab, description, create_by, create_time, update_by, update_time, del_flag, rule_flag, status, internal_or_external)
VALUES ('177572102721307', '177572102721301', '导入excel_公文模板变量', NULL, NULL, 0, NULL, NULL, 2, 'official:jl_official_template_var:importExcel', '1', NULL, 0, NULL, 1, 0, 0, 0, NULL, 'admin', '2026-04-09 15:50:27', NULL, NULL, 0, 0, '1', 0);

-- 角色授权（以 admin 角色为例，role_id 可替换）
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721408', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721301', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721409', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721302', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721410', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721303', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721411', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721304', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721412', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721305', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721413', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721306', NULL, '2026-04-09 15:50:27', '127.0.0.1');
INSERT INTO sys_role_permission (id, role_id, permission_id, data_rule_ids, operate_date, operate_ip) VALUES ('177572102721414', 'f6817f48af4fb3af11b9e8bf182f618b', '177572102721307', NULL, '2026-04-09 15:50:27', '127.0.0.1');