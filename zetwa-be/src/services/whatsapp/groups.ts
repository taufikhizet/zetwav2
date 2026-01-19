/**
 * WhatsApp Group Management Functions
 */

import { GroupChat, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import type { WASession, GroupUpdate, GroupSettings } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * Create a new group
 */
export async function createGroup(
  session: WASession,
  name: string,
  participants: string[]
): Promise<{ groupId: string }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const formattedParticipants = participants.map((p) =>
    p.includes('@') ? p : `${p.replace(/\D/g, '')}@c.us`
  );

  const result = await session.client.createGroup(name, formattedParticipants);
  
  const groupId = typeof result === 'string' 
    ? result 
    : (result as { gid: { _serialized: string } }).gid._serialized;
  
  logger.info({ sessionId: session.sessionId, groupId }, 'Group created');
  
  return { groupId };
}

/**
 * Get all groups for session
 */
export async function getGroups(session: WASession): Promise<Array<{
  id: string;
  name: string;
  description: string;
  participantCount: number;
  isReadOnly: boolean;
  timestamp?: number;
}>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chats = await session.client.getChats();
  const groups = chats.filter((chat) => chat.isGroup && chat.id._serialized !== 'status@broadcast') as GroupChat[];

  return groups.map((group) => ({
    id: group.id._serialized,
    name: group.name,
    description: group.description || '',
    participantCount: group.participants?.length || 0,
    isReadOnly: group.isReadOnly || false,
    timestamp: group.timestamp,
  }));
}

/**
 * Get group info by ID
 */
export async function getGroupInfo(
  session: WASession,
  groupId: string
): Promise<{
  id: string;
  name: string;
  description: string;
  owner: string;
  participants: Array<{ id: string; isAdmin: boolean; isSuperAdmin: boolean }>;
  createdAt?: number;
  inviteCode?: string;
}> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  
  let inviteCode: string | undefined;
  try {
    inviteCode = await group.getInviteCode();
  } catch {
    // May not have permission
  }

  return {
    id: group.id._serialized,
    name: group.name,
    description: group.description || '',
    owner: group.owner?._serialized || '',
    participants: group.participants.map((p) => ({
      id: p.id._serialized,
      isAdmin: p.isAdmin || false,
      isSuperAdmin: p.isSuperAdmin || false,
    })),
    createdAt: group.createdAt?.getTime(),
    inviteCode,
  };
}

/**
 * Update group name/description
 */
export async function updateGroup(
  session: WASession,
  groupId: string,
  updates: GroupUpdate
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;

  if (updates.name) {
    await group.setSubject(updates.name);
  }

  if (updates.description !== undefined) {
    await group.setDescription(updates.description);
  }

  logger.info({ sessionId: session.sessionId, groupId }, 'Group updated');
}

/**
 * Update group settings (announce, restrict)
 */
export async function updateGroupSettings(
  session: WASession,
  groupId: string,
  settings: GroupSettings
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;

  if (settings.announce !== undefined) {
    await group.setMessagesAdminsOnly(settings.announce);
  }

  if (settings.restrict !== undefined) {
    await group.setInfoAdminsOnly(settings.restrict);
  }

  logger.info({ sessionId: session.sessionId, groupId }, 'Group settings updated');
}

/**
 * Get group participants
 */
export async function getGroupParticipants(
  session: WASession,
  groupId: string
): Promise<Array<{ id: string; isAdmin: boolean; isSuperAdmin: boolean }>> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;

  return group.participants.map((p) => ({
    id: p.id._serialized,
    isAdmin: p.isAdmin || false,
    isSuperAdmin: p.isSuperAdmin || false,
  }));
}

/**
 * Add participants to group
 */
