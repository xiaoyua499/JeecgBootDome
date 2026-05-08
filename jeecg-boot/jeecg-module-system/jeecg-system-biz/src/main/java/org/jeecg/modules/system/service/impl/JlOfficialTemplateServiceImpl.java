package org.jeecg.modules.demo.official.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.jeecg.modules.demo.official.entity.JlOfficialTemplate;
import org.jeecg.modules.demo.official.entity.JlOfficialTemplateVar;
import org.jeecg.modules.demo.official.mapper.JlOfficialTemplateMapper;
import org.jeecg.modules.demo.official.mapper.JlOfficialTemplateVarMapper;
import org.jeecg.modules.demo.official.service.IJlOfficialTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

/**
 * @Description: 公文模板主表
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Service
public class JlOfficialTemplateServiceImpl extends ServiceImpl<JlOfficialTemplateMapper, JlOfficialTemplate> implements IJlOfficialTemplateService {

    @Autowired
    private JlOfficialTemplateVarMapper jlOfficialTemplateVarMapper;


    @Override
    public IPage<JlOfficialTemplate> queryPageList(Page<JlOfficialTemplate> page, JlOfficialTemplate sysOfficialTemplate) {
        LambdaQueryWrapper<JlOfficialTemplate> queryWrapper = new LambdaQueryWrapper<>();
        // 条件查询：模板名称模糊匹配
        if (sysOfficialTemplate.getTemplateName() != null && !"".equals(sysOfficialTemplate.getTemplateName())) {
            queryWrapper.like(JlOfficialTemplate::getTemplateName, sysOfficialTemplate.getTemplateName());
        }
        // 条件查询：公文类型精准匹配
        if (sysOfficialTemplate.getDocType() != null && !"".equals(sysOfficialTemplate.getDocType())) {
            queryWrapper.eq(JlOfficialTemplate::getDocType, sysOfficialTemplate.getDocType());
        }
        // 条件查询：级别精准匹配
        if (sysOfficialTemplate.getLevel() != null && !"".equals(sysOfficialTemplate.getLevel())) {
            queryWrapper.eq(JlOfficialTemplate::getLevel, sysOfficialTemplate.getLevel());
        }
        // 条件查询：状态精准匹配
        if (sysOfficialTemplate.getStatus() != null) {
            queryWrapper.eq(JlOfficialTemplate::getStatus, sysOfficialTemplate.getStatus());
        }
        // 逻辑删除过滤
        queryWrapper.eq(JlOfficialTemplate::getDelFlag, 0);
        // 排序：按排序号升序，创建时间降序
        queryWrapper.orderByAsc(JlOfficialTemplate::getSortNo).orderByDesc(JlOfficialTemplate::getCreateTime);
        return baseMapper.selectPage(page, queryWrapper);

    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTemplateAndVar(String id) {
        // 1. 删除模板主表（逻辑删除）
        JlOfficialTemplate template = new JlOfficialTemplate();
        template.setId(id);
        template.setDelFlag(1);
        template.setUpdateTime(new Date());
        baseMapper.updateById(template);
        // 2. 删除关联的变量（逻辑删除）
        LambdaQueryWrapper<JlOfficialTemplateVar> varWrapper = new LambdaQueryWrapper<>();
        varWrapper.eq(JlOfficialTemplateVar::getTemplateId, id);
        JlOfficialTemplateVar var = new JlOfficialTemplateVar();
        var.setDelFlag(1);
        jlOfficialTemplateVarMapper.update(var, varWrapper);
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public JlOfficialTemplate copyTemplate(String id) {
        // 1. 查询原模板信息
        JlOfficialTemplate original = baseMapper.selectById(id);
        if (original == null) {
            throw new RuntimeException("模板不存在，无法复制");
        }
        // 2. 复制模板主信息（重置ID、模板名称加“副本”、重置时间、状态默认启用）
        JlOfficialTemplate copy = new JlOfficialTemplate();
        copy.setId(UUID.randomUUID().toString().replace("-", ""));
        copy.setTemplateName(original.getTemplateName() + "（副本）");
        copy.setTemplateCode(original.getTemplateCode() + "_COPY"); // 编码加后缀，避免重复
        copy.setDocType(original.getDocType());
        copy.setLevel(original.getLevel());
        copy.setContentHtml(original.getContentHtml()); // 复制Tinymce生成的HTML内容
        copy.setContentWord(original.getContentWord());
        copy.setStatus(1); // 副本默认启用
        copy.setSortNo(original.getSortNo());
        copy.setRemark(original.getRemark() + "（副本，复制于原模板ID：" + id + "）");
        copy.setCreateBy(original.getCreateBy());
        copy.setCreateTime(new Date());
        copy.setUpdateBy(original.getCreateBy());
        copy.setUpdateTime(new Date());
        copy.setDelFlag(0);
        copy.setTenantId(original.getTenantId());
        // 3. 保存新模板
        baseMapper.insert(copy);
        return copy;
    }
}
