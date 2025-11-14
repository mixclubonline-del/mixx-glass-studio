import React from "react";
import { FlowIconButton } from "./FlowIconButton";

interface DockClusterProps {
  position: "left" | "center" | "right";
  items: string[];
}

export const DockCluster: React.FC<DockClusterProps> = ({ position, items }) => {
  return (
    <div className={`dock-cluster dock-${position}`}>
      {items.map((id) => (
        <FlowIconButton key={id} id={id} />
      ))}
    </div>
  );
};

