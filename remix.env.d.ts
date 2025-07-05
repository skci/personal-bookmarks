/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

import type { AppLoadContext as OriginalAppLoadContext } from "@remix-run/cloudflare";

declare module "@remix-run/cloudflare" {
  interface AppLoadContext extends OriginalAppLoadContext {
    cloudflare: {
      env: {
        DB: R2Bucket;
      };
      ctx: ExecutionContext;
    };
  }
} 