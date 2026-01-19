# Guess the Operator 🎯

A fun, fast-paced math game where you pop operator bubbles to complete equations! Test your arithmetic skills with a futuristic neon twist.

## 🎮 How to Play

An equation appears at the top with a missing operator (shown as `?`). Three operator bubbles fall from the top - **tap/click the correct one before it falls off the screen!**

**Example:** If the equation shows `5 ? 2 = 3`, you need to pop the `-` (minus) bubble!

### Controls

| Platform            | Pop Bubble | Pause      |
| ------------------- | ---------- | ---------- |
| **PC / Laptop**     | Click      | Escape key |
| **Mobile / Tablet** | Tap        | ⏸ button   |

### Operators

The game uses 4 operators:

- `+` Addition
- `-` Subtraction
- `×` Multiplication
- `/` Division

### Lives

- You start with **5 lives** (shown as red dots)
- Wrong answers cost 1 life
- Letting the correct bubble escape costs 1 life
- Game over when all lives are lost

---

## 🛠️ Development

### Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS with custom CSS
- **Font:** Orbitron (Google Fonts)

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── GameCanvas.tsx   # Main game component
│   ├── globals.css          # Neon theme styling
│   ├── layout.tsx           # Root layout with Orbitron font
│   └── page.tsx             # Home page
```

### Building for Production

```bash
npm run build
npm start
```

---

## 📄 License

MIT
