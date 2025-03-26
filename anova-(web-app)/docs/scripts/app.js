import { parseFileContent, validateDimensions, transposeData, formatResults, formatPostHocResults } from './utils.js';
import { 
    performLeveneTest, performBartlettTest, 
    performOneWayANOVA, performWelchANOVA, 
    calculateGroupStats, performTukeyHSD, 
    performGamesHowell 
} from './statistics.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('data-form');
    const dataInput = document.getElementById('data-input');
    const rowsInput = document.getElementById('num-rows');
    const columnsInput = document.getElementById('num-columns');
    const output = document.getElementById('output');
    const posthocResults = document.getElementById('posthoc-results');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
            const content = dataInput.value.trim();
            if (!content) {
                throw new Error('Please enter data');
            }

            const rows = parseInt(rowsInput.value);
            const cols = parseInt(columnsInput.value);
            if (isNaN(rows) || isNaN(cols) || rows < 2 || cols < 2) {
                throw new Error('Please enter valid dimensions (minimum 2 for both rows and columns)');
            }

            const data = parseFileContent(content);
            validateDimensions(data, rows, cols);

            // Determine if groups are by rows or columns
            const groupByRows = document.querySelector('input[name="grouping"]:checked').value === 'rows';
            const groups = groupByRows ? data : transposeData(data);

            // Get user's choices for tests
            const varianceTestType = document.querySelector('input[name="variance-test"]:checked').value;
            const anovaType = document.querySelector('input[name="anova-type"]:checked').value;
            const posthocType = document.querySelector('input[name="posthoc-test"]:checked').value;
            
            // Perform the selected variance homogeneity test
            const varianceTest = varianceTestType === 'levene' ? 
                performLeveneTest(groups) : 
                performBartlettTest(groups);
            
            // Perform the selected ANOVA
            const anovaResults = anovaType === 'standard' ? 
                performOneWayANOVA(groups) : 
                performWelchANOVA(groups);

            // Calculate descriptive statistics for each group
            const groupStats = calculateGroupStats(groups);

            // Format and display ANOVA results
            output.textContent = formatResults(varianceTest, anovaResults, groupStats);

            // Perform and display post-hoc test if ANOVA is significant
            if (anovaResults.pValue <= 0.05) {
                const posthocResults = posthocType === 'tukey' ? 
                    performTukeyHSD(groups, anovaResults) : 
                    performGamesHowell(groups);
                
                // Display post-hoc results
                document.getElementById('posthoc-results').innerHTML = 
                    formatPostHocResults(groupStats, posthocResults);
            } else {
                document.getElementById('posthoc-results').innerHTML = 
                    '<div class="posthoc-section"><p>Post-hoc tests were not performed as ANOVA did not show significant differences between groups.</p></div>';
            }

        } catch (error) {
            output.textContent = `Error: ${error.message}`;
            posthocResults.innerHTML = '';
        }
    });

    // Auto-update rows count when user enters data
    dataInput.addEventListener('input', () => {
        const lines = dataInput.value.trim().split('\n');
        rowsInput.value = lines.length;
        
        // If we have at least one line, try to determine number of columns
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            const cols = firstLine.split(/[,\s]+/).filter(val => val !== '').length;
            columnsInput.value = cols;
        }
    });
});