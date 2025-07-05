import { type LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import type { LinkStatus } from "~/types";

interface StatusResponse {
  status: LinkStatus;
  finalUrl?: string;
  statusCode?: number;
}

// 后端健康检测的核心逻辑
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const requestUrl = new URL(request.url);
  const targetUrl = requestUrl.searchParams.get("url");

  if (!targetUrl) {
    return json({ status: "error", message: "URL parameter is required" }, { status: 400 });
  }

  try {
    const url = new URL(targetUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch (error) {
    return json({ status: "error", message: "Invalid URL provided" }, { status: 400 });
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual', // 我们手动处理重定向
    });

    clearTimeout(timeoutId);

    if (response.status >= 200 && response.status < 300) {
      return json({ status: "online", statusCode: response.status });
    }
    if (response.status >= 300 && response.status < 400) {
      return json({ status: "redirected", statusCode: response.status, finalUrl: response.headers.get('location') || targetUrl });
    }
    return json({ status: "offline", statusCode: response.status });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return json({ status: "timeout" });
    }
    return json({ status: "error", message: error.message || 'Unknown fetch error' });
  }
}; 