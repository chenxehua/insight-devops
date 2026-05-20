<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  // 初始化用户信息
  if (authStore.isLoggedIn && !authStore.userInfo) {
    await authStore.getCurrentUser()
  }
})
</script>

<style>
#app {
  height: 100vh;
}
</style>