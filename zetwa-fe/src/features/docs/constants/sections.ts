import { 
  Book, 
  Key, 
  MessageSquare, 
  Smartphone, 
  Users, 
  Webhook,
  UsersRound,
  Radio,
  Tag,
  CircleDot,
  UserCircle,
  MessageCirclePlus,
} from 'lucide-react'

export const DOC_SECTIONS = [
  { id: 'quickstart', label: 'Quick Start', icon: Book },
  { id: 'auth', label: 'Authentication', icon: Key },
  { id: 'sessions', label: 'Sessions', icon: Smartphone },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'extended-messages', label: 'Extended Messages', icon: MessageCirclePlus },
  { id: 'contacts', label: 'Contacts & Chats', icon: Users },
  { id: 'groups', label: 'Groups', icon: UsersRound },
  { id: 'presence', label: 'Presence', icon: Radio },
  { id: 'labels', label: 'Labels', icon: Tag },
  { id: 'status', label: 'Status/Stories', icon: CircleDot },
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'apikeys', label: 'API Keys', icon: Key },
] as const

export type DocSectionId = typeof DOC_SECTIONS[number]['id']
