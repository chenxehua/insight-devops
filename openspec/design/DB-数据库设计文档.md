# 数据库设计文档

## 1. 文档信息

| 字段 | 内容 |
|------|------|
| 项目名称 | 天鹂可视化运维平台 (Insight DevOps) |
| 模块名称 | 平台整体数据模型 |
| 文档版本 | v1.0 |
| 作者 | - |
| 创建日期 | 2024-01-01 |
| 最后更新 | 2024-01-01 |

---

## 2. 概述

### 2.1 数据库简介
本数据库为天鹂可视化运维平台的核心数据存储，支持以下主要功能模块的数据存储：
- 用户与权限管理
- 应用与部署管理
- 配置管理
- 脚本管理
- 监控与告警
- 日志分析
- 故障诊断
- 镜像管理
- 数据库备份
- 巡检管理

### 2.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | 小写+下划线，单数 | user_info |
| 字段名 | 小写+下划线 | user_name |
| 主键 | id | id |
| 外键 | xxx_id | user_id |
| 索引 | idx_xxx | idx_user_name |
| 唯一索引 | uk_xxx | uk_user_email |
| 时间字段 | xxx_at | created_at, updated_at |
| 布尔字段 | is_xxx | is_deleted |

---

## 3. 数据库列表

| 数据库名 | 用途 | 字符集 | 备注 |
|----------|------|--------|------|
| insight_devops | 主库 | utf8mb4 | 全部业务数据 |

---

## 4. 表设计

### 4.1 表清单

| 序号 | 表名 | 中文名 | 说明 |
|------|------|--------|------|
| 1 | users | 用户表 | 用户信息 |
| 2 | roles | 角色表 | 角色定义 |
| 3 | permissions | 权限表 | 权限定义 |
| 4 | user_roles | 用户角色关联表 | 用户角色多对多 |
| 5 | role_permissions | 角色权限关联表 | 角色权限多对多 |
| 6 | apps | 应用表 | 应用配置 |
| 7 | deploy_tasks | 部署任务表 | 部署任务记录 |
| 8 | scripts | 脚本表 | 运维脚本 |
| 9 | script_executions | 脚本执行记录表 | 脚本执行历史 |
| 10 | configs | 配置表 | 配置文件 |
| 11 | config_versions | 配置版本表 | 配置版本历史 |
| 12 | monitors | 监控指标表 | 监控指标配置 |
| 13 | alerts | 告警记录表 | 告警事件 |
| 14 | logs | 日志表 | 日志索引 |
| 15 | faults | 故障表 | 故障记录 |
| 16 | images | 镜像表 | 镜像信息 |
| 17 | backups | 备份记录表 | 数据库备份记录 |
| 18 | check_tasks | 巡检任务表 | 巡检任务 |
| 19 | check_reports | 巡检报告表 | 巡检报告 |
| 20 | audit_logs | 审计日志表 | 操作审计 |
| 21 | notifications | 通知记录表 | 通知发送记录 |

---

### 4.2 详细表设计

#### 表名：users（中文名：用户表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|------|--------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | username | 用户名 | varchar | 50 | - | - | ✓ | - | 唯一 |
| 3 | password_hash | 密码哈希 | varchar | 255 | - | - | ✓ | - | - |
| 4 | email | 邮箱 | varchar | 100 | - | - | ✓ | - | 唯一 |
| 5 | phone | 手机号 | varchar | 20 | - | - | - | - | - |
| 6 | real_name | 真实姓名 | varchar | 50 | - | - | - | - | - |
| 7 | status | 状态 | tinyint | - | - | - | ✓ | 1 | 1:正常 0:禁用 |
| 8 | last_login_at | 最后登录时间 | datetime | - | - | - | - | - | - |
| 9 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 10 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |
| 11 | is_deleted | 是否删除 | tinyint | - | - | - | ✓ | 0 | 软删除 |

**索引设计：**

| 索引名 | 索引类型 | 字段 | 说明 |
|--------|----------|------|------|
| idx_username | UNIQUE | username | 唯一索引 |
| idx_email | UNIQUE | email | 唯一索引 |
| idx_status | NORMAL | status | 状态查询 |

