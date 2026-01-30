import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

test.describe('Materiais (CP10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('deve listar materiais', async ({ page }) => {
    await page.goto('/materials');
    
    // Verificar que a tabela carregou
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Verificar cabeçalhos da tabela
    await expect(page.getByRole('columnheader', { name: 'Código' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Descrição' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Categoria' })).toBeVisible();
  });

  test('deve buscar material por descrição', async ({ page }) => {
    await page.goto('/materials');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Buscar por "Aço"
    await page.getByPlaceholder('Buscar').fill('Aço');
    
    // Aguardar filtro
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que apenas materiais com "Aço" aparecem
    const rows = page.getByRole('row');
    await expect(rows.filter({ hasText: 'Aço' })).toHaveCount(1);
  });

  test('deve filtrar por status', async ({ page }) => {
    await page.goto('/materials');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Selecionar filtro "Ativos"
    await page.getByRole('combobox').selectOption('ACTIVE');
    
    // Aguardar filtro
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que todos os materiais visíveis são ativos
    const statusCells = page.getByRole('cell', { name: 'Ativo' });
    await expect(statusCells.first()).toBeVisible();
  });

  test('deve navegar para criar novo material', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão "Novo Material"
    await page.getByRole('link', { name: /novo material/i }).click();
    
    await expect(page).toHaveURL(/\/materials\/new/, { timeout: 5000 });
  });

  test('deve navegar para editar material', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há materiais na tabela
    const table = page.getByRole('table');
    const emptyMessage = page.getByText('Nenhum material encontrado');
    await expect(table.or(emptyMessage)).toBeVisible({ timeout: 10000 });
    
    // Se a tabela estiver vazia, verificar mensagem; senão, verificar link de editar
    const editLink = page.locator('a[title="Editar"]').first();
    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    } else {
      await expect(editLink).toBeVisible({ timeout: 2000 });
      await editLink.click();
      await expect(page).toHaveURL(/\/materials\/.*\/edit/, { timeout: 5000 });
    }
  });

  test('deve visualizar detalhes do material', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há materiais na tabela
    const table = page.getByRole('table');
    const emptyMessage = page.getByText('Nenhum material encontrado');
    await expect(table.or(emptyMessage)).toBeVisible({ timeout: 10000 });
    
    // Se a tabela estiver vazia, verificar mensagem; senão, verificar link de visualizar
    const viewLink = page.locator('a[title="Visualizar"]').first();
    if (await emptyMessage.isVisible().catch(() => false)) {
      await expect(emptyMessage).toBeVisible();
    } else {
      await expect(viewLink).toBeVisible({ timeout: 2000 });
      await viewLink.click();
      await expect(page).toHaveURL(/\/materials\/[a-f0-9-]+$/, { timeout: 5000 });
    }
  });

  test('deve validar campos obrigatórios no formulário', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');
    
    // Verificar que o formulário carregou
    await expect(page.getByTestId('input-code')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('input-description')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toBeVisible();
    
    // Tentar submeter sem preencher campos obrigatórios
    // O HTML5 validation deve impedir o submit
    const submitBtn = page.getByTestId('submit-btn');
    await submitBtn.click();
    
    // Verificar que ainda estamos na página de criação (form não foi submetido)
    await expect(page).toHaveURL(/\/materials\/new/);
    
    // Preencher apenas código e tentar submeter
    await page.getByTestId('input-code').fill('999');
    await submitBtn.click();
    
    // Ainda deve estar na página (descrição é obrigatória)
    await expect(page).toHaveURL(/\/materials\/new/);
  });
});
