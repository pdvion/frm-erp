import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve redirecionar para login quando não autenticado', async ({ page }) => {
    await page.goto('/materials');
    await expect(page).toHaveURL(/\/login/);
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Aguardar redirecionamento para dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('textbox', { name: 'E-mail' }).fill('usuario@invalido.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('senhaerrada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Aguardar mensagem de erro
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('deve fazer logout', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('paulo.vion@me.com');
    await page.getByRole('textbox', { name: 'Senha' }).fill('Test@12345');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Fazer logout via menu do usuário
    await page.getByRole('button', { name: /paulo/i }).click();
    await page.getByRole('menuitem', { name: /sair/i }).click();
    
    // Verificar redirecionamento para login
    await expect(page).toHaveURL(/\/login/);
  });
});
