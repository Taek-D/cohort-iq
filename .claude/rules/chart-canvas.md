# Chart.js & Canvas Rules

- Chart.js import: always `chart.js/auto` (not `chart.js`)
- Pass canvas **element** to Chart.js constructor, not 2d context
- html2canvas: always use `html2canvas-pro` (oklch color support for Tailwind v4)
- Dates: always use `date-fns` for formatting/parsing
- CSV: always use `PapaParse` for parsing
