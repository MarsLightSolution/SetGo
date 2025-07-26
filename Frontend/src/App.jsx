// src/App.jsx - The DEFINITIVE version for CLEAN URLs

import React, { useEffect } from 'react';
// IMPORTANT: useParams and Outlet should NOT be imported here as they are not used in this routing strategy.
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import 'rc-slider/assets/index.css';

// Import your i18n configuration
import './i18n'; // This imports the i18n setup from Step 1
import { useTranslation } from 'react-i18next';

// --- Import all your pages and components ---
import Register from './pages/Register';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Form from './pages/Form';
import Login from './pages/Login';
import PhoneVerification from './Components/Popups/PhoneVerification';
import SmsVerify from './Components/Popups/SmsVerify';
import ProfileMgmt from './Components/Popups/ProfileMgmt';
import AccountSettings from './Components/Popups/AccountSettings';
import PaymentSettings from './Components/Popups/PaymentSettings';
import DataProtection from './Components/Popups/DataProtection';
import EmailSettings from './Components/Popups/EmailSettings';
import AboutClassifieds from './Components/Popups/AboutClassifieds';
import PVerify from './components/Popups/PVerify';
import Confirm from './pages/Confirm';
import NewPassword from './Components/Popups/NewPassword';
import RenewPassword from './Components/Popups/RenewPassword';
import EmailNotification from './Components/Popups/EmailNotification';
import UserInfo from './components/UserInfo/UserInfo';
import Wishlist from './pages/Wishlist';
import ProductDetail from './pages/ProductDescription';
import ChatApp from './components/Chat/chatapp';
import ProtectedRoute from './Hooks/ProtectedRoute';
import PublicRoute from './Hooks/PublicRoute';
import UserPage from './pages/Userpage';
import MySearch from './pages/MySearch';
import EditForm from './components/UserInfo/EditForm';
import TransactionHistory from './pages/TransactionHistory';
import setupAutoTokenRefresh from './Hooks/accesstoken.js';
// --- END Imports ---

// HomeRedirect and LanguageWrapper components are NOT part of this strategy.
// VERIFY THESE COMPONENTS ARE DELETED FROM YOUR App.jsx FILE.


function App() {
  const { i18n } = useTranslation(); // For content language
  const navigate = useNavigate(); // For routing

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      setupAutoTokenRefresh();
    }
    // This useEffect should contain NO URL manipulation or language-specific redirects.
    // It runs once on component mount.
  }, []);


  // This function is passed to Navbar. It changes i18next's language only.
  // It DOES NOT manipulate the URL.
  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    // React components using useTranslation() will re-render with the new language.
  };


  return (
    <div>
      {/* Navbar receives the changeLanguage function and the current active language */}
      <Navbar
        onLanguageChange={changeLanguage}
        currentLanguage={i18n.language}
      />
      <Routes>
        {/* All routes are flat, without any language prefixes in the URL */}

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
        {/* Product Detail routes - simple, flat paths */}
        <Route path='/product/:id' element={<ProductDetail/>}/>
        <Route path='products/product/:id' element={<ProductDetail/>}/>
        <Route path="/chat" element={<ChatApp/>}/>
        <Route path='/userinfo' element={<UserInfo/>}/>
        <Route path='/userpage' element={<UserPage/>}/>
        <Route path='/mysearch' element={<MySearch/>}/>
        <Route path='/editform/:id' element={<EditForm/>}/>
        <Route path="/my/transactions" element={<TransactionHistory />} />

        {/* Catch-all route for any paths that don't match */}
        <Route path="*" element={<div>404: Page Not Found.</div>} />
      </Routes>
    </div>
  );
}

export default App;