// API Service 单元测试 - 验证API模块结构和接口定义
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '@/services/api'

// Mock message
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual as any,
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

describe('API Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('API模块结构', () => {
    it('应该导出所有API模块', () => {
      expect(api.authApi).toBeDefined()
      expect(api.userApi).toBeDefined()
      expect(api.roleApi).toBeDefined()
      expect(api.appApi).toBeDefined()
      expect(api.deployApi).toBeDefined()
      expect(api.scriptApi).toBeDefined()
      expect(api.configApi).toBeDefined()
      expect(api.monitorApi).toBeDefined()
      expect(api.alertApi).toBeDefined()
      expect(api.logApi).toBeDefined()
      expect(api.faultApi).toBeDefined()
      expect(api.imageApi).toBeDefined()
      expect(api.backupApi).toBeDefined()
      expect(api.dashboardApi).toBeDefined()
      expect(api.checkApi).toBeDefined()
    })

    it('应该导出默认axios实例', () => {
      expect(api.default).toBeDefined()
    })
  })

  describe('Auth API', () => {
    it('authApi.login 应该是函数', () => {
      expect(typeof api.authApi.login).toBe('function')
    })

    it('authApi.logout 应该是函数', () => {
      expect(typeof api.authApi.logout).toBe('function')
    })

    it('authApi.getCurrentUser 应该是函数', () => {
      expect(typeof api.authApi.getCurrentUser).toBe('function')
    })

    it('authApi.refreshToken 应该是函数', () => {
      expect(typeof api.authApi.refreshToken).toBe('function')
    })

    it('authApi.register 应该是函数', () => {
      expect(typeof api.authApi.register).toBe('function')
    })
  })

  describe('User API', () => {
    it('userApi.list 应该是函数', () => {
      expect(typeof api.userApi.list).toBe('function')
    })

    it('userApi.getById 应该是函数', () => {
      expect(typeof api.userApi.getById).toBe('function')
    })

    it('userApi.create 应该是函数', () => {
      expect(typeof api.userApi.create).toBe('function')
    })

    it('userApi.update 应该是函数', () => {
      expect(typeof api.userApi.update).toBe('function')
    })

    it('userApi.delete 应该是函数', () => {
      expect(typeof api.userApi.delete).toBe('function')
    })

    it('userApi.changePassword 应该是函数', () => {
      expect(typeof api.userApi.changePassword).toBe('function')
    })
  })

  describe('Deploy API', () => {
    it('deployApi.list 应该是函数', () => {
      expect(typeof api.deployApi.list).toBe('function')
    })

    it('deployApi.getById 应该是函数', () => {
      expect(typeof api.deployApi.getById).toBe('function')
    })

    it('deployApi.create 应该是函数', () => {
      expect(typeof api.deployApi.create).toBe('function')
    })

    it('deployApi.update 应该是函数', () => {
      expect(typeof api.deployApi.update).toBe('function')
    })

    it('deployApi.delete 应该是函数', () => {
      expect(typeof api.deployApi.delete).toBe('function')
    })

    it('deployApi.execute 应该是函数', () => {
      expect(typeof api.deployApi.execute).toBe('function')
    })

    it('deployApi.cancel 应该是函数', () => {
      expect(typeof api.deployApi.cancel).toBe('function')
    })

    it('deployApi.rollback 应该是函数', () => {
      expect(typeof api.deployApi.rollback).toBe('function')
    })

    it('deployApi.getLogs 应该是函数', () => {
      expect(typeof api.deployApi.getLogs).toBe('function')
    })
  })

  describe('Script API', () => {
    it('scriptApi.list 应该是函数', () => {
      expect(typeof api.scriptApi.list).toBe('function')
    })

    it('scriptApi.getById 应该是函数', () => {
      expect(typeof api.scriptApi.getById).toBe('function')
    })

    it('scriptApi.create 应该是函数', () => {
      expect(typeof api.scriptApi.create).toBe('function')
    })

    it('scriptApi.update 应该是函数', () => {
      expect(typeof api.scriptApi.update).toBe('function')
    })

    it('scriptApi.delete 应该是函数', () => {
      expect(typeof api.scriptApi.delete).toBe('function')
    })

    it('scriptApi.getVersions 应该是函数', () => {
      expect(typeof api.scriptApi.getVersions).toBe('function')
    })

    it('scriptApi.execute 应该是函数', () => {
      expect(typeof api.scriptApi.execute).toBe('function')
    })

    it('scriptApi.getExecutions 应该是函数', () => {
      expect(typeof api.scriptApi.getExecutions).toBe('function')
    })

    it('scriptApi.getExecutionById 应该是函数', () => {
      expect(typeof api.scriptApi.getExecutionById).toBe('function')
    })
  })

  describe('Config API', () => {
    it('configApi.list 应该是函数', () => {
      expect(typeof api.configApi.list).toBe('function')
    })

    it('configApi.getById 应该是函数', () => {
      expect(typeof api.configApi.getById).toBe('function')
    })

    it('configApi.create 应该是函数', () => {
      expect(typeof api.configApi.create).toBe('function')
    })

    it('configApi.update 应该是函数', () => {
      expect(typeof api.configApi.update).toBe('function')
    })

    it('configApi.delete 应该是函数', () => {
      expect(typeof api.configApi.delete).toBe('function')
    })

    it('configApi.getVersions 应该是函数', () => {
      expect(typeof api.configApi.getVersions).toBe('function')
    })

    it('configApi.rollback 应该是函数', () => {
      expect(typeof api.configApi.rollback).toBe('function')
    })

    it('configApi.getDiff 应该是函数', () => {
      expect(typeof api.configApi.getDiff).toBe('function')
    })
  })

  describe('Backup API', () => {
    it('backupApi.listDatabases 应该是函数', () => {
      expect(typeof api.backupApi.listDatabases).toBe('function')
    })

    it('backupApi.createDatabase 应该是函数', () => {
      expect(typeof api.backupApi.createDatabase).toBe('function')
    })

    it('backupApi.updateDatabase 应该是函数', () => {
      expect(typeof api.backupApi.updateDatabase).toBe('function')
    })

    it('backupApi.deleteDatabase 应该是函数', () => {
      expect(typeof api.backupApi.deleteDatabase).toBe('function')
    })

    it('backupApi.list 应该是函数', () => {
      expect(typeof api.backupApi.list).toBe('function')
    })

    it('backupApi.getById 应该是函数', () => {
      expect(typeof api.backupApi.getById).toBe('function')
    })

    it('backupApi.create 应该是函数', () => {
      expect(typeof api.backupApi.create).toBe('function')
    })

    it('backupApi.update 应该是函数', () => {
      expect(typeof api.backupApi.update).toBe('function')
    })

    it('backupApi.delete 应该是函数', () => {
      expect(typeof api.backupApi.delete).toBe('function')
    })

    it('backupApi.restore 应该是函数', () => {
      expect(typeof api.backupApi.restore).toBe('function')
    })
  })

  describe('Dashboard API', () => {
    it('dashboardApi.getStats 应该是函数', () => {
      expect(typeof api.dashboardApi.getStats).toBe('function')
    })

    it('dashboardApi.getTrend 应该是函数', () => {
      expect(typeof api.dashboardApi.getTrend).toBe('function')
    })
  })

  describe('Monitor API', () => {
    it('monitorApi.list 应该是函数', () => {
      expect(typeof api.monitorApi.list).toBe('function')
    })

    it('monitorApi.getById 应该是函数', () => {
      expect(typeof api.monitorApi.getById).toBe('function')
    })

    it('monitorApi.create 应该是函数', () => {
      expect(typeof api.monitorApi.create).toBe('function')
    })

    it('monitorApi.update 应该是函数', () => {
      expect(typeof api.monitorApi.update).toBe('function')
    })

    it('monitorApi.delete 应该是函数', () => {
      expect(typeof api.monitorApi.delete).toBe('function')
    })

    it('monitorApi.getMetrics 应该是函数', () => {
      expect(typeof api.monitorApi.getMetrics).toBe('function')
    })

    it('monitorApi.reportMetric 应该是函数', () => {
      expect(typeof api.monitorApi.reportMetric).toBe('function')
    })
  })

  describe('Alert API', () => {
    it('alertApi.listRules 应该是函数', () => {
      expect(typeof api.alertApi.listRules).toBe('function')
    })

    it('alertApi.createRule 应该是函数', () => {
      expect(typeof api.alertApi.createRule).toBe('function')
    })

    it('alertApi.updateRule 应该是函数', () => {
      expect(typeof api.alertApi.updateRule).toBe('function')
    })

    it('alertApi.deleteRule 应该是函数', () => {
      expect(typeof api.alertApi.deleteRule).toBe('function')
    })

    it('alertApi.list 应该是函数', () => {
      expect(typeof api.alertApi.list).toBe('function')
    })

    it('alertApi.handle 应该是函数', () => {
      expect(typeof api.alertApi.handle).toBe('function')
    })
  })

  describe('Log API', () => {
    it('logApi.list 应该是函数', () => {
      expect(typeof api.logApi.list).toBe('function')
    })

    it('logApi.getById 应该是函数', () => {
      expect(typeof api.logApi.getById).toBe('function')
    })

    it('logApi.create 应该是函数', () => {
      expect(typeof api.logApi.create).toBe('function')
    })

    it('logApi.clear 应该是函数', () => {
      expect(typeof api.logApi.clear).toBe('function')
    })

    it('logApi.getStats 应该是函数', () => {
      expect(typeof api.logApi.getStats).toBe('function')
    })
  })

  describe('Fault API', () => {
    it('faultApi.list 应该是函数', () => {
      expect(typeof api.faultApi.list).toBe('function')
    })

    it('faultApi.getById 应该是函数', () => {
      expect(typeof api.faultApi.getById).toBe('function')
    })

    it('faultApi.create 应该是函数', () => {
      expect(typeof api.faultApi.create).toBe('function')
    })

    it('faultApi.update 应该是函数', () => {
      expect(typeof api.faultApi.update).toBe('function')
    })

    it('faultApi.delete 应该是函数', () => {
      expect(typeof api.faultApi.delete).toBe('function')
    })
  })

  describe('Image API', () => {
    it('imageApi.listRepos 应该是函数', () => {
      expect(typeof api.imageApi.listRepos).toBe('function')
    })

    it('imageApi.getRepoById 应该是函数', () => {
      expect(typeof api.imageApi.getRepoById).toBe('function')
    })

    it('imageApi.createRepo 应该是函数', () => {
      expect(typeof api.imageApi.createRepo).toBe('function')
    })

    it('imageApi.updateRepo 应该是函数', () => {
      expect(typeof api.imageApi.updateRepo).toBe('function')
    })

    it('imageApi.deleteRepo 应该是函数', () => {
      expect(typeof api.imageApi.deleteRepo).toBe('function')
    })

    it('imageApi.list 应该是函数', () => {
      expect(typeof api.imageApi.list).toBe('function')
    })

    it('imageApi.getById 应该是函数', () => {
      expect(typeof api.imageApi.getById).toBe('function')
    })

    it('imageApi.create 应该是函数', () => {
      expect(typeof api.imageApi.create).toBe('function')
    })

    it('imageApi.update 应该是函数', () => {
      expect(typeof api.imageApi.update).toBe('function')
    })

    it('imageApi.delete 应该是函数', () => {
      expect(typeof api.imageApi.delete).toBe('function')
    })
  })

  describe('Check API', () => {
    it('checkApi.listTasks 应该是函数', () => {
      expect(typeof api.checkApi.listTasks).toBe('function')
    })

    it('checkApi.getTaskById 应该是函数', () => {
      expect(typeof api.checkApi.getTaskById).toBe('function')
    })

    it('checkApi.createTask 应该是函数', () => {
      expect(typeof api.checkApi.createTask).toBe('function')
    })

    it('checkApi.updateTask 应该是函数', () => {
      expect(typeof api.checkApi.updateTask).toBe('function')
    })

    it('checkApi.deleteTask 应该是函数', () => {
      expect(typeof api.checkApi.deleteTask).toBe('function')
    })

    it('checkApi.executeTask 应该是函数', () => {
      expect(typeof api.checkApi.executeTask).toBe('function')
    })

    it('checkApi.getTaskReports 应该是函数', () => {
      expect(typeof api.checkApi.getTaskReports).toBe('function')
    })

    it('checkApi.listReports 应该是函数', () => {
      expect(typeof api.checkApi.listReports).toBe('function')
    })

    it('checkApi.getReportById 应该是函数', () => {
      expect(typeof api.checkApi.getReportById).toBe('function')
    })

    it('checkApi.updateReport 应该是函数', () => {
      expect(typeof api.checkApi.updateReport).toBe('function')
    })
  })

  describe('Role API', () => {
    it('roleApi.list 应该是函数', () => {
      expect(typeof api.roleApi.list).toBe('function')
    })

    it('roleApi.getById 应该是函数', () => {
      expect(typeof api.roleApi.getById).toBe('function')
    })

    it('roleApi.create 应该是函数', () => {
      expect(typeof api.roleApi.create).toBe('function')
    })

    it('roleApi.update 应该是函数', () => {
      expect(typeof api.roleApi.update).toBe('function')
    })

    it('roleApi.delete 应该是函数', () => {
      expect(typeof api.roleApi.delete).toBe('function')
    })
  })

  describe('App API', () => {
    it('appApi.list 应该是函数', () => {
      expect(typeof api.appApi.list).toBe('function')
    })

    it('appApi.getById 应该是函数', () => {
      expect(typeof api.appApi.getById).toBe('function')
    })

    it('appApi.create 应该是函数', () => {
      expect(typeof api.appApi.create).toBe('function')
    })

    it('appApi.update 应该是函数', () => {
      expect(typeof api.appApi.update).toBe('function')
    })

    it('appApi.delete 应该是函数', () => {
      expect(typeof api.appApi.delete).toBe('function')
    })
  })
})