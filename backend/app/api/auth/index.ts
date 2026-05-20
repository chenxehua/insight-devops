// 认证API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import authService from '../../lib/services/auth'
import { authMiddleware } from '../../lib/middleware/auth'

const router = Router()

// POST /api/auth/login - 登录
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' })
  }
  const result = await authService.login(username, password)
  res.json(result)
}))

// POST /api/auth/register - 注册
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, password, email } = req.body
  if (!username || !password || !email) {
    return res.status(400).json({ code: 400, message: '用户名、密码和邮箱不能为空' })
  }
  const result = await authService.register(username, password, email)
  res.json(result)
}))

// POST /api/auth/logout - 登出
router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.logout(req.user!.userId)
  res.json(result)
}))

// GET /api/auth/current - 获取当前用户
router.get('/current', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getCurrentUser(req.user!.userId)
  res.json(result)
}))

// POST /api/auth/refresh - 刷新Token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ code: 400, message: '刷新令牌不能为空' })
  }
  const result = await authService.refreshToken(refreshToken)
  res.json(result)
}))

export default router