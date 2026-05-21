// 脚本通知配置API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/scripts/notifications - 通知配置列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.scriptId) {
    where += ' AND sn.script_id = ?'
    params.push(parseInt(req.query.scriptId as string))
  }
  if (req.query.channelType) {
    where += ' AND sn.channel_type = ?'
    params.push(req.query.channelType)
  }
  if (req.query.triggerType) {
    where += ' AND sn.trigger_type = ?'
    params.push(req.query.triggerType)
  }
  if (req.query.status !== undefined) {
    where += ' AND sn.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM script_notifications sn ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT sn.id, sn.script_id, sn.trigger_type, sn.channel_type, sn.recipient_list,
           sn.notify_template, sn.status, sn.created_at, sn.updated_at,
           s.script_name, s.script_code
    FROM script_notifications sn
    LEFT JOIN scripts s ON sn.script_id = s.id
    ${where}
    ORDER BY sn.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(n => ({
        id: n.id,
        scriptId: n.script_id,
        scriptName: n.script_name,
        scriptCode: n.script_code,
        triggerType: n.trigger_type,
        channelType: n.channel_type,
        recipientList: n.recipient_list ? JSON.parse(n.recipient_list) : [],
        notifyTemplate: n.notify_template ? JSON.parse(n.notify_template) : null,
        status: n.status,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/scripts/notifications/:id - 通知配置详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const notification = getOne(`
    SELECT sn.*, s.script_name, s.script_code
    FROM script_notifications sn
    LEFT JOIN scripts s ON sn.script_id = s.id
    WHERE sn.id = ?
  `, [id])
  
  if (!notification) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  // 获取发送历史
  const history = getAll(`
    SELECT id, channel, recipient, subject, content, status, sent_at, error_msg, created_at
    FROM notifications
    WHERE content LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `, [`%script:${id}%`])
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: notification.id,
      scriptId: notification.script_id,
      scriptName: notification.script_name,
      scriptCode: notification.script_code,
      triggerType: notification.trigger_type,
      channelType: notification.channel_type,
      recipientList: notification.recipient_list ? JSON.parse(notification.recipient_list) : [],
      notifyTemplate: notification.notify_template ? JSON.parse(notification.notify_template) : null,
      status: notification.status,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
      recentHistory: history.map(h => ({
        id: h.id,
        channel: h.channel,
        recipient: h.recipient,
        subject: h.subject,
        status: h.status,
        sentAt: h.sent_at,
        errorMsg: h.error_msg,
        createdAt: h.created_at,
      }))
    }
  })
}))

// POST /api/scripts/notifications - 创建通知配置
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { scriptId, triggerType, channelType, recipientList, notifyTemplate } = req.body
  
  if (!triggerType || !channelType || !recipientList) {
    return res.status(400).json({ 
      code: 400, 
      message: '触发条件、通知渠道和接收人不能为空' 
    })
  }
  
  // 验证脚本存在（如果提供了scriptId）
  if (scriptId) {
    const script = getOne('SELECT id FROM scripts WHERE id = ?', [scriptId])
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
  }
  
  // 验证触发条件
  const validTriggers = ['success', 'failure', 'timeout', 'always']
  if (!validTriggers.includes(triggerType)) {
    return res.status(400).json({ 
      code: 400, 
      message: `触发条件必须是: ${validTriggers.join(', ')}` 
    })
  }
  
  // 验证通知渠道
  const validChannels = ['email', 'dingtalk', 'feishu', 'sms']
  if (!validChannels.includes(channelType)) {
    return res.status(400).json({ 
      code: 400, 
      message: `通知渠道必须是: ${validChannels.join(', ')}` 
    })
  }
  
  // 验证接收人列表
  if (!Array.isArray(recipientList) || recipientList.length === 0) {
    return res.status(400).json({ code: 400, message: '接收人不能为空' })
  }
  
  runQuery(`
    INSERT INTO script_notifications (script_id, trigger_type, channel_type, recipient_list, notify_template)
    VALUES (?, ?, ?, ?, ?)
  `, [
    scriptId || null, triggerType, channelType, 
    JSON.stringify(recipientList), notifyTemplate ? JSON.stringify(notifyTemplate) : null
  ])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/scripts/notifications/:id - 更新通知配置
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const notification = getOne('SELECT id FROM script_notifications WHERE id = ?', [id])
  if (!notification) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  if (req.body.scriptId !== undefined) {
    updates.push('script_id = ?')
    params.push(req.body.scriptId)
  }
  if (req.body.triggerType !== undefined) {
    updates.push('trigger_type = ?')
    params.push(req.body.triggerType)
  }
  if (req.body.channelType !== undefined) {
    updates.push('channel_type = ?')
    params.push(req.body.channelType)
  }
  if (req.body.recipientList !== undefined) {
    updates.push('recipient_list = ?')
    params.push(Array.isArray(req.body.recipientList) ? JSON.stringify(req.body.recipientList) : req.body.recipientList)
  }
  if (req.body.notifyTemplate !== undefined) {
    updates.push('notify_template = ?')
    params.push(req.body.notifyTemplate ? JSON.stringify(req.body.notifyTemplate) : null)
  }
  if (req.body.status !== undefined) {
    updates.push('status = ?')
    params.push(req.body.status)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE script_notifications SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/scripts/notifications/:id - 删除通知配置
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM script_notifications WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/scripts/notifications/:id/test - 测试通知
router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const notification = getOne('SELECT * FROM script_notifications WHERE id = ?', [id])
  if (!notification) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  const recipients = JSON.parse(notification.recipient_list || '[]')
  const template = notification.notify_template ? JSON.parse(notification.notify_template) : null
  
  // 模拟发送通知
  const results: any[] = []
  for (const recipient of recipients) {
    // 创建通知记录
    runQuery(`
      INSERT INTO notifications (channel, recipient, subject, content, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [
      notification.channel_type,
      recipient,
      '测试通知',
      `这是一条测试通知，来自脚本通知配置 #${id}`
    ])
    
    const notifyId = getLastInsertRowId()
    
    // 模拟发送成功
    setTimeout(() => {
      runQuery(`
        UPDATE notifications SET status = 'success', sent_at = datetime('now') WHERE id = ?
      `, [notifyId])
    }, 500)
    
    results.push({ recipient, notifyId, status: 'pending' })
  }
  
  res.json({
    code: 200,
    message: `测试通知已发送给 ${recipients.length} 个接收人`,
    data: results
  })
}))

