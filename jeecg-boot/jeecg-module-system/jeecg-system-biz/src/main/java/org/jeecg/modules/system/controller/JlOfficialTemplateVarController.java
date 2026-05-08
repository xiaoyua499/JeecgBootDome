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
import org.jeecg.modules.demo.official.entity.JlOfficialTemplateVar;
import org.jeecg.modules.demo.official.service.IJlOfficialTemplateVarService;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;

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
 * @Description: 公文模板变量
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Tag(name="公文模板变量")
@RestController
@RequestMapping("/official/jlOfficialTemplateVar")
@Slf4j
public class JlOfficialTemplateVarController extends JeecgController<JlOfficialTemplateVar, IJlOfficialTemplateVarService> {
	@Autowired
	private IJlOfficialTemplateVarService jlOfficialTemplateVarService;
	
	/**
	 * 分页列表查询
	 *
	 * @param jlOfficialTemplateVar
	 * @param pageNo
	 * @param pageSize
	 * @param req
	 * @return
	 */
	//@AutoLog(value = "公文模板变量-分页列表查询")
	@Operation(summary="公文模板变量-分页列表查询")
	@GetMapping(value = "/list")
	public Result<IPage<JlOfficialTemplateVar>> queryPageList(JlOfficialTemplateVar jlOfficialTemplateVar,
								   @RequestParam(name="pageNo", defaultValue="1") Integer pageNo,
								   @RequestParam(name="pageSize", defaultValue="10") Integer pageSize,
								   HttpServletRequest req) {


        QueryWrapper<JlOfficialTemplateVar> queryWrapper = QueryGenerator.initQueryWrapper(jlOfficialTemplateVar, req.getParameterMap());
		Page<JlOfficialTemplateVar> page = new Page<JlOfficialTemplateVar>(pageNo, pageSize);
		IPage<JlOfficialTemplateVar> pageList = jlOfficialTemplateVarService.page(page, queryWrapper);
		return Result.OK(pageList);
	}
	
	/**
	 *   添加
	 *
	 * @param jlOfficialTemplateVar
	 * @return
	 */
	@AutoLog(value = "公文模板变量-添加")
	@Operation(summary="公文模板变量-添加")
	@RequiresPermissions("official:jl_official_template_var:add")
	@PostMapping(value = "/add")
	public Result<String> add(@RequestBody JlOfficialTemplateVar jlOfficialTemplateVar) {
		jlOfficialTemplateVarService.save(jlOfficialTemplateVar);

		return Result.OK("添加成功！");
	}
	
	/**
	 *  编辑
	 *
	 * @param jlOfficialTemplateVar
	 * @return
	 */
	@AutoLog(value = "公文模板变量-编辑")
	@Operation(summary="公文模板变量-编辑")
	@RequiresPermissions("official:jl_official_template_var:edit")
	@RequestMapping(value = "/edit", method = {RequestMethod.PUT,RequestMethod.POST})
	public Result<String> edit(@RequestBody JlOfficialTemplateVar jlOfficialTemplateVar) {
		jlOfficialTemplateVarService.updateById(jlOfficialTemplateVar);
		return Result.OK("编辑成功!");
	}
	
	/**
	 *   通过id删除
	 *
	 * @param id
	 * @return
	 */
	@AutoLog(value = "公文模板变量-通过id删除")
	@Operation(summary="公文模板变量-通过id删除")
	@RequiresPermissions("official:jl_official_template_var:delete")
	@DeleteMapping(value = "/delete")
	public Result<String> delete(@RequestParam(name="id",required=true) String id) {
		jlOfficialTemplateVarService.removeById(id);
		return Result.OK("删除成功!");
	}
	
	/**
	 *  批量删除
	 *
	 * @param ids
	 * @return
	 */
	@AutoLog(value = "公文模板变量-批量删除")
	@Operation(summary="公文模板变量-批量删除")
	@RequiresPermissions("official:jl_official_template_var:deleteBatch")
	@DeleteMapping(value = "/deleteBatch")
	public Result<String> deleteBatch(@RequestParam(name="ids",required=true) String ids) {
		this.jlOfficialTemplateVarService.removeByIds(Arrays.asList(ids.split(",")));
		return Result.OK("批量删除成功!");
	}
	
	/**
	 * 通过id查询
	 *
	 * @param id
	 * @return
	 */
	//@AutoLog(value = "公文模板变量-通过id查询")
	@Operation(summary="公文模板变量-通过id查询")
	@GetMapping(value = "/queryById")
	public Result<JlOfficialTemplateVar> queryById(@RequestParam(name="id",required=true) String id) {
		JlOfficialTemplateVar jlOfficialTemplateVar = jlOfficialTemplateVarService.getById(id);
		if(jlOfficialTemplateVar==null) {
			return Result.error("未找到对应数据");
		}
		return Result.OK(jlOfficialTemplateVar);
	}

    /**
    * 导出excel
    *
    * @param request
    * @param jlOfficialTemplateVar
    */
    @RequiresPermissions("official:jl_official_template_var:exportXls")
    @RequestMapping(value = "/exportXls")
    public ModelAndView exportXls(HttpServletRequest request, JlOfficialTemplateVar jlOfficialTemplateVar) {
        return super.exportXls(request, jlOfficialTemplateVar, JlOfficialTemplateVar.class, "公文模板变量");
    }

    /**
      * 通过excel导入数据
    *
    * @param request
    * @param response
    * @return
    */
    @RequiresPermissions("official:jl_official_template_var:importExcel")
    @RequestMapping(value = "/importExcel", method = RequestMethod.POST)
    public Result<?> importExcel(HttpServletRequest request, HttpServletResponse response) {
        return super.importExcel(request, response, JlOfficialTemplateVar.class);
    }

}
