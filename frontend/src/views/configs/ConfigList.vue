<template>
  <div class="config-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>配置管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建配置
          </a-button>
        </div>
      </template>

      <div class="search-bar">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索配置Key..." style="width: 300px" @search="handleSearch" />
        <a-select v-model:value="filterEnv" placeholder="环境" style="width: 150px" allowClear @change="handleSearch">
          <a-select-option value="dev">开发环境</a-select-option>
          <a-select-option value="test">测试环境</a-select-option>
          <a-select-option value="staging">预发布</a-select-option>
          <a-select-option value="prod">生产环境</a-select-option>
        </a-select>
      </div>

      <a-table :columns="columns" :data-source="configs" :loading="loading" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'environment'">
            <a-tag :color="getEnvColor(record.environment)">{{ getEnvName(record.environment) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewVersions(record)">版本</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该配置？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showCreateModal" :title="editingConfig ? '编辑配置' : '新建配置'" width="700px" @ok="handleSubmit" @cancel="closeModal">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
        <a-form-item label="配置Key" name="key" :rules="[{ required: true, message: '请输入配置Key' }]">
          <a-input v-model:value="formData.key" placeholder="如: app.feature.flags" :disabled="!!editingConfig" />
        </a-form-item>
        <a-form-item label="环境" name="environment" :rules="[{ required: true, message: '请选择环境' }]">
          <a-select v-model:value="formData.environment">
            <a-select-option value="dev">开发环境</a-select-option>
            <a-select-option value="test">测试环境</a-select-option>
            <a-select-option value="staging">预发布环境</a-select-option>
            <a-select-option value="prod">生产环境</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="配置值" name="value" :rules="[{ required: true, message: '请输入配置值' }]">
          <a-textarea v-model:value="formData.value" :rows="6" placeholder="JSON或纯文本格式" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showVersionsModal" title="配置版本历史" width="800px" :footer="null">
      <a-table :columns="versionColumns" :data-source="versions" :pagination="versionPagination" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { configApi } from '@/services/api'
import { message } from 'ant-design-vue'

const configs = ref([])
const versions = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterEnv = ref('')
const showCreateModal = ref(false)
const showVersionsModal = ref(false)
const editingConfig = ref(null)
const formRef = ref()

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const versionPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const formData = reactive({ key: '', environment: 'dev', value: '', description: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '配置Key', dataIndex: 'key', key: 'key' },
  { title: '环境', dataIndex: 'environment', key: 'environment', width: 100 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'action', width: 150 },
]

const versionColumns = [
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '配置值', dataIndex: 'value', key: 'value', ellipsis: true },
  { title: '更新人', dataIndex: 'updatedBy', key: 'updatedBy' },
  { title: '更新时间', dataIndex: 'createdAt', key: 'createdAt' },
]

const getEnvColor = (env: string) => ({ dev: 'blue', test: 'green', staging: 'orange', prod: 'red' }[env] || 'default')
const getEnvName = (env: string) => ({ dev: '开发', test: '测试', staging: '预发布', prod: '生产' }[env] || env)

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await configApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      keyword: searchKeyword.value, environment: filterEnv.value || undefined,
    })
    configs.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取配置列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.current = 1; fetchConfigs() }
const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchConfigs() }

const handleViewVersions = async (record: any) => {
  try {
    const res = await configApi.getVersions(record.id)
    versions.value = res.data.list
  } catch (error) { message.error('获取版本历史失败') }
  showVersionsModal.value = true
}

const handleEdit = (record: any) => {
  editingConfig.value = record
  Object.assign(formData, record)
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingConfig.value = null
  formRef.value?.resetFields()
  Object.assign(formData, { key: '', environment: 'dev', value: '', description: '' })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (editingConfig.value) {
      await configApi.update(editingConfig.value.id, formData)
      message.success('更新成功')
    } else {
      await configApi.create(formData)
      message.success('创建成功')
    }
    closeModal()
    fetchConfigs()
  } catch (error) { message.error('操作失败') }
}

const handleDelete = async (id: number) => {
  try { await configApi.delete(id); message.success('删除成功'); fetchConfigs() }
  catch (error) { message.error('删除失败') }
}

onMounted(fetchConfigs)
</script>

<style scoped>
.config-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>