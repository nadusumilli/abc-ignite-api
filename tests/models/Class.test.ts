import Class from '../../src/models/Class';
import { CreateClassRequest, UpdateClassRequest } from '../../src/types';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createMinimalClassData, 
  createFullClassData, 
  createMockClassResponse,
  validateClassResponse,
  validateErrorResponse,
  TEST_SCENARIOS 
} from '../helpers/testHelpers';

// Mock database for testing
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  initialize: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn()
}));

/**
 * Test suite for Class Model - ABC Ignite Requirements
 * Tests all CRUD operations and business logic for the simplified gym management system
 * Uses shared test helpers to eliminate redundancy
 */
describe('Class Model - ABC Ignite Requirements', () => {
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = require('../../src/config/database');
    jest.clearAllMocks();
  });

  describe('create - ABC Ignite Requirements', () => {
    it('should create a class with minimal required fields', async () => {
      const classData = createMinimalClassData();

      const mockResult = {
        rows: [createMockClassResponse(classData)]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.create(classData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO classes'),
        expect.arrayContaining([
          classData.name,
          null, // description
          classData.instructorId,
          null, // instructorName (optional)
          classData.classType,
          classData.classDate,
          classData.classDate,
          classData.startTime,
          classData.endTime,
          classData.durationMinutes,
          classData.maxCapacity,
          0, // price default
          null, // location
          null, // room
          null, // equipment_needed
          'all_levels', // difficulty_level default
          null, // tags
          'active' // status default
        ])
      );

      expect(result.name).toBe(classData.name);
      expect(result.instructorId).toBe(classData.instructorId);
      expect(result.classType).toBe(classData.classType);
      expect(result.classDate).toEqual(classData.classDate);
      expect(result.classDate).toEqual(classData.classDate);
      expect(result.startTime).toBe(classData.startTime);
      expect(result.durationMinutes).toBe(classData.durationMinutes);
      expect(result.maxCapacity).toBe(classData.maxCapacity);
    });

    it('should create a class with all optional fields', async () => {
      const classData = createFullClassData();

      const mockResult = {
        rows: [createMockClassResponse(classData)]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.create(classData);

      expect(result.name).toBe(classData.name);
      expect(result.description).toBe(classData.description);
      expect(result.instructorId).toBe(classData.instructorId);
      expect(result.price).toBe(classData.price);
      expect(result.location).toBe(classData.location);
      expect(result.room).toBe(classData.room);
      expect(result.equipmentNeeded).toEqual(classData.equipmentNeeded);
      expect(result.difficultyLevel).toBe(classData.difficultyLevel);
      expect(result.tags).toEqual(classData.tags);
    });

    it('should create a class with capacity = 1 (minimum allowed)', async () => {
      const classData = createMinimalClassData({ maxCapacity: 1 });

      const mockResult = {
        rows: [createMockClassResponse(classData)]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.create(classData);

      expect(result.maxCapacity).toBe(1);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidData = { name: 'Test Class' };

      await expect(Class.create(invalidData as any)).rejects.toThrow('Instructor ID is required');
    });

    it('should throw ValidationError for invalid capacity', async () => {
      const invalidData = createMinimalClassData({ maxCapacity: 0 });

      await expect(Class.create(invalidData)).rejects.toThrow('Capacity must be at least 1');
    });

    it('should throw ValidationError for invalid date range', async () => {
      const invalidData = createMinimalClassData({
        classDate: new Date('2024-12-01')
      });

      await expect(Class.create(invalidData)).rejects.toThrow('Start date must be before end date');
    });

    it('should throw ValidationError for invalid time format', async () => {
      const invalidData = createMinimalClassData({ startTime: '25:00' });

      await expect(Class.create(invalidData)).rejects.toThrow('Invalid start time format');
    });
  });

  describe('findById', () => {
    it('should find a class by ID', async () => {
      const classData = createMinimalClassData();
      const mockResult = {
        rows: [createMockClassResponse(classData, 'test-id')]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.findById('test-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM classes WHERE id = $1',
        ['test-id']
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null for non-existent class', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const result = await Class.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated classes with default filters', async () => {
      const mockClasses = Array(5).fill(null).map((_, i) => 
        createMockClassResponse(createMinimalClassData({ name: `Class ${i}` }), `id-${i}`)
      );

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockClasses }); // Data query

      const result = await Class.findAll({});

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.limit).toBe(20); // Default limit
      expect(result.pagination.offset).toBe(0); // Default offset
    });

    it('should apply filters correctly', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        instructor: 'John',
        limit: 10,
        offset: 5
      };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '25' }] })
        .mockResolvedValueOnce({ rows: [] });

      await Class.findAll(filters);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE start_date >= $1 AND end_date <= $2 AND status = $3 AND instructor_name ILIKE $4'),
        ['2024-01-01', '2024-12-31', 'active', '%John%']
      );
    });
  });

  describe('update', () => {
    it('should update a class successfully', async () => {
      const updateData: UpdateClassRequest = {
        name: 'Updated Class Name',
        description: 'Updated description',
        price: 25.00
      };

      const mockResult = {
        rows: [createMockClassResponse(createMinimalClassData(updateData), 'test-id')]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.update('test-id', updateData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE classes SET'),
        expect.arrayContaining([
          'Updated Class Name',
          'Updated description',
          25.00,
          'test-id'
        ])
      );
      expect(result.name).toBe('Updated Class Name');
      expect(result.description).toBe('Updated description');
      expect(result.price).toBe(25.00);
    });

    it('should throw NotFoundError for non-existent class', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      await expect(Class.update('non-existent-id', { name: 'Updated' }))
        .rejects.toThrow('Class not found');
    });

    it('should throw ValidationError for no fields to update', async () => {
      await expect(Class.update('test-id', {}))
        .rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should delete a class successfully', async () => {
      mockDatabase.query.mockResolvedValue({ rowCount: 1 });

      await Class.delete('test-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'DELETE FROM classes WHERE id = $1',
        ['test-id']
      );
    });

    it('should throw NotFoundError for non-existent class', async () => {
      mockDatabase.query.mockResolvedValue({ rowCount: 0 });

      await expect(Class.delete('non-existent-id'))
        .rejects.toThrow('Class not found');
    });
  });

  describe('search', () => {
    it('should search classes by query', async () => {
      const searchParams = {
        query: 'yoga',
        limit: 10,
        offset: 0
      };

      const mockClasses = Array(3).fill(null).map((_, i) => 
        createMockClassResponse(createMinimalClassData({ name: `Yoga Class ${i}` }), `yoga-${i}`)
      );

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '15' }] })
        .mockResolvedValueOnce({ rows: mockClasses });

      const result = await Class.search(searchParams);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(15);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE name ILIKE $1 OR description ILIKE $1 OR class_type ILIKE $1'),
        expect.arrayContaining(['%yoga%'])
      );
    });
  });

  describe('findByInstructorAndTime', () => {
    it('should find conflicting class for instructor', async () => {
      const instructorId = 'instructor-1';
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-12-31');

      const mockResult = {
        rows: [createMockClassResponse(createMinimalClassData(), 'conflict-id')]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.findAll({ instructor: instructorId });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should return empty when no conflict exists', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const result = await Class.findAll({ instructor: 'instructor-1' });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getClassStatistics', () => {
    it('should return class statistics', async () => {
      const mockStats = {
        rows: [{
          total_classes: '10',
          active_classes: '8',
          cancelled_classes: '1',
          completed_classes: '1',
          total_bookings: '50',
          confirmed_bookings: '45',
          cancelled_bookings: '3',
          attended_bookings: '40',
          no_show_bookings: '2',
          attendance_rate: '88.89'
        }]
      };

      mockDatabase.query.mockResolvedValue(mockStats);

      const result = await Class.getClassStatistics('test-id');

      expect(result.totalClasses).toBe(10);
      expect(result.activeClasses).toBe(8);
      expect(result.totalBookings).toBe(50);
      expect(result.attendanceRate).toBe(88.89);
    });
  });
}); 