// Pinia Store - Backup
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { backupApi } from '@/services/api'

export const useBackupStore = defineStore('backup', () => {
  // State
  const databases = ref<any[]>([])
  const backups = ref<any[]>([])
  const currentBackup = ref<any>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchDatabases(params?: any) {
    loading.value = true
    try {
      const res = await backupApi.listDatabases({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      databases.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchBackups(params?: any) {
    loading.value = true
    try {
      const res = await backupApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      backups.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getBackupById(id: number) {
    loading.value = true
    try {
      const res = await backupApi.getById(id)
      currentBackup.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createDatabase(data: any) {
    const res = await backupApi.createDatabase(data)
    return res.data
  }

  async function updateDatabase(id: number, data: any) {
    const res = await backupApi.updateDatabase(id, data)
    return res.data
  }

  async function deleteDatabase(id: number) {
    const res = await backupApi.deleteDatabase(id)
    return res.data
  }

  async function createBackup(data: { databaseId: number; backupType: string }) {
    const res = await backupApi.create(data)
    return res.data
  }

  async function updateBackup(id: number, data: any) {
    const res = await backupApi.update(id, data)
    return res.data
  }

  async function deleteBackup(id: number) {
    const res = await backupApi.delete(id)
    return res.data
  }

  async function restoreBackup(id: number) {
    const res = await backupApi.restore(id)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    databases,
    backups,
    currentBackup,
    pagination,
    loading,
    fetchDatabases,
    fetchBackups,
    getBackupById,
    createDatabase,
    updateDatabase,
    deleteDatabase,
    createBackup,
    updateBackup,
    deleteBackup,
    restoreBackup,
    setPage,
    setPageSize,
  }
})