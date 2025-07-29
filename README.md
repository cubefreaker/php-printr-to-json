# PHP print_r() to JSON Converter

A retro-styled React application that converts PHP `print_r()` output to JSON format.

## Features

- 🎮 Retro terminal-inspired design
- 🔄 Convert PHP `print_r()` output to clean JSON
- 📋 Copy output to clipboard
- 📱 Mobile responsive
- ⚡ Built with React + Vite for fast development

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Build for Production

```bash
npm run build
```

## How to Use

1. Paste your PHP `print_r()` output in the left textarea
2. Click "CONVERT →" to transform it to JSON
3. Copy the JSON output from the right textarea
4. Use "Load Sample" to see an example

## Example

**Input (PHP print_r() output):**
```
Array
(
    [name] => John Doe
    [age] => 30
    [hobbies] => Array
        (
            [0] => reading
            [1] => coding
        )
)
```

**Output (JSON):**
```json
{
  "name": "John Doe",
  "age": 30,
  "hobbies": ["reading", "coding"]
}
```

## Tech Stack

- React 18
- Vite
- CSS3 with retro styling
- Custom PHP print_r() parser
