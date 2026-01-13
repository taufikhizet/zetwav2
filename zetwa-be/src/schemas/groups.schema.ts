import { z } from 'zod';

// Create group schema
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  participants: z.array(z.string().min(1)).min(1, 'At least one participant is required'),
});

// Update group schema
export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(512).optional(),
});

// Update group settings schema
export const updateGroupSettingsSchema = z.object({
  announce: z.boolean().optional(), // Only admins can send messages
  restrict: z.boolean().optional(), // Only admins can edit group info
});

// Manage participants schema
export const manageParticipantsSchema = z.object({
  participants: z.array(z.string().min(1)).min(1, 'At least one participant is required'),
});

// Group ID param validation
export const groupIdSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
});

// Type exports
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type UpdateGroupSettingsInput = z.infer<typeof updateGroupSettingsSchema>;
export type ManageParticipantsInput = z.infer<typeof manageParticipantsSchema>;
