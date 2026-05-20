// 用户服务单元测试
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDatabase, getDatabase, closeDatabase } from '../../app/lib/database';
import { hashPassword } from '../../app/lib/utils/auth';
describe('用户服务测试', () => {
    beforeAll(() => {
        initDatabase();
    });
    afterAll(() => {
        closeDatabase();
    });
    describe('用户数据操作', () => {
        let testUserId;
        beforeEach(() => {
            const db = getDatabase();
            // 清理测试数据
            db.prepare('DELETE FROM users WHERE username LIKE ?').run('test_%');
        });
        it('应该能够创建新用户', async () => {
            const db = getDatabase();
            const passwordHash = await hashPassword('TestPassword123');
            const result = db.prepare(`
        INSERT INTO users (username, password_hash, email)
        VALUES (?, ?, ?)
      `).run(`test_user_${Date.now()}`, passwordHash, `test_${Date.now()}@example.com`);
            expect(result.lastInsertRowid).toBeGreaterThan(0);
            testUserId = result.lastInsertRowid;
        });
        it('应该能够查询用户', async () => {
            const db = getDatabase();
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(1);
            if (user) {
                expect(user).toHaveProperty('username');
                expect(user).toHaveProperty('email');
            }
        });
        it('应该能够更新用户', async () => {
            const db = getDatabase();
            const newName = `updated_${Date.now()}`;
            db.prepare('UPDATE users SET real_name = ? WHERE id = 1').run(newName);
            const user = db.prepare('SELECT real_name FROM users WHERE id = 1').get();
            expect(user?.real_name).toBe(newName);
        });
        it('应该能够软删除用户', async () => {
            const db = getDatabase();
            const testId = Math.floor(Math.random() * 10000);
            const passwordHash = await hashPassword('TestPassword123');
            db.prepare(`
        INSERT INTO users (username, password_hash, email, is_deleted)
        VALUES (?, ?, ?, 0)
      `).run(`test_delete_${testId}`, passwordHash, `test_delete_${testId}@example.com`);
            const user = db.prepare(`
        SELECT id FROM users WHERE username = ?
      `).get(`test_delete_${testId}`);
            if (user) {
                db.prepare('UPDATE users SET is_deleted = 1 WHERE id = ?').run(user.id);
                const deletedUser = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(user.id);
                expect(deletedUser).toBeUndefined();
            }
        });
    });
    describe('用户角色关联', () => {
        it('应该能够分配角色给用户', async () => {
            const db = getDatabase();
            // 获取第一个用户和角色
            const user = db.prepare('SELECT id FROM users LIMIT 1').get();
            const role = db.prepare('SELECT id FROM roles LIMIT 1').get();
            if (user && role) {
                db.prepare(`
          INSERT OR REPLACE INTO user_roles (user_id, role_id)
          VALUES (?, ?)
        `).run(user.id, role.id);
                const userRoles = db.prepare(`
          SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?
        `).get(user.id, role.id);
                expect(userRoles).toBeTruthy();
            }
        });
    });
});
//# sourceMappingURL=user.service.test.js.map