package org.jeecg.modules.cabinet.vo;

import lombok.Data;

import java.util.List;

/**
 * 文件柜初始化数据。
 */
@Data
public class CabinetBootstrapVO {

    private String scope;

    private boolean canManage;

    private List<CabinetItemVO> items;
}
