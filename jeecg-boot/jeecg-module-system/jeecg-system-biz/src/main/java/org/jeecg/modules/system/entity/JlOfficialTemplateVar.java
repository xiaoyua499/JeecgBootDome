package org.jeecg.modules.demo.official.entity;

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
 * @Description: 公文模板变量
 * @Author: jeecg-boot
 * @Date:   2026-04-09
 * @Version: V1.0
 */
@Data
@TableName("jl_official_template_var")
@Accessors(chain = true)
@EqualsAndHashCode(callSuper = false)
@Schema(description="公文模板变量")
public class JlOfficialTemplateVar implements Serializable {
    private static final long serialVersionUID = 1L;

	/**id*/
	@TableId(type = IdType.ASSIGN_ID)
    @Schema(description = "id")
    private java.lang.String id;
	/**模板ID（关联sys_official_template.id）*/
	@Excel(name = "模板ID（关联sys_official_template.id）", width = 15)
    @Schema(description = "模板ID（关联sys_official_template.id）")
    private java.lang.String templateId;
	/**变量名*/
	@Excel(name = "变量名", width = 15)
    @Schema(description = "变量名")
    private java.lang.String varName;
	/**占位符 {{unit_name}}*/
	@Excel(name = "占位符 {{unit_name}}", width = 15)
    @Schema(description = "占位符 {{unit_name}}")
    private java.lang.String varCode;
	/**变量说明*/
	@Excel(name = "变量说明", width = 15)
    @Schema(description = "变量说明")
    private java.lang.String varDesc;
	/**createTime*/
	@JsonFormat(timezone = "GMT+8",pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Schema(description = "createTime")
    private java.util.Date createTime;
	/**delFlag*/
	@Excel(name = "delFlag", width = 15)
    @Schema(description = "delFlag")
    @TableLogic
    private java.lang.Integer delFlag;
	/**租户ID（JeecgBoot必填，可选删除）*/
	@Excel(name = "租户ID（JeecgBoot必填，可选删除）", width = 15)
    @Schema(description = "租户ID（JeecgBoot必填，可选删除）")
    private java.lang.String tenantId;
}
