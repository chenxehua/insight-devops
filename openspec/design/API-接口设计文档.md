# 接口设计文档

## 1. 文档信息

| 字段 | 内容 |
|------|------|
| 项目名称 | 天鹂可视化运维平台 (Insight DevOps) |
| 模块名称 | 平台API接口 |
| 文档版本 | v1.0 |
| 作者 | - |
| 创建日期 | 2024-01-01 |
| 最后更新 | 2024-01-01 |

---

## 2. 概述

### 2.1 接口概述
本文档定义天鹂可视化运维平台的全部API接口。采用 Next.js API Routes 实现，所有接口通过同一个 Next.js 应用提供服务。

### 2.2 接口规范

#### 2.2.1 通信协议
- HTTPS (推荐)
- HTTP

#### 2.2.2 数据格式
- 请求格式：JSON (Content-Type: application/json)
- 响应格式：JSON

#### 2.2.3 编码格式
- UTF-8

### 2.3 认证方式
API采用JWT Token认证，Token通过登录接口获取。

**认证头部：**
```
Authorization: Bearer <token>
```

**Next.js API Route 示例结构：**
```
/app/api/auth/login/route.ts
/app/api/deploys/route.ts
/app/api/apps/route.ts
```

### 2.4 通用错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 未认证/认证失败 | 检查Token是否有效 |
| 403 | 无权限 | 检查用户权限配置 |
| 404 | 资源不存在 | 检查资源ID是否正确 |
| 409 | 资源冲突 | 检查是否重复创建 |
| 429 | 请求过于频繁 | 降低请求频率 |
| 500 | 服务器错误 | 联系管理员 |
| 503 | 服务不可用 | 服务正在维护，稍后重试 |

---

## 3. 接口列表

### 3.1 用户与认证

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| AUTH-001 | 用户登录 | POST | /api/v1/auth/login | 用户登录获取Token |
| AUTH-002 | 用户登出 | POST | /api/v1/auth/logout | 用户登出 |
| AUTH-003 | 刷新Token | POST | /api/v1/auth/refresh | 刷新Token |
| AUTH-004 | 获取当前用户 | GET | /api/v1/auth/me | 获取当前用户信息 |

### 3.2 用户管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| USER-001 | 用户列表 | GET | /api/v1/users | 获取用户列表 |
| USER-002 | 创建用户 | POST | /api/v1/users | 创建新用户 |
| USER-003 | 获取用户详情 | GET | /api/v1/users/{id} | 获取用户详情 |
| USER-004 | 更新用户 | PUT | /api/v1/users/{id} | 更新用户信息 |
| USER-005 | 删除用户 | DELETE | /api/v1/users/{id} | 删除用户 |

### 3.3 角色权限

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| ROLE-001 | 角色列表 | GET | /api/v1/roles | 获取角色列表 |
| ROLE-002 | 创建角色 | POST | /api/v1/roles | 创建角色 |
| ROLE-003 | 更新角色 | PUT | /api/v1/roles/{id} | 更新角色 |
| ROLE-004 | 删除角色 | DELETE | /api/v1/roles/{id} | 删除角色 |
| ROLE-005 | 分配角色权限 | POST | /api/v1/roles/{id}/permissions | 分配角色权限 |

### 3.4 应用管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| APP-001 | 应用列表 | GET | /api/v1/apps | 获取应用列表 |
| APP-002 | 创建应用 | POST | /api/v1/apps | 创建应用 |
| APP-003 | 获取应用详情 | GET | /api/v1/apps/{id} | 获取应用详情 |
| APP-004 | 更新应用 | PUT | /api/v1/apps/{id} | 更新应用 |
| APP-005 | 删除应用 | DELETE | /api/v1/apps/{id} | 删除应用 |

### 3.5 部署管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| DEPLOY-001 | 部署任务列表 | GET | /api/v1/deploys | 获取部署任务列表 |
| DEPLOY-002 | 创建部署任务 | POST | /api/v1/deploys | 创建部署任务 |
| DEPLOY-003 | 获取部署详情 | GET | /api/v1/deploys/{id} | 获取部署详情 |
| DEPLOY-004 | 取消部署 | POST | /api/v1/deploys/{id}/cancel | 取消部署 |
| DEPLOY-005 | 回滚部署 | POST | /api/v1/deploys/{id}/rollback | 回滚部署 |
| DEPLOY-006 | 获取部署日志 | GET | /api/v1/deploys/{id}/logs | 获取部署日志 |

