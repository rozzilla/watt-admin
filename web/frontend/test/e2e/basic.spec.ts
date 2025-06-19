import { test, expect, Page } from '@playwright/test'

const closeScalarModal = async (page: Page) => await page.locator('[class*="_closeButton_"]').click()

test.describe('Basic E2E tests', () => {
  test('should load the main functionalities', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // home
    await expect(page).toHaveTitle(/Watt admin/)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByText('@platformatic/watt-admin')).toBeVisible()
    await expect(page.getByText('NodeJS Metrics')).toBeVisible()
    await expect(page.getByText('Services')).toBeVisible()
    await expect(page.getByText('backend')).toHaveCount(1)
    await expect(page.getByText('frontend')).toHaveCount(1)
    await expect(page.getByText('composer')).toHaveCount(2)

    // services
    await page.goto('/#/services')
    await page.getByText('Show Aggregated Metrics').waitFor()
    await expect(page.getByText('backend Memory')).toHaveCount(1)
    await expect(page.getByText('Aggregated Service Latency')).toHaveCount(1)
    await page.getByText('frontend').click()
    await expect(page.getByText('frontend CPU & ELU')).toHaveCount(1)
    await page.getByText('(Entrypoint)').click()
    await expect(page.getByText('composer Latency')).toHaveCount(1)
    await expect(page.getByText('composer Requests')).toHaveCount(1)
    await expect(page.getByText('Heap Used')).toHaveCount(1)
    await expect(page.getByText('Old Space')).toHaveCount(1)

    // logs
    await page.goto('/#/logs')
    await page.getByText('Select all services').waitFor()
    await page.getByText('Trace').click()
    await page.getByText('Server listening at').waitFor()
    await page.getByText('Raw').click()
    await page.getByText('Pretty').click()
    await page.getByText('Select all services').click()

    // back the the home
    await page.goto('/#/')
    await expect(page.getByText('RUNNING')).toHaveCount(1)
    const documentationButton = page.locator('[title="Documentation"]')
    await expect(documentationButton).toBeVisible()
    await expect(documentationButton).toBeEnabled()
    await documentationButton.click()
    await page.getByText('Restart').click()
    await page.getByText('Restarting...').waitFor()
  })

  test('should load the scalar associated features', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // frontend (no Open API)
    await page.getByText('Service Type: vite').click()
    await page.getByText('This service has no OpenAPI Schema').waitFor()
    await expect(page.getByText('Open it at http://127.0.0.1:5042/api/proxy')).toHaveCount(1)
    await closeScalarModal(page)

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
    await closeScalarModal(page)

    // backend (Open API)
    await page.getByText('Service Type: service').click()
    await page.getByText('/services/backend').waitFor()
    await expect(page.getByText('This is a service built on top of Platformatic')).toHaveCount(1)
    await closeScalarModal(page)
  })
})
