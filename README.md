# ABC Ignite API

A Software-as-a-Service solution for workout clubs/gyms to manage classes, bookings, members, and memberships.

## Business Requirements Implementation

### Story 1: Create Classes

**As a club owner, I want to be able to create classes for my club so that my members can attend classes.**

#### Acceptance Criteria ✅
- ✅ API to create a class with required details: Name, Start Date, End Date, Start Time, Duration, Capacity
- ✅ One class per day is created for the date range
- ✅ Class name does not need to be unique
- ✅ Capacity must be at least 1
- ✅ End date must be in the future

#### API Endpoint
```
POST /api/classes
```

#### Request Body
```json
{
  "name": "Pilates",
  "startDate": "2025-12-01",
  "endDate": "2025-12-20",
  "startTime": "14:00",
  "durationMinutes": 60,
  "maxCapacity": 10,
  "instructorId": "instructor-123",
  "instructorName": "John Doe",
  "classType": "pilates",
  "description": "Pilates class for all levels"
}
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "class-1",
      "name": "Pilates",
      "startDate": "2025-12-01T00:00:00.000Z",
      "endDate": "2025-12-01T00:00:00.000Z",
      "startTime": "14:00",
      "endTime": "15:00",
      "maxCapacity": 10,
      "instructorName": "John Doe",
      "status": "active"
    }
    // ... 19 more classes (one for each day)
  ],
  "message": "Successfully created 20 classes"
}
```

### Story 2: Book a Class

**As a member of a studio, I want to book myself for a class, so that I can attend.**

#### Acceptance Criteria ✅
- ✅ API to create a booking with required details: Member name, Class, Participation Date
- ✅ Cannot exceed class capacity
- ✅ Member may book multiple classes for the same day and time (no availability validation)
- ✅ Participation date must be in the future

#### API Endpoint
```
POST /api/bookings
```

#### Request Body
```json
{
  "classId": "class-1",
  "memberName": "Jane Smith",
  "participationDate": "2025-12-01",
  "memberEmail": "jane@example.com",
  "memberPhone": "+1234567890"
}
```

#### Response
```json
{
	"success": true,
	"data": {
    "id": "booking-1",
    "classId": "class-1",
    "memberName": "Jane Smith",
    "memberEmail": "jane@example.com",
    "participationDate": "2025-12-01T00:00:00.000Z",
    "status": "confirmed"
  }
}
```

### Story 3: Search Bookings

**As a club owner, I want to review the bookings for my classes**

#### Acceptance Criteria ✅
- ✅ API to search bookings
- ✅ Search by member (show all bookings for a member)
- ✅ Search for a date range (show all bookings between dates)
- ✅ Combine both member and date range
- ✅ Results include: class name, class start time, booking date, member

#### API Endpoint
```
GET /api/bookings/search?member=Jane&startDate=2025-12-01&endDate=2025-12-10
```

#### Query Parameters
- `member` (optional): Member name to search for
- `startDate` (optional): Start date for range search (YYYY-MM-DD)
- `endDate` (optional): End date for range search (YYYY-MM-DD)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-1",
      "classId": "class-1",
  "memberName": "Jane Smith",
      "memberEmail": "jane@example.com",
      "participationDate": "2025-12-01T00:00:00.000Z",
      "className": "Pilates",
      "classStartTime": "14:00",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Technical Implementation

### Architecture
- **Framework**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: None (as per requirements)
- **API Design**: RESTful standards

### Key Features
- **Business Logic Validation**: All business rules are enforced in the service layer
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Logging**: Request/response logging with performance metrics
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **Database Connection Pooling**: Efficient database connection management

### Database Schema
The implementation uses the existing database schema without modifications, ensuring:
- All existing data is preserved
- No breaking changes to existing functionality
- Business logic is implemented in the application layer

### Business Logic Implementation

#### Class Creation Logic
1. **Validation**: Ensures all required fields are present
2. **Date Validation**: End date must be in the future
3. **Capacity Validation**: Must be at least 1
4. **Time Format Validation**: Start time must be in HH:MM format
5. **Class Generation**: Creates one class per day for the entire date range
6. **End Time Calculation**: Automatically calculates end time based on duration

#### Booking Logic
1. **Required Fields**: Validates classId, memberName, and participationDate
2. **Class Existence**: Ensures the class exists and is active
3. **Date Validation**: Participation date must be in the future
4. **Capacity Check**: Prevents exceeding class capacity
5. **Member Management**: Creates or finds member records automatically
6. **No Duplicate Prevention**: Allows multiple bookings per member per class (as per requirements)

#### Search Logic
1. **Flexible Search**: Supports member name, date range, or both
2. **Class Details**: Automatically includes class name and start time in results
3. **Pagination**: Supports limit and offset for large result sets
4. **Efficient Queries**: Uses database indexes for optimal performance

## Setup and Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd abc-ignite-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database configuration

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abc_ignite
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development
```

### API Documentation
The API follows RESTful conventions:
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create classes
- `GET /api/classes/:id` - Get class by ID
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/search` - Search bookings
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "Class Creation"
```

### Test Coverage
The implementation includes comprehensive tests for:
- Business logic validation
- API endpoints
- Error handling
- Database operations
- Edge cases

## Performance Considerations

### Database Optimization
- Connection pooling for efficient database connections
- Proper indexing on frequently queried fields
- Optimized queries with joins for related data

### API Performance
- Request/response logging with performance metrics
- Efficient error handling without unnecessary database calls
- Pagination support for large datasets

## Security Considerations

### Input Validation
- Comprehensive validation of all input parameters
- SQL injection prevention through parameterized queries
- XSS prevention through proper output encoding

### Error Handling
- No sensitive information exposed in error messages
- Proper HTTP status codes for different error types
- Structured error responses for client consumption

## Future Enhancements

### Potential Improvements
1. **Authentication & Authorization**: Add user authentication and role-based access
2. **Real-time Updates**: WebSocket support for live booking updates
3. **Email Notifications**: Automated email confirmations for bookings
4. **Mobile API**: Optimized endpoints for mobile applications
5. **Analytics Dashboard**: Enhanced reporting and analytics features

### Scalability Considerations
- Horizontal scaling support through stateless design
- Database read replicas for improved performance
- Caching layer for frequently accessed data
- Microservices architecture for future growth

## Support

For questions or issues, please refer to the API documentation or contact the development team.

---

**Note**: This implementation strictly follows the provided business requirements while maintaining the existing database schema and adding only the necessary business logic in the application layer.
