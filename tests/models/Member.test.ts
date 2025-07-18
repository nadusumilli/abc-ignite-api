import Member from '../../src/models/Member';
import { CreateMemberRequest, UpdateMemberRequest } from '../../src/types';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { 
  createMinimalMemberData, 
  createFullMemberData, 
  createMockMemberResponse,
  validateMemberResponse,
  validateErrorResponse
} from '../helpers/testHelpers';

// Mock database for testing
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  initialize: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn()
}));

describe('Member Model - ABC Ignite Requirements', () => {
  let mockDatabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase = require('../../src/config/database');
  });

  describe('create - ABC Ignite Requirements', () => {
    it('should create a member with minimal required fields', async () => {
      const memberData = createMinimalMemberData();
      const mockMember = createMockMemberResponse(memberData);
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockMember] });

      const result = await Member.create(memberData);

      expect(result).toBeDefined();
      expect(result.name).toBe(memberData.name);
      expect(result.email).toBe(memberData.email);
    });

    it('should create a member with all optional fields', async () => {
      const memberData = createFullMemberData();
      const mockMember = createMockMemberResponse(memberData);
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockMember] });

      const result = await Member.create(memberData);

      expect(result).toBeDefined();
      expect(result.name).toBe(memberData.name);
      expect(result.email).toBe(memberData.email);
      expect(result.phone).toBe(memberData.phone);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidData = { name: 'Test Member' } as CreateMemberRequest;

      await expect(Member.create(invalidData)).rejects.toThrow('Email is required');
    });

    it('should throw ValidationError for empty name', async () => {
      const invalidData = createMinimalMemberData({ name: '' });

      await expect(Member.create(invalidData)).rejects.toThrow('Name is required');
    });

    it('should throw ValidationError for empty email', async () => {
      const invalidData = createMinimalMemberData({ email: '' });

      await expect(Member.create(invalidData)).rejects.toThrow('Email is required');
    });

    it('should throw ValidationError for invalid email format', async () => {
      const invalidData = createMinimalMemberData({ email: 'invalid-email' });

      await expect(Member.create(invalidData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('findById', () => {
    it('should find a member by ID', async () => {
      const memberData = createMinimalMemberData();
      const mockMember = createMockMemberResponse(memberData, 'test-id');
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockMember] });

      const result = await Member.findById('test-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null for non-existent member', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const result = await Member.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a member by email', async () => {
      const memberData = createMinimalMemberData();
      const mockMember = createMockMemberResponse(memberData);
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [mockMember] });

      const result = await Member.findByEmail('test@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const result = await Member.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a member successfully', async () => {
      const updateData: UpdateMemberRequest = { name: 'Updated Name' };
      const mockMember = createMockMemberResponse(createMinimalMemberData(), 'test-id');
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [mockMember] }) // Find member
        .mockResolvedValueOnce({ rows: [mockMember] }); // Update member

      const result = await Member.update('test-id', updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError for non-existent member', async () => {
      const updateData: UpdateMemberRequest = { name: 'Updated Name' };
      
      mockDatabase.query.mockResolvedValueOnce({ rows: [] }); // Member not found

      await expect(Member.update('non-existent-id', updateData)).rejects.toThrow('Member not found');
    });

    it('should throw ValidationError for no fields to update', async () => {
      const updateData: UpdateMemberRequest = {};

      await expect(Member.update('test-id', updateData)).rejects.toThrow('No valid fields to update');
    });
  });

  describe('delete', () => {
    it('should delete a member successfully', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await Member.delete('test-id');

      expect(result).toBe(true);
    });

    it('should throw NotFoundError for non-existent member', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(Member.delete('non-existent-id')).rejects.toThrow('Member not found');
    });
  });

  describe('getAll', () => {
    it('should return paginated members with default filters', async () => {
      const mockMembers = Array(5).fill(null).map((_, i) => 
        createMockMemberResponse(createMinimalMemberData({ name: `Member ${i}` }))
      );
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ total: '50' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockMembers }); // Data query

      const result = await Member.getAll({});

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(50);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        search: 'John',
        membershipStatus: 'active',
        page: 1,
        limit: 10
      };

      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] }) // Count query
        .mockResolvedValueOnce({ rows: [] }); // Data query

      await Member.getAll(filters);

      expect(mockDatabase.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('search', () => {
    it('should search members by query', async () => {
      const mockMembers = Array(3).fill(null).map((_, i) => 
        createMockMemberResponse(createMinimalMemberData({ name: `Search Result ${i}` }))
      );
      
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockMembers }); // Data query

      const result = await Member.search({ query: 'test query' });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });
  });
}); 