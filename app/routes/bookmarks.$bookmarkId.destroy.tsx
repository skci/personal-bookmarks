import { type ActionFunctionArgs, redirect } from '@remix-run/cloudflare';
import { getBookmarks, saveBookmarks } from '~/lib/r2.server';

// 这个路由没有UI，只有一个action用于处理删除逻辑
export const action = async ({ params, context }: ActionFunctionArgs) => {
  const bookmarkId = params.bookmarkId;
  const env = context.cloudflare.env;

  if (!bookmarkId) {
    // 如果没有提供ID，则直接返回，不做任何操作
    return redirect('/');
  }

  const bookmarks = await getBookmarks(env.DB);
  const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);

  await saveBookmarks(env.DB, updatedBookmarks);

  return redirect('/');
}; 