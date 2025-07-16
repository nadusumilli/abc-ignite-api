-- ABC Ignite Gym Management System - Initial Data Seed
-- This file contains initial data for development and testing environments
-- Optimized for maximum performance with proper indexing and data integrity

-- Clear existing data (if any)
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE classes CASCADE;

-- Reset sequences
ALTER SEQUENCE classes_id_seq RESTART WITH 1;
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;

-- Insert sample instructors (using UUIDs for production-like data)
INSERT INTO classes (
  id,
  name,
  description,
  instructor_id,
  instructor_name,
  class_type,
  start_date,
  end_date,
  start_time,
  end_time,
  duration_minutes,
  max_capacity,
  price,
  location,
  room,
  equipment_needed,
  difficulty_level,
  tags,
  status,
  created_at,
  updated_at
) VALUES
-- Yoga Classes
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Morning Yoga Flow',
  'Start your day with a gentle yoga flow that energizes your body and calms your mind. Perfect for all levels.',
  '123e4567-e89b-12d3-a456-426614174000',
  'Sarah Johnson',
  'yoga',
  '2024-01-15',
  '2024-12-31',
  '07:00',
  '08:00',
  60,
  20,
  15.00,
  'Main Studio',
  'Yoga Room 1',
  '["Yoga Mat", "Blocks", "Strap"]',
  'beginner',
  '["yoga", "morning", "flow", "beginner"]',
  'active',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Power Yoga',
  'High-intensity yoga session focusing on strength, flexibility, and endurance. Not for beginners.',
  '123e4567-e89b-12d3-a456-426614174001',
  'Michael Chen',
  'yoga',
  '2024-01-15',
  '2024-12-31',
  '18:00',
  '19:30',
  90,
  15,
  20.00,
  'Main Studio',
  'Yoga Room 2',
  '["Yoga Mat", "Blocks", "Strap", "Towel"]',
  'advanced',
  '["yoga", "power", "advanced", "strength"]',
  'active',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Gentle Yoga',
  'Slow-paced yoga class perfect for beginners, seniors, or anyone looking for a relaxing practice.',
  '123e4567-e89b-12d3-a456-426614174002',
  'Emma Davis',
  'yoga',
  '2024-01-15',
  '2024-12-31',
  '10:00',
  '11:00',
  60,
  25,
  12.00,
  'Main Studio',
  'Yoga Room 1',
  '["Yoga Mat", "Bolster", "Blanket"]',
  'beginner',
  '["yoga", "gentle", "beginner", "relaxing"]',
  'active',
  NOW(),
  NOW()
),

-- Pilates Classes
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Mat Pilates',
  'Classical Pilates mat work focusing on core strength, flexibility, and body awareness.',
  '123e4567-e89b-12d3-a456-426614174003',
  'Lisa Rodriguez',
  'pilates',
  '2024-01-15',
  '2024-12-31',
  '09:00',
  '10:00',
  60,
  18,
  18.00,
  'Main Studio',
  'Pilates Room',
  '["Pilates Mat", "Resistance Band"]',
  'intermediate',
  '["pilates", "mat", "core", "strength"]',
  'active',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Reformer Pilates',
  'Advanced Pilates using the reformer machine for a full-body workout.',
  '123e4567-e89b-12d3-a456-426614174004',
  'David Wilson',
  'pilates',
  '2024-01-15',
  '2024-12-31',
  '16:00',
  '17:00',
  60,
  8,
  35.00,
  'Equipment Studio',
  'Reformer Room',
  '["Grip Socks"]',
  'advanced',
  '["pilates", "reformer", "advanced", "equipment"]',
  'active',
  NOW(),
  NOW()
),

