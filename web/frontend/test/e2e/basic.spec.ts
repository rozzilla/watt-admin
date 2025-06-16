import { test, expect } from '@playwright/test'

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
})
