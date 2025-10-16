// src/sharedComponents/Icon.tsx
import React from 'react';
import { LucideProps } from 'lucide-react';

// Generic wrapper that applies consistent size and stroke
export const Icon = (
  IconComponent: React.FC<LucideProps>,
  props?: LucideProps
) => <IconComponent size={22} strokeWidth={1.75} {...props} />;
