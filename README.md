# ABC Ignite API

A production-grade Gym Management System API built with Node.js, Express, and PostgreSQL. This API provides comprehensive functionality for managing gym classes, bookings, and member interactions with a focus on performance, security, and maintainability.

## 📋 Features

### Core Functionality
- **Class Management**: Create, read, update, delete, and search gym classes
- **Booking System**: Manage class bookings with capacity validation
- **Member Management**: Track member participation and attendance
- **Statistics & Analytics**: Comprehensive reporting and insights
- **Search & Filtering**: Advanced search capabilities with multiple filters

### Technical Features
- **High Performance**: Optimized database queries, connection pooling, and caching
- **Security**: Rate limiting, CORS protection, input validation, and sanitization
- **Monitoring**: Comprehensive logging, performance metrics, and health checks
- **Error Handling**: Robust error management with detailed error responses
- **Testing**: Complete test coverage with integration and unit tests
- **Documentation**: Comprehensive JSDoc documentation for all functions

## 🛠️ Technology Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate Limiting
- **Performance**: Compression, Connection Pooling

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL >= 12.0
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd abc-ignite-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abc_ignite
DB_USER=postgres
DB_PASSWORD=your_password

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=30000

# Security Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info

# Performance Configuration
BODY_LIMIT=10mb
DB_STATEMENT_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
```

### 4. Database Setup

```bash
# Create database
createdb abc_ignite

# Run database setup
npm run db:setup

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication
Currently, the API doesn't require authentication. In production, implement JWT or OAuth2 authentication.

### Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successful
```

### Endpoints

#### Classes

##### Create a Class

```http
POST /api/classes
Content-Type: application/json

{
  "name": "Yoga",
  "startDate": "2024-12-01",
  "endDate": "2024-12-31",
  "startTime": "09:00",
  "duration": 60,
  "capacity": 15
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"id": 1,
		"name": "Yoga",
		"start_date": "2024-12-01",
		"end_date": "2024-12-31",
		"start_time": "09:00:00",
		"duration": 60,
		"capacity": 15,
		"created_at": "2024-01-01T00:00:00.000Z"
	},
	"message": "Class created successfully"
}
```

##### Get All Classes

```http
GET /api/classes
```

##### Get Class by ID

```http
GET /api/classes/:id
```

#### Bookings

##### Create a Booking

```http
POST /api/bookings
Content-Type: application/json

{
  "memberName": "Jane Smith",
  "classId": 1,
  "participationDate": "2024-12-05"
}
```

##### Search Bookings

```http
GET /api/bookings?memberName=Jane&startDate=2024-12-01&endDate=2024-12-10
```

**Query Parameters:**

-   `memberName` (optional): Search by member name (partial match)
-   `startDate` (optional): Start date for range search (ISO 8601)
-   `endDate` (optional): End date for range search (ISO 8601)

##### Get Booking by ID

```http
GET /api/bookings/:id
```

##### Get Class Bookings

```http
GET /api/classes/:id/bookings
```

### Validation Rules

#### Class Validation

-   `name`: Required, max 100 characters
-   `startDate`: Required, valid ISO 8601 date
-   `endDate`: Required, valid ISO 8601 date, must be after startDate
-   `startTime`: Required, HH:MM format (24-hour)
-   `duration`: Required, integer between 1-480 minutes
-   `capacity`: Required, integer between 1-1000

#### Booking Validation

-   `memberName`: Required, max 100 characters
-   `classId`: Required, must reference existing class
-   `participationDate`: Required, valid ISO 8601 date, must be in the future and within class date range

## 📊 Database Schema

### Classes Table

```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 480),
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings Table

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    member_name VARCHAR(100) NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    participation_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

-   `idx_classes_date_range`: Optimizes date range queries on classes
-   `idx_bookings_class_date`: Optimizes booking queries by class and date
-   `idx_bookings_member`: Optimizes member name searches
-   `idx_bookings_date`: Optimizes date range queries on bookings

## ⚙️ Configuration

### Environment Variables

