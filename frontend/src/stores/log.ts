// Pinia Store - Log
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logApi } from '@/services/api'

export const useLogStore = defineStore('log', () => {
  // State
  const logs = ref<any[]>([])
  const logStats = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchLogs(params?: any) {
    loading.value = true
    try {
      const res = await logApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      logs.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getLogById(id: number) {
    const res = await logApi.getById(id)
    return res.data
  }

  async function createLog(data: any) {
    const res = await logApi.create(data)
    return res.data
  }

  async function clearLogs(days: number = 30) {
    const res = await logApi.clear(days)
    return res.data
  }

  async function getStats(params?: any) {
    const res = await logApi.getStats(params)
    logStats.value = res.data
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    logs,
    logStats,
    pagination,
    loading,
    fetchLogs,
    getLogById,
    createLog,
    clearLogs,
    getStats,
    setPage,
    setPageSize,
  }
})