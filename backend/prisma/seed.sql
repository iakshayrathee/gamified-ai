-- SQL Script to Seed Database
-- Run this in NeonDB SQL Editor

-- Insert Admin User
INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  'admin_001',
  'Admin User',
  'admin@literacy.com',
  '$2a$10$rOzJw8V8xKxB5vH5qN5qXeYGxN5qN5qXeYGxN5qN5qXeYGxN5qN5q', -- bcrypt hash of 'admin123'
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Teacher User
INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  'teacher_001',
  'Ms. Sarah Johnson',
  'teacher@literacy.com',
  '$2a$10$rOzJw8V8xKxB5vH5qN5qXeYGxN5qN5qXeYGxN5qN5qXeYGxN5qN5q', -- bcrypt hash of 'teacher123'
  'TEACHER',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Child Users
INSERT INTO "User" (id, name, "childPin", role, "teacherId", "createdAt", "updatedAt")
VALUES 
  ('child_001', 'Emma Wilson', '1234', 'CHILD', 'teacher_001', NOW(), NOW()),
  ('child_002', 'Liam Brown', '5678', 'CHILD', 'teacher_001', NOW(), NOW()),
  ('child_003', 'Sophia Davis', '9012', 'CHILD', 'teacher_001', NOW(), NOW())
ON CONFLICT ("childPin") DO NOTHING;

-- Insert Skill Domain
INSERT INTO "SkillDomain" (id, code, name, description, "order", "createdAt", "updatedAt")
VALUES (
  'domain_a',
  'A',
  'Letter Identification',
  'Recognizing and identifying uppercase and lowercase letters',
  1,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Insert Micro Skills
INSERT INTO "MicroSkill" (id, code, name, "domainId", "gameTemplate", "prerequisiteSkills", "nextSkills", "masteryCriteria", "createdAt", "updatedAt")
VALUES 
  (
    'skill_a1',
    'A.1',
    'Identify Uppercase Letters',
    'domain_a',
    'TAP_SELECT',
    '[]'::jsonb,
    '["A.2"]'::jsonb,
    '{"accuracyThreshold": 80, "timeThreshold": 4, "confusionErrorThreshold": 20}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'skill_a2',
    'A.2',
    'Identify Lowercase Letters',
    'domain_a',
    'TAP_SELECT',
    '["A.1"]'::jsonb,
    '["B.1"]'::jsonb,
    '{"accuracyThreshold": 80, "timeThreshold": 4, "confusionErrorThreshold": 20}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (code) DO NOTHING;

-- Verify inserts
SELECT 'Users:', COUNT(*) FROM "User";
SELECT 'Domains:', COUNT(*) FROM "SkillDomain";
SELECT 'Skills:', COUNT(*) FROM "MicroSkill";
