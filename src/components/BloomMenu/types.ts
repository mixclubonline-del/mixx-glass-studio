/**
 * Bloom Menu Types
 */

import React from 'react';

export interface MenuItem {
  name: string;
  action?: () => void;
  subMenu?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface Menu {
  parent?: string;
  items: MenuItem[];
}

export interface MenuConfig {
  [key: string]: Menu;
}
