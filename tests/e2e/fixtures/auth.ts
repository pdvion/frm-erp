import { Page, expect } from '@playwright/test';

// Credenciais de teste - usar variáveis de ambiente em produção
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'paulo.vion@me.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'Test@12345';

/**
 * Helper para fazer login nos testes E2E
 * Centraliza a lógica de autenticação para evitar duplicação
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'E-mail' }).fill(TEST_EMAIL);
  await page.getByRole('textbox', { name: 'Senha' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper para fazer logout nos testes E2E
 */
export async function logout(page: Page): Promise<void> {
  const userMenu = page.getByRole('button', { name: /perfil|usuário|menu/i });
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click();
    const logoutBtn = page.getByRole('menuitem', { name: /sair|logout/i });
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
    }
  }
}

/**
 * Helper para aguardar carregamento completo da página
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Helper para verificar se elemento está visível com fallback
 */
export async function isVisible(page: Page, selector: string, timeout = 3000): Promise<boolean> {
  return page.locator(selector).isVisible({ timeout }).catch(() => false);
}
