package org.jeecg.modules.cabinet.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.shiro.SecurityUtils;
import org.jeecg.common.config.TenantContext;
import org.jeecg.common.exception.JeecgBootException;
import org.jeecg.common.system.vo.LoginUser;
import org.jeecg.common.util.oConvertUtils;
import org.jeecg.modules.cabinet.constant.CabinetConstant;
import org.jeecg.modules.cabinet.dto.CabinetCreateFileDTO;
import org.jeecg.modules.cabinet.dto.CabinetCreateFolderDTO;
import org.jeecg.modules.cabinet.dto.CabinetCopyDTO;
import org.jeecg.modules.cabinet.dto.CabinetMoveDTO;
import org.jeecg.modules.cabinet.dto.CabinetRenameDTO;
import org.jeecg.modules.cabinet.dto.CabinetUpdateIconDTO;
import org.jeecg.modules.cabinet.entity.CabinetItem;
import org.jeecg.modules.cabinet.mapper.CabinetItemMapper;
import org.jeecg.modules.cabinet.model.CabinetAccessContext;
import org.jeecg.modules.cabinet.service.ICabinetService;
import org.jeecg.modules.cabinet.service.ICabinetStorageService;
import org.jeecg.modules.cabinet.vo.CabinetBootstrapVO;
import org.jeecg.modules.cabinet.vo.CabinetItemVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.HashMap;
import java.util.HashSet;
import java.util.stream.Collectors;

/**
 * 文件柜服务实现。
 */
@Service
public class CabinetServiceImpl extends ServiceImpl<CabinetItemMapper, CabinetItem> implements ICabinetService {

    @Autowired
    private ICabinetStorageService cabinetStorageService;

