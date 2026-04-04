package org.jeecg.modules.cabinet.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * 文件柜项目视图。
 */
@Data
public class CabinetItemVO {

    private String id;

    private String parentId;

    private String scope;

    private String itemType;

    private String name;

    private String ext;

    private String filePath;

    private Long sizeBytes;

    private Integer sortNo;

    private String iconKey;

    private String customIconPath;

    private String hasChild;

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createTime;

    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updateTime;
}
