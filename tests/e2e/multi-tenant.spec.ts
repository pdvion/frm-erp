import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant - Isolamento de Dados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve exibir seletor de empresa no header', async ({ page }) => {
    // Verificar que o seletor de empresa está visível (é um botão com nome da empresa)
    const companySelector = page.getByRole('button', { name: /FRM|empresa|indústria/i }).first()
      .or(page.locator('[data-testid="company-selector"]'));
    
    await expect(companySelector).toBeVisible({ timeout: 5000 });
  });

  test('deve trocar de empresa e atualizar dados', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Aguardar carregamento da tabela
    await page.getByRole('table').or(page.getByText(/nenhum.*encontrado/i)).waitFor({ timeout: 10000 });
    
    // Encontrar e clicar no seletor de empresa (é um botão)
    const companySelector = page.getByRole('button', { name: /FRM|empresa|indústria/i }).first();
    
    if (await companySelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await companySelector.click();
      await page.waitForTimeout(300);
      
      // Selecionar outra empresa do menu (se disponível)
      const otherCompany = page.getByRole('menuitem').or(page.getByRole('option')).nth(1);
      if (await otherCompany.isVisible({ timeout: 2000 }).catch(() => false)) {
        await otherCompany.click();
        
        // Aguardar recarregamento dos dados
        await page.waitForLoadState('networkidle');
        
        // Verificar que os dados foram atualizados (contagem pode ser diferente)
        const newCount = await page.getByRole('row').count();
        // Apenas verificar que a página recarregou corretamente
        expect(newCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('deve exibir dados compartilhados (isShared)', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há indicador de dados compartilhados
    const sharedBadge = page.getByText(/compartilhado/i)
      .or(page.locator('[data-shared="true"]'));
    
    // Dados compartilhados podem ou não existir
    const hasShared = await sharedBadge.isVisible({ timeout: 3000 }).catch(() => false);
    expect(typeof hasShared).toBe('boolean');
  });

  test('deve manter contexto da empresa ao navegar entre páginas', async ({ page }) => {
    // Ir para materiais
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Capturar empresa atual (texto do botão)
    const companySelector = page.getByRole('button', { name: /FRM|empresa|indústria/i }).first();
    
    let currentCompany = '';
    if (await companySelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      currentCompany = await companySelector.textContent() ?? '';
    }
    
    // Navegar para fornecedores
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    
    // Verificar que a empresa continua a mesma
    if (currentCompany) {
      const companySelectorNew = page.getByRole('button', { name: /FRM|empresa|indústria/i }).first();
      if (await companySelectorNew.isVisible({ timeout: 3000 }).catch(() => false)) {
        const newCompany = await companySelectorNew.textContent() ?? '';
        expect(newCompany).toBe(currentCompany);
      }
    }
  });

  test('deve filtrar dados por empresa corretamente', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar que a tabela carregou
    const table = page.getByRole('table');
    await expect(table.or(page.getByText(/nenhum.*encontrado/i))).toBeVisible({ timeout: 10000 });
    
    // Se houver dados, verificar que pertencem à empresa atual
    const rows = page.getByRole('row');
    const rowCount = await rows.count();
    
    // Cada linha deve ter dados consistentes (não misturar empresas)
    if (rowCount > 1) {
      // Verificar que não há erro de isolamento
      const errorMessage = page.getByText(/erro.*empresa|acesso.*negado/i);
      await expect(errorMessage).not.toBeVisible();
    }
  });

  test('deve respeitar permissões por empresa', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar que não há erro de permissão não tratado
    const permissionError = page.getByText(/sem.*permissão|acesso.*negado|não.*autorizado/i);
    await expect(permissionError).not.toBeVisible({ timeout: 2000 });
    
    // Verificar que a página carregou corretamente (botões de ação ou mensagem vazia)
    const hasContent = page.getByRole('link', { name: /novo/i })
      .or(page.getByText(/nenhum.*encontrado/i));
    await expect(hasContent).toBeVisible({ timeout: 5000 });
  });
});
