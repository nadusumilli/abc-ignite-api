import Booking from '../../src/models/Booking';
import { CreateBookingRequest, UpdateBookingRequest } from '../../src/types';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createMinimalBookingData, 
  createFullBookingData, 
  createMockBookingResponse,
  createMockBookingDatabaseRow,
  validateBookingResponse,
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

describe('Booking Model - ABC Ignite Requirements', () => {
  let mockDatabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = require('../../src/config/database');
  });

  describe('create - ABC Ignite Requirements', () => {
    it('should create a booking with minimal required fields', async () => {
      const bookingData = createMinimalBookingData();
      const mockBookingRow = createMockBookingDatabaseRow(bookingData);
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ max_capacity: 10 }] }) // Class exists
        .mockResolvedValueOnce({ rows: [{ booking_count: '5' }] }) // Current bookings
        .mockResolvedValueOnce({ rows: [mockBookingRow] }); // Insert booking

      const result = await Booking.create(bookingData);

      expect(result).toBeDefined();
      expect(result.memberId).toBe(bookingData.memberId);
      expect(result.classId).toBe(bookingData.classId);
      expect(result.participationDate).toEqual(new Date(bookingData.participationDate));
    });

    it('should create a booking with all optional fields', async () => {
      const bookingData = createFullBookingData();
      const mockBookingRow = createMockBookingDatabaseRow(bookingData);
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ max_capacity: 10 }] }) // Class exists
        .mockResolvedValueOnce({ rows: [{ booking_count: '5' }] }) // Current bookings
        .mockResolvedValueOnce({ rows: [mockBookingRow] }); // Insert booking

      const result = await Booking.create(bookingData);

      expect(result).toBeDefined();
      expect(result.memberId).toBe(bookingData.memberId);
      expect(result.notes).toBe(bookingData.notes);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidData = { classId: 'test-class' } as CreateBookingRequest;

      await expect(Booking.create(invalidData)).rejects.toThrow('Member ID is required');
    });

    it('should reject booking with past participation date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const invalidData = createMinimalBookingData({
        participationDate: pastDate.toISOString().split('T')[0]!
      });

      await expect(Booking.create(invalidData)).rejects.toThrow('Participation date must be in the future');
    });

    it('should throw ValidationError for empty member ID', async () => {
      const invalidData = createMinimalBookingData({ memberId: '' });

      await expect(Booking.create(invalidData)).rejects.toThrow('Member ID is required');
    });

    it('should throw ValidationError for empty class ID', async () => {
      const invalidData = createMinimalBookingData({ classId: '' });

      await expect(Booking.create(invalidData)).rejects.toThrow('Class ID is required');
    });

    it('should throw ValidationError when class is at maximum capacity', async () => {
      const bookingData = createMinimalBookingData();
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ max_capacity: 10 }] }) // Class exists
        .mockResolvedValueOnce({ rows: [{ booking_count: '10' }] }); // At capacity

      await expect(Booking.create(bookingData)).rejects.toThrow('Class is at maximum capacity for this date');
    });

    it('should throw ValidationError when class not found', async () => {
      const bookingData = createMinimalBookingData();
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [] }); // Class not found

      await expect(Booking.create(bookingData)).rejects.toThrow('Class not found');
    });
  });

  describe('findById', () => {
    it('should find a booking by ID', async () => {
      const bookingData = createMinimalBookingData();
      const mockBookingRow = createMockBookingDatabaseRow(bookingData, 'test-id');
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockBookingRow] });

      const result = await Booking.findById('test-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null for non-existent booking', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const result = await Booking.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings with default filters', async () => {
      const mockBookings = Array(5).fill(null).map((_, i) => 
        createMockBookingDatabaseRow(createMinimalBookingData({ memberId: `member-${i}` }))
      );
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockBookings }); // Data query

      const result = await Booking.findAll({});

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(50);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        memberName: 'John',
        limit: 10,
        offset: 0
      };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // Count query
        .mockResolvedValueOnce({ rows: [] }); // Data query

      await Booking.findAll(filters);

      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update a booking successfully', async () => {
      const updateData: UpdateBookingRequest = { notes: 'Updated notes' };
      const mockBookingRow = createMockBookingDatabaseRow(createMinimalBookingData(), 'test-id');
      mockBookingRow.notes = 'Updated notes'; // Simulate the update
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockBookingRow] });

      const result = await Booking.update('test-id', updateData);

      expect(result).toBeDefined();
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      const updateData: UpdateBookingRequest = { notes: 'Updated notes' };
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      await expect(Booking.update('non-existent-id', updateData)).rejects.toThrow('Booking not found');
    });

    it('should throw ValidationError for no fields to update', async () => {
      const updateData: UpdateBookingRequest = {};

      await expect(Booking.update('test-id', updateData)).rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should delete a booking successfully', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [{ id: 'test-id' }] });

      await expect(Booking.delete('test-id')).resolves.toBeUndefined();
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      await expect(Booking.delete('non-existent-id')).rejects.toThrow('Booking not found');
    });
  });

  describe('search', () => {
    it('should search bookings by query', async () => {
      const mockBookings = Array(3).fill(null).map((_, i) => 
        createMockBookingDatabaseRow(createMinimalBookingData({ memberId: `search-member-${i}` }))
      );
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockBookings }); // Data query

      const result = await Booking.search({ query: 'test query' });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });
  });

  describe('findByClassAndMember', () => {
    it('should find booking by class and member', async () => {
      const bookingData = createMinimalBookingData({ classId: 'class-id' });
      const mockBookingRow = createMockBookingDatabaseRow(bookingData);
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockBookingRow] });

      const result = await Booking.findByClassAndMember('class-id', 'member-id');

      expect(result).toBeDefined();
      expect(result?.classId).toBe('class-id');
    });

    it('should return null when no booking found', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const result = await Booking.findByClassAndMember('class-id', 'member-id');

      expect(result).toBeNull();
    });
  });
}); 