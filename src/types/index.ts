import React from "react";

export interface MenuItem {
  name: string;
  icon: React.ReactNode;
  description?: string;
  action?: () => void;
  subMenu?: string;
  disabled?: boolean;
}

export interface Menu {
  parent?: string;
  items: MenuItem[];
}