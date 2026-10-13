import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { PreferencesProvider } from './context/PreferencesContext'
import seoConfig from '../seo-routes.json'
import WhatsAppButton from './components/WhatsAppButton'

type PageMetadata = {
  title: string
  description: string
  canonicalPath?: string
  socialTitle?: string
  socialDescription?: string
}

const APP_COMING_SOON_ROUTES = new Set([
  '/booking',
  '/cart',
  '/checkout',
  '/orders',
  '/tracking',
  '/login',
  '/register',
  '/profile',
])

function metadataForPath(pathname: string): PageMetadata {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const metadata = Object.entries(seoConfig.routes).find(([route]) => route === normalizedPath)?.[1]
  if (metadata) return metadata

  if (
    APP_COMING_SOON_ROUTES.has(normalizedPath)
    || /^\/(?:service|services)\/[^/]+$/.test(normalizedPath)
  ) {
    return seoConfig.routes['/app-coming-soon']
  }

  if (/^\/(?:category|categories)\/[^/]+$/.test(normalizedPath)) {
    return {
      title: 'Local Category Preview | SAU SOLUTIONS',
      description: 'Explore a SAU SERVICES category preview. Listings are informational and do not confirm live providers, products, or service availability.',
      canonicalPath: `${normalizedPath}/`,
    }
  }

  return {
    title: 'Page Not Found | SAU SOLUTIONS',
    description: 'The requested page does not match a page on the SAU SOLUTIONS website.',
  }
}

function updateMetaContent(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function updatePageMetadata(metadata: PageMetadata) {
  document.title = metadata.title
  updateMetaContent('name', 'description', metadata.description)
  updateMetaContent('property', 'og:title', metadata.socialTitle ?? metadata.title)
  updateMetaContent('property', 'og:description', metadata.socialDescription ?? metadata.description)

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (metadata.canonicalPath) {
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = new URL(metadata.canonicalPath.replace(/^\//, ''), seoConfig.siteUrl).href
    updateMetaContent('property', 'og:url', canonical.href)
  } else {
    canonical?.remove()
    document.head.querySelector('meta[property="og:url"]')?.remove()
  }
}

const Home = lazy(() => import('./pages/Home'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryServices = lazy(() => import('./pages/CategoryServices'))
const About = lazy(() => import('./pages/About'))
const ServiceArea = lazy(() => import('./pages/ServiceArea'))
const AppComingSoon = lazy(() => import('./pages/AppComingSoon'))
const PartnerRegistration = lazy(() => import('./pages/PartnerRegistration'))
const Contact = lazy(() => import('./pages/Contact'))
const Careers = lazy(() => import('./pages/Careers'))
const WhatWeOffer = lazy(() => import('./pages/WhatWeOffer'))
const Products = lazy(() => import('./pages/Products'))

function PageLoading() {
  return <div className="page-loading" role="status" aria-label="Loading page"><span /><span /><span /></div>
}

function RouteContent() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    updatePageMetadata(metadataForPath(location.pathname))
  }, [location.pathname])

  return <AnimatePresence mode="wait" initial={false}>
    <motion.main
      key={location.pathname}
      className="route-motion"
      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.18, ease: 'easeOut' }}
    >
      <Suspense fallback={<PageLoading />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:categoryId" element={<CategoryServices />} />
          <Route path="/categories/:categorySlug" element={<CategoryServices />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/what-we-offer" element={<WhatWeOffer />} />
          <Route path="/products" element={<Products />} />
          <Route path="/service-area" element={<ServiceArea />} />
          <Route path="/app-coming-soon" element={<AppComingSoon />} />
          <Route path="/service/:serviceId" element={<AppComingSoon />} />
          <Route path="/services/:serviceId" element={<AppComingSoon />} />
          <Route path="/booking" element={<AppComingSoon />} />
          <Route path="/cart" element={<AppComingSoon />} />
          <Route path="/checkout" element={<AppComingSoon />} />
          <Route path="/orders" element={<AppComingSoon />} />
          <Route path="/tracking" element={<AppComingSoon />} />
          <Route path="/login" element={<AppComingSoon />} />
          <Route path="/register" element={<AppComingSoon />} />
          <Route path="/profile" element={<AppComingSoon />} />
          <Route path="/partner/register" element={<PartnerRegistration />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<AppComingSoon notFound />} />
        </Routes>
      </Suspense>
    </motion.main>
  </AnimatePresence>
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PreferencesProvider>
        <div className="app-shell flex min-h-screen">
          <Navbar />
          <div className="app-content"><RouteContent /><Footer /></div>
          <WhatsAppButton />
        </div>
      </PreferencesProvider>
    </BrowserRouter>
  )
}

export default App
