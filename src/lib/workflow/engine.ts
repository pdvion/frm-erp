/**
 * VIO-817: Enterprise Workflow Engine - BPMN Execution Engine
 * 
 * This engine handles workflow execution, condition evaluation,
 * and gateway logic for BPMN-compliant workflows.
 */

import { z } from "zod";

// Types for workflow execution
export interface WorkflowContext {
  [key: string]: unknown;
}

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  defaultValue?: unknown;
  required?: boolean;
}

export interface ConditionRule {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "startsWith" | "endsWith" | "in" | "notIn";
  value: unknown;
  logic?: "AND" | "OR";
}

export interface TransitionCondition {
  type: "ALWAYS" | "EXPRESSION" | "DEFAULT";
  expression?: string;
  rules?: ConditionRule[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  code: string;
  name: string;
  positionX: number;
  positionY: number;
  config: Record<string, unknown>;
  formFields?: FormField[];
  validationRules?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
  conditionType: string;
  conditionJson?: TransitionCondition;
  isDefault: boolean;
  priority: number;
  label?: string;
}

export interface FormField {
  name: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "textarea" | "file" | "currency";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  nextStepIds: string[];
  errors?: string[];
  context: WorkflowContext;
}

/**
 * Evaluate a simple expression against context
 * Supports: payload.field > value, payload.field == "string", etc.
 */
export function evaluateExpression(expression: string, context: WorkflowContext): boolean {
  try {
    // Create a safe evaluation context
    const payload = context;
    
    // Replace common operators
    const safeExpr = expression
      .replace(/\bpayload\./g, "ctx.")
      .replace(/\bcontext\./g, "ctx.")
      .replace(/==/g, "===")
      .replace(/!=/g, "!==");
    
    // Simple expression parser for common patterns
    const patterns = [
      // ctx.field > value
      /ctx\.(\w+(?:\.\w+)*)\s*(===|!==|>=|<=|>|<)\s*(.+)/,
      // ctx.field (truthy check)
      /ctx\.(\w+(?:\.\w+)*)/,
    ];
    
    for (const pattern of patterns) {
      const match = safeExpr.match(pattern);
      if (match) {
        const [, fieldPath, operator, value] = match;
        const fieldValue = getNestedValue(payload, fieldPath);
        
        if (operator && value !== undefined) {
          const parsedValue = parseValue(value.trim());
          return compareValues(fieldValue, operator, parsedValue);
        }
        
        // Truthy check
        return Boolean(fieldValue);
      }
    }
    
    return false;
  } catch (error) {
    console.error("Expression evaluation error:", error);
    return false;
  }
}

/**
 * Evaluate condition rules against context
 */
export function evaluateConditionRules(rules: ConditionRule[], context: WorkflowContext): boolean {
  if (!rules || rules.length === 0) return true;
  
  let result = true;
  let currentLogic: "AND" | "OR" = "AND";
  
  for (const rule of rules) {
    const fieldValue = getNestedValue(context, rule.field);
    const ruleResult = evaluateRule(fieldValue, rule.operator, rule.value);
    
    if (currentLogic === "AND") {
      result = result && ruleResult;
    } else {
      result = result || ruleResult;
    }
    
    currentLogic = rule.logic || "AND";
  }
  
  return result;
}

/**
 * Evaluate a single rule
 */
function evaluateRule(fieldValue: unknown, operator: ConditionRule["operator"], value: unknown): boolean {
  switch (operator) {
    case "eq":
      return fieldValue === value;
    case "ne":
      return fieldValue !== value;
    case "gt":
      return Number(fieldValue) > Number(value);
    case "gte":
      return Number(fieldValue) >= Number(value);
    case "lt":
      return Number(fieldValue) < Number(value);
    case "lte":
      return Number(fieldValue) <= Number(value);
    case "contains":
      return String(fieldValue).includes(String(value));
    case "startsWith":
      return String(fieldValue).startsWith(String(value));
    case "endsWith":
      return String(fieldValue).endsWith(String(value));
    case "in":
      return Array.isArray(value) && value.includes(fieldValue);
    case "notIn":
      return Array.isArray(value) && !value.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Parse a value string to its appropriate type
 */
function parseValue(value: string): unknown {
  // String literal
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean
  if (value === "true") return true;
  if (value === "false") return false;
  
  // Null
  if (value === "null") return null;
  
  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  return value;
}

/**
 * Compare two values with an operator
 */
function compareValues(left: unknown, operator: string, right: unknown): boolean {
  switch (operator) {
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    case ">":
      return Number(left) > Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<":
      return Number(left) < Number(right);
    case "<=":
      return Number(left) <= Number(right);
    default:
      return false;
  }
}

/**
 * Determine next steps based on current node type and transitions
 */
export function determineNextSteps(
  currentNode: WorkflowNode,
  transitions: WorkflowEdge[],
  context: WorkflowContext
): string[] {
  const outgoingTransitions = transitions
    .filter(t => t.fromStepId === currentNode.id)
    .sort((a, b) => a.priority - b.priority);
  
  if (outgoingTransitions.length === 0) {
    return [];
  }
  
  // Handle different node types
  switch (currentNode.type) {
    case "GATEWAY_EXCLUSIVE":
      // Exclusive gateway: only one path
      return evaluateExclusiveGateway(outgoingTransitions, context);
    
    case "GATEWAY_PARALLEL":
      // Parallel gateway: all paths
      return outgoingTransitions.map(t => t.toStepId);
    
    case "GATEWAY_INCLUSIVE":
      // Inclusive gateway: all matching paths
      return evaluateInclusiveGateway(outgoingTransitions, context);
    
    default:
      // Regular nodes: evaluate conditions
      return evaluateRegularTransitions(outgoingTransitions, context);
  }
}

/**
 * Evaluate exclusive gateway (XOR) - only first matching condition
 */
function evaluateExclusiveGateway(transitions: WorkflowEdge[], context: WorkflowContext): string[] {
  // First, try to find a matching condition
  for (const transition of transitions) {
    if (transition.isDefault) continue;
    
    if (evaluateTransitionCondition(transition, context)) {
      return [transition.toStepId];
    }
  }
  
  // Fall back to default transition
  const defaultTransition = transitions.find(t => t.isDefault);
  if (defaultTransition) {
    return [defaultTransition.toStepId];
  }
  
  return [];
}

/**
 * Evaluate inclusive gateway (OR) - all matching conditions
 */
function evaluateInclusiveGateway(transitions: WorkflowEdge[], context: WorkflowContext): string[] {
  const matchingSteps: string[] = [];
  
  for (const transition of transitions) {
    if (transition.isDefault) continue;
    
    if (evaluateTransitionCondition(transition, context)) {
      matchingSteps.push(transition.toStepId);
    }
  }
  
  // If no conditions matched, use default
  if (matchingSteps.length === 0) {
    const defaultTransition = transitions.find(t => t.isDefault);
    if (defaultTransition) {
      return [defaultTransition.toStepId];
    }
  }
  
  return matchingSteps;
}

/**
 * Evaluate regular transitions (non-gateway nodes)
 */
function evaluateRegularTransitions(transitions: WorkflowEdge[], context: WorkflowContext): string[] {
  // For regular nodes, usually there's only one outgoing transition
  // or we take the first matching one
  for (const transition of transitions) {
    if (evaluateTransitionCondition(transition, context)) {
      return [transition.toStepId];
    }
  }
  
  return [];
}

/**
 * Evaluate a single transition condition
 */
function evaluateTransitionCondition(transition: WorkflowEdge, context: WorkflowContext): boolean {
  switch (transition.conditionType) {
    case "ALWAYS":
      return true;
    
    case "EXPRESSION":
      if (transition.condition) {
        return evaluateExpression(transition.condition, context);
      }
      return true;
    
    case "DEFAULT":
      return false; // Default is only used as fallback
    
    default:
      // Check conditionJson if available
      if (transition.conditionJson?.rules) {
        return evaluateConditionRules(transition.conditionJson.rules, context);
      }
      return true;
  }
}

/**
 * Merge step data into workflow context
 */
export function mergeContext(
  currentContext: WorkflowContext,
  stepData: Record<string, unknown>
): WorkflowContext {
  return {
    ...currentContext,
    ...stepData,
    _lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate Zod schema from form fields
 */
export function generateZodSchema(fields: FormField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;
    
    switch (field.type) {
      case "number":
      case "currency":
        fieldSchema = z.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max);
        }
        break;
      
      case "date":
        fieldSchema = z.date();
        break;
      
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      
      default:
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, "Campo obrigatório");
        }
        if (field.validation?.minLength !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength);
        }
        if (field.validation?.maxLength !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength);
        }
        if (field.validation?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern));
        }
    }
    
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    shape[field.name] = fieldSchema;
  }
  
  return z.object(shape);
}

/**
 * Validate step data against form fields
 */
export function validateStepData(
  data: Record<string, unknown>,
  fields: FormField[]
): { valid: boolean; errors: string[] } {
  const schema = generateZodSchema(fields);
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}
