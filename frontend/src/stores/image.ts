// Pinia Store - Image
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { imageApi } from '@/services/api'

export const useImageStore = defineStore('image', () => {
  // State
  const repos = ref<any[]>([])
  const images = ref<any[]>([])
  const currentImage = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchRepos(params?: any) {
    loading.value = true
    try {
      const res = await imageApi.listRepos({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      repos.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchImages(params?: any) {
    loading.value = true
    try {
      const res = await imageApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      images.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getImageById(id: number) {
    loading.value = true
    try {
      const res = await imageApi.getById(id)
      currentImage.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createRepo(data: any) {
    const res = await imageApi.createRepo(data)
    return res.data
  }

  async function updateRepo(id: number, data: any) {
    const res = await imageApi.updateRepo(id, data)
    return res.data
  }

  async function deleteRepo(id: number) {
    const res = await imageApi.deleteRepo(id)
    return res.data
  }

  async function createImage(data: any) {
    const res = await imageApi.create(data)
    return res.data
  }

  async function updateImage(id: number, data: any) {
    const res = await imageApi.update(id, data)
    return res.data
  }

  async function deleteImage(id: number) {
    const res = await imageApi.delete(id)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    repos,
    images,
    currentImage,
    pagination,
    loading,
    fetchRepos,
    fetchImages,
    getImageById,
    createRepo,
    updateRepo,
    deleteRepo,
    createImage,
    updateImage,
    deleteImage,
    setPage,
    setPageSize,
  }
})