### 3.6 脚本管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| SCRIPT-001 | 脚本列表 | GET | /api/v1/scripts | 获取脚本列表 |
| SCRIPT-002 | 创建脚本 | POST | /api/v1/scripts | 创建脚本 |
| SCRIPT-003 | 获取脚本详情 | GET | /api/v1/scripts/{id} | 获取脚本详情 |
| SCRIPT-004 | 更新脚本 | PUT | /api/v1/scripts/{id} | 更新脚本 |
| SCRIPT-005 | 删除脚本 | DELETE | /api/v1/scripts/{id} | 删除脚本 |
| SCRIPT-006 | 执行脚本 | POST | /api/v1/scripts/{id}/execute | 执行脚本 |
| SCRIPT-007 | 获取执行结果 | GET | /api/v1/scripts/executions/{id} | 获取执行结果 |

### 3.7 配置管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| CONFIG-001 | 配置列表 | GET | /api/v1/configs | 获取配置列表 |
| CONFIG-002 | 创建配置 | POST | /api/v1/configs | 创建配置 |
| CONFIG-003 | 获取配置详情 | GET | /api/v1/configs/{id} | 获取配置详情 |
| CONFIG-004 | 更新配置 | PUT | /api/v1/configs/{id} | 更新配置 |
| CONFIG-005 | 删除配置 | DELETE | /api/v1/configs/{id} | 删除配置 |
| CONFIG-006 | 配置回滚 | POST | /api/v1/configs/{id}/rollback | 回滚配置 |
| CONFIG-007 | 配置对比 | GET | /api/v1/configs/{id}/diff | 对比配置差异 |

### 3.8 监控告警

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| MON-001 | 监控指标列表 | GET | /api/v1/monitors | 获取监控指标列表 |
| MON-002 | 创建监控 | POST | /api/v1/monitors | 创建监控 |
| MON-003 | 获取监控详情 | GET | /api/v1/monitors/{id} | 获取监控详情 |
| MON-004 | 更新监控 | PUT | /api/v1/monitors/{id} | 更新监控 |
| MON-005 | 删除监控 | DELETE | /api/v1/monitors/{id} | 删除监控 |
| MON-006 | 告警列表 | GET | /api/v1/alerts | 获取告警列表 |
| MON-007 | 处理告警 | POST | /api/v1/alerts/{id}/handle | 处理告警 |

### 3.9 日志查询

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| LOG-001 | 日志搜索 | POST | /api/v1/logs/search | 搜索日志 |
| LOG-002 | 日志详情 | GET | /api/v1/logs/{id} | 获取日志详情 |
| LOG-003 | 日志上下文 | GET | /api/v1/logs/{id}/context | 获取日志上下文 |
| LOG-004 | 日志统计 | POST | /api/v1/logs/stats | 日志统计 |

### 3.10 故障管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| FAULT-001 | 故障列表 | GET | /api/v1/faults | 获取故障列表 |
| FAULT-002 | 创建故障 | POST | /api/v1/faults | 创建故障 |
| FAULT-003 | 获取故障详情 | GET | /api/v1/faults/{id} | 获取故障详情 |
| FAULT-004 | 更新故障 | PUT | /api/v1/faults/{id} | 更新故障 |
| FAULT-005 | 处理故障 | POST | /api/v1/faults/{id}/handle | 处理故障 |
| FAULT-006 | 关闭故障 | POST | /api/v1/faults/{id}/close | 关闭故障 |

### 3.11 镜像管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| IMAGE-001 | 镜像列表 | GET | /api/v1/images | 获取镜像列表 |
| IMAGE-002 | 获取镜像详情 | GET | /api/v1/images/{id} | 获取镜像详情 |
| IMAGE-003 | 删除镜像 | DELETE | /api/v1/images/{id} | 删除镜像 |
| IMAGE-004 | 拉取镜像 | POST | /api/v1/images/{id}/pull | 拉取镜像 |
| IMAGE-005 | 推送镜像 | POST | /api/v1/images/push | 推送镜像 |

