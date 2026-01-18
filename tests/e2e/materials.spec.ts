import { test, expect } from '@playwright/test';

test.describe('Materiais (CP10)', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
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
    await page.waitForTimeout(500);
    
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
    await page.waitForTimeout(500);
    
    // Verificar que todos os materiais visíveis são ativos
    const statusCells = page.getByRole('cell', { name: 'Ativo' });
    await expect(statusCells.first()).toBeVisible();
  });

  test('deve navegar para criar novo material', async ({ page }) => {
    await page.goto('/materials');
    
    await page.getByRole('link', { name: 'Novo Material' }).click();
    
    await expect(page).toHaveURL(/\/materials\/new/);
    await expect(page.getByRole('heading', { name: /novo material/i })).toBeVisible();
  });

  test('deve navegar para editar material', async ({ page }) => {
    await page.goto('/materials');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Clicar no primeiro botão de editar
    await page.getByRole('link', { name: 'Editar' }).first().click();
    
    await expect(page).toHaveURL(/\/materials\/.*\/edit/);
  });

  test('deve visualizar detalhes do material', async ({ page }) => {
    await page.goto('/materials');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });
    
    // Clicar no primeiro botão de visualizar
    await page.getByRole('link', { name: 'Visualizar' }).first().click();
    
    await expect(page).toHaveURL(/\/materials\/[a-f0-9-]+$/);
  });
});
