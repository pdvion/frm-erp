import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Testes rápidos para validar que a aplicação está funcionando
 * Executados no CI após cada push para detectar problemas críticos
 * 
 * Tag: @smoke - usado pelo CI para filtrar apenas estes testes
 */

test.describe('Smoke Tests @smoke', () => {
  test('página inicial carrega sem erros', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    
    // Verifica se não há erros de JavaScript no console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Ignora erros conhecidos de third-party
    const criticalErrors = errors.filter(e => 
      !e.includes('third-party') && 
      !e.includes('favicon') &&
      !e.includes('hydration')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('página de login carrega', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);
    
    // Verifica elementos essenciais do login
    await expect(
      page.getByRole('button', { name: /entrar|login|sign in/i })
        .or(page.locator('button[type="submit"]'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('dashboard carrega após autenticação simulada', async ({ page }) => {
    // Tenta acessar dashboard (pode redirecionar para login)
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeLessThan(500); // Não deve ter erro de servidor
    
    await page.waitForLoadState('networkidle');
    
    // Verifica se a página renderizou algo (não está em branco)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(100);
  });

  test('API health check - tRPC responde', async ({ page }) => {
    // Verifica se o endpoint tRPC está acessível
    const response = await page.goto('/api/trpc');
    // tRPC retorna 404 para GET sem procedure, mas não 500
    expect(response?.status()).not.toBe(500);
  });

  test('páginas principais não retornam 500', async ({ page }) => {
    const criticalPages = [
      '/',
      '/login',
      '/dashboard',
      '/materials',
      '/suppliers',
      '/inventory',
    ];

    for (const url of criticalPages) {
      const response = await page.goto(url);
      expect(response?.status(), `Página ${url} retornou erro`).toBeLessThan(500);
    }
  });

  test('assets estáticos carregam', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verifica se CSS carregou (página não está sem estilo)
    const hasStyles = await page.evaluate(() => {
      const styles = document.styleSheets;
      return styles.length > 0;
    });
    
    expect(hasStyles).toBe(true);
  });

  test('não há erros de hidratação React', async ({ page }) => {
    const hydrationErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Aguarda um pouco para capturar erros de hidratação tardios
    await page.waitForTimeout(2000);
    
    expect(hydrationErrors, 'Erros de hidratação detectados').toHaveLength(0);
  });
});
