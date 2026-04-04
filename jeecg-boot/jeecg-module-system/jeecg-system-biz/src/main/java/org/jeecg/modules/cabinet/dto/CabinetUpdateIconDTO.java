package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 更新图标请求。
 */
@Data
public class CabinetUpdateIconDTO {

    private String id;

    private String iconKey;

    private String customIconPath;
}
