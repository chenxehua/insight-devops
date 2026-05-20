// Vue主入口
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import {
  Form,
  FormItem,
  Input,
  InputPassword,
  Button,
  message,
} from 'ant-design-vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Form)
app.use(FormItem)
app.use(Input)
app.use(InputPassword)
app.use(Button)

app.mount('#app')