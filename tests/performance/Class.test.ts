import request from 'supertest';
import app from '../../index';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createMinimalClassData, 
  setupDatabaseMock, 
  measureResponseTime,
  runConcurrentRequests,
  TEST_CONSTANTS 
} from '../helpers/testHelpers';

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
 * Uses shared test helpers to eliminate redundancy
 */
describe('Class API Performance Tests (Mocked DB)', () => {
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = require('../../src/config/database');
    setupDatabaseMock(mockDatabase);
  });

  describe('POST /api/classes - Performance', () => {
    it('should create class within acceptable response time', async () => {
      const classData = createMinimalClassData();

      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .post('/api/classes')
          .send(classData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();
      });

      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle bulk class creation efficiently', async () => {
      const classes = Array(10).fill(null).map((_, i) => 
        createMinimalClassData({ name: `Bulk Test Class ${i + 1}` })
      );

      const startTime = Date.now();
      
      const responses = await runConcurrentRequests(
        async () => {
          const classData = classes[Math.floor(Math.random() * classes.length)];
          return request(app)
            .post('/api/classes')
            .send(classData)
            .expect(201);
        },
        10
      );

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / 10;

      expect(responses).toHaveLength(10);
      expect(responses.every(res => res.body.success)).toBe(true);
      expect(averageTime).toBeLessThan(500); // Average should be under 500ms per request
    });
  });

  describe('GET /api/classes - Performance', () => {
    it('should handle pagination efficiently with large datasets', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get('/api/classes?limit=20&offset=0')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(5); // Mock returns 5 classes
        expect(response.body.pagination.total).toBe(50); // Mock total
      });

      expect(responseTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should filter classes efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get('/api/classes?status=active&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });

    it('should search classes efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get('/api/classes/search?q=yoga')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });
  });

  describe('GET /api/classes/:id - Performance', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const response = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = response.body.data.id;
    });

    it('should retrieve class by ID efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get(`/api/classes/${testClassId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testClassId);
      });

      expect(responseTime).toBeLessThan(200); // Should complete within 200ms
    });

    it('should handle concurrent class retrievals efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const responses = await runConcurrentRequests(
          async () => {
            return request(app)
              .get(`/api/classes/${testClassId}`)
              .expect(200);
          },
          5
        );

        expect(responses).toHaveLength(5);
        expect(responses.every(res => res.body.success)).toBe(true);
      });

      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second for 5 concurrent requests
    });
  });

  describe('PUT /api/classes/:id - Performance', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const response = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = response.body.data.id;
    });

    it('should update class efficiently', async () => {
      const updateData = {
        name: 'Updated Performance Test Class',
        description: 'Updated for performance testing'
      };

      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .put(`/api/classes/${testClassId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
      });

      expect(responseTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('DELETE /api/classes/:id - Performance', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const response = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = response.body.data.id;
    });

    it('should delete class efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .delete(`/api/classes/${testClassId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      expect(responseTime).toBeLessThan(300); // Should complete within 300ms
    });
  });

  describe('GET /api/classes/:id/statistics - Performance', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const response = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = response.body.data.id;
    });

    it('should retrieve class statistics efficiently', async () => {
      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get(`/api/classes/${testClassId}/statistics`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalClasses).toBeDefined();
        expect(response.body.data.totalBookings).toBeDefined();
      });

      expect(responseTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Load Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const numRequests = 20;
      const classData = createMinimalClassData();

      // Create a class first
      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);
      
      const classId = createResponse.body.data.id;

      // Perform load test
      const promises = Array(numRequests).fill(null).map(async () => {
        return request(app)
          .get(`/api/classes/${classId}`)
          .expect(200);
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / numRequests;

      expect(responses).toHaveLength(numRequests);
      expect(responses.every(res => res.body.success)).toBe(true);
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms per request
      expect(totalTime).toBeLessThan(5000); // Total should be under 5 seconds
    });

    it('should handle mixed operations efficiently', async () => {
      const operations = [
        // GET operations
        () => request(app).get('/api/classes?limit=10').expect(200),
        () => request(app).get('/api/classes/search?q=yoga').expect(200),
        // POST operation
        () => request(app).post('/api/classes').send(createMinimalClassData()).expect(201),
        // GET operation
        () => request(app).get('/api/classes?status=active').expect(200)
      ];

      const startTime = Date.now();
      
             const responses = await runConcurrentRequests(
         async () => {
           const operation = operations[Math.floor(Math.random() * operations.length)];
           return operation!();
         },
         8
       );

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / 8;

      expect(responses).toHaveLength(8);
      expect(responses.every(res => res.status < 500)).toBe(true); // No server errors
      expect(averageTime).toBeLessThan(800); // Average should be under 800ms per operation
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform repeated operations
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/classes?limit=5')
          .expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large result sets efficiently', async () => {
      // Mock a large result set
      mockDatabase.query.mockImplementation((query: string) => {
        if (query.includes('SELECT COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '1000' }] });
        }
        if (query.includes('SELECT * FROM classes')) {
          const largeDataSet = Array(100).fill(null).map((_, i) => ({
            id: `class-${i}`,
            name: `Large Dataset Class ${i}`,
            instructor_id: TEST_CONSTANTS.INSTRUCTOR_ID,
            instructor_name: TEST_CONSTANTS.INSTRUCTOR_NAME,
            class_type: 'yoga',
            start_date: '2024-12-01',
            end_date: '2024-12-31',
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            max_capacity: 20,
            price: 15.00,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          return Promise.resolve({ rows: largeDataSet });
        }
        return Promise.resolve({ rows: [] });
      });

      const responseTime = await measureResponseTime(async () => {
        const response = await request(app)
          .get('/api/classes?limit=100')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(100);
        expect(response.body.pagination.total).toBe(1000);
      });

      expect(responseTime).toBeLessThan(2000); // Should handle large datasets within 2 seconds
    });
  });
}); 