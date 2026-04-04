package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 文件柜视图偏好保存请求。
 */
@Data
public class CabinetPreferenceDTO {

    private String scope;

    private String sortField;

    private String sortOrder;

    private String groupField;
}
