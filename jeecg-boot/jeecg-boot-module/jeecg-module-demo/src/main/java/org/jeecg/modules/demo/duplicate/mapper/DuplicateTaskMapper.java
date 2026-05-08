package org.jeecg.modules.demo.duplicate.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.jeecg.modules.demo.duplicate.entity.DuplicateTask;

/**
 * @Description: 查重任务表
 * @Author: jeecg-boot
 * @Date:   2026-05-08
 * @Version: V1.0
 */
public interface DuplicateTaskMapper extends BaseMapper<DuplicateTask> {
    // 当前查重任务 demo 暂时只使用 MyBatis-Plus 基础 CRUD。
    // 后续迁移到正式项目并增加自定义 SQL 时，再在此处补充 Mapper 方法。
}
