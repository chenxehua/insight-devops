import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useBackupStore } from '@/stores/backup'

// Mock API
vi.mock('@/services/api', () => ({
  backupApi: {
    listDatabases: vi.fn(),
    createDatabase: vi.fn(),
    updateDatabase: vi.fn(),
    deleteDatabase: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

import { backupApi } from '@/services/api'

describe('Backup Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该初始化默认值', () => {
    const store = useBackupStore()
    expect(store.databases).toEqual([])
    expect(store.backups).toEqual([])
    expect(store.currentBackup).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
  })

  describe('fetchDatabases', () => {
    it('应该获取数据库列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, dbName: 'Test DB' }],
          total: 1,
        },
      }
      ;(backupApi.listDatabases as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const result = await store.fetchDatabases({ page: 1, pageSize: 10 })

      expect(backupApi.listDatabases).toHaveBeenCalled()
      expect(store.databases).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该处理加载状态', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(backupApi.listDatabases as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchDatabases()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })

    it('处理API错误', async () => {
      ;(backupApi.listDatabases as any).mockRejectedValue(new Error('API Error'))

      const store = useBackupStore()
      await expect(store.fetchDatabases()).rejects.toThrow('API Error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchBackups', () => {
    it('应该获取备份列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, databaseId: 1, backupType: 'full' }],
          total: 1,
        },
      }
      ;(backupApi.list as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const result = await store.fetchBackups({ page: 1, pageSize: 10 })

      expect(backupApi.list).toHaveBeenCalled()
      expect(store.backups).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
    })

    it('应该支持分页参数', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(backupApi.list as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      await store.fetchBackups({ page: 2, pageSize: 50 })

      expect(backupApi.list).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        pageSize: 50,
      }))
    })
  })

  describe('getBackupById', () => {
    it('应该获取备份详情', async () => {
      const mockBackup = { id: 1, databaseId: 1, backupType: 'full', status: 'success' }
      const mockData = { code: 200, data: mockBackup }
      ;(backupApi.getById as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const result = await store.getBackupById(1)

      expect(backupApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentBackup).toEqual(mockBackup)
      expect(result).toEqual(mockBackup)
    })
  })

  describe('createDatabase', () => {
    it('应该创建数据库', async () => {
      const mockData = { code: 200, data: { id: 1 } }
      ;(backupApi.createDatabase as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const data = { dbName: 'New DB', dbType: 'mysql', host: 'localhost', port: 3306 }
      const result = await store.createDatabase(data)

      expect(backupApi.createDatabase).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('updateDatabase', () => {
    it('应该更新数据库', async () => {
      const mockData = { code: 200 }
      ;(backupApi.updateDatabase as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const data = { dbName: 'Updated DB' }
      await store.updateDatabase(1, data)

      expect(backupApi.updateDatabase).toHaveBeenCalledWith(1, data)
    })
  })

  describe('deleteDatabase', () => {
    it('应该删除数据库', async () => {
      const mockData = { code: 200 }
      ;(backupApi.deleteDatabase as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      await store.deleteDatabase(1)

      expect(backupApi.deleteDatabase).toHaveBeenCalledWith(1)
    })
  })

  describe('createBackup', () => {
    it('应该创建备份', async () => {
      const mockData = { code: 200, data: { id: 1 } }
      ;(backupApi.create as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const data = { databaseId: 1, backupType: 'full' }
      const result = await store.createBackup(data)

      expect(backupApi.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockData.data)
    })

    it('应该支持增量备份', async () => {
      const mockData = { code: 200, data: { id: 2 } }
      ;(backupApi.create as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const data = { databaseId: 1, backupType: 'incremental' }
      await store.createBackup(data)

      expect(backupApi.create).toHaveBeenCalledWith(data)
    })
  })

  describe('restoreBackup', () => {
    it('应该恢复备份', async () => {
      const mockData = { code: 200, data: { restoreId: 1 } }
      ;(backupApi.restore as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      const result = await store.restoreBackup(1)

      expect(backupApi.restore).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockData.data)
    })

    it('恢复失败应抛出错误', async () => {
      ;(backupApi.restore as any).mockRejectedValue(new Error('Restore failed'))

      const store = useBackupStore()
      await expect(store.restoreBackup(1)).rejects.toThrow('Restore failed')
    })
  })

  describe('分页方法', () => {
    it('setPage 应该更新页码', () => {
      const store = useBackupStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('setPageSize 应该更新每页大小', () => {
      const store = useBackupStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })

    it('分页参数应该影响API调用', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(backupApi.list as any).mockResolvedValue(mockData)

      const store = useBackupStore()
      store.setPage(2)
      store.setPageSize(10)
      await store.fetchBackups()

      expect(backupApi.list).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        pageSize: 10,
      }))
    })
  })
})