<template>
  <div class="script-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>脚本管理</span>
          <a-button type="primary" @click="showCreateModal = true">
            <template #icon><PlusOutlined /></template>
            新建脚本
          </a-button>
        </div>
      </template>

      <div class="search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索脚本名称..."
          style="width: 300px"
          @search="handleSearch"
        />
        <a-select v-model:value="filterType" placeholder="脚本类型" style="width: 150px" allowClear @change="handleSearch">
          <a-select-option value="shell">Shell</a-select-option>
          <a-select-option value="python">Python</a-select-option>
          <a-select-option value="powershell">PowerShell</a-select-option>
        </a-select>
      </div>

      <a-table :columns="columns" :data-source="scripts" :loading="loading" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scriptType'">
            <a-tag :color="getTypeColor(record.scriptType)">{{ record.scriptType?.toUpperCase() }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleExecute(record)">执行</a-button>
              <a-button type="link" size="small" @click="handleViewHistory(record)">历史</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该脚本？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showCreateModal" :title="editingScript ? '编辑脚本' : '新建脚本'" width="800px" @ok="handleSubmit" @cancel="closeModal">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="脚本名称" name="name" :rules="[{ required: true, message: '请输入脚本名称' }]">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="脚本类型" name="scriptType" :rules="[{ required: true, message: '请选择脚本类型' }]">
          <a-select v-model:value="formData.scriptType">
            <a-select-option value="shell">Shell</a-select-option>
            <a-select-option value="python">Python</a-select-option>
            <a-select-option value="powershell">PowerShell</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="分类" name="category">
          <a-select v-model:value="formData.category" placeholder="选择分类">
            <a-select-option value="deploy">部署脚本</a-select-option>
            <a-select-option value="backup">备份脚本</a-select-option>
            <a-select-option value="monitor">监控脚本</a-select-option>
            <a-select-option value="check">巡检脚本</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="脚本内容" name="content" :rules="[{ required: true, message: '请输入脚本内容' }]">
          <a-textarea v-model:value="formData.content" :rows="10" placeholder="#!/bin/bash" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showExecuteModal" title="执行脚本" width="700px" @ok="handleExecuteSubmit" :confirmLoading="executing">
      <a-form :model="executeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="目标主机">
          <a-input v-model:value="executeForm.targetHost" placeholder="留空则本地执行" />
        </a-form-item>
        <a-form-item label="执行参数">
          <a-textarea v-model:value="executeForm.params" placeholder="JSON格式，如: {&quot;key&quot;: &quot;value&quot;}" />
        </a-form-item>
      </a-form>
      <pre v-if="executeResult" class="result-content">{{ executeResult }}</pre>
    </a-modal>

    <a-modal v-model:open="showHistoryModal" title="执行历史" width="800px" :footer="null">
      <a-table :columns="historyColumns" :data-source="executions" :pagination="historyPagination" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { scriptApi } from '@/services/api'
import { message } from 'ant-design-vue'

const scripts = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const showCreateModal = ref(false)
const showExecuteModal = ref(false)
const showHistoryModal = ref(false)
const editingScript = ref(null)
const executing = ref(false)
const executeResult = ref('')
const currentScriptId = ref<number>()
const executions = ref([])
const formRef = ref()

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const historyPagination = reactive({ current: 1, pageSize: 10, total: 0 })

const formData = reactive({
  name: '', scriptType: 'shell', category: '', content: '', description: '',
})

const executeForm = reactive({ targetHost: '', params: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '脚本名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'scriptType', key: 'scriptType', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200 },
]

const historyColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '执行时间', dataIndex: 'executedAt', key: 'executedAt' },
  { title: '目标主机', dataIndex: 'targetHost', key: 'targetHost' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '执行时长', dataIndex: 'duration', key: 'duration' },
]

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = { shell: 'blue', python: 'green', powershell: 'purple' }
  return colors[type] || 'default'
}

const fetchScripts = async () => {
  loading.value = true
  try {
    const res = await scriptApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      keyword: searchKeyword.value, scriptType: filterType.value || undefined,
    })
    scripts.value = res.data.list
    pagination.total = res.data.total
  } catch (error) { message.error('获取脚本列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.current = 1; fetchScripts() }
const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchScripts() }

const handleExecute = (record: any) => {
  currentScriptId.value = record.id
  executeForm.targetHost = ''
  executeForm.params = ''
  executeResult.value = ''
  showExecuteModal.value = true
}

const handleExecuteSubmit = async () => {
  executing.value = true
  try {
    let params = undefined
    if (executeForm.params) {
      try { params = JSON.parse(executeForm.params) } catch { message.warning('参数需为JSON格式') }
    }
    const res = await scriptApi.execute(currentScriptId.value!, { params, targetHost: executeForm.targetHost })
    executeResult.value = `退出码: ${res.data.exitCode}\n输出:\n${res.data.output}`
    message.success('执行完成')
    fetchScripts()
  } catch (error) { message.error('执行失败') }
  finally { executing.value = false }
}

const handleViewHistory = async (record: any) => {
  currentScriptId.value = record.id
  try {
    const res = await scriptApi.getExecutions(record.id)
    executions.value = res.data.list
  } catch (error) { message.error('获取历史失败') }
  showHistoryModal.value = true
}

const handleEdit = (record: any) => {
  editingScript.value = record
  Object.assign(formData, record)
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingScript.value = null
  formRef.value?.resetFields()
  Object.assign(formData, { name: '', scriptType: 'shell', category: '', content: '', description: '' })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (editingScript.value) {
      await scriptApi.update(editingScript.value.id, formData)
      message.success('更新成功')
    } else {
      await scriptApi.create(formData)
      message.success('创建成功')
    }
    closeModal()
    fetchScripts()
  } catch (error) { message.error('操作失败') }
}

const handleDelete = async (id: number) => {
  try { await scriptApi.delete(id); message.success('删除成功'); fetchScripts() }
  catch (error) { message.error('删除失败') }
}

onMounted(fetchScripts)
</script>

<style scoped>
.script-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
.result-content { margin-top: 16px; background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px; max-height: 300px; overflow-y: auto; font-family: monospace; white-space: pre-wrap; }
</style>