import { test, expect, Page } from '@playwright/test'

const sendScalarReq = async (page: Page) => await page.locator('button.scalar-button').filter({ hasText: 'send' }).click()

const closeScalarModal = async (page: Page) => {
  await page.keyboard.press('Escape')
  await page.locator('[class*="_closeButton_"]').click()
}

test.describe('Basic E2E tests', () => {
  test('should load the main functionalities', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // home
    await expect(page).toHaveTitle(/Watt admin/)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByText('@platformatic/watt-admin')).toBeVisible()
    await expect(page.getByText('Metrics')).toBeVisible()
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

    // frontend (no Open API)
    await page.goto('/#/')
    await page.getByText('Service Type: vite').click()
    await page.getByText('This service has no OpenAPI Schema').waitFor()
    await expect(page.getByText('Open it at http://127.0.0.1:5042/api/proxy')).toHaveCount(1)
    await closeScalarModal(page)

    // composer (Scalar)
    await page.getByText('(Application Entrypoint)').click()
    await page.getByText('Platformatic Composer').waitFor()
    await page
      .locator('[id="tag/default/get/api/runtimes"]')
      .locator('.show-api-client-button')
      .click()
    await sendScalarReq(page)
    await page.getByText('200 OK').waitFor()
    await closeScalarModal(page)

    // backend (Scalar)
    await page.getByText('Service Type: service').click()
    await page.getByText('This is a service built on top of Platformatic').waitFor()
    await page
      .locator('[id="tag/default/get/runtimes"]')
      .locator('.show-api-client-button')
      .click()
    await sendScalarReq(page)
    await page.getByText('200 OK').waitFor()
    await closeScalarModal(page)

    // back the the home and restart
    await page.goto('/#/')
    await expect(page.getByText('RUNNING')).toHaveCount(1)
    const documentationButton = page.locator('[title="Documentation"]')
    await expect(documentationButton).toBeVisible()
    await expect(documentationButton).toBeEnabled()
    await documentationButton.click()
    await page.getByText('Restart').click()
    await page.getByText('Restarting...').waitFor()
  })
})
