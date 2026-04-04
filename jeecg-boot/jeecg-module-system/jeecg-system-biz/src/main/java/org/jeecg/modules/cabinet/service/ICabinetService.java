package org.jeecg.modules.cabinet.service;

import com.baomidou.mybatisplus.extension.service.IService;
import jakarta.servlet.http.HttpServletResponse;
import org.jeecg.modules.cabinet.dto.CabinetCreateFileDTO;
import org.jeecg.modules.cabinet.dto.CabinetCreateFolderDTO;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetFolderViewQueryDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetPreferenceDTO;
import org.jeecg.modules.cabinet.dto.CabinetRenameDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateIconDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateOrderDTO;
import org.jeecg.modules.cabinet.entity.CabinetItem;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetFolderViewVO;
import org.jeecg.modules.cabinet.vo.CabinetItemVO;
import org.jeecg.modules.cabinet.vo.CabinetPreferenceVO;

/**
 * 文件柜服务。
 */
public interface ICabinetService extends IService<CabinetItem> {

    CabinetBootstrapVO bootstrap(String scope);

    CabinetFolderViewVO folderView(CabinetFolderViewQueryDTO request);

    CabinetPreferenceVO getPreference(String scope);

    CabinetPreferenceVO updatePreference(CabinetPreferenceDTO request);

    CabinetItemVO createFolder(CabinetCreateFolderDTO request);

    CabinetItemVO createFile(CabinetCreateFileDTO request);

    CabinetItemVO renameItem(CabinetRenameDTO request);

    CabinetItemVO updateIcon(CabinetUpdateIconDTO request);

    void updateItemOrder(CabinetUpdateOrderDTO request);

    void moveItems(CabinetMoveDTO request);

    void copyItems(CabinetCopyDTO request);

    void deleteItems(String ids);

    void downloadItems(String ids, HttpServletResponse response);
}
