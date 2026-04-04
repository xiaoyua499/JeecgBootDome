package org.jeecg.modules.cabinet.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.jeecg.common.constant.CommonConstant;
import org.jeecg.common.util.MinioUtil;
import org.jeecg.common.util.oConvertUtils;
import org.jeecg.common.util.oss.OssBootUtil;
import org.jeecg.modules.cabinet.service.ICabinetStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
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
    public InputStream openStream(String filePath) {
        String normalizedPath = normalizePath(filePath);
        if (oConvertUtils.isEmpty(normalizedPath)) {
            return InputStream.nullInputStream();
        }
        try {
            if (CommonConstant.UPLOAD_TYPE_LOCAL.equals(uploadType)) {
                return openLocalFile(normalizedPath);
            }
            if (CommonConstant.UPLOAD_TYPE_MINIO.equals(uploadType)) {
                return openMinioFile(normalizedPath);
            }
            if (CommonConstant.UPLOAD_TYPE_OSS.equals(uploadType)) {
                return openOssFile(normalizedPath);
            }
            throw new IllegalStateException("未识别的上传类型: " + uploadType);
        } catch (Exception e) {
            log.error("读取物理文件失败, uploadType={}, filePath={}", uploadType, normalizedPath, e);
            throw new IllegalStateException("读取物理文件失败", e);
        }
    }

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

    private InputStream openLocalFile(String relativePath) throws Exception {
        File target = new File(uploadPath, relativePath.replace("/", File.separator));
        if (!target.exists() || !target.isFile()) {
            throw new IllegalStateException("本地文件不存在: " + relativePath);
        }
        return new BufferedInputStream(new FileInputStream(target));
    }

    private void deleteMinioFile(String filePath) {
        MinioLocation location = resolveMinioLocation(filePath);
        String bucketName = location.getBucketName();
        String objectName = location.getObjectName();
        if (oConvertUtils.isEmpty(bucketName) || oConvertUtils.isEmpty(objectName)) {
            log.warn("Minio 删除参数不完整，跳过删除: bucket={}, object={}", bucketName, objectName);
            return;
        }
        MinioUtil.removeObject(bucketName, objectName);
    }

    private InputStream openMinioFile(String filePath) throws Exception {
        MinioLocation location = resolveMinioLocation(filePath);
        if (oConvertUtils.isEmpty(location.getBucketName()) || oConvertUtils.isEmpty(location.getObjectName())) {
            throw new IllegalStateException("Minio 文件路径不完整: " + filePath);
        }
        InputStream stream = MinioUtil.getMinioFile(location.getBucketName(), location.getObjectName());
        if (stream == null) {
            throw new IllegalStateException("Minio 文件不存在: " + filePath);
        }
        return stream;
    }

    private InputStream openOssFile(String filePath) {
        InputStream stream = OssBootUtil.getOssFile(filePath, null);
        if (stream == null) {
            throw new IllegalStateException("OSS 文件不存在: " + filePath);
        }
        return stream;
    }

    private MinioLocation resolveMinioLocation(String filePath) {
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
        return new MinioLocation(bucketName, objectName);
    }

    private String normalizePath(String filePath) {
        if (oConvertUtils.isEmpty(filePath)) {
            return null;
        }
        return filePath.trim().replace("\\", "/");
    }

    private static class MinioLocation {

        private final String bucketName;
        private final String objectName;

        private MinioLocation(String bucketName, String objectName) {
            this.bucketName = bucketName;
            this.objectName = objectName;
        }

        private String getBucketName() {
            return bucketName;
        }

        private String getObjectName() {
            return objectName;
        }
    }
}
