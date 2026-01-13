/**
 * WhatsApp Profile Functions
 */

import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import type { WASession } from './types.js';
import { SessionNotConnectedError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * Get my profile
 */
export async function getProfile(session: WASession): Promise<{
  id: string;
  name: string;
  about?: string;
  profilePicUrl?: string;
}> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const info = session.client.info;
  let profilePicUrl: string | undefined;
  let about: string | undefined;

  try {
    profilePicUrl = await session.client.getProfilePicUrl(info.wid._serialized);
  } catch {
    // May not have profile pic
  }

  try {
    about = await session.client.getState() as unknown as string; // Placeholder
  } catch {
    // May not be available
  }

  return {
    id: info.wid._serialized,
    name: info.pushname,
    about,
    profilePicUrl,
  };
}

/**
 * Set profile display name
 */
export async function setProfileName(session: WASession, name: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  await session.client.setDisplayName(name);
  
  logger.info({ sessionId: session.sessionId }, 'Profile name updated');
}

/**
 * Set profile about/status text
 */
export async function setProfileAbout(session: WASession, about: string): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  await session.client.setStatus(about);
  
  logger.info({ sessionId: session.sessionId }, 'Profile about updated');
}

/**
 * Set profile picture
 */
export async function setProfilePicture(
  session: WASession,
  imageUrl?: string,
  imageBase64?: string
): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
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

  await session.client.setProfilePicture(media);
  
  logger.info({ sessionId: session.sessionId }, 'Profile picture updated');
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture(session: WASession): Promise<void> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  await session.client.deleteProfilePicture();
  
  logger.info({ sessionId: session.sessionId }, 'Profile picture removed');
}

/**
 * Get business profile
 */
export async function getBusinessProfile(session: WASession): Promise<{
  id: string;
  isBusiness: boolean;
  description?: string;
  email?: string;
  website?: string[];
  categories?: string[];
}> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const info = session.client.info;
  
  try {
    const contact = await session.client.getContactById(info.wid._serialized);
    
    // Cast to access business profile properties that may not be in types
    const contactAny = contact as unknown as {
      isBusiness: boolean;
      businessProfile?: {
        description?: string;
        email?: string;
        website?: string[];
        categories?: Array<{ name: string }>;
      };
    };
    
    return {
      id: info.wid._serialized,
      isBusiness: contactAny.isBusiness || false,
      description: contactAny.businessProfile?.description,
      email: contactAny.businessProfile?.email,
      website: contactAny.businessProfile?.website,
      categories: contactAny.businessProfile?.categories?.map((c: { name: string }) => c.name),
    };
  } catch {
    return {
      id: info.wid._serialized,
      isBusiness: false,
    };
  }
}
