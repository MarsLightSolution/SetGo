import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './App.css'
import NotificationProvider from './contexts/NotificationContext'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './Hooks/ProtectedRoute'
import PublicRoute from './Hooks/PublicRoute'
import ModernChatApp from './components/Chat/ModernChatApp'
import CheckoutPage from './components/Checkout/Checkout'
import MyOrders from './components/Order/MyOrders'
import OrderDetail from './components/Order/Orderdetail'
import SellerAdminDashboard from './components/Admin/SellerAdmin'
import AdminOrders from './components/Admin/Adminpanel'

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'))
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))
const Form = lazy(() => import('./pages/Form'))
const PhoneVerification = lazy(() => import('./components/common/PhoneVerification'))
const SmsVerify = lazy(() => import('./components/common/SmsVerification'))
const ProfileMgmt = lazy(() => import('./Components/Popups/ProfileMgmt'))
const AccountSettings = lazy(() => import('./Components/Popups/AccountSettings'))
const PaymentSettings = lazy(() => import('./Components/Popups/PaymentSettings'))
const DataProtection = lazy(() => import('./Components/Popups/DataProtection'))
const EmailSettings = lazy(() => import('./Components/Popups/EmailSettings'))
const AboutClassifieds = lazy(() => import('./Components/Popups/AboutClassifieds'))
const PVerify = lazy(() => import('./components/Popups/PVerify'))
const Confirm = lazy(() => import('./pages/Confirm'))
const NewPassword = lazy(() => import('./Components/Popups/NewPassword'))
const RenewPassword = lazy(() => import('./Components/Popups/RenewPassword'))
const EmailNotification = lazy(() => import('./Components/Popups/EmailNotification'))
const UserInfo = lazy(() => import('./components/UserInfo/UserInfo'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const ProductDetail = lazy(() => import('./pages/ProductDescription'))
const ChatApp = lazy(() => import('./components/Chat/chatapp'))
const UserPage = lazy(() => import('./pages/Userpage'))
const MySearch = lazy(() => import('./pages/MySearch'))
const EditForm = lazy(() => import('./components/UserInfo/EditForm'))
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'))
const Notifications = lazy(() => import('./pages/Notifications'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
  </div>
)
function App() {
  return (
    <NotificationProvider>
      <div>
        <Navbar/>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/register' element={<PublicRoute><Register/></PublicRoute>}/>
            <Route path='/login' element={<PublicRoute><Login/></PublicRoute>}/>
            <Route path='/phoneverify' element={<PhoneVerification/>}/>
            <Route path='/SMS' element={<SmsVerify/>}/>
            <Route path='/form' element={<ProtectedRoute><Form/></ProtectedRoute>}/>
            <Route path='/renewpassword' element={<RenewPassword/>}/>
            <Route path='/confirm' element={<Confirm/>}/>
            <Route path='/pverify' element={<PVerify/>}/>
            <Route path='/profile' element={<ProtectedRoute><ProfileMgmt/></ProtectedRoute>}/>
            <Route path='/accountsettings' element={<ProtectedRoute><AccountSettings/></ProtectedRoute>}/>
            <Route path='/paymentsettings' element={<ProtectedRoute><PaymentSettings/></ProtectedRoute>}/>
            <Route path='/dataprotection' element={<ProtectedRoute><DataProtection/></ProtectedRoute>}/>
            <Route path='/emailsettings' element={<ProtectedRoute><EmailSettings/></ProtectedRoute>}/>
            <Route path='/aboutclassifieds' element={<ProtectedRoute><AboutClassifieds/></ProtectedRoute>}/>
            <Route path='/newpassword' element={<NewPassword/>}/>
            <Route path='/emailnotify' element={<ProtectedRoute><EmailNotification/></ProtectedRoute>}/>
            <Route path='/watchlist' element={<ProtectedRoute><Wishlist/></ProtectedRoute>}/>
            <Route path='/product/:id' element={<ProductDetail/>}/>
            <Route path='products/product/:id' element={<ProductDetail/>}/>
            <Route path="/chat" element={<ModernChatApp/>}/>
            <Route path='/userinfo' element={<UserInfo/>}/>
            <Route path='/userpage' element={<UserPage/>}/>
            <Route path='/mysearch' element={<MySearch/>}/>
            <Route path='/editform/:id' element={<EditForm/>}/>
            <Route path="/my/transactions" element={<TransactionHistory />} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/checkout" element={<CheckoutPage/>}/>
            <Route path="/orders" element={<MyOrders/>} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/seller" element={<SellerAdminDashboard />}/>
            <Route path="/Adminpanel" element={<AdminOrders />}/>
          </Routes>
        </Suspense>
      </div>
    </NotificationProvider>
  )
}

export default App
