# Raymarching

A Raymarcher that runs in the browser, written with WebGPU and WGSL. Without additional libraries or frameworks

**Demo:** https://arptime-code.github.io/Raymarching/

## Running Locally

Open `index.html` in a WebGPU-capable browser.

Click the canvas to lock the pointer.

## Controls

| Input | Action |
|---|---|
| `W A S D` | Move |
| `↑` `↓` | Move up / down |
| Mouse | Rotate |

## Known limitations

- Still some unwanted artifacts when you get close to objects

## Files

| File | Purpose |
|---|---|
| `shader.wgsl` | Raymarching shader |
| `code.js` | Setup and input handling |
| `index.html` | Main Page |
| `styles.css` | Canvas layout |
