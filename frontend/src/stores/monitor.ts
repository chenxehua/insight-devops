// Pinia Store - Monitor
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { monitorApi, alertApi } from '@/services/api'

export const useMonitorStore = defineStore('monitor', () => {
  // State
  const monitors = ref<any[]>([])
  const currentMonitor = ref<any>(null)
  const metricData = ref<any[]>([])
  const alertRules = ref<any[]>([])
  const alerts = ref<any[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchMonitors(params?: any) {
    loading.value = true
    try {
      const res = await monitorApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      monitors.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getMonitorById(id: number) {
    loading.value = true
    try {
      const res = await monitorApi.getById(id)
      currentMonitor.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createMonitor(data: any) {
    const res = await monitorApi.create(data)
    return res.data
  }

  async function updateMonitor(id: number, data: any) {
    const res = await monitorApi.update(id, data)
    return res.data
  }

  async function deleteMonitor(id: number) {
    const res = await monitorApi.delete(id)
    return res.data
  }

  async function getMetrics(id: number, params?: any) {
    const res = await monitorApi.getMetrics(id, params)
    metricData.value = res.data
    return res.data
  }

  async function reportMetric(id: number, value: number, timestamp?: string) {
    const res = await monitorApi.reportMetric(id, value, timestamp)
    return res.data
  }

  async function fetchAlertRules(params?: any) {
    const res = await alertApi.listRules({ pageSize: 100, ...params })
    alertRules.value = res.data.list
    return res.data.list
  }

  async function createAlertRule(data: any) {
    const res = await alertApi.createRule(data)
    return res.data
  }

  async function updateAlertRule(id: number, data: any) {
    const res = await alertApi.updateRule(id, data)
    return res.data
  }

  async function deleteAlertRule(id: number) {
    const res = await alertApi.deleteRule(id)
    return res.data
  }

  async function fetchAlerts(params?: any) {
    loading.value = true
    try {
      const res = await alertApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      alerts.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function handleAlert(id: number, data: any) {
    const res = await alertApi.handle(id, data)
    return res.data
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    monitors,
    currentMonitor,
    metricData,
    alertRules,
    alerts,
    pagination,
    loading,
    fetchMonitors,
    getMonitorById,
    createMonitor,
    updateMonitor,
    deleteMonitor,
    getMetrics,
    reportMetric,
    fetchAlertRules,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    fetchAlerts,
    handleAlert,
    setPage,
    setPageSize,
  }
})