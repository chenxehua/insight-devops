import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useDeployStore } from '@/stores/deploy'
import { useScriptStore } from '@/stores/script'

// Mock the API module
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initial state', () => {
    const authStore = useAuthStore()
    expect(authStore.token).toBe('')
    expect(authStore.userInfo).toBe(null)
    expect(authStore.isLoggedIn).toBe(false)
  })

  it('sets token directly', () => {
    const authStore = useAuthStore()
    authStore.token = 'test-token'
    expect(authStore.token).toBe('test-token')
    expect(authStore.isLoggedIn).toBe(true)
  })

  it('sets user directly', () => {
    const authStore = useAuthStore()
    const user = { id: 1, username: 'admin' }
    authStore.userInfo = user
    expect(authStore.userInfo).toEqual(user)
  })

  it('logout clears state via clearAuth', () => {
    const authStore = useAuthStore()
    authStore.token = 'test-token'
    authStore.userInfo = { id: 1, username: 'admin' }

    authStore.clearAuth()

    expect(authStore.token).toBe('')
    expect(authStore.userInfo).toBe(null)
    expect(authStore.isLoggedIn).toBe(false)
  })

  it('isAdmin computed correctly', () => {
    const authStore = useAuthStore()
    authStore.userInfo = { id: 1, username: 'admin', role: 'admin' }
    expect(authStore.isAdmin).toBe(true)

    authStore.userInfo = { id: 2, username: 'user', role: 'user' }
    expect(authStore.isAdmin).toBe(false)
  })

  it('login returns true on success', async () => {
    const { authApi } = await import('@/services/api')
    ;(authApi.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { token: 'mock-token', user: { id: 1, username: 'admin' } },
    })
    
    const authStore = useAuthStore()
    const result = await authStore.login('admin', 'admin123')
    
    expect(result).toBe(true)
    expect(authStore.token).toBe('mock-token')
  })

  it('login returns false on error', async () => {
    const { authApi } = await import('@/services/api')
    ;(authApi.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Login failed'))
    
    const authStore = useAuthStore()
    const result = await authStore.login('admin', 'wrong')
    
    expect(result).toBe(false)
  })
})

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const userStore = useUserStore()
    expect(userStore.users).toEqual([])
    expect(userStore.loading).toBe(false)
    expect(userStore.pagination.page).toBe(1)
  })

  it('sets users directly', () => {
    const userStore = useUserStore()
    const users = [{ id: 1, username: 'admin' }]
    userStore.users = users
    expect(userStore.users).toEqual(users)
  })

  it('sets loading state', () => {
    const userStore = useUserStore()
    userStore.loading = true
    expect(userStore.loading).toBe(true)
  })

  it('updates pagination', () => {
    const userStore = useUserStore()
    userStore.pagination.page = 2
    userStore.pagination.pageSize = 20
    expect(userStore.pagination.page).toBe(2)
    expect(userStore.pagination.pageSize).toBe(20)
  })
})

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const appStore = useAppStore()
    expect(appStore.apps).toEqual([])
    expect(appStore.loading).toBe(false)
  })

  it('sets apps directly', () => {
    const appStore = useAppStore()
    const apps = [{ id: 1, name: 'TestApp' }]
    appStore.apps = apps
    expect(appStore.apps).toEqual(apps)
  })
})

describe('Deploy Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const deployStore = useDeployStore()
    expect(deployStore.tasks).toEqual([])
    expect(deployStore.loading).toBe(false)
    expect(deployStore.pagination.page).toBe(1)
    expect(deployStore.pagination.pageSize).toBe(20)
  })

  it('sets tasks directly', () => {
    const deployStore = useDeployStore()
    const deploys = [{ id: 1, name: 'Test Deploy', status: 'pending' }]
    deployStore.tasks = deploys
    expect(deployStore.tasks).toEqual(deploys)
  })

  it('updates pagination via setters', () => {
    const deployStore = useDeployStore()
    deployStore.setPage(2)
    deployStore.setPageSize(50)
    expect(deployStore.pagination.page).toBe(2)
    expect(deployStore.pagination.pageSize).toBe(50)
  })
})

describe('Script Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const scriptStore = useScriptStore()
    expect(scriptStore.scripts).toEqual([])
    expect(scriptStore.loading).toBe(false)
  })

  it('sets scripts directly', () => {
    const scriptStore = useScriptStore()
    const scripts = [{ id: 1, name: 'Test Script' }]
    scriptStore.scripts = scripts
    expect(scriptStore.scripts).toEqual(scripts)
  })
})