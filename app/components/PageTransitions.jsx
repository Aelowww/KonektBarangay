"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -16, opacity: 0 }}
      transition={{
        duration: 0.16,
        ease: "easeOut",
      }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