| Variable      | Description         | Default       | Required |
| ------------- | ------------------- | ------------- | -------- |
| `PORT`        | Server port         | `3000`        | No       |
| `NODE_ENV`    | Environment mode    | `development` | No       |
| `DB_USER`     | PostgreSQL username | `postgres`    | Yes      |
| `DB_HOST`     | PostgreSQL host     | `localhost`   | Yes      |
| `DB_NAME`     | Database name       | `abc_ignite`  | Yes      |
| `DB_PASSWORD` | Database password   | -             | Yes      |
| `DB_PORT`     | Database port       | `5432`        | No       |
| `LOG_LEVEL`   | Logging level       | `info`        | No       |

### Example .env file

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=abc_ignite
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

-   **Integration Tests**: Test API endpoints with real database
-   **Unit Tests**: Test individual functions and services
-   **Coverage**: Aim for >80% code coverage

### Test Database

Tests use a separate test database (`abc_ignite_test`) to avoid affecting development data.

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image:**

```bash
docker build -t abc-ignite-api .
```

2. **Run the container:**

```bash
docker run -p 3000:3000 \
  -e DB_HOST=your_db_host \
  -e DB_NAME=abc_ignite \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  abc-ignite-api
```

### Production Checklist

-   [ ] Set up PostgreSQL with proper credentials
-   [ ] Configure environment variables
-   [ ] Set up reverse proxy (nginx)
-   [ ] Configure SSL certificates
-   [ ] Set up monitoring and logging
-   [ ] Configure database backups
-   [ ] Set up CI/CD pipeline
-   [ ] Configure rate limiting
-   [ ] Set up authentication/authorization

### Performance Optimization

-   **Database**: Connection pooling, proper indexing
-   **Caching**: Consider Redis for frequently accessed data
-   **Load Balancing**: Use multiple instances behind a load balancer
-   **Monitoring**: Implement application performance monitoring

## 🔒 Security

### Current Security Measures

-   **Input Validation**: All inputs are validated and sanitized
-   **SQL Injection Prevention**: Parameterized queries only
-   **CORS Configuration**: Properly configured for cross-origin requests
-   **Error Handling**: No sensitive information leaked in error messages

### Recommended Security Enhancements

-   **Authentication**: JWT or session-based authentication
-   **Authorization**: Role-based access control
-   **Rate Limiting**: Prevent abuse with rate limiting middleware
-   **HTTPS**: Always use HTTPS in production
-   **API Keys**: Implement API key authentication for external clients
-   **Audit Logging**: Log all sensitive operations

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

-   Follow existing code style and patterns
-   Use meaningful variable and function names
-   Add comments for complex logic
-   Ensure all tests pass
-   Update documentation as needed

## 📈 Future Enhancements

### Planned Features

-   [ ] **Authentication & Authorization**: JWT-based authentication system
-   [ ] **User Management**: User registration, profiles, and roles
-   [ ] **Payment Integration**: Stripe/PayPal integration for paid classes
-   [ ] **Email Notifications**: Automated email reminders and confirmations
-   [ ] **Class Categories**: Organize classes by type (Yoga, Pilates, etc.)
-   [ ] **Instructor Management**: Assign instructors to classes
-   [ ] **Waitlist Functionality**: Handle overbooked classes
-   [ ] **Reporting & Analytics**: Dashboard with booking statistics
-   [ ] **Mobile App Support**: API optimizations for mobile clients

### Technical Improvements

-   [ ] **API Rate Limiting**: Prevent abuse with rate limiting
-   [ ] **Caching Layer**: Redis integration for performance
-   [ ] **Microservices Architecture**: Split into smaller, focused services
-   [ ] **GraphQL Support**: Add GraphQL endpoint alongside REST
-   [ ] **WebSocket Support**: Real-time updates for bookings
-   [ ] **File Upload**: Support for class images and documents
-   [ ] **Internationalization**: Multi-language support
-   [ ] **API Versioning**: Version control for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

-   Create an issue in the GitHub repository
-   Contact the development team
-   Check the documentation and examples

---

**Built with ❤️ by the ABC Ignite Team**
