import { test, expect } from '@playwright/test';

test.describe('Estoque (EST10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve listar estoques', async ({ page }) => {
    await page.goto('/inventory');
    
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'Material' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Quantidade' })).toBeVisible();
  });

  test('deve filtrar por tipo de estoque', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Selecionar filtro de tipo
    const typeFilter = page.getByRole('combobox').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });
});
