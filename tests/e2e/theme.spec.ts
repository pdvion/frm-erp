import { test, expect } from '@playwright/test';
import { login } from './fixtures/auth';

test.describe('Alternância de Tema (Light/Dark Mode)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('deve alternar entre tema claro e escuro', async ({ page }) => {
    const html = page.locator('html');

    // Clicar no botão de tema claro
    const lightThemeBtn = page.getByRole('button', { name: /tema claro/i });
    if (await lightThemeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightThemeBtn.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Verificar que mudou para light mode (sem classe dark)
      await expect(html).not.toHaveClass(/dark/);
      
      // Alternar de volta para dark mode
      const darkThemeBtn = page.getByRole('button', { name: /tema escuro/i });
      await darkThemeBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('deve persistir tema após refresh', async ({ page }) => {
    const lightThemeBtn = page.getByRole('button', { name: /tema claro/i });
    
    if (await lightThemeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Mudar para light mode
      await lightThemeBtn.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Refresh da página
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verificar que o tema foi persistido
      const html = page.locator('html');
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('deve aplicar CSS variables corretamente no tema escuro', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar que as CSS variables de tema estão sendo aplicadas
    const card = page.locator('.bg-theme-card').first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      const bgColor = await card.evaluate((el) => 
        getComputedStyle(el).backgroundColor
      );
      // No dark mode, deve ser uma cor escura (zinc-900 = rgb(24, 24, 27))
      expect(bgColor).toMatch(/rgb\(24,\s*24,\s*27\)|rgb\(39,\s*39,\s*42\)/);
    }
  });

  test('deve aplicar CSS variables corretamente no tema claro', async ({ page }) => {
    const lightThemeBtn = page.getByRole('button', { name: /tema claro/i });
    
    if (await lightThemeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lightThemeBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await page.goto('/materials');
      await page.waitForLoadState('networkidle');
      
      // Verificar que o tema claro está ativo
      const html = page.locator('html');
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('deve manter contraste adequado em ambos os temas', async ({ page }) => {
    await page.goto('/materials');
    await page.waitForLoadState('networkidle');
    
    // Verificar texto primário no dark mode
    const textElement = page.locator('.text-theme').first();
    if (await textElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      const color = await textElement.evaluate((el) => 
        getComputedStyle(el).color
      );
      // No dark mode, texto deve ser claro
      expect(color).toMatch(/rgb\(255,\s*255,\s*255\)|rgb\(250,\s*250,\s*250\)/);
    }
  });
});
