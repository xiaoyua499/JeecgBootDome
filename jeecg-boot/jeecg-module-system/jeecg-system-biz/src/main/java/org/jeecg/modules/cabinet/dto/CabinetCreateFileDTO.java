package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 新建文件元数据请求。
 */
@Data
public class CabinetCreateFileDTO {

    private String scope;

    private String parentId;

    private String name;

    private String filePath;

    private Long sizeBytes;

    private String ext;
}
