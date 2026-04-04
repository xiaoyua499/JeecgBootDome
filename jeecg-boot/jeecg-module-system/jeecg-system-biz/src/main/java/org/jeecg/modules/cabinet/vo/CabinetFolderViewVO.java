package org.jeecg.modules.cabinet.vo;

import lombok.Data;

import java.util.List;

/**
 * 文件柜当前目录排序/分组结果。
 */
@Data
public class CabinetFolderViewVO {

    private String scope;

    private String parentId;

    private String keyword;

    private String sortField;

    private String sortOrder;

    private String groupField;

    private long pageNo;

    private long pageSize;

    private long total;

    private boolean canManage;

    private List<CabinetItemVO> items;

    private List<CabinetGroupSectionVO> groups;
}
