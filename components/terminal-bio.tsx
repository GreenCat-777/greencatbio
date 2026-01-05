"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function TerminalBio() {
  const [showIntro, setShowIntro] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  const bioText = `Hi People, I enjoy jailbreaking devices and doing unintended things, I've made a plethora of scriptlets for the kindle along with other packages and ports of linux distros. Please understand I cannot code although I can write SH scripts and likely give you support for the kindle and similar.

I'm a beta tester for the MIP wiki and KindleForge. I've written pages for the MIP wiki and kindlemodshelf, and given critical feedback on the kindlemodshelf page builder, and the MIP wiki.

All my projects (not my documentation) are listed under The Unlicense, with no rights reserved, If you use my work credit is appreiciated, but NOT required. If you have paid for any of my work you have been legally scammed.

If you need to reach out to me, or think I could be a valuable collaborator on your project, contact me from the Email or Discord buttons below (Discord Preferred). If you want to take a look at my work use the Github button and/or look in the KMC. I have also started a wiki which has documentation on my projects.`

  useEffect(() => {
    const introTimer = setTimeout(() => {
      setShowIntro(true)
    }, 300)

    return () => clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (!showIntro) return

    let typeInterval: NodeJS.Timeout

    const startTypingDelay = setTimeout(() => {
      let charIndex = 0

      typeInterval = setInterval(() => {
        if (charIndex < bioText.length) {
          setDisplayedText(bioText.slice(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typeInterval)
          setIsTypingComplete(true)
        }
      }, 30) // Consistent 30ms typing speed
    }, 800)

    return () => {
      clearTimeout(startTypingDelay)
      if (typeInterval) clearInterval(typeInterval)
    }
  }, [showIntro, bioText])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  const renderBioWithLinks = (text: string) => {
    if (!isTypingComplete) {
      return text
    }

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    const links = [
      { text: "MIP wiki", url: "https://mip-wiki.pages.dev", index: text.indexOf("MIP wiki") },
      { text: "KindleForge", url: "https://github.com/KindleTweaks/KindleForge", index: text.indexOf("KindleForge") },
      { text: "kindlemodshelf", url: "https://kindlemodshelf.me", index: text.indexOf("kindlemodshelf") },
      { text: "KMC", url: "https://discord.gg/kindle", index: text.indexOf("KMC") },
    ]

    links
      .filter((link) => link.index !== -1)
      .sort((a, b) => a.index - b.index)
      .forEach((link, idx) => {
        parts.push(<span key={`text-${idx}`}>{text.substring(lastIndex, link.index)}</span>)
        parts.push(
          <a
            key={`link-${idx}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors"
          >
            {link.text}
          </a>,
        )
        lastIndex = link.index + link.text.length
      })

    parts.push(<span key="text-end">{text.substring(lastIndex)}</span>)

    return <>{parts}</>
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div
        className={`text-center space-y-2 transition-opacity duration-1000 ${showIntro ? "opacity-100" : "opacity-0"}`}
      >
        <Image
          src="/pfp.png"
          alt="GreenCat Profile Picture"
          width={120}
          height={120}
          className="rounded-full mx-auto border-2 border-[#0ed145] shadow-[0_0_20px_rgba(14,209,69,0.5)]"
          priority
          unoptimized
        />
        <h1 className="text-4xl md:text-5xl font-bold glow-text">I&apos;m GreenCat777</h1>
        <p className="text-2xl md:text-3xl glow-text">Welcome to my bio!</p>
      </div>

      {showIntro && (
        <div className="font-mono text-[#0ed145] animate-[fadeIn_0.5s_ease-in]">
          <div className="border-2 border-[#0ed145] p-6 rounded-lg bg-black/50 shadow-[0_0_20px_rgba(14,209,69,0.3)]">
            <div className="mb-4 text-sm opacity-70">greencat777@bio:~$ cat information.txt</div>
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              {renderBioWithLinks(displayedText)}
              {!isTypingComplete && showCursor && (
                <span className="inline-block w-2 h-5 bg-[#0ed145] ml-1 align-middle" />
              )}
            </div>

            {isTypingComplete && (
              <div className="flex flex-wrap gap-4 justify-center pt-6 mt-6 border-t border-[#0ed145]/30">
                <a
                  href="https://discord.com/users/902006605791494255"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-glow inline-block px-6 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium"
                >
                  Discord
                </a>
                <a
                  href="mailto:greencat777456@gmail.com"
                  className="button-glow inline-block px-6 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium"
                >
                  Email
                </a>
                <a
                  href="https://gc-wiki.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-glow inline-block px-6 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium"
                >
                  My wiki
                </a>
                <a
                  href="https://github.com/GreenCat-777"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-glow inline-block px-6 py-3 border-2 border-[#0ed145] rounded-lg text-[#0ed145] hover:bg-[#0ed145] hover:text-black transition-all font-medium"
                >
                  Github
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
