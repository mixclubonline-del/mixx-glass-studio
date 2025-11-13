import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface OverlayPortalProps {
  children: React.ReactNode;
  containerId?: string;
  className?: string;
}

const OverlayPortal: React.FC<OverlayPortalProps> = ({
  children,
  containerId = "mixx-overlay-root",
  className,
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  const memoizedClassName = useMemo(() => className ?? "", [className]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let element = document.getElementById(containerId);

    if (!element) {
      element = document.createElement("div");
      element.id = containerId;
      document.body.appendChild(element);
    }

    if (memoizedClassName) {
      element.className = memoizedClassName;
    }

    setTarget(element);

    return () => {
      if (!element) {
        return;
      }
      if (memoizedClassName) {
        element.className = "";
      }
    };
  }, [containerId, memoizedClassName]);

  if (typeof document === "undefined" || !target) {
    return null;
  }

  return createPortal(children, target);
};

export default OverlayPortal;


