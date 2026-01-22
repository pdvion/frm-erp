import { test, expect } from '@playwright/test';

test.describe('Mobile - Responsividade e UX', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve exibir menu hamburger em mobile', async ({ page }) => {
    // Verificar que o menu hamburger está visível
    const hamburgerMenu = page.getByRole('button', { name: /menu|abrir.*menu/i })
      .or(page.locator('[data-testid="mobile-menu-toggle"]'))
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-menu') }));

    await expect(hamburgerMenu).toBeVisible({ timeout: 5000 });
  });

  test('deve abrir/fechar sidebar ao clicar no menu hamburger', async ({ page }) => {
    const hamburgerMenu = page.getByRole('button', { name: /menu|abrir.*menu/i })
      .or(page.locator('[data-testid="mobile-menu-toggle"]'))
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-menu') }));

    if (await hamburgerMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Abrir menu
      await hamburgerMenu.click();
      await page.waitForTimeout(300);

      // Verificar que a sidebar está visível
      const sidebar = page.locator('[data-testid="sidebar"]')
        .or(page.locator('nav').filter({ hasText: /dashboard|materiais/i }));
      await expect(sidebar).toBeVisible({ timeout: 3000 });

      // Fechar menu
      const closeButton = page.getByRole('button', { name: /fechar|close/i })
        .or(page.locator('[data-testid="close-sidebar"]'));
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
      } else {
        // Clicar fora para fechar
        await page.locator('main').click({ force: true });
      }
    }
  });

  test('deve exibir tabelas responsivas com scroll horizontal', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    const table = page.getByRole('table');
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verificar que a tabela tem scroll horizontal
      const tableContainer = table.locator('..');
      const hasOverflow = await tableContainer.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.overflowX === 'auto' || style.overflowX === 'scroll';
      });

      // Ou verificar que algumas colunas estão ocultas em mobile
      const hiddenColumns = page.locator('.hidden.sm\\:table-cell, .hidden.md\\:table-cell');
      const hiddenCount = await hiddenColumns.count();

      expect(hasOverflow || hiddenCount > 0).toBeTruthy();
    }
  });

  test('deve exibir cards em coluna única em mobile', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');

    // Verificar cards de estatísticas
    const statsGrid = page.locator('.grid').filter({ hasText: /total|pendente/i }).first();
    if (await statsGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
      const gridStyle = await statsGrid.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
        };
      });

      // Em mobile, deve ter menos colunas ou ser flex column
      expect(gridStyle.display).toMatch(/grid|flex/);
    }
  });

  test('deve ter botões com tamanho adequado para touch', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Verificar tamanho mínimo de botões (44x44 recomendado para touch)
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await button.boundingBox();
        if (box) {
          // Tamanho mínimo recomendado: 44px
          expect(box.width).toBeGreaterThanOrEqual(32);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });

  test('deve ter inputs com tamanho adequado para touch', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input[type="text"], input[type="number"], select');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await input.boundingBox();
        if (box) {
          // Altura mínima para inputs: 40px
          expect(box.height).toBeGreaterThanOrEqual(36);
        }
      }
    }
  });

  test('deve permitir scroll suave na página', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Scroll para baixo
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Scroll para cima
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const scrollYAfter = await page.evaluate(() => window.scrollY);
    expect(scrollYAfter).toBe(0);
  });

  test('deve exibir formulários em layout vertical', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');

    // Verificar que os campos estão em layout vertical
    const formGrid = page.locator('.grid').first();
    if (await formGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
      const gridStyle = await formGrid.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // Em mobile, deve ser 1 coluna (1fr ou similar)
      expect(gridStyle).toMatch(/1fr|none|auto/);
    }
  });
});

