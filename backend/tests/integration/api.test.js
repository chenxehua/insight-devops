import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../app/server';
// 模拟数据库
vi.mock('../../app/lib/database', () => ({
    default: {
        prepare: vi.fn().mockReturnValue({
            run: vi.fn(),
            get: vi.fn(),
            all: vi.fn().mockReturnValue([]),
        }),
        exec: vi.fn(),
    },
    initDatabase: vi.fn(),
    closeDatabase: vi.fn(),
}));
describe('健康检查 API', () => {
    it('GET /health - 返回健康状态', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.timestamp).toBeDefined();
    });
});
describe('认证 API', () => {
    const testUser = { username: 'testuser', password: 'test123456' };
    beforeAll(async () => {
        // 创建测试用户
        const response = await request(app)
            .post('/api/auth/register')
            .send({
            username: testUser.username,
            password: testUser.password,
            email: 'test@example.com',
        });
    });
    it('POST /api/auth/login - 登录成功', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
            username: 'admin',
            password: 'admin123',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        expect(response.body.data.user).toBeDefined();
    });
    it('POST /api/auth/login - 登录失败 - 错误密码', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
            username: 'admin',
            password: 'wrongpassword',
        })
            .expect(401);
        expect(response.body.code).toBe(401);
        expect(response.body.message).toContain('错误');
    });
    it('POST /api/auth/login - 登录失败 - 用户不存在', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
            username: 'nonexistent',
            password: 'password',
        })
            .expect(401);
        expect(response.body.code).toBe(401);
    });
    it('POST /api/auth/login - 登录失败 - 空字段', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
            username: '',
            password: '',
        })
            .expect(400);
        expect(response.body.code).toBe(400);
    });
    it('POST /api/auth/register - 注册成功', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
            username: `newuser_${Date.now()}`,
            password: 'newpass123',
            email: 'newuser@example.com',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.user).toBeDefined();
    });
    it('POST /api/auth/register - 注册失败 - 用户名已存在', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
            username: 'admin',
            password: 'password123',
            email: 'another@example.com',
        })
            .expect(400);
        expect(response.body.code).toBe(400);
    });
    it('POST /api/auth/logout - 登出成功', async () => {
        const response = await request(app)
            .post('/api/auth/logout')
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('用户管理 API', () => {
    let authToken;
    beforeAll(async () => {
        // 获取认证 token
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/users - 获取用户列表', async () => {
        const response = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.list).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
    });
    it('GET /api/users - 分页参数', async () => {
        const response = await request(app)
            .get('/api/users?page=1&pageSize=5')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.pageSize).toBe(5);
    });
    it('GET /api/users - 搜索过滤', async () => {
        const response = await request(app)
            .get('/api/users?keyword=admin')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/users/:id - 获取用户详情', async () => {
        const response = await request(app)
            .get('/api/users/1')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.id).toBe(1);
    });
    it('GET /api/users/:id - 用户不存在', async () => {
        const response = await request(app)
            .get('/api/users/9999')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(404);
        expect(response.body.code).toBe(404);
    });
    it('POST /api/users - 创建用户', async () => {
        const response = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            username: `newuser_${Date.now()}`,
            password: 'password123',
            email: `new_${Date.now()}@example.com`,
            realName: '新用户',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.id).toBeDefined();
    });
    it('POST /api/users - 创建用户失败 - 缺少必填字段', async () => {
        const response = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            username: 'incomplete',
        })
            .expect(400);
        expect(response.body.code).toBe(400);
    });
    it('PUT /api/users/:id - 更新用户', async () => {
        const response = await request(app)
            .put('/api/users/2')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            realName: '更新后的名字',
            email: 'updated@example.com',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('DELETE /api/users/:id - 删除用户', async () => {
        const response = await request(app)
            .delete('/api/users/3')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('PUT /api/users/:id/password - 修改密码', async () => {
        const response = await request(app)
            .put('/api/users/2/password')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            oldPassword: 'oldpass123',
            newPassword: 'newpass123',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('未认证访问用户列表 - 应返回 401', async () => {
        const response = await request(app)
            .get('/api/users')
            .expect(401);
        expect(response.body.code).toBe(401);
    });
});
describe('角色管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/roles - 获取角色列表', async () => {
        const response = await request(app)
            .get('/api/roles')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(Array.isArray(response.body.data.list)).toBe(true);
    });
});
describe('应用管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/apps - 获取应用列表', async () => {
        const response = await request(app)
            .get('/api/apps')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(Array.isArray(response.body.data.list)).toBe(true);
    });
    it('POST /api/apps - 创建应用', async () => {
        const response = await request(app)
            .post('/api/apps')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `TestApp_${Date.now()}`,
            appKey: `test-key-${Date.now()}`,
            appType: 'java',
            description: '测试应用',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.id).toBeDefined();
    });
    it('PUT /api/apps/:id - 更新应用', async () => {
        const response = await request(app)
            .put('/api/apps/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            description: '更新后的描述',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('DELETE /api/apps/:id - 删除应用', async () => {
        const response = await request(app)
            .delete('/api/apps/2')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('部署管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/deploys - 获取部署列表', async () => {
        const response = await request(app)
            .get('/api/deploys')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/deploys - 创建部署任务', async () => {
        const response = await request(app)
            .post('/api/deploys')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `Deploy_${Date.now()}`,
            appId: 1,
            environment: 'test',
            version: '1.0.0',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/deploys/:id/execute - 执行部署', async () => {
        const response = await request(app)
            .post('/api/deploys/1/execute')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.status).toBeDefined();
    });
    it('POST /api/deploys/:id/rollback - 回滚部署', async () => {
        const response = await request(app)
            .post('/api/deploys/1/rollback')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('脚本管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/scripts - 获取脚本列表', async () => {
        const response = await request(app)
            .get('/api/scripts')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/scripts - 创建脚本', async () => {
        const response = await request(app)
            .post('/api/scripts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `Script_${Date.now()}`,
            scriptType: 'shell',
            content: 'echo "Hello World"',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/scripts/:id/execute - 执行脚本', async () => {
        const response = await request(app)
            .post('/api/scripts/1/execute')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            params: { arg: 'test' },
            targetHost: '192.168.1.1',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('配置管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/configs - 获取配置列表', async () => {
        const response = await request(app)
            .get('/api/configs')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/configs - 创建配置', async () => {
        const response = await request(app)
            .post('/api/configs')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            key: `config.key.${Date.now()}`,
            value: JSON.stringify({ test: true }),
            environment: 'test',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('监控管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/monitors - 获取监控列表', async () => {
        const response = await request(app)
            .get('/api/monitors')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/monitors - 创建监控', async () => {
        const response = await request(app)
            .post('/api/monitors')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `Monitor_${Date.now()}`,
            targetType: 'host',
            metricType: 'cpu',
            interval: 60,
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('日志管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/logs - 获取日志列表', async () => {
        const response = await request(app)
            .get('/api/logs')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/logs - 日志级别过滤', async () => {
        const response = await request(app)
            .get('/api/logs?level=error')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/logs/stats - 获取日志统计', async () => {
        const response = await request(app)
            .get('/api/logs/stats')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('故障管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/faults - 获取故障列表', async () => {
        const response = await request(app)
            .get('/api/faults')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/faults - 创建故障', async () => {
        const response = await request(app)
            .post('/api/faults')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            title: `Fault_${Date.now()}`,
            faultLevel: 'medium',
            description: '测试故障描述',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('PUT /api/faults/:id - 更新故障', async () => {
        const response = await request(app)
            .put('/api/faults/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            status: 'resolved',
            handleNote: '已处理',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('镜像管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/images - 获取镜像列表', async () => {
        const response = await request(app)
            .get('/api/images')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/images/repos - 获取镜像仓库列表', async () => {
        const response = await request(app)
            .get('/api/images/repos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/images/repos - 创建镜像仓库', async () => {
        const response = await request(app)
            .post('/api/images/repos')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `Repo_${Date.now()}`,
            registry: 'docker.io',
            repoType: 'public',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('备份管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/backups - 获取备份列表', async () => {
        const response = await request(app)
            .get('/api/backups')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/backups/databases - 获取数据库列表', async () => {
        const response = await request(app)
            .get('/api/backups/databases')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/backups/databases - 创建数据库', async () => {
        const response = await request(app)
            .post('/api/backups/databases')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `DB_${Date.now()}`,
            dbType: 'mysql',
            host: 'localhost',
            port: 3306,
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/backups - 执行备份', async () => {
        const response = await request(app)
            .post('/api/backups')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            databaseId: 1,
            backupType: 'full',
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('巡检管理 API', () => {
    let authToken;
    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        authToken = response.body.data.token;
    });
    it('GET /api/checks/tasks - 获取巡检任务列表', async () => {
        const response = await request(app)
            .get('/api/checks/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/checks/tasks - 创建巡检任务', async () => {
        const response = await request(app)
            .post('/api/checks/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            name: `Check_${Date.now()}`,
            taskType: 'health',
            config: JSON.stringify({ items: [] }),
        })
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('POST /api/checks/tasks/:id/execute - 执行巡检', async () => {
        const response = await request(app)
            .post('/api/checks/tasks/1/execute')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
    it('GET /api/checks/reports - 获取巡检报告列表', async () => {
        const response = await request(app)
            .get('/api/checks/reports')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(response.body.code).toBe(200);
    });
});
describe('错误处理', () => {
    it('404 - 路由不存在', async () => {
        const response = await request(app)
            .get('/api/nonexistent')
            .expect(404);
        expect(response.body.code).toBe(404);
    });
    it('500 - 服务器错误处理', async () => {
        // 模拟一个会触发错误的请求
        const response = await request(app)
            .post('/api/users')
            .set('Authorization', 'Bearer invalid-token')
            .send({})
            .expect(400);
        expect(response.body.code).toBe(400);
    });
});
//# sourceMappingURL=api.test.js.map