<template>
  <div class="fault-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>故障管理</span>
          <a-button type="primary" danger @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建故障
          </a-button>
        </div>
      </template>

      <div class="search-bar">
        <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear @change="handleSearch">
          <a-select-option value="pending">待处理</a-select-option>
          <a-select-option value="processing">处理中</a-select-option>
          <a-select-option value="resolved">已解决</a-select-option>
        </a-select>
        <a-select v-model:value="filterLevel" placeholder="故障级别" style="width: 150px" allowClear @change="handleSearch">
          <a-select-option value="low">轻微</a-select-option>
          <a-select-option value="medium">中等</a-select-option>
          <a-select-option value="high">严重</a-select-option>
          <a-select-option value="critical">紧急</a-select-option>
        </a-select>
        <a-input-search v-model:value="searchKeyword" placeholder="搜索故障标题..." style="width: 300px" @search="handleSearch" />
      </div>

      <a-table :columns="columns" :data-source="faults" :loading="loading" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'faultLevel'">
            <a-tag :color="getLevelColor(record.faultLevel)">{{ getLevelName(record.faultLevel) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge :status="getStatusBadge(record.status)" :text="getStatusName(record.status)" />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button v-if="record.status !== 'resolved'" type="link" size="small" @click="handleProcess(record)">处理</a-button>
              <a-button type="link" size="small" @click="handleViewDetail(record)">详情</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showCreateModal" title="新建故障" width="700px" @ok="handleSubmit" @cancel="closeModal">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="故障标题" name="title" :rules="[{ required: true, message: '请输入故障标题' }]">
          <a-input v-model:value="formData.title" />
        </a-form-item>
        <a-form-item label="故障级别" name="faultLevel" :rules="[{ required: true, message: '请选择故障级别' }]">
          <a-select v-model:value="formData.faultLevel">
            <a-select-option value="low">轻微</a-select-option>
            <a-select-option value="medium">中等</a-select-option>
            <a-select-option value="high">严重</a-select-option>
            <a-select-option value="critical">紧急</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="相关应用" name="appId">
          <a-select v-model:value="formData.appId" placeholder="选择应用" allowClear>
            <a-select-option v-for="app in apps" :key="app.id" :value="app.id">{{ app.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="故障描述" name="description" :rules="[{ required: true, message: '请输入故障描述' }]">
          <a-textarea v-model:value="formData.description" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showProcessModal" title="处理故障" width="600px" @ok="handleProcessSubmit">
      <a-form :model="processForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="处理状态">
          <a-select v-model:value="processForm.status">
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="resolved">已解决</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="处理备注" name="handleNote">
          <a-textarea v-model:value="processForm.handleNote" :rows="4" placeholder="请输入处理过程和结果..." />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showDetailModal" title="故障详情" width="700px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="故障标题" :span="2">{{ currentFault?.title }}</a-descriptions-item>
        <a-descriptions-item label="故障级别"><a-tag :color="getLevelColor(currentFault?.faultLevel)">{{ getLevelName(currentFault?.faultLevel) }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="状态"><a-badge :status="getStatusBadge(currentFault?.status)" :text="getStatusName(currentFault?.status)" /></a-descriptions-item>
        <a-descriptions-item label="相关应用">{{ currentFault?.appName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ currentFault?.creator }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentFault?.createdAt }}</a-descriptions-item>
        <a-descriptions-item label="故障描述" :span="2">{{ currentFault?.description }}</a-descriptions-item>
        <a-descriptions-item label="处理过程" :span="2">{{ currentFault?.handleNote || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { faultApi, appApi } from '@/services/api'
import { message } from 'ant-design-vue'

const faults = ref([])
const apps = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterLevel = ref('')
const showCreateModal = ref(false)
const showProcessModal = ref(false)
const showDetailModal = ref(false)
const currentFault = ref<any>()
const formRef = ref()

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const formData = reactive({ title: '', faultLevel: 'medium', appId: undefined as number | undefined, description: '' })
const processForm = reactive({ status: 'resolved', handleNote: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '故障标题', dataIndex: 'title', key: 'title' },
  { title: '级别', dataIndex: 'faultLevel', key: 'faultLevel', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '应用', dataIndex: 'appName', key: 'appName', width: 120 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 120 },
]

const getLevelColor = (level: string) => ({ low: 'green', medium: 'orange', high: 'red', critical: 'red' }[level] || 'default')
const getLevelName = (level: string) => ({ low: '轻微', medium: '中等', high: '严重', critical: '紧急' }[level] || level)
const getStatusName = (status: string) => ({ pending: '待处理', processing: '处理中', resolved: '已解决' }[status] || status)
const getStatusBadge = (status: string) => ({ pending: 'warning', processing: 'processing', resolved: 'success' }[status] || 'default')

const fetchFaults = async () => {
  loading.value = true
  try {
    const res = await faultApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      status: filterStatus.value || undefined, faultLevel: filterLevel.value || undefined, keyword: searchKeyword.value,
    })
    faults.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取故障列表失败') }
  finally { loading.value = false }
}

const fetchApps = async () => { try { const res = await appApi.list(); apps.value = res.data.list } catch {} }

const handleSearch = () => { pagination.current = 1; fetchFaults() }
const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchFaults() }

const handleProcess = (record: any) => { currentFault.value = record; processForm.status = 'resolved'; processForm.handleNote = ''; showProcessModal.value = true }
const handleViewDetail = (record: any) => { currentFault.value = record; showDetailModal.value = true }

const closeModal = () => { showCreateModal.value = false; formRef.value?.resetFields(); Object.assign(formData, { title: '', faultLevel: 'medium', appId: undefined, description: '' }) }

const handleSubmit = async () => {
  try { await formRef.value?.validate(); await faultApi.create(formData); message.success('创建成功'); closeModal(); fetchFaults() }
  catch (error) { message.error('操作失败') }
}

const handleProcessSubmit = async () => {
  try {
    await faultApi.update(currentFault.value!.id, processForm)
    message.success('处理成功')
    showProcessModal.value = false
    fetchFaults()
  } catch (error) { message.error('处理失败') }
}

onMounted(() => { fetchFaults(); fetchApps() })
</script>

<style scoped>
.fault-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>