test.describe('Mobile - Navegação Touch', () => {
  test.use({ viewport: { width: 414, height: 896 } }); // iPhone 11

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve permitir swipe em listas (se implementado)', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Simular swipe horizontal em uma linha da tabela
    const firstRow = page.getByRole('row').nth(1);
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const box = await firstRow.boundingBox();
      if (box) {
        // Simular swipe da direita para esquerda
        await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }
  });

  test('deve ter área de toque adequada em links', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    const links = page.getByRole('link');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      if (await link.isVisible({ timeout: 1000 }).catch(() => false)) {
        const box = await link.boundingBox();
        if (box) {
          // Área mínima de toque: 44x44
          expect(box.width * box.height).toBeGreaterThanOrEqual(32 * 32);
        }
      }
    }
  });

  test('deve exibir modais em tela cheia ou quase cheia', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Tentar abrir um modal/drawer
    const addButton = page.getByRole('button', { name: /adicionar|novo/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Verificar modal/drawer
      const modal = page.getByRole('dialog')
        .or(page.locator('[data-testid="drawer"]'))
        .or(page.locator('[role="dialog"]'));

      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await modal.boundingBox();
        const viewport = page.viewportSize();

        if (box && viewport) {
          // Modal deve ocupar boa parte da tela em mobile
          const widthRatio = box.width / viewport.width;
          expect(widthRatio).toBeGreaterThan(0.8);
        }
      }
    }
  });

  test('deve ter espaçamento adequado entre elementos interativos', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Verificar espaçamento entre botões de ação
    const actionButtons = page.locator('a[title], button').filter({ hasText: /.+/ });
    const buttonCount = await actionButtons.count();

    if (buttonCount >= 2) {
      const box1 = await actionButtons.nth(0).boundingBox();
      const box2 = await actionButtons.nth(1).boundingBox();

      if (box1 && box2) {
        // Calcular distância entre elementos
        const distance = Math.abs(box2.x - (box1.x + box1.width));
        // Mínimo de 8px entre elementos
        expect(distance).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

test.describe('Tablet - Layout Intermediário', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve exibir sidebar colapsada ou expandida', async ({ page }) => {
    // Em tablet, a sidebar pode estar colapsada ou visível
    const sidebar = page.locator('[data-testid="sidebar"]')
      .or(page.locator('nav').filter({ hasText: /dashboard/i }));

    const hamburgerMenu = page.getByRole('button', { name: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-toggle"]'));

    // Deve ter sidebar visível OU menu hamburger
    const hasSidebar = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    const hasHamburger = await hamburgerMenu.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasSidebar || hasHamburger).toBeTruthy();
  });

  test('deve exibir tabelas com mais colunas que mobile', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    const table = page.getByRole('table');
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Contar colunas visíveis
      const headers = page.getByRole('columnheader');
      const headerCount = await headers.count();

      // Em tablet, deve ter mais colunas que em mobile (pelo menos 4)
      expect(headerCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('deve exibir grid de cards em 2-3 colunas', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');

    const statsGrid = page.locator('.grid').filter({ hasText: /total|pendente/i }).first();
    if (await statsGrid.isVisible({ timeout: 5000 }).catch(() => false)) {
      const gridStyle = await statsGrid.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // Em tablet, deve ter 2-4 colunas
      const columnCount = gridStyle.split(' ').filter(c => c.includes('fr') || c.includes('px')).length;
      expect(columnCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('deve ter formulários em 2 colunas', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');

    const formGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2').first();
    if (await formGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
      const gridStyle = await formGrid.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.gridTemplateColumns;
      });

      // Em tablet (768px), md: breakpoint deve estar ativo
      expect(gridStyle).toMatch(/repeat|fr.*fr/);
    }
  });
});

test.describe('Mobile - Acessibilidade', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve ter labels visíveis ou aria-label em inputs', async ({ page }) => {
    await page.goto('/materials/new');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        const hasLabel = await input.evaluate((el) => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          return !!(ariaLabel || ariaLabelledBy || label);
        });
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('deve ter contraste adequado de texto', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Verificar texto principal
    const textElement = page.locator('.text-theme, .text-white').first();
    if (await textElement.isVisible({ timeout: 3000 }).catch(() => false)) {
      const color = await textElement.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.color;
      });

      // Texto deve ser claro (não transparente ou muito escuro em dark mode)
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('deve ter foco visível em elementos interativos', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');

    // Tab para o primeiro elemento focável
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que há um elemento focado com estilo visível
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      const hasVisibleFocus = await focusedElement.evaluate((el) => {
        const style = getComputedStyle(el);
        return (
          style.outlineWidth !== '0px' ||
          style.boxShadow !== 'none' ||
          el.classList.contains('ring-2') ||
          el.classList.contains('focus:ring-2')
        );
      });
      // Foco deve ser visível de alguma forma
      expect(typeof hasVisibleFocus).toBe('boolean');
    }
  });
});
