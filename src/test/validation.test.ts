import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Auth validation schema (matches Auth.tsx)
const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Behavioral form validation
const behaviorSchema = z.object({
  sleep_duration: z.number().min(0).max(24),
  screen_time: z.number().min(0).max(24),
  physical_activity: z.number().min(0),
});

// Wearable form validation
const wearableSchema = z.object({
  heart_rate: z.number().min(30).max(220),
  steps: z.number().min(0),
});

describe('Auth Validation', () => {
  it('should accept valid email and password', () => {
    const result = authSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = authSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = authSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty fields', () => {
    const result = authSchema.safeParse({
      email: '',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('Behavior Data Validation', () => {
  it('should accept valid behavior data', () => {
    const result = behaviorSchema.safeParse({
      sleep_duration: 7.5,
      screen_time: 4,
      physical_activity: 8000,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative sleep duration', () => {
    const result = behaviorSchema.safeParse({
      sleep_duration: -1,
      screen_time: 4,
      physical_activity: 8000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject sleep duration over 24 hours', () => {
    const result = behaviorSchema.safeParse({
      sleep_duration: 25,
      screen_time: 4,
      physical_activity: 8000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative steps', () => {
    const result = behaviorSchema.safeParse({
      sleep_duration: 8,
      screen_time: 4,
      physical_activity: -100,
    });
    expect(result.success).toBe(false);
  });

  it('should accept zero values', () => {
    const result = behaviorSchema.safeParse({
      sleep_duration: 0,
      screen_time: 0,
      physical_activity: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('Wearable Data Validation', () => {
  it('should accept valid wearable data', () => {
    const result = wearableSchema.safeParse({
      heart_rate: 72,
      steps: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('should reject heart rate below 30', () => {
    const result = wearableSchema.safeParse({
      heart_rate: 20,
      steps: 5000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject heart rate above 220', () => {
    const result = wearableSchema.safeParse({
      heart_rate: 250,
      steps: 5000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative steps', () => {
    const result = wearableSchema.safeParse({
      heart_rate: 72,
      steps: -100,
    });
    expect(result.success).toBe(false);
  });

  it('should accept edge case values', () => {
    const lowHr = wearableSchema.safeParse({ heart_rate: 30, steps: 0 });
    const highHr = wearableSchema.safeParse({ heart_rate: 220, steps: 50000 });
    
    expect(lowHr.success).toBe(true);
    expect(highHr.success).toBe(true);
  });
});
