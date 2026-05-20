import { test, expect } from '@playwright/test';
// 测试助手函数
export async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
export async function loginAsUser(page, username = 'testuser', password = 'test123456') {
    await page.goto('/login');
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
}
export async function logout(page) {
    await page.click('text=退出');
    await expect(page).toHaveURL(/\/login/);
}
// 页面对象模型
export class LoginPage {
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/login');
    }
    async login(username, password) {
        await this.page.fill('input[type="text"]', username);
        await this.page.fill('input[type="password"]', password);
        await this.page.click('button[type="submit"]');
    }
}
export class DashboardPage {
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/dashboard');
    }
    get statsCards() {
        return this.page.locator('[data-testid^="stats-"]');
    }
    get deployChart() {
        return this.page.locator('[data-testid="deploy-chart"]');
    }
}
export class UserPage {
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/users');
    }
    get table() {
        return this.page.locator('table');
    }
    get createButton() {
        return this.page.locator('button:has-text("新建用户")');
    }
    async createUser(userData) {
        await this.createButton.click();
        await this.page.locator('input[id="username"]').fill(userData.username);
        await this.page.locator('input[id="password"]').fill(userData.password);
        await this.page.locator('input[id="email"]').fill(userData.email);
        await this.page.locator('button:has-text("确定")').click();
    }
}
export class AppPage {
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/apps');
    }
    get table() {
        return this.page.locator('table');
    }
}
export class DeployPage {
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/deploys');
    }
    get table() {
        return this.page.locator('table');
    }
}
// E2E 测试套件
test.describe('认证流程 E2E', () => {
    test('登录成功', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('admin', 'admin123');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
        await expect(page.locator('text=欢迎')).toBeVisible();
    });
    test('登录失败 - 错误密码', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('admin', 'wrongpassword');
        await expect(page.locator('text=用户名或密码错误')).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });
    test('登出功能', async ({ page }) => {
        await loginAsAdmin(page);
        await logout(page);
        await expect(page).toHaveURL(/\/login/);
    });
});
test.describe('仪表盘 E2E', () => {
    test.beforeEach(loginAsAdmin);
    test('显示统计数据', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        await dashboardPage.goto();
        await expect(page.locator('text=运维概览')).toBeVisible();
        await expect(dashboardPage.statsCards.first()).toBeVisible();
    });
    test('显示图表', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        await dashboardPage.goto();
        await expect(dashboardPage.deployChart).toBeVisible();
    });
});
test.describe('用户管理 E2E', () => {
    test.beforeEach(loginAsAdmin);
    test('用户列表', async ({ page }) => {
        const userPage = new UserPage(page);
        await userPage.goto();
        await expect(userPage.table).toBeVisible();
    });
    test('创建用户', async ({ page }) => {
        const userPage = new UserPage(page);
        await userPage.goto();
        const randomUsername = `user_${Date.now()}`;
        await userPage.createUser({
            username: randomUsername,
            password: 'pass123456',
            email: `${randomUsername}@test.com`,
        });
        await expect(page.locator('text=创建成功').or(page.locator('text=提交成功'))).toBeVisible({ timeout: 10000 });
    });
    test('搜索用户', async ({ page }) => {
        const userPage = new UserPage(page);
        await userPage.goto();
        await page.fill('input[placeholder*="搜索"]', 'admin');
        await page.click('button:has-text("搜索")');
        await expect(userPage.table).toBeVisible();
    });
});
test.describe('应用管理 E2E', () => {
    test.beforeEach(loginAsAdmin);
    test('应用列表', async ({ page }) => {
        const appPage = new AppPage(page);
        await appPage.goto();
        await expect(appPage.table).toBeVisible();
    });
    test('创建应用', async ({ page }) => {
        await page.goto('/apps');
        await page.click('button:has-text("新建应用")');
        await page.fill('input[id="name"]', `App_${Date.now()}`);
        await page.fill('input[id="appKey"]', `app-key-${Date.now()}`);
        await page.selectOption('select[id="appType"]', 'java');
        await page.click('button:has-text("确定")');
        await expect(page.locator('text=创建成功').or(page.locator('text=提交成功'))).toBeVisible({ timeout: 10000 });
    });
});
test.describe('部署管理 E2E', () => {
    test.beforeEach(loginAsAdmin);
    test('部署列表', async ({ page }) => {
        const deployPage = new DeployPage(page);
        await deployPage.goto();
        await expect(deployPage.table).toBeVisible();
    });
    test('创建部署任务', async ({ page }) => {
        await page.goto('/deploys');
        await page.click('button:has-text("新建部署")');
        await page.fill('input[id="name"]', `Deploy_${Date.now()}`);
        await page.selectOption('select[id="environment"]', 'test');
        await page.click('button:has-text("确定")');
        await expect(page.locator('text=创建成功').or(page.locator('text=提交成功'))).toBeVisible({ timeout: 10000 });
    });
});
test.describe('导航 E2E', () => {
    test.beforeEach(loginAsAdmin);
    test('侧边栏菜单', async ({ page }) => {
        await page.goto('/dashboard');
        const menuItems = ['仪表盘', '用户管理', '应用管理', '部署管理', '脚本管理'];
        for (const item of menuItems) {
            await expect(page.locator(`nav, .sidebar, [role="navigation"]`).getByText(item)).toBeVisible();
        }
    });
    test('菜单导航', async ({ page }) => {
        await page.goto('/dashboard');
        await page.click('text=用户管理');
        await expect(page).toHaveURL(/\/users/);
        await page.click('text=应用管理');
        await expect(page).toHaveURL(/\/apps/);
    });
});
test.describe('响应式设计 E2E', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    test('移动端菜单', async ({ page }) => {
        await loginAsAdmin(page);
        const menuToggle = page.locator('[data-testid="menu-toggle"]').or(page.locator('.hamburger'));
        if (await menuToggle.isVisible()) {
            await menuToggle.click();
            await expect(page.locator('nav, .sidebar')).toBeVisible();
        }
    });
});
test.describe('性能 E2E', () => {
    test('首屏加载时间', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        console.log(`首屏加载时间: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });
    test('页面导航时间', async ({ page }) => {
        await loginAsAdmin(page);
        const startTime = Date.now();
        await page.goto('/users');
        await page.waitForLoadState('networkidle');
        const navTime = Date.now() - startTime;
        console.log(`页面导航时间: ${navTime}ms`);
        expect(navTime).toBeLessThan(2000);
    });
});
//# sourceMappingURL=app.spec.js.map