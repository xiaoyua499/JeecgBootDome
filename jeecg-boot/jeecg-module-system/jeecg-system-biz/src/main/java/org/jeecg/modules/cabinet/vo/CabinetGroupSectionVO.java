package org.jeecg.modules.cabinet.vo;

import lombok.Data;

import java.util.List;

/**
 * 文件柜分组视图。
 */
@Data
public class CabinetGroupSectionVO {

    private String key;

    private String title;

    private List<CabinetItemVO> items;
}