### 3.12 备份管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| BACKUP-001 | 备份列表 | GET | /api/v1/backups | 获取备份列表 |
| BACKUP-002 | 创建备份 | POST | /api/v1/backups | 创建备份任务 |
| BACKUP-003 | 获取备份详情 | GET | /api/v1/backups/{id} | 获取备份详情 |
| BACKUP-004 | 恢复备份 | POST | /api/v1/backups/{id}/restore | 恢复备份 |
| BACKUP-005 | 删除备份 | DELETE | /api/v1/backups/{id} | 删除备份 |

### 3.13 巡检管理

| 接口编号 | 接口名称 | 请求方法 | 路径 | 说明 |
|----------|----------|----------|------|------|
| CHECK-001 | 巡检任务列表 | GET | /api/v1/checks | 获取巡检任务列表 |
| CHECK-002 | 创建巡检任务 | POST | /api/v1/checks | 创建巡检任务 |
| CHECK-003 | 获取巡检详情 | GET | /api/v1/checks/{id} | 获取巡检详情 |
| CHECK-004 | 更新巡检任务 | PUT | /api/v1/checks/{id} | 更新巡检任务 |
| CHECK-005 | 删除巡检任务 | DELETE | /api/v1/checks/{id} | 删除巡检任务 |
| CHECK-006 | 巡检报告列表 | GET | /api/v1/checks/reports | 获取巡检报告列表 |
| CHECK-007 | 获取报告详情 | GET | /api/v1/checks/reports/{id} | 获取报告详情 |

---

## 4. 接口详细设计

### 4.1 用户登录

#### 基本信息

| 字段 | 内容 |
|------|------|
| 接口编号 | AUTH-001 |
| 接口名称 | 用户登录 |
| 请求方法 | POST |
| 请求路径 | /api/v1/auth/login |
| 说明 | 用户登录获取访问令牌 |

#### 请求参数

**Body参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例：**
```json
{
  "username": "admin",
  "password": "password123"
}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | int | 状态码 |
| message | string | 消息 |
| data | object | 数据 |
| data.token | string | 访问令牌 |
| data.expires_at | string | 过期时间 |
| data.user | object | 用户信息 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-02T00:00:00Z",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "real_name": "管理员"
    }
  }
}
```

#### 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数缺失 | 检查username和password |
| 401 | 用户名或密码错误 | 检查凭据 |

---

### 4.2 创建部署任务

#### 基本信息

| 字段 | 内容 |
|------|------|
| 接口编号 | DEPLOY-002 |
| 接口名称 | 创建部署任务 |
| 请求方法 | POST |
| 请求路径 | /api/v1/deploys |
| 说明 | 创建新的部署任务并开始执行 |

#### 请求参数

**Headers：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | string | 是 | Bearer Token |

**Body参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| app_id | long | 是 | 应用ID |
| environment | string | 是 | 部署环境：dev/staging/prod |
| version | string | 是 | 部署版本 |
| strategy | string | 否 | 部署策略，默认normal，可选：normal/blue_green/canary |

**请求示例：**
```json
{
  "app_id": 1,
  "environment": "prod",
  "version": "v1.2.3",
  "strategy": "blue_green"
}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | int | 状态码 |
| message | string | 消息 |
| data | object | 任务信息 |
| data.id | long | 任务ID |
| data.app_id | long | 应用ID |
| data.status | string | 任务状态 |
| data.created_at | string | 创建时间 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1001,
    "app_id": 1,
    "app_name": "web-api",
    "environment": "prod",
    "version": "v1.2.3",
    "strategy": "blue_green",
    "status": "running",
    "progress": 0,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查app_id、environment、version |
| 401 | 未认证 | 检查Token |
| 403 | 无权限 | 需要部署权限 |
| 404 | 应用不存在 | 检查app_id |

---

### 4.3 获取部署日志

#### 基本信息

| 字段 | 内容 |
|------|------|
| 接口编号 | DEPLOY-006 |
| 接口名称 | 获取部署日志 |
| 请求方法 | GET |
| 请求路径 | /api/v1/deploys/{id}/logs |
| 说明 | 获取指定部署任务的执行日志 |

#### 请求参数

**Path参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | long | 是 | 部署任务ID |

**Query参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| from_line | int | 否 | 起始行号，默认1 |
| limit | int | 否 | 返回行数，默认100 |

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | int | 状态码 |
| message | string | 消息 |
| data | object | 日志信息 |
| data.task_id | long | 任务ID |
| data.total_lines | int | 日志总行数 |
| data.logs | array | 日志行列表 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "task_id": 1001,
    "total_lines": 150,
    "logs": [
      "[2024-01-01 12:00:01] INFO: Starting deployment...",
      "[2024-01-01 12:00:02] INFO: Pulling image...",
      "[2024-01-01 12:00:05] INFO: Image pulled successfully"
    ]
  }
}
```

