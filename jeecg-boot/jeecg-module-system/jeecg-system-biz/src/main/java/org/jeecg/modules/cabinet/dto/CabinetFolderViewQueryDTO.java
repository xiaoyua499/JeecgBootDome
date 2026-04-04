package org.jeecg.modules.cabinet.dto;

import lombok.Data;

/**
 * 文件柜当前目录排序/分组查询参数。
 */
@Data
public class CabinetFolderViewQueryDTO {

    private String scope;

    private String parentId;

    private String keyword;

    private String sortField;

    private String sortOrder;

    private String groupField;

    private Long pageNo;

    private Long pageSize;
}
