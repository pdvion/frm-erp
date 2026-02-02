/**
 * VIO-817: Enterprise Workflow Engine - useWorkflow Hook
 * 
 * Hook that abstracts workflow execution logic including:
 * - Task completion
 * - Context management
 * - Transition evaluation
 * - Form validation
 */

"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import type { WorkflowContext, FormField } from "@/lib/workflow/engine";
import { validateStepData, mergeContext } from "@/lib/workflow/engine";

export interface UseWorkflowOptions {
  instanceId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface WorkflowState {
  isLoading: boolean;
  isSubmitting: boolean;
  currentStep: {
    id: string;
    name: string;
    type: string;
    formFields: FormField[];
  } | null;
  context: WorkflowContext;
  errors: string[];
}

export interface UseWorkflowReturn {
  state: WorkflowState;
  completeTask: (data: Record<string, unknown>) => Promise<boolean>;
  approveTask: (comments?: string) => Promise<boolean>;
  rejectTask: (reason: string) => Promise<boolean>;
  delegateTask: (toUserId: string, comments?: string) => Promise<boolean>;
  updateContext: (data: Record<string, unknown>) => void;
  validateForm: (data: Record<string, unknown>) => { valid: boolean; errors: string[] };
  refetch: () => void;
}

export function useWorkflow({ instanceId, onComplete, onError }: UseWorkflowOptions): UseWorkflowReturn {
  const [localContext, setLocalContext] = useState<WorkflowContext>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  const { data: instance, isLoading, refetch } = trpc.workflow.getInstance.useQuery(
    { id: instanceId },
    { enabled: !!instanceId }
  );

  const completeTaskMutation = trpc.workflow.completeTask.useMutation({
    onSuccess: () => {
      utils.workflow.getInstance.invalidate({ id: instanceId });
      onComplete?.();
    },
    onError: (error) => {
      setErrors([error.message]);
      onError?.(error.message);
    },
  });

  const approveTaskMutation = trpc.workflow.approveTask.useMutation({
    onSuccess: () => {
      utils.workflow.getInstance.invalidate({ id: instanceId });
      onComplete?.();
    },
    onError: (error) => {
      setErrors([error.message]);
      onError?.(error.message);
    },
  });

  const rejectTaskMutation = trpc.workflow.rejectTask.useMutation({
    onSuccess: () => {
      utils.workflow.getInstance.invalidate({ id: instanceId });
      onComplete?.();
    },
    onError: (error) => {
      setErrors([error.message]);
      onError?.(error.message);
    },
  });

  const delegateTaskMutation = trpc.workflow.delegateTask.useMutation({
    onSuccess: () => {
      utils.workflow.getInstance.invalidate({ id: instanceId });
    },
    onError: (error) => {
      setErrors([error.message]);
      onError?.(error.message);
    },
  });

  const currentStep = instance?.currentStep ? {
    id: instance.currentStep.id,
    name: instance.currentStep.name,
    type: instance.currentStep.type,
    formFields: (instance.currentStep.formFields as unknown as FormField[]) || [],
  } : null;

  const context: WorkflowContext = {
    ...(instance?.context as WorkflowContext || {}),
    ...localContext,
  };

  const validateForm = useCallback((data: Record<string, unknown>) => {
    if (!currentStep?.formFields?.length) {
      return { valid: true, errors: [] };
    }
    return validateStepData(data, currentStep.formFields);
  }, [currentStep?.formFields]);

  const completeTask = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
    setErrors([]);
    
    // Validate form data
    const validation = validateForm(data);
    if (!validation.valid) {
      setErrors(validation.errors);
      return false;
    }

    setIsSubmitting(true);
    try {
      await completeTaskMutation.mutateAsync({
        instanceId,
        data,
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [instanceId, validateForm, completeTaskMutation]);

  const approveTask = useCallback(async (comments?: string): Promise<boolean> => {
    setErrors([]);
    setIsSubmitting(true);
    try {
      await approveTaskMutation.mutateAsync({
        instanceId,
        comments,
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [instanceId, approveTaskMutation]);

  const rejectTask = useCallback(async (reason: string): Promise<boolean> => {
    setErrors([]);
    setIsSubmitting(true);
    try {
      await rejectTaskMutation.mutateAsync({
        instanceId,
        reason,
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [instanceId, rejectTaskMutation]);

  const delegateTask = useCallback(async (toUserId: string, comments?: string): Promise<boolean> => {
    setErrors([]);
    setIsSubmitting(true);
    try {
      await delegateTaskMutation.mutateAsync({
        instanceId,
        toUserId,
        comments,
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [instanceId, delegateTaskMutation]);

  const updateContext = useCallback((data: Record<string, unknown>) => {
    setLocalContext(prev => mergeContext(prev, data));
  }, []);

  return {
    state: {
      isLoading,
      isSubmitting,
      currentStep,
      context,
      errors,
    },
    completeTask,
    approveTask,
    rejectTask,
    delegateTask,
    updateContext,
    validateForm,
    refetch,
  };
}
