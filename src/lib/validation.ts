import { z } from 'zod';

// Email: RFC-ish format, lowercased + trimmed, capped at the standard 254 chars.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

// Password: min 10 chars, must contain letters AND numbers.
// Max 72 bytes because that is bcrypt's hard limit (Supabase truncates beyond).
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(72)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72), // don't reveal policy on login
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  confirm: z.literal('DELETE'),
});

// Org name -> slug is derived server-side; client may suggest one but it is
// re-validated/normalized on the server.
export const createOrgSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const inviteSchema = z.object({
  orgId: z.string().uuid(),
  email: emailSchema,
  role: z.enum(['admin', 'member']), // never invite straight to owner
});

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(200),
});

// ---- projects & tasks ----
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'archived']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const createProjectSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  priority: taskPrioritySchema.default('medium'),
  assignee: z.string().uuid().nullable().optional(),
  dueDate: z.string().date().nullable().optional(), // 'YYYY-MM-DD'
});

export const updateTaskSchema = z
  .object({
    status: taskStatusSchema.optional(),
    title: z.string().trim().min(1).max(200).optional(),
    priority: taskPrioritySchema.optional(),
    assignee: z.string().uuid().nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
