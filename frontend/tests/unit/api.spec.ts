import { describe, it, expect, vi, beforeEach } from 'vitest'
import api, { authApi, userApi, appApi, deployApi, scriptApi } from '@/services/api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authApi', () => {
    it('login sends correct payload', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        code: 200,
        data: { token: 'test-token', user: { id: 1 } },
      })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await authApi.login('admin', 'admin123')

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        username: 'admin',
        password: 'admin123',
      })
    })

    it('logout sends correct request', async () => {
      const mockPost = vi.fn().mockResolvedValue({ code: 200 })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await authApi.logout()

      expect(mockPost).toHaveBeenCalledWith('/auth/logout')
    })

    it('getCurrentUser sends correct request', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'admin' },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await authApi.getCurrentUser()

      expect(mockGet).toHaveBeenCalledWith('/auth/current')
    })

    it('refreshToken sends correct payload', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        code: 200,
        data: { token: 'new-token' },
      })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await authApi.refreshToken('refresh-token')

      expect(mockPost).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh-token',
      })
    })
  })

  describe('userApi', () => {
    it('list sends correct request with params', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { list: [], pagination: {} },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await userApi.list({ page: 1, pageSize: 10, keyword: 'admin' })

      expect(mockGet).toHaveBeenCalledWith('/users', {
        params: { page: 1, pageSize: 10, keyword: 'admin' },
      })
    })

    it('getById sends correct request', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'admin' },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await userApi.getById(1)

      expect(mockGet).toHaveBeenCalledWith('/users/1')
    })

    it('create sends correct payload', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        code: 200,
        data: { id: 1, username: 'newuser' },
      })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await userApi.create({ username: 'newuser', email: 'new@test.com' })

      expect(mockPost).toHaveBeenCalledWith('/users', {
        username: 'newuser',
        email: 'new@test.com',
      })
    })

    it('update sends correct request', async () => {
      const mockPut = vi.fn().mockResolvedValue({ code: 200 })
      vi.spyOn(api, 'put').mockImplementation(mockPut)

      await userApi.update(1, { email: 'updated@test.com' })

      expect(mockPut).toHaveBeenCalledWith('/users/1', {
        email: 'updated@test.com',
      })
    })

    it('delete sends correct request', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ code: 200 })
      vi.spyOn(api, 'delete').mockImplementation(mockDelete)

      await userApi.delete(1)

      expect(mockDelete).toHaveBeenCalledWith('/users/1')
    })
  })

  describe('appApi', () => {
    it('list sends correct request', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { list: [], pagination: {} },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await appApi.list()

      expect(mockGet).toHaveBeenCalledWith('/apps', { params: undefined })
    })

    it('create sends correct payload', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        code: 200,
        data: { id: 1, name: 'TestApp' },
      })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await appApi.create({ name: 'TestApp', appKey: 'test-key' })

      expect(mockPost).toHaveBeenCalledWith('/apps', {
        name: 'TestApp',
        appKey: 'test-key',
      })
    })
  })

  describe('deployApi', () => {
    it('list sends correct request', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { list: [], pagination: {} },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await deployApi.list({ environment: 'test' })

      expect(mockGet).toHaveBeenCalledWith('/deploys', {
        params: { environment: 'test' },
      })
    })

    it('execute sends correct request', async () => {
      const mockPost = vi.fn().mockResolvedValue({ code: 200 })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await deployApi.execute(1)

      expect(mockPost).toHaveBeenCalledWith('/deploys/1/execute')
    })

    it('rollback sends correct request', async () => {
      const mockPost = vi.fn().mockResolvedValue({ code: 200 })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await deployApi.rollback(1)

      expect(mockPost).toHaveBeenCalledWith('/deploys/1/rollback')
    })
  })

  describe('scriptApi', () => {
    it('list sends correct request', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        code: 200,
        data: { list: [], pagination: {} },
      })
      vi.spyOn(api, 'get').mockImplementation(mockGet)

      await scriptApi.list({ scriptType: 'shell' })

      expect(mockGet).toHaveBeenCalledWith('/scripts', {
        params: { scriptType: 'shell' },
      })
    })

    it('execute sends correct params', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        code: 200,
        data: { output: 'Hello' },
      })
      vi.spyOn(api, 'post').mockImplementation(mockPost)

      await scriptApi.execute(1, { params: { arg: 'test' }, targetHost: '192.168.1.1' })

      expect(mockPost).toHaveBeenCalledWith('/scripts/1/execute', {
        params: { arg: 'test' },
        targetHost: '192.168.1.1',
      })
    })
  })
})