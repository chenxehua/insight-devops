<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="dark"
      class="sider"
    >
      <div class="logo">
        <span v-if="!collapsed">天鹂运维</span>
        <span v-else>天鹂</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <DashboardOutlined />
          <span>控制台</span>
        </a-menu-item>
        <a-sub-menu key="system">
          <template #title>
            <SettingOutlined />
            <span>系统管理</span>
          </template>
          <a-menu-item key="/users">用户管理</a-menu-item>
          <a-menu-item key="/roles">角色管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="ops">
          <template #title>
            <CloudOutlined />
            <span>运维管理</span>
          </template>
          <a-menu-item key="/apps">应用管理</a-menu-item>
          <a-menu-item key="/deploys">部署管理</a-menu-item>
          <a-menu-item key="/scripts">脚本管理</a-menu-item>
          <a-menu-item key="/configs">配置管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="monitor">
          <template #title>
            <AlertOutlined />
            <span>监控告警</span>
          </template>
          <a-menu-item key="/monitors">监控管理</a-menu-item>
          <a-menu-item key="/alerts">告警管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="fault">
          <template #title>
            <BugOutlined />
            <span>故障日志</span>
          </template>
          <a-menu-item key="/logs">日志管理</a-menu-item>
          <a-menu-item key="/faults">故障管理</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="asset">
          <template #title>
            <DatabaseOutlined />
            <span>资产管理</span>
          </template>
          <a-menu-item key="/images">镜像管理</a-menu-item>
          <a-menu-item key="/backups">备份管理</a-menu-item>
          <a-menu-item key="/checks">巡检管理</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header class="header">
        <MenuFoldOutlined class="trigger" @click="collapsed = !collapsed" />
        <div class="header-right">
          <a-dropdown>
            <span class="user-info">
              <UserOutlined />
              {{ authStore.userInfo?.username || '用户' }}
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="showProfile">个人中心</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  CloudOutlined,
  AlertOutlined,
  BugOutlined,
  DatabaseOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)
const selectedKeys = ref<string[]>([route.path])

watch(() => route.path, (path) => {
  selectedKeys.value = [path]
})

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

function showProfile() {
  message.info('个人中心功能开发中')
}

async function handleLogout() {
  await authStore.logout()
  message.success('已退出登录')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.sider {
  height: 100vh;
  overflow-y: auto;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  padding: 0 12px;
}

.content {
  margin: 16px;
  padding: 16px;
  background: white;
  border-radius: 4px;
  min-height: calc(100vh - 112px);
  overflow-y: auto;
}
</style>