package org.jeecg.modules.cabinet.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;
import org.jeecg.common.system.base.entity.JeecgEntity;

/**
 * 文件柜视图偏好。
 */
@Data
@TableName("sys_cabinet_preference")
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public class CabinetPreference extends JeecgEntity {

    private static final long serialVersionUID = 1L;

    private String scope;

    private String userName;

    private String sortField;

    private String sortOrder;

    private String groupField;

    private String viewMode;

    private String gridIconSize;

    private Integer tenantId;
}
