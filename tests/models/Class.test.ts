import Class from '../../src/models/Class';
import { CreateClassRequest, UpdateClassRequest } from '../../src/types';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock database for testing
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  initialize: jest.fn(),
  close: jest.fn()
}));

/**
 * Test suite for Class Model
 * Tests all CRUD operations and business logic
 */
describe('Class Model', () => {
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = require('../../src/config/database');
    jest.clearAllMocks();
  });

  describe('create', () => {
    /**
     * Test successful class creation
     */
    it('should create a new class successfully', async () => {
      const classData: CreateClassRequest = {
        name: 'Test Yoga Class',
        description: 'A test yoga class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
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

      const mockResult = {
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Test Yoga Class',
          description: 'A test yoga class',
          instructor_id: '123e4567-e89b-12d3-a456-426614174000',
          instructor_name: 'Test Instructor',
          class_type: 'yoga',
          start_date: '2024-02-01T00:00:00.000Z',
          end_date: '2024-02-28T00:00:00.000Z',
          start_time: '09:00',
          end_time: '10:00',
          duration_minutes: 60,
          max_capacity: 20,
          price: 15.00,
          location: 'Studio A',
          room: 'Yoga Room 1',
          equipment_needed: '["Yoga Mat"]',
          difficulty_level: 'beginner',
          tags: '["yoga", "beginner"]',
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.create(classData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO classes'),
        [
          'Test Yoga Class',
          'A test yoga class',
          '123e4567-e89b-12d3-a456-426614174000',
          'Test Instructor',
          'yoga',
          new Date('2024-02-01'),
          new Date('2024-02-28'),
          '09:00',
          '10:00',
          60,
          20,
          15.00,
          'Studio A',
          'Yoga Room 1',
          '["Yoga Mat"]',
          'beginner',
          '["yoga","beginner"]',
          'active'
        ]
      );

      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Yoga Class',
        description: 'A test yoga class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20,
        price: 15.00,
        location: 'Studio A',
        room: 'Yoga Room 1',
        equipmentNeeded: ['Yoga Mat'],
        difficultyLevel: 'beginner',
        tags: ['yoga', 'beginner'],
        status: 'active',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    /**
     * Test duplicate class validation
     */
    it('should throw ValidationError for duplicate class', async () => {
      const classData: CreateClassRequest = {
        name: 'Test Yoga Class',
        instructorId: '123e4567-e89b-12d3-a456-426614174000',
        instructorName: 'Test Instructor',
        classType: 'yoga',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        maxCapacity: 20
      };

      const error = new Error('duplicate key value violates unique constraint');
      (error as any).code = '23505';
      mockDatabase.query.mockRejectedValue(error);

      await expect(Class.create(classData)).rejects.toThrow('A class with this name already exists in the specified date range');
    });
  });

  describe('findById', () => {
    /**
     * Test successful class retrieval by ID
     */
    it('should find class by ID successfully', async () => {
      const mockResult = {
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Test Yoga Class',
          instructor_id: '123e4567-e89b-12d3-a456-426614174000',
          instructor_name: 'Test Instructor',
          class_type: 'yoga',
          start_date: '2024-02-01T00:00:00.000Z',
          end_date: '2024-02-28T00:00:00.000Z',
          start_time: '09:00',
          end_time: '10:00',
          duration_minutes: 60,
          max_capacity: 20,
          price: 15.00,
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.findById(1);

      expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM classes WHERE id = $1', [1]);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Yoga Class');
    });

    /**
     * Test class not found scenario
     */
    it('should return null when class not found', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const result = await Class.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    /**
     * Test class listing with pagination
     */
    it('should find all classes with pagination', async () => {
      const mockCountResult = { rows: [{ count: '10' }] };
      const mockDataResult = {
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Test Yoga Class',
            instructor_id: '123e4567-e89b-12d3-a456-426614174000',
            instructor_name: 'Test Instructor',
            class_type: 'yoga',
            start_date: '2024-02-01T00:00:00.000Z',
            end_date: '2024-02-28T00:00:00.000Z',
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            max_capacity: 20,
            price: 15.00,
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const filters = { limit: 20, offset: 0 };
      const result = await Class.findAll(filters);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.offset).toBe(0);
    });
  });

  describe('update', () => {
    /**
     * Test successful class update
     */
    it('should update class successfully', async () => {
      const updateData: UpdateClassRequest = {
        name: 'Updated Yoga Class',
        price: 20.00
      };

      const mockResult = {
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Updated Yoga Class',
          instructor_id: '123e4567-e89b-12d3-a456-426614174000',
          instructor_name: 'Test Instructor',
          class_type: 'yoga',
          start_date: '2024-02-01T00:00:00.000Z',
          end_date: '2024-02-28T00:00:00.000Z',
          start_time: '09:00',
          end_time: '10:00',
          duration_minutes: 60,
          max_capacity: 20,
          price: 20.00,
          status: 'active',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      };

      mockDatabase.query.mockResolvedValue(mockResult);

      const result = await Class.update(1, updateData);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE classes'),
        expect.arrayContaining(['Updated Yoga Class', 20.00, 1])
      );
      expect(result.name).toBe('Updated Yoga Class');
      expect(result.price).toBe(20.00);
    });

    /**
     * Test update with no valid fields
     */
    it('should throw ValidationError when no fields to update', async () => {
      const updateData: UpdateClassRequest = {};

      await expect(Class.update(1, updateData)).rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    /**
     * Test successful class deletion
     */
    it('should delete class successfully', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await expect(Class.delete(1)).resolves.not.toThrow();

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'DELETE FROM classes WHERE id = $1 RETURNING id',
        [1]
      );
    });

    /**
     * Test deletion of non-existent class
     */
    it('should throw NotFoundError when class not found', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      await expect(Class.delete(999)).rejects.toThrow('Class not found');
    });
  });

  describe('search', () => {
    /**
     * Test class search functionality
     */
    it('should search classes successfully', async () => {
      const mockCountResult = { rows: [{ count: '5' }] };
      const mockDataResult = {
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Yoga Class',
            instructor_id: '123e4567-e89b-12d3-a456-426614174000',
            instructor_name: 'Test Instructor',
            class_type: 'yoga',
            start_date: '2024-02-01T00:00:00.000Z',
            end_date: '2024-02-28T00:00:00.000Z',
            start_time: '09:00',
            end_time: '10:00',
            duration_minutes: 60,
            max_capacity: 20,
            price: 15.00,
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockDataResult);

      const searchParams = { query: 'yoga', limit: 20, offset: 0 };
      const result = await Class.search(searchParams);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(5);
    });
  });

  describe('hasActiveBookings', () => {
    /**
     * Test checking for active bookings
     */
    it('should return true when class has active bookings', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [{ booking_count: '3' }] });

      const result = await Class.hasActiveBookings(1);

      expect(result).toBe(true);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as booking_count'),
        [1]
      );
    });

    /**
     * Test checking for no active bookings
     */
    it('should return false when class has no active bookings', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [{ booking_count: '0' }] });

      const result = await Class.hasActiveBookings(1);

      expect(result).toBe(false);
    });
  });

  describe('getClassStatistics', () => {
    /**
     * Test retrieving class statistics
     */
    it('should return class statistics successfully', async () => {
      const mockClassResult = {
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174001',
          class_type: 'yoga',
          status: 'active'
        }]
      };

      const mockStatsResult = {
        rows: [{
          total_bookings: '10',
          confirmed_bookings: '8',
          attended_bookings: '6',
          cancelled_bookings: '1',
          no_show_bookings: '1',
          attendance_rate: '75.00'
        }]
      };

      const mockTimeSlotResult = {
        rows: [
          { start_time: '09:00', booking_count: '5' },
          { start_time: '10:00', booking_count: '3' }
        ]
      };

      mockDatabase.query
        .mockResolvedValueOnce(mockClassResult)
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTimeSlotResult);

      const result = await Class.getClassStatistics(1);

      expect(result.totalBookings).toBe(10);
      expect(result.confirmedBookings).toBe(8);
      expect(result.attendedBookings).toBe(6);
      expect(result.attendanceRate).toBe(75.00);
      expect(result.popularTimeSlots).toHaveLength(2);
    });

    /**
     * Test statistics for non-existent class
     */
    it('should throw NotFoundError when class not found', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      await expect(Class.getClassStatistics(999)).rejects.toThrow('Class not found');
    });
  });
}); 