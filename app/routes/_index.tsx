import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { getBookmarks, saveBookmarks } from "~/lib/r2.server";
import { Card } from '~/components/Card';
import type { Bookmark } from "~/types";
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: "个人收藏夹" },
    { name: "description", content: "我的个人在线书签收藏夹" },
  ];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");

  const env = context.cloudflare.env;
  const bookmarks = await getBookmarks(env.DB);
  return json({ bookmarks, tag });
};

// 临时用于添加种子数据 Action
export const action = async ({ context }: ActionFunctionArgs) => {
  const env = context.cloudflare.env;
  const currentBookmarks = await getBookmarks(env.DB);

  // 仅当没有任何数据时才添加种子数据，防止重复添加
  if (currentBookmarks.length === 0) {
    const seedData: Bookmark[] = [
      { id: 'remix', title: 'Remix Framework', url: 'https://remix.run', description: '全栈 Web 框架，专注于用户体验和 Web 标准。', tags: ['React', 'Framework'], createdAt: new Date().toISOString() },
      { id: 'cf-workers', title: 'Cloudflare Workers', url: 'https://workers.cloudflare.com/', description: '在 Cloudflare 全球网络上运行的无服务器代码。', tags: ['Serverless', 'Edge'], createdAt: new Date().toISOString() },
      { id: 'shadcn', title: 'shadcn/ui', url: 'https://ui.shadcn.com/', description: '一个可重用的 UI 组件集合，可以复制粘贴到你的应用中。', tags: ['UI', 'Components', 'TailwindCSS'], createdAt: new Date().toISOString() }
    ];
    await saveBookmarks(env.DB, seedData);
    return json({ success: true });
  }

  return json({ success: false, message: '数据已存在，无需添加种子数据。' });
};

export default function Index() {
  const { bookmarks, tag } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredByTag = tag
    ? bookmarks.filter((bookmark: Bookmark) =>
        bookmark.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      )
    : bookmarks;

  const filteredBookmarks = searchTerm
    ? filteredByTag.filter((bookmark: Bookmark) => {
        const term = searchTerm.toLowerCase();
        return (
          bookmark.title.toLowerCase().includes(term) ||
          bookmark.description?.toLowerCase().includes(term) ||
          bookmark.tags.some(t => t.toLowerCase().includes(term))
        );
      })
    : filteredByTag;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">我的个人收藏</h1>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索标题、描述或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border"
            />
          </div>
        </div>
        <Link
          to="/bookmarks/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加收藏
        </Link>
      </header>

      {tag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm">当前筛选:</span>
          <span className="inline-flex items-center gap-x-2 rounded-md bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-800">
            {tag}
            <Link to="/" className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </Link>
          </span>
        </div>
      )}

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-10">
          {searchTerm ? (
            <p>找不到与 "{searchTerm}" 相关的收藏。</p>
          ) : (
            <>
              <p className="mb-4">暂无收藏，是时候添加第一个书签了！</p>
              <Form method="post">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  添加示例数据
                </button>
              </Form>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBookmarks.map((bookmark: Bookmark) => (
              <a key={bookmark.id} href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card bookmark={bookmark} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const resources = [
  {
    href: "https://remix.run/start/quickstart",
    text: "Quick Start (5 min)",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M8.51851 12.0741L7.92592 18L15.6296 9.7037L11.4815 7.33333L12.0741 2L4.37036 10.2963L8.51851 12.0741Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "https://remix.run/start/tutorial",
    text: "Tutorial (30 min)",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M4.561 12.749L3.15503 14.1549M3.00811 8.99944H1.01978M3.15503 3.84489L4.561 5.2508M8.3107 1.70923L8.3107 3.69749M13.4655 3.84489L12.0595 5.2508M18.1868 17.0974L16.635 18.6491C16.4636 18.8205 16.1858 18.8205 16.0144 18.6491L13.568 16.2028C13.383 16.0178 13.0784 16.0347 12.915 16.239L11.2697 18.2956C11.047 18.5739 10.6029 18.4847 10.505 18.142L7.85215 8.85711C7.75756 8.52603 8.06365 8.21994 8.39472 8.31453L17.6796 10.9673C18.0223 11.0653 18.1115 11.5094 17.8332 11.7321L15.7766 13.3773C15.5723 13.5408 15.5554 13.8454 15.7404 14.0304L18.1868 16.4767C18.3582 16.6481 18.3582 16.926 18.1868 17.0974Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "https://remix.run/docs",
    text: "Remix Docs",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="20"
        viewBox="0 0 24 20"
        fill="none"
        className="stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300"
      >
        <path
          d="M15.0686 1.25995L14.5477 1.17423L14.2913 1.63578C14.1754 1.84439 14.0545 2.08275 13.9422 2.31963C12.6461 2.16488 11.3406 2.16505 10.0445 2.32014C9.92822 2.08178 9.80478 1.84975 9.67412 1.62413L9.41449 1.17584L8.90333 1.25995C7.33547 1.51794 5.80717 1.99419 4.37748 2.66939L4.19 2.75793L4.07461 2.93019C1.23864 7.16437 0.46302 11.3053 0.838165 15.3924L0.868838 15.7266L1.13844 15.9264C2.81818 17.1714 4.68053 18.1233 6.68582 18.719L7.18892 18.8684L7.50166 18.4469C7.96179 17.8268 8.36504 17.1824 8.709 16.4944L8.71099 16.4904C10.8645 17.0471 13.128 17.0485 15.2821 16.4947C15.6261 17.1826 16.0293 17.8269 16.4892 18.4469L16.805 18.8725L17.3116 18.717C19.3056 18.105 21.1876 17.1751 22.8559 15.9238L23.1224 15.724L23.1528 15.3923C23.5873 10.6524 22.3579 6.53306 19.8947 2.90714L19.7759 2.73227L19.5833 2.64518C18.1437 1.99439 16.6386 1.51826 15.0686 1.25995ZM16.6074 10.7755L16.6074 10.7756C16.5934 11.6409 16.0212 12.1444 15.4783 12.1444C14.9297 12.1444 14.3493 11.6173 14.3493 10.7877C14.3493 9.94885 14.9378 9.41192 15.4783 9.41192C16.0471 9.41192 16.6209 9.93851 16.6074 10.7755ZM8.49373 12.1444C7.94513 12.1444 7.36471 11.6173 7.36471 10.7877C7.36471 9.94885 7.95323 9.41192 8.49373 9.41192C9.06038 9.41192 9.63892 9.93712 9.6417 10.7815C9.62517 11.6239 9.05462 12.1444 8.49373 12.1444Z"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];
