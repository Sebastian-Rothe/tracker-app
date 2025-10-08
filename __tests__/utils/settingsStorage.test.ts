import { 
  validateRoutineCreation, 
  validateStreakInput, 
  loadRoutines, 
  createRoutine, 
  updateRoutine,
  deleteRoutine 
} from '@/utils/settingsStorage';
import { CreateRoutineRequest, Routine } from '@/types/routine';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('settingsStorage', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('validateRoutineCreation', () => {
    test('should return valid for correct routine data', () => {
      const validRoutine: CreateRoutineRequest = {
        name: 'Morning Exercise',
        description: 'Daily workout',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 5
      };

      const result = validateRoutineCreation(validRoutine);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return invalid for empty name', () => {
      const invalidRoutine: CreateRoutineRequest = {
        name: '',
        description: 'Daily workout',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 5
      };

      const result = validateRoutineCreation(invalidRoutine);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    test('should return invalid for name too long', () => {
      const invalidRoutine: CreateRoutineRequest = {
        name: 'A'.repeat(51), // 51 characters
        description: 'Daily workout',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 5
      };

      const result = validateRoutineCreation(invalidRoutine);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name must be 50 characters or less');
    });

    test('should return invalid for description too long', () => {
      const invalidRoutine: CreateRoutineRequest = {
        name: 'Exercise',
        description: 'A'.repeat(201), // 201 characters
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 5
      };

      const result = validateRoutineCreation(invalidRoutine);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Description must be 200 characters or less');
    });
  });

  describe('validateStreakInput', () => {
    test('should return valid for valid streak numbers', () => {
      expect(validateStreakInput('0')).toBe(true);
      expect(validateStreakInput('1')).toBe(true);
      expect(validateStreakInput('99')).toBe(true);
      expect(validateStreakInput('999')).toBe(true);
      expect(validateStreakInput('9999')).toBe(true);
      expect(validateStreakInput('10000')).toBe(true); // Max allowed value
    });

    test('should return invalid for non-numeric input', () => {
      expect(validateStreakInput('abc')).toBe(false);
      expect(validateStreakInput('12.5')).toBe(false);
      expect(validateStreakInput('-5')).toBe(false);
      expect(validateStreakInput('')).toBe(false);
      expect(validateStreakInput(' ')).toBe(false);
      expect(validateStreakInput('1a')).toBe(false);
    });

    test('should return invalid for numbers too large', () => {
      expect(validateStreakInput('10001')).toBe(false);
      expect(validateStreakInput('99999')).toBe(false);
      expect(validateStreakInput('999999')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateStreakInput('00')).toBe(true); // Leading zeros
      expect(validateStreakInput('000')).toBe(true);
      expect(validateStreakInput(' 5 ')).toBe(false); // Whitespace
      expect(validateStreakInput('\t10\n')).toBe(false); // Tabs/newlines
    });
  });

  describe('routine CRUD operations', () => {
    test('should create and load routine successfully', async () => {
      const routineRequest: CreateRoutineRequest = {
        name: 'Test Routine',
        description: 'Test Description',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 0
      };

      const createdRoutine = await createRoutine(routineRequest);
      
      expect(createdRoutine).toBeDefined();
      expect(createdRoutine.name).toBe('Test Routine');
      expect(createdRoutine.description).toBe('Test Description');
      expect(createdRoutine.color).toBe('#FF6B6B');
      expect(createdRoutine.icon).toBe('💪');
      expect(createdRoutine.streak).toBe(0);
      expect(createdRoutine.isActive).toBe(true);

      const routines = await loadRoutines();
      expect(routines).toHaveLength(1);
      expect(routines[0].id).toBe(createdRoutine.id);
    });

    test('should update routine successfully', async () => {
      // Create routine first
      const routineRequest: CreateRoutineRequest = {
        name: 'Original Name',
        description: 'Original Description',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 0
      };

      const createdRoutine = await createRoutine(routineRequest);
      
      // Update routine
      const updatedRoutine = await updateRoutine({
        id: createdRoutine.id,
        name: 'Updated Name',
        description: 'Updated Description',
        color: '#4ECDC4'
      });

      expect(updatedRoutine).not.toBeNull();
      expect(updatedRoutine!.name).toBe('Updated Name');
      expect(updatedRoutine!.description).toBe('Updated Description');
      expect(updatedRoutine!.color).toBe('#4ECDC4');
      expect(updatedRoutine!.icon).toBe('💪'); // Should remain unchanged
    });

    test('should delete routine successfully', async () => {
      // Create routine first
      const routineRequest: CreateRoutineRequest = {
        name: 'To Be Deleted',
        description: 'Will be deleted',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 0
      };

      const createdRoutine = await createRoutine(routineRequest);
      
      // Verify it exists
      let routines = await loadRoutines();
      expect(routines).toHaveLength(1);

      // Delete routine
      await deleteRoutine(createdRoutine.id);

      // Verify it's deleted
      routines = await loadRoutines();
      expect(routines).toHaveLength(0);
    });

    test('should handle multiple routines', async () => {
      const routine1: CreateRoutineRequest = {
        name: 'Routine 1',
        description: 'First routine',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 0
      };

      const routine2: CreateRoutineRequest = {
        name: 'Routine 2',
        description: 'Second routine',
        color: '#4ECDC4',
        icon: '📚',
        initialStreak: 5
      };

      await createRoutine(routine1);
      await createRoutine(routine2);

      const routines = await loadRoutines();
      expect(routines).toHaveLength(2);
      
      const names = routines.map(r => r.name).sort();
      expect(names).toEqual(['Routine 1', 'Routine 2']);
    });

    test('should handle update of non-existent routine', async () => {
      const result = await updateRoutine({
        id: 'non-existent-id',
        name: 'Updated Name'
      });
      
      expect(result).toBeNull();
    });

    test('should handle delete of non-existent routine', async () => {
      // Should not throw error
      await expect(deleteRoutine('non-existent-id')).resolves.not.toThrow();
      
      const routines = await loadRoutines();
      expect(routines).toHaveLength(0);
    });

    test('should preserve routine properties during partial update', async () => {
      const routineRequest: CreateRoutineRequest = {
        name: 'Original',
        description: 'Original Description',
        color: '#FF6B6B',
        icon: '💪',
        initialStreak: 5
      };

      const created = await createRoutine(routineRequest);
      
      // Update only name
      const updated = await updateRoutine({
        id: created.id,
        name: 'New Name'
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('New Name');
      expect(updated!.description).toBe('Original Description'); // Preserved
      expect(updated!.color).toBe('#FF6B6B'); // Preserved
      expect(updated!.icon).toBe('💪'); // Preserved
      expect(updated!.streak).toBe(5); // Preserved
    });

    test('should handle empty routines list', async () => {
      const routines = await loadRoutines();
      expect(routines).toEqual([]);
      expect(routines).toHaveLength(0);
    });
  });

  describe('validation edge cases', () => {
    test('should validate routine with optional properties', () => {
      const minimalRoutine: CreateRoutineRequest = {
        name: 'Minimal',
        color: '#FF6B6B',
        icon: '💪'
      };

      const result = validateRoutineCreation(minimalRoutine);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should handle whitespace-only name', () => {
      const invalidRoutine: CreateRoutineRequest = {
        name: '   ',
        color: '#FF6B6B',
        icon: '💪'
      };

      const result = validateRoutineCreation(invalidRoutine);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    test('should validate color formats', () => {
      const validColors = ['#FF6B6B', '#000000', '#FFF', '#123abc'];
      const invalidColors = ['FF6B6B', '#GG6B6B', '#FF6B6BZ', 'red', ''];

      validColors.forEach(color => {
        const result = validateRoutineCreation({
          name: 'Test',
          color,
          icon: '💪'
        });
        expect(result.isValid).toBe(true);
      });

      invalidColors.forEach(color => {
        const result = validateRoutineCreation({
          name: 'Test',
          color,
          icon: '💪'
        });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid color format');
      });
    });
  });
});