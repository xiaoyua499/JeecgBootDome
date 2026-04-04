package org.jeecg.modules.cabinet.service;

import java.io.InputStream;

/**
 * 文件柜物理文件存储服务。
 */
public interface ICabinetStorageService {

    /**
     * 打开物理文件流。
     *
     * @param filePath 文件路径
     * @return 文件输入流
     */
    InputStream openStream(String filePath);

    /**
     * 删除物理文件。
     *
     * @param filePath 文件路径
     * @return 是否删除成功
     */
    boolean delete(String filePath);
}
