
import type { WASession } from './types.js';
import { SessionNotConnectedError } from '../../utils/errors.js';
import type { Contact } from 'whatsapp-web.js';

export interface LidToPhoneNumber {
  lid: string;
  pn: string | null;
}

/**
 * Get all known LIDs
 */
export async function getAllLids(session: WASession): Promise<LidToPhoneNumber[]> {
  if (session.status !== 'CONNECTED') {
    throw new SessionNotConnectedError(session.sessionId);
  }

  const contacts = await session.client.getContacts();
  // Filter for LIDs (usually end in @lid or have server 'lid')
  // In WWebJS, id is object { server, user, _serialized }
  const lids = contacts.filter((c: Contact) => c.id.server === 'lid' || c.id._serialized.endsWith('@lid'));

  return lids.map((c: Contact) => ({
    lid: c.id._serialized,
    pn: c.number || c.id.user // Fallback if number is not directly available
  }));
}

/**
 * Get LIDs count
 */
export async function getLidsCount(session: WASession): Promise<number> {
    const lids = await getAllLids(session);
    return lids.length;
}

/**
 * Find PN by LID
 */
export async function findPNByLid(session: WASession, lid: string): Promise<LidToPhoneNumber> {
    if (session.status !== 'CONNECTED') {
        throw new SessionNotConnectedError(session.sessionId);
    }
    
    // Normalize LID
    const formattedLid = lid.includes('@') ? lid : `${lid}@lid`;
    
    try {
        const contact = await session.client.getContactById(formattedLid);
        return {
            lid: formattedLid,
            pn: contact.number || null
        };
    } catch (e) {
        return {
            lid: formattedLid,
            pn: null
        };
    }
}

/**
 * Find LID by Phone Number
 */
export async function findLIDByPhoneNumber(session: WASession, phoneNumber: string): Promise<LidToPhoneNumber> {
    if (session.status !== 'CONNECTED') {
        throw new SessionNotConnectedError(session.sessionId);
    }
    
    // This is tricky in WWebJS without a direct mapping if not stored.
    // We try to find the contact and see if it has a linked LID, or iterate.
    // WWebJS Contact object doesn't always link back to LID directly unless synced.
    // For now, we iterate all LIDs to find a match on the number/user part if possible, 
    // or return null if not found. 
    // Optimization: This might be slow for many contacts.
    
    const targetUser = phoneNumber.replace(/\D/g, '');
    const lids = await getAllLids(session);
    
    const found = lids.find(l => l.pn === targetUser);
    
    if (found) {
        return found;
    }

    return {
        lid: null as any, // Type hack if strict
        pn: targetUser
    };
}
