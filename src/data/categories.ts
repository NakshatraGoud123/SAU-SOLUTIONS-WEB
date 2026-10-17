export interface Category {
  slug: string
  name: string
  description: string
  icon: string
  tone: string
  imageUrl?: string | null
}

export const categories: Category[] = [
  { slug: 'essential-supplies', name: 'Essential Supplies', description: 'A preview category for everyday goods from local shops.', icon: 'shopping-basket', tone: 'blue' },
  { slug: 'home-services', name: 'Home Services', description: 'A preview of service types related to home needs.', icon: 'house', tone: 'violet' },
  { slug: 'mechanic-services', name: 'Mechanic Services', description: 'A preview category for local vehicle-care providers.', icon: 'wrench', tone: 'amber' },
  { slug: 'mobility-services', name: 'Mobility Services', description: 'A preview category for mobility-related services.', icon: 'car-front', tone: 'cyan' },
  { slug: 'residential-services', name: 'Residential Services', description: 'A preview of services for residential needs.', icon: 'building-2', tone: 'green' },
  { slug: 'property-lifestyle', name: 'Property & Lifestyle', description: 'A preview category for property and lifestyle services.', icon: 'key-round', tone: 'rose' },
  { slug: 'home-essentials', name: 'Home Essentials', description: 'A preview category for useful items around the home.', icon: 'lamp', tone: 'orange' },
  { slug: 'food-beverages', name: 'Food & Beverages', description: 'A preview category for food and beverage businesses.', icon: 'coffee', tone: 'red' },
  { slug: 'education', name: 'Education', description: 'A preview category for learning and education services.', icon: 'graduation-cap', tone: 'indigo' },
  { slug: 'business-professional', name: 'Business & Professional', description: 'A preview category for professional services.', icon: 'briefcase-business', tone: 'slate' },
  { slug: 'home-lifestyle', name: 'Home & Lifestyle', description: 'A preview category for home and lifestyle needs.', icon: 'sofa', tone: 'pink' },
  { slug: 'tech-services', name: 'Tech Services', description: 'A preview category for technology-related help.', icon: 'laptop', tone: 'sky' },
  { slug: 'mens-grooming', name: "Men's Grooming", description: 'A preview category for grooming services.', icon: 'scissors', tone: 'navy' },
  { slug: 'womens-beauty', name: "Women's Beauty", description: 'A preview category for beauty and personal-care services.', icon: 'sparkles', tone: 'orchid' },
  { slug: 'healthcare-pharmacy', name: 'Healthcare & Pharmacy', description: 'A preview category for healthcare and pharmacy businesses.', icon: 'heart-pulse', tone: 'mint' },
  { slug: 'more-services', name: 'More Services', description: 'Additional service categories may be explored over time.', icon: 'grid-2x2', tone: 'purple' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
