# Guess The Card

A lightweight, static web app for flipping through a shuffled deck of cards with friends — no sign-in, no backend, no build step. Just plain HTML, CSS, and vanilla JavaScript.

**Live site:** https://maxhousner.github.io/guess-the-card/

## How to play

- The 52-card deck is shuffled on page load.
- One large card is shown at a time. **Tap, click, swipe, or press Space / arrow keys** to advance.
- A `12 / 52` counter tracks your position (toggle it with the eye button).
- When the deck is finished, choose **Shuffle** for a new order or **Continue in same order** to run through the same pass again.
- The **Shuffle** button at the top reshuffles and restarts at any time.

## Development

No dependencies or tooling required. Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server
```

## Files

- `index.html` — page structure
- `style.css` — styling, CSS/SVG cards, animations
- `script.js` — deck, shuffle, input handling, and game logic

## Hosting

Served via GitHub Pages from the `main` branch (root folder).
