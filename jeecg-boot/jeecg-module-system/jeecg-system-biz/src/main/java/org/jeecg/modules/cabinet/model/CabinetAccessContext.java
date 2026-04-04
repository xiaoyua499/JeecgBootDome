package org.jeecg.modules.cabinet.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.jeecg.common.system.vo.LoginUser;

/**
 * 当前请求对应的文件柜访问上下文。
 */
@Data
@AllArgsConstructor
public class CabinetAccessContext {

    private String scope;

    private String ownerKey;

    private Integer tenantId;

    private LoginUser loginUser;

    private boolean canManage;
}
