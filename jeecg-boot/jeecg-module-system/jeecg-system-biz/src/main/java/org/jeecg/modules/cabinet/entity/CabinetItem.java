package org.jeecg.modules.cabinet.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import org.jeecg.common.system.base.entity.JeecgEntity;

/**
 * 文件柜项目。
 */
@Data
@TableName("sys_cabinet_item")
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public class CabinetItem extends JeecgEntity {

    private static final long serialVersionUID = 1L;

    private String parentId;

    private String scope;

    private String ownerKey;

    private String itemType;

    private String name;

    private String ext;

    private String filePath;

    private Long sizeBytes;

    private Integer sortNo;

    private String iconKey;

    private String customIconPath;

    private String hasChild;

    private Integer tenantId;
}
