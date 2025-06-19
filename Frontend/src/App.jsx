import { useState } from 'react'
import { Routes,Route } from 'react-router-dom'
import './App.css'
import Footer from './components/common/Footer'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import RegisterForm from './pages/Register'
import Register from './pages/Register'
import Login from './pages/Login'
function App() {


  return (
    <div >
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </div>
  )
}

export default App