**建表语句：**
```sql
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1正常 0禁用',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

#### 表名：roles（中文名：角色表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|------|--------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | role_name | 角色名 | varchar | 50 | - | - | ✓ | - | 唯一 |
| 3 | role_code | 角色代码 | varchar | 50 | - | - | ✓ | - | 唯一 |
| 4 | description | 描述 | varchar | 255 | - | - | - | - | - |
| 5 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 6 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL COMMENT '角色名',
  `role_code` varchar(50) NOT NULL COMMENT '角色代码',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

---

#### 表名：user_roles（中文名：用户角色关联表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|------|--------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | user_id | 用户ID | bigint | - | - | ✓ | ✓ | - | 关联users.id |
| 3 | role_id | 角色ID | bigint | - | - | ✓ | ✓ | - | 关联roles.id |
| 4 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |

**索引设计：**

| 索引名 | 索引类型 | 字段 | 说明 |
|--------|----------|------|------|
| idx_user_role | UNIQUE | user_id, role_id | 联合唯一 |

**建表语句：**
```sql
CREATE TABLE `user_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `fk_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';
```

---

#### 表名：apps（中文名：应用表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|------|--------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | app_name | 应用名称 | varchar | 100 | - | - | ✓ | - | - |
| 3 | app_code | 应用代码 | varchar | 50 | - | - | ✓ | - | 唯一 |
| 4 | app_type | 应用类型 | varchar | 20 | - | - | ✓ | - | docker/k8s/shell |
| 5 | repo_url | 仓库地址 | varchar | 255 | - | - | - | - | - |
| 6 | dockerfile | Dockerfile路径 | varchar | 255 | - | - | - | - | - |
| 7 | config_files | 配置文件 | text | - | - | - | - | - | JSON格式 |
| 8 | health_check_path | 健康检查路径 | varchar | 255 | - | - | - | - | - |
| 9 | pre_script | 部署前脚本 | text | - | - | - | - | - | - |
| 10 | post_script | 部署后脚本 | text | - | - | - | - | - | - |
| 11 | env_vars | 环境变量 | text | - | - | - | - | - | JSON格式 |
| 12 | description | 描述 | varchar | 500 | - | - | - | - | - |
| 13 | owner_id | 负责人ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 14 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 15 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**索引设计：**

| 索引名 | 索引类型 | 字段 | 说明 |
|--------|----------|------|------|
| uk_app_code | UNIQUE | app_code | 唯一索引 |
| idx_owner | NORMAL | owner_id | 负责人查询 |

**建表语句：**
```sql
CREATE TABLE `apps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app_name` varchar(100) NOT NULL COMMENT '应用名称',
  `app_code` varchar(50) NOT NULL COMMENT '应用代码',
  `app_type` varchar(20) NOT NULL DEFAULT 'docker' COMMENT '应用类型',
  `repo_url` varchar(255) DEFAULT NULL COMMENT '仓库地址',
  `dockerfile` varchar(255) DEFAULT NULL COMMENT 'Dockerfile路径',
  `config_files` text COMMENT '配置文件',
  `health_check_path` varchar(255) DEFAULT NULL COMMENT '健康检查路径',
  `pre_script` text COMMENT '部署前脚本',
  `post_script` text COMMENT '部署后脚本',
  `env_vars` text COMMENT '环境变量JSON',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `owner_id` bigint DEFAULT NULL COMMENT '负责人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_code` (`app_code`),
  KEY `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用表';
```

---

#### 表名：deploy_tasks（中文名：部署任务表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|------|--------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | app_id | 应用ID | bigint | - | - | ✓ | ✓ | - | 关联apps.id |
| 3 | environment | 环境 | varchar | 20 | - | - | ✓ | - | dev/staging/prod |
| 4 | version | 部署版本 | varchar | 100 | - | - | ✓ | - | - |
| 5 | strategy | 部署策略 | varchar | 20 | - | - | - | normal | normal/blue_green/canary |
| 6 | status | 状态 | varchar | 20 | - | - | ✓ | pending | pending/running/success/failed/rollback |
| 7 | progress | 进度 | int | - | - | - | - | 0 | 0-100 |
| 8 | deploy_log | 部署日志 | longtext | - | - | - | - | - | - |
| 9 | result | 结果 | text | - | - | - | - | - | - |
| 10 | executor_id | 执行人ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 11 | started_at | 开始时间 | datetime | - | - | - | - | - | - |
| 12 | finished_at | 结束时间 | datetime | - | - | - | - | - | - |
| 13 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 14 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**索引设计：**

