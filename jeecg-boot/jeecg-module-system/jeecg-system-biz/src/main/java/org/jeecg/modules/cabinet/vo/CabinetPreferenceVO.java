package org.jeecg.modules.cabinet.vo;

import lombok.Data;

/**
 * 文件柜视图偏好。
 */
@Data
public class CabinetPreferenceVO {

    private String scope;

    private String sortField;

    private String sortOrder;

    private String groupField;

    private String viewMode;

    private String gridIconSize;
}
