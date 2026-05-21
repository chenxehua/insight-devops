<template>
  <div class="app-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>应用管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建应用
          </a-button>
        </div>
      </template>

      <div class="search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索应用名称、Key..."
          style="width: 300px"
          @search="handleSearch"
        />
        <a-select
          v-model:value="filterType"
          placeholder="应用类型"
          style="width: 150px"
          allowClear
          @change="handleSearch"
        >
          <a-select-option value="java">Java</a-select-option>
          <a-select-option value="nodejs">Node.js</a-select-option>
          <a-select-option value="python">Python</a-select-option>
          <a-select-option value="go">Go</a-select-option>
          <a-select-option value="other">其他</a-select-option>
        </a-select>
      </div>

      <a-table
        :columns="columns"
        :data-source="apps"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'appType'">
            <a-tag :color="getAppTypeColor(record.appType)">
              {{ record.appType?.toUpperCase() }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '正常' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">详情</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该应用？"
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
      :title="editingApp ? '编辑应用' : '新建应用'"
      width="600px"
      @ok="handleSubmit"
      @cancel="closeModal"
    >
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="应用名称" name="name" :rules="[{ required: true, message: '请输入应用名称' }]">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="应用Key" name="appKey" :rules="[{ required: true, message: '请输入应用Key' }]">
          <a-input v-model:value="formData.appKey" :disabled="!!editingApp" />
        </a-form-item>
        <a-form-item label="应用类型" name="appType" :rules="[{ required: true, message: '请选择应用类型' }]">
          <a-select v-model:value="formData.appType">
            <a-select-option value="java">Java</a-select-option>
            <a-select-option value="nodejs">Node.js</a-select-option>
            <a-select-option value="python">Python</a-select-option>
            <a-select-option value="go">Go</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="3" />
        </a-form-item>
        <a-form-item label="Git仓库" name="gitUrl">
          <a-input v-model:value="formData.gitUrl" placeholder="https://github.com/..." />
        </a-form-item>
        <a-form-item label="主页" name="homeUrl">
          <a-input v-model:value="formData.homeUrl" placeholder="http://..." />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showDetailModal"
      title="应用详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="应用名称">{{ currentApp?.name }}</a-descriptions-item>
        <a-descriptions-item label="应用Key">{{ currentApp?.appKey }}</a-descriptions-item>
        <a-descriptions-item label="应用类型">{{ currentApp?.appType }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="currentApp?.status === 1 ? 'green' : 'red'">
            {{ currentApp?.status === 1 ? '正常' : '停用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Git仓库" :span="2">{{ currentApp?.gitUrl || '-' }}</a-descriptions-item>
        <a-descriptions-item label="主页" :span="2">{{ currentApp?.homeUrl || '-' }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ currentApp?.description || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentApp?.createdAt }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ currentApp?.updatedAt }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { appApi } from '@/services/api'
import { message } from 'ant-design-vue'

const apps = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const editingApp = ref(null)
const currentApp = ref(null)
const formRef = ref()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

const formData = reactive({
  name: '',
  appKey: '',
  appType: 'java',
  description: '',
  gitUrl: '',
  homeUrl: '',
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '应用名称', dataIndex: 'name', key: 'name' },
  { title: '应用Key', dataIndex: 'appKey', key: 'appKey' },
  { title: '类型', dataIndex: 'appType', key: 'appType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180 },
]

const getAppTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    java: 'blue',
    nodejs: 'green',
    python: 'orange',
    go: 'cyan',
    other: 'default',
  }
  return colors[type] || 'default'
}

const fetchApps = async () => {
  loading.value = true
  try {
    const res = await appApi.list({
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      appType: filterType.value || undefined,
    })
    apps.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    message.error('获取应用列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchApps()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchApps()
}

const handleView = (record) => {
  currentApp.value = record
  showDetailModal.value = true
}

const handleEdit = (record) => {
  editingApp.value = record
  Object.assign(formData, record)
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingApp.value = null
  formRef.value?.resetFields()
  Object.assign(formData, {
    name: '', appKey: '', appType: 'java', description: '', gitUrl: '', homeUrl: '',
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (editingApp.value) {
      await appApi.update(editingApp.value.id, formData)
      message.success('更新成功')
    } else {
      await appApi.create(formData)
      message.success('创建成功')
    }
    closeModal()
    fetchApps()
  } catch (error) {
    message.error('操作失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await appApi.delete(id)
    message.success('删除成功')
    fetchApps()
  } catch (error) {
    message.error('删除失败')
  }
}

onMounted(fetchApps)
</script>

<style scoped>
.app-list {
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