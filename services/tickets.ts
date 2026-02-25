import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db, createCollection, createTenantQuery } from './firebase';
import type { Ticket, TicketComment, TicketStatus, TicketPriority, TicketCategory, Profile } from '../types';

// Type definitions for Firestore documents
interface FirestoreTicket extends Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'creator' | 'assignee'> {
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

interface FirestoreComment extends Omit<TicketComment, 'id' | 'created_at' | 'author'> {
  created_at?: Timestamp;
}

// Helper to convert Firestore timestamp to ISO string
const timestampToISO = (timestamp?: Timestamp): string => {
  return timestamp?.toDate().toISOString() || new Date().toISOString();
};

// Get user profile by ID (for populating creator/assignee)
const getUserProfile = async (userId: string): Promise<Profile | undefined> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return undefined;

    const data = userDoc.data();
    return {
      id: userDoc.id,
      tenant_id: data.tenant_id,
      role_id: data.role_id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      email: data.email || '',
      is_active: data.is_active ?? true,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return undefined;
  }
};

// Filter options for ticket queries
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignee_id?: string;
  creator_id?: string;
}

/**
 * Get all tickets for a tenant with optional filters
 */
export const getTickets = async (
  tenantId: string,
  filters?: TicketFilters
): Promise<Ticket[]> => {
  try {
    const ticketsCol = createCollection<FirestoreTicket>('tickets');

    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('tenant_id', '==', tenantId),
      orderBy('created_at', 'desc'),
    ];

    // Add optional filters
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters?.assignee_id) {
      constraints.push(where('assignee_id', '==', filters.assignee_id));
    }
    if (filters?.creator_id) {
      constraints.push(where('creator_id', '==', filters.creator_id));
    }

    const ticketsQuery = query(ticketsCol, ...constraints);
    const snapshot = await getDocs(ticketsQuery);

    // Map documents to Ticket objects with populated profiles
    const tickets = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        // Fetch creator and assignee profiles
        const [creator, assignee] = await Promise.all([
          getUserProfile(data.creator_id),
          data.assignee_id ? getUserProfile(data.assignee_id) : undefined,
        ]);

        return {
          id: docSnapshot.id,
          ...data,
          created_at: timestampToISO(data.created_at),
          updated_at: timestampToISO(data.updated_at),
          sla_deadline: data.sla_deadline,
          creator,
          assignee,
        } as Ticket;
      })
    );

    return tickets;
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

/**
 * Get a single ticket by ID
 */
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    if (!ticketDoc.exists()) return null;

    const data = ticketDoc.data() as FirestoreTicket;

    // Fetch creator and assignee profiles
    const [creator, assignee] = await Promise.all([
      getUserProfile(data.creator_id),
      data.assignee_id ? getUserProfile(data.assignee_id) : undefined,
    ]);

    return {
      id: ticketDoc.id,
      ...data,
      created_at: timestampToISO(data.created_at),
      updated_at: timestampToISO(data.updated_at),
      creator,
      assignee,
    } as Ticket;
  } catch (error) {
    console.error('Error getting ticket:', error);
    throw error;
  }
};

/**
 * Create a new ticket
 */
export const createTicket = async (
  ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>
): Promise<Ticket> => {
  try {
    const ticketsCol = createCollection<FirestoreTicket>('tickets');

    const docRef = await addDoc(ticketsCol, {
      ...ticketData,
      status: ticketData.status || 'routing_pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Fetch the created document to get server timestamps
    const createdDoc = await getDoc(docRef);
    const data = createdDoc.data() as FirestoreTicket;

    return {
      id: docRef.id,
      ...ticketData,
      created_at: timestampToISO(data?.created_at),
      updated_at: timestampToISO(data?.updated_at),
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

/**
 * Update an existing ticket
 */
export const updateTicket = async (
  ticketId: string,
  updates: Partial<Omit<Ticket, 'id' | 'created_at' | 'tenant_id'>>
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);

    await updateDoc(ticketRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

/**
 * Delete a ticket (hard delete)
 */
export const deleteTicket = async (ticketId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tickets', ticketId));
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

/**
 * Get all comments for a ticket
 */
export const getTicketComments = async (ticketId: string): Promise<TicketComment[]> => {
  try {
    const commentsCol = collection(db, 'tickets', ticketId, 'comments');
    const commentsQuery = query(commentsCol, orderBy('created_at', 'asc'));
    const snapshot = await getDocs(commentsQuery);

    const comments = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data() as FirestoreComment;
        const author = await getUserProfile(data.author_id);

        return {
          id: docSnapshot.id,
          ...data,
          created_at: timestampToISO(data.created_at),
          author,
        } as TicketComment;
      })
    );

    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Add a comment to a ticket
 */
export const addComment = async (
  ticketId: string,
  comment: Omit<TicketComment, 'id' | 'created_at' | 'author'>
): Promise<TicketComment> => {
  try {
    const commentsCol = collection(db, 'tickets', ticketId, 'comments');

    const docRef = await addDoc(commentsCol, {
      ...comment,
      created_at: serverTimestamp(),
    });

    // Also update the ticket's updated_at timestamp
    await updateDoc(doc(db, 'tickets', ticketId), {
      updated_at: serverTimestamp(),
      // If this is the first response from support, record the response time
      ...(comment.is_internal === false && {
        first_response_at: serverTimestamp(),
      }),
    });

    const author = await getUserProfile(comment.author_id);

    return {
      id: docRef.id,
      ...comment,
      created_at: new Date().toISOString(),
      author,
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get ticket statistics for a tenant
 */
export const getTicketStats = async (tenantId: string) => {
  try {
    const tickets = await getTickets(tenantId);

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      by_priority: {
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length,
      },
      by_category: {
        hardware: tickets.filter(t => t.category === 'hardware').length,
        software: tickets.filter(t => t.category === 'software').length,
        network: tickets.filter(t => t.category === 'network').length,
        security: tickets.filter(t => t.category === 'security').length,
        access: tickets.filter(t => t.category === 'access').length,
        other: tickets.filter(t => t.category === 'other').length,
      },
    };

    return stats;
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    throw error;
  }
};
