# ABC Ignite - Gym Management System

A production-grade TypeScript + Node.js + Express + PostgreSQL backend for a SaaS gym/studio management platform with advanced analytics and business intelligence capabilities.

## 🚀 Features

### Core Functionality

-   **Class Management**: Create, update, delete, and search classes with date range support
-   **Booking System**: Book classes with capacity validation and future date requirements
-   **Member Management**: Comprehensive member profiles with membership types
-   **Instructor Management**: Instructor profiles and class assignments
-   **Advanced Analytics**: Comprehensive business intelligence and performance metrics
-   **Search & Filtering**: Full-text search across all entities with advanced filtering
-   **RESTful API**: Clean, well-documented REST endpoints with proper status codes

### Advanced Analytics (Enhanced!)

-   **Class Performance Analytics**: Most booked classes, attendance rates, fill rates, no-show rates, cancellation rates, class type breakdowns
-   **Member Engagement Analytics**: Active members, retention metrics, engagement patterns, membership breakdowns, member lifecycle analysis
-   **Time-Based Trends**: Weekly/monthly trends, peak hours heatmap, day-of-week demand analysis with enhanced metrics
-   **Operational Metrics**: Capacity utilization, class distribution, operational efficiency, fill rate distribution analysis

## 🛠️ Tech Stack

### Backend

-   **Runtime**: Node.js 18+
-   **Language**: TypeScript 5.0+
-   **Framework**: Express.js 4.18+
-   **Database**: PostgreSQL 14+
-   **ORM**: Native SQL with connection pooling
-   **Validation**: Joi schema validation
-   **Testing**: Jest + Supertest
-   **Logging**: Winston
-   **Security**: Helmet, CORS, Rate limiting
-   **Documentation**: JSDoc

### Frontend (abc-ignite-ui)

-   **Framework**: Next.js 14
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **State Management**: @tanstack/react-query
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Forms**: React Hook Form + Zod

## 📋 Prerequisites

-   Node.js 18+
-   PostgreSQL 14+
-   npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd abc
```

### 2. Backend Setup (abc-ignite-api)

```bash
cd abc-ignite-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed

# Start development server
npm run dev
```

### 3. Frontend Setup (abc-ignite-ui)

```bash
cd abc-ignite-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API base URL

