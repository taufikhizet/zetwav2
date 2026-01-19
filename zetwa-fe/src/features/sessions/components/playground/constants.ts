import {
  MessageSquare,
  Users,
  Activity,
  Contact2,
  MessageCircle,
  Tag,
  CircleDashed,
} from 'lucide-react'

export const PLAYGROUND_FEATURES = [
  {
    id: 'messaging',
    label: 'Messaging',
    icon: MessageSquare,
    description: 'Send text, media, location, poll, and forward',
  },
  {
    id: 'chats',
    label: 'Chats & History',
    icon: MessageCircle,
    description: 'View chat list and message history',
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Contact2,
    description: 'Manage contacts and check numbers',
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: Users,
    description: 'Manage groups and participants',
  },
  {
    id: 'test-groups',
    label: 'Test Groups',
    icon: Users,
    description: 'Legacy Groups Implementation',
  },
  {
    id: 'labels',
    label: 'Labels',
    icon: Tag,
    description: 'Manage WA Business labels',
  },
  {
    id: 'status',
    label: 'Status / Stories',
    icon: CircleDashed,
    description: 'View and post status updates',
  },
  {
    id: 'system',
    label: 'System',
    icon: Activity,
    description: 'Presence, Status, and Profile',
  },
] as const

export type PlaygroundFeatureId = typeof PLAYGROUND_FEATURES[number]['id'] | 'test-groups'
