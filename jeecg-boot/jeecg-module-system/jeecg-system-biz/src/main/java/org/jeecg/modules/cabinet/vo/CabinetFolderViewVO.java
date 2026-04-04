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

    private String sortField;

    private String sortOrder;

    private String groupField;

    private boolean canManage;

    private List<CabinetItemVO> items;

    private List<CabinetGroupSectionVO> groups;
}
