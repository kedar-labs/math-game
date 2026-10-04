# Math Game

A small HTML, CSS, and JavaScript game. Solve ten problems correctly to reveal a mystery picture.

## Preview locally

Run `python3 -m http.server 8766 --bind 127.0.0.1` in this folder, then open http://127.0.0.1:8766/.

## Publish with GitHub Pages

In repository Settings → Pages, choose **Deploy from a branch**, select **main** and **/ (root)**, and save.

Expected address after deployment: https://kedar-labs.github.io/math-game/

## Files

- `index.html`: layout
- `styles.css`: appearance
- `game.js`: questions, timer, reveal, media links, and reset behavior

The existing images and sounds load from Google Cloud Storage. No build step or paid service is required by the game code.
