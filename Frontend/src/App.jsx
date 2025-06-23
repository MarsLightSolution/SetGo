import { useState } from 'react'
import { Routes,Route } from 'react-router-dom'
import './App.css'
import Footer from './components/common/Footer'
import Register from './pages/Register'
import Navbar from './components/common/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import Login from './pages/Login'
function App() {


  return (
    <div >
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
         <Route path='/form' element={<Form/>}/>
      </Routes>
    </div>
  )
}

export default App
