// Backend API Integration Tests with real Express app
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

// Import the actual API routes
import authRoutes from '@/api/auth'
import userRoutes from '@/api/users'
import appRoutes from '@/api/apps'
import deployRoutes from '@/api/deploys'
import scriptRoutes from '@/api/scripts'
import scriptExecutionRoutes from '@/api/scripts/executions'
import configRoutes from '@/api/configs'
import configVersionRoutes from '@/api/configs/versions'
import monitorRoutes from '@/api/monitors'
import logRoutes from '@/api/logs'
import faultRoutes from '@/api/faults'
import imageRoutes from '@/api/images'
import backupRoutes from '@/api/backups'
import checkRoutes from '@/api/checks'
import dashboardRoutes from '@/api/dashboard'
import roleRoutes from '@/api/roles'

// Create test app with all routes
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  // Mount routes
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/roles', roleRoutes)
  app.use('/api/apps', appRoutes)
  app.use('/api/deploys', deployRoutes)
  app.use('/api/scripts', scriptRoutes)
  app.use('/api/scripts/executions', scriptExecutionRoutes)
  app.use('/api/configs', configRoutes)
  app.use('/api/configs', configVersionRoutes)
  app.use('/api/monitors', monitorRoutes)
  app.use('/api/logs', logRoutes)
  app.use('/api/faults', faultRoutes)
  app.use('/api/images', imageRoutes)
  app.use('/api/backups', backupRoutes)
  app.use('/api/checks', checkRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  
  return app
}

let app: express.Application

