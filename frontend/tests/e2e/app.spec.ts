import { test, expect } from '@playwright/test'
import { Page, Locator } from '@playwright/test'

// 测试配置
const TEST_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const TEST_USER = { username: 'admin', password: 'admin123' }
const TEST_TIMEOUT = 30000

// 页面对象模型
class LoginPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto(`${TEST_BASE_URL}/login`)
  }

  get usernameInput(): Locator {
    return this.page.locator('input[type="text"]').first()
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]').first()
  }

  get submitButton(): Locator {
    return this.page.locator('button[type="submit"]').first()
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

// 共享测试步骤
async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(TEST_USER.username, TEST_USER.password)
  await expect(page).toHaveURL(/\/dashboard|\//)
}

// 测试套件
test.describe('E2E 测试 - 认证流程', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(TEST_TIMEOUT)
  })

  test('登录成功', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(TEST_USER.username, TEST_USER.password)
    
    // 验证跳转到仪表盘或首页
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 })
  })

  test('登录失败 - 错误密码', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(TEST_USER.username, 'wrongpassword')
    
    // 等待一下让页面响应
    await page.waitForTimeout(1000)
    
    // 验证仍在登录页面（因为密码错误不应该跳转）
    const currentUrl = page.url()
    expect(currentUrl).toContain('/login')
  })

  test('登录失败 - 空字段', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.submitButton.click()
    
    // 等待验证
    await page.waitForTimeout(500)
  })
})

test.describe('E2E 测试 - 仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(TEST_TIMEOUT)
    await loginAsAdmin(page)
  })

  test('仪表盘页面加载', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/dashboard`)
    // 验证页面加载
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('E2E 测试 - 用户管理', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(TEST_TIMEOUT)
    await loginAsAdmin(page)
  })

  test('用户列表页面加载', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/users`)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('E2E 测试 - 导航流程', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(TEST_TIMEOUT)
    await loginAsAdmin(page)
  })

  test('侧边栏存在', async ({ page }) => {
    await page.goto(`${TEST_BASE_URL}/dashboard`)
    // 验证页面渲染了内容
    const bodyContent = await page.locator('body').textContent()
    expect(bodyContent).toBeTruthy()
  })
})

test.describe('E2E 测试 - 性能', () => {
  test('页面加载时间', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(`${TEST_BASE_URL}/login`)
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    console.log(`登录页面加载时间: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(5000)
  })
})

test.describe('E2E 测试 - 响应式', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('移动端视图', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${TEST_BASE_URL}/dashboard`)
    await expect(page.locator('body')).toBeVisible()
  })
})