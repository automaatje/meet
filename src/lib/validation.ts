import { z } from 'zod';

const phoneRegex = /^(\+31|0)[1-9]\d{8}$/;
const postalCodeRegex = /^\d{4}\s?[A-Z]{2}$/i;

export const customerSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(100, 'Naam mag maximaal 100 tekens bevatten'),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(phoneRegex, 'Ongeldig Nederlands telefoonnummer (bijv. 06-12345678 of +31612345678)')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Adres mag maximaal 200 tekens bevatten').optional(),
  city: z.string().max(100, 'Plaats mag maximaal 100 tekens bevatten').optional(),
  postal_code: z
    .string()
    .regex(postalCodeRegex, 'Ongeldige postcode (bijv. 1234 AB)')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(1000, 'Notities mogen maximaal 1000 tekens bevatten').optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Titel is verplicht').max(200, 'Titel mag maximaal 200 tekens bevatten'),
  address: z.string().min(1, 'Adres is verplicht').max(200, 'Adres mag maximaal 200 tekens bevatten'),
  description: z.string().max(2000, 'Beschrijving mag maximaal 2000 tekens bevatten').optional(),
  status: z.enum(['lead', 'in_progress', 'won', 'lost']),
});

export const measurementSchema = z.object({
  room_name: z.string().min(1, 'Kamer naam is verplicht').max(100, 'Kamer naam mag maximaal 100 tekens bevatten'),
  length_m: z.number().min(0.1, 'Lengte moet minimaal 0.1m zijn').max(100, 'Lengte mag maximaal 100m zijn'),
  width_m: z.number().min(0.1, 'Breedte moet minimaal 0.1m zijn').max(100, 'Breedte mag maximaal 100m zijn'),
  height_m: z.number().min(0.1, 'Hoogte moet minimaal 0.1m zijn').max(100, 'Hoogte mag maximaal 100m zijn'),
  notes: z.string().max(500, 'Notities mogen maximaal 500 tekens bevatten').optional(),
});

export const priceTemplateSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht').max(100, 'Naam mag maximaal 100 tekens bevatten'),
  description: z.string().max(500, 'Beschrijving mag maximaal 500 tekens bevatten').optional(),
  default_material_price_m2: z.number().min(0, 'Prijs moet positief zijn').max(1000, 'Prijs mag maximaal €1000/m² zijn'),
  default_labor_price_m2: z.number().min(0, 'Prijs moet positief zijn').max(1000, 'Prijs mag maximaal €1000/m² zijn'),
  default_waste_percentage: z.number().min(0, 'Percentage moet positief zijn').max(100, 'Percentage mag maximaal 100% zijn'),
});

export const settingsSchema = z.object({
  company_name: z.string().min(1, 'Bedrijfsnaam is verplicht').max(200, 'Bedrijfsnaam mag maximaal 200 tekens bevatten'),
  contact_name: z.string().max(100, 'Contactpersoon mag maximaal 100 tekens bevatten').optional(),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(phoneRegex, 'Ongeldig Nederlands telefoonnummer')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Adres mag maximaal 200 tekens bevatten').optional(),
  city: z.string().max(100, 'Plaats mag maximaal 100 tekens bevatten').optional(),
  postal_code: z
    .string()
    .regex(postalCodeRegex, 'Ongeldige postcode')
    .optional()
    .or(z.literal('')),
  kvk_number: z.string().max(20, 'KVK nummer mag maximaal 20 tekens bevatten').optional(),
  btw_number: z.string().max(20, 'BTW nummer mag maximaal 20 tekens bevatten').optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type MeasurementFormData = z.infer<typeof measurementSchema>;
export type PriceTemplateFormData = z.infer<typeof priceTemplateSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
