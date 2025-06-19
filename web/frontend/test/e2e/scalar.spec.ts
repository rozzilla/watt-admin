import { test, expect, Page } from '@playwright/test'

const closeModal = async (page: Page) => await page.locator('[class*="_closeButton_"]').click()

test.describe('Scalar E2E tests', () => {
  test('should load the scalar associated features', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // frontend (no Open API)
    await page.getByText('Service Type: vite').click()
    await page.getByText('This service has no OpenAPI Schema').waitFor()
    await expect(page.getByText('Open it at http://127.0.0.1:5042/api/proxy')).toHaveCount(1)
    await closeModal(page)

    // composer (Open API)
    await page.getByText('(Application Entrypoint)').click()
    await page.getByText('Platformatic Composer').waitFor()
    await page
      .locator('[id="tag/default/get/api/runtimes"]')
      .locator('.show-api-client-button')
      .click()
    await page.locator('button.scalar-button').filter({ hasText: 'send' }).click()
    await page.locator('div.scalar-app-layout.scalar-client').getByText('"packageName": "@platformatic/watt-admin"').waitFor()
    await page.keyboard.press('Escape')
    await closeModal(page)

    // backend (Open API)
    await page.getByText('Service Type: service').click()
    await page.getByText('/services/backend').waitFor()
    await expect(page.getByText('This is a service built on top of Platformatic')).toHaveCount(1)
    await closeModal(page)
  })
})
