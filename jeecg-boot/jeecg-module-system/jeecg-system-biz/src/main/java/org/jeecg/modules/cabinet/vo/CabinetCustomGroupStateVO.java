package org.jeecg.modules.cabinet.vo;

import lombok.Data;

import java.util.List;

/**
 * 文件柜自定义分组状态。
 */
@Data
public class CabinetCustomGroupStateVO {

    private String scope;

    private String parentId;

    private List<CabinetCustomGroupVO> groups;

    private List<CabinetCustomGroupBindingVO> bindings;

    private List<String> ungroupedOrderItemIds;

    @Data
    public static class CabinetCustomGroupVO {
        private String id;
        private String name;
        private Integer sortNo;
    }

    @Data
    public static class CabinetCustomGroupBindingVO {
        private String groupId;
        private List<String> itemIds;
    }
}
