package org.jeecg.modules.system.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import org.jeecg.modules.system.entity.JlOfficialTemplate;

/**
 * @Description: 公文模板主表
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
public interface IJlOfficialTemplateService extends IService<JlOfficialTemplate> {

    /**
     * 分页查询公文模板（带条件）
     * @param page 分页参数
     * @param sysOfficialTemplate 查询条件
     * @return 分页结果
     */
    IPage<JlOfficialTemplate> queryPageList(Page<JlOfficialTemplate> page, JlOfficialTemplate sysOfficialTemplate);

    /**
     * 根据模板ID删除模板及关联的变量
     * @param id 模板ID
     */
    void deleteTemplateAndVar(String id);

    /**
     * 复制模板（复制模板主信息，不复制变量，可手动添加）
     * @param id 原模板ID
     * @return 新模板实体
     */
    JlOfficialTemplate copyTemplate(String id);

}
