import { test, expect } from '@playwright/test';

test.describe('Fornecedores (CP11)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve listar fornecedores', async ({ page }) => {
    await page.goto('/suppliers');
    
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'Código' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Razão Social' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CNPJ' })).toBeVisible();
  });

  test('deve buscar fornecedor por nome', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    await page.getByPlaceholder('Buscar').fill('Aço');
    await page.waitForTimeout(500);
    
    const rows = page.getByRole('row');
    await expect(rows.filter({ hasText: 'Aço' })).toHaveCount(1);
  });

  test('deve navegar para criar novo fornecedor', async ({ page }) => {
    await page.goto('/suppliers');
    
    await page.getByRole('link', { name: 'Novo Fornecedor' }).click();
    
    await expect(page).toHaveURL(/\/suppliers\/new/);
  });
});
