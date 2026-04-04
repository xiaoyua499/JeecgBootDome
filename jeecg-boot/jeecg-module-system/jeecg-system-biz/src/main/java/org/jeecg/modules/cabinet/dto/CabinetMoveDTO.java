package org.jeecg.modules.cabinet.dto;

import lombok.Data;

import java.util.List;

/**
 * 移动项目请求。
 */
@Data
public class CabinetMoveDTO {

    private List<String> itemIds;

    private String targetParentId;
}
