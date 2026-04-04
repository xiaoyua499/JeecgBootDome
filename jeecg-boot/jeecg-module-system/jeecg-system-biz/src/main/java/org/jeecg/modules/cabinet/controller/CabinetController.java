package org.jeecg.modules.cabinet.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jeecg.common.api.vo.Result;
import org.jeecg.modules.cabinet.dto.CabinetCreateFileDTO;
import org.jeecg.modules.cabinet.dto.CabinetCreateFolderDTO;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetRenameDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateIconDTO;
import org.jeecg.modules.cabinet.service.ICabinetService;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetItemVO;
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
}
