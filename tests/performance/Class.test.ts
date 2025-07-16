import request from 'supertest';
import app from '../../src/index';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock database for testing
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
 * Performance test suite for Class API endpoints (mocked DB)
 * Tests response times and throughput under various conditions
 */
describe('Class API Performance Tests (Mocked DB)', () => {
  let mockDatabase: any;

  /**
   * Setup test environment before each test
   */
  beforeEach(() => {
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
        return Promise.resolve({ rows: [{ count: '50' }] });
      }
      
      if (query.includes('SELECT * FROM classes')) {
        return Promise.resolve({
          rows: Array(20).fill(null).map((_, i) => ({
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

  describe('POST /api/classes - Performance', () => {
    /**
     * Test single class creation performance
     * Ensures response time is within acceptable limits
     */
    it('should create class within acceptable response time', async () => {
      const classData = {
        name: 'Performance Test Class',
        description: 'A test class for performance testing',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Performance Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00,
        location: 'Studio A',
        room: 'Yoga Room 1',
        equipmentNeeded: ['Yoga Mat'],
        difficultyLevel: 'beginner',
        tags: ['yoga', 'beginner']
      };

      mockDatabase.query.mockResolvedValueOnce({
        rows: [{
          id: 'mock-id',
          ...classData,
          instructor_id: classData.instructorId,
          instructor_name: classData.instructorName,
          class_type: classData.classType,
          start_date: classData.startDate,
          end_date: classData.endDate,
          start_time: classData.startTime,
          end_time: classData.endTime,
          duration_minutes: classData.durationMinutes,
          max_capacity: classData.maxCapacity,
          price: classData.price,
          location: classData.location,
          room: classData.room,
          equipment_needed: JSON.stringify(classData.equipmentNeeded),
          difficulty_level: classData.difficultyLevel,
          tags: JSON.stringify(classData.tags),
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      });

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/classes')
        .send(classData)
        .expect(201);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
      expect(response.body.data.id).toBeDefined();
    });

    /**
     * Test bulk class creation performance
     * Ensures efficient handling of multiple concurrent requests
     */
    it('should handle bulk class creation efficiently', async () => {
      const classes = [];
      const numClasses = 10;

      for (let i = 0; i < numClasses; i++) {
        classes.push({
          name: `Bulk Test Class ${i + 1}`,
          instructorId: '123e4567-e89b-12d3-a456-426614174000',
          instructorName: 'Bulk Test Instructor',
          classType: 'yoga',
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          startTime: '09:00',
          endTime: '10:00',
          durationMinutes: 60,
          maxCapacity: 20,
          price: 15.00
        });
      }

      const startTime = Date.now();
      
      const promises = classes.map(classData => 
        request(app)
          .post('/api/classes')
          .send(classData)
          .expect(201)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / numClasses;

      expect(responses).toHaveLength(numClasses);
      expect(responses.every(res => res.body.success)).toBe(true);
      expect(averageTime).toBeLessThan(500); // Average should be under 500ms per request
    });
  });

  describe('GET /api/classes - Performance', () => {
    /**
     * Setup test data for performance testing
     */
    beforeEach(async () => {
      // Create test data for performance testing
      const classes = [];
      const numClasses = 50;

      for (let i = 0; i < numClasses; i++) {
        classes.push({
          name: `Performance Test Class ${i + 1}`,
          instructorId: '123e4567-e89b-12d3-a456-426614174000',
          instructorName: 'Performance Test Instructor',
          classType: i % 3 === 0 ? 'yoga' : i % 3 === 1 ? 'pilates' : 'hiit',
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          startTime: '09:00',
          endTime: '10:00',
          durationMinutes: 60,
          maxCapacity: 20,
          price: 15.00
        });
      }

      const promises = classes.map(classData => 
        request(app).post('/api/classes').send(classData)
      );
      await Promise.all(promises);
    });

    /**
     * Test pagination performance with large datasets
     * Ensures efficient handling of paginated requests
     */
    it('should handle pagination efficiently with large datasets', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/classes?limit=20&offset=0')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(20);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(50);
      expect(responseTime).toBeLessThan(500); // Should complete within 500ms
    });

    /**
     * Test filtering performance
     * Ensures efficient filtering of classes by type
     */
    it('should filter classes efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/classes?classType=yoga')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((cls: any) => cls.classType === 'yoga')).toBe(true);
      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });

    /**
     * Test search performance
     * Ensures efficient text-based search functionality
     */
    it('should search classes efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/classes/search?query=Performance')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(400); // Should complete within 400ms
    });
  });

  describe('GET /api/classes/:id - Performance', () => {
    let testClassId: string;

    /**
     * Setup test class for individual retrieval tests
     */
    beforeEach(async () => {
      // Create a test class
      const classData = {
        name: 'Performance Test Class for Get',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Performance Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00
      };

      const response = await request(app).post('/api/classes').send(classData);
      testClassId = response.body.data.id;
    });

    /**
     * Test single class retrieval performance
     * Ensures fast retrieval of individual class data
     */
    it('should retrieve class by ID efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/classes/${testClassId}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testClassId);
      expect(responseTime).toBeLessThan(200); // Should complete within 200ms
    });

    /**
     * Test concurrent class retrievals
     * Ensures efficient handling of multiple concurrent requests
     */
    it('should handle concurrent class retrievals efficiently', async () => {
      const numRequests = 10;
      const startTime = Date.now();
      
      const promises = Array(numRequests).fill(null).map(() =>
        request(app)
          .get(`/api/classes/${testClassId}`)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / numRequests;

      expect(responses).toHaveLength(numRequests);
      expect(responses.every(res => res.body.success)).toBe(true);
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms per request
    });
  });

  describe('PUT /api/classes/:id - Performance', () => {
    let testClassId: string;

    /**
     * Setup test class for update tests
     */
    beforeEach(async () => {
      // Create a test class
      const classData = {
        name: 'Performance Test Class for Update',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Performance Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00
      };

      const response = await request(app).post('/api/classes').send(classData);
      testClassId = response.body.data.id;
    });

    /**
     * Test class update performance
     * Ensures efficient updating of class data
     */
    it('should update class efficiently', async () => {
      const updateData = {
        name: 'Updated Performance Test Class',
        price: 25.00,
        maxCapacity: 25
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .put(`/api/classes/${testClassId}`)
        .send(updateData)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });
  });

  describe('DELETE /api/classes/:id - Performance', () => {
    let testClassId: string;

    /**
     * Setup test class for deletion tests
     */
    beforeEach(async () => {
      // Create a test class
      const classData = {
        name: 'Performance Test Class for Delete',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Performance Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00
      };

      const response = await request(app).post('/api/classes').send(classData);
      testClassId = response.body.data.id;
    });

    /**
     * Test class deletion performance
     * Ensures efficient deletion of class data
     */
    it('should delete class efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .delete(`/api/classes/${testClassId}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });
  });

  describe('GET /api/classes/:id/statistics - Performance', () => {
    let testClassId: string;

    /**
     * Setup test class for statistics tests
     */
    beforeEach(async () => {
      // Create a test class
      const classData = {
        name: 'Performance Test Class for Statistics',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Performance Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00
      };

      const response = await request(app).post('/api/classes').send(classData);
      testClassId = response.body.data.id;
    });

    /**
     * Test statistics retrieval performance
     * Ensures efficient calculation and retrieval of class statistics
     */
    it('should retrieve class statistics efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/classes/${testClassId}/statistics`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalBookings).toBeDefined();
      expect(responseTime).toBeLessThan(400); // Should complete within 400ms
    });
  });

  describe('Load Testing', () => {
    /**
     * Test API performance under sustained load
     * Ensures the API maintains performance under high load conditions
     */
    it('should maintain performance under sustained load', async () => {
      const numRequests = 100;
      const responseTimes: number[] = [];

      // Create test data
      const classData = {
        name: 'Load Test Class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Load Test Instructor',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00
      };

      // Create a class first
      const createResponse = await request(app).post('/api/classes').send(classData);
      const classId = createResponse.body.data.id;

      // Perform load test
      const promises = Array(numRequests).fill(null).map(async () => {
        const startTime = Date.now();
        await request(app).get(`/api/classes/${classId}`).expect(200);
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      });

      await Promise.all(promises);

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      expect(avgResponseTime).toBeLessThan(200); // Average should be under 200ms
      expect(maxResponseTime).toBeLessThan(1000); // Max should be under 1 second
      expect(minResponseTime).toBeGreaterThan(0); // Min should be positive
    });
  });
}); 