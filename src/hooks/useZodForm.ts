import { useForm, type UseFormProps, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Hook para criar formulários com validação Zod
 * VIO-825 - Unificar arquitetura de formulários
 * 
 * @example
 * const schema = z.object({
 *   name: z.string().min(1, "Nome é obrigatório"),
 *   email: z.string().email("Email inválido"),
 * });
 * 
 * const { register, handleSubmit, errors } = useZodForm({
 *   schema,
 *   defaultValues: { name: "", email: "" },
 * });
 */
export function useZodForm<T extends FieldValues>(
  props: Omit<UseFormProps<T>, "resolver"> & {
    schema: z.ZodType;
  }
) {
  const { schema, ...formProps } = props;

  const form = useForm<T>({
    ...formProps,
    // @ts-expect-error - Zod 4 compatibility with hookform resolver
    resolver: zodResolver(schema),
  });

  return {
    ...form,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
  };
}

export { z };
