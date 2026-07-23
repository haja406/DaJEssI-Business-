import { z } from "zod";

export const farmerSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().optional().or(z.literal("")),
  village: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  itemsSupplied: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  customerType: z.enum(["individual", "wholesaler", "retailer", "institution"]),
  notes: z.string().optional().or(z.literal("")),
});

export const purchaseSchema = z.object({
  purchaseNumber: z.string().min(1, "Le numéro d'achat est requis"),
  date: z.string().min(1, "La date est requise"),
  farmerId: z.string().optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  riceType: z.string().min(1, "Le type de riz est requis"),
  quantityKg: z.number({ invalid_type_error: "Quantité requise" }).positive(),
  unitPrice: z.number({ invalid_type_error: "Prix requis" }).positive(),
  paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]),
  amountPaid: z.number().min(0).optional(),
  warehouseId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const saleSchema = z.object({
  invoiceNumber: z.string().min(1, "Le numéro de facture est requis"),
  date: z.string().min(1, "La date est requise"),
  customerId: z.string().optional().or(z.literal("")),
  riceType: z.string().min(1, "Le type de riz est requis"),
  quantityKg: z.number({ invalid_type_error: "Quantité requise" }).positive(),
  unitPrice: z.number({ invalid_type_error: "Prix requis" }).positive(),
  discount: z.number().min(0).optional(),
  costPerKg: z.number().min(0).optional(),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CREDIT"]),
  warehouseId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const warehouseSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  location: z.string().optional().or(z.literal("")),
  capacityKg: z.number().min(0),
  lowStockThresholdKg: z.number().min(0),
});

export const stockMovementSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  warehouseId: z.string().min(1, "L'entrepôt est requis"),
  type: z.enum(["ENTRY", "EXIT"]),
  riceType: z.string().min(1),
  quantityKg: z.number({ invalid_type_error: "Quantité requise" }).positive(),
  reason: z.string().optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  category: z.enum(["TRANSPORT", "SALARY", "FUEL", "ELECTRICITY", "RENT", "MAINTENANCE", "OTHER"]),
  description: z.string().min(2, "La description est requise"),
  amount: z.number({ invalid_type_error: "Montant requis" }).positive(),
  notes: z.string().optional().or(z.literal("")),
});

export const incomeSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  source: z.enum(["SALES", "OTHER"]),
  description: z.string().min(2, "La description est requise"),
  amount: z.number({ invalid_type_error: "Montant requis" }).positive(),
  notes: z.string().optional().or(z.literal("")),
});
