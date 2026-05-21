// Store单元测试 - User
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// Mock API
vi.mock('@/services/api', () => ({
  userApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    changePassword: vi.fn(),
  },
  roleApi: {
    list: vi.fn(),
  },
}))

import { userApi, roleApi } from '@/services/api'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('应该初始化正确的状态', () => {
      const store = useUserStore()
      
      expect(store.users).toEqual([])
      expect(store.currentUser).toBe(null)
      expect(store.roles).toEqual([])
      expect(store.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchUsers', () => {
    it('应该获取用户列表', async () => {
      const mockData = {
        data: {
          list: [{ id: 1, username: 'user1' }],
          total: 1,
        },
      }
      ;(userApi.list as any).mockResolvedValue(mockData)
      
      const store = useUserStore()
      const result = await store.fetchUsers()
      
      expect(userApi.list).toHaveBeenCalled()
      expect(store.users).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该设置loading状态', async () => {
      ;(userApi.list as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { list: [], total: 0 } }), 10)))
      
      const store = useUserStore()
      
      expect(store.loading).toBe(false)
      
      const promise = store.fetchUsers()
      expect(store.loading).toBe(true)
      
      await promise
      expect(store.loading).toBe(false)
    })

    it('应该传递分页参数', async () => {
      ;(userApi.list as any).mockResolvedValue({ data: { list: [], total: 0 } })
      
      const store = useUserStore()
      store.setPage(2)
      store.setPageSize(50)
      
      await store.fetchUsers()
      
      expect(userApi.list).toHaveBeenCalledWith({
        page: 2,
        pageSize: 50,
      })
    })

    it('应该支持自定义参数', async () => {
      ;(userApi.list as any).mockResolvedValue({ data: { list: [], total: 0 } })
      
      const store = useUserStore()
      await store.fetchUsers({ keyword: 'test', status: 1 })
      
      expect(userApi.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        keyword: 'test',
        status: 1,
      })
    })
  })

  describe('getUserById', () => {
    it('应该获取单个用户', async () => {
      const mockUser = { id: 1, username: 'user1' }
      ;(userApi.getById as any).mockResolvedValue({ data: mockUser })
      
      const store = useUserStore()
      const result = await store.getUserById(1)
      
      expect(userApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentUser).toEqual(mockUser)
      expect(result).toEqual(mockUser)
    })
  })

  describe('createUser', () => {
    it('应该创建用户', async () => {
      const newUser = { username: 'newuser', email: 'new@test.com' }
      ;(userApi.create as any).mockResolvedValue({ data: { id: 1 } })
      
      const store = useUserStore()
      const result = await store.createUser(newUser)
      
      expect(userApi.create).toHaveBeenCalledWith(newUser)
      expect(result).toEqual({ id: 1 })
    })
  })

  describe('updateUser', () => {
    it('应该更新用户', async () => {
      ;(userApi.update as any).mockResolvedValue({ data: { success: true } })
      
      const store = useUserStore()
      const result = await store.updateUser(1, { email: 'new@test.com' })
      
      expect(userApi.update).toHaveBeenCalledWith(1, { email: 'new@test.com' })
      expect(result).toEqual({ success: true })
    })
  })

  describe('deleteUser', () => {
    it('应该删除用户', async () => {
      ;(userApi.delete as any).mockResolvedValue({ data: { success: true } })
      
      const store = useUserStore()
      const result = await store.deleteUser(1)
      
      expect(userApi.delete).toHaveBeenCalledWith(1)
      expect(result).toEqual({ success: true })
    })
  })

  describe('changePassword', () => {
    it('应该修改密码', async () => {
      ;(userApi.changePassword as any).mockResolvedValue({ data: { success: true } })
      
      const store = useUserStore()
      const result = await store.changePassword(1, 'old', 'new')
      
      expect(userApi.changePassword).toHaveBeenCalledWith(1, 'old', 'new')
      expect(result).toEqual({ success: true })
    })
  })

  describe('fetchRoles', () => {
    it('应该获取角色列表', async () => {
      const mockRoles = [{ id: 1, name: 'Admin' }, { id: 2, name: 'User' }]
      ;(roleApi.list as any).mockResolvedValue({ data: { list: mockRoles, total: 2 } })
      
      const store = useUserStore()
      const result = await store.fetchRoles()
      
      expect(roleApi.list).toHaveBeenCalledWith({ pageSize: 100 })
      expect(store.roles).toEqual(mockRoles)
      expect(result).toEqual(mockRoles)
    })
  })

  describe('Pagination', () => {
    it('应该设置页码', () => {
      const store = useUserStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('应该设置每页数量', () => {
      const store = useUserStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})