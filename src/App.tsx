import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { CommerceProvider } from './context/CommerceContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

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

function PageLoading() {
  return <div className="page-loading" role="status" aria-label="Loading page"><span /><span /><span /></div>
}

function App() {
  return (
    <BrowserRouter>
      <CommerceProvider>
        <Navbar />
        <main>
          <Suspense fallback={<PageLoading />}>
            <Routes>
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
              <Route path="*" element={<Categories />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </CommerceProvider>
    </BrowserRouter>
  )
}

export default App
