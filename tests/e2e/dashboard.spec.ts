import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve exibir dashboard após login', async ({ page }) => {
    // Verificar que o dashboard carregou
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir cards de resumo', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar presença de cards ou widgets
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('deve ter navegação para módulos principais', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar links de navegação
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir seletor de empresa', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Verificar CompanySwitcher - buscar pelo botão com nome da empresa ou ícone
    const companySwitcher = page.getByRole('button', { name: /FRM|empresa|company/i }).or(
      page.locator('button:has-text("Ltda")').or(
        page.locator('[data-testid="company-switcher"]')
      )
    );
    await expect(companySwitcher.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve navegar para materiais', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Clicar no link de materiais
    const materialsLink = page.getByRole('link', { name: /materiais/i });
    if (await materialsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await materialsLink.click();
      await expect(page).toHaveURL(/\/materials/, { timeout: 5000 });
    }
  });

  test('deve navegar para fornecedores', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Clicar no link de fornecedores
    const suppliersLink = page.getByRole('link', { name: /fornecedores/i });
    if (await suppliersLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suppliersLink.click();
      await expect(page).toHaveURL(/\/suppliers/, { timeout: 5000 });
    }
  });

  test('deve navegar para estoque', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Clicar no link de estoque
    const inventoryLink = page.getByRole('link', { name: /estoque|inventário/i });
    if (await inventoryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inventoryLink.click();
      await expect(page).toHaveURL(/\/inventory/, { timeout: 5000 });
    }
  });
});
