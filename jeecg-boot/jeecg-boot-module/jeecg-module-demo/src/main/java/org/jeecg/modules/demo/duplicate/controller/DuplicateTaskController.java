package org.jeecg.modules.demo.duplicate.controller;

import java.util.Arrays;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jeecg.common.api.vo.Result;
import org.jeecg.common.system.query.QueryGenerator;
import org.jeecg.modules.demo.duplicate.entity.DuplicateTask;
import org.jeecg.modules.demo.duplicate.service.IDuplicateTaskService;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;

import org.jeecg.common.system.base.controller.JeecgController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.jeecg.common.aspect.annotation.AutoLog;
import org.apache.shiro.authz.annotation.RequiresPermissions;
 /**
 * @Description: 查重任务表
 * @Author: jeecg-boot
 * @Date:   2026-05-08
 * @Version: V1.0
 */
@Tag(name="查重任务表")
@RestController
@RequestMapping("/duplicate/duplicateTask")
@Slf4j
public class DuplicateTaskController extends JeecgController<DuplicateTask, IDuplicateTaskService> {
	@Autowired
	private IDuplicateTaskService duplicateTaskService;
	
	/**
	 * 分页列表查询
	 *
	 * @param duplicateTask
	 * @param pageNo
	 * @param pageSize
	 * @param req
	 * @return
	 */
	//@AutoLog(value = "查重任务表-分页列表查询")
	@Operation(summary="查重任务表-分页列表查询")
	@GetMapping(value = "/list")
	public Result<IPage<DuplicateTask>> queryPageList(DuplicateTask duplicateTask,
								   @RequestParam(name="pageNo", defaultValue="1") Integer pageNo,
								   @RequestParam(name="pageSize", defaultValue="10") Integer pageSize,
								   HttpServletRequest req) {

        // 使用 JeecgBoot 公共查询构造器，保留 Online 生成代码的查询参数兼容能力，
        // 方便后续从 demo 模块平移到正式模块时继续复用列表筛选逻辑。
        QueryWrapper<DuplicateTask> queryWrapper = QueryGenerator.initQueryWrapper(duplicateTask, req.getParameterMap());
		Page<DuplicateTask> page = new Page<DuplicateTask>(pageNo, pageSize);
		IPage<DuplicateTask> pageList = duplicateTaskService.page(page, queryWrapper);
		return Result.OK(pageList);
	}
	
	/**
	 *   添加
	 *
	 * @param duplicateTask
	 * @return
	 */
	@AutoLog(value = "查重任务表-添加")
	@Operation(summary="查重任务表-添加")
	@RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:add")
	@PostMapping(value = "/add")
	public Result<String> add(@RequestBody DuplicateTask duplicateTask) {
		duplicateTaskService.save(duplicateTask);

		return Result.OK("添加成功！");
	}
	
	/**
	 *  编辑
	 *
	 * @param duplicateTask
	 * @return
	 */
	@AutoLog(value = "查重任务表-编辑")
	@Operation(summary="查重任务表-编辑")
	@RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:edit")
	@RequestMapping(value = "/edit", method = {RequestMethod.PUT,RequestMethod.POST})
	public Result<String> edit(@RequestBody DuplicateTask duplicateTask) {
		duplicateTaskService.updateById(duplicateTask);
		return Result.OK("编辑成功!");
	}
	
	/**
	 *   通过id删除
	 *
	 * @param id
	 * @return
	 */
	@AutoLog(value = "查重任务表-通过id删除")
	@Operation(summary="查重任务表-通过id删除")
	@RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:delete")
	@DeleteMapping(value = "/delete")
	public Result<String> delete(@RequestParam(name="id",required=true) String id) {
		duplicateTaskService.removeById(id);
		return Result.OK("删除成功!");
	}
	
	/**
	 *  批量删除
	 *
	 * @param ids
	 * @return
	 */
	@AutoLog(value = "查重任务表-批量删除")
	@Operation(summary="查重任务表-批量删除")
	@RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:deleteBatch")
	@DeleteMapping(value = "/deleteBatch")
	public Result<String> deleteBatch(@RequestParam(name="ids",required=true) String ids) {
		this.duplicateTaskService.removeByIds(Arrays.asList(ids.split(",")));
		return Result.OK("批量删除成功!");
	}
	
	/**
	 * 通过id查询
	 *
	 * @param id
	 * @return
	 */
	//@AutoLog(value = "查重任务表-通过id查询")
	@Operation(summary="查重任务表-通过id查询")
	@GetMapping(value = "/queryById")
	public Result<DuplicateTask> queryById(@RequestParam(name="id",required=true) String id) {
		DuplicateTask duplicateTask = duplicateTaskService.getById(id);
		if(duplicateTask==null) {
			return Result.error("未找到对应数据");
		}
		return Result.OK(duplicateTask);
	}

    /**
    * 导出excel
    *
    * @param request
    * @param duplicateTask
    */
    @RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:exportXls")
    @RequestMapping(value = "/exportXls")
    public ModelAndView exportXls(HttpServletRequest request, DuplicateTask duplicateTask) {
        return super.exportXls(request, duplicateTask, DuplicateTask.class, "查重任务表");
    }

    /**
      * 通过excel导入数据
    *
    * @param request
    * @param response
    * @return
    */
    @RequiresPermissions("org.jeecg.modules.demo.duplicate:duplicate_task:importExcel")
    @RequestMapping(value = "/importExcel", method = RequestMethod.POST)
    public Result<?> importExcel(HttpServletRequest request, HttpServletResponse response) {
        return super.importExcel(request, response, DuplicateTask.class);
    }

}
