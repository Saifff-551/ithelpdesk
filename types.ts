export type RoleId = 'platform_admin' | 'company_admin' | 'it_manager' | 'support_agent' | 'employee';

// Tenant settings configuration
export interface TenantSettings {
  default_ticket_priority: TicketPriority;
  auto_assign_tickets: boolean;
  enable_ai_suggestions: boolean;
  enable_knowledge_base: boolean;
  enable_sla_tracking: boolean;
  working_hours?: {
    start: string;  // "09:00"
    end: string;    // "18:00"
    days: number[]; // [1,2,3,4,5] = Mon-Fri
  };
}

// Default tenant settings
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  default_ticket_priority: 'medium',
  auto_assign_tickets: false,
  enable_ai_suggestions: true,
  enable_knowledge_base: true,
  enable_sla_tracking: true,
  working_hours: {
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
  },
};

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;              // Required: unique subdomain (e.g., "abccorp")
  custom_domain?: string;         // Optional: custom domain (e.g., "help.abccorp.com")
  website_url?: string;           // Company website for AI branding extraction
  logo_url?: string;
  favicon_url?: string;           // Custom favicon
  primary_color: string;
  secondary_color: string;
  accent_color?: string;          // Accent color for highlights
  email_from_name?: string;       // Email sender name
  email_from_address?: string;    // Email sender address
  timezone: string;               // Default timezone
  language: string;               // Default language
  settings: TenantSettings;       // Typed settings
  is_active: boolean;             // Tenant activation status
  subscription_plan?: string;     // Subscription tier
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role_id: RoleId;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  invited_by?: string;
  invited_at?: string;
  created_at?: string;
  tenant?: Tenant;
}

// Invitation for employee onboarding
export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role_id: RoleId;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export type TicketStatus = 'created' | 'routing_pending' | 'routing_in_progress' | 'assigned' | 'degraded_assigned' | 'unassigned' | 'failed' | 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'hardware' | 'software' | 'network' | 'security' | 'access' | 'other';

// Helper arrays for iterating over enums in UI
export const TICKET_STATUSES: TicketStatus[] = ['created', 'routing_pending', 'routing_in_progress', 'assigned', 'degraded_assigned', 'unassigned', 'failed', 'open', 'in_progress', 'resolved', 'closed'];
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
export const TICKET_CATEGORIES: TicketCategory[] = ['hardware', 'software', 'network', 'security', 'access', 'other'];

// Default SLA configuration
export interface DefaultSLA {
  priority: TicketPriority;
  response_hours: number;
  resolution_hours: number;
}

export const DEFAULT_SLAS: DefaultSLA[] = [
  { priority: 'urgent', response_hours: 1, resolution_hours: 4 },
  { priority: 'high', response_hours: 4, resolution_hours: 8 },
  { priority: 'medium', response_hours: 8, resolution_hours: 24 },
  { priority: 'low', response_hours: 24, resolution_hours: 72 },
];

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Ticket {
  id: string;
  tenant_id: string;
  creator_id: string;
  assignee_id?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sla_deadline?: string;
  sla_response_deadline?: string;
  first_response_at?: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  assignee?: Profile;
  attachments?: TicketAttachment[];

  // MATIE AI Intelligence Fields (Patent claims)
  mfis_factors?: {
    expertiseMatch: number;
    availabilityScore: number;
    historicalSuccess: number;
    urgencyMultiplier: number;
  };
  mfis_weights?: {
    w_expertise: number;
    w_availability: number;
    w_historical: number;
    w_urgency: number;
  };
  ai_confidence?: number;
  audit_trace_id?: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: Profile;
}

export interface KnowledgeBaseArticle {
  id: string;
  tenant_id: string;
  author_id: string;
  title: string;
  content: string;
  category?: string;
  is_published: boolean;
  created_at: string;
}

export interface SLA {
  id: string;
  tenant_id: string;
  name: string;
  priority: TicketPriority;
  response_time_hours: number;
  resolution_time_hours: number;
  is_active: boolean;
  created_at?: string;
}
