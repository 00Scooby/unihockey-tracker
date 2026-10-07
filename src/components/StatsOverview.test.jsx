import { describe, it, expect } from 'vitest';
import { calculateSingleGameStats } from './StatsOverview';

describe('calculateSingleGameStats', () => {
    it('returns empty stats if no game data is provided', () => {
        const game = { stats: {} };
        const playerId = 'player1';

        const result = calculateSingleGameStats(game, playerId, 'Total');

        expect(result).toMatchObject({
            goals: 0,
            assists: 0,
            plus: 0,
            minus: 0,
            saves: 0,
            goalsAgainst: 0,
            points: 0,
            diff: 0,
            savePercentage: 0
        });
    });

    it('accumulates stats across all periods for Total filter', () => {
        const game = {
            stats: {
                player1: {
                    1: { goals: 1, assists: 2, plus: 1, minus: 0, saves: 0, goalsAgainst: 0 },
                    2: { goals: 0, assists: 1, plus: 0, minus: 1, saves: 0, goalsAgainst: 0 },
                    3: { goals: 2, assists: 0, plus: 2, minus: 0, saves: 0, goalsAgainst: 0 }
                }
            }
        };
        const playerId = 'player1';

        const result = calculateSingleGameStats(game, playerId, 'Total');

        expect(result.goals).toBe(3);
        expect(result.assists).toBe(3);
        expect(result.plus).toBe(3);
        expect(result.minus).toBe(1);
        expect(result.points).toBe(6); // 3 + 3
        expect(result.diff).toBe(2);   // 3 - 1
    });

    it('accumulates stats across all periods for Avg filter', () => {
        const game = {
            stats: {
                player1: {
                    1: { goals: 1, assists: 2, plus: 1, minus: 0, saves: 0, goalsAgainst: 0 },
                    2: { goals: 0, assists: 1, plus: 0, minus: 1, saves: 0, goalsAgainst: 0 },
                    3: { goals: 2, assists: 0, plus: 2, minus: 0, saves: 0, goalsAgainst: 0 }
                }
            }
        };
        const playerId = 'player1';

        // Single game stats for Avg still accumulate the whole game
        const result = calculateSingleGameStats(game, playerId, 'Avg');

        expect(result.goals).toBe(3);
        expect(result.assists).toBe(3);
        expect(result.plus).toBe(3);
        expect(result.minus).toBe(1);
        expect(result.points).toBe(6);
        expect(result.diff).toBe(2);
    });

    it('returns stats only for a specific period', () => {
        const game = {
            stats: {
                player1: {
                    1: { goals: 1, assists: 2, plus: 1, minus: 0, saves: 0, goalsAgainst: 0 },
                    2: { goals: 0, assists: 1, plus: 0, minus: 1, saves: 0, goalsAgainst: 0 },
                    3: { goals: 2, assists: 0, plus: 2, minus: 0, saves: 0, goalsAgainst: 0 }
                }
            }
        };
        const playerId = 'player1';

        const result = calculateSingleGameStats(game, playerId, '2');

        expect(result.goals).toBe(0);
        expect(result.assists).toBe(1);
        expect(result.plus).toBe(0);
        expect(result.minus).toBe(1);
        expect(result.points).toBe(1);
        expect(result.diff).toBe(-1);
    });

    it('correctly calculates save percentage for goalies', () => {
        const game = {
            stats: {
                goalie1: {
                    1: { goals: 0, assists: 0, plus: 0, minus: 0, saves: 8, goalsAgainst: 2 },
                    2: { goals: 0, assists: 0, plus: 0, minus: 0, saves: 10, goalsAgainst: 0 },
                    3: { goals: 0, assists: 0, plus: 0, minus: 0, saves: 6, goalsAgainst: 1 }
                }
            }
        };

        const result = calculateSingleGameStats(game, 'goalie1', 'Total');

        expect(result.saves).toBe(24);
        expect(result.goalsAgainst).toBe(3);
        // (24 / 27) * 100 = 88.888...
        expect(result.savePercentage).toBe("88.9");
    });

    it('returns save percentage 0 if no shots against (saves + goalsAgainst = 0)', () => {
        const game = {
            stats: {
                goalie1: {
                    1: { goals: 0, assists: 0, plus: 0, minus: 0, saves: 0, goalsAgainst: 0 }
                }
            }
        };

        const result = calculateSingleGameStats(game, 'goalie1', 'Total');

        expect(result.saves).toBe(0);
        expect(result.goalsAgainst).toBe(0);
        expect(result.savePercentage).toBe(0);
    });
});