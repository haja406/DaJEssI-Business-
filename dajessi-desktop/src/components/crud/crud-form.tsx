
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import type { FormFieldConfig } from "./types";

interface RelationOptionsMap {
  [fieldName: string]: { value: string; label: string }[];
}

interface CrudFormProps {
  fields: FormFieldConfig[];
  schema: ZodType;
  defaultValues: Record<string, unknown>;
  relationOptions: RelationOptionsMap;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function CrudForm({
  fields,
  schema,
  defaultValues,
  relationOptions,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: CrudFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const errorMessage = (errors[field.name]?.message as string) || "";
          const options = field.type === "select" ? field.options ?? relationOptions[field.name] ?? [] : [];

          return (
            <div
              key={field.name}
              className={field.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}
            >
              <Label htmlFor={field.name}>
                {field.label} {!field.optional && <span className="text-destructive">*</span>}
              </Label>

              {field.type === "textarea" && (
                <Textarea id={field.name} placeholder={field.placeholder} {...register(field.name)} />
              )}

              {field.type === "select" && (
                <Select
                  defaultValue={String(defaultValues[field.name] ?? "")}
                  onValueChange={(val) => setValue(field.name, val, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? "Sélectionner..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(field.type === "text" || field.type === "number" || field.type === "date") && (
                <Input
                  id={field.name}
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  {...register(field.name, {
                    valueAsNumber: field.type === "number",
                  })}
                />
              )}

              {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
              {/* keep watch referenced so hidden select values are tracked without unused-var lint issues */}
              {field.type === "select" && watch(field.name) === "__never__" && null}
            </div>
          );
        })}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
