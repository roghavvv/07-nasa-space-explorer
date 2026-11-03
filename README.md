NASA Space Explorer — Project 7

Global Career Accelerator | Web Development Project 7

An interactive, responsive web application that allows users to explore NASA's Astronomy Picture of the Day (APOD) archive. Built using HTML, CSS, JavaScript, and NASA's public API, this project brings real astronomical imagery and educational information into an accessible, user-friendly gallery.

Project Overview

NASA's mission includes inspiring curiosity and encouraging people to explore the universe. The NASA Space Explorer app supports this goal by allowing users to select a custom date range and discover astronomical images, videos, and explanations directly from NASA's APOD archive.

The project demonstrates API integration, dynamic content generation, responsive web design, DOM manipulation, and AI-assisted development.

Features

1. NASA APOD API Integration

Connects to NASA's Astronomy Picture of the Day API.

Retrieves real astronomical content based on user-selected dates.

Supports custom date ranges of up to 30 days.

Validates dates against NASA's archive, beginning June 16, 1995.

Displays loading messages and handles API errors, including rate limits.

2. Interactive Space Gallery

Dynamically generates gallery cards using JavaScript.

Displays NASA images alongside their titles and dates.

Automatically updates the gallery when users select a new date range.

Uses a responsive layout for desktop, tablet, and mobile devices.

3. Image Details Modal

Opens an interactive modal when a gallery item is selected.

Displays a larger version of the NASA image.

Includes the image's full title, date, and NASA explanation.

Supports closing the modal using the close button, Escape key, or background.

Includes keyboard accessibility features.

4. NASA-Inspired Design

Uses NASA-inspired blue, red, and navy colors.

Incorporates NASA branding and logo assets.

Features responsive layouts, interactive buttons, and clear typography.

Includes links to NASA's official website and APOD archive.

Bonus LevelUps — 25 Points

LevelUp 1: Video Entry Support (+10 Points)

The application detects APOD video entries and displays a video placeholder. Users can open the entry to access a direct link to the original NASA video.

LevelUp 2: Random Space Facts (+10 Points)

A "Did You Know?" section displays a randomly selected astronomy fact whenever the page loads. Facts are stored in a JavaScript array and selected using Math.random().

LevelUp 3: Image Hover Zoom (+5 Points)

Gallery images smoothly enlarge when users hover over them. The effect is implemented using CSS transitions and transforms, with reduced-motion accessibility support.