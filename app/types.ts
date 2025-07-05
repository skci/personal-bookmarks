/**
 * 单个书签的数据结构
 */
export interface Bookmark {
  id: string; // 唯一标识符，使用 nanoid 生成
  title: string; // 网站标题
  url: string; // 网站链接
  description?: string; // 网站描述
  tags: string[]; // 标签数组
  createdAt: string; // 创建时间 (ISO 8601 格式)
  status?: 'online' | 'offline' | 'timeout' | 'checking'; // 链接健康状态
}

/**
 * 链接健康状态的类型
 */
export type LinkStatus = "online" | "offline" | "timeout" | "redirected" | "error" | "checking"; 