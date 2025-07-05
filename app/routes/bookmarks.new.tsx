import { type ActionFunctionArgs, json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData } from '@remix-run/react';
import { ArrowLeft } from 'lucide-react';
import { customAlphabet } from 'nanoid';
import { getBookmarks, saveBookmarks } from '~/lib/r2.server';
import type { Bookmark } from '~/types';

// 使用 nanoid 生成一个简短的、唯一的ID
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const description = formData.get('description') as string;
  const tags = (formData.get('tags') as string || '').split(',').map(tag => tag.trim()).filter(Boolean);

  // 简单的服务器端校验
  if (!title || !url) {
    return json({ error: '标题和链接是必填项。' }, { status: 400 });
  }
  try {
    new URL(url);
  } catch (error) {
    return json({ error: '请输入一个有效的链接地址。' }, { status: 400 });
  }

  const env = context.cloudflare.env;
  const bookmarks = await getBookmarks(env.DB);

  const newBookmark: Bookmark = {
    id: nanoid(),
    title,
    url,
    description,
    tags,
    createdAt: new Date().toISOString(),
  };

  const updatedBookmarks = [newBookmark, ...bookmarks];

  await saveBookmarks(env.DB, updatedBookmarks);

  return redirect('/');
};


export default function NewBookmarkPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">添加一个新的收藏</h1>
      
      <Form method="post" className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">标题 <span className="text-red-500">*</span></label>
          <input type="text" name="title" id="title" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">链接 <span className="text-red-500">*</span></label>
          <input type="url" name="url" id="url" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">描述</label>
          <textarea name="description" id="description" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">标签</label>
          <p className="text-xs text-muted-foreground mb-1">多个标签请用英文逗号 "," 分隔。</p>
          <input type="text" name="tags" id="tags" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>

        {actionData?.error && (
          <p className="text-sm text-red-500">{actionData.error}</p>
        )}

        <div className="flex justify-end gap-4">
          <Link to="/" className="px-4 py-2 rounded-md text-sm font-medium">取消</Link>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            保存收藏
          </button>
        </div>
      </Form>
    </div>
  );
} 