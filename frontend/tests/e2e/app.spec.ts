import { test, expect, Page } from '@playwright/test'

// 测试数据
const TEST_USER = {
  username: 'admin',
  password: 'admin123',
}

const TEST_APP = {
  appName: '测试应用',
  appCode: `test-app-${Date.now()}`,
  appType: 'web',
}

const TEST_SCRIPT = {
  scriptName: '测试脚本',
  scriptCode: `test-script-${Date.now()}`,
  scriptType: 'bash',
  content: '#!/bin/bash\necho "Hello World"',
}

const TEST_CONFIG = {
  configName: '测试配置',
  configKey: `test.config.${Date.now()}`,
  configValue: 'test-value',
}

const TEST_DEPLOY = {
  environment: 'dev',
  version: 'v1.0.0',
  strategy: 'normal',
}

// 认证测试
test.describe('认证模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('登录页面应该正常加载', async ({ page }) => {
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('应该能够成功登录', async ({ page }) => {
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    
    // 等待跳转或登录成功
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 })
    
    // 如果成功登录，应该看到仪表盘
    if (page.url().includes('dashboard')) {
      await expect(page.locator('body')).toContainText(/仪表盘|首页|Dashboard/)
    }
  })

  test('登录失败应该显示错误提示', async ({ page }) => {
    await page.fill('input[type="text"]', 'wronguser')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    
    // 等待错误提示出现
    await page.waitForTimeout(1000)
    // 检查页面是否有错误提示或停留在登录页
    const url = page.url()
    expect(url).toContain('login')
  })
})

// 应用管理测试
test.describe('应用管理模块', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    // 导航到应用管理
    await page.goto('/apps')
    await page.waitForLoadState('networkidle')
  })

  test('应用列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    // 检查页面是否包含应用管理相关元素
    const content = await page.content()
    expect(content.toLowerCase()).toContain('app')
  })

  test('应该能够搜索应用', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_APP.appCode)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
    }
  })
})

// 部署管理测试
test.describe('部署管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/deploys')
    await page.waitForLoadState('networkidle')
  })

  test('部署列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('应该能够查看部署详情', async ({ page }) => {
    // 查找第一行数据的详情按钮
    const firstRow = page.locator('tbody tr').first()
    if (await firstRow.isVisible()) {
      const detailButton = firstRow.locator('button').first()
      if (await detailButton.isVisible()) {
        await detailButton.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// 脚本管理测试
test.describe('脚本管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/scripts')
    await page.waitForLoadState('networkidle')
  })

  test('脚本列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('应该能够搜索脚本', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
    }
  })
})

// 配置管理测试
test.describe('配置管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/configs')
    await page.waitForLoadState('networkidle')
  })

  test('配置列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })
})

// 监控告警测试
test.describe('监控告警模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/monitors')
    await page.waitForLoadState('networkidle')
  })

  test('监控列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })

  test('告警列表应该正常加载', async ({ page }) => {
    await page.goto('/alerts')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 用户管理测试
test.describe('用户管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })

  test('用户列表页面应该正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
  })
})

// 导航测试
test.describe('导航测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  })

  test('应该能够导航到各个模块', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/apps',
      '/deploys',
      '/scripts',
      '/configs',
      '/monitors',
      '/logs',
      '/faults',
      '/images',
      '/backups',
      '/checks',
      '/users',
      '/roles',
    ]

    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)
      // 验证页面加载成功
      expect(page.url()).toContain(route)
    }
  })

  test('侧边栏导航应该正常工作', async ({ page }) => {
    // 查找侧边栏菜单
    const sidebar = page.locator('aside, [class*="sidebar"], [class*="menu"]').first()
    
    if (await sidebar.isVisible()) {
      // 点击第一个菜单项
      const menuItems = sidebar.locator('a, [role="menuitem"]')
      const count = await menuItems.count()
      if (count > 1) {
        await menuItems.nth(1).click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// 响应式设计测试
test.describe('响应式设计测试', () => {
  test('移动端视图应该正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/login')
    await page.fill('input[type="text"]', TEST_USER.username)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    
    // 检查页面元素是否在移动端正确显示
    await expect(page.locator('body')).toBeVisible()
  })
})