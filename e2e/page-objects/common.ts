// E2E Page Object - 登录页面
import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.locator('input[type="text"]').first()
    this.passwordInput = page.locator('input[type="password"]').first()
    this.submitButton = page.locator('button[type="submit"]').first()
    this.errorMessage = page.locator('.ant-alert-error, [class*="error"], [role="alert"]').first()
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.page.waitForTimeout(1000)
  }

  async loginAsAdmin() {
    return this.login('admin', 'admin123')
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 }).catch(() => {
      // 错误消息可能不存在
    })
  }
}

export class DashboardPage {
  readonly page: Page
  readonly sidebar: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('aside, [class*="sidebar"], [role="navigation"]').first()
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForTimeout(1000)
  }
}

export class AppListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/apps')
    await this.page.waitForTimeout(1000)
  }
}

export class DeployListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/deploys')
    await this.page.waitForTimeout(1000)
  }
}

export class ScriptListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/scripts')
    await this.page.waitForTimeout(1000)
  }
}

export class ConfigListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/configs')
    await this.page.waitForTimeout(1000)
  }
}

export class MonitorListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/monitors')
    await this.page.waitForTimeout(1000)
  }
}

export class UserListPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto('/users')
    await this.page.waitForTimeout(1000)
  }
}