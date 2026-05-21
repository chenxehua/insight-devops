/**
 * 用户管理 Store 完整测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// Mock API
vi.mock('@/services/api', () => ({
  userApi: {
    list: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    delete: vi.fn().mockResolvedValue({ message: '删除成功' }),
    changePassword: vi.fn().mockResolvedValue({ message: '密码修改成功' }),
  },
  roleApi: {
    list: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  }
}))

import { userApi, roleApi } from '@/services/api'

describe('用户管理 Store 完整测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该能创建用户Store实例', () => {
    const store = useUserStore()
    expect(store).toBeDefined()
    expect(store.users).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('应该能获取用户列表', async () => {
    const store = useUserStore()
    const mockData = {
      data: {
        list: [
          { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
          { id: 2, username: 'user', email: 'user@test.com', role: 'user' }
        ],
        total: 2
      }
    }
    
    vi.mocked(userApi.list).mockResolvedValue(mockData)
    
    await store.fetchUsers()
    
    expect(store.users).toHaveLength(2)
    expect(store.loading).toBe(false)
  })

  it('应该能获取单个用户详情', async () => {
    const store = useUserStore()
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com' }
    
    vi.mocked(userApi.getById).mockResolvedValue({ data: mockUser })
    
    const user = await store.getUserById(1)
    
    expect(user).toEqual(mockUser)
    expect(userApi.getById).toHaveBeenCalledWith(1)
  })

  it('应该能创建新用户', async () => {
    const store = useUserStore()
    const userData = { username: 'newuser', email: 'new@test.com', password: '123456' }
    const mockResponse = { data: { id: 3, ...userData } }
    
    vi.mocked(userApi.create).mockResolvedValue(mockResponse)
    
    const result = await store.createUser(userData)
    
    expect(result.id).toBe(3)
    expect(userApi.create).toHaveBeenCalledWith(userData)
  })

  it('应该能更新用户', async () => {
    const store = useUserStore()
    const updateData = { username: 'updated', email: 'updated@test.com' }
    const mockResponse = { data: { id: 1, ...updateData } }
    
    vi.mocked(userApi.update).mockResolvedValue(mockResponse)
    
    const result = await store.updateUser(1, updateData)
    
    expect(result.username).toBe('updated')
    expect(userApi.update).toHaveBeenCalledWith(1, updateData)
  })

  it('应该能删除用户', async () => {
    const store = useUserStore()
    
    vi.mocked(userApi.delete).mockResolvedValue({ message: '删除成功' })
    
    await store.deleteUser(1)
    
    expect(userApi.delete).toHaveBeenCalledWith(1)
  })

  it('应该能修改密码', async () => {
    const store = useUserStore()
    
    vi.mocked(userApi.changePassword).mockResolvedValue({ message: '密码修改成功' })
    
    await store.changePassword(1, 'old', 'new')
    
    expect(userApi.changePassword).toHaveBeenCalledWith(1, 'old', 'new')
  })

  it('应该处理API错误', async () => {
    const store = useUserStore()
    
    vi.mocked(userApi.list).mockRejectedValue(new Error('API Error'))
    
    await expect(store.fetchUsers()).rejects.toThrow('API Error')
  })

  it('应该能设置页码', () => {
    const store = useUserStore()
    
    store.setPage(2)
    
    expect(store.pagination.page).toBe(2)
  })

  it('应该能设置每页数量', () => {
    const store = useUserStore()
    
    store.setPageSize(50)
    
    expect(store.pagination.pageSize).toBe(50)
  })

  it('应该能获取角色列表', async () => {
    const store = useUserStore()
    const mockRoles = [
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' }
    ]
    
    vi.mocked(roleApi.list).mockResolvedValue({ data: { list: mockRoles, total: 2 } })
    
    const roles = await store.fetchRoles()
    
    expect(roles).toHaveLength(2)
    expect(store.roles).toEqual(mockRoles)
  })
})