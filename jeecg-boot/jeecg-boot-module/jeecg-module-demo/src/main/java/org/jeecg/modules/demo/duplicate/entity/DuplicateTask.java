package org.jeecg.modules.demo.duplicate.entity;

import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.util.Date;
import java.math.BigDecimal;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import org.jeecg.common.constant.ProvinceCityArea;
import org.jeecg.common.util.SpringContextUtils;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.format.annotation.DateTimeFormat;
import org.jeecgframework.poi.excel.annotation.Excel;
import org.jeecg.common.aspect.annotation.Dict;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * @Description: 查重任务表
 * @Author: jeecg-boot
 * @Date:   2026-05-08
 * @Version: V1.0
 */
@Data
@TableName("duplicate_task")
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = false)
@Schema(description="查重任务表")
public class DuplicateTask implements Serializable {
    private static final long serialVersionUID = 1L;

	/**主键*/
	@TableId(type = IdType.ASSIGN_ID)
    @Schema(description = "主键")
    private String id;
	/**创建人*/
    @Schema(description = "创建人")
    private String createBy;
	/**创建日期*/
	@JsonFormat(timezone = "GMT+8",pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建日期")
    private Date createTime;
	/**更新人*/
    @Schema(description = "更新人")
    private String updateBy;
	/**更新日期*/
	@JsonFormat(timezone = "GMT+8",pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新日期")
    private Date updateTime;
	/**所属部门*/
    @Schema(description = "所属部门")
    private String sysOrgCode;
	/**任务名称*/
	@Excel(name = "任务名称", width = 15)
    @Schema(description = "任务名称")
    private String taskName;
	/**文件ID*/
	@Excel(name = "文件ID", width = 15)
    @Schema(description = "文件ID")
    private String fileId;
	/**文件名称*/
	@Excel(name = "文件名称", width = 15)
    @Schema(description = "文件名称")
    private String fileName;
	/**文件后缀*/
	@Excel(name = "文件后缀", width = 15)
    @Schema(description = "文件后缀")
    private String fileExt;
	/**文件大小*/
	@Excel(name = "文件大小", width = 15)
    @Schema(description = "文件大小")
    private Long fileSize;
	/**文件MD5*/
	@Excel(name = "文件MD5", width = 15)
    @Schema(description = "文件MD5")
    private String fileMd5;
	/**是否立即查重*/
    @Excel(name = "是否立即查重", width = 15,replace = {"是_Y","否_N"} )
    @Schema(description = "是否立即查重")
    private String checkNow;
	/**任务状态*/
	@Excel(name = "任务状态", width = 15, dicCode = "duplicate_task_status")
	@Dict(dicCode = "duplicate_task_status")
    @Schema(description = "任务状态")
    private String status;
	/**任务进度*/
	@Excel(name = "任务进度", width = 15)
    @Schema(description = "任务进度")
    private Integer progress;
	/**当前步骤*/
	@Excel(name = "当前步骤", width = 15, dicCode = "duplicate_current_step")
	@Dict(dicCode = "duplicate_current_step")
    @Schema(description = "当前步骤")
    private String currentStep;
	/**备注*/
	@Excel(name = "备注", width = 15)
    @Schema(description = "备注")
    private String remark;
}
