<template>
  <div class="deploy-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>部署管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建部署
          </a-button>
        </div>
      </template>

      <div class="search-bar">
        <a-select
          v-model:value="filterApp"
          placeholder="选择应用"
          style="width: 200px"
          allowClear
          @change="handleSearch"
        >
          <a-select-option v-for="app in apps" :key="app.id" :value="app.id">
            {{ app.name }}
          </a-select-option>
        </a-select>
        <a-select
          v-model:value="filterEnv"
          placeholder="环境"
          style="width: 150px"
          allowClear
          @change="handleSearch"
        >
          <a-select-option value="dev">开发环境</a-select-option>
          <a-select-option value="test">测试环境</a-select-option>
          <a-select-option value="staging">预发布</a-select-option>
          <a-select-option value="prod">生产环境</a-select-option>
        </a-select>
        <a-select
          v-model:value="filterStatus"
          placeholder="状态"
          style="width: 150px"
          allowClear
          @change="handleSearch"
        >
          <a-select-option value="pending">待执行</a-select-option>
          <a-select-option value="running">执行中</a-select-option>
          <a-select-option value="success">成功</a-select-option>
          <a-select-option value="failed">失败</a-select-option>
        </a-select>
      </div>

      <a-table
        :columns="columns"
        :data-source="deploys"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'environment'">
            <a-tag :color="getEnvColor(record.environment)">
              {{ getEnvName(record.environment) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusName(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="record.status === 'pending' || record.status === 'failed'"
                type="link"
                size="small"
                @click="handleExecute(record)"
              >执行</a-button>
              <a-button
                v-if="record.status === 'success'"
                type="link"
                size="small"
                @click="handleRollback(record)"
              >回滚</a-button>
              <a-button type="link" size="small" @click="handleViewLog(record)">日志</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="showCreateModal"
      title="新建部署"
      width="700px"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="任务名称" name="name" :rules="[{ required: true, message: '请输入任务名称' }]">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="应用" name="appId" :rules="[{ required: true, message: '请选择应用' }]">
          <a-select v-model:value="formData.appId" placeholder="选择应用">
            <a-select-option v-for="app in apps" :key="app.id" :value="app.id">
              {{ app.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="环境" name="environment" :rules="[{ required: true, message: '请选择环境' }]">
          <a-select v-model:value="formData.environment">
            <a-select-option value="dev">开发环境</a-select-option>
            <a-select-option value="test">测试环境</a-select-option>
            <a-select-option value="staging">预发布环境</a-select-option>
            <a-select-option value="prod">生产环境</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="版本" name="version" :rules="[{ required: true, message: '请输入版本号' }]">
          <a-input v-model:value="formData.version" placeholder="如: 1.0.0" />
        </a-form-item>
        <a-form-item label="部署方式" name="deployType">
          <a-select v-model:value="formData.deployType">
            <a-select-option value="k8s">K8S部署</a-select-option>
            <a-select-option value="docker">Docker部署</a-select-option>
            <a-select-option value="traditional">传统部署</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formData.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showLogModal"
      title="部署日志"
      width="900px"
      :footer="null"
    >
      <pre class="log-content">{{ deployLog || '暂无日志' }}</pre>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { deployApi, appApi } from '@/services/api'
import { message } from 'ant-design-vue'

const deploys = ref([])
const apps = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showLogModal = ref(false)
const currentDeploy = ref(null)
const deployLog = ref('')
const formRef = ref()
const filterApp = ref<number>()
const filterEnv = ref('')
const filterStatus = ref('')

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  name: '',
  appId: undefined as number | undefined,
  environment: 'test',
  version: '',
  deployType: 'k8s',
  remark: '',
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '应用', dataIndex: 'appName', key: 'appName', width: 120 },
  { title: '环境', dataIndex: 'environment', key: 'environment', width: 100 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '执行人', dataIndex: 'executor', key: 'executor', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
]

const getEnvColor = (env: string) => {
  const colors: Record<string, string> = {
    dev: 'blue', test: 'green', staging: 'orange', prod: 'red',
  }
  return colors[env] || 'default'
}

const getEnvName = (env: string) => {
  const names: Record<string, string> = {
    dev: '开发', test: '测试', staging: '预发布', prod: '生产',
  }
  return names[env] || env
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'default', running: 'processing', success: 'success', failed: 'error',
  }
  return colors[status] || 'default'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    pending: '待执行', running: '执行中', success: '成功', failed: '失败',
  }
  return names[status] || status
}

const fetchDeploys = async () => {
  loading.value = true
  try {
    const res = await deployApi.list({
      page: pagination.current,
      pageSize: pagination.pageSize,
      appId: filterApp.value,
      environment: filterEnv.value || undefined,
      status: filterStatus.value || undefined,
    })
    deploys.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    message.error('获取部署列表失败')
  } finally {
    loading.value = false
  }
}

const fetchApps = async () => {
  try {
    const res = await appApi.list()
    apps.value = res.data.list
  } catch (error) {
    console.error('获取应用列表失败', error)
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchDeploys()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchDeploys()
}

const handleExecute = async (record: any) => {
  try {
    await deployApi.execute(record.id)
    message.success('部署已启动')
    fetchDeploys()
  } catch (error) {
    message.error('部署启动失败')
  }
}

const handleRollback = async (record: any) => {
  try {
    await deployApi.rollback(record.id)
    message.success('回滚已启动')
    fetchDeploys()
  } catch (error) {
    message.error('回滚启动失败')
  }
}

const handleViewLog = (record: any) => {
  currentDeploy.value = record
  deployLog.value = record.log || `部署任务 #${record.id} 日志\n开始时间: ${record.createdAt}\n状态: ${record.status}`
  showLogModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '', appId: undefined, environment: 'test', version: '', deployType: 'k8s', remark: '',
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    await deployApi.create(formData)
    message.success('创建成功')
    closeModal()
    fetchDeploys()
  } catch (error) {
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchDeploys()
  fetchApps()
})
</script>

<style scoped>
.deploy-list {
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

.log-content {
  max-height: 500px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
}
</style>