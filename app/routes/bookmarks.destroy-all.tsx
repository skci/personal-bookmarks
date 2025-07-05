import { type ActionFunctionArgs, redirect } from '@remix-run/cloudflare';
import { saveBookmarks } from '~/lib/r2.server';

// 这个路由没有UI，只有一个action用于彻底清空数据
export const action = async ({ context }: ActionFunctionArgs) => {
  const env = context.cloudflare.env;
  
  // 保存一个空数组，相当于清空所有数据
  await saveBookmarks(env.DB, []);

  return redirect('/');
}; 