---

### 4.4 日志搜索

#### 基本信息

| 字段 | 内容 |
|------|------|
| 接口编号 | LOG-001 |
| 接口名称 | 日志搜索 |
| 请求方法 | POST |
| 请求路径 | /api/v1/logs/search |
| 说明 | 搜索系统日志 |

#### 请求参数

**Body参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | string | 否 | 搜索关键字 |
| level | string | 否 | 日志级别：DEBUG/INFO/WARN/ERROR |
| service | string | 否 | 服务名称 |
| host | string | 否 | 主机IP |
| start_time | string | 是 | 开始时间，ISO8601格式 |
| end_time | string | 是 | 结束时间，ISO8601格式 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页数量，默认20 |

**请求示例：**
```json
{
  "keyword": "error",
  "level": "ERROR",
  "service": "web-api",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z",
  "page": 1,
  "page_size": 20
}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | int | 状态码 |
| message | string | 消息 |
| data | object | 搜索结果 |
| data.total | int | 总记录数 |
| data.page | int | 当前页 |
| data.page_size | int | 每页大小 |
| data.list | array | 日志列表 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 150,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "id": "xxx",
        "timestamp": "2024-01-01T12:30:00Z",
        "level": "ERROR",
        "service": "web-api",
        "host": "192.168.1.10",
        "message": "Connection refused",
        "detail": "..."
      }
    ]
  }
}
```

---

### 4.5 处理告警

#### 基本信息

| 字段 | 内容 |
|------|------|
| 接口编号 | MON-007 |
| 接口名称 | 处理告警 |
| 请求方法 | POST |
| 请求路径 | /api/v1/alerts/{id}/handle |
| 说明 | 处理已触发的告警 |

#### 请求参数

**Path参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | long | 是 | 告警ID |

**Body参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| note | string | 是 | 处理备注 |

**请求示例：**
```json
{
  "note": "已确认并处理，重启服务后恢复"
}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | int | 状态码 |
| message | string | 消息 |
| data | object | 处理结果 |
| data.id | long | 告警ID |
| data.status | string | 新状态 |
| data.handler_id | long | 处理人ID |
| data.handle_time | string | 处理时间 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1001,
    "status": "acknowledged",
    "handler_id": 1,
    "handle_time": "2024-01-01T12:30:00Z"
  }
}
```

---

## 5. 数据结构设计

### 5.1 公共数据结构

| 结构名 | 说明 | 字段说明 |
|--------|------|----------|
| Result | 通用响应 | code, message, data |
| PageResult | 分页结果 | total, page, page_size, list |
| ErrorInfo | 错误信息 | code, message, detail |

### 5.2 数据结构定义

```json
{
  "Result": {
    "code": 200,
    "message": "success",
    "data": {}
  },
  "PageResult": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "list": []
  }
}
```

---

## 6. 安全设计

### 6.1 认证授权
- 所有接口（除登录外）需要有效的JWT Token
- Token有效期24小时
- Refresh Token有效期7天

### 6.2 限流策略

| 接口类型 | 限流阈值 | 时间窗口 |
|----------|----------|----------|
| 全局 | 1000 | 1分钟 |
| 搜索类接口 | 100 | 1分钟 |
| 写入类接口 | 200 | 1分钟 |

### 6.3 敏感信息处理
- 密码不返回
- 敏感配置值脱敏返回（显示前3位+***+后3位）

---

## 7. 修订历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| v1.0 | 2024-01-01 | - | 初始版本 |