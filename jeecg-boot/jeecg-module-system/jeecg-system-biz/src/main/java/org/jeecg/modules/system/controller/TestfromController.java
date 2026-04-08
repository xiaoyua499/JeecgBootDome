package org.jeecg.modules.system.controller;

import java.util.Arrays;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.jeecg.common.api.vo.Result;
import org.jeecg.common.aspect.annotation.AutoLog;
import org.jeecg.common.system.base.controller.JeecgController;
import org.jeecg.common.system.query.QueryGenerator;
import org.jeecg.modules.system.entity.Testfrom;
import org.jeecg.modules.system.service.ITestfromService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @Description: testFrom
 * @Author: jeecg-boot
 * @Date: 2026-04-08
 * @Version: V1.0
 */
@Tag(name = "testFrom")
@RestController
@RequestMapping("/testdomefrom/testfrom")
@Slf4j
public class TestfromController extends JeecgController<Testfrom, ITestfromService> {

    @Autowired
    private ITestfromService testfromService;

    /**
     * 分页列表查询
     */
    @Operation(summary = "testFrom-分页列表查询")
    @GetMapping("/list")
    public Result<IPage<Testfrom>> queryPageList(
        Testfrom testfrom,
        @RequestParam(name = "pageNo", defaultValue = "1") Integer pageNo,
        @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize,
        HttpServletRequest req
    ) {
        QueryWrapper<Testfrom> queryWrapper = QueryGenerator.initQueryWrapper(testfrom, req.getParameterMap());
        Page<Testfrom> page = new Page<>(pageNo, pageSize);
        IPage<Testfrom> pageList = testfromService.page(page, queryWrapper);
        return Result.OK(pageList);
    }

    /**
     * 添加
     */
    @AutoLog(value = "testFrom-添加")
    @Operation(summary = "testFrom-添加")
    @RequiresPermissions("testdomefrom:testfrom:add")
    @PostMapping("/add")
    public Result<String> add(@RequestBody Testfrom testfrom) {
        testfromService.save(testfrom);
        return Result.OK("添加成功！");
    }

    /**
     * 编辑
     */
    @AutoLog(value = "testFrom-编辑")
    @Operation(summary = "testFrom-编辑")
    @RequiresPermissions("testdomefrom:testfrom:edit")
    @RequestMapping(value = "/edit", method = {RequestMethod.PUT, RequestMethod.POST})
    public Result<String> edit(@RequestBody Testfrom testfrom) {
        testfromService.updateById(testfrom);
        return Result.OK("编辑成功!");
    }

    /**
     * 通过id删除
     */
    @AutoLog(value = "testFrom-通过id删除")
    @Operation(summary = "testFrom-通过id删除")
    @RequiresPermissions("testdomefrom:testfrom:delete")
    @DeleteMapping("/delete")
    public Result<String> delete(@RequestParam(name = "id", required = true) String id) {
        testfromService.removeById(id);
        return Result.OK("删除成功!");
    }

    /**
     * 批量删除
     */
    @AutoLog(value = "testFrom-批量删除")
    @Operation(summary = "testFrom-批量删除")
    @RequiresPermissions("testdomefrom:testfrom:deleteBatch")
    @DeleteMapping("/deleteBatch")
    public Result<String> deleteBatch(@RequestParam(name = "ids", required = true) String ids) {
        testfromService.removeByIds(Arrays.asList(ids.split(",")));
        return Result.OK("批量删除成功!");
    }

    /**
     * 通过id查询
     */
    @Operation(summary = "testFrom-通过id查询")
    @GetMapping("/queryById")
    public Result<Testfrom> queryById(@RequestParam(name = "id", required = true) String id) {
        Testfrom testfrom = testfromService.getById(id);
        if (testfrom == null) {
            return Result.error("未找到对应数据");
        }
        return Result.OK(testfrom);
    }

    /**
     * 导出excel
     */
    @RequiresPermissions("testdomefrom:testfrom:exportXls")
    @RequestMapping("/exportXls")
    public ModelAndView exportXls(HttpServletRequest request, Testfrom testfrom) {
        return super.exportXls(request, testfrom, Testfrom.class, "testFrom");
    }

    /**
     * 通过excel导入数据
     */
    @RequiresPermissions("testdomefrom:testfrom:importExcel")
    @RequestMapping(value = "/importExcel", method = RequestMethod.POST)
    public Result<?> importExcel(HttpServletRequest request, HttpServletResponse response) {
        return super.importExcel(request, response, Testfrom.class);
    }
}
