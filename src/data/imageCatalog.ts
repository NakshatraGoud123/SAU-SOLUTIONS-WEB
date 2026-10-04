export interface PhotoCredit {
  name: string
  workUrl: string
  license: string
  licenseUrl: string
}

export interface MarketplacePhoto {
  src: string
  alt: string
  credit?: PhotoCredit
}

const categoryAssets = import.meta.glob<string>('../assets/categories/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const serviceAssets = import.meta.glob<string>('../assets/services/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const productAssets = import.meta.glob<string>('../assets/products/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})
const illustrationAssets = import.meta.glob<string>('../assets/illustrations/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

function findAsset(assets: Record<string, string>, path: string) {
  const asset = assets[path]
  if (!asset) throw new Error(`Missing local marketplace photo: ${path}`)
  return asset
}

function categoryPhoto(filename: string, alt: string): MarketplacePhoto {
  return { src: findAsset(categoryAssets, `../assets/categories/${filename}.webp`), alt }
}

function servicePhoto(filename: string, alt: string, credit?: PhotoCredit): MarketplacePhoto {
  const path = `../assets/services/${filename}.webp`
  return { src: findAsset(serviceAssets, path), alt, credit }
}

function productPhoto(filename: string, alt: string): MarketplacePhoto {
  return { src: findAsset(productAssets, `../assets/products/${filename}.webp`), alt }
}

export const heroPhoto: MarketplacePhoto = {
  src: findAsset(illustrationAssets, '../assets/illustrations/hero-everyday-life.webp'),
  alt: 'A parent sharing a warm everyday moment with their young child outdoors.',
}

export const categoryPhotos: Record<string, MarketplacePhoto> = {
  'essential-supplies': categoryPhoto('essential-supplies', 'Fresh produce and everyday grocery essentials arranged in a market display.'),
  'home-services': categoryPhoto('home-services', 'A bright, cared-for modern home interior.'),
  'mechanic-services': categoryPhoto('mechanic-services', 'A mechanic working under the hood of a car in a workshop.'),
  'mobility-services': categoryPhoto('mobility-services', 'A row of modern cars ready for everyday travel.'),
  'residential-services': categoryPhoto('residential-services', 'A contemporary residential home with a welcoming exterior.'),
  'property-lifestyle': categoryPhoto('property-lifestyle', 'A thoughtfully furnished modern living room.'),
  'home-essentials': categoryPhoto('home-essentials', 'A modern home furnished with a comfortable green sofa.'),
  'food-beverages': categoryPhoto('food-beverages', 'A freshly prepared meal served at a table.'),
  education: categoryPhoto('education', 'A teacher working with students in a classroom.'),
  'business-professional': categoryPhoto('business-professional', 'A modern professional office with shared work areas.'),
  'home-lifestyle': categoryPhoto('home-lifestyle', 'A light-filled home interior with natural materials.'),
  'tech-services': categoryPhoto('tech-services', 'A technician inspecting and working on precision electronics.'),
  'mens-grooming': categoryPhoto('mens-grooming', 'A barber providing a grooming service to a customer.'),
  'womens-beauty': categoryPhoto('womens-beauty', 'A clean, modern beauty salon ready for clients.'),
  'healthcare-pharmacy': categoryPhoto('healthcare-pharmacy', 'A healthcare professional in a clinical setting.'),
  'more-services': categoryPhoto('more-services', 'Colleagues collaborating at a shared workspace.'),
}

const bikeMechanicCredit: PhotoCredit = {
  name: 'Johnragai-Moment Catcher',
  workUrl: 'https://www.flickr.com/photos/40642065@N06/7114316299',
  license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
}
const pestControlCredit: PhotoCredit = {
  name: 'Wonderlane',
  workUrl: 'https://www.flickr.com/photos/71401718@N00/5689118560',
  license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
}
const movingCredit: PhotoCredit = {
  name: 'Joanna Bourne',
  workUrl: 'https://www.flickr.com/photos/66992990@N00/6532911971',
  license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
}

export const servicePhotos: Record<string, MarketplacePhoto> = {
  'daily-grocery-box': productPhoto('daily-grocery-box', 'Shelves of fresh vegetables and grocery produce.'),
  'drinking-water': productPhoto('drinking-water', 'A reusable green drinking-water bottle photographed on a clean background.'),
  'home-cleaning': servicePhoto('home-cleaning', 'A professional cleaner washing a large window at home.'),
  electrician: servicePhoto('electrician', 'An electrician safely working on a wall switchboard.'),
  plumber: servicePhoto('plumber', 'A plumber inspecting exposed household pipework.'),
  'car-service': servicePhoto('car-service', 'A mechanic working beneath the open hood of a vehicle.'),
  'bike-repair': servicePhoto('bike-repair', 'A motorcycle mechanic repairing a bike in a busy workshop.', bikeMechanicCredit),
  'city-ride': servicePhoto('city-ride', 'A driver holding the steering wheel during a city drive.'),
  'airport-transfer': servicePhoto('airport-transfer', 'An airplane wing in flight, representing airport travel.'),
  'home-sanitisation': servicePhoto('home-sanitisation', 'Gloved hands ready for a careful sanitisation service.'),
  'pest-control': servicePhoto('pest-control', 'A pest-control technician equipped for a home treatment.', pestControlCredit),
  'property-consult': servicePhoto('property-consult', 'A miniature home and keys representing property advice.'),
  'moving-help': servicePhoto('moving-help', 'Packed moving boxes stacked safely inside a home.', movingCredit),
  'home-organiser': productPhoto('home-organiser', 'A tidy home storage cabinet and organisation space.'),
  'stationery-set': productPhoto('stationery-set', 'A hand writing in a notebook with a pen.'),
  'fresh-meal': productPhoto('fresh-meal', 'A freshly prepared lunch bowl with vegetables and grains.'),
  'coffee-break': productPhoto('coffee-break', 'Freshly served coffee at a cafe table.'),
  'math-tutor': servicePhoto('math-tutor', 'A student studying among books in a learning space.'),
  'language-lessons': servicePhoto('language-lessons', 'A teacher leading a lively classroom lesson.'),
  'tax-consult': servicePhoto('tax-consult', 'Financial documents and a calculator arranged for a tax consultation.'),
  'design-consult': servicePhoto('design-consult', 'A modern office space for a creative consultation.'),
  'laundry-care': servicePhoto('laundry-care', 'Freshly folded laundry ready for collection.'),
  'plant-care': servicePhoto('plant-care', 'Hands tending soil and a small houseplant.'),
  'device-setup': servicePhoto('device-setup', 'A technician examining electronics with precision equipment.'),
  'wifi-help': servicePhoto('wifi-help', 'A wireless router set up for a home connection.'),
  'mens-haircut': servicePhoto('mens-haircut', 'A barber providing a haircut and grooming service.'),
  'mens-grooming': productPhoto('mens-grooming', "A set of men's grooming and personal-care products."),
  'beauty-at-home': servicePhoto('beauty-at-home', 'A beauty professional providing a facial treatment to a client.'),
  'wellness-session': servicePhoto('wellness-session', 'A therapist giving a relaxing hand massage.'),
  'pharmacy-essentials': productPhoto('pharmacy-essentials', 'Everyday pharmacy essentials including tablets and medical products.'),
  'nurse-visit': servicePhoto('nurse-visit', 'A nurse in a white coat ready to provide patient care.'),
  'event-help': servicePhoto('event-help', 'A professionally arranged event dining table with fresh flowers.'),
  'pet-care': servicePhoto('pet-care', 'Two happy dogs running together outdoors.'),
}
