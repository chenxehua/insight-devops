<template>
  <div class="dashboard">
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="应用总数"
            :value="stats.apps"
            :prefix="h(CloudOutlined)"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="部署任务"
            :value="stats.deploys"
            :prefix="h(CloudUploadOutlined)"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="监控指标"
            :value="stats.monitors"
            :prefix="h(AreaChartOutlined)"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="告警数量"
            :value="stats.alerts"
            :prefix="h(AlertOutlined)"
            :value-style="{ color: stats.alerts > 0 ? '#cf1322' : '#3f8600' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="部署趋势">
          <div ref="deployChartRef" style="height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="资源使用">
          <div ref="resourceChartRef" style="height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="lists-row">
      <a-col :span="12">
        <a-card title="最近部署" :body-style="{ padding: 0 }">
          <a-table
            :columns="deployColumns"
            :data-source="recentDeploys"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="待处理告警" :body-style="{ padding: 0 }">
          <a-table
            :columns="alertColumns"
            :data-source="pendingAlerts"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'level'">
                <a-tag :color="getLevelColor(record.alertLevel)">
                  {{ record.alertLevel }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import * as echarts from 'echarts'
import { CloudOutlined, CloudUploadOutlined, AreaChartOutlined, AlertOutlined } from '@ant-design/icons-vue'
import { deployApi, appApi, monitorApi, alertApi } from '@/services/api'

const stats = ref({
  apps: 0,
  deploys: 0,
  monitors: 0,
  alerts: 0,
})

const recentDeploys = ref<any[]>([])
const pendingAlerts = ref<any[]>([])

const deployColumns = [
  { title: '应用', dataIndex: 'appName', key: 'appName' },
  { title: '环境', dataIndex: 'environment', key: 'environment' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '状态', key: 'status' },
]

const alertColumns = [
  { title: '告警名称', dataIndex: 'alertName', key: 'alertName' },
  { title: '级别', key: 'level' },
  { title: '目标', dataIndex: 'targetId', key: 'targetId' },
]

const deployChartRef = ref<HTMLElement>()
const resourceChartRef = ref<HTMLElement>()

onMounted(async () => {
  await loadStats()
  await loadRecentDeploys()
  await loadPendingAlerts()
  initCharts()
})

async function loadStats() {
  try {
    const [appsRes, deploysRes, monitorsRes, alertsRes] = await Promise.allSettled([
      appApi.list({ pageSize: 1 }),
      deployApi.list({ pageSize: 1 }),
      monitorApi.list({ pageSize: 1 }),
      alertApi.list({ pageSize: 1, status: 'pending' }),
    ])

    stats.value = {
      apps: appsRes.status === 'fulfilled' ? appsRes.value.data?.total || 0 : 0,
      deploys: deploysRes.status === 'fulfilled' ? deploysRes.value.data?.total || 0 : 0,
      monitors: monitorsRes.status === 'fulfilled' ? monitorsRes.value.data?.total || 0 : 0,
      alerts: alertsRes.status === 'fulfilled' ? alertsRes.value.data?.total || 0 : 0,
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

async function loadRecentDeploys() {
  try {
    const res = await deployApi.list({ pageSize: 5 })
    recentDeploys.value = res.data?.list || []
  } catch (error) {
    console.error('Failed to load recent deploys:', error)
  }
}

async function loadPendingAlerts() {
  try {
    const res = await alertApi.list({ pageSize: 5, status: 'pending' })
    pendingAlerts.value = res.data?.list || []
  } catch (error) {
    console.error('Failed to load pending alerts:', error)
  }
}

function initCharts() {
  if (deployChartRef.value) {
    const chart = echarts.init(deployChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['成功', '失败', '回滚'] },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
      yAxis: { type: 'value' },
      series: [
        { name: '成功', type: 'bar', data: [12, 15, 9, 18, 20, 14, 16] },
        { name: '失败', type: 'bar', data: [2, 1, 3, 1, 2, 1, 2] },
        { name: '回滚', type: 'bar', data: [0, 0, 1, 0, 0, 1, 0] },
      ],
    })
  }

  if (resourceChartRef.value) {
    const chart = echarts.init(resourceChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '资源使用',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: [
            { value: 65, name: 'CPU' },
            { value: 45, name: '内存' },
            { value: 30, name: '磁盘' },
            { value: 20, name: '网络' },
          ],
        },
      ],
    })
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    success: 'green',
    failed: 'red',
    running: 'blue',
    pending: 'orange',
  }
  return colors[status] || 'default'
}

function getLevelColor(level: string) {
  const colors: Record<string, string> = {
    P0: 'red',
    P1: 'orange',
    P2: 'blue',
  }
  return colors[level] || 'default'
}
</script>

<style scoped>
.dashboard {
  padding: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.charts-row {
  margin-bottom: 16px;
}

.lists-row {
  margin-bottom: 16px;
}
</style>