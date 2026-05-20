# 天鹂可视化运维平台 - 实施计划

## 项目概览
- **项目名称**: 天鹂可视化运维平台 (Insight DevOps)
- **项目版本**: v1.0
- **开发周期**: 12周

---

## 技术栈

### 前端
- Vue 3.4+ + Vite 5.x + TypeScript 5.x
- Pinia 2.x (状态管理)
- Vue Router 4.x (路由)
- Ant Design Vue 4.x (UI组件库)
- ECharts 5.x (图表)

### 后端
- Express 4.x + TypeScript 5.x
- Prisma ORM + SQLite
- JWT (认证)
- bcryptjs (密码加密)
- zod (数据验证)

### 测试
- Vitest (单元测试)
- Playwright (E2E测试)
- MSW (API Mock)

---

## 数据库表 (24张) ✅

### 用户与权限模块
1. `users` - 用户表 ✅
2. `roles` - 角色表 ✅
3. `permissions` - 权限表 ✅
4. `user_roles` - 用户角色关联表 ✅
5. `role_permissions` - 角色权限关联表 ✅

### 应用与部署模块
6. `apps` - 应用表 ✅
7. `deploy_tasks` - 部署任务表 ✅

### 脚本模块
8. `scripts` - 脚本表 ✅
9. `script_executions` - 脚本执行记录表 ✅
10. `script_versions` - 脚本版本表 ✅

### 配置模块
11. `configs` - 配置表 ✅
12. `config_versions` - 配置版本表 ✅

### 监控模块
13. `monitors` - 监控指标表 ✅
14. `alerts` - 告警记录表 ✅
15. `alert_rules` - 告警规则表 ✅
16. `metric_data` - 监控数据表 ✅

### 日志模块
17. `log_entries` - 日志表 ✅

### 故障模块
18. `faults` - 故障表 ✅

### 镜像模块
19. `images` - 镜像表 ✅
20. `image_repos` - 镜像仓库表 ✅

### 备份模块
21. `backups` - 备份记录表 ✅
22. `databases` - 数据库表 ✅

### 巡检模块
23. `check_tasks` - 巡检任务表 ✅
24. `check_reports` - 巡检报告表 ✅

### 审计模块
25. `audit_logs` - 审计日志表 ✅
26. `notifications` - 通知记录表 ✅
27. `notify_channels` - 通知渠道配置表 ✅

---

## 开发阶段

### 第一阶段：基础搭建 (Week 1-2)
| 任务 | 描述 | 状态 |
|------|------|------|
| T1.1 | 项目初始化与配置 | ✅ 已完成 |
| T1.2 | 数据库Schema设计与迁移 | ✅ 已完成 |
| T1.3 | 认证模块 (登录/登出/Token) | ✅ 已完成 |
| T1.4 | 基础中间件 (日志/错误处理/跨域) | ✅ 已完成 |

### 第二阶段：核心业务API (Week 3-4)
| 任务 | 描述 | 状态 |
|------|------|------|
| T2.1 | 用户管理API | ✅ 已完成 |
| T2.2 | 应用管理API | ✅ 已完成 |
| T2.3 | 部署管理API | ⚠️ 部分完成 |
| T2.4 | 脚本管理API | ⚠️ 部分完成 |

### 第三阶段：高级业务API (Week 5-6)
| 任务 | 描述 | 状态 |
|------|------|------|
| T3.1 | 配置管理API | ⚠️ 部分完成 |
| T3.2 | 监控告警API | ✅ 已完成 |
| T3.3 | 日志分析API | ✅ 已完成 |
| T3.4 | 故障管理API | ✅ 已完成 |

### 第四阶段：扩展业务API (Week 7-8)
| 任务 | 描述 | 状态 |
|------|------|------|
| T4.1 | 镜像管理API | ✅ 已完成 |
| T4.2 | 备份管理API | ⚠️ 部分完成 |
| T4.3 | 巡检管理API | ⚠️ 部分完成 |
| T4.4 | 角色权限API | ✅ 已完成 |

### 第五阶段：前端开发 (Week 9-10)
| 任务 | 描述 | 状态 |
|------|------|------|
| T5.1 | 布局组件与路由 | ✅ 已完成 |
| T5.2 | 登录与仪表盘 | ✅ 已完成 |
| T5.3 | 部署管理页面 | ✅ 已完成 |
| T5.4 | 脚本/配置管理页面 | ✅ 已完成 |
| T5.5 | 监控/日志/故障页面 | ✅ 已完成 |
| T5.6 | 镜像/备份/巡检页面 | ⚠️ 部分完成 |

