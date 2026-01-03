"use client"

import Link from "next/link"
import SnakeGame from "@/components/snake-game"

export default function NotFoundClient() {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <Link
        href="/"
        className="fixed top-5 left-5 px-5 py-2 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium z-50 button-glow"
      >
        Home
      </Link>

      <h1 className="text-6xl md:text-8xl font-bold glow-text mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl glow-text mb-4">Page not found</h2>
      <p className="text-lg glow-text mb-8">Oops! Looks like you&apos;re lost.</p>

      <SnakeGame />
    </div>
  )
}
