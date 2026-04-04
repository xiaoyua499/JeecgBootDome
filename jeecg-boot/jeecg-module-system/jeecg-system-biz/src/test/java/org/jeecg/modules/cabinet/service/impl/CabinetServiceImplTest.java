package org.jeecg.modules.cabinet.service.impl;

import org.jeecg.common.exception.JeecgBootException;
import org.jeecg.modules.cabinet.constant.CabinetConstant;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetFolderViewQueryDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetPreferenceDTO;
import org.jeecg.modules.cabinet.entity.CabinetItem;
import org.jeecg.modules.cabinet.entity.CabinetPreference;
import org.jeecg.modules.cabinet.model.CabinetAccessContext;
import org.jeecg.modules.cabinet.dto.CabinetUpdateOrderDTO;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetFolderViewVO;
import org.jeecg.modules.cabinet.vo.CabinetPreferenceVO;
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
import java.util.UUID;
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

    @Test
    void bootstrapPublicCabinetReturnsItemsAcrossTenants() {
        InMemoryCabinetService service = new InMemoryCabinetService(
            new CabinetAccessContext(CabinetConstant.SCOPE_PUBLIC, CabinetConstant.OWNER_KEY_PUBLIC, CabinetConstant.SHARED_TENANT_ID, null, false)
        );

        CabinetItem sharedFromAdminTenant = file("public-file", null, "共享制度.docx", "cabinet/file/shared.docx", 10);
        sharedFromAdminTenant.setScope(CabinetConstant.SCOPE_PUBLIC);
        sharedFromAdminTenant.setOwnerKey(CabinetConstant.OWNER_KEY_PUBLIC);
        sharedFromAdminTenant.setTenantId(1000);
        service.put(sharedFromAdminTenant);

        CabinetBootstrapVO bootstrap = service.bootstrap(CabinetConstant.SCOPE_PUBLIC);

        assertThat(bootstrap.getItems()).hasSize(1);
        assertThat(bootstrap.getItems().get(0).getName()).isEqualTo("共享制度.docx");
    }

    @Test
    void folderViewSortsCurrentFolderByNameDescending() {
        InMemoryCabinetService service = new InMemoryCabinetService();
        service.put(file("alpha", null, "Alpha.txt", "cabinet/file/alpha.txt", 20));
        service.put(file("beta", null, "Beta.txt", "cabinet/file/beta.txt", 10));
        service.put(file("child", "folder", "Inside.txt", "cabinet/file/inside.txt", 10));
        service.put(folder("folder", null, "Folder", CabinetConstant.HAS_CHILD_YES, 30));

        CabinetFolderViewVO view = service.folderView(folderView(CabinetConstant.SCOPE_PRIVATE, CabinetConstant.ROOT_PARENT_ID, "name", "desc", "none"));

        assertThat(view.getItems()).extracting("name").containsExactly("Folder", "Beta.txt", "Alpha.txt");
        assertThat(view.getGroups()).hasSize(1);
        assertThat(view.getGroups().get(0).getItems()).hasSize(3);
    }

    @Test
    void folderViewGroupsCurrentFolderByType() {
        InMemoryCabinetService service = new InMemoryCabinetService();
        service.put(folder("docs", null, "文档", CabinetConstant.HAS_CHILD_NO, 10));
        service.put(file("a", null, "A.txt", "cabinet/file/a.txt", 20));
        service.put(file("b", null, "B.txt", "cabinet/file/b.txt", 30));

        CabinetFolderViewVO view = service.folderView(folderView(CabinetConstant.SCOPE_PRIVATE, CabinetConstant.ROOT_PARENT_ID, "manual", "asc", "type"));

        assertThat(view.getGroups()).hasSize(2);
        assertThat(view.getGroups().get(0).getTitle()).isEqualTo("文件夹");
        assertThat(view.getGroups().get(0).getItems()).extracting("name").containsExactly("文档");
        assertThat(view.getGroups().get(1).getTitle()).isEqualTo("文件");
        assertThat(view.getGroups().get(1).getItems()).extracting("name").containsExactly("A.txt", "B.txt");
    }

    @Test
    void updateItemOrderPersistsCurrentFolderSortNumbers() {
        InMemoryCabinetService service = new InMemoryCabinetService();
        service.put(file("a", null, "A.txt", "cabinet/file/a.txt", 10));
        service.put(file("b", null, "B.txt", "cabinet/file/b.txt", 20));

        service.updateItemOrder(updateOrder(CabinetConstant.ROOT_PARENT_ID, List.of(
            order("a", 30),
            order("b", 10)
        )));

        assertThat(service.getById("a").getSortNo()).isEqualTo(30);
        assertThat(service.getById("b").getSortNo()).isEqualTo(10);
    }

    @Test
    void preferenceIsStoredPerUserAndScope() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        CabinetPreferenceVO privatePreference = service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "name", "desc", "size", "table", "small"));
        CabinetPreferenceVO publicPreference = service.updatePreference(preference(CabinetConstant.SCOPE_PUBLIC, "updateTime", "asc", "none", "grid", "large"));

        assertThat(privatePreference.getSortField()).isEqualTo("name");
        assertThat(privatePreference.getSortOrder()).isEqualTo("desc");
        assertThat(privatePreference.getGroupField()).isEqualTo("size");
        assertThat(privatePreference.getViewMode()).isEqualTo("table");
        assertThat(privatePreference.getGridIconSize()).isEqualTo("small");

        assertThat(publicPreference.getSortField()).isEqualTo("updateTime");
        assertThat(publicPreference.getSortOrder()).isEqualTo("asc");
        assertThat(publicPreference.getGroupField()).isEqualTo("none");
        assertThat(publicPreference.getViewMode()).isEqualTo("grid");
        assertThat(publicPreference.getGridIconSize()).isEqualTo("large");

        assertThat(service.getPreference(CabinetConstant.SCOPE_PRIVATE).getSortField()).isEqualTo("name");
        assertThat(service.getPreference(CabinetConstant.SCOPE_PUBLIC).getSortField()).isEqualTo("updateTime");
    }

    @Test
    void preferenceFallsBackToDefaultsWhenMissing() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        CabinetPreferenceVO preference = service.getPreference(CabinetConstant.SCOPE_PRIVATE);

        assertThat(preference.getSortField()).isEqualTo(CabinetConstant.DEFAULT_SORT_FIELD);
        assertThat(preference.getSortOrder()).isEqualTo(CabinetConstant.DEFAULT_SORT_ORDER);
        assertThat(preference.getGroupField()).isEqualTo(CabinetConstant.DEFAULT_GROUP_FIELD);
        assertThat(preference.getViewMode()).isEqualTo(CabinetConstant.DEFAULT_VIEW_MODE);
        assertThat(preference.getGridIconSize()).isEqualTo(CabinetConstant.DEFAULT_GRID_ICON_SIZE);
    }

    @Test
    void preferenceRejectsUnsupportedViewFields() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        assertThatThrownBy(() -> service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "rank", "asc", "type", "grid", "large")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不支持的排序字段");

        assertThatThrownBy(() -> service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "manual", "up", "type", "grid", "large")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不支持的排序方向");

        assertThatThrownBy(() -> service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "manual", "asc", "folder", "grid", "large")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不支持的分组字段");

        assertThatThrownBy(() -> service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "manual", "asc", "none", "card", "large")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不支持的视图模式");

        assertThatThrownBy(() -> service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "manual", "asc", "none", "grid", "middle")))
            .isInstanceOf(JeecgBootException.class)
            .hasMessageContaining("不支持的图标大小");
    }

    @Test
    void preferenceUpsertUpdatesExistingRecordInsteadOfDuplicating() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "name", "asc", "type", "grid", "large"));
        service.updatePreference(preference(CabinetConstant.SCOPE_PRIVATE, "size", "desc", "none", "table", "small"));

        assertThat(service.preferenceCount()).isEqualTo(1);
        CabinetPreferenceVO preference = service.getPreference(CabinetConstant.SCOPE_PRIVATE);
        assertThat(preference.getSortField()).isEqualTo("size");
        assertThat(preference.getSortOrder()).isEqualTo("desc");
        assertThat(preference.getGroupField()).isEqualTo("none");
        assertThat(preference.getViewMode()).isEqualTo("table");
        assertThat(preference.getGridIconSize()).isEqualTo("small");
    }

    @Test
    void preferenceFallsBackToGridWhenLegacyViewModeIsMissing() {
        InMemoryCabinetService service = new InMemoryCabinetService();

        CabinetPreference legacyPreference = new CabinetPreference();
        legacyPreference.setId("legacy");
        legacyPreference.setScope(CabinetConstant.SCOPE_PRIVATE);
        legacyPreference.setUserName("alice");
        legacyPreference.setTenantId(0);
        legacyPreference.setSortField("name");
        legacyPreference.setSortOrder("asc");
        legacyPreference.setGroupField("type");
        service.putPreference(legacyPreference);

        CabinetPreferenceVO preference = service.getPreference(CabinetConstant.SCOPE_PRIVATE);

        assertThat(preference.getGroupField()).isEqualTo("type");
        assertThat(preference.getViewMode()).isEqualTo(CabinetConstant.DEFAULT_VIEW_MODE);
        assertThat(preference.getGridIconSize()).isEqualTo(CabinetConstant.DEFAULT_GRID_ICON_SIZE);
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

    private static CabinetFolderViewQueryDTO folderView(String scope, String parentId, String sortField, String sortOrder, String groupField) {
        CabinetFolderViewQueryDTO request = new CabinetFolderViewQueryDTO();
        request.setScope(scope);
        request.setParentId(parentId);
        request.setSortField(sortField);
        request.setSortOrder(sortOrder);
        request.setGroupField(groupField);
        return request;
    }

    private static CabinetUpdateOrderDTO updateOrder(String parentId, List<CabinetUpdateOrderDTO.CabinetItemOrderDTO> itemOrders) {
        CabinetUpdateOrderDTO request = new CabinetUpdateOrderDTO();
        request.setParentId(parentId);
        request.setItemOrders(itemOrders);
        return request;
    }

    private static CabinetUpdateOrderDTO.CabinetItemOrderDTO order(String id, int sortNo) {
        CabinetUpdateOrderDTO.CabinetItemOrderDTO request = new CabinetUpdateOrderDTO.CabinetItemOrderDTO();
        request.setId(id);
        request.setSortNo(sortNo);
        return request;
    }

    private static CabinetPreferenceDTO preference(String scope, String sortField, String sortOrder, String groupField, String viewMode, String gridIconSize) {
        CabinetPreferenceDTO request = new CabinetPreferenceDTO();
        request.setScope(scope);
        request.setSortField(sortField);
        request.setSortOrder(sortOrder);
        request.setGroupField(groupField);
        request.setViewMode(viewMode);
        request.setGridIconSize(gridIconSize);
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
        private final Map<String, CabinetPreference> preferences = new LinkedHashMap<>();
        private final RecordingStorageService storageService = new RecordingStorageService();
        private final CabinetAccessContext accessContext;

        private InMemoryCabinetService() {
            this(new CabinetAccessContext(CabinetConstant.SCOPE_PRIVATE, "alice", 0, null, true));
        }

        private InMemoryCabinetService(CabinetAccessContext accessContext) {
            this.accessContext = accessContext;
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

        int preferenceCount() {
            return preferences.size();
        }

        void putPreference(CabinetPreference preference) {
            preferences.put(preferenceKey(preference.getScope()), preference);
        }

        @Override
        protected CabinetAccessContext resolveAccessContext(String scope, boolean writable) {
            return accessContext;
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
                .filter(item -> CabinetConstant.SCOPE_PUBLIC.equals(context.getScope()) || Objects.equals(item.getTenantId(), context.getTenantId()))
                .sorted(defaultItemComparator())
                .collect(Collectors.toList());
        }

        @Override
        protected CabinetPreference getCabinetPreference(String scope, org.jeecg.common.system.vo.LoginUser loginUser) {
            return preferences.get(preferenceKey(scope));
        }

        @Override
        protected void saveCabinetPreference(CabinetPreference preference) {
            if (preference.getId() == null) {
                preference.setId(UUID.randomUUID().toString().replace("-", ""));
            }
            preferences.put(preferenceKey(preference.getScope()), preference);
        }

        @Override
        protected Integer resolvePreferenceTenantId() {
            return accessContext.getTenantId();
        }

        private String preferenceKey(String scope) {
            return accessContext.getTenantId() + "::" + accessContext.getOwnerKey() + "::" + scope;
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
