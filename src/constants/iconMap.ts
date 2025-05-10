// src/constants/iconMap.ts
import { 
  EspressoIcon, 
  FilterIcon, 
  ColdbrewIcon, 
  BreakfastIcon,
  WifiIcon,
  CreditIcon,
  VeganIcon,
  LaptopIcon 
} from '@/components/icons';

export const ICON_MAP = {
  // group "serving"
  espresso:      { label: 'Espresso',      svg: EspressoIcon },
  filter:        { label: 'Filter Coffee', svg: FilterIcon },
  coldbrew:      { label: 'Cold Brew',     svg: ColdbrewIcon },
  breakfast:     { label: 'Breakfast',     svg: BreakfastIcon },

  // group "services"
  wifi:          { label: 'Free Wi‑Fi',    svg: WifiIcon },
  credit:        { label: 'Credit Cards',  svg: CreditIcon },
  vegan:         { label: 'Vegan Options', svg: VeganIcon },
  laptop:        { label: 'Laptop Friendly', svg: LaptopIcon }
};
