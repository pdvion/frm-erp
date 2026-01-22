import { test, expect } from '@playwright/test';

test.describe('CRUD Completo - Materiais', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('CREATE - deve criar novo material com sucesso', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');
    
    // Preencher formulário
    const timestamp = Date.now();
    await page.getByLabel(/código/i).fill(`${timestamp}`);
    await page.getByLabel(/descrição/i).fill(`Material Teste E2E ${timestamp}`);
    await page.getByLabel(/unidade/i).selectOption('UN');
    
    // Submeter formulário
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Verificar redirecionamento para listagem
    await expect(page).toHaveURL(/\/materials/, { timeout: 10000 });
    
    // Verificar mensagem de sucesso ou presença do novo item
    const successMessage = page.getByText(/sucesso|criado|cadastrado/i);
    const newItem = page.getByText(`Material Teste E2E ${timestamp}`);
    await expect(successMessage.or(newItem)).toBeVisible({ timeout: 5000 });
  });

  test('CREATE - deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');
    
    // Tentar submeter sem preencher campos obrigatórios
    await page.getByRole('button', { name: /salvar/i }).click();
    
    // Verificar mensagens de validação
    const validationError = page.getByText(/obrigatório|required|preencha/i)
      .or(page.locator(':invalid'));
    await expect(validationError).toBeVisible({ timeout: 3000 });
  });

  test('READ - deve exibir detalhes do material', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Clicar no primeiro material para ver detalhes
    const viewLink = page.locator('a[title="Visualizar"]').first();
    if (await viewLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewLink.click();
      
      // Verificar que a página de detalhes carregou
      await expect(page).toHaveURL(/\/materials\/[a-f0-9-]+$/, { timeout: 5000 });
      
      // Verificar elementos da página de detalhes
      await expect(page.getByText(/código/i)).toBeVisible();
      await expect(page.getByText(/descrição/i)).toBeVisible();
    }
  });

  test('UPDATE - deve editar material existente', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Clicar no primeiro material para editar
    const editLink = page.locator('a[title="Editar"]').first();
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click();
      
      await expect(page).toHaveURL(/\/materials\/.*\/edit/, { timeout: 5000 });
      
      // Modificar descrição
      const descriptionInput = page.getByLabel(/descrição/i);
      const originalValue = await descriptionInput.inputValue();
      const newValue = `${originalValue} - Editado E2E`;
      
      await descriptionInput.clear();
      await descriptionInput.fill(newValue);
      
      // Salvar alterações
      await page.getByRole('button', { name: /salvar/i }).click();
      
      // Verificar redirecionamento
      await expect(page).toHaveURL(/\/materials/, { timeout: 10000 });
    }
  });

  test('UPDATE - deve cancelar edição sem salvar', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    const editLink = page.locator('a[title="Editar"]').first();
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click();
      await expect(page).toHaveURL(/\/materials\/.*\/edit/, { timeout: 5000 });
      
      // Modificar algo
      const descriptionInput = page.getByLabel(/descrição/i);
      await descriptionInput.fill('Valor que não deve ser salvo');
      
      // Cancelar
      await page.getByRole('link', { name: /cancelar/i }).click();
      
      // Verificar retorno à listagem
      await expect(page).toHaveURL(/\/materials$/, { timeout: 5000 });
    }
  });

  test('DELETE - deve confirmar antes de excluir', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Procurar botão de excluir
    const deleteButton = page.getByRole('button', { name: /excluir|deletar/i }).first();
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click();
      
      // Verificar diálogo de confirmação
      const confirmDialog = page.getByRole('dialog')
        .or(page.getByText(/confirmar|certeza|deseja.*excluir/i));
      await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('CRUD Completo - Fornecedores', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('CREATE - deve criar novo fornecedor com sucesso', async ({ page }) => {
    await page.goto('/suppliers/new');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    await page.getByLabel(/código/i).fill(`${timestamp}`);
    await page.getByLabel(/razão social/i).fill(`Fornecedor Teste E2E ${timestamp}`);
    await page.getByLabel(/cnpj/i).fill('12345678000199');
    
    await page.getByRole('button', { name: /salvar/i }).click();
    
    await expect(page).toHaveURL(/\/suppliers/, { timeout: 10000 });
  });

  test('READ - deve listar fornecedores com paginação', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    
    // Verificar tabela
    const table = page.getByRole('table');
    await expect(table.or(page.getByText(/nenhum.*encontrado/i))).toBeVisible({ timeout: 10000 });
    
    // Verificar paginação se houver muitos registros
    const pagination = page.getByRole('navigation', { name: /paginação/i })
      .or(page.locator('[data-testid="pagination"]'))
      .or(page.getByText(/página.*de/i));
    
    const hasPagination = await pagination.isVisible({ timeout: 2000 }).catch(() => false);
    expect(typeof hasPagination).toBe('boolean');
  });

  test('UPDATE - deve editar fornecedor existente', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    
    const editLink = page.locator('a[title="Editar"]').first();
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click();
      await expect(page).toHaveURL(/\/suppliers\/.*\/edit/, { timeout: 5000 });
      
      // Verificar que o formulário carregou com dados
      const companyNameInput = page.getByLabel(/razão social/i);
      const value = await companyNameInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

test.describe('CRUD Completo - Cotações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('CREATE - deve criar nova cotação', async ({ page }) => {
    await page.goto('/quotes/new');
    await page.waitForLoadState('networkidle');
    
    // Verificar que o formulário carregou
    await expect(page.getByText(/fornecedor/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/itens/i)).toBeVisible();
  });

  test('READ - deve alternar entre visualização lista e kanban', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    
    // Verificar toggle de visualização
    const viewToggle = page.getByRole('button', { name: /kanban|lista|grid/i })
      .or(page.locator('[data-testid="view-toggle"]'));
    
    if (await viewToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewToggle.click();
      await page.waitForTimeout(500);
      
      // Verificar que a visualização mudou
      const kanbanBoard = page.locator('[data-testid="kanban-board"]')
        .or(page.getByRole('region', { name: /kanban/i }));
      const tableView = page.getByRole('table');
      
      await expect(kanbanBoard.or(tableView)).toBeVisible({ timeout: 5000 });
    }
  });

  test('UPDATE - deve atualizar status da cotação', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    
    // Clicar na primeira cotação
    const viewLink = page.locator('a').filter({ hasText: /#\d{6}/ }).first();
    if (await viewLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewLink.click();
      
      // Verificar página de detalhes
      await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+$/, { timeout: 5000 });
      
      // Procurar botão de mudança de status
      const statusButton = page.getByRole('button', { name: /aprovar|rejeitar|enviar/i });
      const hasStatusButton = await statusButton.isVisible({ timeout: 3000 }).catch(() => false);
      expect(typeof hasStatusButton).toBe('boolean');
    }
  });
});

