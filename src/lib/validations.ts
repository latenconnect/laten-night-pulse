import { z } from 'zod';

// ============================================
// AUTH VALIDATION SCHEMAS (iOS App Store Compliant)
// ============================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================
// PROFILE VALIDATION SCHEMAS
// ============================================

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Name can only contain letters, numbers, spaces, and - _ .');

export const bioSchema = z
  .string()
  .trim()
  .max(500, 'Bio must be less than 500 characters')
  .optional();

export const profileUpdateSchema = z.object({
  display_name: displayNameSchema.optional(),
  bio: bioSchema,
  city: z.string().max(100).optional(),
  avatar_url: z.string().url().max(2048).optional().nullable(),
});

// ============================================
// EVENT VALIDATION SCHEMAS
// ============================================

export const eventNameSchema = z
  .string()
  .trim()
  .min(3, 'Event name must be at least 3 characters')
  .max(100, 'Event name must be less than 100 characters');

export const eventDescriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Description must be less than 2000 characters')
  .optional();

export const eventLocationSchema = z
  .string()
  .trim()
  .min(2, 'Location name is required')
  .max(200, 'Location name must be less than 200 characters');

export const eventPriceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(100000, 'Price seems too high');

export const eventAgeLimitSchema = z
  .number()
  .min(18, 'Minimum age must be at least 18')
  .max(99, 'Age limit must be less than 99');

export const createEventSchema = z.object({
  name: eventNameSchema,
  description: eventDescriptionSchema,
  type: z.enum(['club', 'house_party', 'university', 'festival', 'public']),
  location_name: eventLocationSchema,
  location_address: z.string().max(300).optional(),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  city: z.string().max(100),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  price: eventPriceSchema.optional(),
  age_limit: eventAgeLimitSchema.optional(),
  max_attendees: z.number().min(1).max(100000).optional(),
  safety_rules: z.string().max(1000).optional(),
  cover_image: z.string().url().max(2048).optional(),
});

// ============================================
// REPORT VALIDATION SCHEMAS
// ============================================

export const reportReasonSchema = z
  .string()
  .trim()
  .min(10, 'Please provide more detail about the issue')
  .max(500, 'Reason must be less than 500 characters');

export const createReportSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  reason: reportReasonSchema,
  description: z.string().max(2000).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

// ============================================
// SEARCH & FILTER VALIDATION
// ============================================

export const searchQuerySchema = z
  .string()
  .trim()
  .max(100, 'Search query too long')
  .transform((val) => val.replace(/[<>{}]/g, '')); // Basic XSS prevention

// ============================================
// HELPER FUNCTIONS
// ============================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}

// Sanitize string for safe display (prevent XSS)
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate URL is safe (no javascript: or data: protocols)
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
