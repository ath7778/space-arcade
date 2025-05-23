# Space Arcade Website

Modular Space Aracde game

## File Structure

- `index.html` - Main HTML file for the website
- `styles.css` - CSS styling for the website
- `script.js` - Main JavaScript functionality
- `particles.min.js` - Library for the particle background effect
- `/images/` - Directory containing website images
  - Game thumbnails
  - Background images
  - Other visual assets

## How to Add a New Game

To add a new game to the website:

1. Create your game files in a separate directory
2. Add a new game card to the `games-grid` section in `index.html`:

```html
<div class="game-card">
    <div class="game-thumbnail" style="background-image: url('images/your-game-thumbnail.jpg');">
        <div class="game-overlay">
            <a href="path-to-your-game/index.html" class="play-btn">Play</a>
        </div>
    </div>
    <div class="game-info">
        <h3>Your Game Name</h3>
        <p>Description of your game.</p>
        <div class="game-tags">
            <span>Genre</span>
            <span>Type</span>
        </div>
    </div>
</div>
```

3. Add your game thumbnail to the `/images/` directory
4. Update the link in the play button to point to your game

## Customization

You can customize various aspects of the website:

- Change the color scheme by modifying the CSS variables in the `:root` selector in `styles.css`
- Update the content in `index.html` to reflect your specific goals and information
- Add more sections or features as needed
- Modify the particle effect parameters in `script.js`

