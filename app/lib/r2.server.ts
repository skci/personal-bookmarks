import type { Bookmark } from '~/types';

// 定义在 R2 存储中用于保存书签数据的文件的 Key
const BOOKMARKS_KEY = 'bookmarks.json';

/**
 * 从 R2 存储中获取所有书签数据
 * @param r2 R2Bucket 实例，从 Remix 的 context 中传入
 * @returns 返回一个包含所有书签的数组
 */
export async function getBookmarks(r2: R2Bucket): Promise<Bookmark[]> {
  const object = await r2.get(BOOKMARKS_KEY);

  // 如果在 R2 中找不到该文件，则返回一个空数组，表示还没有任何书签
  if (object === null) {
    return [];
  }

  // 尝试解析 JSON 数据
  try {
    const bookmarks = await object.json<Bookmark[]>();
    return bookmarks;
  } catch (error) {
    console.error('解析 R2 中的 bookmarks.json 文件失败:', error);
    // 如果解析失败，同样返回空数组，避免应用崩溃
    return [];
  }
}

/**
 * 将更新后的书签数据保存回 R2 存储
 * @param r2 R2Bucket 实例
 * @param data 要保存的完整书签数据
 */
export async function saveBookmarks(r2: R2Bucket, data: Bookmark[]): Promise<void> {
  await r2.put(BOOKMARKS_KEY, JSON.stringify(data));
} 