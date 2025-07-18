import request from 'supertest';
import app from '../../index';
import { testPool } from '../setup';
import { jest, describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import { 
  createMinimalClassData, 
  createFullClassData, 
  setupDatabaseMock, 
  validateClassResponse, 
  validateErrorResponse,
  TEST_SCENARIOS 
} from '../helpers/testHelpers';

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
 * Uses shared test helpers to eliminate redundancy
 */
describe('Class API Integration Tests', () => {
  let mockDatabase: any;

  beforeAll(async () => {
    // Setup mock database
    mockDatabase = require('../../src/config/database');
    setupDatabaseMock(mockDatabase);
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
    it('should create a new class successfully with minimal data', async () => {
      const classData = createMinimalClassData();

      const response = await request(app)
        .post('/api/classes')
        .send(classData)
        .expect(201);

      validateClassResponse(response, classData, expect);
    });

    it('should create a new class successfully with full data', async () => {
      const classData = createFullClassData();

      const response = await request(app)
        .post('/api/classes')
        .send(classData)
        .expect(201);

      validateClassResponse(response, classData, expect);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidClassData = {
        name: 'Test Class',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      validateErrorResponse(response, 400, expect, 'required');
    });

    it('should return 400 for invalid data types', async () => {
      const invalidClassData = {
        name: 'Test Class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        classType: 'yoga',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 'invalid', // Should be number
        maxCapacity: 'invalid' // Should be number
      };

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      validateErrorResponse(response, 400, expect);
    });

    it('should return 400 for invalid date ranges', async () => {
      const invalidClassData = createMinimalClassData({
        classDate: new Date('2024-12-01')
      });

      const response = await request(app)
        .post('/api/classes')
        .send(invalidClassData)
        .expect(400);

      validateErrorResponse(response, 400, expect, 'Start date must be before end date');
    });
  });

  describe('GET /api/classes', () => {
    it('should return all classes with pagination', async () => {
      const response = await request(app)
        .get('/api/classes?limit=20&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter classes by date range', async () => {
      const response = await request(app)
        .get('/api/classes?startDate=2024-01-01&endDate=2024-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter classes by status', async () => {
      const response = await request(app)
        .get('/api/classes?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should handle invalid filter parameters', async () => {
      const response = await request(app)
        .get('/api/classes?limit=invalid')
        .expect(400);

      validateErrorResponse(response, 400, expect);
    });
  });

  describe('GET /api/classes/:id', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = createResponse.body.data.id;
    });

    it('should return a specific class by ID', async () => {
      const response = await request(app)
        .get(`/api/classes/${testClassId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testClassId);
    });

    it('should return 404 for non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      
      const response = await request(app)
        .get(`/api/classes/${nonExistentId}`)
        .expect(404);

      validateErrorResponse(response, 404, expect, 'not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const invalidId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/classes/${invalidId}`)
        .expect(400);

      validateErrorResponse(response, 400, expect);
    });
  });

  describe('PUT /api/classes/:id', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = createResponse.body.data.id;
    });

    it('should update a class successfully', async () => {
      const updateData = {
        name: 'Updated Test Class',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/classes/${testClassId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/api/classes/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      validateErrorResponse(response, 404, expect, 'not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        maxCapacity: -1 // Invalid capacity
      };

      const response = await request(app)
        .put(`/api/classes/${testClassId}`)
        .send(invalidUpdateData)
        .expect(400);

      validateErrorResponse(response, 400, expect);
    });
  });

  describe('DELETE /api/classes/:id', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = createResponse.body.data.id;
    });

    it('should delete a class successfully', async () => {
      const response = await request(app)
        .delete(`/api/classes/${testClassId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent class', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .delete(`/api/classes/${nonExistentId}`)
        .expect(404);

      validateErrorResponse(response, 404, expect, 'not found');
    });
  });

  describe('GET /api/classes/search', () => {
    it('should search classes by query', async () => {
      const response = await request(app)
        .get('/api/classes/search?q=yoga')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/api/classes/search')
        .expect(400);

      validateErrorResponse(response, 400, expect, 'Search query is required');
    });

    it('should search with date filters', async () => {
      const response = await request(app)
        .get('/api/classes/search?q=yoga&startDate=2024-01-01&endDate=2024-12-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/classes/:id/statistics', () => {
    let testClassId: string;

    beforeEach(async () => {
      // Create a test class first
      const classData = createMinimalClassData();
      const createResponse = await request(app)
        .post('/api/classes')
        .send(classData);
      
      testClassId = createResponse.body.data.id;
    });

    it('should return class statistics', async () => {
      const response = await request(app)
        .get(`/api/classes/${testClassId}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalClasses).toBeDefined();
      expect(response.body.data.totalBookings).toBeDefined();
    });

    it('should return 404 for non-existent class statistics', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`/api/classes/${nonExistentId}/statistics`)
        .expect(404);

      validateErrorResponse(response, 404, expect, 'not found');
    });
  });
});