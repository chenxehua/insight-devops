// Pinia Store - Script
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scriptApi } from '@/services/api'

export const useScriptStore = defineStore('script', () => {
  // State
  const scripts = ref<any[]>([])
  const currentScript = ref<any>(null)
  const scriptVersions = ref<any[]>([])
  const scriptExecutions = ref<any[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchScripts(params?: any) {
    loading.value = true
    try {
      const res = await scriptApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      scripts.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getScriptById(id: number) {
    loading.value = true
    try {
      const res = await scriptApi.getById(id)
      currentScript.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createScript(data: any) {
    const res = await scriptApi.create(data)
    return res.data
  }

  async function updateScript(id: number, data: any) {
    const res = await scriptApi.update(id, data)
    return res.data
  }

  async function deleteScript(id: number) {
    const res = await scriptApi.delete(id)
    return res.data
  }

  async function getVersions(id: number) {
    const res = await scriptApi.getVersions(id)
    scriptVersions.value = res.data
    return res.data
  }

  async function executeScript(id: number, params?: any) {
    const res = await scriptApi.execute(id, params)
    return res.data
  }

  async function getExecutions(id: number, params?: any) {
    const res = await scriptApi.getExecutions(id, params)
    scriptExecutions.value = res.data.list
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    scripts,
    currentScript,
    scriptVersions,
    scriptExecutions,
    pagination,
    loading,
    fetchScripts,
    getScriptById,
    createScript,
    updateScript,
    deleteScript,
    getVersions,
    executeScript,
    getExecutions,
    setPage,
    setPageSize,
  }
})