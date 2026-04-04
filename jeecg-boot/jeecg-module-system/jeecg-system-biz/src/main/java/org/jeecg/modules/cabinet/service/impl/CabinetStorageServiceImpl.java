package org.jeecg.modules.cabinet.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.jeecg.common.constant.CommonConstant;
import org.jeecg.common.util.MinioUtil;
import org.jeecg.common.util.oConvertUtils;
import org.jeecg.common.util.oss.OssBootUtil;
import org.jeecg.modules.cabinet.service.ICabinetStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;

/**
 * 文件柜物理存储处理。
 */
@Slf4j
@Service
public class CabinetStorageServiceImpl implements ICabinetStorageService {

    @Value("${jeecg.uploadType}")
    private String uploadType;

    @Value("${jeecg.path.upload}")
    private String uploadPath;

    @Override
    public boolean delete(String filePath) {
        String normalizedPath = normalizePath(filePath);
        if (oConvertUtils.isEmpty(normalizedPath)) {
            return true;
        }
        try {
            if (CommonConstant.UPLOAD_TYPE_LOCAL.equals(uploadType)) {
                return deleteLocalFile(normalizedPath);
            }
            if (CommonConstant.UPLOAD_TYPE_MINIO.equals(uploadType)) {
                deleteMinioFile(normalizedPath);
                return true;
            }
            if (CommonConstant.UPLOAD_TYPE_OSS.equals(uploadType)) {
                OssBootUtil.deleteUrl(normalizedPath);
                return true;
            }
            log.warn("未识别的上传类型，跳过物理文件删除: uploadType={}, filePath={}", uploadType, normalizedPath);
            return false;
        } catch (Exception e) {
            log.error("删除物理文件失败, uploadType={}, filePath={}", uploadType, normalizedPath, e);
            return false;
        }
    }

    private boolean deleteLocalFile(String relativePath) {
        File target = new File(uploadPath, relativePath.replace("/", File.separator));
        if (!target.exists()) {
            return true;
        }
        return target.delete();
    }

    private void deleteMinioFile(String filePath) {
        String bucketName = MinioUtil.getBucketName();
        String objectName = filePath;
        try {
            if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                URI uri = URI.create(filePath);
                String[] segments = uri.getPath().replaceFirst("^/+", "").split("/");
                if (segments.length >= 2) {
                    bucketName = segments[0];
                    objectName = uri.getPath().replaceFirst("^/" + bucketName + "/?", "");
                }
            }
        } catch (Exception e) {
            log.warn("解析 Minio 文件路径失败，按默认桶处理: {}", filePath, e);
        }
        if (oConvertUtils.isEmpty(bucketName) || oConvertUtils.isEmpty(objectName)) {
            log.warn("Minio 删除参数不完整，跳过删除: bucket={}, object={}", bucketName, objectName);
            return;
        }
        MinioUtil.removeObject(bucketName, objectName);
    }

    private String normalizePath(String filePath) {
        if (oConvertUtils.isEmpty(filePath)) {
            return null;
        }
        return filePath.trim().replace("\\", "/");
    }
}
