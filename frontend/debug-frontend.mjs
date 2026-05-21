import { chromium } from 'playwright'

async function debug() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Login
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle' })
    await page.fill('input[placeholder*="用户名"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Go to users page
    await page.goto('http://localhost:5174/users', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Take screenshot
    await page.screenshot({ path: '/tmp/users-page.png', fullPage: true })
    console.log('Screenshot saved: /tmp/users-page.png')

    // Check table content
    const tableRows = await page.locator('.ant-table-tbody tr').count()
    console.log('Table rows:', tableRows)

    // Get table data
    const firstRow = await page.locator('.ant-table-tbody tr:first-child').textContent().catch(() => 'No rows')
    console.log('First row:', firstRow)

    // Check for any error class
    const hasError = await page.locator('.ant-table-placeholder').count()
    console.log('Has placeholder/error:', hasError)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await browser.close()
  }
}

debug()