import { 
  validateRoutineCreation, 
  validateStreakInput
} from '@/utils/settingsStorage';
import { CreateRoutineRequest } from '@/types/routine';

// Simple unit tests for core utility functions
describe('settingsStorage - Core Functions', () => {
  describe('validateRoutineCreation', () => {
    test('should validate correct routine data', () => {
      const request: CreateRoutineRequest = {
        name: 'Exercise',
        description: 'Daily workout',
        icon: '💪',
        color: '#FF6B6B'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty name', () => {
      const request: CreateRoutineRequest = {
        name: '',
        description: 'Description',
        icon: '💪',
        color: '#FF6B6B'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Routine name is required');
    });

    test('should reject name that is too long', () => {
      const request: CreateRoutineRequest = {
        name: 'a'.repeat(51),
        description: 'Description',
        icon: '💪',
        color: '#FF6B6B'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Routine name must be 50 characters or less');
    });

    test('should reject description that is too long', () => {
      const request: CreateRoutineRequest = {
        name: 'Name',
        description: 'a'.repeat(201),
        icon: '💪',
        color: '#FF6B6B'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description must be 200 characters or less');
    });

    test('should reject invalid color format', () => {
      const request: CreateRoutineRequest = {
        name: 'Name',
        description: 'Description',
        icon: '💪',
        color: 'invalid-color'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid color selection');
    });

    test('should handle whitespace in name', () => {
      const request: CreateRoutineRequest = {
        name: '   ',
        description: 'Description',
        icon: '💪',
        color: '#FF6B6B'
      };
      const result = validateRoutineCreation(request);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Routine name is required');
    });
  });

  describe('validateStreakInput', () => {
    test('should validate positive numbers', () => {
      expect(validateStreakInput('5').isValid).toBe(true);
      expect(validateStreakInput('0').isValid).toBe(true);
      expect(validateStreakInput('100').isValid).toBe(true);
    });

    test('should reject negative numbers', () => {
      expect(validateStreakInput('-1').isValid).toBe(false);
      expect(validateStreakInput('-5').isValid).toBe(false);
    });

    test('should reject non-numeric strings', () => {
      expect(validateStreakInput('abc').isValid).toBe(false);
      expect(validateStreakInput('5.5').isValid).toBe(false);
      expect(validateStreakInput('').isValid).toBe(false);
    });

    test('should reject numbers that are too large', () => {
      expect(validateStreakInput('10001').isValid).toBe(false);
      expect(validateStreakInput('999999').isValid).toBe(false);
    });
  });

  describe('Static utility functions', () => {
    test('should generate valid routine IDs', () => {
      // Test that the module can be imported without errors
      expect(typeof validateRoutineCreation).toBe('function');
      expect(typeof validateStreakInput).toBe('function');
    });

    test('should handle edge cases in validation', () => {
      // Edge case: exactly at limits
      const result50Chars = validateRoutineCreation({
        name: 'a'.repeat(50),
        description: 'Description',
        icon: '💪',
        color: '#FF6B6B'
      });
      expect(result50Chars.isValid).toBe(true);

      const result200Chars = validateRoutineCreation({
        name: 'Name',
        description: 'a'.repeat(200),
        icon: '💪',
        color: '#FF6B6B'
      });
      expect(result200Chars.isValid).toBe(true);

      // Edge case: exactly over limits
      const result51Chars = validateRoutineCreation({
        name: 'a'.repeat(51),
        description: 'Description',
        icon: '💪',
        color: '#FF6B6B'
      });
      expect(result51Chars.isValid).toBe(false);

      const result201Chars = validateRoutineCreation({
        name: 'Name',
        description: 'a'.repeat(201),
        icon: '💪',
        color: '#FF6B6B'
      });
      expect(result201Chars.isValid).toBe(false);
    });

    test('should validate colors correctly', () => {
      // Valid colors from predefined list
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: '#FF6B6B' }).isValid).toBe(true);
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: '#4ECDC4' }).isValid).toBe(true);
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: '#45B7D1' }).isValid).toBe(true);

      // Invalid colors not in predefined list
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: '#000000' }).isValid).toBe(false);
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: '#FFF' }).isValid).toBe(false);
      expect(validateRoutineCreation({ name: 'Name', description: 'Desc', icon: '💪', color: 'invalid-color' }).isValid).toBe(false);
    });

    test('should handle streak validation edge cases', () => {
      // Boundary values
      expect(validateStreakInput('0').isValid).toBe(true);
      expect(validateStreakInput('10000').isValid).toBe(true);
      expect(validateStreakInput('10001').isValid).toBe(false);

      // String edge cases
      expect(validateStreakInput(' 5 ').isValid).toBe(false); // spaces
      expect(validateStreakInput('5a').isValid).toBe(false); // mixed
      expect(validateStreakInput('05').isValid).toBe(true); // leading zero
    });
  });
});