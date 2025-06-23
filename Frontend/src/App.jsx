import { useState } from 'react'
import { Routes,Route } from 'react-router-dom'
import './App.css'
import Footer from './components/common/Footer'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import Login from './pages/Login'
import Postcard1 from './Components/Pop-ups/Postcard1'
import PhoneVerification from './Components/Pop-ups/PhoneVerification'
import SmsVerify from './Components/Pop-ups/SmsVerify'
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
      </Routes>
    </div>
  )
}

export default App
