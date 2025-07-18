import request from 'supertest';
import app from '../../index';
import { jest, describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData, executeTestQuery } from '../setup';

describe('Analytics API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return comprehensive analytics dashboard', async () => {
      // Create test data
      const instructor = await executeTestQuery(`
        INSERT INTO instructors (name, email, specialization, status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Instructor', 'instructor@test.com', 'Yoga', 'active']);

      const member = await executeTestQuery(`
        INSERT INTO members (name, email, membership_type, membership_status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Member', 'member@test.com', 'standard', 'active']);

      const class1 = await executeTestQuery(`
        INSERT INTO classes (template_id, name, instructor_id, class_type, class_date, start_time, end_time, duration_minutes, max_capacity, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `, ['Yoga Class', instructor.rows[0].id, 'yoga', '2024-01-15', '09:00', '10:00', 60, 20, 'active']);

      const booking = await executeTestQuery(`
        INSERT INTO bookings (class_id, member_id, participation_date, status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [class1.rows[0].id, member.rows[0].id, '2024-01-15', 'confirmed']);

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('classPerformance');
      expect(response.body.data).toHaveProperty('memberEngagement');
      expect(response.body.data).toHaveProperty('timeBasedTrends');
      expect(response.body.data).toHaveProperty('operationalMetrics');
      expect(response.body.data).toHaveProperty('generatedAt');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should handle date filtering correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.startDate).toBe('2024-01-01');
      expect(response.body.data.period.endDate).toBe('2024-01-31');
    });

    it('should handle empty data gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.classPerformance.topClasses).toHaveLength(0);
      expect(response.body.data.memberEngagement.activeMembers).toHaveLength(0);
    });
  });

  describe('GET /api/analytics/class-performance', () => {
    it('should return class performance analytics', async () => {
      // Create test data
      const instructor = await executeTestQuery(`
        INSERT INTO instructors (name, email, specialization, status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Instructor', 'instructor@test.com', 'Yoga', 'active']);

      const class1 = await executeTestQuery(`
        INSERT INTO classes (template_id, name, instructor_id, class_type, class_date, start_time, end_time, duration_minutes, max_capacity, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `, ['Yoga Class', instructor.rows[0].id, 'yoga', '2024-01-15', '09:00', '10:00', 60, 20, 'active']);

      const response = await request(app)
        .get('/api/analytics/class-performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topClasses');
      expect(response.body.data).toHaveProperty('averageAttendanceRate');
      expect(response.body.data).toHaveProperty('averageFillRate');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/class-performance')
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topClasses.length).toBeLessThanOrEqual(3);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/class-performance')
        .query({ limit: 'invalid' })
        .expect(200); // Should still work with default limit

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/analytics/member-engagement', () => {
    it('should return member engagement analytics', async () => {
      // Create test data
      const member = await executeTestQuery(`
        INSERT INTO members (name, email, membership_type, membership_status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Member', 'member@test.com', 'standard', 'active']);

      const response = await request(app)
        .get('/api/analytics/member-engagement')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeMembers');
      expect(response.body.data).toHaveProperty('retention');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should return retention metrics correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/member-engagement')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.retention).toHaveProperty('totalMembers');
      expect(response.body.data.retention).toHaveProperty('activeMembers');
      expect(response.body.data.retention).toHaveProperty('recentMembers');
      expect(response.body.data.retention).toHaveProperty('retentionRate30Days');
    });

    it('should respect limit parameter for active members', async () => {
      const response = await request(app)
        .get('/api/analytics/member-engagement')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.activeMembers.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/analytics/time-trends', () => {
    it('should return time-based trend analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weeklyTrends');
      expect(response.body.data).toHaveProperty('peakHours');
      expect(response.body.data).toHaveProperty('dayOfWeekDemand');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should return peak hours data', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.peakHours)).toBe(true);
      
      if (response.body.data.peakHours.length > 0) {
        expect(response.body.data.peakHours[0]).toHaveProperty('hour');
        expect(response.body.data.peakHours[0]).toHaveProperty('bookingCount');
        expect(response.body.data.peakHours[0]).toHaveProperty('classCount');
        expect(response.body.data.peakHours[0]).toHaveProperty('avgFillRate');
      }
    });

    it('should return day of week demand data', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.dayOfWeekDemand)).toBe(true);
      
      if (response.body.data.dayOfWeekDemand.length > 0) {
        expect(response.body.data.dayOfWeekDemand[0]).toHaveProperty('dayOfWeek');
        expect(response.body.data.dayOfWeekDemand[0]).toHaveProperty('dayName');
        expect(response.body.data.dayOfWeekDemand[0]).toHaveProperty('bookingCount');
      }
    });
  });

  describe('GET /api/analytics/operational-metrics', () => {
    it('should return operational metrics analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/operational-metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('capacityMetrics');
      expect(response.body.data).toHaveProperty('fillRateDistribution');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should return capacity metrics correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/operational-metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.capacityMetrics).toHaveProperty('totalClasses');
      expect(response.body.data.capacityMetrics).toHaveProperty('totalCapacity');
      expect(response.body.data.capacityMetrics).toHaveProperty('upcomingClasses');
      expect(response.body.data.capacityMetrics).toHaveProperty('pastClasses');
      expect(response.body.data.capacityMetrics).toHaveProperty('overallCapacityUtilization');
    });

    it('should return fill rate distribution', async () => {
      const response = await request(app)
        .get('/api/analytics/operational-metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.fillRateDistribution)).toBe(true);
      
      if (response.body.data.fillRateDistribution.length > 0) {
        expect(response.body.data.fillRateDistribution[0]).toHaveProperty('category');
        expect(response.body.data.fillRateDistribution[0]).toHaveProperty('classCount');
        expect(response.body.data.fillRateDistribution[0]).toHaveProperty('percentage');
      }
    });
  });

  describe('Analytics Edge Cases', () => {
    it('should handle malformed date parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          startDate: 'invalid-date',
          endDate: 'also-invalid'
        })
        .expect(200); // Should still work, just ignore invalid dates

      expect(response.body.success).toBe(true);
    });

    it('should handle very large date ranges', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          startDate: '2020-01-01',
          endDate: '2030-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle missing query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.startDate).toBe('all');
      expect(response.body.data.period.endDate).toBe('all');
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app).get('/api/analytics/dashboard').expect(200)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('classPerformance');
        expect(response.body.data).toHaveProperty('memberEngagement');
      });
    });
  });

  describe('Analytics Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle large datasets efficiently', async () => {
      // Create a larger dataset
      const instructor = await executeTestQuery(`
        INSERT INTO instructors (name, email, specialization, status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Instructor', 'instructor@test.com', 'Yoga', 'active']);

      // Create multiple classes
      for (let i = 0; i < 50; i++) {
        await executeTestQuery(`
          INSERT INTO classes (template_id, name, instructor_id, class_type, class_date, start_time, end_time, duration_minutes, max_capacity, status)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [`Class ${i}`, instructor.rows[0].id, 'yoga', `2024-01-${15 + i}`, '09:00', '10:00', 60, 20, 'active']);
      }

      const startTime = Date.now();
      
      await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds even with larger dataset
    });
  });
}); 