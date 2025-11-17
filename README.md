# README: The Evolution of the NBA Shot

## Project Overview

This project is a web-based data visualization narrative titled "The Evolution of the NBA Shot". It explores the dramatic transformation of shot selection in the National Basketball Association over a ten-year period, comparing the 2013-2014 season with the 2023-2024 season. The single-page website guides the user through a story, using a series of interactive and static data visualizations to show the decline of the mid-range shot, the rise of the 3-pointer, and the resulting impact on player efficiency and positional roles.

This project was created by:
* Anish Vallabhaneni
* Harikesh Tambareni
* Jonathan Le
* Turan Celik

---

## Project Websites & Screencast

* **Project Website URL:** https://anishv525.github.io/FinalProject4460/
* **Screencast Video URL:** 

---

## File Structure & Technologies

This project is built using HTML5, CSS3, and JavaScript (ES6+), relying on D3.js for visualization and Bootstrap for layout.

### Our Code (Files we created)

* `index.html`: The main HTML file that provides the structure and all the text content for the webpage.
* `css/style.css`: The custom stylesheet that defines the project's aesthetic, including fonts, colors, layout, and custom styles for all visualizations and interactive components.
* `js/main.js`: The core JavaScript file. This file is responsible for:
    * Loading and processing the `NBA_2014_Shots.csv` and `NBA_2024_Shots.csv` datasets.
    * Rendering all D3.js data visualizations (grouped bar chart, court heatmap, scatter plot, linked bar chart, and position matrix).
    * Implementing all interactivity, including toggles, brushing, scroll animations, and the navigation indicators.

### External Libraries & Frameworks

* **D3.js (v7):** Used to create all data visualizations.
* **Bootstrap (v5.1.1):** Used for the responsive navigation bar and layout grid.
* **Google Fonts:** Used for the "Roboto" and "Anton" typefaces.

### Data Files

* `data/NBA_2014_Shots.csv`: Contains shot data for the 2013-2014 season.
* `data/NBA_2024_Shots.csv`: Contains shot data for the 2023-2024 season.

---

## Data Source

The data for this project was obtained from the **NBA Shots Dataset** on Kaggle, which contains comprehensive shot location and statistics data.
* **Data URL:** [https://www.kaggle.com/datasets/mexwell/nba-shots?resource=download](https://www.kaggle.com/datasets/mexwell/nba-shots?resource=download)

---

## Non-Obvious Features & Interface Explanation

Beyond the static text and visualizations, our project includes several advanced interactive features:

1.  **Linked Visualizations (Brushing & Linking):** In the "Efficiency" section, the scatter plot and bar chart are linked. Users can **click and drag on the scatter plot** to select a specific group of players. The bar chart to the right will automatically update to show the 3-point shot profile (Corner 3s vs. Above-the-Break 3s) for *only* that selected group.

2.  **Interactive Toggles:** Several visualizations have toggles to explore the data:
    * **Court Heatmap:** Users can filter the heatmap to show "All", "3PT", or "2PT" shots, and can also toggle between the "2014" and "2024" datasets to see the change in shot location density.
    * **Position Matrix:** A "Switch to 2024" / "Switch to 2014" button allows the user to toggle the entire heatmap, making it easy to compare the "shot diet" of each player position between the two eras.

3.  **Scroll-Triggered Animations:** As the user scrolls down the page, sections and visualizations animate into view (fading and sliding up). This is implemented using an `IntersectionObserver` in `js/main.js` to create a smoother narrative flow.

4.  **Section Progress Indicator:** A vertical dot indicator is fixed on the right side of the screen. This indicator highlights the user's current section and allows them to click any dot to quickly navigate to that part of the story.

5.  **Scroll-Spy Navigation:** The main navigation bar at the top automatically highlights the menu item (`Home`, `Introduction`, `Efficiency`, etc.) corresponding to the section currently in the user's viewport.
