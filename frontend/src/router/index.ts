// Vue Router 配置
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台', icon: 'DashboardOutlined' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'UserOutlined', permission: 'user:manage' },
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/roles/RoleList.vue'),
        meta: { title: '角色管理', icon: 'TeamOutlined', permission: 'role:manage' },
      },
      {
        path: 'apps',
        name: 'Apps',
        component: () => import('@/views/apps/AppList.vue'),
        meta: { title: '应用管理', icon: 'AppstoreOutlined', permission: 'app:manage' },
      },
      {
        path: 'deploys',
        name: 'Deploys',
        component: () => import('@/views/deploys/DeployList.vue'),
        meta: { title: '部署管理', icon: 'CloudUploadOutlined', permission: 'deploy:manage' },
      },
      {
        path: 'scripts',
        name: 'Scripts',
        component: () => import('@/views/scripts/ScriptList.vue'),
        meta: { title: '脚本管理', icon: 'ConsoleSqlOutlined', permission: 'script:manage' },
      },
      {
        path: 'configs',
        name: 'Configs',
        component: () => import('@/views/configs/ConfigList.vue'),
        meta: { title: '配置管理', icon: 'SettingOutlined', permission: 'config:manage' },
      },
      {
        path: 'monitors',
        name: 'Monitors',
        component: () => import('@/views/monitors/MonitorList.vue'),
        meta: { title: '监控管理', icon: 'AreaChartOutlined', permission: 'monitor:manage' },
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/monitors/AlertList.vue'),
        meta: { title: '告警管理', icon: 'AlertOutlined', permission: 'monitor:manage' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/LogList.vue'),
        meta: { title: '日志管理', icon: 'FileTextOutlined', permission: 'log:manage' },
      },
      {
        path: 'faults',
        name: 'Faults',
        component: () => import('@/views/faults/FaultList.vue'),
        meta: { title: '故障管理', icon: 'BugOutlined', permission: 'fault:manage' },
      },
      {
        path: 'images',
        name: 'Images',
        component: () => import('@/views/images/ImageList.vue'),
        meta: { title: '镜像管理', icon: 'CloudOutlined', permission: 'image:manage' },
      },
      {
        path: 'backups',
        name: 'Backups',
        component: () => import('@/views/backups/BackupList.vue'),
        meta: { title: '备份管理', icon: 'DatabaseOutlined', permission: 'backup:manage' },
      },
      {
        path: 'checks',
        name: 'Checks',
        component: () => import('@/views/checks/CheckList.vue'),
        meta: { title: '巡检管理', icon: 'ScheduleOutlined', permission: 'check:manage' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404 Not Found' },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 天鹂运维平台` : '天鹂运维平台'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      // 检查本地存储的token
      const token = localStorage.getItem('token')
      if (token) {
        authStore.token = token
        try {
          await authStore.getCurrentUser()
        } catch (error) {
          authStore.clearAuth()
          return next('/login')
        }
      } else {
        return next('/login')
      }
    }
  } else {
    // 已登录用户访问登录页
    if (authStore.isLoggedIn && to.path === '/login') {
      return next('/')
    }
  }
  
  next()
})

export default router