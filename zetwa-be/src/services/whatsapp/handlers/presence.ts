import type { Client } from 'whatsapp-web.js';
import type { ExtendedWASession } from '../store.js';
import { logger } from '../../../utils/logger.js';

interface BinaryNode {
  tag: string;
  attrs: { [key: string]: string };
  content?: BinaryNode[] | string | any[];
}

export function setupPresenceHandlers(client: Client, session: ExtendedWASession) {
  // Initialize store if not exists
  if (!session.presenceStore) {
    session.presenceStore = new Map();
  }

  // Inject hooks when ready
  client.on('ready', () => {
    injectPresenceHooks(client).catch(err => {
      logger.error({ err, sessionId: session.sessionId }, 'Failed to inject presence hooks');
    });
  });

  // Handle tag:presence
  client.on('tag:presence', (node: BinaryNode) => {
    try {
      const presence = TagPresenceToPresence(node);
      updatePresenceStore(session, presence);
    } catch (error) {
      logger.error({ error, sessionId: session.sessionId }, 'Error handling tag:presence');
    }
  });

  // Handle tag:chatstate
  client.on('tag:chatstate', (node: BinaryNode) => {
    try {
      const presence = TagChatstateToPresence(node);
      updatePresenceStore(session, presence);
    } catch (error) {
      logger.error({ error, sessionId: session.sessionId }, 'Error handling tag:chatstate');
    }
  });
}

async function injectPresenceHooks(client: Client) {
  if (!client.pupPage) return;
  
  await client.pupPage.evaluate(() => {
    // @ts-ignore
    if (window.decodeStanzaBack) {
      return;
    }

    const tags = ['receipt', 'presence', 'chatstate'];
    // @ts-ignore
    window.decodeStanzaBack = window.Store.SocketWap.decodeStanza;
    // @ts-ignore
    window.Store.SocketWap.decodeStanza = async (...args) => {
      // @ts-ignore
      const result = await window.decodeStanzaBack(...args);
      if (tags.includes(result?.tag)) {
        // @ts-ignore
        setTimeout(() => window.onTag(result), 0);
      }
      return result;
    };
  });
  logger.info('Presence hooks injected');
}

function updatePresenceStore(session: ExtendedWASession, data: any) {
  if (!session.presenceStore) return;
  
  const current = session.presenceStore.get(data.id) || { id: data.id, presences: [] };
  
  // Merge presences
  data.presences.forEach((newP: any) => {
    const existingIdx = current.presences.findIndex((p: any) => p.participant === newP.participant);
    if (existingIdx >= 0) {
      current.presences[existingIdx] = { ...current.presences[existingIdx], ...newP };
    } else {
      current.presences.push(newP);
    }
  });
  
  session.presenceStore.set(data.id, current);
}

// Helpers
function jid(id: string | undefined): string {
  return id || '';
}

function toCusFormat(id: string): string {
  if (!id) return id;
  // If it's already in serialized format (has @), return it
  if (id.includes('@')) return id;
  // Assume user if not specified
  return `${id}@c.us`; 
}

function TagPresenceToPresence(node: BinaryNode): any {
  const { attrs } = node;
  const id = jid(attrs.from);
  const state =
    attrs.type === 'unavailable'
      ? 'offline'
      : 'online';
  const lastSeen = attrs.last && attrs.last !== 'deny' ? +attrs.last : null;
  return {
    id: toCusFormat(id),
    presences: [
      {
        participant: toCusFormat(id),
        lastKnownPresence: state,
        lastSeen: lastSeen,
      },
    ],
  };
}

function TagChatstateToPresence(node: BinaryNode): any {
  const { attrs, content } = node;
  const id = jid(attrs.from);
  const participant = jid(attrs.participant) || jid(attrs.from);

  const children = Array.isArray(content) ? content : [];
  const firstChild = children[0] as BinaryNode;

  if (!firstChild) return { id: toCusFormat(id), presences: [] };

  const type = firstChild.tag;
  let status = 'offline';

  switch (type) {
    case 'unavailable':
      status = 'offline';
      break;
    case 'available':
      status = 'online';
      break;
    case 'paused':
      status = 'paused';
      break;
    case 'composing':
      status = 'typing';
      break;
  }

  if (firstChild.attrs?.media === 'audio') {
    status = 'recording';
  }

  return {
    id: toCusFormat(id),
    presences: [
      {
        participant: toCusFormat(participant),
        lastKnownPresence: status,
        lastSeen: null,
      },
    ],
  };
}
