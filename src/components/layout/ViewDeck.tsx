import clsx from "clsx";
import React from "react";

export interface ViewDeckSlot {
  id: string;
  label?: string;
  content: React.ReactNode;
}

interface ViewDeckProps {
  viewMode: string;
  slots: ViewDeckSlot[];
  className?: string;
}

const ViewDeck: React.FC<ViewDeckProps> = ({ viewMode, slots, className }) => {
  return (
    <div className={clsx("relative flex h-full w-full flex-col", className)}>
      {slots.map(({ id, label, content }) => (
        <section
          key={id}
          role="tabpanel"
          aria-label={label ?? id}
          aria-hidden={viewMode !== id}
          className={clsx(
            "h-full w-full flex-1",
            viewMode === id ? "block" : "hidden"
          )}
        >
          {content}
        </section>
      ))}
    </div>
  );
};

export default ViewDeck;


