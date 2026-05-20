import { vi } from 'vitest'

// 模拟 Pinia stores
export const mockAuthStore = {
  state: {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('token'),
  },
  actions: {
    login: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
  },
}

export const mockUserStore = {
  state: {
    users: [],
    currentUser: null,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  },
  actions: {
    fetchUsers: vi.fn(),
    fetchUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}

export const mockAppStore = {
  state: {
    apps: [],
    currentApp: null,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  },
  actions: {
    fetchApps: vi.fn(),
    fetchAppById: vi.fn(),
    createApp: vi.fn(),
    updateApp: vi.fn(),
    deleteApp: vi.fn(),
  },
}

export const mockDeployStore = {
  state: {
    deploys: [],
    currentDeploy: null,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  },
  actions: {
    fetchDeploys: vi.fn(),
    fetchDeployById: vi.fn(),
    createDeploy: vi.fn(),
    updateDeploy: vi.fn(),
    deleteDeploy: vi.fn(),
    executeDeploy: vi.fn(),
    rollbackDeploy: vi.fn(),
  },
}

export const mockScriptStore = {
  state: {
    scripts: [],
    currentScript: null,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
  },
  actions: {
    fetchScripts: vi.fn(),
    fetchScriptById: vi.fn(),
    createScript: vi.fn(),
    updateScript: vi.fn(),
    deleteScript: vi.fn(),
    executeScript: vi.fn(),
  },
}

// 导出所有模拟 stores
export const stores = {
  auth: mockAuthStore,
  user: mockUserStore,
  app: mockAppStore,
  deploy: mockDeployStore,
  script: mockScriptStore,
}

// 重置所有 mocks
export function resetAllMocks() {
  Object.values(stores).forEach(store => {
    if (store.actions) {
      Object.values(store.actions).forEach(action => {
        if (typeof action.mockReset === 'function') {
          action.mockReset()
        }
      })
    }
  })
}

// 清除所有 localStorage 模拟
export function clearLocalStorage() {
  localStorage.getItem.mockClear()
  localStorage.setItem.mockClear()
  localStorage.removeItem.mockClear()
}