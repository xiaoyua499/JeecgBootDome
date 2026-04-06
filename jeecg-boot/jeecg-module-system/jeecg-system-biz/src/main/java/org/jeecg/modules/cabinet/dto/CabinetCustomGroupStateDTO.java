package org.jeecg.modules.cabinet.dto;

import lombok.Data;

import java.util.List;

/**
 * 文件柜自定义分组状态保存请求。
 */
@Data
public class CabinetCustomGroupStateDTO {

    private String scope;

    private String parentId;

    private List<CabinetCustomGroupDTO> groups;

    private List<CabinetCustomGroupBindingDTO> bindings;

    private List<String> ungroupedOrderItemIds;

    @Data
    public static class CabinetCustomGroupDTO {
        private String id;
        private String name;
        private Integer sortNo;
    }

    @Data
    public static class CabinetCustomGroupBindingDTO {
        private String groupId;
        private List<String> itemIds;
    }
}
