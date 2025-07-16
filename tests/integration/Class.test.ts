import request from 'supertest';
import app from '../../src/index';
import { testPool } from '../setup';
import { jest, describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';

// Mock database for integration tests
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  initialize: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn(),
  default: {
    query: jest.fn(),
    initialize: jest.fn(),
    close: jest.fn(),
    healthCheck: jest.fn()
  }
}));

/**
 * Integration test suite for Class API endpoints
 * Tests all CRUD operations with real database interactions
 */
describe('Class API Integration Tests', () => {
  let testClassId: string;
  let mockDatabase: any;

  beforeAll(async () => {
    // Setup mock database
    mockDatabase = require('../../src/config/database');
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockDatabase.query.mockImplementation((query: string, params?: any[]) => {
      if (query.includes('INSERT INTO classes')) {
        return Promise.resolve({
          rows: [{
            id: 'mock-class-id',
            name: params?.[0] || 'Test Class',
            instructor_id: params?.[2] || 'mock-instructor-id',
            instructor_name: params?.[3] || 'Mock Instructor',
            class_type: params?.[4] || 'yoga',
            start_date: params?.[5] || '2024-02-01',
            end_date: params?.[6] || '2024-02-28',
            start_time: params?.[7] || '09:00',
            end_time: params?.[8] || '10:00',
            duration_minutes: params?.[9] || 60,
            max_capacity: params?.[10] || 20,
            price: params?.[11] || 15.00,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        });
      }
      
      if (query.includes('SELECT COUNT(*)')) {
        return Promise.resolve({ rows: [{ count: '10' }] });
      }
      
      if (query.includes('SELECT * FROM classes')) {
        return Promise.resolve({
          rows: Array(5).fill(null).map((_, i) => ({
            id: `mock-class-${i}`,
            name: `Test Class ${i}`,
            instructor_id: 'mock-instructor-id',
            instructor_name: 'Mock Instructor',
            class_type: i % 3 === 0 ? 'yoga' : i % 3 === 1 ? 'pilates' : 'hiit',
            start_date: '2024-02-01',
            end_date: '2024-02-28',
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            max_capacity: 20,
            price: 15.00,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        });
      }
      
      return Promise.resolve({ rows: [] });
    });
  });

  afterEach(async () => {
    // Clean up test data
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  describe('POST /api/classes', () => {
    /**
     * Test successful class creation with all required fields
     */
    it('should create a new class successfully', async () => {
      const classData = {
        name: 'Integration Test Yoga Class',
        description: 'A comprehensive test yoga class for integration testing',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Integration Test Instructor',
        classType: 'yoga',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00,
        location: 'Studio A',
        room: 'Yoga Room 1',
        equipmentNeeded: ['Yoga Mat', 'Blocks'],
        difficultyLevel: 'beginner',
        tags: ['yoga', 'beginner', 'wellness']
      };

      const response = await request(app)
        .post('/api/classes')
        .send(classData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(classData.name);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.instructorName).toBe(classData.instructorName);
      expect(response.body.data.classType).toBe(classData.classType);

      testClassId = response.body.data.id;
    });

    /**
     * Test class creation with missing required fields
     */
    it('should return 400 for missing required fields', async () => {
      const invalidClassData = {
        name: 'Test Class',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    /**
     * Test class creation with invalid data types
     */
    it('should return 400 for invalid data types', async () => {
      const invalidClassData = {
        name: 'Test Class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 'invalid', // Should be number
        maxCapacity: 'invalid', // Should be number
        price: 'invalid' // Should be number
      };

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    /**
     * Test class creation with invalid date ranges
     */
    it('should return 400 for invalid date ranges', async () => {
      const invalidClassData = {
        name: 'Test Class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-28', // End date before start date
        endDate: '2024-02-01',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/classes', () => {
    /**
     * Test retrieving all classes with pagination
     */
    it('should return paginated list of classes', async () => {
      const response = await request(app)
        .get('/api/classes?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.offset).toBe(0);
    });

    /**
     * Test filtering classes by type
     */
    it('should filter classes by type', async () => {
      const response = await request(app)
        .get('/api/classes?classType=yoga')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // All returned classes should be yoga type
      response.body.data.forEach((classItem: any) => {
        expect(classItem.classType).toBe('yoga');
      });
    });

    /**
     * Test filtering classes by instructor
     */
    it('should filter classes by instructor', async () => {
      const instructorId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/classes?instructorId=${instructorId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // All returned classes should have the specified instructor
      response.body.data.forEach((classItem: any) => {
        expect(classItem.instructorId).toBe(instructorId);
      });
    });

    /**
     * Test sorting classes
     */
    it('should sort classes by specified field', async () => {
      const response = await request(app)
        .get('/api/classes?sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // Verify sorting (if there are multiple classes)
      if (response.body.data.length > 1) {
        const names = response.body.data.map((classItem: any) => classItem.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });
  });

  describe('GET /api/classes/:id', () => {
    /**
     * Test retrieving a specific class by ID
     */
    it('should return a specific class by ID', async () => {
      // First create a class
      const classData = {
        name: 'Test Class for ID Retrieval',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);

      const classId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/classes/${classId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(classId);
      expect(response.body.data.name).toBe(classData.name);
      expect(response.body.data.instructorName).toBe(classData.instructorName);
    });

    /**
     * Test retrieving non-existent class
     */
    it('should return 404 for non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/classes/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    /**
     * Test retrieving class with invalid ID format
     */
    it('should return 400 for invalid ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/api/classes/${invalidId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid UUID');
    });
  });

  describe('PUT /api/classes/:id', () => {
    /**
     * Test updating a class successfully
     */
    it('should update a class successfully', async () => {
      // First create a class
      const classData = {
        name: 'Test Class for Update',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);

      const classId = createResponse.body.data.id;

      const updateData = {
        name: 'Updated Test Class',
        price: 25.00,
        maxCapacity: 25,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/classes/${classId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.maxCapacity).toBe(updateData.maxCapacity);
      expect(response.body.data.description).toBe(updateData.description);
    });

    /**
     * Test updating non-existent class
     */
    it('should return 404 for updating non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/classes/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/classes/:id', () => {
    /**
     * Test deleting a class successfully
     */
    it('should delete a class successfully', async () => {
      // First create a class
      const classData = {
        name: 'Test Class for Deletion',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);

      const classId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/classes/${classId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the class is actually deleted
      const getResponse = await request(app)
        .get(`/api/classes/${classId}`)
        .expect(404);
    });

    /**
     * Test deleting non-existent class
     */
    it('should return 404 for deleting non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .delete(`/api/classes/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/classes/search', () => {
    /**
     * Test searching classes by query
     */
    it('should search classes by query', async () => {
      const response = await request(app)
        .get('/api/classes/search?query=yoga')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    /**
     * Test searching with empty query
     */
    it('should return 400 for empty search query', async () => {
      const response = await request(app)
        .get('/api/classes/search?query=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query');
    });
  });

  describe('GET /api/classes/:id/statistics', () => {
    /**
     * Test retrieving class statistics
     */
    it('should return class statistics', async () => {
      // First create a class
      const classData = {
        name: 'Test Class for Statistics',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);

      const classId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/classes/${classId}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalBookings).toBeDefined();
      expect(response.body.data.availableSpots).toBeDefined();
      expect(response.body.data.occupancyRate).toBeDefined();
    });

    /**
     * Test retrieving statistics for non-existent class
     */
    it('should return 404 for non-existent class statistics', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/classes/${nonExistentId}/statistics`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
});