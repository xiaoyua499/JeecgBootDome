/**
 * 文件柜模块 - 类型定义
 *
 * 本文件集中定义文件柜功能所有核心类型，包括：
 * - 基础枚举类型（条目类型、视图模式、排序字段等）
 * - 核心数据接口（文件/文件夹条目、面包屑、分组、剪贴板）
 * - 组件 Props 接口
 */

/** 条目类型：folder = 文件夹，file = 文件 */
export type ItemType = 'folder' | 'file';

/** 文件柜范围：private = 私柜（个人），public = 公柜（共享） */
export type CabinetScope = 'private' | 'public';

/** 视图模式：grid = 图标网格视图，table = 列表表格视图 */
export type ViewMode = 'grid' | 'table';

/** 网格图标尺寸：large = 大图标（100px），small = 小图标（50px） */
export type GridIconSize = 'large' | 'small';

/**
 * 排序字段：
 * - manual: 手动排序（按 orderNo 字段）
 * - name: 按名称排序
 * - updateTime: 按修改时间排序
 * - ext: 按文件类型/扩展名排序
 * - size: 按文件大小排序
 */
export type SortField = 'manual' | 'name' | 'updateTime' | 'ext' | 'size';

/** 排序方向：asc = 升序，desc = 降序 */
export type SortOrder = 'asc' | 'desc';

/**
 * 分组字段：
 * - none: 不分组
 * - name: 按名称首字母分组
 * - updateTime: 按修改日期分组
 * - type: 按类型分组（文件夹/文件）
 * - size: 按文件大小区间分组
 * - custom: 自定义分组（用户手动创建分组并分配文件）
 */
export type GroupField = 'none' | 'name' | 'updateTime' | 'type' | 'size' | 'custom';

/** 剪贴板操作模式：copy = 复制，cut = 剪切 */
export type ClipboardMode = 'copy' | 'cut';

/**
 * CabinetExplorer 组件的 Props 接口
 * @property cabinetName - 文件柜显示名称，不传时根据 scope 自动取"私柜"/"公柜"
 * @property canManage   - 是否有管理权限（创建/删除/重命名/移动等写操作）
 * @property scope       - 文件柜范围，决定请求哪个后端数据集
 */
export interface CabinetExplorerProps {
  cabinetName?: string;
  canManage?: boolean;
  scope?: CabinetScope;
}

/**
 * 文件柜条目（文件或文件夹）的核心数据结构
 * 由 adapter.ts 的 adaptCabinetItem() 从后端 DTO 转换而来
 *
 * @property id             - 唯一标识
 * @property name           - 显示名称（含扩展名）
 * @property type           - 条目类型：folder | file
 * @property iconKey        - 内置图标 key，对应 utils.ts 中 CABINET_ICON_ASSET_MAP 的键
 * @property customIcon     - 自定义图标的完整访问 URL（data: 或 http:）
 * @property size           - 格式化后的文件大小字符串，如 "1.2 MB"；文件夹显示 "-"
 * @property createTime     - 创建时间，格式 "YYYY-MM-DD HH:mm"
 * @property updateTime     - 最后修改时间，格式 "YYYY-MM-DD HH:mm"
 * @property ext            - 扩展名（小写，不含点），文件夹固定为 "folder"
 * @property orderNo        - 手动排序序号，数值越小越靠前
 * @property parentId       - 父文件夹 id，根节点为 null
 * @property scope          - 所属文件柜范围
 * @property filePath       - 文件在服务器上的相对路径，用于下载/预览
 * @property sizeBytes      - 原始字节数，用于排序和分组计算
 * @property customIconPath - 自定义图标的服务器相对路径（原始值，用于保存）
 * @property hasChild       - 是否有子条目："1" 有，"0" 无（仅文件夹有意义）
 */
export interface CabinetItem {
  id: string;
  name: string;
  type: ItemType;
  iconKey?: string;
  customIcon?: string;
  size: string;
  createTime: string;
  updateTime: string;
  ext: string;
  orderNo: number;
  parentId: string | null;
  scope?: CabinetScope;
  filePath?: string;
  sizeBytes?: number;
  customIconPath?: string;
  hasChild?: string;
}

/**
 * 面包屑导航条目
 * 由 utils.ts 的 buildBreadcrumbItems() 从 folderMap 和当前文件夹 id 生成
 *
 * @property id   - 文件夹 id，点击时用于跳转
 * @property name - 文件夹显示名称
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
}

/**
 * 普通分组区块（按类型/名称/日期/大小自动分组时使用）
 * 由 utils.ts 的 buildGroupedSections() 生成
 *
 * @property key   - 分组唯一 key，通常等于 title
 * @property title - 分组标题，如 "文件夹"、"A"、"2024-01-01"
 * @property items - 该分组下的条目列表
 */
export interface GroupSection {
  key: string;
  title: string;
  items: CabinetItem[];
}

/**
 * 自定义分组中的分组定义（仅含 id 和名称）
 * 对应后端 CabinetCustomGroupDTO
 *
 * @property id   - 分组唯一 id
 * @property name - 分组名称，用户自定义
 */
export interface CustomGroupItem {
  id: string;
  name: string;
}

/**
 * 自定义分组区块（groupField === 'custom' 时使用）
 * 在 CabinetFilePanel 中渲染自定义分组视图
 *
 * @property key          - 分组唯一 key
 * @property title        - 分组标题
 * @property items        - 该分组下的条目列表
 * @property isUngrouped  - 是否为"未分组"兜底区块
 */
export interface CustomGroupSection {
  key: string;
  title: string;
  items: CabinetItem[];
  isUngrouped?: boolean;
}

/**
 * 剪贴板状态
 * 存储在 CabinetExplorer 的响应式状态中，由 useCabinetClipboard 管理
 *
 * @property mode    - 操作模式：copy（复制）或 cut（剪切）
 * @property itemIds - 已放入剪贴板的条目 id 列表
 */
export interface ClipboardState {
  mode: ClipboardMode;
  itemIds: string[];
}
