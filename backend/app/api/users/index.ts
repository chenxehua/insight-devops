// 用户API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import userService from '../../lib/services/user'
import { authMiddleware } from '../../lib/middleware/auth'

const router = Router()

// 所有用户相关路由都需要认证
router.use(authMiddleware)

// GET /api/users - 用户列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers({
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    keyword: req.query.keyword as string,
    status: req.query.status ? parseInt(req.query.status as string) : undefined,
  })
  res.json(result)
}))

// GET /api/users/:id - 用户详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const result = await userService.getUserById(id)
  res.json(result)
}))

// POST /api/users - 创建用户
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { username, password, email, phone, realName, roleIds } = req.body
  if (!username || !password || !email) {
    return res.status(400).json({ code: 400, message: '用户名、密码和邮箱不能为空' })
  }
  const result = await userService.createUser({ username, password, email, phone, realName, roleIds })
  res.json(result)
}))

// PUT /api/users/:id - 更新用户
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { email, phone, realName, status, roleIds } = req.body
  const result = await userService.updateUser(id, { email, phone, realName, status, roleIds })
  res.json(result)
}))

// DELETE /api/users/:id - 删除用户
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const result = await userService.deleteUser(id)
  res.json(result)
}))

// PUT /api/users/:id/password - 修改密码
router.put('/:id/password', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { oldPassword, newPassword } = req.body
  
  // 只能修改自己的密码或者是管理员
  if (id !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权限修改他人密码' })
  }
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ code: 400, message: '旧密码和新密码不能为空' })
  }
  
  const result = await userService.changePassword(id, oldPassword, newPassword)
  res.json(result)
}))

export default router