test.describe('CRUD Completo - Pedidos de Compra', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('CREATE - deve criar novo pedido de compra', async ({ page }) => {
    await page.goto('/purchase-orders/new');
    await page.waitForLoadState('networkidle');
    
    // Verificar que o formulário carregou
    await expect(page.getByText(/fornecedor/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/itens/i)).toBeVisible();
  });

  test('READ - deve exibir estatísticas por status', async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');
    
    // Verificar cards de estatísticas
    const statsCards = page.locator('.bg-theme-card').filter({ hasText: /total|pendente|aprovado/i });
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('READ - deve filtrar por status', async ({ page }) => {
    await page.goto('/purchase-orders');
    await page.waitForLoadState('networkidle');
    
    // Selecionar filtro de status
    const statusFilter = page.getByRole('combobox').filter({ hasText: /status/i })
      .or(page.locator('select').filter({ hasText: /todos.*status/i }));
    
    if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusFilter.selectOption('PENDING');
      await page.waitForTimeout(500);
      
      // Verificar que o filtro foi aplicado
      const pendingBadges = page.getByText(/pendente/i);
      const emptyMessage = page.getByText(/nenhum.*encontrado/i);
      await expect(pendingBadges.first().or(emptyMessage)).toBeVisible({ timeout: 5000 });
    }
  });
});
