"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Types
type Operator = "+" | "-" | "×" | "/";
type GameState = "start" | "playing" | "paused" | "gameover";
type Difficulty = "easy" | "medium" | "hard";

interface Equation {
  num1: number;
  num2: number;
  result: number;
  operator: Operator;
}

interface Bubble {
  id: number;
  operator: Operator;
  x: number;
  y: number;
  speed: number;
  paused: boolean;
}

// Speed multipliers for each difficulty
const DIFFICULTY_SPEEDS: Record<
  Difficulty,
  { base: number; variance: number }
> = {
  easy: { base: 0.15, variance: 0.1 },
  medium: { base: 0.3, variance: 0.2 },
  hard: { base: 0.5, variance: 0.3 },
};

// Generate a random equation with a valid operator
function generateEquation(): Equation {
  const operators: Operator[] = ["+", "-", "×", "/"];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let num1: number, num2: number, result: number;

  switch (operator) {
    case "+":
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      result = num1 + num2;
      break;
    case "-":
      num1 = Math.floor(Math.random() * 20) + 5;
      num2 = Math.floor(Math.random() * Math.min(num1, 15)) + 1;
      result = num1 - num2;
      break;
    case "×":
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      result = num1 * num2;
      break;
    case "/":
      num2 = Math.floor(Math.random() * 9) + 1;
      result = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * result;
      break;
  }

  return { num1, num2, result, operator };
}

// Generate bubbles for the equation
function generateBubbles(
  correctOperator: Operator,
  difficulty: Difficulty,
): Bubble[] {
  const allOperators: Operator[] = ["+", "-", "×", "/"];
  const wrongOperators = allOperators.filter((op) => op !== correctOperator);

  // Shuffle wrong operators and pick 2
  const shuffledWrong = wrongOperators
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  // Create bubbles with correct + 2 wrong operators
  const operators = [correctOperator, ...shuffledWrong].sort(
    () => Math.random() - 0.5,
  );

  const { base, variance } = DIFFICULTY_SPEEDS[difficulty];

  // Position bubbles randomly across the screen, starting above viewport
  return operators.map((operator, index) => ({
    id: index,
    operator,
    x: 15 + index * 30 + Math.random() * 10,
    y: -10 - Math.random() * 20,
    speed: base + Math.random() * variance,
    paused: false,
  }));
}

