package org.jeecg.modules.demo.official.service;

import org.jeecg.modules.demo.official.entity.JlOfficialTemplateVar;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.List;

/**
 * @Description: 公文模板变量
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
public interface IJlOfficialTemplateVarService extends IService<JlOfficialTemplateVar> {
    /**
     * 根据模板ID查询所有关联变量
     * @param templateId 模板ID
     * @return 变量列表
     */
    List<JlOfficialTemplateVar> getVarListByTemplateId(String templateId);

    /**
     * 批量保存模板变量
     * @param varList 变量列表
     * @param templateId 模板ID
     */
    void batchSaveVar(List<JlOfficialTemplateVar> varList, String templateId);

}
