export interface Category {
  slug: string
  name: string
  description: string
  icon: string
  tone: string
}

export const categories: Category[] = [
  { slug: 'essential-supplies', name: 'Essential Supplies', description: 'Everyday must-haves, delivered to your door.', icon: 'shopping-basket', tone: 'blue' },
  { slug: 'home-services', name: 'Home Services', description: 'Trusted help for all the little things at home.', icon: 'house', tone: 'violet' },
  { slug: 'mechanic-services', name: 'Mechanic Services', description: 'Expert care for your car, bike and more.', icon: 'wrench', tone: 'amber' },
  { slug: 'mobility-services', name: 'Mobility Services', description: 'Get there comfortably, whenever you need.', icon: 'car-front', tone: 'cyan' },
  { slug: 'residential-services', name: 'Residential Services', description: 'Reliable support for the place you call home.', icon: 'building-2', tone: 'green' },
  { slug: 'property-lifestyle', name: 'Property & Lifestyle', description: 'Make more of your space and your time.', icon: 'key-round', tone: 'rose' },
  { slug: 'home-essentials', name: 'Home Essentials', description: 'Thoughtful finds for a home that works.', icon: 'lamp', tone: 'orange' },
  { slug: 'food-beverages', name: 'Food & Beverages', description: 'Good food and drinks for every kind of day.', icon: 'coffee', tone: 'red' },
  { slug: 'education', name: 'Education', description: 'Learn something new, at your own pace.', icon: 'graduation-cap', tone: 'indigo' },
  { slug: 'business-professional', name: 'Business & Professional', description: 'Skilled people to help your business thrive.', icon: 'briefcase-business', tone: 'slate' },
  { slug: 'home-lifestyle', name: 'Home & Lifestyle', description: 'Little upgrades for life at home.', icon: 'sofa', tone: 'pink' },
  { slug: 'tech-services', name: 'Tech Services', description: 'Friendly tech help, minus the jargon.', icon: 'laptop', tone: 'sky' },
  { slug: 'mens-grooming', name: "Men's Grooming", description: 'Feel your best, with a little time for you.', icon: 'scissors', tone: 'navy' },
  { slug: 'womens-beauty', name: "Women's Beauty", description: 'Feel-good beauty and wellness, on your terms.', icon: 'sparkles', tone: 'orchid' },
  { slug: 'healthcare-pharmacy', name: 'Healthcare & Pharmacy', description: 'Everyday care and essentials, made simpler.', icon: 'heart-pulse', tone: 'mint' },
  { slug: 'more-services', name: 'More Services', description: 'There is always something more to discover.', icon: 'grid-2x2', tone: 'purple' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
