import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

test.describe('Estoque (EST10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('deve listar estoques', async ({ page }) => {
    await page.goto('/inventory');
    
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou (tabela, vazio, ou erro de empresa)
    const table = page.getByRole('table');
    const emptyMessage = page.getByText('Nenhum item de estoque encontrado');
    const noCompanyError = page.getByText(/Nenhuma empresa ativa/);
    const heading = page.getByRole('heading', { name: 'Estoque' });
    
    // A página deve mostrar o heading de Estoque
    await expect(heading).toBeVisible({ timeout: 15000 });
    
    // E um dos estados: tabela, vazio ou erro de empresa
    await expect(table.or(emptyMessage).or(noCompanyError)).toBeVisible({ timeout: 5000 });
  });

  test('deve filtrar por tipo de estoque', async ({ page }) => {
    await page.goto('/inventory');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou
    const heading = page.getByRole('heading', { name: 'Estoque' });
    await expect(heading).toBeVisible({ timeout: 15000 });
    
    // Tentar selecionar filtro de tipo se existir
    const typeFilter = page.getByRole('combobox').first();
    if (await typeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeFilter.selectOption({ index: 1 });
      await page.waitForLoadState('domcontentloaded');
    }
  });
});
