<template>
  <div class="role-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>角色管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建角色
          </a-button>
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'">
            <a-tag v-for="perm in record.permissions" :key="perm" color="purple">
              {{ perm }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该角色？"
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

    <a-modal
      v-model:open="showCreateModal"
      :title="editingRole ? '编辑角色' : '新建角色'"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="角色名称" name="name" :rules="[{ required: true, message: '请输入角色名称' }]">
          <a-input v-model:value="formData.name" :disabled="!!editingRole" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-input v-model:value="formData.description" type="textarea" />
        </a-form-item>
        <a-form-item label="权限" name="permissions">
          <a-select v-model:value="formData.permissions" mode="tags" placeholder="选择权限">
            <a-select-option value="user:view">查看用户</a-select-option>
            <a-select-option value="user:manage">管理用户</a-select-option>
            <a-select-option value="app:view">查看应用</a-select-option>
            <a-select-option value="app:manage">管理应用</a-select-option>
            <a-select-option value="deploy:view">查看部署</a-select-option>
            <a-select-option value="deploy:manage">管理部署</a-select-option>
            <a-select-option value="script:manage">管理脚本</a-select-option>
            <a-select-option value="config:manage">管理配置</a-select-option>
            <a-select-option value="monitor:manage">管理监控</a-select-option>
            <a-select-option value="log:manage">管理日志</a-select-option>
            <a-select-option value="fault:manage">管理故障</a-select-option>
            <a-select-option value="image:manage">管理镜像</a-select-option>
            <a-select-option value="backup:manage">管理备份</a-select-option>
            <a-select-option value="check:manage">管理巡检</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { roleApi } from '@/services/api'
import { message } from 'ant-design-vue'

const roles = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const editingRole = ref(null)
const formRef = ref()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  name: '',
  description: '',
  permissions: [],
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '权限', key: 'permissions', width: 400 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 150 },
]

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await roleApi.list({
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
    roles.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) {
    message.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchRoles()
}

const handleEdit = (record) => {
  editingRole.value = record
  formData.name = record.name
  formData.description = record.description || ''
  formData.permissions = record.permissions || []
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingRole.value = null
  formRef.value?.resetFields()
  Object.assign(formData, { name: '', description: '', permissions: [] })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (editingRole.value) {
      await roleApi.update(editingRole.value.id, formData)
      message.success('更新成功')
    } else {
      await roleApi.create(formData)
      message.success('创建成功')
    }
    closeModal()
    fetchRoles()
  } catch (error) {
    message.error('操作失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await roleApi.delete(id)
    message.success('删除成功')
    fetchRoles()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.role-list {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>