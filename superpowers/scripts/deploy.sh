#!/bin/bash
# ⚡ 部署脚本

set -e

ENV=${1:-test}
VERSION=${2:-latest}

echo "🚀 开始部署到 [$ENV] 环境，版本 [$VERSION]..."

case $ENV in
  test)
    echo "📍 部署到测试环境"
    ;;
  prod)
    echo "⚠️  部署到生产环境"
    ;;
  *)
    echo "❌ 未知环境: $ENV"
    exit 1
    ;;
esac

echo "✅ 部署完成！"
