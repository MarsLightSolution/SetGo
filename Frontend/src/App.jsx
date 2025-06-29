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
import useUserProfile from './Hooks/useUserProfile'
import UserInfo from './Components/UserInfo/UserInfo'


function App() {
  return (
    <div >
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/phoneverify' element={<PhoneVerification/>}/>
        <Route path='/SMS' element={<SmsVerify/>}/>
        <Route path='/form' element={<Form/>}/>
        <Route path='/renewpassword' element={<RenewPassword/>}/>
        <Route path='/confirm' element={<Confirm/>}/>
        <Route path='/pverify' element={<PVerify/>}/>
        <Route path='/profile' element={<ProfileMgmt/>}/>
        <Route path='/accountsettings' element={<AccountSettings/>}/>
        <Route path='/paymentsettings' element={<PaymentSettings/>}/>
        <Route path='/dataprotection' element={<DataProtection/>}/>
        <Route path='/emailsettings' element={<EmailSettings/>}/>
        <Route path='/aboutclassifieds' element={<AboutClassifieds/>}/>
        <Route path='/newpassword' element={<NewPassword/>}/>
        <Route path='/emailnotify' element={<EmailNotification/>}/>
        <Route path='/userinfo' element={<UserInfo/>}/>
       
        
      </Routes>
    </div>
  )
}

export default App
