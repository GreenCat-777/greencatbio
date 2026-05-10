"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, config: Record<string, string>) => void;
    };
  }
}

export default function KofiWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      window.kofiWidgetOverlay.draw("gc777", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support me",
        "floating-chat.donateButton.background-color": "#00000",
        "floating-chat.donateButton.text-color": "#0fe54b",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
