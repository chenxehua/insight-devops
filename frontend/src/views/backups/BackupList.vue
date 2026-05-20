<template>
  <div class="backup-list">
    <a-card :title="activeTab === 'databases' ? '数据库管理' : '备份记录'">
      <template #extra>
        <a-button v-if="activeTab === 'databases'" type="primary" @click="showDatabaseModal = true">
          <template #icon><PlusOutlined /></template>
          新建数据库
        </a-button>
      </template>

      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="databases" tab="数据库管理" />
        <a-tab-pane key="backups" tab="备份记录" />
      </a-tabs>

      <div v-if="activeTab === 'databases'">
        <a-table :columns="dbColumns" :data-source="databases" :loading="loading" :pagination="pagination" @change="handleDbTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'dbType'">
              <a-tag :color="getDbTypeColor(record.dbType)">{{ record.dbType?.toUpperCase() }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleBackup(record)">备份</a-button>
                <a-button type="link" size="small" @click="handleEditDb(record)">编辑</a-button>
                <a-popconfirm title="确定删除该数据库配置？" ok-text="确定" cancel-text="取消" @confirm="handleDeleteDb(record.id)">
                  <a-button type="link" danger size="small">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>

      <div v-else>
        <div class="search-bar">
          <a-select v-model:value="filterDb" placeholder="选择数据库" style="width: 200px" allowClear @change="fetchBackups">
            <a-select-option v-for="db in databases" :key="db.id" :value="db.id">{{ db.name }}</a-select-option>
          </a-select>
          <a-select v-model:value="filterType" placeholder="备份类型" style="width: 150px" allowClear @change="fetchBackups">
            <a-select-option value="full">全量备份</a-select-option>
            <a-select-option value="incremental">增量备份</a-select-option>
          </a-select>
          <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear @change="fetchBackups">
            <a-select-option value="pending">待执行</a-select-option>
            <a-select-option value="running">执行中</a-select-option>
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </div>
        <a-table :columns="backupColumns" :data-source="backups" :loading="loading" :pagination="pagination" @change="handleBackupTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'backupType'">
              <a-tag>{{ record.backupType === 'full' ? '全量' : '增量' }}</a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="getBackupStatusBadge(record.status)" :text="getBackupStatusName(record.status)" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button v-if="record.status === 'success'" type="link" size="small" @click="handleRestore(record)">恢复</a-button>
                <a-button v-if="record.status === 'success'" type="link" size="small" @click="handleDownload(record)">下载</a-button>
                <a-button v-if="record.status === 'failed'" type="link" size="small" @click="handleRetry(record)">重试</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <a-modal v-model:open="showDatabaseModal" :title="editingDb ? '编辑数据库' : '新建数据库'" @ok="handleDbSubmit">
      <a-form ref="dbFormRef" :model="dbFormData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="数据库名称" name="name" :rules="[{ required: true, message: '请输入数据库名称' }]">
          <a-input v-model:value="dbFormData.name" />
        </a-form-item>
        <a-form-item label="数据库类型" name="dbType" :rules="[{ required: true, message: '请选择数据库类型' }]">
          <a-select v-model:value="dbFormData.dbType">
            <a-select-option value="mysql">MySQL</a-select-option>
            <a-select-option value="postgresql">PostgreSQL</a-select-option>
            <a-select-option value="mongodb">MongoDB</a-select-option>
            <a-select-option value="redis">Redis</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="主机" name="host" :rules="[{ required: true, message: '请输入主机地址' }]">
          <a-input v-model:value="dbFormData.host" />
        </a-form-item>
        <a-form-item label="端口" name="port">
          <a-input-number v-model:value="dbFormData.port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="dbFormData.username" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="dbFormData.password" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="dbFormData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { backupApi } from '@/services/api'
import { message } from 'ant-design-vue'

const activeTab = ref('databases')
const databases = ref([])
const backups = ref([])
const loading = ref(false)
const showDatabaseModal = ref(false)
const editingDb = ref(null)
const dbFormRef = ref()
const filterDb = ref<number>()
const filterType = ref('')
const filterStatus = ref('')

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const dbFormData = reactive({ name: '', dbType: 'mysql', host: 'localhost', port: 3306, username: '', password: '', description: '' })

const dbColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'dbType', key: 'dbType', width: 100 },
  { title: '连接', dataIndex: 'host', key: 'host' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180 },
]

const backupColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '数据库', dataIndex: 'dbName', key: 'dbName', width: 120 },
  { title: '备份类型', dataIndex: 'backupType', key: 'backupType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '文件大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
]

const getDbTypeColor = (type: string) => ({ mysql: 'blue', postgresql: 'orange', mongodb: 'green', redis: 'purple' }[type] || 'default')
const getBackupStatusBadge = (status: string) => ({ pending: 'warning', running: 'processing', success: 'success', failed: 'error' }[status] || 'default')
const getBackupStatusName = (status: string) => ({ pending: '待执行', running: '执行中', success: '成功', failed: '失败' }[status] || status)

const fetchDatabases = async () => {
  loading.value = true
  try {
    const res = await backupApi.listDatabases({ page: pagination.current, pageSize: pagination.pageSize })
    databases.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取数据库列表失败') }
  finally { loading.value = false }
}

const fetchBackups = async () => {
  loading.value = true
  try {
    const res = await backupApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      databaseId: filterDb.value, backupType: filterType.value || undefined, status: filterStatus.value || undefined,
    })
    backups.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取备份列表失败') }
  finally { loading.value = false }
}

const handleDbTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchDatabases() }
const handleBackupTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchBackups() }

const handleBackup = async (record: any) => {
  try {
    await backupApi.create({ databaseId: record.id, backupType: 'full' })
    message.success('备份任务已创建')
    activeTab.value = 'backups'
    fetchBackups()
  } catch (error) { message.error('备份创建失败') }
}

const handleEditDb = (record: any) => { editingDb.value = record; Object.assign(dbFormData, record); showDatabaseModal.value = true }

const handleDbSubmit = async () => {
  try {
    await dbFormRef.value?.validate()
    if (editingDb.value) {
      await backupApi.updateDatabase(editingDb.value.id, dbFormData)
      message.success('更新成功')
    } else {
      await backupApi.createDatabase(dbFormData)
      message.success('创建成功')
    }
    showDatabaseModal.value = false
    fetchDatabases()
  } catch (error) { message.error('操作失败') }
}

const handleDeleteDb = async (id: number) => {
  try { await backupApi.deleteDatabase(id); message.success('删除成功'); fetchDatabases() }
  catch (error) { message.error('删除失败') }
}

const handleRestore = (record: any) => { message.info('恢复功能开发中') }
const handleDownload = (record: any) => { message.info('下载功能开发中') }
const handleRetry = (record: any) => { message.info('重试功能开发中') }

onMounted(fetchDatabases)
</script>

<style scoped>
.backup-list { padding: 24px; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>