function parseCSV(data) {
    const rows = data.split('\n').map(row => row.split(','));
    return rows;
}

function validateInput(rows, columns) {
    if (isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0) {
        throw new Error('Number of rows and columns must be positive numbers.');
    }
}

function isValidCSV(data) {
    const lines = data.split('\n');
    const columnCount = lines[0].split(',').length;

    for (let line of lines) {
        if (line.split(',').length !== columnCount) {
            return false; // Inconsistent number of columns
        }
    }
    return true;
}

export function parseFileContent(content) {
    const lines = content.trim().split('\n');
    const data = lines.map(line => 
        line.split(/[,\s]+/)
            .map(value => value.trim())
            .filter(value => value !== '')
            .map(Number)
    ).filter(row => row.length > 0);
    
    return data;
}

export function validateDimensions(data, rows, cols) {
    if (data.length !== rows) {
        throw new Error(`Expected ${rows} rows but found ${data.length}`);
    }
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].length !== cols) {
            throw new Error(`Row ${i + 1} has ${data[i].length} columns, expected ${cols}`);
        }
    }
    
    return true;
}

export function transposeData(data) {
    return data[0].map((_, colIndex) => data.map(row => row[colIndex]));
}

export function formatResults(varianceTest, anovaResults, groupStats) {
    let output = '=== Statistical Analysis Results ===\n\n';

    // Format variance homogeneity test results
    output += `1. ${varianceTest.test}'s Test for Homogeneity of Variance:\n`;
    output += '-'.repeat(50) + '\n';
    if (varianceTest.test === 'Levene') {
        output += `W-statistic: ${varianceTest.statistic.toFixed(4)}\n`;
        output += `Degrees of freedom: ${varianceTest.df1}, ${varianceTest.df2}\n`;
    } else {
        output += `χ²-statistic: ${varianceTest.statistic.toFixed(4)}\n`;
        output += `Degrees of freedom: ${varianceTest.df}\n`;
    }
    output += `p-value: ${varianceTest.pValue.toFixed(4)}\n\n`;

    // Format ANOVA results
    output += `2. ${anovaResults.type} Results:\n`;
    output += '-'.repeat(50) + '\n';
    output += `F-statistic: ${anovaResults.statistic.toFixed(4)}\n`;
    
    if ('dfB' in anovaResults) {
        output += `Degrees of freedom: ${anovaResults.dfB}, ${anovaResults.dfW}\n`;
        output += `Between-groups SS: ${anovaResults.SSB.toFixed(4)}\n`;
        output += `Within-groups SS: ${anovaResults.SSW.toFixed(4)}\n`;
        output += `Between-groups MS: ${anovaResults.MSB.toFixed(4)}\n`;
        output += `Within-groups MS: ${anovaResults.MSW.toFixed(4)}\n`;
    } else {
        output += `Degrees of freedom: ${anovaResults.df1.toFixed(2)}, ${anovaResults.df2.toFixed(2)}\n`;
    }
    output += `p-value: ${anovaResults.pValue.toFixed(4)}\n\n`;

    // Format descriptive statistics
    output += '3. Descriptive Statistics by Group:\n';
    output += '-'.repeat(50) + '\n';
    output += 'Group | N | Mean | Standard Deviation\n';
    output += '-'.repeat(50) + '\n';
    
    groupStats.forEach(stat => {
        output += `${String(stat.group).padEnd(5)} | `;
        output += `${String(stat.n).padEnd(3)} | `;
        output += `${stat.mean.toFixed(4).padEnd(8)} | `;
        output += `${stat.sd.toFixed(4)}\n`;
    });
    
    output += '\n4. Interpretation:\n';
    output += '-'.repeat(50) + '\n';
    
    // Interpret variance test
    if (varianceTest.pValue > 0.05) {
        output += '• Variances are homogeneous (p > 0.05)\n';
    } else {
        output += '• Variances are not homogeneous (p ≤ 0.05)\n';
    }
    
    // Interpret ANOVA results
    if (anovaResults.pValue <= 0.05) {
        output += '• There are significant differences between groups (p ≤ 0.05)\n';
    } else {
        output += '• There are no significant differences between groups (p > 0.05)\n';
    }

    return output;
}

function interpretLeveneTest(pValue) {
    if (pValue > 0.05) {
        return 'The variances are homogeneous (p > 0.05). Using standard one-way ANOVA.';
    } else {
        return 'The variances are not homogeneous (p ≤ 0.05). Using Welch\'s ANOVA.';
    }
}

function interpretANOVA(pValue) {
    if (pValue <= 0.05) {
        return 'There are significant differences between groups (p ≤ 0.05).';
    } else {
        return 'There are no significant differences between groups (p > 0.05).';
    }
}

export function formatPostHocResults(groupStats, posthocResults) {
    let html = '<div class="posthoc-section">';
    
    // Add group means section
    html += '<div class="group-means">';
    html += '<h3>Group Means:</h3>';
    html += '<ul>';
    groupStats.forEach(stat => {
        html += `<li>Group ${stat.group}: ${stat.mean.toFixed(4)} (n=${stat.n}, SD=${stat.sd.toFixed(4)})</li>`;
    });
    html += '</ul>';
    html += '</div>';

    // Add post-hoc results table
    html += `<h3>${posthocResults.method} Results:</h3>`;
    html += '<table class="posthoc-table">';
    html += '<thead><tr>';
    html += '<th>Group Pair</th>';
    html += '<th>Mean Difference</th>';
    html += '<th>SE</th>';
    html += '<th>q Statistic</th>';
    if (posthocResults.method === "Games-Howell") {
        html += '<th>df</th>';
    }
    html += '<th>Significant</th>';
    html += '</tr></thead>';
    
    html += '<tbody>';
    posthocResults.comparisons.forEach(comp => {
        const rowClass = comp.significant ? 'significant' : '';
        html += `<tr class="${rowClass}">`;
        html += `<td>Group ${comp.group1} vs Group ${comp.group2}</td>`;
        html += `<td class="numeric">${comp.meanDiff.toFixed(4)}</td>`;
        html += `<td class="numeric">${comp.SE.toFixed(4)}</td>`;
        html += `<td class="numeric">${comp.q.toFixed(4)}</td>`;
        if (posthocResults.method === "Games-Howell") {
            html += `<td class="numeric">${comp.df.toFixed(2)}</td>`;
        }
        html += `<td>${comp.significant ? 'Yes' : 'No'}</td>`;
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';

    // Add interpretation
    html += '<div class="interpretation">';
    html += `<p><strong>Critical q-value (α = 0.05):</strong> ${posthocResults.criticalQ.toFixed(4)}</p>`;
    const sigComparisons = posthocResults.comparisons.filter(c => c.significant);
    if (sigComparisons.length > 0) {
        html += '<p><strong>Significant differences found between:</strong></p>';
        html += '<ul>';
        sigComparisons.forEach(comp => {
            html += `<li>Group ${comp.group1} and Group ${comp.group2} `;
            html += `(mean diff = ${Math.abs(comp.meanDiff).toFixed(4)}, q = ${comp.q.toFixed(4)})</li>`;
        });
        html += '</ul>';
    } else {
        html += '<p>No significant differences found between any groups.</p>';
    }
    html += '</div>';

    html += '</div>';
    return html;
}

export { parseCSV, validateInput, isValidCSV };