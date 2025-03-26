const { performLeveneTest, performANOVA, performWelchANOVA } = require('../src/scripts/statistics');

describe('Statistical Analysis Functions', () => {
    test('Levene Test - Equal Variances', () => {
        const data = [[1, 2, 3], [2, 3, 4]];
        const result = performLeveneTest(data);
        expect(result).toHaveProperty('statistic');
        expect(result).toHaveProperty('pValue');
    });

    test('One-Way ANOVA - Significant Difference', () => {
        const data = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
        const result = performANOVA(data);
        expect(result).toHaveProperty('statistic');
        expect(result).toHaveProperty('pValue');
    });

    test('Welch ANOVA - Different Sample Sizes', () => {
        const data = [[1, 2], [3, 4, 5, 6]];
        const result = performWelchANOVA(data);
        expect(result).toHaveProperty('statistic');
        expect(result).toHaveProperty('pValue');
    });
});