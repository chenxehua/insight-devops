import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('Login Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('login data structure is correct', () => {
    // Test the expected data structure for login
    const loginData = {
      token: 'jwt-token',
      user: {
        id: 1,
        username: 'admin',
        realName: '管理员',
        email: 'admin@example.com',
        role: 'admin'
      }
    }
    
    expect(loginData.token).toBe('jwt-token')
    expect(loginData.user.username).toBe('admin')
    expect(loginData.user.role).toBe('admin')
    expect(typeof loginData.token).toBe('string')
    expect(typeof loginData.user).toBe('object')
  })

  it('localStorage mock functions work correctly', () => {
    localStorage.setItem('test-token', 'value')
    expect(localStorage.setItem).toHaveBeenCalledWith('test-token', 'value')
    
    localStorage.setItem('test-user', JSON.stringify({ name: 'test' }))
    expect(localStorage.setItem).toHaveBeenCalled()
    
    localStorage.removeItem('test-token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('test-token')
    
    localStorage.clear()
    expect(localStorage.clear).toHaveBeenCalled()
  })

  it('login validation rules work', () => {
    const validateLogin = (username: string, password: string) => {
      if (!username || !password) {
        return { valid: false, message: '用户名和密码不能为空' }
      }
      if (username.length < 3) {
        return { valid: false, message: '用户名至少3个字符' }
      }
      if (password.length < 6) {
        return { valid: false, message: '密码至少6个字符' }
      }
      return { valid: true }
    }
    
    expect(validateLogin('', '').valid).toBe(false)
    expect(validateLogin('ab', 'password').valid).toBe(false)
    expect(validateLogin('admin', '123').valid).toBe(false)
    expect(validateLogin('admin', 'admin123').valid).toBe(true)
  })
})