    @Override
    public CabinetBootstrapVO bootstrap(String scope) {
        CabinetAccessContext context = resolveAccessContext(scope, false);
        List<CabinetItemVO> items = listCabinetItems(context).stream().map(this::toItemVO).collect(Collectors.toList());

        CabinetBootstrapVO result = new CabinetBootstrapVO();
        result.setScope(context.getScope());
        result.setCanManage(context.isCanManage());
        result.setItems(items);
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CabinetItemVO createFolder(CabinetCreateFolderDTO request) {
        CabinetAccessContext context = resolveAccessContext(request.getScope(), true);
        String parentId = normalizeParentId(request.getParentId());
        String name = requireName(request.getName(), "文件夹名称不能为空");

        validateParent(parentId, context);
        ensureSiblingNameAvailable(context, parentId, name, null);

        CabinetItem item = buildBaseItem(context, parentId, CabinetConstant.ITEM_TYPE_FOLDER, name);
        item.setExt(CabinetConstant.ITEM_TYPE_FOLDER);
        item.setSizeBytes(0L);
        item.setHasChild(CabinetConstant.HAS_CHILD_NO);
        save(item);
        refreshParentHasChild(parentId);
        return toItemVO(item);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CabinetItemVO createFile(CabinetCreateFileDTO request) {
        CabinetAccessContext context = resolveAccessContext(request.getScope(), true);
        String parentId = normalizeParentId(request.getParentId());
        String name = requireName(request.getName(), "文件名称不能为空");
        String filePath = trimToNull(request.getFilePath());

        validateParent(parentId, context);
        ensureSiblingNameAvailable(context, parentId, name, null);

        CabinetItem item = buildBaseItem(context, parentId, CabinetConstant.ITEM_TYPE_FILE, name);
        item.setExt(resolveFileExt(name, request.getExt()));
        item.setFilePath(filePath);
        item.setSizeBytes(request.getSizeBytes() == null ? 0L : Math.max(request.getSizeBytes(), 0L));
        item.setHasChild(CabinetConstant.HAS_CHILD_NO);
        save(item);
        refreshParentHasChild(parentId);
        return toItemVO(item);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CabinetItemVO renameItem(CabinetRenameDTO request) {
        CabinetItem item = requireAccessibleItem(request.getId(), true);
        String name = requireName(request.getName(), "名称不能为空");
        CabinetAccessContext context = resolveAccessContext(item.getScope(), true);
        assertItemMatchesContext(item, context);
        ensureSiblingNameAvailable(context, item.getParentId(), name, item.getId());

        item.setName(name);
        if (CabinetConstant.ITEM_TYPE_FILE.equals(item.getItemType())) {
            item.setExt(resolveFileExt(name, item.getExt()));
        }
        updateById(item);
        return toItemVO(item);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CabinetItemVO updateIcon(CabinetUpdateIconDTO request) {
        CabinetItem item = requireAccessibleItem(request.getId(), true);
        String iconKey = trimToNull(request.getIconKey());
        String customIconPath = trimToNull(request.getCustomIconPath());
        if (iconKey != null && customIconPath != null) {
            throw new JeecgBootException("内置图标和自定义图标不能同时保存");
        }
        if (customIconPath != null) {
            item.setIconKey(null);
            item.setCustomIconPath(customIconPath);
        } else {
            item.setIconKey(iconKey);
            item.setCustomIconPath(null);
        }
        updateById(item);
        return toItemVO(item);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void moveItems(CabinetMoveDTO request) {
        List<String> requestedIds = requireItemIds(request.getItemIds());
        CabinetAccessContext context = resolveOperationContext(requestedIds, true);
        String targetParentId = normalizeParentId(request.getTargetParentId());
        requireTargetFolder(targetParentId, context);

        List<CabinetItem> allItems = listCabinetItems(context);
        Map<String, CabinetItem> itemMap = buildItemMap(allItems);
        List<CabinetItem> sourceItems = normalizeSourceItems(requestedIds, itemMap);
        if (sourceItems.isEmpty()) {
            return;
        }
        if (targetParentId != null && sourceItems.stream().anyMatch(item -> item.getId().equals(targetParentId) || isDescendant(targetParentId, item.getId(), itemMap))) {
            throw new JeecgBootException("不能将文件夹移动到自身或其子文件夹中");
        }

        List<CabinetItem> movableItems = sourceItems.stream()
            .filter(item -> !sameParent(item.getParentId(), targetParentId))
            .collect(Collectors.toList());
        if (movableItems.isEmpty()) {
            return;
        }

        Set<String> affectedParentIds = movableItems.stream()
            .map(CabinetItem::getParentId)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> siblingNames = allItems.stream()
            .filter(item -> sameParent(item.getParentId(), targetParentId))
            .map(CabinetItem::getName)
            .collect(Collectors.toCollection(ArrayList::new));
        int nextSortNo = resolveNextSortNo(allItems, targetParentId);
        for (CabinetItem item : movableItems) {
            item.setParentId(targetParentId);
            item.setSortNo(nextSortNo);
            item.setName(buildSiblingName(item.getName(), siblingNames));
            siblingNames.add(item.getName());
            updateById(item);
            nextSortNo += 10;
        }

        affectedParentIds.forEach(this::refreshParentHasChild);
        refreshParentHasChild(targetParentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void copyItems(CabinetCopyDTO request) {
        List<String> requestedIds = requireItemIds(request.getItemIds());
        CabinetAccessContext context = resolveOperationContext(requestedIds, true);
        String targetParentId = normalizeParentId(request.getTargetParentId());
        requireTargetFolder(targetParentId, context);

        List<CabinetItem> allItems = listCabinetItems(context);
        Map<String, CabinetItem> itemMap = buildItemMap(allItems);
        Map<String, List<CabinetItem>> childrenMap = buildChildrenMap(allItems);
        List<CabinetItem> sourceItems = normalizeSourceItems(requestedIds, itemMap);
        if (sourceItems.isEmpty()) {
            return;
        }

        List<String> siblingNames = allItems.stream()
            .filter(item -> sameParent(item.getParentId(), targetParentId))
            .map(CabinetItem::getName)
            .collect(Collectors.toCollection(ArrayList::new));
        int nextSortNo = resolveNextSortNo(allItems, targetParentId);
        List<CabinetItem> clonedItems = new ArrayList<>();
        for (CabinetItem sourceItem : sourceItems) {
            String clonedRootName = buildSiblingName(sourceItem.getName(), siblingNames);
            siblingNames.add(clonedRootName);
            cloneSubtree(sourceItem, targetParentId, clonedRootName, nextSortNo, context, childrenMap, clonedItems);
            nextSortNo += 10;
        }
        if (!clonedItems.isEmpty()) {
            saveBatch(clonedItems);
            refreshParentHasChild(targetParentId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteItems(String ids) {
        List<String> requestedIds = splitItemIds(ids);
        CabinetAccessContext context = resolveOperationContext(requestedIds, true);
        List<CabinetItem> allItems = listCabinetItems(context);
        Map<String, CabinetItem> itemMap = buildItemMap(allItems);
        Map<String, List<CabinetItem>> childrenMap = buildChildrenMap(allItems);
        List<CabinetItem> sourceItems = normalizeSourceItems(requestedIds, itemMap);
        if (sourceItems.isEmpty()) {
            return;
        }

        Set<String> deleteIdSet = new LinkedHashSet<>();
        for (CabinetItem sourceItem : sourceItems) {
            collectSubtreeIds(sourceItem.getId(), childrenMap, deleteIdSet);
        }
        List<CabinetItem> deletingItems = deleteIdSet.stream()
            .map(itemMap::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        Set<String> affectedParentIds = sourceItems.stream()
            .map(CabinetItem::getParentId)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> filePaths = deletingItems.stream()
            .map(CabinetItem::getFilePath)
            .map(this::trimToNull)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> customIconPaths = deletingItems.stream()
            .map(CabinetItem::getCustomIconPath)
            .map(this::trimToNull)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        removeByIds(new ArrayList<>(deleteIdSet));
        affectedParentIds.forEach(this::refreshParentHasChild);
        cleanupUnreferencedFilePaths(filePaths);
        cleanupUnreferencedCustomIcons(customIconPaths);
    }

    protected CabinetItem requireAccessibleItem(String itemId, boolean writable) {
        if (oConvertUtils.isEmpty(itemId)) {
            throw new JeecgBootException("项目ID不能为空");
        }
        CabinetItem item = getById(itemId);
        if (item == null) {
            throw new JeecgBootException("未找到对应的文件柜项目");
        }
        CabinetAccessContext context = resolveAccessContext(item.getScope(), writable);
        assertItemMatchesContext(item, context);
        return item;
    }

    protected CabinetAccessContext resolveAccessContext(String scope, boolean writable) {
        String normalizedScope = normalizeScope(scope);
        LoginUser loginUser = getRequiredLoginUser();
        if (writable) {
            assertWritable(normalizedScope, loginUser);
        } else {
            assertReadable(normalizedScope, loginUser);
        }
        return new CabinetAccessContext(
            normalizedScope,
            normalizeOwnerKey(normalizedScope, loginUser),
            resolveTenantId(),
            loginUser,
            canManage(normalizedScope, loginUser)
        );
    }

    protected void assertReadable(String scope, LoginUser loginUser) {
        if (loginUser == null) {
            throw new JeecgBootException("请先登录后再访问文件柜");
        }
        normalizeScope(scope);
    }

    protected void assertWritable(String scope, LoginUser loginUser) {
        if (loginUser == null) {
            throw new JeecgBootException("请先登录后再操作文件柜");
        }
        String normalizedScope = normalizeScope(scope);
        if (CabinetConstant.SCOPE_PUBLIC.equals(normalizedScope) && !CabinetConstant.ADMIN_USERNAME.equals(loginUser.getUsername())) {
            throw new JeecgBootException("当前账号没有公柜写权限");
        }
    }

    protected String normalizeParentId(String parentId) {
        String normalizedParentId = trimToNull(parentId);
        if (normalizedParentId == null || CabinetConstant.ROOT_PARENT_ID.equalsIgnoreCase(normalizedParentId)) {
            return null;
        }
        return normalizedParentId;
    }

    protected String normalizeOwnerKey(String scope, LoginUser loginUser) {
        if (CabinetConstant.SCOPE_PUBLIC.equals(normalizeScope(scope))) {
            return CabinetConstant.OWNER_KEY_PUBLIC;
        }
        if (loginUser == null || oConvertUtils.isEmpty(loginUser.getUsername())) {
            throw new JeecgBootException("未获取到当前登录用户");
        }
        return loginUser.getUsername();
    }

    protected void refreshParentHasChild(String parentId) {
        if (oConvertUtils.isEmpty(parentId)) {
            return;
        }
        long childCount = count(new LambdaQueryWrapper<CabinetItem>().eq(CabinetItem::getParentId, parentId));
        LambdaUpdateWrapper<CabinetItem> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(CabinetItem::getId, parentId)
            .set(CabinetItem::getHasChild, childCount > 0 ? CabinetConstant.HAS_CHILD_YES : CabinetConstant.HAS_CHILD_NO);
        update(updateWrapper);
    }

    protected void validateParent(String parentId, CabinetAccessContext context) {
        if (oConvertUtils.isEmpty(parentId)) {
            return;
        }
        CabinetItem parent = getById(parentId);
        if (parent == null) {
            throw new JeecgBootException("目标目录不存在");
        }
        assertItemMatchesContext(parent, context);
        if (!CabinetConstant.ITEM_TYPE_FOLDER.equals(parent.getItemType())) {
            throw new JeecgBootException("目标父节点不是文件夹");
        }
    }

    protected void assertItemMatchesContext(CabinetItem item, CabinetAccessContext context) {
        if (item == null) {
            throw new JeecgBootException("文件柜项目不存在");
        }
        if (!context.getTenantId().equals(item.getTenantId())) {
            throw new JeecgBootException("无权访问其他租户的文件柜数据");
        }
        if (!context.getScope().equals(item.getScope())) {
            throw new JeecgBootException("文件柜范围不匹配");
        }
        if (!context.getOwnerKey().equals(item.getOwnerKey())) {
            throw new JeecgBootException("无权访问该文件柜数据");
        }
    }

    protected List<CabinetItem> listCabinetItems(CabinetAccessContext context) {
        LambdaQueryWrapper<CabinetItem> queryWrapper = buildCabinetQuery(context);
        queryWrapper.orderByAsc(CabinetItem::getSortNo).orderByAsc(CabinetItem::getCreateTime);
        return list(queryWrapper);
    }

    protected CabinetItem buildBaseItem(CabinetAccessContext context, String parentId, String itemType, String name) {
        CabinetItem item = new CabinetItem();
        item.setParentId(parentId);
        item.setScope(context.getScope());
        item.setOwnerKey(context.getOwnerKey());
        item.setItemType(itemType);
        item.setName(name);
        item.setSortNo(nextSortNo(context, parentId));
        item.setTenantId(context.getTenantId());
        return item;
    }

    protected void ensureSiblingNameAvailable(CabinetAccessContext context, String parentId, String name, String excludeId) {
        LambdaQueryWrapper<CabinetItem> queryWrapper = buildCabinetQuery(context).eq(CabinetItem::getName, name);
        if (parentId == null) {
            queryWrapper.isNull(CabinetItem::getParentId);
        } else {
            queryWrapper.eq(CabinetItem::getParentId, parentId);
        }
        if (oConvertUtils.isNotEmpty(excludeId)) {
            queryWrapper.ne(CabinetItem::getId, excludeId);
        }
        if (count(queryWrapper) > 0) {
            throw new JeecgBootException("当前目录下已存在同名项目");
        }
    }

    protected LambdaQueryWrapper<CabinetItem> buildCabinetQuery(CabinetAccessContext context) {
        return new LambdaQueryWrapper<CabinetItem>()
            .eq(CabinetItem::getTenantId, context.getTenantId())
            .eq(CabinetItem::getScope, context.getScope())
            .eq(CabinetItem::getOwnerKey, context.getOwnerKey());
    }

    protected Integer nextSortNo(CabinetAccessContext context, String parentId) {
        LambdaQueryWrapper<CabinetItem> queryWrapper = buildCabinetQuery(context)
            .orderByDesc(CabinetItem::getSortNo)
            .orderByDesc(CabinetItem::getCreateTime);
        if (parentId == null) {
            queryWrapper.isNull(CabinetItem::getParentId);
        } else {
            queryWrapper.eq(CabinetItem::getParentId, parentId);
        }
        Page<CabinetItem> page = new Page<>(1, 1, false);
        List<CabinetItem> records = page(page, queryWrapper).getRecords();
        if (records.isEmpty() || records.get(0).getSortNo() == null) {
            return 10;
        }
        return records.get(0).getSortNo() + 10;
    }

    protected CabinetItemVO toItemVO(CabinetItem item) {
        CabinetItemVO vo = new CabinetItemVO();
        vo.setId(item.getId());
        vo.setParentId(item.getParentId());
        vo.setScope(item.getScope());
        vo.setItemType(item.getItemType());
        vo.setName(item.getName());
        vo.setExt(item.getExt());
        vo.setFilePath(item.getFilePath());
        vo.setSizeBytes(item.getSizeBytes());
        vo.setSortNo(item.getSortNo());
        vo.setIconKey(item.getIconKey());
        vo.setCustomIconPath(item.getCustomIconPath());
        vo.setHasChild(item.getHasChild());
        vo.setCreateTime(item.getCreateTime());
        vo.setUpdateTime(item.getUpdateTime());
        return vo;
    }

    protected CabinetAccessContext resolveOperationContext(List<String> itemIds, boolean writable) {
        CabinetItem firstItem = requireExistingItem(itemIds.get(0));
        CabinetAccessContext context = resolveAccessContext(firstItem.getScope(), writable);
        assertItemMatchesContext(firstItem, context);
        for (int index = 1; index < itemIds.size(); index += 1) {
            CabinetItem item = requireExistingItem(itemIds.get(index));
            assertItemMatchesContext(item, context);
        }
        return context;
    }

    protected CabinetItem requireExistingItem(String itemId) {
        if (oConvertUtils.isEmpty(itemId)) {
            throw new JeecgBootException("项目ID不能为空");
        }
        CabinetItem item = getById(itemId);
        if (item == null) {
            throw new JeecgBootException("未找到对应的文件柜项目");
        }
        return item;
    }

    protected void requireTargetFolder(String targetParentId, CabinetAccessContext context) {
        if (oConvertUtils.isEmpty(targetParentId)) {
            return;
        }
        CabinetItem targetParent = requireExistingItem(targetParentId);
        assertItemMatchesContext(targetParent, context);
        if (!CabinetConstant.ITEM_TYPE_FOLDER.equals(targetParent.getItemType())) {
            throw new JeecgBootException("目标目录不是文件夹");
        }
    }

    protected List<String> requireItemIds(List<String> itemIds) {
        if (itemIds == null || itemIds.isEmpty()) {
            throw new JeecgBootException("请选择至少一个文件柜项目");
        }
        List<String> normalizedIds = itemIds.stream()
            .map(this::trimToNull)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        if (normalizedIds.isEmpty()) {
            throw new JeecgBootException("请选择至少一个文件柜项目");
        }
        return normalizedIds;
    }

    protected List<String> splitItemIds(String ids) {
        if (oConvertUtils.isEmpty(ids)) {
            throw new JeecgBootException("请选择至少一个文件柜项目");
        }
        return requireItemIds(List.of(ids.split(",")));
    }

    protected Map<String, CabinetItem> buildItemMap(List<CabinetItem> items) {
        return items.stream().collect(Collectors.toMap(CabinetItem::getId, item -> item));
    }

    protected Map<String, List<CabinetItem>> buildChildrenMap(List<CabinetItem> items) {
        Map<String, List<CabinetItem>> childrenMap = new HashMap<>();
        for (CabinetItem item : items) {
            String parentId = item.getParentId() == null ? CabinetConstant.ROOT_PARENT_ID : item.getParentId();
            childrenMap.computeIfAbsent(parentId, key -> new ArrayList<>()).add(item);
        }
        childrenMap.values().forEach(children -> children.sort(defaultItemComparator()));
        return childrenMap;
    }

    protected List<CabinetItem> normalizeSourceItems(List<String> requestedIds, Map<String, CabinetItem> itemMap) {
        LinkedHashSet<String> requestedIdSet = new LinkedHashSet<>(requestedIds);
        List<CabinetItem> normalizedItems = new ArrayList<>();
        for (String itemId : requestedIdSet) {
            boolean nestedInOtherSelection = requestedIdSet.stream()
                .anyMatch(possibleAncestorId -> !possibleAncestorId.equals(itemId) && isDescendant(itemId, possibleAncestorId, itemMap));
            if (!nestedInOtherSelection) {
                CabinetItem item = itemMap.get(itemId);
                if (item != null) {
                    normalizedItems.add(item);
                }
            }
        }
        normalizedItems.sort(defaultItemComparator());
        return normalizedItems;
    }

    protected boolean isDescendant(String itemId, String possibleAncestorId, Map<String, CabinetItem> itemMap) {
        CabinetItem current = itemMap.get(itemId);
        String cursorId = current == null ? null : current.getParentId();
        while (cursorId != null) {
            if (cursorId.equals(possibleAncestorId)) {
                return true;
            }
            CabinetItem parent = itemMap.get(cursorId);
            cursorId = parent == null ? null : parent.getParentId();
        }
        return false;
    }

    protected int resolveNextSortNo(List<CabinetItem> allItems, String parentId) {
        return allItems.stream()
            .filter(item -> sameParent(item.getParentId(), parentId))
            .map(CabinetItem::getSortNo)
            .filter(Objects::nonNull)
            .max(Integer::compareTo)
            .map(value -> value + 10)
            .orElse(10);
    }

    protected boolean sameParent(String leftParentId, String rightParentId) {
        return Objects.equals(leftParentId, rightParentId);
    }

    protected void cloneSubtree(CabinetItem sourceItem, String targetParentId, String targetName, Integer targetSortNo,
                                CabinetAccessContext context, Map<String, List<CabinetItem>> childrenMap, List<CabinetItem> collector) {
        CabinetItem clone = cloneItem(sourceItem, targetParentId, targetName, targetSortNo, context);
        collector.add(clone);
        for (CabinetItem child : childrenMap.getOrDefault(sourceItem.getId(), Collections.emptyList())) {
            cloneSubtree(child, clone.getId(), child.getName(), child.getSortNo(), context, childrenMap, collector);
        }
    }

    protected CabinetItem cloneItem(CabinetItem sourceItem, String parentId, String name, Integer sortNo, CabinetAccessContext context) {
        CabinetItem clone = new CabinetItem();
        clone.setId(IdWorker.getIdStr());
        clone.setParentId(parentId);
        clone.setScope(context.getScope());
        clone.setOwnerKey(context.getOwnerKey());
        clone.setTenantId(context.getTenantId());
        clone.setItemType(sourceItem.getItemType());
        clone.setName(name);
        clone.setExt(sourceItem.getExt());
        clone.setFilePath(sourceItem.getFilePath());
        clone.setSizeBytes(sourceItem.getSizeBytes());
        clone.setSortNo(sortNo);
        clone.setIconKey(sourceItem.getIconKey());
        clone.setCustomIconPath(sourceItem.getCustomIconPath());
        clone.setHasChild(sourceItem.getHasChild());
        return clone;
    }

    protected void collectSubtreeIds(String itemId, Map<String, List<CabinetItem>> childrenMap, Set<String> collector) {
        if (!collector.add(itemId)) {
            return;
        }
        for (CabinetItem child : childrenMap.getOrDefault(itemId, Collections.emptyList())) {
            collectSubtreeIds(child.getId(), childrenMap, collector);
        }
    }

    protected void cleanupUnreferencedFilePaths(Set<String> filePaths) {
        for (String filePath : filePaths) {
            if (count(new LambdaQueryWrapper<CabinetItem>().eq(CabinetItem::getFilePath, filePath)) == 0) {
                cabinetStorageService.delete(filePath);
            }
        }
    }

    protected void cleanupUnreferencedCustomIcons(Set<String> customIconPaths) {
        for (String customIconPath : customIconPaths) {
            if (count(new LambdaQueryWrapper<CabinetItem>().eq(CabinetItem::getCustomIconPath, customIconPath)) == 0) {
                cabinetStorageService.delete(customIconPath);
            }
        }
    }

    protected Comparator<CabinetItem> defaultItemComparator() {
        return Comparator
            .comparing(CabinetItem::getSortNo, Comparator.nullsLast(Integer::compareTo))
            .thenComparing(CabinetItem::getCreateTime, Comparator.nullsLast(java.util.Date::compareTo))
            .thenComparing(CabinetItem::getId, Comparator.nullsLast(String::compareTo));
    }

    protected String buildSiblingName(String name, List<String> siblingNames) {
        String trimmed = name.trim();
        if (!siblingNames.contains(trimmed)) {
            return trimmed;
        }
        int dotIndex = trimmed.lastIndexOf('.');
        boolean hasExt = dotIndex > 0;
        String baseName = hasExt ? trimmed.substring(0, dotIndex) : trimmed;
        String extName = hasExt ? trimmed.substring(dotIndex) : "";
        int index = 2;
        String nextName = baseName + " - 副本" + extName;
        while (siblingNames.contains(nextName)) {
            nextName = baseName + " - 副本 (" + index + ")" + extName;
            index += 1;
        }
        return nextName;
    }

    protected String normalizeScope(String scope) {
        String normalizedScope = trimToNull(scope);
        if (normalizedScope == null) {
            throw new JeecgBootException("文件柜范围不能为空");
        }
        normalizedScope = normalizedScope.toLowerCase(Locale.ROOT);
        if (!CabinetConstant.SCOPE_PRIVATE.equals(normalizedScope) && !CabinetConstant.SCOPE_PUBLIC.equals(normalizedScope)) {
            throw new JeecgBootException("不支持的文件柜范围: " + scope);
        }
        return normalizedScope;
    }

    protected boolean canManage(String scope, LoginUser loginUser) {
        return CabinetConstant.SCOPE_PRIVATE.equals(scope)
            || (loginUser != null && CabinetConstant.ADMIN_USERNAME.equals(loginUser.getUsername()));
    }

    protected Integer resolveTenantId() {
        return oConvertUtils.getInt(TenantContext.getTenant(), 0);
    }

    protected LoginUser getRequiredLoginUser() {
        Object principal = SecurityUtils.getSubject().getPrincipal();
        if (principal instanceof LoginUser) {
            return (LoginUser) principal;
        }
        throw new JeecgBootException("请先登录后再访问文件柜");
    }

    protected String requireName(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new JeecgBootException(message);
        }
        return normalized;
    }

    protected String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    protected String resolveFileExt(String fileName, String fallbackExt) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex >= fileName.length() - 1) {
            String normalizedFallback = trimToNull(fallbackExt);
            return normalizedFallback == null ? "file" : normalizedFallback.toLowerCase(Locale.ROOT);
        }
        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }
}
