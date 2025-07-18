import { CreateClassRequest, UpdateClassRequest, Class as ClassType, CreateBookingRequest, Booking as BookingType } from '../../src/types';

/**
 * Test helper utilities to eliminate redundancy across all test files
 * Provides consistent test data, mock responses, and validation helpers
 * Note: Validation helpers use 'any' type for expect to avoid Jest import issues
 */

// Helper function to get future dates
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]!;
};

// Common test data constants
export const TEST_CONSTANTS = {
  INSTRUCTOR_ID: '123e4567-e89b-12d3-a456-426614174000',
  INSTRUCTOR_NAME: 'Test Instructor',
  MEMBER_ID: '456e7890-e89b-12d3-a456-426614174001',
  MEMBER_NAME: 'Test Member',
  MEMBER_EMAIL: 'member@test.com',
  CLASS_NAME: 'Test Yoga Class',
  CLASS_TYPE: 'yoga',
  TEMPLATE_ID: '789e0123-e89b-12d3-a456-426614174002',
  START_DATE: '2024-12-01',
  END_DATE: '2024-12-31',
  CLASS_DATE: getFutureDate(7), // 7 days from now
  PARTICIPATION_DATE: getFutureDate(7), // 7 days from now
  START_TIME: '09:00',
  END_TIME: '10:00',
  DURATION: 60,
  CAPACITY: 20,
  PRICE: 15.00,
  LOCATION: 'Studio A',
  ROOM: 'Yoga Room 1',
  DIFFICULTY: 'beginner' as const,
  EQUIPMENT: ['Yoga Mat', 'Blocks'],
  TAGS: ['yoga', 'beginner', 'wellness']
};

// Minimal required class data for ABC Ignite requirements
export const createMinimalClassData = (overrides: Partial<CreateClassRequest> = {}): CreateClassRequest => ({
  templateId: TEST_CONSTANTS.TEMPLATE_ID,
  name: TEST_CONSTANTS.CLASS_NAME,
  instructorId: TEST_CONSTANTS.INSTRUCTOR_ID,
  classType: TEST_CONSTANTS.CLASS_TYPE,
  classDate: new Date(TEST_CONSTANTS.CLASS_DATE),
  startTime: TEST_CONSTANTS.START_TIME,
  endTime: TEST_CONSTANTS.END_TIME,
  durationMinutes: TEST_CONSTANTS.DURATION,
  maxCapacity: TEST_CONSTANTS.CAPACITY,
  ...overrides
});

// Full class data with all optional fields
export const createFullClassData = (overrides: Partial<CreateClassRequest> = {}): CreateClassRequest => ({
  ...createMinimalClassData(),
  description: 'A comprehensive test yoga class',
  price: TEST_CONSTANTS.PRICE,
  location: TEST_CONSTANTS.LOCATION,
  room: TEST_CONSTANTS.ROOM,
  equipmentNeeded: TEST_CONSTANTS.EQUIPMENT,
  difficultyLevel: TEST_CONSTANTS.DIFFICULTY,
  tags: TEST_CONSTANTS.TAGS,
  ...overrides
});

