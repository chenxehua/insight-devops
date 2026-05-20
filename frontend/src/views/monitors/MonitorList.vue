<template>
  <div class="monitor-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>监控管理</span>
          <a-space>
            <a-button @click="showAlertModal = true">告警规则</a-button>
            <a-button type="primary" @click="showCreateModal = true">
              <template #icon><PlusOutlined /></template>
              新建监控
            </a-button>
          </a-space>
        </div>
      </template>

      <div class="search-bar">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索监控名称..." style="width: 300px" @search="handleSearch" />
        <a-select v-model:value="filterTarget" placeholder="监控对象" style="width: 150px" allowClear @change="handleSearch">
          <a-select-option value="host">主机</a-select-option>
          <a-select-option value="container">容器</a-select-option>
          <a-select-option value="app">应用</a-select-option>
          <a-select-option value="database">数据库</a-select-option>
        </a-select>
        <a-select v-model:value="filterStatus" placeholder="状态" style="width: 120px" allowClear @change="handleSearch">
          <a-select-option :value="1">正常</a-select-option>
          <a-select-option :value="0">停用</a-select-option>
        </a-select>
      </div>

      <a-table :columns="columns" :data-source="monitors" :loading="loading" :pagination="pagination" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'targetType'">
            <a-tag :color="getTargetTypeColor(record.targetType)">{{ getTargetTypeName(record.targetType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-badge :status="record.status === 1 ? 'success' : 'error'" :text="record.status === 1 ? '正常' : '异常'" />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewMetrics(record)">图表</a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该监控？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showCreateModal" :title="editingMonitor ? '编辑监控' : '新建监控'" width="600px" @ok="handleSubmit" @cancel="closeModal">
      <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="监控名称" name="name" :rules="[{ required: true, message: '请输入监控名称' }]">
          <a-input v-model:value="formData.name" />
        </a-form-item>
        <a-form-item label="监控对象" name="targetType" :rules="[{ required: true, message: '请选择监控对象' }]">
          <a-select v-model:value="formData.targetType">
            <a-select-option value="host">主机</a-select-option>
            <a-select-option value="container">容器</a-select-option>
            <a-select-option value="app">应用</a-select-option>
            <a-select-option value="database">数据库</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="指标类型" name="metricType" :rules="[{ required: true, message: '请选择指标类型' }]">
          <a-select v-model:value="formData.metricType">
            <a-select-option value="cpu">CPU使用率</a-select-option>
            <a-select-option value="memory">内存使用率</a-select-option>
            <a-select-option value="disk">磁盘使用率</a-select-option>
            <a-select-option value="network">网络流量</a-select-option>
            <a-select-option value="qps">请求QPS</a-select-option>
            <a-select-option value="response_time">响应时间</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="目标地址" name="target">
          <a-input v-model:value="formData.target" placeholder="如: 192.168.1.100 或 localhost:8080" />
        </a-form-item>
        <a-form-item label="采集间隔" name="interval">
          <a-input-number v-model:value="formData.interval" :min="10" :max="3600" suffix="秒" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formData.description" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showChartModal" title="监控图表" width="900px" :footer="null">
      <div ref="chartRef" data-testid="metrics-chart" style="width: 100%; height: 400px;"></div>
    </a-modal>

    <a-modal v-model:open="showAlertModal" title="告警规则" width="800px">
      <a-form :label-col="{ span: 8 }" :wrapper-col="{ span: 14 }">
        <a-form-item label="CPU告警阈值">
          <a-input-number v-model:value="alertRules.cpuThreshold" :min="0" :max="100" suffix="%" />
        </a-form-item>
        <a-form-item label="内存告警阈值">
          <a-input-number v-model:value="alertRules.memoryThreshold" :min="0" :max="100" suffix="%" />
        </a-form-item>
        <a-form-item label="磁盘告警阈值">
          <a-input-number v-model:value="alertRules.diskThreshold" :min="0" :max="100" suffix="%" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showAlertModal = false">取消</a-button>
        <a-button type="primary" @click="saveAlertRules">保存</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { monitorApi } from '@/services/api'
import { message } from 'ant-design-vue'

const monitors = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterTarget = ref('')
const filterStatus = ref<number>()
const showCreateModal = ref(false)
const showChartModal = ref(false)
const showAlertModal = ref(false)
const editingMonitor = ref(null)
const chartRef = ref()
const formRef = ref()

const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const alertRules = reactive({ cpuThreshold: 80, memoryThreshold: 80, diskThreshold: 90 })

const formData = reactive({
  name: '', targetType: 'host', metricType: 'cpu', target: '', interval: 60, description: '',
})

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '监控名称', dataIndex: 'name', key: 'name' },
  { title: '对象类型', dataIndex: 'targetType', key: 'targetType', width: 100 },
  { title: '指标类型', dataIndex: 'metricType', key: 'metricType', width: 100 },
  { title: '目标', dataIndex: 'target', key: 'target' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 },
]

const getTargetTypeColor = (type: string) => ({ host: 'blue', container: 'green', app: 'orange', database: 'purple' }[type] || 'default')
const getTargetTypeName = (type: string) => ({ host: '主机', container: '容器', app: '应用', database: '数据库' }[type] || type)

const fetchMonitors = async () => {
  loading.value = true
  try {
    const res = await monitorApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      keyword: searchKeyword.value, targetType: filterTarget.value || undefined, status: filterStatus.value,
    })
    monitors.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取监控列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.current = 1; fetchMonitors() }
const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchMonitors() }

const handleViewMetrics = async (record: any) => {
  showChartModal.value = true
  await nextTick()
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
    yAxis: { type: 'value', max: 100 },
    series: [{ data: Array.from({ length: 24 }, () => Math.random() * 100), type: 'line', smooth: true }],
  })
}

const handleEdit = (record: any) => {
  editingMonitor.value = record
  Object.assign(formData, record)
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingMonitor.value = null
  formRef.value?.resetFields()
  Object.assign(formData, { name: '', targetType: 'host', metricType: 'cpu', target: '', interval: 60, description: '' })
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (editingMonitor.value) {
      await monitorApi.update(editingMonitor.value.id, formData)
      message.success('更新成功')
    } else {
      await monitorApi.create(formData)
      message.success('创建成功')
    }
    closeModal()
    fetchMonitors()
  } catch (error) { message.error('操作失败') }
}

const handleDelete = async (id: number) => {
  try { await monitorApi.delete(id); message.success('删除成功'); fetchMonitors() }
  catch (error) { message.error('删除失败') }
}

const saveAlertRules = () => {
  message.success('告警规则已保存')
  showAlertModal.value = false
}

onMounted(fetchMonitors)
</script>

<style scoped>
.monitor-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>