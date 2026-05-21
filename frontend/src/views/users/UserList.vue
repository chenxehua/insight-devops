<template>
  <div class="user-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>用户管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建用户
          </a-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索用户名、邮箱..."
          style="width: 300px"
          @search="handleSearch"
        />
        <a-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          style="width: 120px"
          allowClear
          @change="handleSearch"
        >
          <a-select-option :value="1">启用</a-select-option>
          <a-select-option :value="0">禁用</a-select-option>
        </a-select>
      </div>

      <!-- 用户列表 -->
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'roles'">
            <a-tag v-for="role in record.roles" :key="role.id" color="blue">
              {{ role.name }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="handleChangePassword(record)">改密</a-button>
              <a-popconfirm
                title="确定删除该用户？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑用户弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingUser ? '编辑用户' : '新建用户'"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="formData.username" :disabled="!!editingUser" />
        </a-form-item>
        <a-form-item v-if="!editingUser" label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formData.password" />
        </a-form-item>
        <a-form-item label="邮箱" name="email" :rules="[{ required: true, type: 'email', message: '请输入正确邮箱' }]">
          <a-input v-model:value="formData.email" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="formData.phone" />
        </a-form-item>
        <a-form-item label="真实姓名" name="realName">
          <a-input v-model:value="formData.realName" />
        </a-form-item>
        <a-form-item label="角色" name="roleIds">
          <a-select v-model:value="formData.roleIds" mode="multiple" placeholder="选择角色">
            <a-select-option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-switch v-model:checked="formData.status" :checked-children="'启用'" :un-checked-children="'禁用'" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="showPasswordModal"
      title="修改密码"
      @ok="handlePasswordSubmit"
    >
      <a-form :model="passwordForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
          <a-input-password v-model:value="passwordForm.newPassword" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" :rules="[{ required: true, message: '请确认密码' }]">
          <a-input-password v-model:value="passwordForm.confirmPassword" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { userApi, roleApi } from '@/services/api'
import { message } from 'ant-design-vue'

interface User {
  id: number
  username: string
  email: string
  phone: string | null
  realName: string | null
  status: number
  createdAt: string
}

interface Role {
  id: number
  roleName: string
  roleCode: string
}

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const editingUser = ref<User | null>(null)
const formRef = ref()
const passwordUserId = ref<number | null>(null)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  username: '',
  password: '',
  email: '',
  phone: '',
  realName: '',
  roleIds: [],
  status: true,
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '真实姓名', dataIndex: 'realName', key: 'realName' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '角色', key: 'roles', width: 200 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200 },
]

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.list({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      status: filterStatus.value ?? undefined,
    })
    users.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await roleApi.list()
    roles.value = res.data.list
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchUsers()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUsers()
}

const handleEdit = (record) => {
  editingUser.value = record
  formData.username = record.username
  formData.email = record.email
  formData.phone = record.phone || ''
  formData.realName = record.realName || ''
  formData.roleIds = record.roles?.map(r => r.id) || []
  formData.status = record.status === 1
  showCreateModal.value = true
}

const handleChangePassword = (record) => {
  passwordUserId.value = record.id
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showPasswordModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingUser.value = null
  formRef.value?.resetFields()
  Object.assign(formData, {
    username: '',
    password: '',
    email: '',
    phone: '',
    realName: '',
    roleIds: [],
    status: true,
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    const data = {
      ...formData,
      status: formData.status ? 1 : 0,
    }
    
    if (editingUser.value) {
      await userApi.update(editingUser.value.id, data)
      message.success('更新成功')
    } else {
      await userApi.create(data)
      message.success('创建成功')
    }
    closeModal()
    fetchUsers()
  } catch (error) {
    message.error('操作失败')
  }
}

const handlePasswordSubmit = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次密码不一致')
    return
  }
  try {
    await userApi.changePassword(passwordUserId.value!, '', passwordForm.newPassword)
    message.success('密码修改成功')
    showPasswordModal.value = false
  } catch (error) {
    message.error('密码修改失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await userApi.delete(id)
    message.success('删除成功')
    fetchUsers()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-list {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}
</style>