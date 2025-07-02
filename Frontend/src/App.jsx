import { Routes,Route } from 'react-router-dom'
import './App.css'
import Register from './pages/Register'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import Login from './pages/Login'
import PhoneVerification from './Components/Popups/PhoneVerification'
import SmsVerify from './Components/Popups/SmsVerify'
import ProfileMgmt from './Components/Popups/ProfileMgmt'
import AccountSettings from './Components/Popups/AccountSettings'
import PaymentSettings from './Components/Popups/PaymentSettings'
import DataProtection from './Components/Popups/DataProtection'
import EmailSettings from './Components/Popups/EmailSettings'
import AboutClassifieds from './Components/Popups/AboutClassifieds'
import PVerify from './components/Popups/PVerify'
import Confirm from './pages/Confirm'
import NewPassword from './Components/Popups/NewPassword'
import RenewPassword from './Components/Popups/RenewPassword'
import EmailNotification from './Components/Popups/EmailNotification'
import UserInfo from './Components/UserInfo/UserInfo'
import Wishlist from './pages/Wishlist'
import ProductDetail from './pages/ProductDescription'
import ProtectedRoute from './Hooks/ProtectedRoute'
import PublicRoute from './Hooks/PublicRoute'
function App() {
  return (
    <div >
      <Navbar/>
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
        <Route path='/newpassword' element={<ProtectedRoute><NewPassword/></ProtectedRoute>}/>
        <Route path='/emailnotify' element={<ProtectedRoute><EmailNotification/></ProtectedRoute>}/>
        <Route path='/wishlist' element={<ProtectedRoute><Wishlist/></ProtectedRoute>}/>
        <Route path='/product/:id' element={<ProductDetail/>}/>
        <Route path='products/product/:id' element={<ProductDetail/>}/>
      </Routes>
    </div>
  )
}

export default App
