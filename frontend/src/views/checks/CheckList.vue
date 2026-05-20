<template>
  <div class="check-list">
    <a-card>
      <template #title>
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="tasks" tab="巡检任务" />
          <a-tab-pane key="reports" tab="巡检报告" />
        </a-tabs>
        <a-button v-if="activeTab === 'tasks'" type="primary" @click="showTaskModal = true">
          <template #icon><PlusOutlined /></template>
          新建任务
        </a-button>
      </template>

      <!-- 巡检任务 -->
      <template v-if="activeTab === 'tasks'">
        <div class="search-bar">
          <a-select v-model:value="filterType" placeholder="任务类型" style="width: 150px" allowClear @change="fetchTasks">
            <a-select-option value="health">健康检查</a-select-option>
            <a-select-option value="security">安全检查</a-select-option>
            <a-select-option value="performance">性能检查</a-select-option>
          </a-select>
          <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear @change="fetchTasks">
            <a-select-option value="pending">待执行</a-select-option>
            <a-select-option value="running">执行中</a-select-option>
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </div>
        <a-table :columns="taskColumns" :data-source="tasks" :loading="loading" :pagination="pagination" @change="handleTaskTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'taskType'">
              <a-tag :color="getTaskTypeColor(record.taskType)">{{ getTaskTypeName(record.taskType) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-badge :status="getTaskStatusBadge(record.status)" :text="getTaskStatusName(record.status)" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button v-if="record.status !== 'running'" type="link" size="small" @click="handleExecuteTask(record)">执行</a-button>
                <a-button type="link" size="small" @click="handleViewReports(record)">报告</a-button>
                <a-button type="link" size="small" @click="handleEditTask(record)">编辑</a-button>
                <a-popconfirm title="确定删除该任务？" ok-text="确定" cancel-text="取消" @confirm="handleDeleteTask(record.id)">
                  <a-button type="link" danger size="small">删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>

      <!-- 巡检报告 -->
      <template v-else>
        <div class="search-bar">
          <a-select v-model:value="filterTask" placeholder="选择任务" style="width: 200px" allowClear @change="fetchReports">
            <a-select-option v-for="task in tasks" :key="task.id" :value="task.id">{{ task.name }}</a-select-option>
          </a-select>
          <a-select v-model:value="filterReportStatus" placeholder="状态" style="width: 120px" allowClear @change="fetchReports">
            <a-select-option value="success">成功</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </div>
        <a-table :columns="reportColumns" :data-source="reports" :loading="loading" :pagination="pagination" @change="handleReportTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-badge :status="record.status === 'success' ? 'success' : 'error'" :text="record.status === 'success' ? '成功' : '失败'" />
            </template>
            <template v-else-if="column.key === 'score'">
              <a-progress :percent="record.score" :status="record.score >= 80 ? 'success' : 'exception'" size="small" />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" size="small" @click="handleViewReport(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </template>
    </a-card>

    <!-- 创建/编辑任务 -->
    <a-modal v-model:open="showTaskModal" :title="editingTask ? '编辑任务' : '新建任务'" width="700px" @ok="handleTaskSubmit" @cancel="closeTaskModal">
      <a-form ref="taskFormRef" :model="taskFormData" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="任务名称" name="name" :rules="[{ required: true, message: '请输入任务名称' }]">
          <a-input v-model:value="taskFormData.name" />
        </a-form-item>
        <a-form-item label="任务类型" name="taskType" :rules="[{ required: true, message: '请选择任务类型' }]">
          <a-select v-model:value="taskFormData.taskType">
            <a-select-option value="health">健康检查</a-select-option>
            <a-select-option value="security">安全检查</a-select-option>
            <a-select-option value="performance">性能检查</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="执行周期" name="cron">
          <a-select v-model:value="taskFormData.cron">
            <a-select-option value="0 * * * *">每小时</a-select-option>
            <a-select-option value="0 0 * * *">每天</a-select-option>
            <a-select-option value="0 0 * * 0">每周</a-select-option>
            <a-select-option value="0 0 1 * *">每月</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="检查项" name="checkItems">
          <a-textarea v-model:value="taskFormData.checkItems" :rows="4" placeholder="JSON格式检查项配置" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="taskFormData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 报告详情 -->
    <a-modal v-model:open="showReportModal" title="巡检报告" width="800px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="任务名称">{{ currentReport?.taskName }}</a-descriptions-item>
        <a-descriptions-item label="得分"><a-progress :percent="currentReport?.score || 0" size="small" /></a-descriptions-item>
        <a-descriptions-item label="执行时间">{{ currentReport?.executedAt }}</a-descriptions-item>
        <a-descriptions-item label="执行时长">{{ currentReport?.duration }}秒</a-descriptions-item>
        <a-descriptions-item label="检查项" :span="2">
          <div v-for="(item, index) in currentReport?.items" :key="index" class="check-item">
            <a-tag :color="item.passed ? 'green' : 'red'">{{ item.passed ? '通过' : '失败' }}</a-tag>
            {{ item.name }}: {{ item.message }}
          </div>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { checkApi } from '@/services/api'
import { message } from 'ant-design-vue'

const activeTab = ref('tasks')
const tasks = ref([])
const reports = ref([])
const loading = ref(false)
const showTaskModal = ref(false)
const showReportModal = ref(false)
const editingTask = ref(null)
const currentReport = ref<any>()
const taskFormRef = ref()
const filterType = ref('')
const filterStatus = ref('')
const filterTask = ref<number>()
const filterReportStatus = ref('')

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const taskFormData = reactive({ name: '', taskType: 'health', cron: '0 0 * * *', checkItems: '', description: '' })

const taskColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'taskType', key: 'taskType', width: 100 },
  { title: '执行周期', dataIndex: 'cron', key: 'cron', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '上次执行', dataIndex: 'lastExecutedAt', key: 'lastExecutedAt', width: 180 },
  { title: '操作', key: 'action', width: 200 },
]

const reportColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '任务', dataIndex: 'taskName', key: 'taskName', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '得分', dataIndex: 'score', key: 'score', width: 150 },
  { title: '执行时间', dataIndex: 'executedAt', key: 'executedAt', width: 180 },
  { title: '操作', key: 'action', width: 80 },
]

