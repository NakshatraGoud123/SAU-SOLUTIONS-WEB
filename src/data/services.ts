export type ServiceKind = 'product' | 'professional'

export interface Service {
  id: string
  categorySlug: string
  name: string
  description: string
  kind: ServiceKind
  price: number
  priceUnit: string
  icon: string
  tone: string
}

export const services: Service[] = [
  { id: 'daily-grocery-box', categorySlug: 'essential-supplies', name: 'Daily grocery box', description: 'Example listing for an everyday grocery selection.', kind: 'product', price: 399, priceUnit: 'per box', icon: 'shopping-basket', tone: 'green' },
  { id: 'drinking-water', categorySlug: 'essential-supplies', name: 'Drinking water pack', description: 'Example listing for a drinking water product.', kind: 'product', price: 120, priceUnit: 'per pack', icon: 'droplets', tone: 'blue' },
  { id: 'home-cleaning', categorySlug: 'home-services', name: 'Home deep cleaning', description: 'Example listing for a home cleaning service.', kind: 'professional', price: 899, priceUnit: 'starting at', icon: 'sparkles', tone: 'violet' },
  { id: 'electrician', categorySlug: 'home-services', name: 'Electrician on call', description: 'Example listing for household electrical repairs and installations.', kind: 'professional', price: 249, priceUnit: 'inspection', icon: 'zap', tone: 'amber' },
  { id: 'plumber', categorySlug: 'home-services', name: 'Plumbing support', description: 'Example listing for common household plumbing repairs.', kind: 'professional', price: 299, priceUnit: 'inspection', icon: 'wrench', tone: 'blue' },
  { id: 'car-service', categorySlug: 'mechanic-services', name: 'Car service at home', description: 'Example listing for vehicle maintenance.', kind: 'professional', price: 1299, priceUnit: 'starting at', icon: 'car-front', tone: 'slate' },
  { id: 'bike-repair', categorySlug: 'mechanic-services', name: 'Two-wheeler repair', description: 'Example listing for two-wheeler checks and repairs.', kind: 'professional', price: 349, priceUnit: 'inspection', icon: 'settings-2', tone: 'orange' },
  { id: 'city-ride', categorySlug: 'mobility-services', name: 'City ride', description: 'Example listing for an urban ride service.', kind: 'professional', price: 149, priceUnit: 'per ride', icon: 'car-front', tone: 'cyan' },
  { id: 'airport-transfer', categorySlug: 'mobility-services', name: 'Airport transfer', description: 'Plan ahead for a relaxed start to your trip.', kind: 'professional', price: 699, priceUnit: 'per trip', icon: 'plane', tone: 'blue' },
  { id: 'home-sanitisation', categorySlug: 'residential-services', name: 'Home sanitisation', description: 'A careful clean for the spaces you share.', kind: 'professional', price: 699, priceUnit: 'starting at', icon: 'shield-check', tone: 'green' },
  { id: 'pest-control', categorySlug: 'residential-services', name: 'Pest control', description: 'Example listing for a pest-control service.', kind: 'professional', price: 799, priceUnit: 'starting at', icon: 'bug', tone: 'amber' },
  { id: 'property-consult', categorySlug: 'property-lifestyle', name: 'Property consultation', description: 'Example listing for a property consultation.', kind: 'professional', price: 499, priceUnit: 'per session', icon: 'key-round', tone: 'rose' },
  { id: 'moving-help', categorySlug: 'property-lifestyle', name: 'Moving day assistance', description: 'Extra hands to make your next move easier.', kind: 'professional', price: 999, priceUnit: 'starting at', icon: 'boxes', tone: 'orange' },
  { id: 'home-organiser', categorySlug: 'home-essentials', name: 'Home organisation kit', description: 'Useful storage basics for calmer corners.', kind: 'product', price: 549, priceUnit: 'per set', icon: 'package', tone: 'orange' },
  { id: 'stationery-set', categorySlug: 'home-essentials', name: 'Everyday stationery set', description: 'Pens, paper and desk essentials in one set.', kind: 'product', price: 249, priceUnit: 'per set', icon: 'notebook-pen', tone: 'indigo' },
  { id: 'fresh-meal', categorySlug: 'food-beverages', name: 'Fresh lunch plate', description: 'Example listing for a prepared lunch.', kind: 'product', price: 229, priceUnit: 'per plate', icon: 'utensils', tone: 'red' },
  { id: 'coffee-break', categorySlug: 'food-beverages', name: 'Coffee break bundle', description: 'Example listing for a coffee bundle.', kind: 'product', price: 179, priceUnit: 'per bundle', icon: 'coffee', tone: 'amber' },
  { id: 'math-tutor', categorySlug: 'education', name: 'One-to-one maths tutor', description: 'Example listing for one-to-one maths lessons.', kind: 'professional', price: 499, priceUnit: 'per hour', icon: 'book-open-check', tone: 'indigo' },
  { id: 'language-lessons', categorySlug: 'education', name: 'Language lessons', description: 'Example listing for language lessons.', kind: 'professional', price: 449, priceUnit: 'per hour', icon: 'languages', tone: 'violet' },
  { id: 'tax-consult', categorySlug: 'business-professional', name: 'Tax filing assistance', description: 'Example listing for tax filing assistance.', kind: 'professional', price: 799, priceUnit: 'per filing', icon: 'file-check-2', tone: 'slate' },
  { id: 'design-consult', categorySlug: 'business-professional', name: 'Brand design consultation', description: 'Get thoughtful direction for your next big idea.', kind: 'professional', price: 999, priceUnit: 'per session', icon: 'pen-tool', tone: 'purple' },
  { id: 'laundry-care', categorySlug: 'home-lifestyle', name: 'Laundry & steam care', description: 'Example listing for laundry and garment care.', kind: 'professional', price: 199, priceUnit: 'per kg', icon: 'shirt', tone: 'pink' },
  { id: 'plant-care', categorySlug: 'home-lifestyle', name: 'Plant care visit', description: 'A helping hand for happy, healthy houseplants.', kind: 'professional', price: 349, priceUnit: 'per visit', icon: 'leaf', tone: 'green' },
  { id: 'device-setup', categorySlug: 'tech-services', name: 'Device setup & support', description: 'Get your devices connected and working smoothly.', kind: 'professional', price: 399, priceUnit: 'per visit', icon: 'laptop', tone: 'sky' },
  { id: 'wifi-help', categorySlug: 'tech-services', name: 'Wi-Fi troubleshooting', description: 'Example listing for home Wi-Fi troubleshooting.', kind: 'professional', price: 299, priceUnit: 'inspection', icon: 'wifi', tone: 'blue' },
  { id: 'mens-haircut', categorySlug: 'mens-grooming', name: 'Haircut at home', description: 'A fresh, comfortable cut from a grooming pro.', kind: 'professional', price: 349, priceUnit: 'per visit', icon: 'scissors', tone: 'navy' },
  { id: 'mens-grooming', categorySlug: 'mens-grooming', name: 'Grooming essentials kit', description: 'Everyday care basics, all in one place.', kind: 'product', price: 499, priceUnit: 'per kit', icon: 'spray-can', tone: 'slate' },
  { id: 'beauty-at-home', categorySlug: 'womens-beauty', name: 'Beauty care at home', description: 'Example listing for an at-home beauty service.', kind: 'professional', price: 699, priceUnit: 'starting at', icon: 'sparkles', tone: 'orchid' },
  { id: 'wellness-session', categorySlug: 'womens-beauty', name: 'Relaxing wellness session', description: 'Make space for a slower, more restorative day.', kind: 'professional', price: 899, priceUnit: 'per session', icon: 'flower-2', tone: 'pink' },
  { id: 'pharmacy-essentials', categorySlug: 'healthcare-pharmacy', name: 'Pharmacy essentials', description: 'Everyday wellness products, at your convenience.', kind: 'product', price: 199, priceUnit: 'starting at', icon: 'heart-pulse', tone: 'mint' },
  { id: 'nurse-visit', categorySlug: 'healthcare-pharmacy', name: 'At-home nurse visit', description: 'Example listing for an at-home nursing service.', kind: 'professional', price: 799, priceUnit: 'per visit', icon: 'stethoscope', tone: 'green' },
  { id: 'event-help', categorySlug: 'more-services', name: 'Event-day support', description: 'Example listing for event-day assistance.', kind: 'professional', price: 999, priceUnit: 'starting at', icon: 'party-popper', tone: 'purple' },
  { id: 'pet-care', categorySlug: 'more-services', name: 'Friendly pet care', description: 'Example listing for pet care.', kind: 'professional', price: 399, priceUnit: 'per visit', icon: 'paw-print', tone: 'rose' },
]

export function getService(id: string | undefined) {
  return services.find((service) => service.id === id)
}

export function getServicesForCategory(categorySlug: string) {
  return services.filter((service) => service.categorySlug === categorySlug)
}
