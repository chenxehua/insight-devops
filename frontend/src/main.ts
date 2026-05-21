// Vue主入口
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css'

// Ant Design Vue
import {
  Form,
  FormItem,
  Input,
  InputPassword,
  Button,
  Card,
  Table,
  Modal,
  Select,
  Space,
  Tag,
  Dropdown,
  Menu,
  MenuItem,
  MenuDivider,
  SubMenu,
  Row,
  Col,
  Layout,
  LayoutHeader,
  LayoutSider,
  LayoutContent,
  Breadcrumb,
  BreadcrumbItem,
  Pagination,
  Popconfirm,
  Tooltip,
  Alert,
  Tabs,
  TabPane,
  Descriptions,
  DescriptionsItem,
  Statistic,
  DatePicker,
  RangePicker,
  InputSearch,
  Switch,
  Divider,
  Drawer,
  Tree,
  notification,
} from 'ant-design-vue'

const app = createApp(App)
const pinia = createPinia()

// 注册所有 Ant Design Vue 组件
app.use(pinia)
app.use(router)
app.use(Form)
app.use(FormItem)
app.use(Input)
app.use(InputPassword)
app.use(Button)
app.use(Card)
app.use(Table)
app.use(Modal)
app.use(Select)
app.use(Space)
app.use(Tag)
app.use(Dropdown)
app.use(Menu)
app.use(MenuItem)
app.use(MenuDivider)
app.use(SubMenu)
app.use(Row)
app.use(Col)
app.use(Layout)
app.use(LayoutHeader)
app.use(LayoutSider)
app.use(LayoutContent)
app.use(Breadcrumb)
app.use(BreadcrumbItem)
app.use(Pagination)
app.use(Popconfirm)
app.use(Tooltip)
app.use(Alert)
app.use(Tabs)
app.use(TabPane)
app.use(Descriptions)
app.use(DescriptionsItem)
app.use(Statistic)
app.use(DatePicker)
app.use(RangePicker)
app.use(InputSearch)
app.use(Switch)
app.use(Divider)
app.use(Drawer)
app.use(Tree)

// 全局消息代理
app.config.globalProperties.$message = notification
app.config.globalProperties.$notification = notification

app.mount('#app')