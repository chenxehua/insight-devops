// Pinia Store - User
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi, roleApi } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<any[]>([])
  const currentUser = ref<any>(null)
  const roles = ref<any[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const loading = ref(false)

  // Actions
  async function fetchUsers(params?: any) {
    loading.value = true
    try {
      const res = await userApi.list({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...params,
      })
      users.value = res.data.list
      pagination.value.total = res.data.total
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function getUserById(id: number) {
    loading.value = true
    try {
      const res = await userApi.getById(id)
      currentUser.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: any) {
    const res = await userApi.create(data)
    return res.data
  }

  async function updateUser(id: number, data: any) {
    const res = await userApi.update(id, data)
    return res.data
  }

  async function deleteUser(id: number) {
    const res = await userApi.delete(id)
    return res.data
  }

  async function changePassword(id: number, oldPassword: string, newPassword: string) {
    const res = await userApi.changePassword(id, oldPassword, newPassword)
    return res.data
  }

  async function fetchRoles() {
    const res = await roleApi.list({ pageSize: 100 })
    roles.value = res.data.list
    return res.data.list
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  function setPageSize(pageSize: number) {
    pagination.value.pageSize = pageSize
  }

  return {
    users,
    currentUser,
    roles,
    pagination,
    loading,
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    fetchRoles,
    setPage,
    setPageSize,
  }
})