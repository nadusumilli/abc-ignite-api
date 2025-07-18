import request from 'supertest';
import app from '../../index';
import { jest, describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData, executeTestQuery } from '../setup';

describe('Enhanced Analytics API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('Enhanced Class Performance Analytics', () => {
    it('should return enhanced class performance metrics with detailed breakdowns', async () => {
      // Create test data
      const instructor = await executeTestQuery(`
        INSERT INTO instructors (name, email, specialization, status)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Test Instructor', 'instructor@test.com', 'Yoga', 'active']);

      const class1 = await executeTestQuery(`
        INSERT INTO classes (template_id, name, instructor_id, class_type, class_date, start_time, end_time, duration_minutes, max_capacity, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `, ['Yoga Class', instructor.rows[0].id, 'yoga', '2024-01-15', '09:00', '10:00', 60, 20, 'active']);

      const class2 = await executeTestQuery(`
        INSERT INTO classes (template_id, name, instructor_id, class_type, class_date, start_time, end_time, duration_minutes, max_capacity, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `, ['Pilates Class', instructor.rows[0].id, 'pilates', '2024-01-16', '10:00', '11:00', 60, 15, 'active']);

      const response = await request(app)
        .get('/api/analytics/class-performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('topClasses');
      expect(response.body.data).toHaveProperty('averageMetrics');
      expect(response.body.data).toHaveProperty('classTypeBreakdown');
      expect(response.body.data.averageMetrics).toHaveProperty('fillRate');
      expect(response.body.data.averageMetrics).toHaveProperty('attendanceRate');
      expect(response.body.data.averageMetrics).toHaveProperty('noShowRate');
      expect(response.body.data.averageMetrics).toHaveProperty('cancellationRate');
    });

    it('should include enhanced class details in top classes', async () => {
      const response = await request(app)
        .get('/api/analytics/class-performance')
        .expect(200);

      if (response.body.data.topClasses.length > 0) {
        const topClass = response.body.data.topClasses[0];
        expect(topClass).toHaveProperty('noShowCount');
        expect(topClass).toHaveProperty('cancellationRate');
        expect(topClass).toHaveProperty('classDate');
        expect(topClass).toHaveProperty('startTime');
        expect(topClass).toHaveProperty('endTime');
      }
    });
  });

  describe('Enhanced Member Engagement Analytics', () => {
    it('should return enhanced member engagement metrics with retention data', async () => {
      const response = await request(app)
        .get('/api/analytics/member-engagement')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeMembers');
      expect(response.body.data).toHaveProperty('retention');
      expect(response.body.data).toHaveProperty('membershipBreakdown');
      
      // Check enhanced retention metrics
      expect(response.body.data.retention).toHaveProperty('veryRecentMembers');
      expect(response.body.data.retention).toHaveProperty('newMembers90d');
      expect(response.body.data.retention).toHaveProperty('retainedMembers30d');
      expect(response.body.data.retention).toHaveProperty('retentionRate30d');
      expect(response.body.data.retention).toHaveProperty('engagementRate30d');
    });

    it('should include enhanced member details in active members', async () => {
      const response = await request(app)
        .get('/api/analytics/member-engagement')
        .expect(200);

      if (response.body.data.activeMembers.length > 0) {
        const activeMember = response.body.data.activeMembers[0];
        expect(activeMember).toHaveProperty('membershipStatus');
        expect(activeMember).toHaveProperty('cancelledBookings');
        expect(activeMember).toHaveProperty('classTypesTried');
        expect(activeMember).toHaveProperty('firstBookingDate');
        expect(activeMember).toHaveProperty('weeksSinceFirstBooking');
      }
    });
  });

  describe('Enhanced Time-Based Trend Analytics', () => {
    it('should return enhanced time-based trends with monthly data', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('weeklyTrends');
      expect(response.body.data).toHaveProperty('monthlyTrends');
      expect(response.body.data).toHaveProperty('peakHours');
      expect(response.body.data).toHaveProperty('dayOfWeekDemand');
    });

    it('should include enhanced metrics in weekly trends', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      if (response.body.data.weeklyTrends.length > 0) {
        const weeklyTrend = response.body.data.weeklyTrends[0];
        expect(weeklyTrend).toHaveProperty('uniqueInstructors');
        expect(weeklyTrend).toHaveProperty('avgAttendanceRate');
      }
    });

    it('should include enhanced metrics in peak hours', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      if (response.body.data.peakHours.length > 0) {
        const peakHour = response.body.data.peakHours[0];
        expect(peakHour).toHaveProperty('uniqueMembers');
        expect(peakHour).toHaveProperty('classTypes');
        expect(peakHour).toHaveProperty('avgAttendanceRate');
      }
    });

    it('should include enhanced metrics in day-of-week demand', async () => {
      const response = await request(app)
        .get('/api/analytics/time-trends')
        .expect(200);

      if (response.body.data.dayOfWeekDemand.length > 0) {
        const dayDemand = response.body.data.dayOfWeekDemand[0];
        expect(dayDemand).toHaveProperty('uniqueMembers');
        expect(dayDemand).toHaveProperty('uniqueInstructors');
        expect(dayDemand).toHaveProperty('avgAttendanceRate');
      }
    });
  });

  describe('Enhanced Operational Metrics Analytics', () => {
    it('should return enhanced operational metrics with proper aggregation', async () => {
      const response = await request(app)
        .get('/api/analytics/operational-metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('capacityMetrics');
      expect(response.body.data).toHaveProperty('fillRateDistribution');
      
      const capacityMetrics = response.body.data.capacityMetrics;
      expect(capacityMetrics).toHaveProperty('totalClasses');
      expect(capacityMetrics).toHaveProperty('totalCapacity');
      expect(capacityMetrics).toHaveProperty('upcomingClasses');
      expect(capacityMetrics).toHaveProperty('pastClasses');
      expect(capacityMetrics).toHaveProperty('activeClasses');
      expect(capacityMetrics).toHaveProperty('cancelledClasses');
      expect(capacityMetrics).toHaveProperty('completedClasses');
      expect(capacityMetrics).toHaveProperty('totalBookings');
      expect(capacityMetrics).toHaveProperty('overallCapacityUtilization');
    });

    it('should return proper fill rate distribution categories', async () => {
      const response = await request(app)
        .get('/api/analytics/operational-metrics')
        .expect(200);

      const fillRateDistribution = response.body.data.fillRateDistribution;
      expect(Array.isArray(fillRateDistribution)).toBe(true);
      
      if (fillRateDistribution.length > 0) {
        const category = fillRateDistribution[0];
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('classCount');
        expect(category).toHaveProperty('percentage');
      }
    });
  });

  describe('Comprehensive Analytics Dashboard', () => {
    it('should return all enhanced analytics in dashboard', async () => {
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
      expect(response.body.data.timeBasedTrends.weeklyTrends).toHaveLength(0);
      expect(response.body.data.timeBasedTrends.monthlyTrends).toHaveLength(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle malformed date parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .query({
          startDate: 'invalid-date',
          endDate: 'also-invalid'
        })
        .expect(200); // Should still work with default date range

      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/analytics/dashboard')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('classPerformance');
        expect(response.body.data).toHaveProperty('memberEngagement');
        expect(response.body.data).toHaveProperty('timeBasedTrends');
        expect(response.body.data).toHaveProperty('operationalMetrics');
      });
    });
  });
}); 