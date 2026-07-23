import type { ReactNode } from "react";

export type FormFieldType = "text" | "number" | "date" | "textarea" | "select";

export interface RelationConfig {
  table: string;
  labelField: string;
  valueField?: string; // defaults to "id"
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  relation?: RelationConfig;
  step?: string;
  optional?: boolean;
}

export interface ColumnConfig<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  exportAccessor?: string;
  className?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}
