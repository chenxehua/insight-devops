// 仪表盘API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll } from '../../lib/database'

const router = Router()

router.use(authMiddleware)

// GET /api/dashboard/stats - 仪表盘统计数据
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  // 获取各模块统计数据
  const [
    appStats,
    deployStats,
    monitorStats,
    alertStats,
    faultStats,
    backupStats,
    scriptStats,
    userStats
  ] = await Promise.all([
    // 应用统计 (apps表无status列，按总数统计)
    getOne(`
      SELECT
        COUNT(*) as total,
        COUNT(*) as active
      FROM apps
    `),
    // 部署统计
    getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM deploy_tasks
      WHERE created_at >= datetime('now', '-7 days')
    `),
    // 监控指标统计
    getOne(`
      SELECT COUNT(*) as total FROM monitors
    `),
    // 告警统计
    getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'triggered' THEN 1 ELSE 0 END) as triggered,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM alerts
      WHERE created_at >= datetime('now', '-24 hours')
    `),
    // 故障统计
    getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'handling' THEN 1 ELSE 0 END) as handling
      FROM faults
    `),
    // 备份统计
    getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
        SUM(backup_size) as totalSize
      FROM backups
      WHERE created_at >= datetime('now', '-7 days')
    `),
    // 脚本统计
    getOne(`
      SELECT COUNT(*) as total FROM scripts
    `),
    // 用户统计
    getOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active
      FROM users
    `)
  ])
  
  // 获取最近部署记录
  const recentDeploys = getAll(`
    SELECT dt.id, dt.status, dt.environment, dt.version, dt.created_at,
           a.app_name
    FROM deploy_tasks dt
    INNER JOIN apps a ON dt.app_id = a.id
    ORDER BY dt.created_at DESC
    LIMIT 5
  `)
  
  // 获取最近告警
  const recentAlerts = getAll(`
    SELECT id, alert_name, alert_level, status, metric_name, metric_value, 
           created_at
    FROM alerts
    ORDER BY created_at DESC
    LIMIT 5
  `)
  
  // 获取活跃故障
  const activeFaults = getAll(`
    SELECT id, fault_title, fault_level, status, created_at
    FROM faults
    WHERE status IN ('open', 'handling')
    ORDER BY created_at DESC
    LIMIT 5
  `)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      overview: {
        apps: {
          total: appStats?.total || 0,
          active: appStats?.active || 0,
        },
        users: {
          total: userStats?.total || 0,
          active: userStats?.active || 0,
        },
        scripts: {
          total: scriptStats?.total || 0,
        },
        monitors: {
          total: monitorStats?.total || 0,
        },
      },
      deploys: {
        total: deployStats?.total || 0,
        success: deployStats?.success || 0,
        running: deployStats?.running || 0,
        failed: deployStats?.failed || 0,
      },
      alerts: {
        total: alertStats?.total || 0,
        triggered: alertStats?.triggered || 0,
        resolved: alertStats?.resolved || 0,
      },
      faults: {
        total: faultStats?.total || 0,
        open: faultStats?.open || 0,
        handling: faultStats?.handling || 0,
      },
      backups: {
        total: backupStats?.total || 0,
        success: backupStats?.success || 0,
        totalSize: backupStats?.totalSize || 0,
      },
      recentDeploys: recentDeploys.map(d => ({
        id: d.id,
        appName: d.app_name,
        environment: d.environment,
        version: d.version,
        status: d.status,
        createdAt: d.created_at,
      })),
      recentAlerts: recentAlerts.map(a => ({
        id: a.id,
        alertName: a.alert_name,
        alertLevel: a.alert_level,
        status: a.status,
        metricName: a.metric_name,
        metricValue: a.metric_value,
        createdAt: a.created_at,
      })),
      activeFaults: activeFaults.map(f => ({
        id: f.id,
        faultTitle: f.fault_title,
        faultLevel: f.fault_level,
        status: f.status,
        createdAt: f.created_at,
      })),
    }
  })
}))

// GET /api/dashboard/trend - 趋势数据
router.get('/trend', asyncHandler(async (req: Request, res: Response) => {
  const { days = 7 } = req.query
  
  // 获取过去N天的部署趋势
  const deployTrend = getAll(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM deploy_tasks
    WHERE created_at >= datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `)
  
  // 获取过去N天的告警趋势
  const alertTrend = getAll(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN alert_level = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN alert_level = 'warning' THEN 1 ELSE 0 END) as warning
    FROM alerts
    WHERE created_at >= datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `)
  
  // 获取过去N天的备份趋势
  const backupTrend = getAll(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
    FROM backups
    WHERE created_at >= datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      deployTrend,
      alertTrend,
      backupTrend,
    }
  })
}))

export default router