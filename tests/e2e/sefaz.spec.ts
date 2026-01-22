import { test, expect } from '@playwright/test';

test.describe('Integração SEFAZ', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve acessar página de configuração SEFAZ', async ({ page }) => {
    await page.goto('/settings/sefaz');
    
    // Verificar que a página carregou
    await expect(page.getByRole('heading', { name: /sefaz|configuração/i })).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir status da integração', async ({ page }) => {
    await page.goto('/settings/sefaz');
    await page.waitForLoadState('networkidle');
    
    // Verificar seção de status
    await expect(page.getByText(/status/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir seção de sincronização automática', async ({ page }) => {
    await page.goto('/settings/sefaz');
    await page.waitForLoadState('networkidle');
    
    // Verificar seção de sincronização
    await expect(page.getByText(/sincronização automática/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve listar NFe pendentes', async ({ page }) => {
    await page.goto('/invoices/pending');
    
    // Verificar que a página carregou
    await expect(page.getByRole('heading', { name: /nfe|pendentes/i })).toBeVisible({ timeout: 10000 });
    
    // Verificar tabela ou mensagem de vazio
    const table = page.getByRole('table');
    const emptyMessage = page.getByText(/nenhum/i);
    await expect(table.or(emptyMessage)).toBeVisible({ timeout: 10000 });
  });

  test('deve acessar histórico de manifestações', async ({ page }) => {
    await page.goto('/invoices/manifestacoes');
    
    // Verificar que a página carregou
    await expect(page.getByRole('heading', { name: /manifestaç/i })).toBeVisible({ timeout: 10000 });
  });

  test('deve ter botão de manifestação em lote na página de pendentes', async ({ page }) => {
    await page.goto('/invoices/pending');
    await page.waitForLoadState('networkidle');
    
    // Verificar botão de manifestação em lote
    const batchButton = page.getByRole('button', { name: /manifestar.*lote|lote/i });
    // O botão pode estar desabilitado se não houver seleção
    await expect(batchButton).toBeVisible({ timeout: 5000 });
  });
});
