// Pinia Store - App
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appApi } from '@/services/api'

export const useAppStore = defineStore('app', () => {
  // State
  const apps = ref<any[]>([])
  const currentApp = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchApps(params?: any) {
    loading.value = true
    try {
      const res = await appApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      apps.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getAppById(id: number) {
    loading.value = true
    try {
      const res = await appApi.getById(id)
      currentApp.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createApp(data: any) {
    const res = await appApi.create(data)
    return res.data
  }

  async function updateApp(id: number, data: any) {
    const res = await appApi.update(id, data)
    return res.data
  }

  async function deleteApp(id: number) {
    const res = await appApi.delete(id)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    apps,
    currentApp,
    pagination,
    loading,
    fetchApps,
    getAppById,
    createApp,
    updateApp,
    deleteApp,
    setPage,
    setPageSize,
  }
})