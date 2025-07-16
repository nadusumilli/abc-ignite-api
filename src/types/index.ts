import { Request, Response, NextFunction } from 'express';
import { Pool, PoolClient } from 'pg';

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class related types
export interface Class extends BaseEntity {
  name: string;
  description?: string;
  instructorId: string;
  instructorName: string;
  classType: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxCapacity: number;
  price: number;
  location?: string;
  room?: string;
  equipmentNeeded?: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  tags?: string[];
  status: 'active' | 'cancelled' | 'completed' | 'inactive';
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  instructorId: string;
  instructorName: string;
  classType: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxCapacity: number;
  price?: number;
  location?: string;
  room?: string;
  equipmentNeeded?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  tags?: string[];
}

export interface UpdateClassRequest extends Partial<CreateClassRequest> {
  status?: 'active' | 'cancelled' | 'completed' | 'inactive';
}

export interface ClassFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  instructor?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Booking related types
export interface Booking extends BaseEntity {
  classId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  participationDate: Date;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  attendedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface CreateBookingRequest {
  classId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  participationDate: string;
  notes?: string;
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  attendedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface BookingFilters {
  startDate?: string;
  endDate?: string;
  classId?: string;
  memberName?: string;
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Member related types
export interface Member extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  membershipType: 'standard' | 'premium' | 'vip';
  membershipStatus: 'active' | 'inactive' | 'suspended' | 'expired';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export interface CreateMemberRequest {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  membershipType?: 'standard' | 'premium' | 'vip';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export interface UpdateMemberRequest extends Partial<CreateMemberRequest> {
  membershipStatus?: 'active' | 'inactive' | 'suspended' | 'expired';
}

export interface MemberFilters {
  search?: string;
  membershipStatus?: string;
  membershipType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Statistics types
export interface ClassStatistics {
  totalClasses: number;
  activeClasses: number;
  cancelledClasses: number;
  completedClasses: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  attendedBookings: number;
  noShowBookings: number;
  averageAttendance: number;
  attendanceRate: number;
  popularClasses: Array<{
    classId: string;
    className: string;
    bookingCount: number;
  }>;
  popularTimeSlots: Array<{
    timeSlot: string;
    bookingCount: number;
  }>;
}

export interface BookingStatistics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  attendedBookings: number;
  noShowBookings: number;
  attendanceRate: number;
  popularTimeSlots: Array<{
    timeSlot: string;
    bookingCount: number;
  }>;
}

// Search types
export interface SearchQuery {
  q: string;
  type?: 'class' | 'booking' | 'member';
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

// Request augmentation
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  requestId?: string;
  startTime?: number;
  rawBody?: Buffer;
}

// Error types
export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: any;
}

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | {
    rejectUnauthorized: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  max?: number;
  min?: number;
  idle?: number;
  acquire?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  queryTimeout?: number;
  statementTimeout?: number;
  applicationName?: string;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  poolStats: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  lastCheck: Date;
}

export interface QueryOptions {
  timeout?: number;
  rowMode?: 'array' | string;
}

export interface LogLevel {
  error: 0;
  warn: 1;
  info: 2;
  http: 3;
  debug: 4;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
}

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
export type TransactionCallback<T = any> = (client: PoolClient) => Promise<T>; 