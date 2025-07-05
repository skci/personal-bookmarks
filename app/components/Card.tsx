import type { Bookmark } from '~/types';
import { ExternalLink, MoreVertical, Tag, Edit, Trash2 } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Link, Form } from '@remix-run/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import type { LinkStatus } from '~/types';
import { clsx } from 'clsx';

// 一个辅助函数，用于从 URL 中提取根域名
function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
}

// 这是一个临时的 Favicon 获取服务，实际生产中可能需要更稳定的方案
const getFaviconUrl = (url: string) => {
  const domain = getDomain(url);
  if (!domain) return '';
  // 使用 DuckDuckGo 的服务，它通常更可靠且注重隐私
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
};

// 类型守卫，用于检查fetch返回的数据是否符合我们的预期结构
function isStatusResponse(data: unknown): data is { status: LinkStatus } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    typeof (data as any).status === 'string'
  );
}

interface CardProps {
  bookmark: Bookmark;
}

export function Card({ bookmark }: CardProps) {
  const { id, title, url, description, tags = [] } = bookmark;
  const faviconUrl = getFaviconUrl(url);
  const [status, setStatus] = useState<LinkStatus>('checking');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetch(`/bookmarks/check-status?url=${encodeURIComponent(url)}`)
            .then((res) => res.json())
            .then((data) => {
              if (isMounted && isStatusResponse(data)) {
                setStatus(data.status);
              } else if (isMounted) {
                setStatus('error');
              }
            });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [url]);

  const statusIndicatorMap: Record<LinkStatus, { className: string; title: string; }> = {
    checking: { className: 'bg-gray-400 animate-pulse', title: '检测中...' },
    online: { className: 'bg-green-500', title: '链接可用' },
    offline: { className: 'bg-red-500', title: '链接已失效 (404或5xx)' },
    redirected: { className: 'bg-yellow-500', title: '链接发生重定向' },
    timeout: { className: 'bg-orange-500', title: '检测超时' },
    error: { className: 'bg-purple-500', title: '检测出错' },
  };

  return (
    <div ref={cardRef} className="group relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md h-full">
      <div className="flex-grow p-4">
        {/* 卡片头部 */}
        <div className="flex items-start gap-4 mb-3">
          <div className="relative">
            {faviconUrl && (
              <img src={faviconUrl} alt={`${title} icon`} className="h-10 w-10 rounded-full border p-1" />
            )}
            {/* 链接状态指示器 */}
            <span 
              className={clsx("absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white", statusIndicatorMap[status].className)}
              title={statusIndicatorMap[status].title}
            ></span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()} // 阻止点击链接时触发整个卡片的点击事件
            >
              {getDomain(url)} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {description || '暂无描述'}
        </p>
      </div>

      {/* 卡片底部 */}
      <div className="flex items-center justify-between border-t p-4">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={`/?tag=${encodeURIComponent(tag)}`}
              className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={(e) => e.stopPropagation()} // 阻止卡片本身的链接跳转
            >
              <Tag className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>

        {/* 操作菜单 */}
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="invisible group-hover:visible text-muted-foreground p-1 rounded-full hover:bg-accent hover:text-accent-foreground">
              <MoreVertical className="h-4 w-4" />
            </Menu.Button>
          </div>
          <Menu.Items as={Fragment}>
            <div className="absolute right-0 mt-2 w-32 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1 ">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to={`/bookmarks/${id}/edit`}
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </Link>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                     <Form method="post" action={`/bookmarks/${id}/destroy`} onSubmit={(e) => {
                       if (!confirm('确定要删除这个书签吗？')) {
                         e.preventDefault();
                       }
                     }}>
                      <button
                        type="submit"
                        className={`${
                          active ? 'bg-red-500 text-white' : 'text-gray-900'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </button>
                    </Form>
                  )}
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
} 