// Mock database response for class creation
export const createMockClassResponse = (classData: CreateClassRequest, id: string = 'mock-class-id'): ClassType => {
  const result: ClassType = {
    id,
    templateId: classData.templateId,
    name: classData.name,
    instructorId: classData.instructorId || TEST_CONSTANTS.INSTRUCTOR_ID,
    classType: classData.classType,
    classDate: classData.classDate,
    startTime: classData.startTime,
    endTime: classData.endTime,
    durationMinutes: classData.durationMinutes,
    maxCapacity: classData.maxCapacity,
    price: classData.price || 0,
    difficultyLevel: classData.difficultyLevel || 'all_levels',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add optional properties only if they exist
  if (classData.description !== undefined) result.description = classData.description;
  if (classData.location !== undefined) result.location = classData.location;
  if (classData.room !== undefined) result.room = classData.room;
  if (classData.equipmentNeeded !== undefined) result.equipmentNeeded = classData.equipmentNeeded;
  if (classData.tags !== undefined) result.tags = classData.tags;

  return result;
};

// Mock database response for multiple classes
export const createMockClassesResponse = (count: number = 5): ClassType[] => {
  return Array(count).fill(null).map((_, i) => createMockClassResponse(
    createMinimalClassData({
      name: `Test Class ${i + 1}`,
      classType: i % 3 === 0 ? 'yoga' : i % 3 === 1 ? 'pilates' : 'hiit'
    }),
    'mock-class-id'
  ));
};

// Booking test helpers
export const createMinimalBookingData = (overrides: Partial<CreateBookingRequest> = {}): CreateBookingRequest => ({
  classId: TEST_CONSTANTS.TEMPLATE_ID,
  memberId: TEST_CONSTANTS.MEMBER_ID,
  participationDate: TEST_CONSTANTS.PARTICIPATION_DATE,
  ...overrides
});

export const createFullBookingData = (overrides: Partial<CreateBookingRequest> = {}): CreateBookingRequest => ({
  ...createMinimalBookingData(),
  notes: 'Test booking notes',
  ...overrides
});

export const createMockBookingResponse = (bookingData: CreateBookingRequest, id: string = 'mock-booking-id'): BookingType => {
  const result: BookingType = {
    id,
    classId: bookingData.classId,
    memberId: bookingData.memberId,
    memberName: TEST_CONSTANTS.MEMBER_NAME,
    memberEmail: TEST_CONSTANTS.MEMBER_EMAIL,
    participationDate: new Date(bookingData.participationDate),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (bookingData.notes) result.notes = bookingData.notes;

  return result;
};

// Create mock database row format for bookings (matches what the database returns)
export const createMockBookingDatabaseRow = (bookingData: CreateBookingRequest, id: string = 'mock-booking-id') => {
  return {
    id,
    class_id: bookingData.classId,
    member_id: bookingData.memberId,
    member_name: TEST_CONSTANTS.MEMBER_NAME,
    member_email: TEST_CONSTANTS.MEMBER_EMAIL,
    member_phone: TEST_CONSTANTS.MEMBER_EMAIL.replace('@', '-phone'),
    participation_date: bookingData.participationDate,
    notes: bookingData.notes || null,
    status: 'pending',
    attended_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const validateBookingResponse = (response: any, expectedData: Partial<CreateBookingRequest>, expectFn: any) => {
  expectFn(response.body.success).toBe(true);
  expectFn(response.body.data).toBeDefined();
  expectFn(response.body.data.classId).toBe(expectedData.classId);
  expectFn(response.body.data.memberId).toBe(expectedData.memberId);
  expectFn(response.body.data.id).toBeDefined();
};

// Member test helpers
export const createMinimalMemberData = (overrides: Partial<any> = {}) => ({
  name: TEST_CONSTANTS.MEMBER_NAME,
  email: TEST_CONSTANTS.MEMBER_EMAIL,
  ...overrides
});

export const createFullMemberData = (overrides: Partial<any> = {}) => ({
  ...createMinimalMemberData(),
  phone: '123-456-7890',
  dateOfBirth: '1990-01-01',
  membershipType: 'standard' as const,
  emergencyContactName: 'Emergency Contact',
  emergencyContactPhone: '987-654-3210',
  medicalNotes: 'No medical issues',
  ...overrides
});

export const createMockMemberResponse = (memberData: any, id: string = 'mock-member-id') => {
  return {
    id,
    name: memberData.name,
    email: memberData.email,
    phone: memberData.phone,
    dateOfBirth: memberData.dateOfBirth ? new Date(memberData.dateOfBirth) : undefined,
    membershipType: memberData.membershipType || 'standard',
    membershipStatus: 'active',
    emergencyContactName: memberData.emergencyContactName,
    emergencyContactPhone: memberData.emergencyContactPhone,
    medicalNotes: memberData.medicalNotes,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const validateMemberResponse = (response: any, expectedData: Partial<any>, expectFn: any) => {
  expectFn(response.body.success).toBe(true);
  expectFn(response.body.data).toBeDefined();
  expectFn(response.body.data['name']).toBe(expectedData['name']);
  expectFn(response.body.data['email']).toBe(expectedData['email']);
  expectFn(response.body.data.id).toBeDefined();
};

// Mock database query responses
export const createMockDatabaseResponses = () => ({
  insertResponse: (classData: CreateClassRequest) => ({
    rows: [createMockClassResponse(classData)]
  }),
  
  selectResponse: (count: number = 5) => ({
    rows: createMockClassesResponse(count)
  }),
  
  countResponse: (count: number = 50) => ({
    rows: [{ count: count.toString() }]
  }),
  
  emptyResponse: () => ({
    rows: []
  })
});

// Validation helpers - these will be used in test files where expect is available
export const validateClassResponse = (response: any, expectedData: Partial<CreateClassRequest>, expectFn: any) => {
  expectFn(response.body.success).toBe(true);
  expectFn(response.body.data).toBeDefined();
  expectFn(response.body.data.name).toBe(expectedData.name);
  expectFn(response.body.data.instructorId).toBe(expectedData.instructorId);
  expectFn(response.body.data.classType).toBe(expectedData.classType);
  expectFn(response.body.data.id).toBeDefined();
};

export const validateErrorResponse = (response: any, expectedStatus: number, expectFn: any, expectedMessage?: string) => {
  expectFn(response.status).toBe(expectedStatus);
  expectFn(response.body.success).toBe(false);
  if (expectedMessage) {
    expectFn(response.body.message).toContain(expectedMessage);
  }
};

// Test data generators for different scenarios
export const generateTestClasses = (count: number, baseData: Partial<CreateClassRequest> = {}) => {
  return Array(count).fill(null).map((_, i) => createMinimalClassData({
    name: `Generated Class ${i + 1}`,
    classType: ['yoga', 'pilates', 'hiit', 'strength'][i % 4] as string,
    classDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Each class on a different day
    ...baseData
  }));
};

// Performance test helpers
export const measureResponseTime = async (testFunction: () => Promise<any>): Promise<number> => {
  const startTime = Date.now();
  await testFunction();
  return Date.now() - startTime;
};

export const runConcurrentRequests = async (
  requestFunction: () => Promise<any>,
  count: number
): Promise<any[]> => {
  const promises = Array(count).fill(null).map(() => requestFunction());
  return Promise.all(promises);
};

// Database mock setup helper
export const setupDatabaseMock = (mockDatabase: any) => {
  // Clear mocks without importing jest
  if (mockDatabase.query.mockClear) {
    mockDatabase.query.mockClear();
  }
  
  mockDatabase.query.mockImplementation((query: string, params?: any[]) => {
    // Handle conflict check - return empty to indicate no conflict
    if (query.includes('WHERE instructor_id = $1') && query.includes('status = \'active\'')) {
      return Promise.resolve({ rows: [] });
    }
    
    // Handle INSERT INTO classes
    if (query.includes('INSERT INTO classes')) {
      const classData = {
        templateId: params?.[0] || TEST_CONSTANTS.TEMPLATE_ID,
        name: params?.[1] || TEST_CONSTANTS.CLASS_NAME,
        instructorId: params?.[2] || TEST_CONSTANTS.INSTRUCTOR_ID,
        classType: params?.[3] || TEST_CONSTANTS.CLASS_TYPE,
        classDate: params?.[4] || TEST_CONSTANTS.CLASS_DATE,
        startTime: params?.[5] || TEST_CONSTANTS.START_TIME,
        endTime: params?.[6] || TEST_CONSTANTS.END_TIME,
        durationMinutes: params?.[7] || TEST_CONSTANTS.DURATION,
        maxCapacity: params?.[8] || TEST_CONSTANTS.CAPACITY,
        price: params?.[9] || TEST_CONSTANTS.PRICE
      };
      return Promise.resolve({
        rows: [createMockClassResponse(classData as CreateClassRequest, 'mock-class-id')]
      });
    }
    
    // Handle SELECT COUNT(*) for pagination
    if (query.includes('SELECT COUNT(*)')) {
      return Promise.resolve({ rows: [{ count: '50' }] });
    }
    
    // Handle search queries
    if (query.includes('WHERE name ILIKE') || query.includes('WHERE description ILIKE') || query.includes('ILIKE') || query.includes('search')) {
      return Promise.resolve({
        rows: Array(3).fill(null).map((_, i) => createMockClassResponse(
          createMinimalClassData({
            name: `Search Result ${i + 1}`,
            classType: 'yoga'
          }),
          'mock-class-id'
        ))
      });
    }
    
    // Handle SELECT * FROM classes for listing
    if (query.includes('SELECT * FROM classes')) {
      return Promise.resolve({
        rows: Array(5).fill(null).map((_, i) => createMockClassResponse(
          createMinimalClassData({
            name: `Test Class ${i + 1}`,
            classType: i % 3 === 0 ? 'yoga' : i % 3 === 1 ? 'pilates' : 'hiit'
          }),
          'mock-class-id'
        ))
      });
    }
    
    // Handle findById queries
    if (query.includes('WHERE id = $1') || query.includes('WHERE id =')) {
      const requestedId = params?.[0] || 'mock-class-id';
      if (requestedId === 'non-existent-id') {
        return Promise.resolve({ rows: [] }); // Simulate 404
      }
      if (requestedId === 'invalid-id') {
        const error = new Error('Invalid ID');
        // Simulate 400 by throwing
        throw error;
      }
      // Always return 'mock-class-id' if requestedId matches /mock-class-\d+/
      const returnId = /^mock-class-\d+$/.test(requestedId) ? 'mock-class-id' : requestedId;
      return Promise.resolve({
        rows: [createMockClassResponse(
          createMinimalClassData({
            name: 'Test Class',
            classType: 'yoga',
            instructorId: TEST_CONSTANTS.INSTRUCTOR_ID
          }),
          returnId
        )]
      });
    }
    
    // Handle statistics queries
    if (query.includes('statistics') || query.includes('total_classes') || query.includes('COUNT(b.id)')) {
      return Promise.resolve({
        rows: [{
          total_bookings: '50',
          confirmed_bookings: '45',
          attended_bookings: '40',
          cancelled_bookings: '3',
          no_show_bookings: '2',
          attendance_rate: '88.89'
        }]
      });
    }
    
    // Handle time slot queries for statistics
    if (query.includes('start_time') && query.includes('booking_count')) {
      return Promise.resolve({
        rows: [
          { start_time: '09:00', booking_count: '15' },
          { start_time: '10:00', booking_count: '12' },
          { start_time: '11:00', booking_count: '8' }
        ]
      });
    }
    
    // Handle UPDATE queries
    if (query.includes('UPDATE classes')) {
      const classData = {
        templateId: params?.[0] || TEST_CONSTANTS.TEMPLATE_ID,
        name: params?.[1] || 'Updated Class',
        instructorId: params?.[2] || TEST_CONSTANTS.INSTRUCTOR_ID,
        classType: params?.[3] || TEST_CONSTANTS.CLASS_TYPE,
        classDate: params?.[4] || TEST_CONSTANTS.CLASS_DATE,
        startTime: params?.[5] || TEST_CONSTANTS.START_TIME,
        endTime: params?.[6] || TEST_CONSTANTS.END_TIME,
        durationMinutes: params?.[7] || TEST_CONSTANTS.DURATION,
        maxCapacity: params?.[8] || TEST_CONSTANTS.CAPACITY,
        price: params?.[9] || TEST_CONSTANTS.PRICE
      };
      const updateId = params?.[10] && /^mock-class-\d+$/.test(params?.[10]) ? 'mock-class-id' : (params?.[10] || 'mock-class-id');
      if (updateId === 'mock-class-id') {
        // Always return a valid updated class for mock-class-id
        return Promise.resolve({
          rows: [createMockClassResponse({ ...createMinimalClassData(), ...classData }, updateId)]
        });
      }
      // Simulate 404 for non-existent-id
      if (updateId === 'non-existent-id') {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({
        rows: [createMockClassResponse(classData as CreateClassRequest, updateId)]
      });
    }
    
    // Handle DELETE queries
    if (query.toLowerCase().includes('delete from classes')) {
      const requestedId = params?.[0];
      if (requestedId === 'non-existent-id') {
        return Promise.resolve({ rows: [] }); // Simulate 404
      }
      return Promise.resolve({ rows: [{ id: requestedId }] });
    }
    
    // Default response
    return Promise.resolve({ rows: [] });
  });
};

// Common test scenarios
export const TEST_SCENARIOS = {
  VALID_CLASS_CREATION: {
    description: 'Valid class creation with minimal required fields',
    data: createMinimalClassData(),
    expectedStatus: 201
  },
  
  INVALID_MISSING_FIELDS: {
    description: 'Class creation with missing required fields',
    data: { name: 'Test Class' },
    expectedStatus: 400,
    expectedMessage: 'Missing required fields'
  },
  
  INVALID_DATE_RANGE: {
    description: 'Class creation with invalid date range',
    data: createMinimalClassData({
      classDate: new Date('2024-01-01') // Past date
    }),
    expectedStatus: 400,
    expectedMessage: 'Class date must be in the future'
  },
  
  INVALID_CAPACITY: {
    description: 'Class creation with invalid capacity',
    data: createMinimalClassData({ maxCapacity: 0 }),
    expectedStatus: 400,
    expectedMessage: 'Maximum capacity must be greater than 0'
  }
};

// Export all helpers
export default {
  TEST_CONSTANTS,
  createMinimalClassData,
  createFullClassData,
  createMockClassResponse,
  createMockClassesResponse,
  createMockDatabaseResponses,
  validateClassResponse,
  validateErrorResponse,
  generateTestClasses,
  measureResponseTime,
  runConcurrentRequests,
  setupDatabaseMock,
  TEST_SCENARIOS
}; 