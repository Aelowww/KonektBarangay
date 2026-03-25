"use client";

import React, { useEffect, useState } from "react";
import "./typewriter.css";

type Props = {
  text: string;
  tag?: keyof React.JSX.IntrinsicElements;
  delay?: number;
  speed?: number;
  className?: string;
};

export default function TypewriterText({
  text,
  tag = "p",
  delay = 0,
  speed = 40,
  className = "",
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCount((prev) => {
          if (prev >= text.length) {
            if (interval) clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, delay, speed]);

  const Tag = tag;

  return (
    <Tag className={`typewriter ${className}`}>
      {text.slice(0, count)}
    </Tag>
  );
}
