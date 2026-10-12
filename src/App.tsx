import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { PreferencesProvider } from './context/PreferencesContext'

const Home = lazy(() => import('./pages/Home'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryServices = lazy(() => import('./pages/CategoryServices'))
const About = lazy(() => import('./pages/About'))
const ServiceArea = lazy(() => import('./pages/ServiceArea'))
const AppComingSoon = lazy(() => import('./pages/AppComingSoon'))
const PartnerRegistration = lazy(() => import('./pages/PartnerRegistration'))
const Contact = lazy(() => import('./pages/Contact'))

function PageLoading() {
  return <div className="page-loading" role="status" aria-label="Loading page"><span /><span /><span /></div>
}

function RouteContent() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

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
        <Navbar />
        <RouteContent />
        <Footer />
      </PreferencesProvider>
    </BrowserRouter>
  )
}

export default App
