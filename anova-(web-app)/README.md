# ANOVA Statistical Analysis Web Application

A web-based application for performing One-Way ANOVA (Analysis of Variance) with comprehensive statistical analysis features.

## Features

- One-way ANOVA analysis
- Choice between Standard ANOVA and Welch's ANOVA
- Variance homogeneity testing (Levene's or Bartlett's test)
- Post-hoc analysis (Tukey's HSD or Games-Howell)
- Interactive data input
- Detailed statistical results
- Responsive design

## Live Demo

Visit the application at: https://[your-username].github.io/anova-web-app/

## Project Structure

```
anova-web-app
├── src
│   ├── index.html        # Main HTML file for user interface
│   ├── styles
│   │   └── main.css      # CSS styles for the application
│   ├── scripts
│   │   ├── app.js        # Main JavaScript file for user interactions
│   │   ├── statistics.js  # Functions for statistical analysis
│   │   └── utils.js      # Utility functions for data manipulation
├── tests
│   └── statistics.test.js # Unit tests for statistical functions
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Usage

1. Enter your data in the textarea (one group per row, values separated by commas)
2. Select your preferred tests:
   - Variance test (Levene's or Bartlett's)
   - ANOVA type (Standard or Welch's)
   - Post-hoc test (Tukey's HSD or Games-Howell)
3. Click "Perform Analysis" to see the results

Example data:
```
23, 25, 22, 27, 24
30, 28, 29, 31, 32
20, 19, 21, 18, 22
```

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/anova-web-app.git
```

2. Navigate to the project directory:
```bash
cd anova-web-app
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npx live-server docs
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- jStat (Statistical computations)

## License

MIT License - Feel free to use this project for your own purposes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request