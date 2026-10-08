"use client";

import { useState } from "react";
import {
  Branches,
  Elevator,
  Exploded,
  Laptop,
} from "@lucasmarkes/hairline/react";
import type { ProjectFigure as FigureName } from "@/types";
import { cn } from "@/utils/cn";

const figures = {
  branches: Branches,
  elevator: Elevator,
  laptop: Laptop,
  exploded: Exploded,
} satisfies Record<FigureName, unknown>;

// Some figures are framed for their most open pose and sit off-centre at rest.
// Shifting the figure element itself keeps pointer hit-testing in sync, since
// the figure measures its own on-screen box.
const restOffsets: Partial<Record<FigureName, string>> = {
  exploded: "translate(5%, -18%) scale(1.15)",
};

type Props = {
  figure: FigureName;
  label: string;
  className?: string;
  figureClassName?: string;
  // The corner read-out ("rest", "gap 5.0"); too noisy on small cards
  showRead?: boolean;
};

// A hairline figure in a bordered panel, with its read-out in the corner
export const ProjectFigure = ({
  figure,
  label,
  className,
  figureClassName,
  showRead = true,
}: Props) => {
  const Figure = figures[figure];
  const [read, setRead] = useState("");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-200 transition-colors duration-300 dark:border-neutral-800",
        className,
      )}
    >
      <Figure
        label={label}
        onRead={setRead}
        className={cn("w-full", figureClassName)}
        style={{ transform: restOffsets[figure] }}
      />
      {showRead && (
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-text-light-body dark:text-text-dark-headerDark">
          {read}
        </span>
      )}
    </div>
  );
};
