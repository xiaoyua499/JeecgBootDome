package org.jeecg.modules.demo.duplicate.service.impl;

import org.jeecg.modules.demo.duplicate.entity.DuplicateTask;
import org.jeecg.modules.demo.duplicate.mapper.DuplicateTaskMapper;
import org.jeecg.modules.demo.duplicate.service.IDuplicateTaskService;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

/**
 * @Description: 查重任务表
 * @Author: jeecg-boot
 * @Date:   2026-05-08
 * @Version: V1.0
 */
@Service
public class DuplicateTaskServiceImpl extends ServiceImpl<DuplicateTaskMapper, DuplicateTask> implements IDuplicateTaskService {
    // 目前使用 MyBatis-Plus 默认 ServiceImpl 实现基础 CRUD。
    // 后续加入异步查重流程时，可以在这里承载任务初始化、状态流转等业务逻辑。
}
