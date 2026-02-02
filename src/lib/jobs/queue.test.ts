import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryQueue, type Job, type JobResult } from "./queue";

describe("InMemoryQueue", () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue({
      name: "test-queue",
      concurrency: 2,
      maxRetries: 3,
      retryDelay: 100,
      timeout: 5000,
    });
  });

  describe("add", () => {
    it("should add a job to the queue", async () => {
      const job = await queue.add("test-job", { message: "hello" });

      expect(job.id).toBeDefined();
      expect(job.type).toBe("test-job");
      expect(job.data).toEqual({ message: "hello" });
      expect(job.status).toBe("pending");
      expect(job.attempts).toBe(0);
    });

    it("should set priority", async () => {
      const job = await queue.add("test-job", {}, { priority: 10 });
      expect(job.priority).toBe(10);
    });

    it("should set scheduled time", async () => {
      const scheduledFor = new Date(Date.now() + 60000);
      const job = await queue.add("test-job", {}, { scheduledFor });
      expect(job.scheduledFor).toEqual(scheduledFor);
    });

    it("should set company ID", async () => {
      const job = await queue.add("test-job", {}, { companyId: "company-123" });
      expect(job.companyId).toBe("company-123");
    });
  });

  describe("registerHandler", () => {
    it("should register a handler for a job type", async () => {
      const handler = async (job: Job<{ value: number }>): Promise<JobResult<number>> => ({
        success: true,
        data: job.data.value * 2,
      });

      queue.registerHandler("double", handler);

      const job = await queue.add("double", { value: 5 });
      await queue.process();

      const processedJob = queue.getJob(job.id);
      expect(processedJob?.status).toBe("completed");
      expect(processedJob?.result).toBe(10);
    });
  });

  describe("process", () => {
    it("should process pending jobs", async () => {
      queue.registerHandler("success-job", async () => ({
        success: true,
        data: "done",
      }));

      const job = await queue.add("success-job", {});
      await queue.process();

      const processedJob = queue.getJob(job.id);
      expect(processedJob?.status).toBe("completed");
    });

    it("should retry failed jobs", async () => {
      let attempts = 0;
      queue.registerHandler("retry-job", async () => {
        attempts++;
        if (attempts < 3) {
          return { success: false, error: "Not ready yet" };
        }
        return { success: true, data: "finally done" };
      });

      const job = await queue.add("retry-job", {});
      
      // First attempt - fails
      await queue.process();
      expect(queue.getJob(job.id)?.status).toBe("retrying");

      // Wait for retry delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second attempt - fails
      await queue.process();
      expect(queue.getJob(job.id)?.status).toBe("retrying");

      // Wait for retry delay
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Third attempt - succeeds
      await queue.process();
      expect(queue.getJob(job.id)?.status).toBe("completed");
    });

    it("should mark job as failed after max attempts", async () => {
      queue.registerHandler("always-fail", async () => ({
        success: false,
        error: "Always fails",
      }));

      const job = await queue.add("always-fail", {}, { maxAttempts: 2 });

      // First attempt
      await queue.process();
      expect(queue.getJob(job.id)?.status).toBe("retrying");

      // Wait and second attempt
      await new Promise((resolve) => setTimeout(resolve, 150));
      await queue.process();

      expect(queue.getJob(job.id)?.status).toBe("failed");
      expect(queue.getJob(job.id)?.error).toBe("Always fails");
    });

    it("should fail job without handler", async () => {
      const job = await queue.add("no-handler", {});
      await queue.process();

      const processedJob = queue.getJob(job.id);
      expect(processedJob?.status).toBe("failed");
      expect(processedJob?.error).toContain("No handler registered");
    });

    it("should process jobs by priority", async () => {
      const processed: string[] = [];

      queue.registerHandler("priority-job", async (job: Job<{ name: string }>) => {
        processed.push(job.data.name);
        return { success: true };
      });

      await queue.add("priority-job", { name: "low" }, { priority: 1 });
      await queue.add("priority-job", { name: "high" }, { priority: 10 });
      await queue.add("priority-job", { name: "medium" }, { priority: 5 });

      await queue.process();

      expect(processed[0]).toBe("high");
    });

    it("should not process scheduled jobs before their time", async () => {
      queue.registerHandler("scheduled-job", async () => ({
        success: true,
      }));

      const futureDate = new Date(Date.now() + 60000);
      const job = await queue.add("scheduled-job", {}, { scheduledFor: futureDate });

      await queue.process();

      expect(queue.getJob(job.id)?.status).toBe("pending");
    });
  });

  describe("getJobsByType", () => {
    it("should return jobs of a specific type", async () => {
      await queue.add("type-a", {});
      await queue.add("type-b", {});
      await queue.add("type-a", {});

      const typeAJobs = queue.getJobsByType("type-a");
      expect(typeAJobs.length).toBe(2);
    });
  });

  describe("getJobsByStatus", () => {
    it("should return jobs with a specific status", async () => {
      queue.registerHandler("status-job", async () => ({ success: true }));

      await queue.add("status-job", {});
      await queue.add("status-job", {});

      const pendingBefore = queue.getJobsByStatus("pending");
      expect(pendingBefore.length).toBe(2);

      await queue.process();

      const completedAfter = queue.getJobsByStatus("completed");
      expect(completedAfter.length).toBe(2);
    });
  });

  describe("getStats", () => {
    it("should return queue statistics", async () => {
      queue.registerHandler("stats-job", async () => ({ success: true }));

      await queue.add("stats-job", {});
      await queue.add("stats-job", {});

      const statsBefore = queue.getStats();
      expect(statsBefore.total).toBe(2);
      expect(statsBefore.pending).toBe(2);

      await queue.process();

      const statsAfter = queue.getStats();
      expect(statsAfter.completed).toBe(2);
    });
  });

  describe("clear", () => {
    it("should clear all jobs", async () => {
      await queue.add("clear-job", {});
      await queue.add("clear-job", {});

      queue.clear();

      expect(queue.getStats().total).toBe(0);
    });
  });
});
