import { chromium } from 'playwright'

async function testAllPages() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Login
    console.log('1. Testing login...')
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' })
    await page.fill('input[placeholder*="用户名"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    console.log('   ✓ Login successful')

    const pages = [
      { name: 'Dashboard', path: '/dashboard', check: 'stat cards' },
      { name: 'User Management', path: '/users', check: 'table rows' },
      { name: 'Role Management', path: '/roles', check: 'table rows' },
      { name: 'App Management', path: '/apps', check: 'table rows' },
      { name: 'Deploy Management', path: '/deploys', check: 'table rows' },
      { name: 'Scripts', path: '/scripts', check: 'table rows' },
      { name: 'Configs', path: '/configs', check: 'table rows' },
      { name: 'Monitors', path: '/monitors', check: 'table rows' },
      { name: 'Logs', path: '/logs', check: 'table rows' },
      { name: 'Faults', path: '/faults', check: 'table rows' },
      { name: 'Images', path: '/images', check: 'table rows' },
      { name: 'Backups', path: '/backups', check: 'table rows' },
      { name: 'Checks', path: '/checks', check: 'table rows' },
    ]

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      console.log(`${i + 2}. Testing ${p.name}...`)
      await page.goto(`http://localhost:5174${p.path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)

      // Check for "获取失败" (fetch failed) error messages
      const errorText = await page.locator('text=/获取失败|请求失败|error/i').count()

      if (errorText > 0) {
        console.log(`   ✗ Error detected on ${p.name}`)
      } else {
        console.log(`   ✓ ${p.name} loaded without errors`)
      }
    }

    console.log('\n=== Test Complete ===')

  } catch (error) {
    console.error('Test Error:', error.message)
  } finally {
    await browser.close()
  }
}

testAllPages()