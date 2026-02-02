/**
 * Background Jobs Queue System
 * Infraestrutura para processamento assíncrono de tarefas
 * VIO-840 - Integrações Fiscais e Externas
 */

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: unknown;
  scheduledFor?: Date;
  companyId?: string;
}

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JobHandler<T = unknown, R = unknown> {
  (job: Job<T>): Promise<JobResult<R>>;
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

const defaultConfig: QueueConfig = {
  name: "default",
  concurrency: 5,
  maxRetries: 3,
  retryDelay: 5000,
  timeout: 30000,
};

class InMemoryQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  registerHandler<T, R>(type: string, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  async add<T>(
    type: string,
    data: T,
    options: {
      priority?: number;
      maxAttempts?: number;
      scheduledFor?: Date;
      companyId?: string;
    } = {}
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type,
      data,
      status: "pending",
      priority: options.priority ?? 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.maxRetries,
      createdAt: new Date(),
      scheduledFor: options.scheduledFor,
      companyId: options.companyId,
    };

    this.jobs.set(job.id, job as Job);
    return job;
  }

  async process(): Promise<void> {
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => {
        if (job.status !== "pending" && job.status !== "retrying") return false;
        if (job.scheduledFor && job.scheduledFor > new Date()) return false;
        if (this.processing.has(job.id)) return false;
        return true;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.config.concurrency - this.processing.size);

    await Promise.all(pendingJobs.map((job) => this.processJob(job)));
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = "failed";
      job.error = `No handler registered for job type: ${job.type}`;
      return;
    }

    this.processing.add(job.id);
    job.status = "processing";
    job.startedAt = new Date();
    job.attempts++;

    try {
      const timeoutPromise = new Promise<JobResult>((_, reject) => {
        setTimeout(() => reject(new Error("Job timeout")), this.config.timeout);
      });

      const result = await Promise.race([handler(job), timeoutPromise]);

      if (result.success) {
        job.status = "completed";
        job.result = result.data;
        job.completedAt = new Date();
      } else {
        throw new Error(result.error || "Job failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (job.attempts < job.maxAttempts) {
        job.status = "retrying";
        job.error = errorMessage;
        job.scheduledFor = new Date(Date.now() + this.config.retryDelay * job.attempts);
      } else {
        job.status = "failed";
        job.error = errorMessage;
        job.completedAt = new Date();
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getJobsByType(type: string): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.type === type);
  }

  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }

  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retrying: number;
    } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      retrying: jobs.filter((j) => j.status === "retrying").length,
    };
  }

  clear(): void {
    this.jobs.clear();
    this.processing.clear();
  }
}

export const jobQueue = new InMemoryQueue({
  name: "fiscal-jobs",
  concurrency: 3,
  maxRetries: 5,
  retryDelay: 10000,
  timeout: 60000,
});

export { InMemoryQueue };
