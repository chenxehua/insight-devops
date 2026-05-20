<template>
  <div class="alert-container">
    <a-card>
      <template #title>
        <div class="card-title">
          <span>告警管理</span>
          <a-button type="primary" @click="handleCreate">
            <template #icon><PlusOutlined /></template>
            新增告警规则
          </a-button>
        </div>
      </template>
      
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'level'">
            <a-tag :color="getLevelColor(record.level)">
              {{ getLevelText(record.level) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form :model="formData" :label-col="{ span: 6 }">
        <a-form-item label="规则名称">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="监控指标">
          <a-select v-model:value="formData.monitorId">
            <a-select-option v-for="m in monitors" :key="m.id" :value="m.id">
              {{ m.monitorName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="告警级别">
          <a-select v-model:value="formData.level">
            <a-select-option value="info">提示</a-select-option>
            <a-select-option value="warning">警告</a-select-option>
            <a-select-option value="error">错误</a-select-option>
            <a-select-option value="critical">严重</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="条件">
          <a-input v-model:value="formData.condition" placeholder="如: value > 90" />
        </a-form-item>
        <a-form-item label="通知方式">
          <a-checkbox-group v-model:value="formData.notifyTypes">
            <a-checkbox value="email">邮件</a-checkbox>
            <a-checkbox value="sms">短信</a-checkbox>
            <a-checkbox value="webhook">Webhook</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { TableProps } from 'ant-design-vue'

interface AlertRecord {
  id: number
  name: string
  monitorId: number
  monitorName?: string
  level: string
  condition: string
  status: number
  notifyTypes: string[]
  createdAt: string
}

interface MonitorRecord {
  id: number
  monitorName: string
}

const loading = ref(false)
const dataSource = ref<AlertRecord[]>([])
const modalVisible = ref(false)
const modalTitle = ref('新增告警规则')
const editingId = ref<number | null>(null)
const monitors = ref<MonitorRecord[]>([])

const formData = reactive({
  name: '',
  monitorId: undefined as number | undefined,
  level: 'warning',
  condition: '',
  notifyTypes: [] as string[]
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '监控指标', dataIndex: 'monitorName', key: 'monitorName' },
  { title: '告警级别', key: 'level' },
  { title: '条件', dataIndex: 'condition', key: 'condition' },
  { title: '状态', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 150 }
]

const getStatusColor = (status: number) => {
  return status === 1 ? 'green' : 'red'
}

const getStatusText = (status: number) => {
  return status === 1 ? '启用' : '禁用'
}

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    critical: 'purple'
  }
  return colors[level] || 'default'
}

const getLevelText = (level: string) => {
  const texts: Record<string, string> = {
    info: '提示',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return texts[level] || level
}

const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/monitors/alerts?page=${pagination.current}&pageSize=${pagination.pageSize}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const result = await response.json()
    if (result.code === 200) {
      dataSource.value = result.data.list || []
      pagination.total = result.data.total || 0
    }
  } catch (error) {
    message.error('获取告警规则列表失败')
  } finally {
    loading.value = false
  }
}

const fetchMonitors = async () => {
  try {
    const response = await fetch('/api/monitors', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const result = await response.json()
    if (result.code === 200) {
      monitors.value = result.data.list || []
    }
  } catch (error) {
    console.error('获取监控指标失败', error)
  }
}

const handleTableChange: TableProps['onChange'] = (pag) => {
  pagination.current = pag.current || 1
  pagination.pageSize = pag.pageSize || 20
  fetchData()
}

const handleCreate = () => {
  modalTitle.value = '新增告警规则'
  editingId.value = null
  Object.assign(formData, {
    name: '',
    monitorId: undefined,
    level: 'warning',
    condition: '',
    notifyTypes: []
  })
  modalVisible.value = true
}

const handleEdit = (record: AlertRecord) => {
  modalTitle.value = '编辑告警规则'
  editingId.value = record.id
  Object.assign(formData, {
    name: record.name,
    monitorId: record.monitorId,
    level: record.level,
    condition: record.condition,
    notifyTypes: record.notifyTypes || []
  })
  modalVisible.value = true
}

const handleSubmit = async () => {
  try {
    const url = editingId.value ? `/api/monitors/alerts/${editingId.value}` : '/api/monitors/alerts'
    const method = editingId.value ? 'PUT' : 'POST'
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    })
    const result = await response.json()
    if (result.code === 200) {
      message.success(editingId.value ? '修改成功' : '创建成功')
      modalVisible.value = false
      fetchData()
    } else {
      message.error(result.message || '操作失败')
    }
  } catch (error) {
    message.error('操作失败')
  }
}

const handleDelete = async (record: AlertRecord) => {
  try {
    const response = await fetch(`/api/monitors/alerts/${record.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const result = await response.json()
    if (result.code === 200) {
      message.success('删除成功')
      fetchData()
    } else {
      message.error(result.message || '删除失败')
    }
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchData()
  fetchMonitors()
})
</script>

<style scoped>
.alert-container {
  padding: 16px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>