import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from '@remix-run/cloudflare';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { ArrowLeft } from 'lucide-react';
import { getBookmarks, saveBookmarks } from '~/lib/r2.server';

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const bookmarkId = params.bookmarkId;
  const env = context.cloudflare.env;
  const bookmarks = await getBookmarks(env.DB);
  const bookmark = bookmarks.find(b => b.id === bookmarkId);

  if (!bookmark) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ bookmark });
};

export const action = async ({ request, context, params }: ActionFunctionArgs) => {
  const bookmarkId = params.bookmarkId;
  const formData = await request.formData();
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const description = formData.get('description') as string;
  const tags = (formData.get('tags') as string || '').split(',').map(tag => tag.trim()).filter(Boolean);
  
  // 服务器端校验
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

  const updatedBookmarks = bookmarks.map(b => {
    if (b.id === bookmarkId) {
      return { ...b, title, url, description, tags };
    }
    return b;
  });

  await saveBookmarks(env.DB, updatedBookmarks);

  return redirect('/');
};

export default function EditBookmarkPage() {
  const { bookmark } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">编辑收藏</h1>
      
      <Form method="post" className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">标题 <span className="text-red-500">*</span></label>
          <input type="text" name="title" id="title" required defaultValue={bookmark.title} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        
        <div>
          <label htmlFor="url" className="block text-sm font-medium">链接 <span className="text-red-500">*</span></label>
          <input type="url" name="url" id="url" required defaultValue={bookmark.url} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">描述</label>
          <textarea name="description" id="description" rows={4} defaultValue={bookmark.description} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium">标签</label>
          <p className="text-xs text-muted-foreground mb-1">多个标签请用英文逗号 "," 分隔。</p>
          <input type="text" name="tags" id="tags" defaultValue={bookmark.tags.join(', ')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        {actionData?.error && (
          <p className="text-sm text-red-500">{actionData.error}</p>
        )}

        <div className="flex justify-end gap-4">
          <Link to="/" className="px-4 py-2 rounded-md text-sm font-medium">取消</Link>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            保存更改
          </button>
        </div>
      </Form>
    </div>
  );
} 