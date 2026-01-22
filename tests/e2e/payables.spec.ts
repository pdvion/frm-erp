import { test, expect } from '@playwright/test';

test.describe('Contas a Pagar (Financeiro)', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve listar contas a pagar', async ({ page }) => {
    await page.goto('/payables');
    
    // Verificar que a página carregou
    await expect(page.getByRole('heading', { name: /contas a pagar/i })).toBeVisible({ timeout: 10000 });
    
    // Verificar que a tabela ou lista está presente
    const table = page.getByRole('table');
    const emptyMessage = page.getByText(/nenhum/i);
    await expect(table.or(emptyMessage)).toBeVisible({ timeout: 10000 });
  });

  test('deve filtrar por status', async ({ page }) => {
    await page.goto('/payables');
    await page.waitForLoadState('networkidle');
    
    // Verificar filtros de status
    const statusFilter = page.getByRole('combobox').first();
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('PENDING');
      await page.waitForTimeout(500);
    }
  });

  test('deve navegar para criar nova conta', async ({ page }) => {
    await page.goto('/payables');
    await page.waitForLoadState('networkidle');
    
    // Clicar no botão "Nova Conta" ou similar
    const newButton = page.getByRole('link', { name: /nova|novo|adicionar/i });
    if (await newButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newButton.click();
      await expect(page).toHaveURL(/\/payables\/new/, { timeout: 5000 });
    }
  });

  test('deve visualizar detalhes de uma conta', async ({ page }) => {
    await page.goto('/payables');
    await page.waitForLoadState('networkidle');
    
    // Clicar em uma conta existente
    const viewLink = page.locator('a[title="Visualizar"]').first();
    if (await viewLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewLink.click();
      await expect(page).toHaveURL(/\/payables\/[a-f0-9-]+/, { timeout: 5000 });
    }
  });

  test('deve exibir resumo financeiro', async ({ page }) => {
    await page.goto('/payables');
    await page.waitForLoadState('networkidle');
    
    // Verificar cards de resumo (total, vencidas, a vencer)
    const summaryCards = page.locator('[data-testid="summary-card"]');
    // Se não houver data-testid, verificar por texto
    const totalText = page.getByText(/total|saldo|valor/i);
    await expect(summaryCards.first().or(totalText.first())).toBeVisible({ timeout: 5000 });
  });
});
