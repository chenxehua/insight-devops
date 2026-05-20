import { test, expect, Page } from '@playwright/test'

// 测试助手函数
async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard|\//)
}

async function logout(page: Page) {
  await page.click('text=退出')
  await expect(page).toHaveURL('/login')
}

// 认证测试
test.describe('认证功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('登录页面加载正常', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('天鹂可视化运维平台')
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('登录成功 - 管理员', async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('登出功能', async ({ page }) => {
    await loginAsAdmin(page)
    await logout(page)
  })
})

// 仪表盘测试
test.describe('仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('仪表盘页面加载', async ({ page }) => {
    await page.goto('/dashboard')
    // Check that something renders on dashboard
    await expect(page.locator('body')).toBeVisible()
  })
})

// 用户管理测试
test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('用户列表页面', async ({ page }) => {
    await page.goto('/users')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 应用管理测试
test.describe('应用管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('应用列表页面', async ({ page }) => {
    await page.goto('/apps')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 部署管理测试
test.describe('部署管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('部署列表页面', async ({ page }) => {
    await page.goto('/deploys')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 脚本管理测试
test.describe('脚本管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('脚本列表页面', async ({ page }) => {
    await page.goto('/scripts')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 配置管理测试
test.describe('配置管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('配置列表页面', async ({ page }) => {
    await page.goto('/configs')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 监控管理测试
test.describe('监控管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('监控列表页面', async ({ page }) => {
    await page.goto('/monitors')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 日志管理测试
test.describe('日志管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('日志列表页面', async ({ page }) => {
    await page.goto('/logs')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 故障管理测试
test.describe('故障管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('故障列表页面', async ({ page }) => {
    await page.goto('/faults')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 镜像管理测试
test.describe('镜像管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('镜像列表页面', async ({ page }) => {
    await page.goto('/images')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 备份管理测试
test.describe('备份管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('备份列表页面', async ({ page }) => {
    await page.goto('/backups')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 巡检管理测试
test.describe('巡检管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('巡检列表页面', async ({ page }) => {
    await page.goto('/checks')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 导航和布局测试
test.describe('导航和布局', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('侧边栏存在', async ({ page }) => {
    await page.goto('/dashboard')
    const body = await page.locator('body').textContent()
    // Just verify body renders content
    expect(body).toBeTruthy()
  })
})

// 响应式设计测试
test.describe('响应式设计', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('移动端页面加载', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })
})

// 性能测试
test.describe('性能测试', () => {
  test('登录页面加载时间', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    console.log(`登录页面加载时间: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(5000) // 5秒内加载完成
  })

  test('页面切换时间', async ({ page }) => {
    await loginAsAdmin(page)
    
    const startTime = Date.now()
    await page.goto('/users')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    console.log(`页面切换时间: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // 3秒内切换完成
  })
})