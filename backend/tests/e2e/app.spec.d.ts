import { Page } from '@playwright/test';
export declare function loginAsAdmin(page: Page): Promise<void>;
export declare function loginAsUser(page: Page, username?: string, password?: string): Promise<void>;
export declare function logout(page: Page): Promise<void>;
export declare class LoginPage {
    page: Page;
    constructor(page: Page);
    goto(): Promise<void>;
    login(username: string, password: string): Promise<void>;
}
export declare class DashboardPage {
    page: Page;
    constructor(page: Page);
    goto(): Promise<void>;
    get statsCards(): import("playwright-core").Locator;
    get deployChart(): import("playwright-core").Locator;
}
export declare class UserPage {
    page: Page;
    constructor(page: Page);
    goto(): Promise<void>;
    get table(): import("playwright-core").Locator;
    get createButton(): import("playwright-core").Locator;
    createUser(userData: {
        username: string;
        password: string;
        email: string;
    }): Promise<void>;
}
export declare class AppPage {
    page: Page;
    constructor(page: Page);
    goto(): Promise<void>;
    get table(): import("playwright-core").Locator;
}
export declare class DeployPage {
    page: Page;
    constructor(page: Page);
    goto(): Promise<void>;
    get table(): import("playwright-core").Locator;
}
//# sourceMappingURL=app.spec.d.ts.map