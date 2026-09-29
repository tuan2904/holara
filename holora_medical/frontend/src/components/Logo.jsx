import React from "react";
import logoPng from "../assets/LogoHolora.png";

const Logo = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  return (
    <img
      src={logoPng}
      alt="Holora Logo"
      className={`${sizeMap[size] || sizeMap.md} object-contain ${className}`}
    />
  );
};

export default Logo;
