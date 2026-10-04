import {
  BookOpenCheck, BriefcaseBusiness, Building2, Bug, CarFront, Coffee, Droplets, FileCheck2,
  Flower2, GraduationCap, Grid2X2, HeartPulse, House, KeyRound, Lamp, Languages,
  Laptop, Leaf, NotebookPen, Package, PartyPopper, PawPrint, PenTool, Plane, Scissors,
  Settings2, ShieldCheck, Shirt, ShoppingBasket, Sofa, Sparkles, SprayCan,
  Stethoscope, Utensils, Wifi, Wrench, Zap, type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  'shopping-basket': ShoppingBasket,
  house: House,
  wrench: Wrench,
  'car-front': CarFront,
  'building-2': Building2,
  'key-round': KeyRound,
  lamp: Lamp,
  coffee: Coffee,
  'graduation-cap': GraduationCap,
  'briefcase-business': BriefcaseBusiness,
  sofa: Sofa,
  laptop: Laptop,
  scissors: Scissors,
  sparkles: Sparkles,
  'heart-pulse': HeartPulse,
  'grid-2x2': Grid2X2,
  droplets: Droplets,
  zap: Zap,
  'settings-2': Settings2,
  plane: Plane,
  'shield-check': ShieldCheck,
  bug: Bug,
  boxes: Package,
  package: Package,
  'notebook-pen': NotebookPen,
  utensils: Utensils,
  'book-open-check': BookOpenCheck,
  languages: Languages,
  'file-check-2': FileCheck2,
  'pen-tool': PenTool,
  shirt: Shirt,
  leaf: Leaf,
  wifi: Wifi,
  'spray-can': SprayCan,
  'flower-2': Flower2,
  stethoscope: Stethoscope,
  'party-popper': PartyPopper,
  'paw-print': PawPrint,
}

interface IconGlyphProps {
  name: string
  size?: number
  strokeWidth?: number
}

export default function IconGlyph({ name, size = 22, strokeWidth = 1.8 }: IconGlyphProps) {
  const Icon = icons[name] ?? Sparkles
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
