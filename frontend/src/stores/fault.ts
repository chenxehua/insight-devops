// Pinia Store - Fault
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { faultApi } from '@/services/api'

export const useFaultStore = defineStore('fault', () => {
  // State
  const faults = ref<any[]>([])
  const currentFault = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchFaults(params?: any) {
    loading.value = true
    try {
      const res = await faultApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      faults.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getFaultById(id: number) {
    loading.value = true
    try {
      const res = await faultApi.getById(id)
      currentFault.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createFault(data: any) {
    const res = await faultApi.create(data)
    return res.data
  }

  async function updateFault(id: number, data: any) {
    const res = await faultApi.update(id, data)
    return res.data
  }

  async function deleteFault(id: number) {
    const res = await faultApi.delete(id)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    faults,
    currentFault,
    pagination,
    loading,
    fetchFaults,
    getFaultById,
    createFault,
    updateFault,
    deleteFault,
    setPage,
    setPageSize,
  }
})