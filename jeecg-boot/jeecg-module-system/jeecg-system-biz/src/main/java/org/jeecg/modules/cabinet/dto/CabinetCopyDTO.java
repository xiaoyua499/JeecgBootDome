package org.jeecg.modules.cabinet.dto;

import lombok.Data;

import java.util.List;

/**
 * 复制项目请求。
 */
@Data
public class CabinetCopyDTO {

    private List<String> itemIds;

    private String targetParentId;
}
