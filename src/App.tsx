import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import './App.css'
import { CommerceProvider } from './context/CommerceContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { PreferencesProvider } from './context/PreferencesContext'

const Home = lazy(() => import('./pages/Home'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryServices = lazy(() => import('./pages/CategoryServices'))
const ServiceDetails = lazy(() => import('./pages/ServiceDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Booking = lazy(() => import('./pages/Booking'))
const Orders = lazy(() => import('./pages/Orders'))
const Tracking = lazy(() => import('./pages/Tracking'))
const Auth = lazy(() => import('./pages/Auth'))
const Profile = lazy(() => import('./pages/Profile'))
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
          <Route path="/service/:serviceId" element={<ServiceDetails />} />
          <Route path="/services/:serviceId" element={<ServiceDetails />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/partner/register" element={<PartnerRegistration />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Categories />} />
        </Routes>
      </Suspense>
    </motion.main>
  </AnimatePresence>
}

function App() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <CommerceProvider>
          <Navbar />
          <RouteContent />
          <Footer />
        </CommerceProvider>
      </PreferencesProvider>
    </BrowserRouter>
  )
}

export default App
