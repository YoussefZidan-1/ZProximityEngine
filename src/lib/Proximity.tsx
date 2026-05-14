import React from "react";
import { ProximityProps } from "./types";
import { ProximityPointer } from "./components/ProximityPointer";
import { ProximityScroll } from "./components/ProximityScroll";

export const Proximity: React.FC<ProximityProps> = (props) => {
  const activeMode = props.config?.mode ?? props.mode ?? "pointer";
  
  if (activeMode === "scroll") {
    return <ProximityScroll {...props} />;
  }
  
  return <ProximityPointer {...props} />;
};