package org.jeecg.modules.cabinet.dto;

import lombok.Data;

import java.util.List;

/**
 * 文件柜手动排序更新参数。
 */
@Data
public class CabinetUpdateOrderDTO {

    private String parentId;

    private List<CabinetItemOrderDTO> itemOrders;

    @Data
    public static class CabinetItemOrderDTO {
        private String id;
        private Integer sortNo;
    }
}
