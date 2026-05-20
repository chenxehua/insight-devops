import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { initDatabase, closeDatabase, getOne, getAll, runQuery } from '../../app/lib/database'

describe('用户服务测试', () => {
  beforeAll(async () => {
    await initDatabase()
  })
  
  afterAll(() => {
    closeDatabase()
  })
  
  beforeEach(() => {
    // 清理测试数据
    runQuery("DELETE FROM users WHERE username LIKE 'test_%'", [])
  })
  
  describe('用户数据操作', () => {
    it('应该能够创建新用户', () => {
      const uniqueEmail = `test_${Date.now()}@example.com`
      runQuery(
        "INSERT INTO users (username, password_hash, email, real_name) VALUES (?, ?, ?, ?)",
        ['test_user1', 'hash123', uniqueEmail, '测试用户1']
      )
      
      const user = getOne('SELECT * FROM users WHERE username = ?', ['test_user1'])
      expect(user).not.toBeNull()
      expect(user.username).toBe('test_user1')
      expect(user.email).toBe(uniqueEmail)
    })
    
    it('应该能够查询用户', () => {
      const uniqueEmail = `test_query_${Date.now()}@example.com`
      runQuery(
        "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
        ['test_user2', 'hash456', uniqueEmail]
      )
      
      const user = getOne('SELECT * FROM users WHERE username = ?', ['test_user2'])
      expect(user).not.toBeNull()
      expect(user.email).toBe(uniqueEmail)
    })
    
    it('应该能够更新用户', () => {
      const uniqueEmail = `test_update_${Date.now()}@example.com`
      runQuery(
        "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
        ['test_user3', 'hash789', uniqueEmail]
      )
      
      runQuery(
        "UPDATE users SET real_name = ?, email = ? WHERE username = ?",
        ['更新后的名字', 'updated@example.com', 'test_user3']
      )
      
      const user = getOne('SELECT * FROM users WHERE username = ?', ['test_user3'])
      expect(user).not.toBeNull()
      expect(user.real_name).toBe('更新后的名字')
      expect(user.email).toBe('updated@example.com')
    })
    
    it('应该能够软删除用户', () => {
      const uniqueEmail = `test_delete_${Date.now()}@example.com`
      runQuery(
        "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
        ['test_user4', 'hash', uniqueEmail]
      )
      
      runQuery("UPDATE users SET is_deleted = 1 WHERE username = ?", ['test_user4'])
      
      const user = getOne('SELECT * FROM users WHERE username = ? AND is_deleted = 0', ['test_user4'])
      expect(user).toBeNull()
    })
  })
  
  describe('用户列表查询', () => {
    it('应该能够获取用户列表', () => {
      const users = getAll('SELECT id, username, email, status FROM users WHERE is_deleted = 0', [])
      expect(Array.isArray(users)).toBe(true)
    })
    
    it('应该能够按关键字搜索用户', () => {
      const uniqueEmail = `search_test_${Date.now()}@example.com`
      const uniqueUsername = `search_${Date.now()}`
      runQuery(
        "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
        [uniqueUsername, 'hash', uniqueEmail]
      )
      
      const users = getAll(
        'SELECT * FROM users WHERE username LIKE ? AND is_deleted = 0',
        ['%search_%']
      )
      expect(users.length).toBeGreaterThan(0)
    })
  })
})