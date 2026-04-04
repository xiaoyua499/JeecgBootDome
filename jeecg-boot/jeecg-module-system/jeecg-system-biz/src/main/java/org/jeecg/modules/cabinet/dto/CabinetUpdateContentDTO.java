package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 文件柜更新文件内容请求。
 */
@Data
public class CabinetUpdateContentDTO {

    private String id;

    private String content;
}
