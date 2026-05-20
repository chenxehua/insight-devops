// Pinia Store - Deploy
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deployApi } from '@/services/api'

export const useDeployStore = defineStore('deploy', () => {
  // State
  const tasks = ref<any[]>([])
  const currentTask = ref<any>(null)
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
      const res = await deployApi.list({
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
      const res = await deployApi.getById(id)
      currentTask.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createTask(data: any) {
    const res = await deployApi.create(data)
    return res.data
  }

  async function updateTask(id: number, data: any) {
    const res = await deployApi.update(id, data)
    return res.data
  }

  async function deleteTask(id: number) {
    const res = await deployApi.delete(id)
    return res.data
  }

  async function executeTask(id: number) {
    const res = await deployApi.execute(id)
    return res.data
  }

  async function rollbackTask(id: number) {
    const res = await deployApi.rollback(id)
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
    pagination,
    loading,
    fetchTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    executeTask,
    rollbackTask,
    setPage,
    setPageSize,
  }
})