### 第六阶段：测试与联调 (Week 11-12)
| 任务 | 描述 | 状态 |
|------|------|------|
| T6.1 | 前后端联调 | ⬜ 待开始 |
| T6.2 | 单元测试 | ⚠️ 部分完成 |
| T6.3 | 接口测试 | ⚠️ 部分完成 |
| T6.4 | UI测试 | ⚠️ 部分完成 |
| T6.5 | E2E测试 | ⚠️ 部分完成 |
| T6.6 | 部署配置 | ⬜ 待开始 |

---

## API接口列表

### 认证 (4个) ✅
- POST `/api/v1/auth/login` - 用户登录
- POST `/api/v1/auth/logout` - 用户登出
- POST `/api/v1/auth/refresh` - 刷新Token
- GET `/api/v1/auth/current` - 获取当前用户

### 用户管理 (5个) ✅
- GET `/api/v1/users` - 用户列表
- POST `/api/v1/users` - 创建用户
- GET `/api/v1/users/:id` - 用户详情
- PUT `/api/v1/users/:id` - 更新用户
- DELETE `/api/v1/users/:id` - 删除用户

### 应用管理 (5个) ✅
- GET `/api/v1/apps` - 应用列表
- POST `/api/v1/apps` - 创建应用
- GET `/api/v1/apps/:id` - 应用详情
- PUT `/api/v1/apps/:id` - 更新应用
- DELETE `/api/v1/apps/:id` - 删除应用

### 部署管理 (6个) ⚠️ 部分完成
- GET `/api/v1/deploys` - 部署任务列表
- POST `/api/v1/deploys` - 创建部署任务
- GET `/api/v1/deploys/:id` - 部署详情
- ⚠️ POST `/api/v1/deploys/:id/cancel` - 取消部署 (待实现)
- ⚠️ POST `/api/v1/deploys/:id/rollback` - 回滚部署 (待实现)
- ⚠️ GET `/api/v1/deploys/:id/logs` - 获取部署日志 (待实现)

### 脚本管理 (7个) ⚠️ 部分完成
- GET `/api/v1/scripts` - 脚本列表
- POST `/api/v1/scripts` - 创建脚本
- GET `/api/v1/scripts/:id` - 脚本详情
- PUT `/api/v1/scripts/:id` - 更新脚本
- DELETE `/api/v1/scripts/:id` - 删除脚本
- ⚠️ POST `/api/v1/scripts/:id/execute` - 执行脚本 (待实现)
- ⚠️ GET `/api/v1/scripts/executions/:id` - 执行结果 (待实现)

### 配置管理 (7个) ⚠️ 部分完成
- GET `/api/v1/configs` - 配置列表
- POST `/api/v1/configs` - 创建配置
- GET `/api/v1/configs/:id` - 配置详情
- PUT `/api/v1/configs/:id` - 更新配置
- DELETE `/api/v1/configs/:id` - 删除配置
- ⚠️ POST `/api/v1/configs/:id/rollback` - 配置回滚 (待实现)
- ⚠️ GET `/api/v1/configs/:id/diff` - 配置对比 (待实现)

### 监控告警 (7个) ✅
- GET `/api/v1/monitors` - 监控指标列表
- POST `/api/v1/monitors` - 创建监控
- GET `/api/v1/monitors/:id` - 监控详情
- PUT `/api/v1/monitors/:id` - 更新监控
- DELETE `/api/v1/monitors/:id` - 删除监控
- GET `/api/v1/alerts` - 告警列表
- POST `/api/v1/alerts/:id/handle` - 处理告警

### 日志查询 (4个) ✅
- POST `/api/v1/logs/search` - 日志搜索
- GET `/api/v1/logs/:id` - 日志详情
- GET `/api/v1/logs/:id/context` - 日志上下文
- POST `/api/v1/logs/stats` - 日志统计

### 故障管理 (6个) ✅
- GET `/api/v1/faults` - 故障列表
- POST `/api/v1/faults` - 创建故障
- GET `/api/v1/faults/:id` - 故障详情
- PUT `/api/v1/faults/:id` - 更新故障
- POST `/api/v1/faults/:id/handle` - 处理故障
- POST `/api/v1/faults/:id/close` - 关闭故障