export default function GameCanvas() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [equation, setEquation] = useState<Equation | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [showHelp, setShowHelp] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "correct" | "wrong";
    bubbleId: number;
  } | null>(null);
  const [popAnimation, setPopAnimation] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const animationRef = useRef<number>();
  const livesRef = useRef(lives);
  const difficultyRef = useRef(difficulty);

  // Keep refs in sync
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Start a new round
  const startNewRound = useCallback(() => {
    const newEquation = generateEquation();
    setEquation(newEquation);
    setBubbles(generateBubbles(newEquation.operator, difficultyRef.current));
    setFeedback(null);
    setPopAnimation(null);
    setIsProcessing(false);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setLives(5);
    livesRef.current = 5;
    setIsProcessing(false);
    startNewRound();
  }, [startNewRound]);

  // Handle bubble hover (pause)
  const handleBubbleHover = useCallback(
    (bubbleId: number, isPaused: boolean) => {
      if (isProcessing || feedback) return;
      setBubbles((prev) =>
        prev.map((b) => (b.id === bubbleId ? { ...b, paused: isPaused } : b)),
      );
    },
    [isProcessing, feedback],
  );

  // Handle bubble click/tap
  const handleBubbleClick = useCallback(
    (bubbleId: number) => {
      if (!equation || feedback || gameState !== "playing" || isProcessing)
        return;

      const hitBubble = bubbles.find((b) => b.id === bubbleId);
      if (!hitBubble) return;

      setIsProcessing(true);
      setPopAnimation(bubbleId);

      if (hitBubble.operator === equation.operator) {
        // Correct!
        setFeedback({ type: "correct", bubbleId });
        setScore((prev) => prev + 10);
        setTimeout(() => {
          startNewRound();
        }, 600);
      } else {
        // Wrong!
        setFeedback({ type: "wrong", bubbleId });
        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        setLives(newLives);

        if (newLives <= 0) {
          setTimeout(() => {
            setGameState("gameover");
          }, 600);
        } else {
          setTimeout(() => {
            startNewRound();
          }, 600);
        }
      }
    },
    [equation, bubbles, feedback, gameState, isProcessing, startNewRound],
  );

  // Bubble falling animation
  useEffect(() => {
    if (gameState !== "playing" || feedback || isProcessing) return;

    const animate = () => {
      setBubbles((prev) => {
        // Update positions for non-paused bubbles
        const updated = prev.map((b) => ({
          ...b,
          y: b.paused ? b.y : b.y + b.speed,
        }));

        // Count how many bubbles are still visible (not escaped)
        const visibleBubbles = updated.filter((b) => b.y <= 110);
        const escapedBubbles = updated.filter((b) => b.y > 110);

        // Check if a hovered bubble is the only one left
        const hoveredBubble = updated.find((b) => b.paused && b.y <= 110);
        const otherVisibleBubbles = visibleBubbles.filter((b) => !b.paused);

        // If hovered bubble is alone (all others escaped), start new round
        if (
          hoveredBubble &&
          otherVisibleBubbles.length === 0 &&
          escapedBubbles.length > 0
        ) {
          setIsProcessing(true);

          // Check if the hovered bubble was the correct one
          if (hoveredBubble.operator === equation?.operator) {
            // They held onto the correct answer but let others escape - no penalty, new round
            setTimeout(() => startNewRound(), 300);
          } else {
            // They held wrong answer and correct one escaped - lose life
            const newLives = livesRef.current - 1;
            livesRef.current = newLives;
            setLives(newLives);

            if (newLives <= 0) {
              setTimeout(() => setGameState("gameover"), 100);
            } else {
              setTimeout(() => startNewRound(), 300);
            }
          }
          return prev;
        }

        // Check if correct bubble escaped (and wasn't being hovered)
        const correctEscaped = escapedBubbles.find(
          (b) => b.operator === equation?.operator && !b.paused,
        );
        if (correctEscaped) {
          setIsProcessing(true);

          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          setLives(newLives);

          if (newLives <= 0) {
            setTimeout(() => setGameState("gameover"), 100);
          } else {
            setTimeout(() => startNewRound(), 300);
          }
          return prev;
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, feedback, equation, startNewRound, isProcessing]);

  // Keyboard controls for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && gameState === "playing") {
        setGameState("paused");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Render start screen
  if (gameState === "start") {
    return (
      <div className="start-screen">
        <h1 className="game-title neon-text">Guess the Operator</h1>
        <p style={{ textAlign: "center", maxWidth: "400px", opacity: 0.8 }}>
          Pop the bubble with the correct operator!
        </p>

        {/* Difficulty Selection */}
        <div className="difficulty-selector">
          <p style={{ marginBottom: "12px", opacity: 0.8 }}>
            Select Difficulty:
          </p>
          <div className="difficulty-buttons">
            <button
              className={`difficulty-btn ${difficulty === "easy" ? "active" : ""}`}
              onClick={() => setDifficulty("easy")}
            >
              Easy
            </button>
            <button
              className={`difficulty-btn ${difficulty === "medium" ? "active" : ""}`}
              onClick={() => setDifficulty("medium")}
            >
              Medium
            </button>
            <button
              className={`difficulty-btn ${difficulty === "hard" ? "active" : ""}`}
              onClick={() => setDifficulty("hard")}
            >
              Hard
            </button>
          </div>
        </div>

        <button className="neon-button" onClick={startGame}>
          Play
        </button>
        <button
          className="neon-button"
          style={{ borderColor: "#ff00ff", color: "#ff00ff" }}
          onClick={() => setShowHelp(true)}
        >
          How to Play
        </button>

        {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  // Render game over
  if (gameState === "gameover") {
    return (
      <div className="dialog-overlay">
        <div className="dialog-box" style={{ textAlign: "center" }}>
          <h2
            className="neon-text-pink"
            style={{ fontSize: "2rem", marginBottom: "16px" }}
          >
            Game Over
          </h2>
          <p className="score-display" style={{ marginBottom: "8px" }}>
            Final Score: {score}
          </p>
          <p
            style={{
              marginBottom: "24px",
              opacity: 0.7,
              textTransform: "capitalize",
            }}
          >
            Difficulty: {difficulty}
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <button className="neon-button" onClick={startGame}>
              Play Again
            </button>
            <button
              className="neon-button"
              style={{ borderColor: "#ff4466", color: "#ff4466" }}
              onClick={() => setGameState("start")}
            >
              Change Difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-area">
      {/* HUD */}
      <div className="game-hud">
        <div className="score-display">Score: {score}</div>
        <div className="lives-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`life ${i >= lives ? "lost" : ""}`} />
          ))}
        </div>
        <button className="pause-button" onClick={() => setGameState("paused")}>
          ⏸
        </button>
      </div>

      {/* Equation */}
      {equation && (
        <div className="equation-display" style={{ marginTop: "80px" }}>
          {equation.num1}
          <span className="operator-placeholder">?</span>
          {equation.num2} = {equation.result}
        </div>
      )}

      {/* Falling Bubbles */}
      {bubbles
        .filter((b) => b.y <= 110) // Only render visible bubbles
        .map((bubble) => (
          <button
            key={bubble.id}
            className={`operator-bubble falling-bubble ${
              feedback?.bubbleId === bubble.id
                ? feedback.type === "correct"
                  ? "correct"
                  : "wrong"
                : ""
            } ${popAnimation === bubble.id ? "popping" : ""} ${bubble.paused ? "bubble-paused" : ""}`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => handleBubbleClick(bubble.id)}
            onMouseEnter={() => handleBubbleHover(bubble.id, true)}
            onMouseLeave={() => handleBubbleHover(bubble.id, false)}
            onTouchStart={() => handleBubbleHover(bubble.id, true)}
            onTouchEnd={() => handleBubbleHover(bubble.id, false)}
            disabled={!!feedback || isProcessing}
          >
            {bubble.operator}
          </button>
        ))}

      {/* Pause Dialog */}
      {gameState === "paused" && (
        <PauseDialog
          onResume={() => setGameState("playing")}
          onRestart={startGame}
          onQuit={() => setGameState("start")}
          onHelp={() => setShowHelp(true)}
          difficulty={difficulty}
        />
      )}

      {/* Help Dialog */}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// Pause Dialog Component
function PauseDialog({
  onResume,
  onRestart,
  onQuit,
  onHelp,
  difficulty,
}: {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onHelp: () => void;
  difficulty: Difficulty;
}) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box" style={{ textAlign: "center" }}>
        <h2
          className="neon-text"
          style={{ fontSize: "1.8rem", marginBottom: "8px" }}
        >
          Paused
        </h2>
        <p
          style={{
            marginBottom: "24px",
            opacity: 0.7,
            textTransform: "capitalize",
          }}
        >
          Difficulty: {difficulty}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button className="neon-button" onClick={onResume}>
            Resume
          </button>
          <button
            className="neon-button"
            style={{ borderColor: "#ff00ff", color: "#ff00ff" }}
            onClick={onHelp}
          >
            Help
          </button>
          <button
            className="neon-button"
            style={{ borderColor: "#ffaa00", color: "#ffaa00" }}
            onClick={onRestart}
          >
            Restart
          </button>
          <button
            className="neon-button"
            style={{ borderColor: "#ff4466", color: "#ff4466" }}
            onClick={onQuit}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

// Help Dialog Component
function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        <h2
          className="neon-text"
          style={{
            fontSize: "1.5rem",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          How to Play
        </h2>

        <p style={{ marginBottom: "16px", textAlign: "center" }}>
          An equation appears with a missing operator.
          <br />
          <strong>Tap/click the correct operator bubble</strong> before it falls
          off the screen!
        </p>

        <div className="instructions-section">
          <h3>🎯 Goal</h3>
          <ul>
            <li>Pop the bubble with the right operator (+, −, ×, /)</li>
            <li>Score points for each correct answer</li>
            <li>Hover to pause a bubble while you think!</li>
          </ul>
        </div>

        <div className="instructions-section">
          <h3>⚡ Difficulty</h3>
          <ul>
            <li>
              <strong>Easy:</strong> Slow falling bubbles
            </li>
            <li>
              <strong>Medium:</strong> Normal speed
            </li>
            <li>
              <strong>Hard:</strong> Fast falling bubbles
            </li>
          </ul>
        </div>

        <div className="instructions-section">
          <h3>💻 PC / Laptop</h3>
          <ul>
            <li>Click on the correct bubble</li>
            <li>Hover to pause a bubble</li>
            <li>Press Escape to pause game</li>
          </ul>
        </div>

        <div className="instructions-section">
          <h3>📱 Mobile / Tablet</h3>
          <ul>
            <li>Tap the correct bubble</li>
            <li>Hold to pause a bubble</li>
            <li>Tap ⏸ to pause game</li>
          </ul>
        </div>

        <div className="instructions-section">
          <h3>❤️ Lives</h3>
          <ul>
            <li>You have 5 lives</li>
            <li>Wrong answers or missed bubbles cost 1 life</li>
          </ul>
        </div>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button className="neon-button" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
