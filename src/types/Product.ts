import type { SpecialInfoItem } from '../api/endpoints';
export type { SpecialInfoItem };

export interface Product {
  id: string;
  label: string;
  imageURL: string;
  description: string;
  isAvailable: boolean;
  price: number;
  categories: Category[];
  variantTypes: VariantType[];
  addons: AddonGroup[];
  specialInfo?: SpecialInfoItem[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface VariantType {
  id: string;
  label: string;
  variants: Variant[];
}

export interface Variant {
  id: string;
  label: string;
  imageURL: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface AddonGroup {
  id: string;
  label: string;
  options: AddonOption[];
}

export interface AddonOption {
  id: string;
  label: string;
  imageURL: string;
  priceDelta: number;
  isAvailable: boolean;
}