### 镜像管理 (5个) ✅
- GET `/api/v1/images` - 镜像列表
- GET `/api/v1/images/:id` - 镜像详情
- DELETE `/api/v1/images/:id` - 删除镜像
- POST `/api/v1/images/:id/pull` - 拉取镜像
- POST `/api/v1/images/push` - 推送镜像

### 备份管理 (5个) ⚠️ 部分完成
- GET `/api/v1/backups` - 备份列表
- POST `/api/v1/backups` - 创建备份
- GET `/api/v1/backups/:id` - 备份详情
- ⚠️ POST `/api/v1/backups/:id/restore` - 恢复备份 (待实现)
- DELETE `/api/v1/backups/:id` - 删除备份

### 巡检管理 (7个) ⚠️ 部分完成
- GET `/api/v1/checks` - 巡检任务列表
- POST `/api/v1/checks` - 创建巡检任务
- GET `/api/v1/checks/:id` - 巡检详情
- PUT `/api/v1/checks/:id` - 更新巡检任务
- DELETE `/api/v1/checks/:id` - 删除巡检任务
- GET `/api/v1/checks/reports` - 巡检报告列表
- GET `/api/v1/checks/reports/:id` - 报告详情

### 角色权限 (5个) ✅
- GET `/api/v1/roles` - 角色列表
- POST `/api/v1/roles` - 创建角色
- PUT `/api/v1/roles/:id` - 更新角色
- DELETE `/api/v1/roles/:id` - 删除角色
- POST `/api/v1/roles/:id/permissions` - 分配角色权限

### 仪表盘 (1个) ⬜ 待实现
- GET `/api/v1/dashboard/stats` - 仪表盘统计

### 待实现的功能缺口

| 功能 | 模块 | 说明 |
|------|------|------|
| 部署取消/回滚/日志 | 部署管理 | 需完善 deploys API |
| 脚本执行/执行结果 | 脚本管理 | 需完善 scripts API |
| 配置回滚/对比 | 配置管理 | 需完善 configs API |
| 备份恢复 | 备份管理 | 需完善 backups API |
| Dashboard 统计 | 仪表盘 | 新建 dashboard API |
| 巡检报告详情 | 巡检管理 | 部分完成 |
| 数据库管理页面 | 前端 | 需新建 DatabaseList.vue |

---

## 测试用例

### 功能测试用例 (25个)
1. TC-AUTH-001: 用户登录成功
2. TC-AUTH-002: 用户名密码错误
3. TC-AUTH-003: Token过期
4. TC-APP-001: 应用列表查询
5. TC-APP-002: 创建应用
6. TC-DEPLOY-001: 创建部署任务
7. TC-DEPLOY-002: 部署成功
8. TC-DEPLOY-003: 部署失败回滚
9. TC-DEPLOY-004: 部署取消
10. TC-SCRIPT-001: 创建脚本
11. TC-SCRIPT-002: 执行脚本
12. TC-CONFIG-001: 创建配置
13. TC-CONFIG-002: 配置回滚
14. TC-MON-001: 查看监控指标
15. TC-MON-002: 告警触发
16. TC-MON-003: 处理告警
17. TC-LOG-001: 日志搜索
18. TC-LOG-002: 日志详情查看
19. TC-FAULT-001: 创建故障
20. TC-FAULT-002: 故障处理
21. TC-FAULT-003: 故障关闭
22. TC-IMAGE-001: 镜像列表
23. TC-BACKUP-001: 创建备份
24. TC-BACKUP-002: 备份恢复
25. TC-CHECK-001: 巡检任务执行

---

## 里程碑

| 里程碑 | 时间 | 交付内容 | 状态 |
|--------|------|----------|------|
| M1 | Week 2 | 项目初始化、数据库、认证API | ✅ 已完成 |
| M2 | Week 4 | 核心业务API (用户、应用、部署、脚本) | ⚠️ 部分完成 |
| M3 | Week 6 | 高级业务API (配置、监控、日志、故障) | ⚠️ 部分完成 |
| M4 | Week 8 | 扩展业务API (镜像、备份、巡检、权限) | ⚠️ 部分完成 |
| M5 | Week 10 | 前端页面开发完成 | ⚠️ 部分完成 |
| M6 | Week 12 | 测试完成，部署就绪 | ⬜ 进行中 |

## 修订历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| v1.0 | 2024-01-01 | - | 初始版本 |
| v1.1 | 2026-05-21 | - | 更新实施计划状态：完成基础搭建、核心及高级API、前端页面；标记待实现功能缺口 |