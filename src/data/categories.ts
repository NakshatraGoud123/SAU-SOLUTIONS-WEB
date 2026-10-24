export interface Category {
  slug: string
  name: string
  description: string
  icon: string
  tone: string
  imageUrl?: string | null
}

export const categories: Category[] = [
  { slug: 'essential-supplies', name: 'Essential Supplies', description: 'Everyday groceries and household essentials from local shops.', icon: 'shopping-basket', tone: 'blue' },
  { slug: 'home-services', name: 'Home Services', description: 'Practical help with cleaning, repairs and everyday home tasks.', icon: 'house', tone: 'violet' },
  { slug: 'mechanic-services', name: 'Mechanic Services', description: 'Vehicle maintenance and repair services from local providers.', icon: 'wrench', tone: 'amber' },
  { slug: 'mobility-services', name: 'Mobility Services', description: 'Local journeys and airport transfers to help you get around.', icon: 'car-front', tone: 'cyan' },
  { slug: 'residential-services', name: 'Residential Services', description: 'Home care and maintenance services for residential spaces.', icon: 'building-2', tone: 'green' },
  { slug: 'property-lifestyle', name: 'Property & Lifestyle', description: 'Property guidance, moving assistance and lifestyle support.', icon: 'key-round', tone: 'rose' },
  { slug: 'home-essentials', name: 'Home Essentials', description: 'Useful products and supplies for your home and daily routine.', icon: 'lamp', tone: 'orange' },
  { slug: 'food-beverages', name: 'Food & Beverages', description: 'Meals, drinks and other offerings from local food businesses.', icon: 'coffee', tone: 'red' },
  { slug: 'education', name: 'Education', description: 'Tutoring and language learning for a range of ages and skill levels.', icon: 'graduation-cap', tone: 'indigo' },
  { slug: 'business-professional', name: 'Business & Professional', description: 'Business advice, design and other professional expertise.', icon: 'briefcase-business', tone: 'slate' },
  { slug: 'home-lifestyle', name: 'Home & Lifestyle', description: 'Laundry, plant care and services that support everyday living.', icon: 'sofa', tone: 'pink' },
  { slug: 'tech-services', name: 'Tech Services', description: 'In-home assistance with devices, connectivity and technology.', icon: 'laptop', tone: 'sky' },
  { slug: 'mens-grooming', name: "Men's Grooming", description: 'Personal grooming services and everyday care essentials.', icon: 'scissors', tone: 'navy' },
  { slug: 'womens-beauty', name: "Women's Beauty", description: 'Beauty and wellness services delivered by local professionals.', icon: 'sparkles', tone: 'orchid' },
  { slug: 'healthcare-pharmacy', name: 'Healthcare & Pharmacy', description: 'Healthcare support and pharmacy essentials, subject to availability and applicable requirements.', icon: 'heart-pulse', tone: 'mint' },
  { slug: 'more-services', name: 'More Services', description: 'Additional local services and offerings across everyday needs.', icon: 'grid-2x2', tone: 'purple' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
