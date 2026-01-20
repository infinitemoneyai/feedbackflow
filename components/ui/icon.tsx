"use client";

import { Icon as IconifyIcon } from "@iconify/react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      className={className}
    />
  );
}
