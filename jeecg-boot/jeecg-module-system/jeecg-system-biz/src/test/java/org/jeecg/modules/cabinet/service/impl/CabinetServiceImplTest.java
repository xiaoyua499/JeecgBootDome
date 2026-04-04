package org.jeecg.modules.cabinet.service.impl;

import org.jeecg.common.exception.JeecgBootException;
import org.jeecg.modules.cabinet.constant.CabinetConstant;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.entity.CabinetItem;
import org.jeecg.modules.cabinet.model.CabinetAccessContext;
import org.jeecg.modules.cabinet.service.ICabinetStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CabinetServiceImplTest {

    @Test
    void moveItemsRenamesOnConflictAndRefreshesParentState() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        service.put(folder("source", null, "来源目录", CabinetConstant.HAS_CHILD_YES, 10));
        service.put(folder("target", null, "目标目录", CabinetConstant.HAS_CHILD_YES, 20));
        service.put(file("file-source", "source", "report.txt", "cabinet/file/report.txt", 10));
        service.put(file("file-target", "target", "report.txt", "cabinet/file/report-2.txt", 10));

        service.moveItems(move(List.of("file-source"), "target"));

        CabinetItem moved = service.getById("file-source");
        assertThat(moved.getParentId()).isEqualTo("target");
        assertThat(moved.getName()).isEqualTo("report - 副本.txt");
        assertThat(service.getById("source").getHasChild()).isEqualTo(CabinetConstant.HAS_CHILD_NO);
        assertThat(service.getById("target").getHasChild()).isEqualTo(CabinetConstant.HAS_CHILD_YES);
    }

    @Test
    void moveItemsRejectsMovingFolderIntoOwnDescendant() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        service.put(folder("parent", null, "父目录", CabinetConstant.HAS_CHILD_YES, 10));
        service.put(folder("child", "parent", "子目录", CabinetConstant.HAS_CHILD_NO, 10));

        assertThatThrownBy(() -> service.moveItems(move(List.of("parent"), "child")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不能将文件夹移动到自身或其子文件夹中");
    }

    @Test
    void copyItemsClonesWholeTreeAndKeepsSharedFileReference() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        service.put(folder("docs", null, "文档", CabinetConstant.HAS_CHILD_YES, 10));
        service.put(folder("images", "docs", "图片", CabinetConstant.HAS_CHILD_YES, 10));
        service.put(file("photo", "images", "cover.png", "cabinet/file/cover.png", 10));

        service.copyItems(copy(List.of("docs"), CabinetConstant.ROOT_PARENT_ID));

        List<CabinetItem> rootFolders = service.items().stream()
            .filter(item -> CabinetConstant.ITEM_TYPE_FOLDER.equals(item.getItemType()) && item.getParentId() == null)
            .collect(Collectors.toList());
        assertThat(rootFolders).hasSize(2);

        CabinetItem clonedRoot = rootFolders.stream()
            .filter(item -> !"docs".equals(item.getId()))
            .findFirst()
            .orElseThrow();
        assertThat(clonedRoot.getName()).isEqualTo("文档 - 副本");

        CabinetItem clonedChildFolder = service.items().stream()
            .filter(item -> clonedRoot.getId().equals(item.getParentId()) && CabinetConstant.ITEM_TYPE_FOLDER.equals(item.getItemType()))
            .findFirst()
            .orElseThrow();
        CabinetItem clonedFile = service.items().stream()
            .filter(item -> clonedChildFolder.getId().equals(item.getParentId()) && CabinetConstant.ITEM_TYPE_FILE.equals(item.getItemType()))
            .findFirst()
            .orElseThrow();

        assertThat(clonedChildFolder.getName()).isEqualTo("图片");
        assertThat(clonedFile.getName()).isEqualTo("cover.png");
        assertThat(clonedFile.getFilePath()).isEqualTo("cabinet/file/cover.png");
    }

    @Test
    void deleteItemsDeletesPhysicalFileOnlyAfterLastReferenceRemoved() {
        InMemoryCabinetService service = new InMemoryCabinetService();
        RecordingStorageService storageService = service.storageService();

        service.put(file("file-a", null, "共享文件A.txt", "cabinet/file/shared.txt", 10));
        service.put(file("file-b", null, "共享文件B.txt", "cabinet/file/shared.txt", 20));

        service.deleteItems("file-a");
        assertThat(service.items()).hasSize(1);
        assertThat(storageService.deletedPaths()).isEmpty();

        service.deleteItems("file-b");
        assertThat(service.items()).isEmpty();
        assertThat(storageService.deletedPaths()).containsExactly("cabinet/file/shared.txt");
    }

    private static CabinetMoveDTO move(List<String> itemIds, String targetParentId) {
        CabinetMoveDTO request = new CabinetMoveDTO();
        request.setItemIds(itemIds);
        request.setTargetParentId(targetParentId);
        return request;
    }

    private static CabinetCopyDTO copy(List<String> itemIds, String targetParentId) {
        CabinetCopyDTO request = new CabinetCopyDTO();
        request.setItemIds(itemIds);
        request.setTargetParentId(targetParentId);
        return request;
    }

    private static CabinetItem folder(String id, String parentId, String name, String hasChild, int sortNo) {
        return baseItem(id, parentId, CabinetConstant.ITEM_TYPE_FOLDER, name, sortNo)
            .setExt(CabinetConstant.ITEM_TYPE_FOLDER)
            .setHasChild(hasChild)
            .setSizeBytes(0L);
    }

    private static CabinetItem file(String id, String parentId, String name, String filePath, int sortNo) {
        int dotIndex = name.lastIndexOf('.');
        String ext = dotIndex > 0 ? name.substring(dotIndex + 1) : "file";
        return baseItem(id, parentId, CabinetConstant.ITEM_TYPE_FILE, name, sortNo)
            .setExt(ext)
            .setFilePath(filePath)
            .setHasChild(CabinetConstant.HAS_CHILD_NO)
            .setSizeBytes(100L);
    }

    private static CabinetItem baseItem(String id, String parentId, String itemType, String name, int sortNo) {
        CabinetItem item = new CabinetItem();
        item.setId(id);
        item.setParentId(parentId);
        item.setScope(CabinetConstant.SCOPE_PRIVATE);
        item.setOwnerKey("alice");
        item.setTenantId(0);
        item.setItemType(itemType);
        item.setName(name);
        item.setSortNo(sortNo);
        return item;
    }

    private static class InMemoryCabinetService extends CabinetServiceImpl {

        private final Map<String, CabinetItem> items = new LinkedHashMap<>();
        private final RecordingStorageService storageService = new RecordingStorageService();

        private InMemoryCabinetService() {
            ReflectionTestUtils.setField(this, "cabinetStorageService", storageService);
        }

        void put(CabinetItem item) {
            items.put(item.getId(), item);
        }

        List<CabinetItem> items() {
            return new ArrayList<>(items.values());
        }

        RecordingStorageService storageService() {
            return storageService;
        }

        @Override
        protected CabinetAccessContext resolveAccessContext(String scope, boolean writable) {
            return new CabinetAccessContext(CabinetConstant.SCOPE_PRIVATE, "alice", 0, null, true);
        }

        @Override
        public CabinetItem getById(Serializable id) {
            return items.get(String.valueOf(id));
        }

        @Override
        protected List<CabinetItem> listCabinetItems(CabinetAccessContext context) {
            return items.values().stream()
                .filter(item -> Objects.equals(item.getScope(), context.getScope()))
                .filter(item -> Objects.equals(item.getOwnerKey(), context.getOwnerKey()))
                .filter(item -> Objects.equals(item.getTenantId(), context.getTenantId()))
                .sorted(defaultItemComparator())
                .collect(Collectors.toList());
        }

        @Override
        public boolean save(CabinetItem entity) {
            items.put(entity.getId(), entity);
            return true;
        }

        @Override
        public boolean saveBatch(Collection<CabinetItem> entityList) {
            entityList.forEach(this::save);
            return true;
        }

        @Override
        public boolean updateById(CabinetItem entity) {
            items.put(entity.getId(), entity);
            return true;
        }

        @Override
        public boolean removeByIds(Collection<?> list) {
            list.forEach(id -> items.remove(String.valueOf(id)));
            return true;
        }

        @Override
        protected void refreshParentHasChild(String parentId) {
            if (parentId == null) {
                return;
            }
            CabinetItem parent = items.get(parentId);
            if (parent == null) {
                return;
            }
            boolean hasChild = items.values().stream().anyMatch(item -> parentId.equals(item.getParentId()));
            parent.setHasChild(hasChild ? CabinetConstant.HAS_CHILD_YES : CabinetConstant.HAS_CHILD_NO);
        }
    }

    private static class RecordingStorageService implements ICabinetStorageService {

        private final List<String> deletedPaths = new ArrayList<>();

        @Override
        public boolean delete(String filePath) {
            deletedPaths.add(filePath);
            return true;
        }

        List<String> deletedPaths() {
            return deletedPaths;
        }
    }
}
