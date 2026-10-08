"use client";

import { useState } from "react";
import { Plug } from "@lucasmarkes/hairline/react";

// A plug that reaches for its socket and never quite makes it
export const NotFoundFigure = () => {
  const [read, setRead] = useState("");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <Plug
        label="A plug that can't reach its socket"
        onRead={setRead}
        className="mx-auto w-full max-w-[400px]"
      />
      <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-text-light-body dark:text-text-dark-headerDark">
        {read}
      </span>
    </div>
  );
};
