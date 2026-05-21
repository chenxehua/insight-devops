<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>天鹂可视化运维平台</h1>
        <p>Insight DevOps Platform</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-item">
          <user-outlined class="input-icon" />
          <input
            v-model="form.username"
            type="text"
            placeholder="用户名 / Username"
            class="input-field"
          />
        </div>

        <div class="form-item">
          <lock-outlined class="input-icon" />
          <input
            v-model="form.password"
            type="password"
            placeholder="密码 / Password"
            class="input-field"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="authStore.loading">
          {{ authStore.loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-footer">
        <p>默认账号: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  if (!form.username || !form.password) {
    alert('请输入用户名和密码')
    return
  }
  const success = await authStore.login(form.username, form.password)
  if (!success) {
    alert('用户名或密码错误')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.form-item {
  position: relative;
  margin-bottom: 16px;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

.input-field {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 40px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.login-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.login-btn:hover {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  color: #999;
  font-size: 12px;
}
</style>