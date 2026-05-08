package org.jeecg.modules.system.entity;

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
 * @Description: 公文模板主表
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Data
@TableName("jl_official_template")
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = false)
@Schema(description="公文模板主表")
public class JlOfficialTemplate implements Serializable {
    private static final long serialVersionUID = 1L;

	/**模板ID*/
	@TableId(type = IdType.ASSIGN_ID)
    @Schema(description = "模板ID")
    private java.lang.String id;
	/**模板名称*/
	@Excel(name = "模板名称", width = 15)
    @Schema(description = "模板名称")
    private java.lang.String templateName;
	/**模板编码（如 NOTICE001）*/
	@Excel(name = "模板编码（如 NOTICE001）", width = 15)
    @Schema(description = "模板编码（如 NOTICE001）")
    private java.lang.String templateCode;
	/**公文类型：通知/请示/报告/函/决定/纪要*/
	@Excel(name = "公文类型：通知/请示/报告/函/决定/纪要", width = 15, dicCode = "doc_type")
	@Dict(dicCode = "doc_type")
    @Schema(description = "公文类型：通知/请示/报告/函/决定/纪要")
    private java.lang.String docType;
	/**级别：上行文/下行文/平行文*/
	@Excel(name = "级别：上行文/下行文/平行文", width = 15, dicCode = "doc_level")
	@Dict(dicCode = "doc_level")
    @Schema(description = "级别：上行文/下行文/平行文")
    private java.lang.String level;
	/**模板完整HTML内容（Tinymce生成）*/
	@Excel(name = "模板完整HTML内容（Tinymce生成）", width = 15)
    @Schema(description = "模板完整HTML内容（Tinymce生成）")
    private java.lang.String contentHtml;
	/**备用：Word兼容富文本*/
	@Excel(name = "备用：Word兼容富文本", width = 15)
    @Schema(description = "备用：Word兼容富文本")
    private java.lang.String contentWord;
	/**状态：0禁用 1启用*/
	@Excel(name = "状态：0禁用 1启用", width = 15)
    @Schema(description = "状态：0禁用 1启用")
    private java.lang.Integer status;
	/**排序*/
	@Excel(name = "排序", width = 15)
    @Schema(description = "排序")
    private java.lang.Integer sortNo;
	/**备注*/
	@Excel(name = "备注", width = 15)
    @Schema(description = "备注")
    private java.lang.String remark;
	/**创建人*/
    @Schema(description = "创建人")
    private java.lang.String createBy;
	/**创建时间*/
	@JsonFormat(timezone = "GMT+8",pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Schema(description = "创建时间")
    private java.util.Date createTime;
	/**更新人*/
    @Schema(description = "更新人")
    private java.lang.String updateBy;
	/**更新时间*/
	@JsonFormat(timezone = "GMT+8",pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Schema(description = "更新时间")
    private java.util.Date updateTime;
	/**删除标识 0正常 1删除*/
	@Excel(name = "删除标识 0正常 1删除", width = 15)
    @Schema(description = "删除标识 0正常 1删除")
    @TableLogic
    private java.lang.Integer delFlag;
	/**租户ID（JeecgBoot必填，可选删除）*/
	@Excel(name = "租户ID（JeecgBoot必填，可选删除）", width = 15)
    @Schema(description = "租户ID（JeecgBoot必填，可选删除）")
    private java.lang.String tenantId;
}
