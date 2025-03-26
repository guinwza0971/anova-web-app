/**
 * Calculate mean of an array
 */
function mean(array) {
    return array.reduce((sum, value) => sum + value, 0) / array.length;
}

/**
 * Calculate standard deviation of an array
 */
function standardDeviation(array, meanValue) {
    const squaredDiffs = array.map(value => Math.pow(value - meanValue, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, value) => sum + value, 0) / (array.length - 1));
}

/**
 * Perform Levene's test for homogeneity of variance
 */
export function performLeveneTest(groups) {
    // Calculate absolute deviations from group means
    const deviations = groups.map(group => {
        const groupMean = mean(group);
        return group.map(value => Math.abs(value - groupMean));
    });

    // Calculate Levene statistic
    const allDeviations = deviations.flat();
    const overallMean = mean(allDeviations);
    
    const k = groups.length;
    const N = allDeviations.length;
    
    const numerator = (N - k) * deviations.reduce((sum, group, i) => {
        const groupMean = mean(group);
        return sum + group.length * Math.pow(groupMean - overallMean, 2);
    }, 0) / (k - 1);

    const denominator = deviations.reduce((sum, group) => {
        const groupMean = mean(group);
        return sum + group.reduce((s, value) => s + Math.pow(value - groupMean, 2), 0);
    }, 0);

    const W = numerator / denominator;
    
    // Calculate p-value using F-distribution
    const pValue = 1 - jStat.centralF.cdf(W, k - 1, N - k);
    
    return {
        test: 'Levene',
        statistic: W,
        pValue: pValue,
        df1: k - 1,
        df2: N - k
    };
}

/**
 * Perform Bartlett's test for homogeneity of variance
 */
export function performBartlettTest(groups) {
    const k = groups.length;
    const N = groups.reduce((sum, group) => sum + group.length, 0);
    
    // Calculate group variances and sizes
    const groupStats = groups.map(group => {
        const groupMean = mean(group);
        const variance = group.reduce((sum, value) => 
            sum + Math.pow(value - groupMean, 2), 0) / (group.length - 1);
        return { n: group.length, variance };
    });

    // Calculate pooled variance
    const sp2 = groupStats.reduce((sum, {n, variance}) => 
        sum + (n - 1) * variance, 0) / (N - k);

    // Calculate Bartlett's statistic
    const numerator = (N - k) * Math.log(sp2) - 
        groupStats.reduce((sum, {n, variance}) => 
            sum + (n - 1) * Math.log(variance), 0);
    
    const C = 1 + (1 / (3 * (k - 1))) * 
        (groupStats.reduce((sum, {n}) => sum + 1/(n - 1), 0) - 1/(N - k));
    
    const chi2 = numerator / C;
    
    // Calculate p-value using chi-square distribution
    const pValue = 1 - jStat.chisquare.cdf(chi2, k - 1);

    return {
        test: 'Bartlett',
        statistic: chi2,
        pValue: pValue,
        df: k - 1
    };
}

/**
 * Perform standard one-way ANOVA
 */
export function performOneWayANOVA(groups) {
    const k = groups.length;
    const N = groups.reduce((sum, group) => sum + group.length, 0);
    
    // Calculate group means and overall mean
    const groupMeans = groups.map(group => mean(group));
    const overallMean = mean(groups.flat());
    
    // Calculate SSB (between groups sum of squares)
    const SSB = groups.reduce((sum, group, i) => 
        sum + group.length * Math.pow(groupMeans[i] - overallMean, 2), 0);
    
    // Calculate SSW (within groups sum of squares)
    const SSW = groups.reduce((sum, group, i) => 
        sum + group.reduce((s, value) => 
            s + Math.pow(value - groupMeans[i], 2), 0), 0);
    
    const dfB = k - 1;
    const dfW = N - k;
    
    const MSB = SSB / dfB;
    const MSW = SSW / dfW;
    
    const F = MSB / MSW;
    
    // Calculate p-value using F-distribution
    const pValue = 1 - jStat.centralF.cdf(F, dfB, dfW);
    
    return {
        type: 'Standard ANOVA',
        statistic: F,
        pValue: pValue,
        dfB: dfB,
        dfW: dfW,
        SSB: SSB,
        SSW: SSW,
        MSB: MSB,
        MSW: MSW
    };
}

/**
 * Perform Welch's ANOVA
 */
