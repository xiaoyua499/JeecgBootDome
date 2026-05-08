package org.jeecg.modules.demo.duplicate.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.jeecg.modules.demo.duplicate.entity.DuplicateTask;

/**
 * @Description: 查重任务表
 * @Author: jeecg-boot
 * @Date:   2026-05-08
 * @Version: V1.0
 */
public interface IDuplicateTaskService extends IService<DuplicateTask> {
    // 先继承 IService 提供标准增删改查能力。
    // demo 阶段不额外扩展业务方法，避免后续迁移时产生多余依赖。
}
