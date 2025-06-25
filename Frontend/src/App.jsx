import { useState } from 'react'
import { Routes,Route } from 'react-router-dom'
import './App.css'
import Footer from './components/common/Footer'
import Register from './pages/Register'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import Login from './pages/Login'
import Postcard1 from './Components/Pop-ups/Postcard1'
import PhoneVerification from './Components/Pop-ups/PhoneVerification'
import SmsVerify from './Components/Pop-ups/SmsVerify'
import RenewPassword from "./Components/Pop-ups/RenewPassword"
import PVerify from './Components/Pop-ups/PVerify'
import ProfileMgmt from './Components/Pop-ups/ProfileMgmt'
import AccountSettings from './Components/Pop-ups/AccountSettings'
import PaymentSettings from './Components/Pop-ups/PaymentSettings'
import DataProtection from './Components/Pop-ups/DataProtection'
import EmailSettings from './Components/Pop-ups/EmailSettings'
import AboutClassifieds from './Components/Pop-ups/AboutClassifieds'
function App() {


  return (
    <div >
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/postcard1' element={<Postcard1/>}/>
        <Route path='/phoneverify' element={<PhoneVerification/>}/>
        <Route path='/SMS' element={<SmsVerify/>}/>
        <Route path='/form' element={<Form/>}/>
        <Route path='/renewpassword' element={<RenewPassword/>}/>
        <Route path='/pverify' element={<PVerify/>}/>
        <Route path='/profile' element={<ProfileMgmt/>}/>
        <Route path='/accountsettings' element={<AccountSettings/>}/>
        <Route path='/paymentsettings' element={<PaymentSettings/>}/>
        <Route path='/dataprotection' element={<DataProtection/>}/>
        <Route path='/emailsettings' element={<EmailSettings/>}/>
        <Route path='/aboutclassifieds' element={<AboutClassifieds/>}/>
      </Routes>
    </div>
  )
}

export default App
