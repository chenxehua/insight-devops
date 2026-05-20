// Pinia Store - Auth
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<any>(null)
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  // Actions
  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await authApi.login(username, password)
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      router.push('/')
      return true
    } catch (error) {
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      // 忽略错误
    } finally {
      clearAuth()
    }
  }

  async function getCurrentUser() {
    if (!token.value) return null
    try {
      const res = await authApi.getCurrentUser()
      userInfo.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res.data
    } catch (error) {
      clearAuth()
      return null
    }
  }

  function clearAuth() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false
    try {
      const res = await authApi.refreshToken(refreshToken)
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    getCurrentUser,
    clearAuth,
    refreshToken,
  }
})