| 索引名 | 索引类型 | 字段 | 说明 |
|--------|----------|------|------|
| idx_app_env | NORMAL | app_id, environment | 环境查询 |
| idx_status | NORMAL | status | 状态查询 |
| idx_executor | NORMAL | executor_id | 执行人查询 |
| idx_created | NORMAL | created_at | 时间查询 |

**建表语句：**
```sql
CREATE TABLE `deploy_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app_id` bigint NOT NULL COMMENT '应用ID',
  `environment` varchar(20) NOT NULL COMMENT '部署环境',
  `version` varchar(100) NOT NULL COMMENT '部署版本',
  `strategy` varchar(20) DEFAULT 'normal' COMMENT '部署策略',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态',
  `progress` int DEFAULT '0' COMMENT '进度0-100',
  `deploy_log` longtext COMMENT '部署日志',
  `result` text COMMENT '结果',
  `executor_id` bigint DEFAULT NULL COMMENT '执行人ID',
  `started_at` datetime DEFAULT NULL COMMENT '开始时间',
  `finished_at` datetime DEFAULT NULL COMMENT '结束时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_env` (`app_id`, `environment`),
  KEY `idx_status` (`status`),
  KEY `idx_executor` (`executor_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部署任务表';
```

---

#### 表名：scripts（中文名：脚本表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | script_name | 脚本名称 | varchar | 100 | - | - | ✓ | - | - |
| 3 | script_code | 脚本代码 | varchar | 50 | - | - | ✓ | - | 唯一 |
| 4 | script_type | 脚本类型 | varchar | 20 | - | - | ✓ | - | shell/python/ansible |
| 5 | content | 脚本内容 | longtext | - | - | - | ✓ | - | - |
| 6 | params | 参数配置 | text | - | - | - | - | - | JSON格式 |
| 7 | category | 分类 | varchar | 50 | - | - | - | - | - |
| 8 | tags | 标签 | varchar | 255 | - | - | - | - | 逗号分隔 |
| 9 | version | 版本号 | int | - | - | - | ✓ | 1 | - |
| 10 | description | 描述 | varchar | 500 | - | - | - | - | - |
| 11 | owner_id | 所有者ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 12 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 13 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `scripts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `script_name` varchar(100) NOT NULL COMMENT '脚本名称',
  `script_code` varchar(50) NOT NULL COMMENT '脚本代码',
  `script_type` varchar(20) NOT NULL COMMENT '脚本类型',
  `content` longtext NOT NULL COMMENT '脚本内容',
  `params` text COMMENT '参数配置JSON',
  `category` varchar(50) DEFAULT NULL COMMENT '分类',
  `tags` varchar(255) DEFAULT NULL COMMENT '标签',
  `version` int NOT NULL DEFAULT '1' COMMENT '版本号',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `owner_id` bigint DEFAULT NULL COMMENT '所有者ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_script_code` (`script_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脚本表';
```

---

#### 表名：configs（中文名：配置表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | config_name | 配置名称 | varchar | 100 | - | - | ✓ | - | - |
| 3 | config_key | 配置键 | varchar | 100 | - | - | ✓ | - | - |
| 4 | app_id | 应用ID | bigint | - | - | ✓ | - | - | 关联apps.id |
| 5 | environment | 环境 | varchar | 20 | - | - | - | - | dev/staging/prod |
| 6 | config_type | 配置类型 | varchar | 20 | - | - | ✓ | - | file/key-value/json/yaml |
| 7 | config_value | 配置值 | longtext | - | - | - | - | - | - |
| 8 | version | 版本号 | int | - | - | - | ✓ | 1 | - |
| 9 | description | 描述 | varchar | 500 | - | - | - | - | - |
| 10 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 11 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_name` varchar(100) NOT NULL COMMENT '配置名称',
  `config_key` varchar(100) NOT NULL COMMENT '配置键',
  `app_id` bigint DEFAULT NULL COMMENT '应用ID',
  `environment` varchar(20) DEFAULT NULL COMMENT '环境',
  `config_type` varchar(20) NOT NULL DEFAULT 'key-value' COMMENT '配置类型',
  `config_value` longtext COMMENT '配置值',
  `version` int NOT NULL DEFAULT '1' COMMENT '版本号',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_env_key` (`app_id`, `environment`, `config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配置表';
```

---

#### 表名：alerts（中文名：告警记录表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | alert_name | 告警名称 | varchar | 100 | - | - | ✓ | - | - |
| 3 | alert_level | 告警级别 | varchar | 20 | - | - | ✓ | - | P0/P1/P2 |
| 4 | target_type | 目标类型 | varchar | 50 | - | - | ✓ | - | host/app/service |
| 5 | target_id | 目标ID | bigint | - | - | - | - | - | - |
| 6 | metric_name | 指标名称 | varchar | 100 | - | - | - | - | - |
| 7 | metric_value | 指标值 | varchar | 100 | - | - | - | - | - |
| 8 | threshold | 阈值 | varchar | 100 | - | - | - | - | - |
| 9 | message | 告警消息 | varchar | 500 | - | - | - | - | - |
| 10 | status | 状态 | varchar | 20 | - | - | ✓ | pending | pending/acknowledged/resolved |
| 11 | handler_id | 处理人ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 12 | handle_time | 处理时间 | datetime | - | - | - | - | - | - |
| 13 | handle_note | 处理备注 | text | - | - | - | - | - | - |
| 14 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 15 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `alerts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alert_name` varchar(100) NOT NULL COMMENT '告警名称',
  `alert_level` varchar(20) NOT NULL COMMENT '告警级别',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型',
  `target_id` bigint DEFAULT NULL COMMENT '目标ID',
  `metric_name` varchar(100) DEFAULT NULL COMMENT '指标名称',
  `metric_value` varchar(100) DEFAULT NULL COMMENT '指标值',
  `threshold` varchar(100) DEFAULT NULL COMMENT '阈值',
  `message` varchar(500) DEFAULT NULL COMMENT '告警消息',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态',
  `handler_id` bigint DEFAULT NULL COMMENT '处理人ID',
  `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
  `handle_note` text COMMENT '处理备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_level_status` (`alert_level`, `status`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='告警记录表';
```

---

#### 表名：faults（中文名：故障表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | fault_title | 故障标题 | varchar | 200 | - | - | ✓ | - | - |
| 3 | fault_level | 故障级别 | varchar | 20 | - | - | ✓ | - | P0/P1/P2 |
| 4 | fault_type | 故障类型 | varchar | 50 | - | - | - | - | - |
| 5 | target_type | 影响对象类型 | varchar | 50 | - | - | - | - | - |
| 6 | target_id | 影响对象ID | bigint | - | - | - | - | - | - |
| 7 | root_cause | 根因 | text | - | - | - | - | - | - |
| 8 | solution | 解决方案 | text | - | - | - | - | - | - |
| 9 | status | 状态 | varchar | 20 | - | - | ✓ | open | open/handling/resolved/closed |
| 10 | handler_id | 处理人ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 11 | occurred_at | 发生时间 | datetime | - | - | - | - | - | - |
| 12 | detected_at | 发现时间 | datetime | - | - | - | - | - | - |
| 13 | resolved_at | 解决时间 | datetime | - | - | - | - | - | - |
| 14 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 15 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `faults` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fault_title` varchar(200) NOT NULL COMMENT '故障标题',
  `fault_level` varchar(20) NOT NULL COMMENT '故障级别',
  `fault_type` varchar(50) DEFAULT NULL COMMENT '故障类型',
  `target_type` varchar(50) DEFAULT NULL COMMENT '影响对象类型',
  `target_id` bigint DEFAULT NULL COMMENT '影响对象ID',
  `root_cause` text COMMENT '根因',
  `solution` text COMMENT '解决方案',
  `status` varchar(20) NOT NULL DEFAULT 'open' COMMENT '状态',
  `handler_id` bigint DEFAULT NULL COMMENT '处理人ID',
  `occurred_at` datetime DEFAULT NULL COMMENT '发生时间',
  `detected_at` datetime DEFAULT NULL COMMENT '发现时间',
  `resolved_at` datetime DEFAULT NULL COMMENT '解决时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_level` (`fault_level`),
  KEY `idx_handler` (`handler_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故障表';
```

---

#### 表名：images（中文名：镜像表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | repo_id | 仓库ID | bigint | - | - | ✓ | - | - | 关联image_repos.id |
| 3 | image_name | 镜像名称 | varchar | 255 | - | - | ✓ | - | namespace/repo |
| 4 | tag | 版本标签 | varchar | 100 | - | - | ✓ | latest | - |
| 5 | image_size | 镜像大小 | bigint | - | - | - | - | 0 | bytes |
| 6 | digest | 镜像摘要 | varchar | 255 | - | - | - | - | - |
| 7 | scan_status | 扫描状态 | varchar | 20 | - | - | - | - | pending/passed/failed |
| 8 | scan_report | 扫描报告 | text | - | - | - | - | - | - |
| 9 | last_pulled_at | 最后拉取时间 | datetime | - | - | - | - | - | - |
| 10 | pull_count | 拉取次数 | int | - | - | - | - | 0 | - |
| 11 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 12 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `repo_id` bigint DEFAULT NULL COMMENT '仓库ID',
  `image_name` varchar(255) NOT NULL COMMENT '镜像名称',
  `tag` varchar(100) NOT NULL DEFAULT 'latest' COMMENT '版本标签',
  `image_size` bigint DEFAULT '0' COMMENT '镜像大小(字节)',
  `digest` varchar(255) DEFAULT NULL COMMENT '镜像摘要',
  `scan_status` varchar(20) DEFAULT NULL COMMENT '扫描状态',
  `scan_report` text COMMENT '扫描报告',
  `last_pulled_at` datetime DEFAULT NULL COMMENT '最后拉取时间',
  `pull_count` int DEFAULT '0' COMMENT '拉取次数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_repo` (`repo_id`),
  KEY `idx_name_tag` (`image_name`, `tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='镜像表';
```

---

#### 表名：backups（中文名：备份记录表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | database_id | 数据库ID | bigint | - | - | ✓ | ✓ | - | 关联databases.id |
| 3 | backup_type | 备份类型 | varchar | 20 | - | - | ✓ | - | full/incremental |
| 4 | backup_path | 备份路径 | varchar | 500 | - | - | - | - | - |
| 5 | backup_size | 备份大小 | bigint | - | - | - | - | 0 | bytes |
| 6 | status | 状态 | varchar | 20 | - | - | ✓ | pending | pending/running/success/failed |
| 7 | started_at | 开始时间 | datetime | - | - | - | - | - | - |
| 8 | finished_at | 结束时间 | datetime | - | - | - | - | - | - |
| 9 | error_message | 错误信息 | text | - | - | - | - | - | - |
| 10 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `backups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `database_id` bigint NOT NULL COMMENT '数据库ID',
  `backup_type` varchar(20) NOT NULL COMMENT '备份类型',
  `backup_path` varchar(500) DEFAULT NULL COMMENT '备份路径',
  `backup_size` bigint DEFAULT '0' COMMENT '备份大小(字节)',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态',
  `started_at` datetime DEFAULT NULL COMMENT '开始时间',
  `finished_at` datetime DEFAULT NULL COMMENT '结束时间',
  `error_message` text COMMENT '错误信息',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_database` (`database_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备份记录表';
```

---

#### 表名：check_tasks（中文名：巡检任务表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | task_name | 任务名称 | varchar | 100 | - | - | ✓ | - | - |
| 3 | task_type | 任务类型 | varchar | 20 | - | - | - | - | host/app/service |
| 4 | target_id | 巡检对象ID | bigint | - | - | - | - | - | - |
| 5 | check_items | 巡检项 | text | - | - | - | ✓ | - | JSON格式 |
| 6 | schedule_type | 调度类型 | varchar | 20 | - | - | - | - | once/daily/weekly/monthly |
| 7 | schedule_cron | Cron表达式 | varchar | 50 | - | - | - | - | - |
| 8 | next_run_at | 下次执行时间 | datetime | - | - | - | - | - | - |
| 9 | last_run_at | 最后执行时间 | datetime | - | - | - | - | - | - |
| 10 | status | 状态 | varchar | 20 | - | - | ✓ | enabled | enabled/disabled |
| 11 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |
| 12 | updated_at | 更新时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `check_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_name` varchar(100) NOT NULL COMMENT '任务名称',
  `task_type` varchar(20) DEFAULT NULL COMMENT '任务类型',
  `target_id` bigint DEFAULT NULL COMMENT '巡检对象ID',
  `check_items` text NOT NULL COMMENT '巡检项JSON',
  `schedule_type` varchar(20) DEFAULT NULL COMMENT '调度类型',
  `schedule_cron` varchar(50) DEFAULT NULL COMMENT 'Cron表达式',
  `next_run_at` datetime DEFAULT NULL COMMENT '下次执行时间',
  `last_run_at` datetime DEFAULT NULL COMMENT '最后执行时间',
  `status` varchar(20) NOT NULL DEFAULT 'enabled' COMMENT '状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedule` (`schedule_type`, `next_run_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检任务表';
```

---

#### 表名：audit_logs（中文名：审计日志表）

| 序号 | 字段名 | 中文名 | 数据类型 | 长度 | 主键 | 外键 | 非空 | 默认值 | 说明 |
|------|--------|--------|----------|------|------|------|--------|------|------|
| 1 | id | 主键 | bigint | - | ✓ | - | ✓ | 自增 | - |
| 2 | user_id | 用户ID | bigint | - | - | ✓ | - | - | 关联users.id |
| 3 | username | 用户名 | varchar | 50 | - | - | - | - | - |
| 4 | action | 操作动作 | varchar | 50 | - | - | ✓ | - | - |
| 5 | resource_type | 资源类型 | varchar | 50 | - | - | - | - | - |
| 6 | resource_id | 资源ID | bigint | - | - | - | - | - | - |
| 7 | detail | 详情 | text | - | - | - | - | - | - |
| 8 | ip_address | IP地址 | varchar | 50 | - | - | - | - | - |
| 9 | user_agent | 用户代理 | varchar | 255 | - | - | - | - | - |
| 10 | created_at | 创建时间 | datetime | - | - | - | ✓ | NOW() | - |

**建表语句：**
```sql
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `action` varchar(50) NOT NULL COMMENT '操作动作',
  `resource_type` varchar(50) DEFAULT NULL COMMENT '资源类型',
  `resource_id` bigint DEFAULT NULL COMMENT '资源ID',
  `detail` text COMMENT '详情',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(255) DEFAULT NULL COMMENT '用户代理',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_resource` (`resource_type`, `resource_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';
```

---

## 5. 关系设计

### 5.1 ER图

```
users ───< user_roles >─── roles ───< role_permissions >─── permissions
  │
  │
  └──< apps (owner)              ───< deploy_tasks
  │                                 │
  └──< scripts (owner)             │  (待续...)
  │                                 │
  └──< alerts (handler)            │
  │                                 │
  └──< faults (handler)            │
                                     │
apps ───< configs                  │
         │                          │
         └─────< deploy_tasks >─────┘
```

### 5.2 外键关系

| 表名 | 字段 | 引用表 | 引用字段 | 级联删除 |
|------|------|--------|----------|----------|
| user_roles | user_id | users | id | ON DELETE CASCADE |
| user_roles | role_id | roles | id | ON DELETE CASCADE |
| apps | owner_id | users | id | SET NULL |
| deploy_tasks | app_id | apps | id | CASCADE |
| deploy_tasks | executor_id | users | id | SET NULL |
| scripts | owner_id | users | id | SET NULL |
| alerts | handler_id | users | id | SET NULL |
| faults | handler_id | users | id | SET NULL |
| configs | app_id | apps | id | CASCADE |
| backups | database_id | databases | id | CASCADE |

---

## 6. 数据量估算

| 表名 | 当前数据量 | 预计年增长 | 最大数据量预估 |
|------|------------|------------|----------------|
| users | 100 | 50 | 1,000 |
| apps | 50 | 20 | 500 |
| deploy_tasks | 10,000 | 5,000 | 100,000 |
| scripts | 500 | 100 | 5,000 |
| configs | 1,000 | 500 | 10,000 |
| alerts | 50,000 | 20,000 | 500,000 |
| faults | 1,000 | 500 | 10,000 |
| audit_logs | 100,000 | 50,000 | 1,000,000 |

---

## 7. 修订历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| v1.0 | 2024-01-01 | - | 初始版本 |