-- ABC Ignite Gym Management System Database Schema
-- Production-grade schema with comprehensive indexing and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    specialization VARCHAR(100),
    bio TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create classes table with comprehensive constraints
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE RESTRICT,
    instructor_name VARCHAR(100) NOT NULL,
    class_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    max_capacity INTEGER NOT NULL CHECK (max_capacity >= 1 AND max_capacity <= 100),
    price DECIMAL(10,2) DEFAULT 0.00 CHECK (price >= 0),
    location VARCHAR(255),
    room VARCHAR(100),
    equipment_needed JSONB,
    difficulty_level VARCHAR(20) DEFAULT 'all_levels' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
    tags JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure end_date is after start_date
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    membership_type VARCHAR(50) DEFAULT 'standard',
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'expired')),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    medical_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table with comprehensive constraints
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_name VARCHAR(100) NOT NULL,
    member_email VARCHAR(255) NOT NULL,
    member_phone VARCHAR(50),
    participation_date DATE NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')),
    attended_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES members(id),
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure participation_date is not in the past
    CONSTRAINT valid_participation_date CHECK (participation_date >= CURRENT_DATE)
);

-- Create class_attendance table for detailed attendance tracking
CREATE TABLE IF NOT EXISTS class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    attended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique attendance per booking
    UNIQUE(booking_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_start_date ON classes(start_date);
CREATE INDEX IF NOT EXISTS idx_classes_end_date ON classes(end_date);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_class_type ON classes(class_type);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_name ON classes(instructor_name);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_member_id ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_participation_date ON bookings(participation_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_class_attendance_class_id ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_member_id ON class_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_attended_at ON class_attendance(attended_at);

CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(status);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON members(membership_status);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_classes_date_range ON classes(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_class_date ON bookings(class_id, participation_date);
CREATE INDEX IF NOT EXISTS idx_bookings_member_date ON bookings(member_id, participation_date);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_classes_search ON classes USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_instructors_search ON instructors USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS idx_members_search ON members USING gin(to_tsvector('english', name || ' ' || COALESCE(medical_notes, '')));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check class capacity
CREATE OR REPLACE FUNCTION check_class_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_bookings INTEGER;
    max_capacity INTEGER;
BEGIN
    -- Get current booking count for the class
    SELECT COUNT(*) INTO current_bookings
    FROM bookings
    WHERE class_id = NEW.class_id
    AND status IN ('pending', 'confirmed');
    
    -- Get max capacity for the class
    SELECT c.max_capacity INTO max_capacity
    FROM classes c
    WHERE c.id = NEW.class_id;
    
    -- Check if adding this booking would exceed capacity
    IF current_bookings >= max_capacity THEN
        RAISE EXCEPTION 'Class is at maximum capacity';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for capacity checking
CREATE TRIGGER check_class_capacity_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_class_capacity();

-- Create function to prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    existing_booking INTEGER;
BEGIN
    -- Check if member already has a booking for this class
    SELECT COUNT(*) INTO existing_booking
    FROM bookings
    WHERE class_id = NEW.class_id
    AND member_id = NEW.member_id
    AND status IN ('pending', 'confirmed')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');
    
    IF existing_booking > 0 THEN
        RAISE EXCEPTION 'Member already has a booking for this class';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for double booking prevention
CREATE TRIGGER prevent_double_booking_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION prevent_double_booking();

-- Create view for class statistics
CREATE OR REPLACE VIEW class_statistics AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.instructor_name,
    c.class_type,
    c.start_date,
    c.end_date,
    c.max_capacity,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COUNT(CASE WHEN b.status = 'attended' THEN 1 END) as attended_bookings,
    COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_show_bookings,
    CASE 
        WHEN COUNT(b.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN b.status = 'attended' THEN 1 END)::DECIMAL / COUNT(b.id)::DECIMAL) * 100, 2)
        ELSE 0 
    END as attendance_rate
FROM classes c
LEFT JOIN bookings b ON c.id = b.class_id
GROUP BY c.id, c.name, c.instructor_name, c.class_type, c.start_date, c.end_date, c.max_capacity;

-- Create view for booking statistics
CREATE OR REPLACE VIEW booking_statistics AS
SELECT 
    DATE_TRUNC('day', participation_date) as date,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COUNT(CASE WHEN status = 'attended' THEN 1 END) as attended_bookings,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_bookings,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(CASE WHEN status = 'attended' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
        ELSE 0 
    END as attendance_rate
FROM bookings
GROUP BY DATE_TRUNC('day', participation_date)
ORDER BY date DESC;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres; 