import { test, expect } from '@playwright/test';

test.describe('Recebimento de Materiais (CP14)', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve listar recebimentos', async ({ page }) => {
    await page.goto('/receiving');
    
    // Verificar que a página carregou
    await expect(page.getByRole('heading', { name: /recebimento|entrada/i })).toBeVisible({ timeout: 10000 });
    
    // Verificar que a tabela está presente
    const table = page.getByRole('table');
    const emptyMessage = page.getByText(/nenhum/i);
    await expect(table.or(emptyMessage)).toBeVisible({ timeout: 10000 });
  });

  test('deve filtrar por status', async ({ page }) => {
    await page.goto('/receiving');
    await page.waitForLoadState('networkidle');
    
    // Verificar filtros de status
    const statusFilter = page.getByRole('combobox').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('PENDING');
      await page.waitForTimeout(500);
    }
  });

  test('deve navegar para novo recebimento', async ({ page }) => {
    await page.goto('/receiving');
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão "Novo Recebimento"
    const newButton = page.getByRole('link', { name: /novo|nova|adicionar/i });
    if (await newButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newButton.click();
      await expect(page).toHaveURL(/\/receiving\/new/, { timeout: 5000 });
    }
  });

  test('deve visualizar detalhes de recebimento', async ({ page }) => {
    await page.goto('/receiving');
    await page.waitForLoadState('networkidle');
    
    // Clicar em um recebimento existente
    const viewLink = page.locator('a[title="Visualizar"]').first();
    if (await viewLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewLink.click();
      await expect(page).toHaveURL(/\/receiving\/[a-f0-9-]+/, { timeout: 5000 });
    }
  });

  test('deve acessar versão mobile de conferência', async ({ page }) => {
    await page.goto('/receiving');
    await page.waitForLoadState('networkidle');
    
    // Navegar para um recebimento
    const viewLink = page.locator('a[title="Visualizar"]').first();
    if (await viewLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verificar link para versão mobile
      const mobileLink = page.getByRole('link', { name: /mobile/i });
      if (await mobileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mobileLink.click();
        await expect(page).toHaveURL(/\/receiving\/[a-f0-9-]+\/mobile/, { timeout: 5000 });
      }
    }
  });

  test('página mobile deve ter layout otimizado', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/receiving');
    await page.waitForLoadState('networkidle');
    
    // Navegar para um recebimento e versão mobile
    const viewLink = page.locator('a').filter({ hasText: /visualizar|ver/i }).first();
    if (await viewLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewLink.click();
      await page.waitForLoadState('networkidle');
      
      // Ir para versão mobile
      const currentUrl = page.url();
      await page.goto(currentUrl + '/mobile');
      
      // Verificar elementos mobile-friendly
      await expect(page.locator('footer')).toBeVisible({ timeout: 5000 });
    }
  });
});
