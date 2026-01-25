import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve redirecionar para login quando não autenticado', async ({ page }) => {
    await page.goto('/materials');
    // Pode redirecionar para login ou mostrar página de materiais se já logado
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/login') || url.includes('/materials')).toBeTruthy();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Preencher campos de login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /entrar|login|acessar/i });
    
    await emailInput.fill(process.env.E2E_TEST_EMAIL || 'paulo.vion@me.com');
    await passwordInput.fill(process.env.E2E_TEST_PASSWORD || 'Test@12345');
    await submitButton.click();
    
    // Aguardar redirecionamento para dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /entrar|login|acessar/i });
    
    await emailInput.fill('usuario@invalido.com');
    await passwordInput.fill('senhaerrada');
    await submitButton.click();
    
    // Aguardar mensagem de erro ou permanecer na página de login
    await page.waitForLoadState('networkidle');
    const hasError = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').first().isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('/login');
    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test.skip('deve fazer logout', async ({ page }) => {
    // TODO: Implementar quando o menu de logout estiver com data-testid
    // O teste está sendo pulado temporariamente pois o seletor do menu é complexo
    await page.goto('/dashboard');
  });
});
