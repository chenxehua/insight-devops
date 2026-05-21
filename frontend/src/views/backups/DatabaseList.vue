<template>
  <div class="database-list">
    <a-card>
      <template #title>
        <div class="card-title">
          <span>数据库管理</span>
          <a-button type="primary" @click="showAddModal = true">
            <template #icon><PlusOutlined /></template>
            添加数据库
          </a-button>
        </div>
      </template>
      
      <div class="filter-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索数据库名称或主机"
          style="width: 250px"
          @search="onSearch"
        />
        <a-select
          v-model:value="filterDbType"
          placeholder="数据库类型"
          style="width: 150px"
          allowClear
          @change="loadData"
        >
          <a-select-option value="mysql">MySQL</a-select-option>
          <a-select-option value="postgresql">PostgreSQL</a-select-option>
          <a-select-option value="mongodb">MongoDB</a-select-option>
          <a-select-option value="redis">Redis</a-select-option>
        </a-select>
      </div>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '异常' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑弹窗 -->
    <a-modal
      v-model:open="showAddModal"
      :title="editingRecord ? '编辑数据库' : '添加数据库'"
      @ok="handleSubmit"
      @cancel="closeModal"
      width="600px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="数据库名称" name="dbName" :rules="[{ required: true, message: '请输入数据库名称' }]">
          <a-input v-model:value="formData.dbName" placeholder="请输入数据库名称" />
        </a-form-item>
        <a-form-item label="数据库类型" name="dbType" :rules="[{ required: true, message: '请选择数据库类型' }]">
          <a-select v-model:value="formData.dbType" placeholder="请选择数据库类型">
            <a-select-option value="mysql">MySQL</a-select-option>
            <a-select-option value="postgresql">PostgreSQL</a-select-option>
            <a-select-option value="mongodb">MongoDB</a-select-option>
            <a-select-option value="redis">Redis</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="主机地址" name="host" :rules="[{ required: true, message: '请输入主机地址' }]">
          <a-input v-model:value="formData.host" placeholder="请输入主机地址" />
        </a-form-item>
        <a-form-item label="端口" name="port" :rules="[{ required: true, message: '请输入端口' }]">
          <a-input-number v-model:value="formData.port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formData.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formData.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" placeholder="请输入描述" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { backupApi } from '@/services/api'
import { useBackupStore } from '@/stores/backup'

const store = useBackupStore()

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '数据库名称', dataIndex: 'dbName', key: 'dbName' },
  { title: '类型', dataIndex: 'dbType', key: 'dbType' },
  { title: '主机', dataIndex: 'host', key: 'host' },
  { title: '端口', dataIndex: 'port', key: 'port', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 150 }
]

const loading = ref(false)
const dataSource = ref([])
const searchKeyword = ref('')
const filterDbType = ref<string | undefined>()
const showAddModal = ref(false)
const editingRecord = ref<any>(null)
const formRef = ref()

const formData = reactive({
  dbName: '',
  dbType: '',
  host: '',
  port: 3306,
  username: '',
  password: '',
  description: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await store.fetchDatabases({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value || undefined,
      dbType: filterDbType.value
    })
    if (res.code === 200) {
      dataSource.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const onSearch = () => {
  pagination.current = 1
  loadData()
}

const handleEdit = (record: any) => {
  editingRecord.value = record
  Object.assign(formData, {
    dbName: record.dbName,
    dbType: record.dbType,
    host: record.host,
    port: record.port,
    username: record.username || '',
    password: '',
    description: record.description || ''
  })
  showAddModal.value = true
}

const handleDelete = async (record: any) => {
  // 确认删除逻辑
  try {
    await store.deleteDatabase(record.id)
    message.success('删除成功')
    loadData()
  } catch {
    message.error('删除失败')
  }
}

const handleSubmit = async () => {
  try {
    if (editingRecord.value) {
      await store.updateDatabase(editingRecord.value.id, formData)
      message.success('更新成功')
    } else {
      await store.createDatabase(formData)
      message.success('创建成功')
    }
    closeModal()
    loadData()
  } catch {
    message.error(editingRecord.value ? '更新失败' : '创建失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  editingRecord.value = null
  Object.assign(formData, {
    dbName: '',
    dbType: '',
    host: '',
    port: 3306,
    username: '',
    password: '',
    description: ''
  })
}
</script>

<style scoped>
.database-list {
  padding: 0;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>