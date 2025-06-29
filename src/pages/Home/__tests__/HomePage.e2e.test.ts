import { test, expect } from '@playwright/test';

test.describe('HomePage E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    const csvData = 'id,civ,developer_id,date,spend\n1,monsters,8546229126757,191,333\n2,blobs,2793210285173,247,568\n3,humans,3523357868580,106,267';

    test.describe('Page Rendering', () => {
        test('should display page elements correctly', async ({ page }) => {
            await expect(
                page.getByRole('heading', {
                    name: /Загрузите csv файл и получите полную информацию о нём за сверхнизкое время/,
                })
            ).toBeVisible();

            const dropzone = page.getByTestId('dropzone');
            await expect(dropzone).toBeVisible();

            await expect(page.getByTestId('dropzone').getByRole('button', { name: 'Загрузить файл' })).toBeVisible();

            await expect(page.getByText('или перетащите сюда .csv файл')).toBeVisible();

            await expect(page.getByText('Здесь появятся хайлайты')).toBeVisible();

            await expect(page.getByRole('button', { name: 'Отправить' })).not.toBeVisible();
        });

        test('should be accessible via direct navigation', async ({ page }) => {
            await expect(page).toHaveURL('/');

            await page.getByRole('link', { name: /CSV Генератор/i }).click();
            await expect(page).toHaveURL('/generate');

            await page.getByRole('link', { name: /CSV Аналитик/i }).click();
            await expect(page).toHaveURL('/');

            await expect(
                page.getByRole('heading', {
                    name: /Загрузите csv файл и получите полную информацию о нём за сверхнизкое время/,
                })
            ).toBeVisible();
        });
    });

    test.describe('File Upload - Browse', () => {
        test('should upload CSV file via file browser', async ({ page }) => {
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'test.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            await expect(page.getByText('файл загружен!')).toBeVisible();
            await expect(page.getByText('test.csv')).toBeVisible();

            await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();

            await expect(page.getByTestId('clear-file-button')).toBeVisible();
        });

        test('should handle file validation for non-CSV files', async ({ page }) => {
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'test.txt',
                    mimeType: 'text/plain',
                    buffer: Buffer.from('This is not a CSV file'),
                },
            ]);

            await expect(page.getByText('Можно загружать только *.csv файлы')).toBeVisible();

            await expect(page.getByRole('button', { name: 'Отправить' })).not.toBeVisible();

            await expect(page.getByText('test.txt')).not.toBeVisible();
        });

        test('should trigger file browser on upload button click', async ({ page }) => {
            const uploadButton = page.getByTestId('dropzone').getByRole('button', { name: 'Загрузить файл' });

            const fileChooserPromise = page.waitForEvent('filechooser');
            await uploadButton.click();

            const fileChooser = await fileChooserPromise;
            expect(fileChooser.isMultiple()).toBe(false);
        });
    });

    test.describe('File Upload - Drag & Drop', () => {
        test('should handle drag enter and leave states', async ({ page }) => {
            const _dropzone = page.getByTestId('dropzone');

            const csvDataTransfer = await page.evaluateHandle(() => {
                const dt = new DataTransfer();
                const file = new File(['name,age\nJohn,25'], 'test.csv', { type: 'text/csv' });
                dt.items.add(file);
                return dt;
            });

            await _dropzone.dispatchEvent('dragenter', { dataTransfer: csvDataTransfer });
            await expect(page.getByText('Отпустите для загрузки')).toBeVisible();

            await _dropzone.dispatchEvent('dragleave');
            await expect(page.getByText('или перетащите сюда .csv файл')).toBeVisible();
        });

        test('should upload CSV file via drag and drop', async ({ page }) => {
            await page.evaluate((csvData) => {
                const dropzone = document.querySelector('[data-testid="dropzone"]');
                const file = new File(csvData.split('\n'), 'dropped.csv', { type: 'text/csv' });

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                const dropEvent = new DragEvent('drop', {
                    dataTransfer: dataTransfer,
                    bubbles: true,
                    cancelable: true,
                });

                dropzone?.dispatchEvent(dropEvent);
            }, csvData);

            await expect(page.getByText('файл загружен!')).toBeVisible();
            await expect(page.getByText('dropped.csv')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
        });

        test('should reject non-CSV files via drag and drop', async ({ page }) => {
            await page.evaluate(() => {
                const dropzone = document.querySelector('[data-testid="dropzone"]');
                const file = new File(['not a csv'], 'test.txt', { type: 'text/plain' });

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                const dropEvent = new DragEvent('drop', {
                    dataTransfer: dataTransfer,
                    bubbles: true,
                    cancelable: true,
                });

                dropzone?.dispatchEvent(dropEvent);
            });

            await expect(page.getByText('Можно загружать только *.csv файлы')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Отправить' })).not.toBeVisible();
        });
    });

    test.describe('CSV Analysis Flow', () => {
        test('should successfully analyze CSV file', async ({ page }) => {
            await page.route('**/aggregate?rows=10000', async (route) => {
                const mockData = {
                    total_spend_galactic: 15000,
                    rows_affected: 1000,
                    average_spend_galactic: 150,
                    less_spent_at: 106,
                    big_spent_at: 214,
                    less_spent_value: 267,
                    big_spent_value: 731,
                    big_spent_civ: 'monsters',
                    less_spent_civ: 'humans',
                };

                const mockResponse = JSON.stringify(mockData) + '\n';

                await new Promise((resolve) => setTimeout(resolve, 200));
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: mockResponse,
                });
            });

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'analysis-test.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            const sendButton = page.getByRole('button', { name: 'Отправить' });
            await expect(sendButton).toBeVisible();
            await sendButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(page.getByText('идёт парсинг файла')).toBeVisible();

            await expect(sendButton).not.toBeVisible();

            await expect(page.getByText('готово!')).toBeVisible({ timeout: 10000 });

            await page.waitForTimeout(1000);

            await expect(page.getByText('15000', { exact: true })).toBeVisible();
            await expect(page.getByText('Общие расходы')).toBeVisible();
            await expect(page.getByText('150', { exact: true })).toBeVisible();
            await expect(page.getByText('Средние расходы')).toBeVisible();
            await expect(page.getByText('106', { exact: true })).toBeVisible();
            await expect(page.getByText('День min расходов')).toBeVisible();
            await expect(page.getByText('214', { exact: true })).toBeVisible();
            await expect(page.getByText('День max расходов')).toBeVisible();
            await expect(page.getByText('267', { exact: true })).toBeVisible();
            await expect(page.getByText('Min расходы в день')).toBeVisible();
            await expect(page.getByText('731', { exact: true })).toBeVisible();
            await expect(page.getByText('Max расходы в день')).toBeVisible();
            await expect(page.getByText('monsters', { exact: true })).toBeVisible();
            await expect(page.getByText('Цивилизация max расходов')).toBeVisible();
            await expect(page.getByText('humans', { exact: true })).toBeVisible();
            await expect(page.getByText('Цивилизация min расходов')).toBeVisible();

            await expect(page.getByText('Здесь появятся хайлайты')).not.toBeVisible();
        });

        test('should handle analysis errors gracefully', async ({ page }) => {
            await page.route('**/aggregate?rows=10000', async (route) => {
                await route.fulfill({
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Failed to parse CSV file' }),
                });
            });

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'bad-file.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from('invalid,csv,content'),
                },
            ]);

            await page.getByRole('button', { name: 'Отправить' }).click();

            await expect(page.getByText('Неизвестная ошибка парсинга :(')).toBeVisible();

            await expect(page.getByText('Здесь появятся хайлайты')).toBeVisible();

            await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();
        });

        test('should handle network errors', async ({ page }) => {
            await page.route('**/aggregate?rows=10000', async (route) => {
                await route.abort();
            });

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'network-test.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from('name,value\ntest,123'),
                },
            ]);

            await page.getByRole('button', { name: 'Отправить' }).click();

            await expect(page.getByText('Неизвестная ошибка парсинга :(')).toBeVisible();
        });
    });

    test.describe('Clear Functionality', () => {
        test('should clear file and reset state', async ({ page }) => {
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'clear-test.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            await expect(page.getByText('clear-test.csv')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Отправить' })).toBeVisible();

            const clearButton = page.getByTestId('clear-file-button');
            await clearButton.click();

            await expect(page.getByTestId('dropzone').getByRole('button', { name: 'Загрузить файл' })).toBeVisible();
            await expect(page.getByText('или перетащите сюда .csv файл')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Отправить' })).not.toBeVisible();
            await expect(page.getByText('clear-test.csv')).not.toBeVisible();
            await expect(page.getByText('Здесь появятся хайлайты')).toBeVisible();
        });

        test('should clear highlights after successful analysis', async ({ page }) => {
            await page.route('**/aggregate?rows=10000', async (route) => {
                const mockData = {
                    total_spend_galactic: 5000,
                    rows_affected: 500,
                    average_spend_galactic: 100,
                    less_spent_at: 50,
                    big_spent_at: 300,
                    less_spent_value: 25,
                    big_spent_value: 500,
                    big_spent_civ: 'aliens',
                    less_spent_civ: 'robots',
                };

                const mockResponse = JSON.stringify(mockData) + '\n';

                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: mockResponse,
                });
            });

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'highlights-clear.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            await page.getByRole('button', { name: 'Отправить' }).click();

            await expect(page.getByText('готово!')).toBeVisible();
            await expect(page.getByText('5000', { exact: true })).toBeVisible();
            await expect(page.getByText('aliens', { exact: true })).toBeVisible();

            await page.getByTestId('clear-file-button').click();

            await expect(page.getByText('Здесь появятся хайлайты')).toBeVisible();
            await expect(page.getByText('5000', { exact: true })).not.toBeVisible();
            await expect(page.getByText('aliens', { exact: true })).not.toBeVisible();
            await expect(page.getByTestId('dropzone').getByRole('button', { name: 'Загрузить файл' })).toBeVisible();
        });
    });

    test.describe('User Experience', () => {
        test('should prevent file operations during processing', async ({ page }) => {
            await page.route('**/aggregate?rows=10000', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const mockResponse = JSON.stringify({ rows_affected: 100 }) + '\n';

                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: mockResponse,
                });
            });

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'slow-process.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            await page.getByRole('button', { name: 'Отправить' }).click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();

            const dropzone = page.getByTestId('dropzone');
            await dropzone.click();

            await expect(page.getByText('идёт парсинг файла')).toBeVisible();

            await expect(page.getByText('готово!')).toBeVisible({ timeout: 3000 });
        });

        test('should show appropriate messages for different states', async ({ page }) => {
            const statusElement = page.getByTestId('dropzone-status');

            await expect(statusElement).toContainText('или перетащите сюда .csv файл');

            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles([
                {
                    name: 'status-test.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvData),
                },
            ]);

            await expect(statusElement).toContainText('файл загружен!');

            await page.route('**/aggregate?rows=10000', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const mockResponse = JSON.stringify({ rows_affected: 250 }) + '\n';

                await route.fulfill({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: mockResponse,
                });
            });

            await page.getByRole('button', { name: 'Отправить' }).click();
            await expect(statusElement).toContainText('идёт парсинг файла');

            await expect(statusElement).toContainText('готово!');
        });
    });

    test.describe('Accessibility', () => {
        test('should be keyboard accessible', async ({ page }) => {
            await page.getByTestId('dropzone').focus();
            await expect(page.getByTestId('dropzone')).toBeFocused();

            const dropzone = page.getByTestId('dropzone');
            await expect(dropzone).toHaveAttribute('role', 'button');
            await expect(dropzone).toHaveAttribute('tabIndex', '0');
        });

        test('should have proper ARIA attributes', async ({ page }) => {
            const dropzone = page.getByTestId('dropzone');

            await expect(dropzone).toHaveAttribute('role', 'button');

            await expect(dropzone).toHaveAttribute('tabIndex', '0');
        });
    });
});