-- Cardio Classes
(
  '550e8400-e29b-41d4-a716-446655440006',
  'HIIT Cardio',
  'High-Intensity Interval Training to boost your metabolism and burn calories.',
  '123e4567-e89b-12d3-a456-426614174005',
  'Alex Thompson',
  'cardio',
  '2024-01-15',
  '2024-12-31',
  '06:00',
  '07:00',
  60,
  30,
  16.00,
  'Cardio Studio',
  'HIIT Room',
  '["Water Bottle", "Towel", "Running Shoes"]',
  'intermediate',
  '["cardio", "hiit", "high-intensity", "calorie-burn"]',
  'active',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440007',
  'Spinning',
  'Indoor cycling class with energetic music and varied intensity levels.',
  '123e4567-e89b-12d3-a456-426614174006',
  'Jessica Brown',
  'cardio',
  '2024-01-15',
  '2024-12-31',
  '19:00',
  '20:00',
  60,
  20,
  18.00,
  'Cardio Studio',
  'Spinning Room',
  '["Cycling Shoes", "Water Bottle", "Towel"]',
  'intermediate',
  '["cardio", "spinning", "cycling", "music"]',
  'active',
  NOW(),
  NOW()
),

-- Strength Classes
(
  '550e8400-e29b-41d4-a716-446655440008',
  'Total Body Strength',
  'Comprehensive strength training targeting all major muscle groups.',
  '123e4567-e89b-12d3-a456-426614174007',
  'Robert Garcia',
  'strength',
  '2024-01-15',
  '2024-12-31',
  '17:00',
  '18:00',
  60,
  25,
  20.00,
  'Weight Room',
  'Strength Area',
  '["Workout Gloves", "Water Bottle"]',
  'intermediate',
  '["strength", "total-body", "muscle", "fitness"]',
  'active',
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440009',
  'Core & Abs',
  'Focused workout on abdominal and core muscles for a strong center.',
  '123e4567-e89b-12d3-a456-426614174008',
  'Maria Lopez',
  'strength',
  '2024-01-15',
  '2024-12-31',
  '12:00',
  '12:45',
  45,
  30,
  14.00,
  'Main Studio',
  'Core Area',
  '["Yoga Mat", "Water Bottle"]',
  'beginner',
  '["strength", "core", "abs", "beginner"]',
  'active',
  NOW(),
  NOW()
),

-- Dance Classes
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Zumba Fitness',
  'Latin-inspired dance fitness program that combines high-energy music with fun dance moves.',
  '123e4567-e89b-12d3-a456-426614174009',
  'Carlos Mendez',
  'dance',
  '2024-01-15',
  '2024-12-31',
  '20:00',
  '21:00',
  60,
  35,
  16.00,
  'Dance Studio',
  'Zumba Room',
  '["Dance Shoes", "Water Bottle", "Towel"]',
  'beginner',
  '["dance", "zumba", "latin", "fun"]',
  'active',
  NOW(),
  NOW()
),

-- Martial Arts Classes
(
  '550e8400-e29b-41d4-a716-446655440011',
  'Kickboxing',
  'High-energy martial arts class combining boxing and kicking techniques.',
  '123e4567-e89b-12d3-a456-426614174010',
  'Tyler Anderson',
  'martial-arts',
  '2024-01-15',
  '2024-12-31',
  '18:30',
  '19:30',
  60,
  20,
  22.00,
  'Martial Arts Studio',
  'Kickboxing Ring',
  '["Boxing Gloves", "Hand Wraps", "Water Bottle"]',
  'intermediate',
  '["martial-arts", "kickboxing", "boxing", "self-defense"]',
  'active',
  NOW(),
  NOW()
),

-- Swimming Classes
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Swimming Lessons',
  'Learn proper swimming techniques and improve your water confidence.',
  '123e4567-e89b-12d3-a456-426614174011',
  'Amanda Foster',
  'swimming',
  '2024-01-15',
  '2024-12-31',
  '14:00',
  '15:00',
  60,
  8,
  25.00,
  'Aquatic Center',
  'Pool Lane 1',
  '["Swimsuit", "Goggles", "Towel"]',
  'beginner',
  '["swimming", "lessons", "beginner", "aquatic"]',
  'active',
  NOW(),
  NOW()
),

-- Cycling Classes
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Indoor Cycling',
  'Low-impact cardio workout on stationary bikes with motivating music.',
  '123e4567-e89b-12d3-a456-426614174012',
  'Kevin Park',
  'cycling',
  '2024-01-15',
  '2024-12-31',
  '07:30',
  '08:30',
  60,
  15,
  18.00,
  'Cardio Studio',
  'Cycling Room',
  '["Cycling Shoes", "Water Bottle", "Towel"]',
  'intermediate',
  '["cycling", "indoor", "cardio", "low-impact"]',
  'active',
  NOW(),
  NOW()
),

