"use client";

import { useEffect } from "react";

export default function SnapScrollScope() {
  useEffect(() => {
    document.documentElement.classList.add("snap-page");
    return () => document.documentElement.classList.remove("snap-page");
  }, []);

  return null;
}
