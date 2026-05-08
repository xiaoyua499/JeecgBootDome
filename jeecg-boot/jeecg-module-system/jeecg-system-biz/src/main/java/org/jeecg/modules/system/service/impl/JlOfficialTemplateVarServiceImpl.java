package org.jeecg.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.jeecg.modules.system.entity.JlOfficialTemplateVar;
import org.jeecg.modules.system.mapper.JlOfficialTemplateVarMapper;
import org.jeecg.modules.system.service.IJlOfficialTemplateVarService;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * @Description: 公文模板变量
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Service
public class JlOfficialTemplateVarServiceImpl extends ServiceImpl<JlOfficialTemplateVarMapper, JlOfficialTemplateVar> implements IJlOfficialTemplateVarService {

    @Override
    public List<JlOfficialTemplateVar> getVarListByTemplateId(String templateId) {
        LambdaQueryWrapper<JlOfficialTemplateVar> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(JlOfficialTemplateVar::getTemplateId, templateId);
        queryWrapper.eq(JlOfficialTemplateVar::getDelFlag, 0);
        queryWrapper.orderByAsc(JlOfficialTemplateVar::getVarName);
        return baseMapper.selectList(queryWrapper);
    }

    @Override
    public void batchSaveVar(List<JlOfficialTemplateVar> varList, String templateId) {
// 1. 删除该模板下所有原有变量（逻辑删除）
        LambdaQueryWrapper<JlOfficialTemplateVar> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(JlOfficialTemplateVar::getTemplateId, templateId);
        JlOfficialTemplateVar delVar = new JlOfficialTemplateVar();
        delVar.setDelFlag(1);
        delVar.setCreateTime(new Date());
        baseMapper.update(delVar, deleteWrapper);

        // 2. 批量保存新变量
        if (varList != null && !varList.isEmpty()) {
            for (JlOfficialTemplateVar var : varList) {
                var.setId(UUID.randomUUID().toString().replace("-", ""));
                var.setTemplateId(templateId);
                var.setCreateTime(new Date());
                var.setDelFlag(0);
                var.setTenantId("0"); // 租户ID，可根据实际项目调整
                baseMapper.insert(var);
            }
        }
    }
}
