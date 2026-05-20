<template>
  <div class="log-list">
    <a-card>
      <template #title>
        <div class="card-header">
          <span>日志管理</span>
          <a-space>
            <a-button @click="showStatsModal = true">统计</a-button>
            <a-button danger @click="handleClear">清理</a-button>
          </a-space>
        </div>
      </template>

      <div class="search-bar">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索日志内容..." style="width: 300px" @search="handleSearch" />
        <a-select v-model:value="filterLevel" placeholder="日志级别" style="width: 120px" allowClear @change="handleSearch">
          <a-select-option value="debug">DEBUG</a-select-option>
          <a-select-option value="info">INFO</a-select-option>
          <a-select-option value="warning">WARNING</a-select-option>
          <a-select-option value="error">ERROR</a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" @change="handleSearch" />
      </div>

      <a-table :columns="columns" :data-source="logs" :loading="loading" :pagination="pagination" @change="handleTableChange" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'level'">
            <a-tag :color="getLevelColor(record.level)">{{ record.level }}</a-tag>
          </template>
          <template v-else-if="column.key === 'message'">
            <span class="log-message">{{ record.message }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showDetailModal" title="日志详情" width="900px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="时间">{{ currentLog?.createdAt }}</a-descriptions-item>
        <a-descriptions-item label="级别"><a-tag :color="getLevelColor(currentLog?.level)">{{ currentLog?.level }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="服务">{{ currentLog?.service }}</a-descriptions-item>
        <a-descriptions-item label="主机">{{ currentLog?.host }}</a-descriptions-item>
        <a-descriptions-item label="消息" :span="2">{{ currentLog?.message }}</a-descriptions-item>
        <a-descriptions-item label="TraceId" :span="2">{{ currentLog?.traceId || '-' }}</a-descriptions-item>
        <a-descriptions-item label="堆栈信息" :span="2">
          <pre class="stack-trace">{{ currentLog?.stack || '-' }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <a-modal v-model:open="showStatsModal" title="日志统计" width="900px" :footer="null">
      <div ref="statsChartRef" data-testid="log-stats-chart" style="width: 100%; height: 400px;"></div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Modal } from 'ant-design-vue'
import * as echarts from 'echarts'
import { logApi } from '@/services/api'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const logs = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterLevel = ref('')
const dateRange = ref<any[]>([])
const showDetailModal = ref(false)
const showStatsModal = ref(false)
const currentLog = ref<any>()
const statsChartRef = ref()

const pagination = reactive({ current: 1, pageSize: 20, total: 0 })

const columns = [
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '级别', dataIndex: 'level', key: 'level', width: 80 },
  { title: '服务', dataIndex: 'service', key: 'service', width: 120 },
  { title: '主机', dataIndex: 'host', key: 'host', width: 120 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '操作', key: 'action', width: 80 },
]

const getLevelColor = (level: string) => ({
  debug: 'grey', info: 'blue', warning: 'orange', error: 'red',
}[level] || 'default')

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await logApi.list({
      page: pagination.current, pageSize: pagination.pageSize,
      level: filterLevel.value || undefined, keyword: searchKeyword.value,
      startTime: dateRange.value?.[0]?.format('YYYY-MM-DD'), endTime: dateRange.value?.[1]?.format('YYYY-MM-DD'),
    })
    logs.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) { message.error('获取日志列表失败') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.current = 1; fetchLogs() }
const handleTableChange = (pag) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchLogs() }

const handleViewDetail = (record: any) => { currentLog.value = record; showDetailModal.value = true }

const handleClear = () => {
  Modal.confirm({ title: '确认清理', content: '确定清理30天前的日志？', onOk: async () => {
    try { await logApi.clear(30); message.success('清理成功'); fetchLogs() }
    catch (error) { message.error('清理失败') }
  }})
}

const showStats = async () => {
  showStatsModal.value = true
  await nextTick()
  const chart = echarts.init(statsChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { value: 1048, name: 'INFO' },
        { value: 735, name: 'WARNING' },
        { value: 580, name: 'ERROR' },
        { value: 484, name: 'DEBUG' },
      ],
    }],
  })
}

onMounted(fetchLogs)
</script>

<style scoped>
.log-list { padding: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-bar { margin-bottom: 16px; display: flex; gap: 12px; }
.log-message { max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.stack-trace { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-size: 12px; }
</style>