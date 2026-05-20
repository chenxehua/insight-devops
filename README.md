# 天鹂可视化运维平台 (Insight DevOps)

> 智能化的运维管理平台，融合 Superpowers + OpenSpec 双层架构

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    天鹂可视化运维平台                         │
├─────────────────────────────────────────────────────────────┤
│  📋 OpenSpec (规划层)                                       │
│  ├── 为什么做这个变更                                        │
│  ├── 需求文档、设计决策、知识沉淀                            │
│  └── 技术方案、变更历史、影响分析                            │
├─────────────────────────────────────────────────────────────┤
│  ⚡ Superpowers (执行层)                                    │
│  ├── 代码写得对不对                                         │
│  ├── CI/CD 流水线、质量门禁                                 │
│  └── 自动化部署、监控告警、运维脚本                          │
└─────────────────────────────────────────────────────────────┘
```

## 📂 目录结构

```
insight-devops/
├── superpowers/      # ⚡ 执行层 - 工程纪律与自动化
│   ├── ci/           # CI/CD 流水线配置
│   ├── scripts/      # 运维脚本
│   └── checks/       # 质量门禁检查
├── openspec/         # 📋 规划层 - 知识沉淀与变更理由
│   ├── specs/        # 技术规格文档
│   ├── decisions/    # 架构决策记录 (ADR)
│   └── changes/      # 变更记录
├── docs/             # 📚 项目文档
└── scripts/          # 🔧 工具脚本
```

## ⚡ Superpowers - 执行层

负责"**代码写得对不对**"：
- CI/CD 流水线自动化构建部署
- 代码质量检查 (Lint, UT, Coverage)
- 自动化测试与回归验证
- 部署脚本与回滚机制
- 监控告警规则与自动恢复

### 快速命令

```bash
# 构建
./superpowers/scripts/build.sh

# 部署
./superpowers/scripts/deploy.sh --env prod

# 质量检查
./superpowers/scripts/check.sh
```

## 📋 OpenSpec - 规划层

负责"**为什么做这个变更**"：
- 需求背景与设计目标
- 技术方案与选型理由
- 变更影响分析与风险评估
- 知识积累与经验传承

### 文档规范

- `openspec/specs/` - 功能/非功能需求规格
- `openspec/decisions/` - 架构决策记录 (ADR)
- `openspec/changes/` - 变更历史追踪

## 🚀 快速开始

```bash
# 1. 进入项目目录
cd insight-devops

# 2. 查看状态
./scripts/status.sh

# 3. 部署到测试环境
./superpowers/scripts/deploy.sh --env test
```

---

_Built with Superpowers ⚡ + OpenSpec 📋_