export function performWelchANOVA(groups) {
    const k = groups.length;
    const groupStats = groups.map(group => {
        const groupMean = mean(group);
        const variance = group.reduce((sum, value) => 
            sum + Math.pow(value - groupMean, 2), 0) / (group.length - 1);
        return {
            mean: groupMean,
            variance: variance,
            n: group.length,
            weight: group.length / variance
        };
    });

    const weights = groupStats.map(stat => stat.weight);
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    
    // Calculate weighted grand mean
    const weightedMean = groupStats.reduce((sum, stat) => 
        sum + stat.weight * stat.mean, 0) / sumWeights;
    
    // Calculate Welch's statistic
    const numerator = groups.reduce((sum, _, i) => 
        sum + weights[i] * Math.pow(groupStats[i].mean - weightedMean, 2), 0) / (k - 1);
    
    const denominator = groups.reduce((sum, _, i) => 
        sum + Math.pow(1 - weights[i] / sumWeights, 2) / (groupStats[i].n - 1), 0);
    
    const F = numerator / denominator;
    
    // Calculate degrees of freedom
    const df1 = k - 1;
    const df2 = Math.pow(k * k - 1, 2) / (3 * groups.reduce((sum, _, i) => 
        sum + Math.pow(1 - weights[i] / sumWeights, 2) / (groupStats[i].n - 1), 0));
    
    // Calculate p-value
    const pValue = 1 - jStat.centralF.cdf(F, df1, df2);
    
    return {
        type: 'Welch\'s ANOVA',
        statistic: F,
        pValue: pValue,
        df1: df1,
        df2: df2
    };
}

/**
 * Calculate descriptive statistics for groups
 */
export function calculateGroupStats(groups) {
    return groups.map((group, index) => {
        const groupMean = mean(group);
        return {
            group: index + 1,
            n: group.length,
            mean: groupMean,
            sd: standardDeviation(group, groupMean)
        };
    });
}

/**
 * Perform Tukey's HSD post-hoc test
 */
export function performTukeyHSD(groups, anovaResults) {
    const k = groups.length; // number of groups
    const n = groups[0].length; // assumes equal sample sizes
    const MSE = anovaResults.MSW;
    
    // Get critical q value from studentized range distribution (alpha = 0.05)
    // For now using approximate critical values based on common degrees of freedom
    const criticalQ = {
        2: 2.77, 3: 3.31, 4: 3.63, 5: 3.86, 6: 4.03, 7: 4.17, 8: 4.29,
        9: 4.39, 10: 4.47, 11: 4.55, 12: 4.62, 13: 4.68, 14: 4.74, 15: 4.80
    }[k] || 4.80;

    const groupMeans = groups.map(group => mean(group));
    const SE = Math.sqrt(MSE / n);
    
    // Perform all pairwise comparisons
    const comparisons = [];
    for (let i = 0; i < k - 1; i++) {
        for (let j = i + 1; j < k; j++) {
            const meanDiff = groupMeans[i] - groupMeans[j];
            const q = Math.abs(meanDiff) / SE;
            comparisons.push({
                group1: i + 1,
                group2: j + 1,
                meanDiff: meanDiff,
                SE: SE,
                q: q,
                significant: q > criticalQ
            });
        }
    }

    return {
        method: "Tukey's HSD",
        comparisons: comparisons,
        criticalQ: criticalQ
    };
}

/**
 * Perform Games-Howell post-hoc test
 */
export function performGamesHowell(groups) {
    const k = groups.length;
    const groupStats = groups.map(group => ({
        n: group.length,
        mean: mean(group),
        variance: group.reduce((sum, x) => sum + Math.pow(x - mean(group), 2), 0) / (group.length - 1)
    }));

    // Get critical q value (alpha = 0.05)
    // Using approximate critical values
    const criticalQ = {
        2: 2.77, 3: 3.31, 4: 3.63, 5: 3.86, 6: 4.03, 7: 4.17, 8: 4.29,
        9: 4.39, 10: 4.47, 11: 4.55, 12: 4.62, 13: 4.68, 14: 4.74, 15: 4.80
    }[k] || 4.80;

    // Perform all pairwise comparisons
    const comparisons = [];
    for (let i = 0; i < k - 1; i++) {
        for (let j = i + 1; j < k; j++) {
            const stat1 = groupStats[i];
            const stat2 = groupStats[j];
            
            // Calculate SE for this pair
            const SE = Math.sqrt((stat1.variance / stat1.n + stat2.variance / stat2.n));
            
            // Calculate t-statistic
            const meanDiff = stat1.mean - stat2.mean;
            const q = Math.abs(meanDiff) / SE;
            
            // Calculate degrees of freedom using Welch–Satterthwaite equation
            const df = Math.pow(stat1.variance / stat1.n + stat2.variance / stat2.n, 2) /
                      (Math.pow(stat1.variance / stat1.n, 2) / (stat1.n - 1) +
                       Math.pow(stat2.variance / stat2.n, 2) / (stat2.n - 1));
            
            // Get critical value (using t-distribution)
            const criticalValue = criticalQ * Math.sqrt(2);
            
            comparisons.push({
                group1: i + 1,
                group2: j + 1,
                meanDiff: meanDiff,
                SE: SE,
                q: q,
                df: df,
                significant: q > criticalValue
            });
        }
    }

    return {
        method: "Games-Howell",
        comparisons: comparisons,
        criticalQ: criticalQ
    };
}