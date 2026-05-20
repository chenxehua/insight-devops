// Pinia Store - Check
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkApi } from '@/services/api'

export const useCheckStore = defineStore('check', () => {
  // State
  const tasks = ref<any[]>([])
  const currentTask = ref<any>(null)
  const reports = ref<any[]>([])
  const currentReport = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchTasks(params?: any) {
    loading.value = true
    try {
      const res = await checkApi.listTasks({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      tasks.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getTaskById(id: number) {
    loading.value = true
    try {
      const res = await checkApi.getTaskById(id)
      currentTask.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createTask(data: any) {
    const res = await checkApi.createTask(data)
    return res.data
  }

  async function updateTask(id: number, data: any) {
    const res = await checkApi.updateTask(id, data)
    return res.data
  }

  async function deleteTask(id: number) {
    const res = await checkApi.deleteTask(id)
    return res.data
  }

  async function executeTask(id: number) {
    const res = await checkApi.executeTask(id)
    return res.data
  }

  async function getTaskReports(id: number, params?: any) {
    const res = await checkApi.getTaskReports(id, params)
    return res.data.list
  }

  async function fetchReports(params?: any) {
    loading.value = true
    try {
      const res = await checkApi.listReports({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      reports.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getReportById(id: number) {
    loading.value = true
    try {
      const res = await checkApi.getReportById(id)
      currentReport.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function updateReport(id: number, data: any) {
    const res = await checkApi.updateReport(id, data)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    tasks,
    currentTask,
    reports,
    currentReport,
    pagination,
    loading,
    fetchTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    executeTask,
    getTaskReports,
    fetchReports,
    getReportById,
    updateReport,
    setPage,
    setPageSize,
  }
})