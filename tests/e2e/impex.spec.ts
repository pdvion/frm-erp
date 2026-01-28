import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

test.describe('ImpEx - Importação e Exportação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Dashboard ImpEx', () => {
    test('deve carregar dashboard com KPIs', async ({ page }) => {
      await page.goto('/impex/dashboard');
      
      // Verificar título
      await expect(page.getByRole('heading', { name: 'Dashboard de Importação' })).toBeVisible({ timeout: 10000 });
      
      // Verificar KPIs
      await expect(page.getByText('Processos Ativos')).toBeVisible();
      await expect(page.getByText('Valor em Trânsito')).toBeVisible();
      await expect(page.getByText('Câmbio em Aberto')).toBeVisible();
      await expect(page.getByText('Variação Cambial')).toBeVisible();
    });

    test('deve exibir ações rápidas', async ({ page }) => {
      await page.goto('/impex/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Verificar links de ações rápidas
      await expect(page.getByRole('link', { name: 'Novo Processo' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Novo Contrato' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Relatórios' })).toBeVisible();
    });
  });

  test.describe('Processos de Importação', () => {
    test('deve listar processos', async ({ page }) => {
      await page.goto('/impex/processes');
      
      // Verificar título
      await expect(page.getByRole('heading', { name: 'Processos de Importação' })).toBeVisible({ timeout: 10000 });
      
      // Verificar campo de busca
      await expect(page.getByPlaceholder(/buscar/i)).toBeVisible();
      
      // Verificar botão de novo processo
      await expect(page.getByRole('link', { name: 'Novo Processo' })).toBeVisible();
    });

    test('deve navegar para criar novo processo', async ({ page }) => {
      await page.goto('/impex/processes');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('link', { name: 'Novo Processo' }).click();
      
      await expect(page).toHaveURL(/\/impex\/processes\/new/, { timeout: 5000 });
      await expect(page.getByRole('heading', { name: 'Novo Processo de Importação' })).toBeVisible();
    });

    test('deve exibir formulário de novo processo com campos obrigatórios', async ({ page }) => {
      await page.goto('/impex/processes/new');
      await page.waitForLoadState('networkidle');
      
      // Verificar campos obrigatórios
      await expect(page.getByText('Número do Processo')).toBeVisible();
      await expect(page.getByText('Fornecedor')).toBeVisible();
      await expect(page.getByText('Incoterm')).toBeVisible();
      await expect(page.getByText('Tipo de Carga')).toBeVisible();
      await expect(page.getByText('Porto de Origem')).toBeVisible();
      await expect(page.getByText('Porto de Destino')).toBeVisible();
      await expect(page.getByText('Valor da Invoice')).toBeVisible();
      
      // Verificar botões
      await expect(page.getByRole('link', { name: 'Cancelar' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible();
    });

    test('deve carregar dados de select no formulário', async ({ page }) => {
      await page.goto('/impex/processes/new');
      await page.waitForLoadState('networkidle');
      
      // Verificar que selects têm opções carregadas
      const supplierSelect = page.locator('select').filter({ hasText: 'Selecione' }).first();
      await expect(supplierSelect).toBeVisible();
      
      // Verificar que há opções de incoterm
      const incotermOptions = page.locator('option').filter({ hasText: 'FOB' });
      await expect(incotermOptions.first()).toBeVisible();
    });
  });

  test.describe('Contratos de Câmbio', () => {
    test('deve listar contratos de câmbio', async ({ page }) => {
      await page.goto('/impex/exchange');
      
      // Verificar título
      await expect(page.getByRole('heading', { name: 'Contratos de Câmbio' })).toBeVisible({ timeout: 10000 });
      
      // Verificar campo de busca
      await expect(page.getByPlaceholder(/buscar/i)).toBeVisible();
      
      // Verificar botão de novo contrato
      await expect(page.getByRole('link', { name: 'Novo Contrato' })).toBeVisible();
    });

    test('deve navegar para criar novo contrato', async ({ page }) => {
      await page.goto('/impex/exchange');
      await page.waitForLoadState('networkidle');
      
      await page.getByRole('link', { name: 'Novo Contrato' }).click();
      
      await expect(page).toHaveURL(/\/impex\/exchange\/new/, { timeout: 5000 });
    });

    test('deve exibir formulário de novo contrato com campos obrigatórios', async ({ page }) => {
      await page.goto('/impex/exchange/new');
      await page.waitForLoadState('networkidle');
      
      // Verificar campos obrigatórios
      await expect(page.getByText('Número do Contrato')).toBeVisible();
      await expect(page.getByText('Conta Bancária')).toBeVisible();
      await expect(page.getByText('Valor ME')).toBeVisible();
      await expect(page.getByText('Taxa de Câmbio')).toBeVisible();
      await expect(page.getByText('Data do Contrato')).toBeVisible();
      await expect(page.getByText('Vencimento')).toBeVisible();
      
      // Verificar botões
      await expect(page.getByRole('link', { name: 'Cancelar' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible();
    });
  });

  test.describe('Relatórios ImpEx', () => {
    test('deve carregar página de relatórios', async ({ page }) => {
      await page.goto('/impex/reports');
      
      // Verificar título
      await expect(page.getByRole('heading', { name: 'Relatórios de Importação' })).toBeVisible({ timeout: 10000 });
      
      // Verificar tabs de relatórios
      await expect(page.getByRole('button', { name: /processos/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /custos/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /câmbio/i })).toBeVisible();
    });

    test('deve alternar entre tipos de relatório', async ({ page }) => {
      await page.goto('/impex/reports');
      await page.waitForLoadState('networkidle');
      
      // Clicar em Custos
      await page.getByRole('button', { name: /custos/i }).click();
      await page.waitForLoadState('domcontentloaded');
      
      // Clicar em Câmbio
      await page.getByRole('button', { name: /câmbio/i }).click();
      await page.waitForLoadState('domcontentloaded');
    });

    test('deve ter botão de exportar CSV', async ({ page }) => {
      await page.goto('/impex/reports');
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('button', { name: /exportar csv/i })).toBeVisible();
    });
  });

  test.describe('Navegação ImpEx', () => {
    test('deve navegar via menu lateral', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Expandir menu Compras
      await page.getByRole('button', { name: 'Compras' }).click();
      
      // Clicar em ImpEx
      await page.getByRole('link', { name: 'ImpEx' }).click();
      
      await expect(page).toHaveURL(/\/impex/, { timeout: 5000 });
    });

    test('deve ter breadcrumbs funcionais', async ({ page }) => {
      await page.goto('/impex/processes/new');
      await page.waitForLoadState('networkidle');
      
      // Verificar breadcrumbs
      await expect(page.getByRole('link', { name: 'ImpEx' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Processos' })).toBeVisible();
      
      // Clicar em ImpEx no breadcrumb
      await page.getByRole('link', { name: 'ImpEx' }).click();
      await expect(page).toHaveURL(/\/impex$/, { timeout: 5000 });
    });
  });

  test.describe('Responsividade Mobile', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('deve exibir menu hamburger em mobile', async ({ page }) => {
      await page.goto('/impex/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Verificar que o botão de menu está visível
      await expect(page.getByRole('button', { name: /abrir menu/i })).toBeVisible();
    });

    test('deve carregar dashboard em mobile', async ({ page }) => {
      await page.goto('/impex/dashboard');
      
      // Verificar que o conteúdo carrega
      await expect(page.getByRole('heading', { name: 'Dashboard de Importação' })).toBeVisible({ timeout: 10000 });
      
      // Verificar KPIs
      await expect(page.getByText('Processos Ativos')).toBeVisible();
    });
  });
});
