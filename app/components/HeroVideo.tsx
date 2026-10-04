"use client";

import { useEffect, useRef } from "react";

export default function HeroVideo({ className, src }: { className?: string; src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute("muted", "");
    v.load();
    void v.play().catch(() => {});
  }, []);

  return (
    <video ref={ref} className={className} autoPlay loop muted playsInline preload="auto">
      <source src={src} type="video/mp4" />
    </video>
  );
}