export async function addGroupParticipants(
  session: WASession,
  groupId: string,
  participants: string[]
): Promise<{ success: string[]; failed: string[] }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  const formattedParticipants = participants.map((p) =>
    p.includes('@') ? p : `${p.replace(/\D/g, '')}@c.us`
  );

  const result = await group.addParticipants(formattedParticipants);
  
  logger.info({ sessionId: session.sessionId, groupId, count: formattedParticipants.length }, 'Participants added');

  const success: string[] = [];
  const failed: string[] = [];
  
  if (result && typeof result === 'object') {
    for (const [id, status] of Object.entries(result)) {
      if ((status as { code?: number })?.code === 200) {
        success.push(id);
      } else {
        failed.push(id);
      }
    }
  }

  return { success, failed };
}

/**
 * Remove participants from group
 */
export async function removeGroupParticipants(
  session: WASession,
  groupId: string,
  participants: string[]
): Promise<{ success: string[]; failed: string[] }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  const formattedParticipants = participants.map((p) =>
    p.includes('@') ? p : `${p.replace(/\D/g, '')}@c.us`
  );

  const result = await group.removeParticipants(formattedParticipants);
  
  logger.info({ sessionId: session.sessionId, groupId, count: formattedParticipants.length }, 'Participants removed');

  const success: string[] = [];
  const failed: string[] = [];
  
  if (result && typeof result === 'object') {
    for (const [id, status] of Object.entries(result)) {
      if ((status as { code?: number })?.code === 200) {
        success.push(id);
      } else {
        failed.push(id);
      }
    }
  }

  return { success, failed };
}

/**
 * Promote participants to admin
 */
export async function promoteParticipants(
  session: WASession,
  groupId: string,
  participants: string[]
): Promise<{ success: boolean }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  const formattedParticipants = participants.map((p) =>
    p.includes('@') ? p : `${p.replace(/\D/g, '')}@c.us`
  );

  await group.promoteParticipants(formattedParticipants);
  
  logger.info({ sessionId: session.sessionId, groupId, count: formattedParticipants.length }, 'Participants promoted');

  return { success: true };
}

/**
 * Demote participants from admin
 */
export async function demoteParticipants(
  session: WASession,
  groupId: string,
  participants: string[]
): Promise<{ success: boolean }> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  const formattedParticipants = participants.map((p) =>
    p.includes('@') ? p : `${p.replace(/\D/g, '')}@c.us`
  );

  await group.demoteParticipants(formattedParticipants);
  
  logger.info({ sessionId: session.sessionId, groupId, count: formattedParticipants.length }, 'Participants demoted');

  return { success: true };
}

/**
 * Leave a group
 */
export async function leaveGroup(session: WASession, groupId: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  await group.leave();
  
  logger.info({ sessionId: session.sessionId, groupId }, 'Left group');
}

/**
 * Get group invite code
 */
export async function getGroupInviteCode(session: WASession, groupId: string): Promise<string> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  return group.getInviteCode();
}

/**
 * Revoke group invite code
 */
export async function revokeGroupInvite(session: WASession, groupId: string): Promise<string> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  const group = chat as GroupChat;
  const result = await group.revokeInvite();
  return typeof result === 'string' ? result : await group.getInviteCode();
}

/**
 * Join group via invite code
 */
export async function joinGroup(session: WASession, inviteCode: string): Promise<string> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const code = inviteCode.replace('https://chat.whatsapp.com/', '');
  const groupId = await session.client.acceptInvite(code);
  
  logger.info({ sessionId: session.sessionId, groupId }, 'Joined group via invite');
  
  return groupId;
}

/**
 * Set group picture
 */
export async function setGroupPicture(
  session: WASession,
  groupId: string,
  imageUrl?: string,
  imageBase64?: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const chat = await session.client.getChatById(groupId);
  
  if (!chat.isGroup) {
    throw new BadRequestError('Chat is not a group');
  }

  let media: MessageMedia;

  if (imageUrl) {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimetype = response.headers['content-type'] || 'image/jpeg';
    media = new MessageMedia(mimetype, base64);
  } else if (imageBase64) {
    media = new MessageMedia('image/jpeg', imageBase64);
  } else {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }

  const group = chat as GroupChat;
  await group.setPicture(media);
  
  logger.info({ sessionId: session.sessionId, groupId }, 'Group picture updated');
}
