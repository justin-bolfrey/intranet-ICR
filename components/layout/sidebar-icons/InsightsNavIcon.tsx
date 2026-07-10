"use client";

import { motion } from "framer-motion";

import {
  insightsLineSegment1Variants,
  insightsLineSegment2Variants,
  insightsLineSegment3Variants,
} from "@/components/layout/nav-icon-motion";

type InsightsNavIconProps = {
  className?: string;
};

/**
 * Line chart icon: the data line ripples in a wave from right to left on hover.
 * Paths match lucide-react `LineChart`.
 */
export function InsightsNavIcon({ className }: InsightsNavIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
      className={className}
      aria-hidden
    >
      <g>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      </g>
      <motion.g variants={insightsLineSegment1Variants}>
        <path d="M19 9 14 14" />
      </motion.g>
      <motion.g variants={insightsLineSegment2Variants}>
        <path d="M14 14 10 10" />
      </motion.g>
      <motion.g variants={insightsLineSegment3Variants}>
        <path d="M10 10 7 13" />
      </motion.g>
    </svg>
  );
}
