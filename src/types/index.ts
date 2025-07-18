import { Request, Response, NextFunction } from 'express';
import { Pool, PoolClient } from 'pg';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class related types (simplified without templates)
export interface Class extends BaseEntity {
  name: string;
  description?: string;
  instructorId: string;
  classType: string;
  classDate: Date;
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
  classType: string;
  classDate: Date;
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

// Booking related types (1NF compliant - no redundant member data)
export interface Booking extends BaseEntity {
  classId: string;
  memberId: string;
  participationDate: Date;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  attendedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  // Member information from JOINs (not stored in bookings table)
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
}

export interface CreateBookingRequest {
  classId: string;
  memberId: string;
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
  memberId?: string;
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
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Analytics types for comprehensive business intelligence
export interface ClassPerformanceAnalytics {
  topClasses: Array<{
    classId: string;
    className: string;
    classType: string;
    instructorName: string;
    bookingCount: number;
    maxCapacity: number;
    fillRate: number;
    attendedCount: number;
    noShowCount: number;
    attendanceRate: number;
    cancellationRate: number;
    classDate: string;
    startTime: string;
    endTime: string;
  }>;
  averageMetrics: {
    fillRate: number;
    attendanceRate: number;
    noShowRate: number;
    cancellationRate: number;
  };
  classTypeBreakdown: Array<{
    classType: string;
    totalClasses: number;
    totalBookings: number;
    avgFillRate: number;
    avgAttendanceRate: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface MemberEngagementAnalytics {
  activeMembers: Array<{
    memberId: string;
    memberName: string;
    memberEmail: string;
    membershipType: string;
    membershipStatus: string;
    totalBookings: number;
    attendedBookings: number;
    noShowBookings: number;
    cancelledBookings: number;
    attendanceRate: number;
    activeWeeks: number;
    classTypesTried: number;
    lastBookingDate: string;
    firstBookingDate: string;
    weeksSinceFirstBooking: number;
  }>;
  retention: {
    totalMembers: number;
    activeMembers: number;
    recentMembers: number;
    veryRecentMembers: number;
    newMembers90d: number;
    retainedMembers30d: number;
    retentionRate30d: number;
    engagementRate30d: number;
  };
  membershipBreakdown: Array<{
    membershipType: string;
    totalMembers: number;
    totalBookings: number;
    avgAttendanceRate: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface TimeBasedTrendAnalytics {
  weeklyTrends: Array<{
    weekStart: string;
    totalBookings: number;
    totalClasses: number;
    uniqueMembers: number;
    uniqueInstructors: number;
    avgFillRate: number;
    avgAttendanceRate: number;
  }>;
  monthlyTrends: Array<{
    monthStart: string;
    totalBookings: number;
    totalClasses: number;
    uniqueMembers: number;
    avgFillRate: number;
  }>;
  peakHours: Array<{
    hour: number;
    bookingCount: number;
    classCount: number;
    uniqueMembers: number;
    classTypes: number;
    avgFillRate: number;
    avgAttendanceRate: number;
  }>;
  dayOfWeekDemand: Array<{
    dayOfWeek: number;
    dayName: string;
    bookingCount: number;
    classCount: number;
    classTypes: number;
    uniqueMembers: number;
    uniqueInstructors: number;
    avgFillRate: number;
    avgAttendanceRate: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface OperationalMetricsAnalytics {
  capacityMetrics: {
    totalClasses: number;
    totalCapacity: number;
    upcomingClasses: number;
    pastClasses: number;
    activeClasses: number;
    cancelledClasses: number;
    completedClasses: number;
    totalBookings: number;
    overallCapacityUtilization: number;
  };
  fillRateDistribution: Array<{
    category: string;
    classCount: number;
    percentage: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ComprehensiveAnalytics {
  classPerformance: ClassPerformanceAnalytics;
  memberEngagement: MemberEngagementAnalytics;
  timeBasedTrends: TimeBasedTrendAnalytics;
  operationalMetrics: OperationalMetricsAnalytics;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

// Legacy statistics types (for backward compatibility)
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

// Request types
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

// Logging types
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

// Utility types
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
export type TransactionCallback<T = any> = (client: PoolClient) => Promise<T>; 