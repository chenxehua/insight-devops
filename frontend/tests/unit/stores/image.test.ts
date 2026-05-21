// Store单元测试 - Image
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useImageStore } from '@/stores/image'

// Mock API
vi.mock('@/services/api', () => ({
  imageApi: {
    listRepos: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    createRepo: vi.fn(),
    updateRepo: vi.fn(),
    deleteRepo: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
  },
}))

import { imageApi } from '@/services/api'

describe('Image Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('应该初始化正确的状态', () => {
      const store = useImageStore()
      
      expect(store.repos).toEqual([])
      expect(store.images).toEqual([])
      expect(store.currentImage).toBe(null)
      expect(store.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchRepos', () => {
    it('应该获取镜像仓库列表', async () => {
      const mockData = {
        data: {
          list: [{ id: 1, name: 'docker.io' }],
          total: 1,
        },
      }
      ;(imageApi.listRepos as any).mockResolvedValue(mockData)
      
      const store = useImageStore()
      const result = await store.fetchRepos()
      
      expect(imageApi.listRepos).toHaveBeenCalled()
      expect(store.repos).toEqual(mockData.data.list)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('fetchImages', () => {
    it('应该获取镜像列表', async () => {
      const mockData = {
        data: {
          list: [{ id: 1, name: 'nginx', tag: 'latest' }],
          total: 1,
        },
      }
      ;(imageApi.list as any).mockResolvedValue(mockData)
      
      const store = useImageStore()
      const result = await store.fetchImages()
      
      expect(imageApi.list).toHaveBeenCalled()
      expect(store.images).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('getImageById', () => {
    it('应该获取单个镜像', async () => {
      const mockImage = { id: 1, name: 'nginx', tag: 'latest' }
      ;(imageApi.getById as any).mockResolvedValue({ data: mockImage })
      
      const store = useImageStore()
      const result = await store.getImageById(1)
      
      expect(imageApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentImage).toEqual(mockImage)
      expect(result).toEqual(mockImage)
    })
  })

  describe('Repo Operations', () => {
    it('应该创建镜像仓库', async () => {
      const repoData = { name: 'docker.io', url: 'https://docker.io' }
      ;(imageApi.createRepo as any).mockResolvedValue({ data: { id: 1 } })
      
      const store = useImageStore()
      const result = await store.createRepo(repoData)
      
      expect(imageApi.createRepo).toHaveBeenCalledWith(repoData)
      expect(result).toEqual({ id: 1 })
    })

    it('应该更新镜像仓库', async () => {
      ;(imageApi.updateRepo as any).mockResolvedValue({ data: { success: true } })
      
      const store = useImageStore()
      const result = await store.updateRepo(1, { name: 'updated' })
      
      expect(imageApi.updateRepo).toHaveBeenCalledWith(1, { name: 'updated' })
      expect(result).toEqual({ success: true })
    })

    it('应该删除镜像仓库', async () => {
      ;(imageApi.deleteRepo as any).mockResolvedValue({ data: { success: true } })
      
      const store = useImageStore()
      const result = await store.deleteRepo(1)
      
      expect(imageApi.deleteRepo).toHaveBeenCalledWith(1)
      expect(result).toEqual({ success: true })
    })
  })

  describe('Image Operations', () => {
    it('应该创建镜像', async () => {
      const imageData = { name: 'nginx', tag: 'latest' }
      ;(imageApi.create as any).mockResolvedValue({ data: { id: 1 } })
      
      const store = useImageStore()
      const result = await store.createImage(imageData)
      
      expect(imageApi.create).toHaveBeenCalledWith(imageData)
      expect(result).toEqual({ id: 1 })
    })

    it('应该更新镜像', async () => {
      ;(imageApi.update as any).mockResolvedValue({ data: { success: true } })
      
      const store = useImageStore()
      const result = await store.updateImage(1, { tag: '1.21' })
      
      expect(imageApi.update).toHaveBeenCalledWith(1, { tag: '1.21' })
      expect(result).toEqual({ success: true })
    })

    it('应该删除镜像', async () => {
      ;(imageApi.delete as any).mockResolvedValue({ data: { success: true } })
      
      const store = useImageStore()
      const result = await store.deleteImage(1)
      
      expect(imageApi.delete).toHaveBeenCalledWith(1)
      expect(result).toEqual({ success: true })
    })
  })

  describe('Pagination', () => {
    it('应该设置页码', () => {
      const store = useImageStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('应该设置每页数量', () => {
      const store = useImageStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})