-- Boxing Classes
(
  '550e8400-e29b-41d4-a716-446655440014',
  'Boxing Basics',
  'Learn fundamental boxing techniques including stance, punches, and footwork.',
  '123e4567-e89b-12d3-a456-426614174013',
  'Marcus Johnson',
  'boxing',
  '2024-01-15',
  '2024-12-31',
  '19:30',
  '20:30',
  60,
  12,
  24.00,
  'Martial Arts Studio',
  'Boxing Ring',
  '["Boxing Gloves", "Hand Wraps", "Mouth Guard"]',
  'beginner',
  '["boxing", "basics", "technique", "beginner"]',
  'active',
  NOW(),
  NOW()
),

-- CrossFit Classes
(
  '550e8400-e29b-41d4-a716-446655440015',
  'CrossFit WOD',
  'High-intensity functional fitness workout of the day.',
  '123e4567-e89b-12d3-a456-426614174014',
  'Rachel Green',
  'crossfit',
  '2024-01-15',
  '2024-12-31',
  '05:30',
  '06:30',
  60,
  15,
  28.00,
  'CrossFit Box',
  'Main Floor',
  '["CrossFit Shoes", "Water Bottle", "Towel"]',
  'advanced',
  '["crossfit", "wod", "functional", "high-intensity"]',
  'active',
  NOW(),
  NOW()
);

-- Insert sample bookings
INSERT INTO bookings (
  id,
  class_id,
  user_id,
  user_name,
  booking_date,
  status,
  notes,
  created_at,
  updated_at
) VALUES
-- Sample bookings for various classes
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440001',
  'John Smith',
  '2024-01-20',
  'confirmed',
  'First time attending yoga class',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440002',
  'Jane Doe',
  '2024-01-20',
  'confirmed',
  'Regular attendee',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440002',
  '770e8400-e29b-41d4-a716-446655440003',
  'Mike Johnson',
  '2024-01-20',
  'confirmed',
  'Advanced yoga practitioner',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440006',
  '770e8400-e29b-41d4-a716-446655440004',
  'Sarah Wilson',
  '2024-01-20',
  'confirmed',
  'Looking for high-intensity workout',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440008',
  '770e8400-e29b-41d4-a716-446655440005',
  'David Brown',
  '2024-01-20',
  'confirmed',
  'Strength training enthusiast',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440010',
  '770e8400-e29b-41d4-a716-446655440006',
  'Lisa Davis',
  '2024-01-20',
  'confirmed',
  'Dance fitness lover',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440011',
  '770e8400-e29b-41d4-a716-446655440007',
  'Tom Anderson',
  '2024-01-20',
  'confirmed',
  'Martial arts beginner',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440012',
  '770e8400-e29b-41d4-a716-446655440008',
  'Emma Taylor',
  '2024-01-20',
  'confirmed',
  'Learning to swim',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440013',
  '770e8400-e29b-41d4-a716-446655440009',
  'Chris Lee',
  '2024-01-20',
  'confirmed',
  'Cycling enthusiast',
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440014',
  '770e8400-e29b-41d4-a716-446655440010',
  'Alex Rodriguez',
  '2024-01-20',
  'confirmed',
  'Boxing basics student',
  NOW(),
  NOW()
);

-- Update class statistics
UPDATE classes 
SET 
  total_bookings = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE bookings.class_id = classes.id
  ),
  confirmed_bookings = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE bookings.class_id = classes.id 
    AND bookings.status = 'confirmed'
  ),
  updated_at = NOW();

-- Display seed data summary
SELECT 
  'Classes seeded: ' || COUNT(*) as summary
FROM classes
UNION ALL
SELECT 
  'Bookings seeded: ' || COUNT(*) as summary
FROM bookings
UNION ALL
SELECT 
  'Active classes: ' || COUNT(*) as summary
FROM classes 
WHERE status = 'active'; 