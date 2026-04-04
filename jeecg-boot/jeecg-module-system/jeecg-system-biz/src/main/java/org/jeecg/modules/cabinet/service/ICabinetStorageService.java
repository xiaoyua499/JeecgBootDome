package org.jeecg.modules.cabinet.service;

/**
 * 文件柜物理文件存储服务。
 */
public interface ICabinetStorageService {

    /**
     * 删除物理文件。
     *
     * @param filePath 文件路径
     * @return 是否删除成功
     */
    boolean delete(String filePath);
}
