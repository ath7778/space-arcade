# Space Arcade Website

A sleek, immersive space-themed arcade website for hosting web-based games. This platform is designed to showcase games with a cosmic theme, providing users with an engaging space exploration experience through various interactive games.

## File Structure

- `index.html` - Main HTML file for the website landing page
- `games.html` - Games showcase page
- `about.html` - About page with information on the arcade
- `contact.html` - Contact page for user feedback
- `styles.css` - Main CSS styling for the website
- `script.js` - Main JavaScript functionality
- `/games/` - Directory containing all game folders
  - `/deep-space-explorer/` - Deep Space Explorer game files
  - `/asteroid-belt-dogfight/` - Asteroid Belt Dogfight game files
  - `/gravity-puzzler/` - Gravity Puzzler game files
- `/assets/` - Directory containing website assets
  - `/images/` - Game thumbnails and visual elements
  - `/audio/` - Sound effects and background music
  - `/fonts/` - Custom fonts used across the website

## Features

- Responsive design that works seamlessly on mobile, tablet, and desktop
- Space-themed UI with animated star backgrounds and cosmic visual elements
- Interactive game showcase section with game cards and previews
- Game carousel for featured titles on the home page
- Consistent game design patterns across all games for a unified user experience
- Real-time score tracking and game statistics
- Animated transitions and interactive UI elements
- Dark mode design optimized for immersive gameplay

## How to Add a New Game

To add a new game to the Space Arcade:

1. Create a new folder in the `/games/` directory with your game name
2. Structure your game with the following files:
   - `index.html` - Game interface and structure
   - `styles.css` - Game-specific styling
   - `game.js` - Game logic and mechanics

3. Add a new game card to the games grid in `games.html`:

```html
<div class="game-card">
    <div class="game-card-image">
        <img src="path-to-game-image.jpg" alt="Game Name">
    </div>
    <div class="game-card-content">
        <h3 class="game-card-title">Game Name</h3>
        <p class="game-card-description">Brief description of your game.</p>
        <a href="games/your-game-folder/index.html" class="game-card-btn">Play Game</a>
    </div>
</div>
```

4. Ensure your game follows the established style patterns:
   - Include a back button to return to the games page
   - Use consistent control schemes where possible
   - Implement the star background animation
   - Add appropriate overlays for game start, pause, and end states

## Customization

You can customize various aspects of the Space Arcade:

- Modify the space theme colors in the CSS files
- Add new game mechanics and interactions
- Create custom game assets that fit the cosmic theme
- Extend game functionality with additional levels or features
- Implement user accounts and persistent scores (future enhancement)

## Browser Compatibility

This website is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- User accounts and profiles
- Global leaderboards across all games
- Additional space-themed games
- Multiplayer functionality
- Achievement system
