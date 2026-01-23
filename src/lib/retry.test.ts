import { describe, it, expect, vi } from "vitest";
import {
  retry,
  sleep,
  retryWithCircuitBreaker,
  processBatchWithRetry,
} from "./retry";
import { ExternalServiceError } from "./errors";

describe("Retry Utilities", () => {
  describe("sleep", () => {
    it("deve aguardar o tempo especificado", async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe("retry", () => {
    it("deve retornar resultado na primeira tentativa bem-sucedida", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      
      const result = await retry(operation, { initialDelayMs: 10 });
      
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("deve retentar após falha e ter sucesso", async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new ExternalServiceError("API", "Erro"))
        .mockResolvedValueOnce("success");
      
      const result = await retry(operation, { maxAttempts: 3, initialDelayMs: 10 });
      
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("deve lançar erro após esgotar tentativas", async () => {
      const error = new ExternalServiceError("API", "Erro persistente");
      const operation = vi.fn().mockRejectedValue(error);
      
      await expect(
        retry(operation, { maxAttempts: 2, initialDelayMs: 10 })
      ).rejects.toThrow(error);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("deve chamar onRetry callback", async () => {
      const onRetry = vi.fn();
      const operation = vi.fn()
        .mockRejectedValueOnce(new ExternalServiceError("API", "Erro"))
        .mockResolvedValueOnce("success");
      
      await retry(operation, { maxAttempts: 3, initialDelayMs: 10, onRetry });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(ExternalServiceError),
        1,
        expect.any(Number)
      );
    });

    it("não deve retentar erro não-retryable", async () => {
      const nonRetryableError = new Error("Non-retryable");
      const operation = vi.fn().mockRejectedValue(nonRetryableError);
      
      await expect(
        retry(operation, {
          maxAttempts: 3,
          initialDelayMs: 10,
          retryableErrors: () => false,
        })
      ).rejects.toThrow(nonRetryableError);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("retryWithCircuitBreaker", () => {
    it("deve funcionar com operação bem-sucedida", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      
      const result = await retryWithCircuitBreaker(operation, {
        circuitName: `test-${Date.now()}`,
        maxAttempts: 1,
        failureThreshold: 5,
      });
      
      expect(result).toBe("success");
    });
  });

  describe("processBatchWithRetry", () => {
    it("deve processar todos os itens", async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation(async (n: number) => n * 2);
      
      const results = await processBatchWithRetry(items, processor, {
        initialDelayMs: 10,
      });
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.result)).toEqual([2, 4, 6]);
    });

    it("deve capturar erros por item", async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation(async (n: number) => {
        if (n === 2) throw new Error("Erro no item 2");
        return n * 2;
      });
      
      const results = await processBatchWithRetry(items, processor, {
        maxAttempts: 1,
        initialDelayMs: 10,
        retryableErrors: () => false,
      });
      
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe(2);
      
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe("Erro no item 2");
      
      expect(results[2].success).toBe(true);
      expect(results[2].result).toBe(6);
    });

    it("deve respeitar concurrency", async () => {
      const items = [1, 2, 3, 4, 5];
      let concurrent = 0;
      let maxConcurrent = 0;
      
      const processor = vi.fn().mockImplementation(async (n: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await sleep(10);
        concurrent--;
        return n;
      });
      
      const results = await processBatchWithRetry(items, processor, { 
        concurrency: 2,
        initialDelayMs: 10,
      });
      
      expect(results).toHaveLength(5);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});
