package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 新建文件夹请求。
 */
@Data
public class CabinetCreateFolderDTO {

    private String scope;

    private String parentId;

    private String name;
}