# Start development server
npm run dev
```

## 🗄️ Database Setup

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abc_ignite
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Schema

The system uses a normalized schema with the following key tables:

-   **instructors**: Instructor profiles and specializations
-   **members**: Member profiles and membership details
-   **class_templates**: Reusable class templates
-   **classes**: Individual class instances (one per day)
-   **bookings**: Class bookings with member relationships
-   **class_attendance**: Attendance tracking

### Key Features:

-   **1NF Compliance**: All data is normalized with proper foreign keys
-   **Audit Fields**: `created_at`, `updated_at` on all tables
-   **UUID Primary Keys**: Secure, globally unique identifiers
-   **Indexes**: Optimized for common query patterns
-   **Constraints**: Data integrity enforced at database level

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

## 📋 Changelog

### v2.0.0 - Enhanced Analytics Release

#### 🚀 New Features

-   **Enhanced Class Performance Analytics**

    -   Added no-show and cancellation rate tracking
    -   Included class date, start time, and end time in top classes
    -   Added class type breakdown with performance metrics
    -   Enhanced average metrics with detailed rate calculations

-   **Enhanced Member Engagement Analytics**

    -   Added membership status tracking
    -   Included cancelled bookings count
    -   Added class types tried by members
    -   Enhanced retention metrics with 7-day, 30-day, and 90-day analysis
    -   Added membership type breakdown with performance metrics
    -   Included member lifecycle analysis (first booking, weeks since first booking)

-   **Enhanced Time-Based Trend Analytics**

    -   Added monthly trends for longer-term analysis
    -   Enhanced weekly trends with instructor and attendance metrics
    -   Improved peak hours analysis with unique members and class types
    -   Enhanced day-of-week demand with instructor and attendance metrics

-   **Enhanced Operational Metrics Analytics**
    -   Fixed aggregation issues in capacity utilization calculations
    -   Added detailed class status breakdown (active, cancelled, completed)
    -   Improved fill rate distribution with proper categorization
    -   Enhanced overall capacity utilization calculation

#### 🔧 Technical Improvements

-   **Performance Optimizations**

    -   Optimized SQL queries with proper CTEs and window functions
    -   Improved aggregation logic for better accuracy
    -   Enhanced indexing recommendations for analytics queries
    -   Added concurrent request handling tests

-   **Code Quality**

    -   Enhanced TypeScript interfaces for all analytics types
    -   Improved error handling and validation
    -   Added comprehensive JSDoc documentation
    -   Created dedicated test suite for enhanced analytics

-   **Data Accuracy**
    -   Fixed calculation issues in retention metrics
    -   Improved attendance rate calculations
    -   Enhanced fill rate calculations with proper null handling
    -   Added data validation for edge cases

#### 🧪 Testing

-   Added comprehensive integration tests for all enhanced analytics
-   Created performance tests for large datasets
-   Added edge case testing for malformed parameters
-   Implemented concurrent request testing

#### 📊 Business Intelligence

-   **Actionable Insights**: All analytics now provide actionable business intelligence
-   **Trend Analysis**: Enhanced trend detection across multiple time periods
-   **Member Lifecycle**: Complete member journey tracking and analysis
-   **Operational Efficiency**: Detailed operational metrics for business optimization

### Authentication

All endpoints require proper authentication headers (implementation depends on your auth strategy).

### Core Endpoints

#### Classes

```http
GET    /classes                    # Get all classes with pagination
POST   /classes                    # Create a new class
GET    /classes/:id                # Get class by ID
PUT    /classes/:id                # Update class
DELETE /classes/:id                # Delete class
GET    /classes/search             # Search classes
POST   /classes/bulk               # Create multiple classes from template
GET    /classes/:id/statistics     # Get class statistics
```

#### Bookings

```http
GET    /bookings                   # Get all bookings with filters
POST   /bookings                   # Create a new booking
GET    /bookings/:id               # Get booking by ID
PUT    /bookings/:id               # Update booking
DELETE /bookings/:id               # Delete booking
GET    /bookings/search            # Search bookings
PUT    /bookings/:id/cancel        # Cancel booking
PUT    /bookings/:id/attend        # Mark booking as attended
```

#### Members

```http
GET    /members                    # Get all members
POST   /members                    # Create a new member
GET    /members/:id                # Get member by ID
PUT    /members/:id                # Update member
DELETE /members/:id                # Delete member
GET    /members/search             # Search members
```

#### Instructors

```http
GET    /instructors                # Get all instructors
POST   /instructors                # Create a new instructor
GET    /instructors/:id            # Get instructor by ID
PUT    /instructors/:id            # Update instructor
DELETE /instructors/:id            # Delete instructor
GET    /instructors/search         # Search instructors
```

### Analytics Endpoints (New!)

#### Dashboard Analytics

```http
GET /analytics/dashboard
```

Returns comprehensive analytics including:

-   Class performance metrics
-   Member engagement data
-   Time-based trends
-   Operational metrics

**Query Parameters:**

-   `startDate` (optional): Start date for analysis (YYYY-MM-DD)
-   `endDate` (optional): End date for analysis (YYYY-MM-DD)

**Response:**

```json
{
	"success": true,
	"data": {
		"classPerformance": {
			"topClasses": [
				{
					"classId": "uuid",
					"className": "Yoga Class",
					"classType": "yoga",
					"instructorName": "John Doe",
					"bookingCount": 15,
					"maxCapacity": 20,
					"fillRate": 75.0,
					"attendedCount": 12,
					"noShowCount": 2,
					"attendanceRate": 80.0,
					"cancellationRate": 6.7,
					"classDate": "2024-01-15",
					"startTime": "09:00",
					"endTime": "10:00"
				}
			],
			"averageMetrics": {
				"fillRate": 72.5,
				"attendanceRate": 85.2,
				"noShowRate": 8.3,
				"cancellationRate": 6.2
			},
			"classTypeBreakdown": [
				{
					"classType": "yoga",
					"totalClasses": 50,
					"totalBookings": 750,
					"avgFillRate": 75.0,
					"avgAttendanceRate": 82.0
				}
			]
		},
		"memberEngagement": {
			"activeMembers": [
				{
					"memberId": "uuid",
					"memberName": "Jane Smith",
					"memberEmail": "jane@example.com",
					"membershipType": "premium",
					"membershipStatus": "active",
					"totalBookings": 25,
					"attendedBookings": 22,
					"noShowBookings": 2,
					"cancelledBookings": 1,
					"attendanceRate": 88.0,
					"activeWeeks": 8,
					"classTypesTried": 4,
					"lastBookingDate": "2024-01-15",
					"firstBookingDate": "2023-11-01",
					"weeksSinceFirstBooking": 10.5
				}
			],
			"retention": {
				"totalMembers": 150,
				"activeMembers": 120,
				"recentMembers": 95,
				"veryRecentMembers": 45,
				"newMembers90d": 25,
				"retainedMembers30d": 85,
				"retentionRate30d": 68.0,
				"engagementRate30d": 63.3
			},
			"membershipBreakdown": [
				{
					"membershipType": "premium",
					"totalMembers": 50,
					"totalBookings": 800,
					"avgAttendanceRate": 88.5
				}
			]
		},
		"timeBasedTrends": {
			"weeklyTrends": [
				{
					"weekStart": "2024-01-08",
					"totalBookings": 150,
					"totalClasses": 25,
					"uniqueMembers": 45,
					"uniqueInstructors": 8,
					"avgFillRate": 75.2,
					"avgAttendanceRate": 82.1
				}
			],
			"monthlyTrends": [
				{
					"monthStart": "2024-01-01",
					"totalBookings": 600,
					"totalClasses": 100,
					"uniqueMembers": 120,
					"avgFillRate": 73.8
				}
			],
			"peakHours": [
				{
					"hour": 9,
					"bookingCount": 45,
					"classCount": 8,
					"uniqueMembers": 35,
					"classTypes": 4,
					"avgFillRate": 82.5,
					"avgAttendanceRate": 85.2
				}
			],
			"dayOfWeekDemand": [
				{
					"dayOfWeek": 1,
					"dayName": "Monday",
					"bookingCount": 85,
					"classCount": 15,
					"classTypes": 6,
					"uniqueMembers": 45,
					"uniqueInstructors": 8,
					"avgFillRate": 78.3,
					"avgAttendanceRate": 84.1
				}
			]
		},
		"operationalMetrics": {
			"capacityMetrics": {
				"totalClasses": 500,
				"totalCapacity": 5000,
				"upcomingClasses": 150,
				"pastClasses": 350,
				"activeClasses": 120,
				"cancelledClasses": 30,
				"completedClasses": 320,
				"totalBookings": 3750,
				"overallCapacityUtilization": 75.0
			},
			"fillRateDistribution": [
				{
					"category": "Fully Booked (90%+)",
					"classCount": 125,
					"percentage": 25.0
				}
			]
		}
	}
}
```

#### Class Performance Analytics

```http
GET /analytics/class-performance
```

Returns detailed class performance metrics.

**Query Parameters:**

-   `startDate` (optional): Start date for analysis
-   `endDate` (optional): End date for analysis
-   `limit` (optional): Number of top classes to return (default: 10)

#### Member Engagement Analytics

```http
GET /analytics/member-engagement
```

Returns member engagement and retention metrics.

**Query Parameters:**

-   `startDate` (optional): Start date for analysis
-   `endDate` (optional): End date for analysis
-   `limit` (optional): Number of active members to return (default: 10)

#### Time-Based Trend Analytics

```http
GET /analytics/time-trends
```

Returns time-based analysis including weekly trends, peak hours, and day-of-week demand.

**Query Parameters:**

-   `startDate` (optional): Start date for analysis
-   `endDate` (optional): End date for analysis

#### Operational Metrics Analytics

```http
GET /analytics/operational-metrics
```

Returns operational efficiency metrics including capacity utilization and class distribution.

**Query Parameters:**

-   `startDate` (optional): Start date for analysis
-   `endDate` (optional): End date for analysis

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests
npm test -- --testPathPattern="models"

# Integration tests
npm test -- --testPathPattern="integration"

# Performance tests
npm test -- --testPathPattern="performance"

# Specific model tests
npm test -- --testPathPattern="Booking.test.ts"
```

