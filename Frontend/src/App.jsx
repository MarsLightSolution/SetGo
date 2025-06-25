import { Routes,Route } from 'react-router-dom'
import './App.css'
import Footer from './components/common/Footer'
import Register from './pages/Register'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import Login from './pages/Login'
import Postcard1 from './components/Popups/Postcard1'
import PhoneVerification from './components/Popups/PhoneVerification'
import SmsVerify from './components/Popups/SmsVerify'
import RenewPassword from "./components/Popups/RenewPassword"
import PVerify from './components/Popups/PVerify'
import Confirm from './pages/Confirm'
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
        <Route path='/confirm' element={<Confirm/>}/>
        <Route path='/pverify' element={<PVerify/>}/>
      </Routes>
    </div>
  )
}

export default App
