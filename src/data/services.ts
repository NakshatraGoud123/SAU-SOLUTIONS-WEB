export type ServiceKind = 'product' | 'professional'

export interface Service {
  id: string
  categorySlug: string
  name: string
  description: string
  kind: ServiceKind
  price: number
  priceUnit: string
  rating: number
  reviews: number
  eta: string
  icon: string
  tone: string
  badge?: string
}

export const services: Service[] = [
  { id: 'daily-grocery-box', categorySlug: 'essential-supplies', name: 'Daily grocery box', description: 'Fresh picks for your everyday kitchen.', kind: 'product', price: 399, priceUnit: 'per box', rating: 4.8, reviews: 248, eta: '20–30 min', icon: 'shopping-basket', tone: 'green', badge: 'Bestseller' },
  { id: 'drinking-water', categorySlug: 'essential-supplies', name: 'Drinking water pack', description: 'Sealed bottles, delivered fresh.', kind: 'product', price: 120, priceUnit: 'per pack', rating: 4.7, reviews: 186, eta: '20–30 min', icon: 'droplets', tone: 'blue' },
  { id: 'home-cleaning', categorySlug: 'home-services', name: 'Home deep cleaning', description: 'A top-to-bottom refresh for your space.', kind: 'professional', price: 899, priceUnit: 'starting at', rating: 4.9, reviews: 512, eta: 'Today, 2–4 pm', icon: 'sparkles', tone: 'violet', badge: 'Top rated' },
  { id: 'electrician', categorySlug: 'home-services', name: 'Electrician on call', description: 'Repairs and installations by verified pros.', kind: 'professional', price: 249, priceUnit: 'inspection', rating: 4.8, reviews: 329, eta: 'Within 60 min', icon: 'zap', tone: 'amber' },
  { id: 'plumber', categorySlug: 'home-services', name: 'Plumbing support', description: 'Quick fixes for leaks, taps and more.', kind: 'professional', price: 299, priceUnit: 'inspection', rating: 4.8, reviews: 271, eta: 'Within 60 min', icon: 'wrench', tone: 'blue' },
  { id: 'car-service', categorySlug: 'mechanic-services', name: 'Car service at home', description: 'Convenient maintenance from a skilled mechanic.', kind: 'professional', price: 1299, priceUnit: 'starting at', rating: 4.8, reviews: 214, eta: 'Book for today', icon: 'car-front', tone: 'slate' },
  { id: 'bike-repair', categorySlug: 'mechanic-services', name: 'Two-wheeler repair', description: 'Expert check-ups and repairs, right where you are.', kind: 'professional', price: 349, priceUnit: 'inspection', rating: 4.7, reviews: 194, eta: 'Within 90 min', icon: 'settings-2', tone: 'orange' },
  { id: 'city-ride', categorySlug: 'mobility-services', name: 'City ride', description: 'A smooth, dependable ride across town.', kind: 'professional', price: 149, priceUnit: 'per ride', rating: 4.9, reviews: 1024, eta: 'Pickup in 5 min', icon: 'car-front', tone: 'cyan' },
  { id: 'airport-transfer', categorySlug: 'mobility-services', name: 'Airport transfer', description: 'Plan ahead for a relaxed start to your trip.', kind: 'professional', price: 699, priceUnit: 'per trip', rating: 4.8, reviews: 438, eta: 'Schedule a ride', icon: 'plane', tone: 'blue' },
  { id: 'home-sanitisation', categorySlug: 'residential-services', name: 'Home sanitisation', description: 'A careful clean for the spaces you share.', kind: 'professional', price: 699, priceUnit: 'starting at', rating: 4.8, reviews: 156, eta: 'Today, 3–5 pm', icon: 'shield-check', tone: 'green' },
  { id: 'pest-control', categorySlug: 'residential-services', name: 'Pest control', description: 'Targeted treatments from trained technicians.', kind: 'professional', price: 799, priceUnit: 'starting at', rating: 4.7, reviews: 187, eta: 'Book for tomorrow', icon: 'bug', tone: 'amber' },
  { id: 'property-consult', categorySlug: 'property-lifestyle', name: 'Property consultation', description: 'Practical guidance from a local property expert.', kind: 'professional', price: 499, priceUnit: 'per session', rating: 4.8, reviews: 92, eta: 'Schedule a time', icon: 'key-round', tone: 'rose' },
  { id: 'moving-help', categorySlug: 'property-lifestyle', name: 'Moving day assistance', description: 'Extra hands to make your next move easier.', kind: 'professional', price: 999, priceUnit: 'starting at', rating: 4.8, reviews: 138, eta: 'Book for this week', icon: 'boxes', tone: 'orange' },
  { id: 'home-organiser', categorySlug: 'home-essentials', name: 'Home organisation kit', description: 'Useful storage basics for calmer corners.', kind: 'product', price: 549, priceUnit: 'per set', rating: 4.7, reviews: 173, eta: '20–30 min', icon: 'package', tone: 'orange' },
  { id: 'stationery-set', categorySlug: 'home-essentials', name: 'Everyday stationery set', description: 'Pens, paper and desk essentials in one set.', kind: 'product', price: 249, priceUnit: 'per set', rating: 4.6, reviews: 96, eta: '30–40 min', icon: 'notebook-pen', tone: 'indigo' },
  { id: 'fresh-meal', categorySlug: 'food-beverages', name: 'Fresh lunch plate', description: 'A wholesome, freshly prepared meal.', kind: 'product', price: 229, priceUnit: 'per plate', rating: 4.8, reviews: 364, eta: '25–35 min', icon: 'utensils', tone: 'red', badge: 'Made fresh' },
  { id: 'coffee-break', categorySlug: 'food-beverages', name: 'Coffee break bundle', description: 'A little pick-me-up, delivered to your door.', kind: 'product', price: 179, priceUnit: 'per bundle', rating: 4.7, reviews: 210, eta: '20–30 min', icon: 'coffee', tone: 'amber' },
  { id: 'math-tutor', categorySlug: 'education', name: 'One-to-one maths tutor', description: 'Patient, personalised learning for every level.', kind: 'professional', price: 499, priceUnit: 'per hour', rating: 4.9, reviews: 142, eta: 'Online or in person', icon: 'book-open-check', tone: 'indigo' },
  { id: 'language-lessons', categorySlug: 'education', name: 'Language lessons', description: 'Build confidence with a friendly language coach.', kind: 'professional', price: 449, priceUnit: 'per hour', rating: 4.8, reviews: 103, eta: 'Online or in person', icon: 'languages', tone: 'violet' },
  { id: 'tax-consult', categorySlug: 'business-professional', name: 'Tax filing assistance', description: 'Clear, expert help with your annual filing.', kind: 'professional', price: 799, priceUnit: 'per filing', rating: 4.8, reviews: 226, eta: 'Book a consultation', icon: 'file-check-2', tone: 'slate' },
  { id: 'design-consult', categorySlug: 'business-professional', name: 'Brand design consultation', description: 'Get thoughtful direction for your next big idea.', kind: 'professional', price: 999, priceUnit: 'per session', rating: 4.9, reviews: 84, eta: 'Schedule a time', icon: 'pen-tool', tone: 'purple' },
  { id: 'laundry-care', categorySlug: 'home-lifestyle', name: 'Laundry & steam care', description: 'Fresh, neatly finished clothes without the errand.', kind: 'professional', price: 199, priceUnit: 'per kg', rating: 4.8, reviews: 308, eta: 'Pickup in 45 min', icon: 'shirt', tone: 'pink' },
  { id: 'plant-care', categorySlug: 'home-lifestyle', name: 'Plant care visit', description: 'A helping hand for happy, healthy houseplants.', kind: 'professional', price: 349, priceUnit: 'per visit', rating: 4.8, reviews: 119, eta: 'Book for this week', icon: 'leaf', tone: 'green' },
  { id: 'device-setup', categorySlug: 'tech-services', name: 'Device setup & support', description: 'Get your devices connected and working smoothly.', kind: 'professional', price: 399, priceUnit: 'per visit', rating: 4.8, reviews: 236, eta: 'Within 90 min', icon: 'laptop', tone: 'sky' },
  { id: 'wifi-help', categorySlug: 'tech-services', name: 'Wi-Fi troubleshooting', description: 'Reliable help to get your home back online.', kind: 'professional', price: 299, priceUnit: 'inspection', rating: 4.7, reviews: 171, eta: 'Within 60 min', icon: 'wifi', tone: 'blue' },
  { id: 'mens-haircut', categorySlug: 'mens-grooming', name: 'Haircut at home', description: 'A fresh, comfortable cut from a grooming pro.', kind: 'professional', price: 349, priceUnit: 'per visit', rating: 4.9, reviews: 416, eta: 'Today, 4–6 pm', icon: 'scissors', tone: 'navy' },
  { id: 'mens-grooming', categorySlug: 'mens-grooming', name: 'Grooming essentials kit', description: 'Everyday care basics, all in one place.', kind: 'product', price: 499, priceUnit: 'per kit', rating: 4.7, reviews: 156, eta: '30–40 min', icon: 'spray-can', tone: 'slate' },
  { id: 'beauty-at-home', categorySlug: 'womens-beauty', name: 'Beauty care at home', description: 'A little self-care with a verified beauty pro.', kind: 'professional', price: 699, priceUnit: 'starting at', rating: 4.9, reviews: 503, eta: 'Today, 2–4 pm', icon: 'sparkles', tone: 'orchid', badge: 'Top rated' },
  { id: 'wellness-session', categorySlug: 'womens-beauty', name: 'Relaxing wellness session', description: 'Make space for a slower, more restorative day.', kind: 'professional', price: 899, priceUnit: 'per session', rating: 4.8, reviews: 289, eta: 'Choose a time', icon: 'flower-2', tone: 'pink' },
  { id: 'pharmacy-essentials', categorySlug: 'healthcare-pharmacy', name: 'Pharmacy essentials', description: 'Everyday wellness products, at your convenience.', kind: 'product', price: 199, priceUnit: 'starting at', rating: 4.8, reviews: 341, eta: '25–35 min', icon: 'heart-pulse', tone: 'mint' },
  { id: 'nurse-visit', categorySlug: 'healthcare-pharmacy', name: 'At-home nurse visit', description: 'Compassionate care from a qualified professional.', kind: 'professional', price: 799, priceUnit: 'per visit', rating: 4.9, reviews: 124, eta: 'Schedule a visit', icon: 'stethoscope', tone: 'green' },
  { id: 'event-help', categorySlug: 'more-services', name: 'Event-day support', description: 'A trusted extra pair of hands for your gathering.', kind: 'professional', price: 999, priceUnit: 'starting at', rating: 4.8, reviews: 73, eta: 'Book for this week', icon: 'party-popper', tone: 'purple' },
  { id: 'pet-care', categorySlug: 'more-services', name: 'Friendly pet care', description: 'Kind, dependable care for your best friend.', kind: 'professional', price: 399, priceUnit: 'per visit', rating: 4.9, reviews: 208, eta: 'Choose a time', icon: 'paw-print', tone: 'rose' },
]

export function getService(id: string | undefined) {
  return services.find((service) => service.id === id)
}

export function getServicesForCategory(categorySlug: string) {
  return services.filter((service) => service.categorySlug === categorySlug)
}
