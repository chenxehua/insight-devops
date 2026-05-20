import { setupServer } from 'msw/node'
import { apiHandlers } from './handlers'

// 创建 MSW 服务器
export const server = setupServer(...apiHandlers)

// 启动服务器
export function startServer() {
  server.listen({ onUnhandledRequest: 'bypass' })
}

// 关闭服务器
export function closeServer() {
  server.close()
}

// 重置处理器
export function resetHandlers(...newHandlers) {
  server.resetHandlers(...newHandlers)
}