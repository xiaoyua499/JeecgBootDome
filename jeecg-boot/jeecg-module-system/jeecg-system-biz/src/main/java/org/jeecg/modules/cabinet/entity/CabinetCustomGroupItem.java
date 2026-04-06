package org.jeecg.modules.cabinet.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import org.jeecg.common.system.base.entity.JeecgEntity;

/**
 * 文件柜自定义分组项目归属与排序。
 */
@Data
@TableName("sys_cabinet_custom_group_item")
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public class CabinetCustomGroupItem extends JeecgEntity {

    private static final long serialVersionUID = 1L;

    private String scope;

    private String userName;

    private String groupId;

    private String itemId;

    private Integer sortNo;

    private Integer tenantId;
}
