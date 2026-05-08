package org.jeecg.modules.system.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jeecg.common.api.vo.Result;
import org.jeecg.common.system.query.QueryGenerator;
import org.jeecg.common.system.query.QueryRuleEnum;
import org.jeecg.common.util.oConvertUtils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;

import org.jeecg.modules.system.entity.JlOfficialTemplate;
import org.jeecg.modules.system.entity.JlOfficialTemplateVar;
import org.jeecg.modules.system.service.IJlOfficialTemplateService;
import org.jeecg.modules.system.service.IJlOfficialTemplateVarService;
import org.jeecgframework.poi.excel.ExcelImportUtil;
import org.jeecgframework.poi.excel.def.NormalExcelConstants;
import org.jeecgframework.poi.excel.entity.ExportParams;
import org.jeecgframework.poi.excel.entity.ImportParams;
import org.jeecgframework.poi.excel.view.JeecgEntityExcelView;
import org.jeecg.common.system.base.controller.JeecgController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.web.servlet.ModelAndView;
import com.alibaba.fastjson.JSON;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import org.jeecg.common.aspect.annotation.AutoLog;
import org.apache.shiro.authz.annotation.RequiresPermissions;
 /**
 * @Description: 公文模板主表
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Tag(name="公文模板主表")
@RestController
@RequestMapping("/official/jlOfficialTemplate")
@Slf4j
public class JlOfficialTemplateController extends JeecgController<JlOfficialTemplate, IJlOfficialTemplateService> {
	 @Autowired
	 private IJlOfficialTemplateService jlOfficialTemplateService;

	 @Autowired
	 private IJlOfficialTemplateVarService jlOfficialTemplateVarService;

	 /**
	  * 分页列表查询
	  * @param pageNo 页码
	  * @param pageSize 每页条数
	  * @param sysOfficialTemplate 查询条件
	  * @param request 请求对象
	  * @return 分页结果
	  */
	 @AutoLog(value = "公文模板-分页列表查询")
	 @GetMapping(value = "/list")
	 public Result<IPage<JlOfficialTemplate>> queryPageList(
			 @RequestParam(name="pageNo", defaultValue="1") Integer pageNo,
			 @RequestParam(name="pageSize", defaultValue="10") Integer pageSize,
			 JlOfficialTemplate sysOfficialTemplate,
			 HttpServletRequest request) {
		 Page<JlOfficialTemplate> page = new Page<>(pageNo, pageSize);
		 IPage<JlOfficialTemplate> pageList = jlOfficialTemplateService.queryPageList(page, sysOfficialTemplate);
		 return Result.OK(pageList);
	 }

	 /**
	  * 根据ID查询模板（含关联变量）
	  * @param id 模板ID
	  * @return 模板信息+变量列表
	  */
	 @AutoLog(value = "公文模板-根据ID查询")
	 @GetMapping(value = "/queryById")
	 public Result<Object> queryById(@RequestParam(name="id", required=true) String id) {
		 JlOfficialTemplate sysOfficialTemplate = jlOfficialTemplateService.getById(id);
		 if (sysOfficialTemplate == null) {
			 return Result.error("未找到对应模板");
		 }
		 // 查询关联变量
		 List<JlOfficialTemplateVar> varList = jlOfficialTemplateVarService.getVarListByTemplateId(id);
		 // 封装结果（模板信息+变量列表）
		 return Result.OK(varList);
	 }

	 /**
	  * 新增模板（含变量）
	  * @param sysOfficialTemplate 模板信息
	  * @param varList 变量列表（前端JSON提交）
	  * @return 新增结果
	  */
	 @AutoLog(value = "公文模板-新增")
	 @PostMapping(value = "/add")
	 public Result<JlOfficialTemplate> add(
			 @RequestBody JlOfficialTemplate sysOfficialTemplate,
			 @RequestParam(required = false) List<JlOfficialTemplateVar> varList) {
		 jlOfficialTemplateService.save(sysOfficialTemplate);
		 // 批量保存变量（如果有）
		 if (varList != null && !varList.isEmpty()) {
			 jlOfficialTemplateVarService.batchSaveVar(varList, sysOfficialTemplate.getId());
		 }
		 return Result.OK(sysOfficialTemplate);
	 }

	 /**
	  * 编辑模板（含变量）
	  * @param sysOfficialTemplate 模板信息
	  * @param varList 变量列表（前端JSON提交）
	  * @return 编辑结果
	  */
	 @AutoLog(value = "公文模板-编辑")
	 @PutMapping(value = "/edit")
	 public Result<JlOfficialTemplate> edit(
			 @RequestBody JlOfficialTemplate sysOfficialTemplate,
			 @RequestParam(required = false) List<JlOfficialTemplateVar> varList) {
		 jlOfficialTemplateService.updateById(sysOfficialTemplate);
		 // 批量保存变量（覆盖原有变量）
		 if (varList != null && !varList.isEmpty()) {
			 jlOfficialTemplateVarService.batchSaveVar(varList, sysOfficialTemplate.getId());
		 }
		 return Result.OK(sysOfficialTemplate);
	 }

	 /**
	  * 删除模板（含关联变量）
	  * @param id 模板ID
	  * @return 删除结果
	  */
	 @AutoLog(value = "公文模板-删除")
	 @DeleteMapping(value = "/delete")
	 public Result<String> delete(@RequestParam(name="id", required=true) String id) {
		 jlOfficialTemplateService.deleteTemplateAndVar(id);
		 return Result.OK("删除成功");
	 }

	 /**
	  * 复制模板
	  * @param id 原模板ID
	  * @return 新模板信息
	  */
	 @AutoLog(value = "公文模板-复制")
	 @GetMapping(value = "/copy")
	 public Result<JlOfficialTemplate> copyTemplate(@RequestParam(name="id", required=true) String id) {
		 JlOfficialTemplate copy = jlOfficialTemplateService.copyTemplate(id);
		 return Result.OK(copy);
	 }

	 /**
	  * 启用/禁用模板
	  * @param id 模板ID
	  * @param status 状态（0禁用，1启用）
	  * @return 操作结果
	  */
	 @AutoLog(value = "公文模板-启用/禁用")
	 @PutMapping(value = "/changeStatus")
	 public Result<String> changeStatus(
			 @RequestParam(name="id", required=true) String id,
			 @RequestParam(name="status", required=true) Integer status) {
		 JlOfficialTemplate template = new JlOfficialTemplate();
		 template.setId(id);
		 template.setStatus(status);
		 jlOfficialTemplateService.updateById(template);
		 return Result.OK(status == 1 ? "启用成功" : "禁用成功");
	 }
}