// POST /api/scripts/notifications/:id/enable - 启用通知
router.post('/:id/enable', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const notification = getOne('SELECT id FROM script_notifications WHERE id = ?', [id])
  if (!notification) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  runQuery(`
    UPDATE script_notifications SET status = 1, updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '通知配置已启用' })
}))

// POST /api/scripts/notifications/:id/disable - 禁用通知
router.post('/:id/disable', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const notification = getOne('SELECT id FROM script_notifications WHERE id = ?', [id])
  if (!notification) {
    return res.status(404).json({ code: 404, message: '通知配置不存在' })
  }
  
  runQuery(`
    UPDATE script_notifications SET status = 0, updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '通知配置已禁用' })
}))

// GET /api/scripts/notifications/history - 通知发送历史
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  const { scriptId, channelType, status } = req.query
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (scriptId) {
    where += ' AND n.content LIKE ?'
    params.push(`%script:${scriptId}%`)
  }
  if (channelType) {
    where += ' AND n.channel = ?'
    params.push(channelType)
  }
  if (status) {
    where += ' AND n.status = ?'
    params.push(status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM notifications n ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, channel, recipient, subject, content, status, sent_at, error_msg, created_at
    FROM notifications n
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(n => ({
        id: n.id,
        channel: n.channel,
        recipient: n.recipient,
        subject: n.subject,
        content: n.content,
        status: n.status,
        sentAt: n.sent_at,
        errorMsg: n.error_msg,
        createdAt: n.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// 辅助函数：发送脚本执行结果通知
export async function sendScriptNotification(
  scriptId: number, 
  executionId: number, 
  status: string, 
  output: string
): Promise<void> {
  // 获取该脚本的通知配置
  const notifications = getAll(`
    SELECT * FROM script_notifications 
    WHERE (script_id = ? OR script_id IS NULL) AND status = 1
  `, [scriptId])
  
  for (const notification of notifications) {
    // 检查触发条件
    const triggerType = notification.trigger_type
    const shouldNotify = 
      triggerType === 'always' ||
      (triggerType === 'success' && status === 'success') ||
      (triggerType === 'failure' && status === 'failure') ||
      (triggerType === 'timeout' && status === 'timeout')
    
    if (!shouldNotify) continue
    
    const recipients = JSON.parse(notification.recipient_list || '[]')
    
    // 发送通知
    for (const recipient of recipients) {
      runQuery(`
        INSERT INTO notifications (channel, recipient, subject, content, status)
        VALUES (?, ?, ?, ?, 'pending')
      `, [
        notification.channel_type,
        recipient,
        `脚本执行${status === 'success' ? '成功' : '失败'}`,
        `脚本 #${scriptId} 执行${status === 'success' ? '成功' : '失败'}\n执行ID: ${executionId}\n输出: ${output || '无'}`
      ])
    }
  }
}

export default router