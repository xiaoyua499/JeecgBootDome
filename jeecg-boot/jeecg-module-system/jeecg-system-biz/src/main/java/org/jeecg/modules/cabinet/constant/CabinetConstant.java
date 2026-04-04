package org.jeecg.modules.cabinet.constant;

/**
 * 文件柜模块常量。
 */
public interface CabinetConstant {

    String SCOPE_PRIVATE = "private";
    String SCOPE_PUBLIC = "public";

    String ITEM_TYPE_FOLDER = "folder";
    String ITEM_TYPE_FILE = "file";

    String OWNER_KEY_PUBLIC = "PUBLIC";
    String ROOT_PARENT_ID = "root";
    Integer SHARED_TENANT_ID = 0;

    String HAS_CHILD_YES = "1";
    String HAS_CHILD_NO = "0";

    String DEFAULT_SORT_FIELD = "manual";
    String DEFAULT_SORT_ORDER = "asc";
    String DEFAULT_GROUP_FIELD = "type";

    String ADMIN_USERNAME = "admin";
}
