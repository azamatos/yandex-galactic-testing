import { test, expect } from '@playwright/test';

test.describe('GeneratePage E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/generate');
    });

    const csvData = 'id,civ,developer_id,date,spend\n1,monsters,8546229126757,191,333\n2,blobs,2793210285173,247,568\n3,humans,3523357868580,106,267';

    test.describe('Page Rendering', () => {
        test('should display page elements correctly', async ({ page }) => {
            await expect(
                page.getByRole('heading', {
                    name: 'Сгенерируйте готовый csv-файл нажатием одной кнопки',
                })
            ).toBeVisible();

            const generateButton = page.getByTestId('generate-button');

            await expect(generateButton).toBeVisible();
            await expect(generateButton).toBeEnabled();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible();
            await expect(page.getByText(/Произошла ошибка/)).not.toBeVisible();
        });

        test('should be accessible via navigation', async ({ page }) => {
            await page.goto('/');

            await page.getByRole('link', { name: /CSV Генератор/i }).click();

            await expect(page).toHaveURL('/generate');
            await expect(
                page.getByRole('heading', {
                    name: 'Сгенерируйте готовый csv-файл нажатием одной кнопки',
                })
            ).toBeVisible();
        });
    });

    test.describe('CSV Generation Flow', () => {
        test('should successfully generate and download CSV file', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 100));

                
                const buffer = Buffer.from(csvData, 'utf-8');

                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: buffer,
                });
            });

            const downloadPromise = page.waitForEvent('download');

            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(generateButton).toBeDisabled();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(generateButton).toBeEnabled();
            await expect(generateButton).toHaveText('Начать генерацию');
        });

        test('should show loading state during generation', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(generateButton).toBeDisabled();

            await expect(generateButton).not.toHaveText('Начать генерацию');

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();
            await expect(generateButton).toBeEnabled();
        });

        test('should handle API errors gracefully', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'Internal server error during CSV generation',
                    }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText(/Произошла ошибка: Internal server error during CSV generation/)).toBeVisible();

            await expect(generateButton).toBeEnabled();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible();
        });

        test('should handle network errors', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Service Unavailable' }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText('Неизвестная ошибка при попытке сгенерировать отчёт')).toBeVisible();

            await expect(generateButton).toBeEnabled();
        });

        test('should handle malformed error responses', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'Bad request',
                    }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText('Неизвестная ошибка при попытке сгенерировать отчёт')).toBeVisible();
        });
    });

    test.describe('User Experience', () => {
        test('should clear success message after timeout', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'test,data\n1,2',
                });
            });

            const downloadPromise = page.waitForEvent('download');

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await downloadPromise;
            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible({ timeout: 3000 });
        });

        test('should allow multiple generations', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'test\n1',
                });
            });

            const generateButton = page.getByTestId('generate-button');

            const download1Promise = page.waitForEvent('download');
            await generateButton.click();
            await download1Promise;
            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(generateButton).toBeEnabled();

            const download2Promise = page.waitForEvent('download');
            await generateButton.click();

            await download2Promise;

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();
        });

        test('should prevent multiple simultaneous requests', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'test\n1',
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(generateButton).toBeDisabled();

            await generateButton.click({ force: true });

            await expect(generateButton).toBeDisabled();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible({ timeout: 3000 });
        });
    });

    test.describe('File Download Functionality', () => {
        test('should download file with correct filename from Content-Disposition', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const downloadPromise = page.waitForEvent('download');
            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');
        });

        test('should use default filename when Content-Disposition is missing', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const downloadPromise = page.waitForEvent('download');
            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');
        });
    });
});
