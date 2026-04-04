package org.jeecg.modules.cabinet.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.jeecg.modules.cabinet.dto.CabinetCreateFileDTO;
import org.jeecg.modules.cabinet.dto.CabinetCreateFolderDTO;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetRenameDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateIconDTO;
import org.jeecg.modules.cabinet.entity.CabinetItem;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetItemVO;

/**
 * 文件柜服务。
 */
public interface ICabinetService extends IService<CabinetItem> {

    CabinetBootstrapVO bootstrap(String scope);

    CabinetItemVO createFolder(CabinetCreateFolderDTO request);

    CabinetItemVO createFile(CabinetCreateFileDTO request);

    CabinetItemVO renameItem(CabinetRenameDTO request);

    CabinetItemVO updateIcon(CabinetUpdateIconDTO request);

    void moveItems(CabinetMoveDTO request);

    void copyItems(CabinetCopyDTO request);

    void deleteItems(String ids);
}
