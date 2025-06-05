# Remote Navigation Guide

This document summarizes best practices for implementing remote control navigation on platforms such as Android TV or Fire TV.

## 1. Focusable Elements

- Ensure buttons and interactive cards have a sufficiently large focusable area so they can be easily reached using a remote control.
- Provide a visible focus style (e.g., outline or scaling effect) to clearly indicate which element is currently selected.

## 2. Directional Pad Support

- Use the directional pad (D‑pad) for moving focus horizontally across carousel items and vertically between sections.
- Carousel items in `components/featured/FeaturedCarousel.tsx` should be arranged so the left and right keys cycle through slides.
- Media cards rendered in `FeaturedPage.tsx` within category rows should allow left/right navigation between items.

## 3. Example Components

- **FeaturedCarousel** (`components/featured/FeaturedCarousel.tsx`)
  - Displays highlighted content in a horizontally scrollable carousel.
  - Ensure each slide is focusable and responds to left/right keys.
- **FeaturedPage** (`components/featured/FeaturedPage.tsx`)
  - Renders multiple category rows of `MediaCard` components.
  - Support moving focus between rows using the up and down keys.

Following these guidelines will improve usability when navigating the app with a TV remote.