const getTaskTypeColor = (type: string) => ({ health: 'green', security: 'blue', performance: 'orange' }[type] || 'default')
const getTaskTypeName = (type: string) => ({ health: '健康检查', security: '安全检查', performance: '性能检查' }[type] || type)
const getTaskStatusBadge = (status: string) => ({ pending: 'warning', running: 'processing', success: 'success', failed: 'error' }[status] || 'default')
const getTaskStatusName = (status: string) => ({ pending: '待执行', running: '执行中', success: '成功', failed: '失败' }[status] || status)

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await checkApi.listTasks({
      page: pagination.current, pageSize: pagination.pageSize,
      taskType: filterType.value || undefined, status: filterStatus.value || undefined,
    })
    tasks.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取任务列表失败') }
  finally { loading.value = false }
}

const fetchReports = async () => {
  loading.value = true
  try {
    const res = await checkApi.listReports({
      page: pagination.current, pageSize: pagination.pageSize,
      taskId: filterTask.value, status: filterReportStatus.value || undefined,
    })
    reports.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取报告列表失败') }
  finally { loading.value = false }
}

const handleTaskTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchTasks() }
const handleReportTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchReports() }

const handleExecuteTask = async (record: any) => {
  try {
    await checkApi.executeTask(record.id)
    message.success('巡检已启动')
    fetchTasks()
  } catch (error) { message.error('执行失败') }
}

const handleViewReports = async (record: any) => {
  filterTask.value = record.id
  activeTab.value = 'reports'
  fetchReports()
}

const handleViewReport = (record: any) => { currentReport.value = record; showReportModal.value = true }

const handleEditTask = (record: any) => {
  editingTask.value = record
  Object.assign(taskFormData, record)
  showTaskModal.value = true
}

const closeTaskModal = () => {
  showTaskModal.value = false
  editingTask.value = null
  taskFormRef.value?.resetFields()
  Object.assign(taskFormData, { name: '', taskType: 'health', cron: '0 0 * * *', checkItems: '', description: '' })
}

const handleTaskSubmit = async () => {
  try {
    await taskFormRef.value?.validate()
    if (editingTask.value) {
      await checkApi.updateTask(editingTask.value.id, taskFormData)
      message.success('更新成功')
    } else {
      await checkApi.createTask(taskFormData)
      message.success('创建成功')
    }
    closeTaskModal()
    fetchTasks()
  } catch (error) { message.error('操作失败') }
}

const handleDeleteTask = async (id: number) => {
  try { await checkApi.deleteTask(id); message.success('删除成功'); fetchTasks() }
  catch (error) { message.error('删除失败') }
}

onMounted(fetchTasks)
</script>

<style scoped>
.check-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
.check-item { margin: 4px 0; }
</style>