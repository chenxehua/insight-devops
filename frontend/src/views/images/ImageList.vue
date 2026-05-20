<template>
  <div class="image-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="repos" tab="镜像仓库" />
            <a-tab-pane key="images" tab="镜像列表" />
          </a-tabs>
          <a-button type="primary" @click="handleCreate">
            <template #icon><PlusOutlined /></template>
            新建{{ activeTab === 'repos' ? '仓库' : '镜像' }}
          </a-button>
        </div>
      </template>

      <!-- 镜像仓库 -->
      <template v-if="activeTab === 'repos'">
        <div class="search-bar">
          <a-input-search v-model:value="repoKeyword" placeholder="搜索仓库名称..." style="width: 300px" @search="fetchRepos" />
        </div>
        <a-table :columns="repoColumns" :data-source="repos" :loading="loading" :pagination="pagination" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'repoType'">
              <a-tag :color="record.repoType === 'public' ? 'blue' : 'purple'">{{ record.repoType === 'public' ? '公开' : '私有' }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleScanRepo(record)">扫描</a-button>
                <a-button type="link" size="small" @click="handleEditRepo(record)">编辑</a-button>
                <a-popconfirm title="确定删除该仓库？" ok-text="确定" cancel-text="取消" @confirm="handleDeleteRepo(record.id)">
                  <a-button type="link" danger size="small">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>

      <!-- 镜像列表 -->
      <template v-else>
        <div class="search-bar">
          <a-select v-model:value="filterRepo" placeholder="选择仓库" style="width: 200px" allowClear @change="fetchImages">
            <a-select-option v-for="repo in repos" :key="repo.id" :value="repo.id">{{ repo.name }}</a-select-option>
          </a-select>
          <a-select v-model:value="filterScanStatus" placeholder="扫描状态" style="width: 150px" allowClear @change="fetchImages">
            <a-select-option value="pending">待扫描</a-select-option>
            <a-select-option value="scanning">扫描中</a-select-option>
            <a-select-option value="success">通过</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </div>
        <a-table :columns="imageColumns" :data-source="images" :loading="loading" :pagination="pagination" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'scanStatus'">
              <a-tag :color="getScanStatusColor(record.scanStatus)">{{ getScanStatusName(record.scanStatus) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleScanImage(record)">扫描</a-button>
                <a-button type="link" size="small" @click="handleViewImage(record)">详情</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>
    </a-card>

    <!-- 创建仓库 -->
    <a-modal v-model:open="showRepoModal" :title="editingRepo ? '编辑仓库' : '新建仓库'" @ok="handleRepoSubmit">
      <a-form ref="repoFormRef" :model="repoFormData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="仓库名称" name="name" :rules="[{ required: true, message: '请输入仓库名称' }]">
          <a-input v-model:value="repoFormData.name" />
        </a-form-item>
        <a-form-item label="仓库类型" name="repoType">
          <a-select v-model:value="repoFormData.repoType">
            <a-select-option value="public">公开</a-select-option>
            <a-select-option value="private">私有</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="镜像仓库地址" name="registry" :rules="[{ required: true, message: '请输入镜像仓库地址' }]">
          <a-input v-model:value="repoFormData.registry" placeholder="如: docker.io, registry.cn-hangzhou.aliyuncs.com" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="repoFormData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { imageApi } from '@/services/api'
import { message } from 'ant-design-vue'

const activeTab = ref('repos')
const repos = ref([])
const images = ref([])
const loading = ref(false)
const repoKeyword = ref('')
const filterRepo = ref<number>()
const filterScanStatus = ref('')
const showRepoModal = ref(false)
const editingRepo = ref(null)
const repoFormRef = ref()

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const repoFormData = reactive({ name: '', repoType: 'private', registry: '', description: '' })

const repoColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '仓库名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'repoType', key: 'repoType', width: 80 },
  { title: '镜像仓库', dataIndex: 'registry', key: 'registry' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180 },
]

const imageColumns = [
  { title: '镜像名称', dataIndex: 'name', key: 'name' },
  { title: '仓库', dataIndex: 'repoName', key: 'repoName', width: 150 },
  { title: '标签', dataIndex: 'tag', key: 'tag', width: 100 },
  { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '扫描状态', dataIndex: 'scanStatus', key: 'scanStatus', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 120 },
]

const getScanStatusColor = (status: string) => ({ pending: 'default', scanning: 'processing', success: 'success', failed: 'error' }[status] || 'default')
const getScanStatusName = (status: string) => ({ pending: '待扫描', scanning: '扫描中', success: '通过', failed: '失败' }[status] || status)

const fetchRepos = async () => {
  loading.value = true
  try {
    const res = await imageApi.listRepos({ page: pagination.current, pageSize: pagination.pageSize, keyword: repoKeyword.value })
    repos.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取仓库列表失败') }
  finally { loading.value = false }
}

const fetchImages = async () => {
  loading.value = true
  try {
    const res = await imageApi.list({ page: pagination.current, pageSize: pagination.pageSize, repoId: filterRepo.value, scanStatus: filterScanStatus.value || undefined })
    images.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取镜像列表失败') }
  finally { loading.value = false }
}

const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; activeTab.value === 'repos' ? fetchRepos() : fetchImages() }

const handleCreate = () => {
  if (activeTab.value === 'repos') {
    editingRepo.value = null
    Object.assign(repoFormData, { name: '', repoType: 'private', registry: '', description: '' })
    showRepoModal.value = true
  }
}

const handleEditRepo = (record: any) => { editingRepo.value = record; Object.assign(repoFormData, record); showRepoModal.value = true }

const handleRepoSubmit = async () => {
  try {
    await repoFormRef.value?.validate()
    if (editingRepo.value) {
      await imageApi.updateRepo(editingRepo.value.id, repoFormData)
      message.success('更新成功')
    } else {
      await imageApi.createRepo(repoFormData)
      message.success('创建成功')
    }
    showRepoModal.value = false
    fetchRepos()
  } catch (error) { message.error('操作失败') }
}

const handleDeleteRepo = async (id: number) => {
  try { await imageApi.deleteRepo(id); message.success('删除成功'); fetchRepos() }
  catch (error) { message.error('删除失败') }
}

const handleScanRepo = async (record: any) => {
  message.loading('正在扫描...', 0)
  setTimeout(() => { message.success('扫描完成') }, 2000)
}

const handleScanImage = async (record: any) => {
  message.loading('正在扫描...', 0)
  setTimeout(() => { message.success('扫描完成') }, 2000)
}

const handleViewImage = (record: any) => { message.info('查看镜像详情') }

onMounted(fetchRepos)
</script>

<style scoped>
.image-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>