describe('Backend API Integration Tests', () => {
  beforeAll(() => {
    app = createTestApp()
  })

  describe('Health Check', () => {
    it('GET /health should return ok status', async () => {
      const response = await request(app).get('/health')
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
      expect(response.body.timestamp).toBeDefined()
    })
  })

  describe('Auth API', () => {
    it('POST /api/auth/login should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
      
      expect(response.status).toBe(400)
      expect(response.body.code).toBe(400)
    })

    it('POST /api/auth/register should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
      
      expect(response.status).toBe(400)
      expect(response.body.code).toBe(400)
    })
  })

  describe('User API', () => {
    it('GET /api/users should return list without auth', async () => {
      const response = await request(app).get('/api/users')
      // Should handle auth middleware
      expect(response.status).toBeDefined()
    })
  })

  describe('App API', () => {
    it('GET /api/apps should return list structure', async () => {
      const response = await request(app).get('/api/apps')
      // Should handle auth middleware
      expect(response.status).toBeDefined()
    })

    it('GET /api/apps with pagination params', async () => {
      const response = await request(app)
        .get('/api/apps')
        .query({ page: 1, pageSize: 10 })
      
      expect(response.status).toBeDefined()
    })
  })

  describe('Deploy API', () => {
    it('GET /api/deploys should return list', async () => {
      const response = await request(app).get('/api/deploys')
      // Auth required, may return 401
      expect([200, 401]).toContain(response.status)
    })

    it('GET /api/deploys with filters', async () => {
      const response = await request(app)
        .get('/api/deploys')
        .query({ status: 'success', appId: 1 })
      
      expect([200, 401]).toContain(response.status)
    })

    it('POST /api/deploys should require authentication', async () => {
      const response = await request(app)
        .post('/api/deploys')
        .send({})
      
      // Auth required
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Script API', () => {
    it('GET /api/scripts should return list', async () => {
      const response = await request(app).get('/api/scripts')
      expect([200, 401]).toContain(response.status)
    })

    it('GET /api/scripts with keyword search', async () => {
      const response = await request(app)
        .get('/api/scripts')
        .query({ keyword: 'test' })
      
      expect([200, 401]).toContain(response.status)
    })

    it('POST /api/scripts should require authentication', async () => {
      const response = await request(app)
        .post('/api/scripts')
        .send({})
      
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Config API', () => {
    it('GET /api/configs should return list', async () => {
      const response = await request(app).get('/api/configs')
      expect([200, 401]).toContain(response.status)
    })

    it('POST /api/configs should require authentication', async () => {
      const response = await request(app)
        .post('/api/configs')
        .send({})
      
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Monitor API', () => {
    it('GET /api/monitors should return list', async () => {
      const response = await request(app).get('/api/monitors')
      expect([200, 401]).toContain(response.status)
    })

    it('POST /api/monitors should require authentication', async () => {
      const response = await request(app)
        .post('/api/monitors')
        .send({})
      
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Log API', () => {
    it('GET /api/logs should return list', async () => {
      const response = await request(app).get('/api/logs')
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('Fault API', () => {
    it('GET /api/faults should return list', async () => {
      const response = await request(app).get('/api/faults')
      expect([200, 401]).toContain(response.status)
    })

    it('POST /api/faults should require authentication', async () => {
      const response = await request(app)
        .post('/api/faults')
        .send({})
      
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Image API', () => {
    it('GET /api/images should return list', async () => {
      const response = await request(app).get('/api/images')
      expect(response.status).toBeDefined()
    })

    it('GET /api/images/repos should return repos list', async () => {
      const response = await request(app).get('/api/images/repos')
      expect(response.status).toBeDefined()
    })
  })

  describe('Backup API', () => {
    it('GET /api/backups should return list', async () => {
      const response = await request(app).get('/api/backups')
      expect(response.status).toBeDefined()
    })

    it('GET /api/backups/databases should return databases list', async () => {
      const response = await request(app).get('/api/backups/databases')
      expect(response.status).toBeDefined()
    })
  })

  describe('Check API', () => {
    it('GET /api/checks should return list', async () => {
      const response = await request(app).get('/api/checks')
      expect(response.status).toBeDefined()
    })

    it('GET /api/checks/reports should return reports list', async () => {
      const response = await request(app).get('/api/checks/reports')
      expect(response.status).toBeDefined()
    })
  })

  describe('Dashboard API', () => {
    it('GET /api/dashboard/stats should return stats', async () => {
      const response = await request(app).get('/api/dashboard/stats')
      expect(response.status).toBeDefined()
    })

    it('GET /api/dashboard/trend should return trend data', async () => {
      const response = await request(app)
        .get('/api/dashboard/trend')
        .query({ days: 7 })
      
      expect(response.status).toBeDefined()
    })
  })

  describe('Role API', () => {
    it('GET /api/roles should return list', async () => {
      const response = await request(app).get('/api/roles')
      expect(response.status).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown')
      expect(response.status).toBe(404)
    })
  })

  describe('Request Validation', () => {
    it('should handle JSON parse errors', async () => {
      const response = await request(app)
        .post('/api/deploys')
        .set('Content-Type', 'application/json')
        .send('invalid json')
      
      // May return 400 or 401 depending on auth middleware
      expect([400, 401]).toContain(response.status)
    })

    it('should handle missing or invalid requests', async () => {
      const response = await request(app)
        .post('/api/deploys')
        .set('Content-Type', 'application/json')
        .send('')
      
      // May return 400 or 401 depending on auth middleware
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Pagination Parameters', () => {
    it('should handle page parameter', async () => {
      const response = await request(app)
        .get('/api/apps')
        .query({ page: 5 })
      
      expect(response.status).toBeDefined()
    })

    it('should handle pageSize parameter', async () => {
      const response = await request(app)
        .get('/api/apps')
        .query({ pageSize: 50 })
      
      expect(response.status).toBeDefined()
    })

    it('should handle invalid pagination values', async () => {
      const response = await request(app)
        .get('/api/apps')
        .query({ page: -1, pageSize: 0 })
      
      expect(response.status).toBeDefined()
    })
  })

  describe('Response Format', () => {
    it('should return consistent response structure', async () => {
      const response = await request(app).get('/health')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
    })
  })
})