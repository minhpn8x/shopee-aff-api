import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'

export interface AppBindings {
Bindings: {
  NODE_ENV?: string
  SERVER_URL?: string
  SHOPEE_BASE_API?: string
  SHOPEE_COOKIE?: string
}
}

export type AppOpenAPI = OpenAPIHono<AppBindings>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>