### Test Coverage

```bash
npm run test:coverage
```

The test suite includes:

-   **Unit Tests**: Model validation, business logic, error handling
-   **Integration Tests**: API endpoints, database operations
-   **Performance Tests**: Response times, concurrent requests
-   **Edge Cases**: Invalid data, error conditions, boundary testing

### Test Database

Tests use a dedicated test database or comprehensive mocking to ensure:

-   Data isolation between tests
-   Automatic cleanup after each test
-   No interference with development data
-   Fast test execution

## 🔧 Development

### Code Quality

-   **ESLint**: Airbnb configuration with TypeScript support
-   **Prettier**: Consistent code formatting
-   **TypeScript**: Strict type checking enabled
-   **JSDoc**: Comprehensive documentation for all functions

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── database/        # Database setup and migrations
├── middleware/      # Express middleware
├── models/          # Data models and business logic
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point

tests/
├── helpers/         # Test utilities
├── integration/     # Integration tests
├── models/          # Unit tests
├── performance/     # Performance tests
└── setup.ts         # Test setup
```

### Key Design Patterns

-   **MVC Architecture**: Clear separation of concerns
-   **Service Layer**: Business logic encapsulation
-   **Repository Pattern**: Data access abstraction
-   **Middleware Chain**: Request processing pipeline
-   **Error Handling**: Centralized error management

## 🚀 Production Deployment

### Environment Setup

```bash
# Set production environment
NODE_ENV=production

