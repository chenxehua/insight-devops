import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, config } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

import Login from '@/views/Login.vue'
import Layout from '@/views/Layout.vue'

// Mock ant-design-vue components with simpler versions
const AntComponents = {
  AForm: {
    name: 'AForm',
    props: ['model', 'rules'],
    template: '<form @submit.prevent="$emit(\'finish\')"><slot /></form>',
  },
  AFormItem: {
    name: 'AFormItem',
    props: ['name'],
    template: '<div class="ant-form-item"><slot /></div>',
  },
  AInput: {
    name: 'AInput',
    props: ['value', 'placeholder', 'size', 'type'],
    emits: ['update:value'],
    template: '<input :value="value" :placeholder="placeholder" :type="type || \'text\'" @input="$emit(\'update:value\', $event.target.value)" />',
  },
  AInputPassword: {
    name: 'AInputPassword',
    props: ['value', 'placeholder', 'size'],
    emits: ['update:value'],
    template: '<input :value="value" :placeholder="placeholder" type="password" @input="$emit(\'update:value\', $event.target.value)" />',
  },
  AButton: {
    name: 'AButton',
    props: ['type', 'htmlType', 'size', 'block', 'loading'],
    emits: ['click'],
    template: '<button :type="htmlType" :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
  },
}

config.global.components = {
  ...AntComponents,
}

// Mock ant-design-vue message
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

// Mock @ant-design/icons-vue
vi.mock('@ant-design/icons-vue', () => ({
  UserOutlined: { name: 'UserOutlined', render: () => h('span', 'user') },
  LockOutlined: { name: 'LockOutlined', render: () => h('span', 'lock') },
  DashboardOutlined: { name: 'DashboardOutlined', render: () => h('span', 'dashboard') },
  AppstoreOutlined: { name: 'AppstoreOutlined', render: () => h('span', 'app') },
  CloudUploadOutlined: { name: 'CloudUploadOutlined', render: () => h('span', 'deploy') },
  CodeOutlined: { name: 'CodeOutlined', render: () => h('span', 'script') },
  SettingOutlined: { name: 'SettingOutlined', render: () => h('span', 'config') },
  MonitorOutlined: { name: 'MonitorOutlined', render: () => h('span', 'monitor') },
  FileTextOutlined: { name: 'FileTextOutlined', render: () => h('span', 'log') },
  AlertOutlined: { name: 'AlertOutlined', render: () => h('span', 'alert') },
  DatabaseOutlined: { name: 'DatabaseOutlined', render: () => h('span', 'database') },
  PictureOutlined: { name: 'PictureOutlined', render: () => h('span', 'image') },
  InboxOutlined: { name: 'InboxOutlined', render: () => h('span', 'backup') },
  SafetyOutlined: { name: 'SafetyOutlined', render: () => h('span', 'check') },
  TeamOutlined: { name: 'TeamOutlined', render: () => h('span', 'team') },
  KeyOutlined: { name: 'KeyOutlined', render: () => h('span', 'key') },
  MenuFoldOutlined: { name: 'MenuFoldOutlined', render: () => h('span', 'fold') },
  MenuUnfoldOutlined: { name: 'MenuUnfoldOutlined', render: () => h('span', 'unfold') },
  LogoutOutlined: { name: 'LogoutOutlined', render: () => h('span', 'logout') },
}))

// Mock API
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({
      code: 200,
      data: { token: 'mock-token', user: { id: 1, username: 'admin' } },
    }),
    logout: vi.fn().mockResolvedValue({ code: 200 }),
  },
  appApi: {
    list: vi.fn().mockResolvedValue({ code: 200, data: { list: [], total: 0 } }),
  },
  deployApi: {
    list: vi.fn().mockResolvedValue({ code: 200, data: { list: [], total: 0 } }),
  },
  userApi: {
    list: vi.fn().mockResolvedValue({ code: 200, data: { list: [], total: 0 } }),
  },
}))

// Mock ECharts to avoid canvas issues in jsdom
vi.mock('echarts', () => ({
  default: {
    init: vi.fn().mockReturnValue({
      setOption: vi.fn(),
      dispose: vi.fn(),
      resize: vi.fn(),
    }),
  },
}))

// Router setup
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'home', component: Layout, children: [
      { path: '', redirect: '/dashboard' },
    ]},
  ],
})

describe('Login.vue', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    router.push('/login')
    await router.isReady()
  })

  it('renders login form', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('h1').text()).toContain('天鹂可视化运维平台')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('has correct form fields', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router],
      },
    })

    const usernameInput = wrapper.find('input[type="text"]')
    const passwordInput = wrapper.find('input[type="password"]')

    expect(usernameInput.exists()).toBe(true)
    expect(passwordInput.exists()).toBe(true)
  })
})

describe('Layout.vue', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    localStorage.setItem('token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin', realName: '管理员' }))
    router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders layout components', () => {
    const wrapper = mount(Layout, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.html()).toBeTruthy()
  })
})