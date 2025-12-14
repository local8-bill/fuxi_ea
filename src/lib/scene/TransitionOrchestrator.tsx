"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useSceneManager, type SceneType } from "./sceneManager";

interface TransitionOrchestratorProps {
  renderScene: (scene: SceneType) => ReactNode;
  className?: string;
}

export function TransitionOrchestrator({ renderScene, className }: TransitionOrchestratorProps) {
  const activeScene = useSceneManager((state) => state.activeScene);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeScene}
        className={className}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
      >
        {renderScene(activeScene)}
      </motion.div>
    </AnimatePresence>
  );
}
