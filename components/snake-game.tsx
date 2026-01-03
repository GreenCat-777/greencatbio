"use client"

import { useState, useEffect, useRef } from "react"

export default function SnakeGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const directionRef = useRef<string | null>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setGameOver(false)
    directionRef.current = null
  }

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const box = 15
    const cols = canvas.width / box
    const rows = canvas.height / box

    const snake = [{ x: Math.floor(cols / 2) * box, y: Math.floor(rows / 2) * box }]
    let food = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if ((key === "arrowleft" || key === "a") && directionRef.current !== "RIGHT") directionRef.current = "LEFT"
      else if ((key === "arrowup" || key === "w") && directionRef.current !== "DOWN") directionRef.current = "UP"
      else if ((key === "arrowright" || key === "d") && directionRef.current !== "LEFT") directionRef.current = "RIGHT"
      else if ((key === "arrowdown" || key === "s") && directionRef.current !== "UP") directionRef.current = "DOWN"
    }

    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && directionRef.current !== "LEFT") directionRef.current = "RIGHT"
        else if (dx < 0 && directionRef.current !== "RIGHT") directionRef.current = "LEFT"
      } else {
        if (dy > 0 && directionRef.current !== "UP") directionRef.current = "DOWN"
        else if (dy < 0 && directionRef.current !== "DOWN") directionRef.current = "UP"
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchend", handleTouchEnd)

    const collision = (head: { x: number; y: number }, body: { x: number; y: number }[]) => {
      return body.some((seg) => seg.x === head.x && seg.y === head.y)
    }

    const draw = () => {
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      snake.forEach((seg) => {
        ctx.fillStyle = "#0ed145"
        ctx.shadowBlur = 10
        ctx.shadowColor = "#0ed145"
        ctx.fillRect(seg.x, seg.y, box, box)
      })

      ctx.fillStyle = "#fff"
      ctx.shadowBlur = 10
      ctx.shadowColor = "#fff"
      ctx.fillRect(food.x, food.y, box, box)
      ctx.shadowBlur = 0

      let snakeX = snake[0].x
      let snakeY = snake[0].y

      if (directionRef.current === "LEFT") snakeX -= box
      if (directionRef.current === "UP") snakeY -= box
      if (directionRef.current === "RIGHT") snakeX += box
      if (directionRef.current === "DOWN") snakeY += box

      if (snakeX === food.x && snakeY === food.y) {
        setScore((prev) => prev + 1)
        food = {
          x: Math.floor(Math.random() * cols) * box,
          y: Math.floor(Math.random() * rows) * box,
        }
      } else {
        snake.pop()
      }

      const newHead = { x: snakeX, y: snakeY }

      if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
        setGameOver(true)
        return
      }

      snake.unshift(newHead)
    }

    gameIntervalRef.current = setInterval(draw, 150)

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
      document.removeEventListener("keydown", handleKeyDown)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchend", handleTouchEnd)
    }
  }, [gameStarted])

  return (
    <div className="space-y-6">
      {!gameStarted ? (
        <button
          onClick={startGame}
          className="button-glow px-8 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium cursor-pointer bg-transparent"
        >
          Wanna Play Snake?
        </button>
      ) : (
        <>
          <h2 className="text-2xl glow-text">Snake Game</h2>
          <div className="glow-text text-lg">Score: {score}</div>
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="border-2 border-[#0ed145] mx-auto shadow-[0_0_20px_rgba(14,209,69,0.3)] touch-none"
          />
          <p className="text-sm glow-text">Use Arrow keys, WASD, or swipe to move.</p>
          {gameOver && (
            <div className="space-y-4">
              <p className="text-xl glow-text animate-pulse">Game Over! Final Score: {score}</p>
              <button
                onClick={startGame}
                className="button-glow px-8 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium cursor-pointer bg-transparent"
              >
                Play Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