# Configure production database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=abc_ignite_prod
DB_USER=your-prod-user
DB_PASSWORD=your-prod-password

# Security settings
JWT_SECRET=your-secure-jwt-secret
RATE_LIMIT_MAX_REQUESTS=1000
```

### Database Migration

```bash
# Run migrations
npm run db:migrate

# Verify migration status
npm run db:status
```

### Performance Optimization

-   **Connection Pooling**: Optimized for production load
-   **Query Optimization**: Indexed queries for common patterns
-   **Caching**: Redis integration for frequently accessed data
-   **Rate Limiting**: Protection against abuse
-   **Compression**: Response compression for bandwidth efficiency

## 📊 Analytics Features

### Business Intelligence

The analytics system provides actionable insights for gym management:

#### Class Performance

-   **Top Classes**: Most booked classes with booking counts and fill rates
-   **Attendance Rates**: Average attendance across all classes
-   **Fill Rates**: Capacity utilization per class and overall

#### Member Engagement

-   **Active Members**: Members with recent booking activity
-   **Retention Metrics**: 30-day retention rates and member lifecycle
-   **Engagement Patterns**: Booking frequency and participation trends

#### Time-Based Analysis

-   **Weekly Trends**: Booking volume patterns over time
-   **Peak Hours**: Most popular class times
-   **Day-of-Week Demand**: Class popularity by day

#### Operational Metrics

-   **Capacity Utilization**: Overall gym capacity efficiency
-   **Class Distribution**: Active, completed, and cancelled classes
-   **Fill Rate Distribution**: Classes by capacity utilization categories

### Analytics Use Cases

-   **Class Scheduling**: Optimize class times based on peak hours
-   **Capacity Planning**: Adjust class sizes based on demand
-   **Member Retention**: Identify at-risk members and engagement opportunities
-   **Revenue Optimization**: Focus on high-performing classes and time slots
-   **Operational Efficiency**: Monitor capacity utilization and class distribution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

-   Follow TypeScript best practices
-   Write comprehensive tests for new features
-   Update documentation for API changes
-   Ensure all tests pass before submitting PR
-   Follow the existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

-   Create an issue in the repository
-   Check the documentation
-   Review the test examples for usage patterns

## 🔄 Changelog

### v1.0.0 - Initial Release

-   Core gym management functionality
-   Advanced analytics system
-   Comprehensive test suite
-   Production-ready architecture
-   Full TypeScript implementation
-   RESTful API with proper documentation
