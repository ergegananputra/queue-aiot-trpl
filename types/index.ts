// Database types for Supabase

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Computer {
  id: string;
  name: string;
  description: string | null;
  status: "available" | "occupied" | "maintenance";
  current_user_id: string | null;
  session_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  computer_id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueEntry {
  id: string;
  user_id: string;
  computer_id: string | null;
  position: number;
  status: "waiting" | "ready" | "called" | "expired";
  joined_at: string;
  called_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

// Extended types with relations
export interface ReservationWithRelations extends Reservation {
  user?: User;
  computer?: Computer;
}

export interface QueueEntryWithRelations extends QueueEntry {
  user?: User;
  preferredComputer?: Computer | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Computer status for display
export interface ComputerStatus extends Computer {
  currentReservation?: Reservation | null;
  isOccupied: boolean;
  nextAvailableAt?: string | null;
}

// Queue position info
export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime?: number; // in minutes
  status: QueueEntry["status"];
}

// Notification event types
export type NotificationEvent =
  | { type: "queue_update"; data: QueuePosition }
  | { type: "slot_available"; data: { computerId: string; computerName: string } }
  | { type: "notification"; data: Notification }
  | { type: "computer_status"; data: ComputerStatus[] };

// Booking form data
export interface BookingFormData {
  computerId: string;
  notes?: string;
  startTime: Date;
  endTime: Date;
}

// Time slot availability
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  reservation?: Reservation;
}
