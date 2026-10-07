import { describe, it, expect } from 'vitest';
import { updateStatLogic } from './LiveTracker.utils';

describe('updateStatLogic', () => {
    const initialState = {
        player1: {
            1: { goals: 0, assists: 1 },
            2: { goals: 2, assists: 0 }
        },
        player2: {
            1: { goals: 0, assists: 0 }
        }
    };

    it('should increment a stat correctly', () => {
        const newState = updateStatLogic(initialState, 'player1', 1, 'goals', 1);

        // Assert the changed value
        expect(newState.player1[1].goals).toBe(1);

        // Assert immutability / unchanged values
        expect(newState.player1[1].assists).toBe(1); // Same period, other stat
        expect(newState.player1[2].goals).toBe(2);   // Other period
        expect(newState.player2[1].goals).toBe(0);   // Other player

        // Ensure we didn't mutate the original state
        expect(initialState.player1[1].goals).toBe(0);
    });

    it('should decrement a stat correctly', () => {
        const newState = updateStatLogic(initialState, 'player1', 2, 'goals', -1);

        // Assert the changed value
        expect(newState.player1[2].goals).toBe(1);
    });

    it('should not allow stats to go below 0 (Math.max logic)', () => {
        // Trying to decrement below 0
        const newState = updateStatLogic(initialState, 'player1', 1, 'goals', -1);

        // Assert the changed value is floored at 0
        expect(newState.player1[1].goals).toBe(0);

        // Decrement by more than 1
        const newState2 = updateStatLogic(initialState, 'player1', 2, 'goals', -5);
        expect(newState2.player1[2].goals).toBe(0);
    });
});
