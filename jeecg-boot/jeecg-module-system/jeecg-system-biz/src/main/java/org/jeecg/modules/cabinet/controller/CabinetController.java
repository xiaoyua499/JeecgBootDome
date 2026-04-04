package org.jeecg.modules.cabinet.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.jeecg.common.api.vo.Result;
import org.jeecg.modules.cabinet.dto.CabinetCreateFileDTO;
import org.jeecg.modules.cabinet.dto.CabinetCreateFolderDTO;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetFolderViewQueryDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetPreferenceDTO;
import org.jeecg.modules.cabinet.dto.CabinetRenameDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateIconDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateContentDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateOrderDTO;
import org.jeecg.modules.cabinet.service.ICabinetService;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetFolderViewVO;
import org.jeecg.modules.cabinet.vo.CabinetItemVO;
import org.jeecg.modules.cabinet.vo.CabinetPreferenceVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 文件柜控制器。
 */
@Tag(name = "文件柜")
@RestController
@RequestMapping("/sys/cabinet")
public class CabinetController {

    @Autowired
    private ICabinetService cabinetService;

    @Operation(summary = "文件柜-初始化")
    @GetMapping("/bootstrap")
    public Result<CabinetBootstrapVO> bootstrap(@RequestParam("scope") String scope) {
        return Result.OK(cabinetService.bootstrap(scope));
    }

    @Operation(summary = "文件柜-当前目录排序/分组视图")
    @GetMapping("/folder-view")
    public Result<CabinetFolderViewVO> folderView(CabinetFolderViewQueryDTO request) {
        return Result.OK(cabinetService.folderView(request));
    }

    @Operation(summary = "文件柜-视图偏好")
    @GetMapping("/preference")
    public Result<CabinetPreferenceVO> getPreference(@RequestParam("scope") String scope) {
        return Result.OK(cabinetService.getPreference(scope));
    }

    @Operation(summary = "文件柜-保存视图偏好")
    @PutMapping("/preference")
    public Result<CabinetPreferenceVO> updatePreference(@RequestBody CabinetPreferenceDTO request) {
        return Result.OK(cabinetService.updatePreference(request));
    }

    @Operation(summary = "文件柜-新建文件夹")
    @PostMapping("/folder")
    public Result<CabinetItemVO> createFolder(@RequestBody CabinetCreateFolderDTO request) {
        return Result.OK(cabinetService.createFolder(request));
    }

    @Operation(summary = "文件柜-新建文件元数据")
    @PostMapping("/file")
    public Result<CabinetItemVO> createFile(@RequestBody CabinetCreateFileDTO request) {
        return Result.OK(cabinetService.createFile(request));
    }

    @Operation(summary = "文件柜-重命名")
    @PutMapping("/rename")
    public Result<CabinetItemVO> rename(@RequestBody CabinetRenameDTO request) {
        return Result.OK(cabinetService.renameItem(request));
    }

    @Operation(summary = "文件柜-更新图标")
    @PutMapping("/icon")
    public Result<CabinetItemVO> updateIcon(@RequestBody CabinetUpdateIconDTO request) {
        return Result.OK(cabinetService.updateIcon(request));
    }

    @Operation(summary = "文件柜-更新文本文件内容")
    @PutMapping("/content")
    public Result<CabinetItemVO> updateContent(@RequestBody CabinetUpdateContentDTO request) {
        return Result.OK(cabinetService.updateFileContent(request));
    }

    @Operation(summary = "文件柜-手动排序")
    @PutMapping("/order")
    public Result<String> updateOrder(@RequestBody CabinetUpdateOrderDTO request) {
        cabinetService.updateItemOrder(request);
        return Result.OK("排序成功");
    }

    @Operation(summary = "文件柜-移动")
    @PutMapping("/move")
    public Result<String> move(@RequestBody CabinetMoveDTO request) {
        cabinetService.moveItems(request);
        return Result.OK("移动成功");
    }

    @Operation(summary = "文件柜-复制")
    @PostMapping("/copy")
    public Result<String> copy(@RequestBody CabinetCopyDTO request) {
        cabinetService.copyItems(request);
        return Result.OK("复制成功");
    }

    @Operation(summary = "文件柜-删除")
    @DeleteMapping("/delete")
    public Result<String> delete(@RequestParam("ids") String ids) {
        cabinetService.deleteItems(ids);
        return Result.OK("删除成功");
    }

    @Operation(summary = "文件柜-下载")
    @GetMapping("/download")
    public void download(@RequestParam("ids") String ids, HttpServletResponse response) {
        cabinetService.downloadItems(ids, response);
    }
}
