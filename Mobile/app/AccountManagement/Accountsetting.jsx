import React, { useState } from 'react';
import { User, CreditCard, Shield, Mail, Heart, ChevronRight, Eye, Settings, ChevronLeft, Lock, Phone, MapPin, Bell } from 'lucide-react';

export default function MobileSettingsApp() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState(1);
  
  const [phoneData, setPhoneData] = useState({ countryCode: '+91', phoneNumber: '', otp: '' });
  const [emailData, setEmailData] = useState({ currentEmail: 'tiwariraj1202@gmail.com', newEmail: '', repeatEmail: '', password: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addressData, setAddressData] = useState({ firstName: '', lastName: '', addressSuffix: '', street: '', houseNumber: '', postalCode: '', location: '' });
  const [billingAddress, setBillingAddress] = useState({ firstName: '', lastName: '', addressSuffix: '', street: '', houseNumber: '', postalCode: '', location: '' });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigateTo = (screen) => setCurrentScreen(screen);
  const goBack = () => setCurrentScreen('menu');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu': return <MenuScreen navigateTo={navigateTo} />;
      case 'profile': return <ProfileScreen goBack={goBack} setShowAddressModal={setShowAddressModal} />;
      case 'account': return <AccountScreen goBack={goBack} setShowPhoneModal={setShowPhoneModal} setShowEmailModal={setShowEmailModal} setShowPasswordModal={setShowPasswordModal} setShowBillingModal={setShowBillingModal} />;
      case 'payments': return <PaymentsScreen goBack={goBack} />;
      case 'data': return <DataProtectionScreen goBack={goBack} />;
      case 'emails': return <EmailsScreen goBack={goBack} />;
      case 'classified': return <ClassifiedAdsScreen goBack={goBack} />;
      default: return <MenuScreen navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="app-container">
      <Style />
      {renderScreen()}
      
      {showPhoneModal && <PhoneModal phoneData={phoneData} setPhoneData={setPhoneData} phoneStep={phoneStep} setPhoneStep={setPhoneStep} onClose={() => { setShowPhoneModal(false); setPhoneStep(1); }} />}
      {showEmailModal && <EmailModal emailData={emailData} setEmailData={setEmailData} showPassword={showPassword} setShowPassword={setShowPassword} onClose={() => setShowEmailModal(false)} />}
      {showPasswordModal && <PasswordModal passwordData={passwordData} setPasswordData={setPasswordData} showCurrentPassword={showCurrentPassword} setShowCurrentPassword={setShowCurrentPassword} showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} onClose={() => setShowPasswordModal(false)} />}
      {showAddressModal && <AddressModal title="Edit delivery address" addressData={addressData} setAddressData={setAddressData} onClose={() => setShowAddressModal(false)} />}
      {showBillingModal && <AddressModal title="Edit billing address" addressData={billingAddress} setAddressData={setBillingAddress} onClose={() => setShowBillingModal(false)} />}
    </div>
  );
}

const MenuScreen = ({ navigateTo }) => {
  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile information', desc: 'Manage your personal details', color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'account', icon: Settings, label: 'Account settings', desc: 'Email, password & security', color: '#6B7280', bg: '#F9FAFB' },
    { id: 'payments', icon: CreditCard, label: 'Payments', desc: 'Payout accounts & billing', color: '#3B82F6', bg: '#EFF6FF' },
    { id: 'data', icon: Shield, label: 'Data protection', desc: 'Privacy & data settings', color: '#10B981', bg: '#ECFDF5' },
    { id: 'emails', icon: Mail, label: 'Email preferences', desc: 'Notifications & updates', color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'classified', icon: Heart, label: 'Classified Ads', desc: 'About this feature', color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="screen">
      <div className="header-gradient">
        <div className="header-content">
          <button className="icon-button" onClick={() => navigateTo('../app/profile')}>
            <ChevronLeft size={24} color="#fff" strokeWidth={2.5} />
          </button>
          <div className="header-title-wrap">
            <h1 className="header-title">Settings</h1>
            <p className="header-subtitle">Manage your preferences</p>
          </div>
        </div>
      </div>
      
      <div className="content-scroll">
        <div className="menu-grid">
          {menuItems.map((item) => (
            <button key={item.id} className="menu-card" onClick={() => navigateTo(item.id)}>
              <div className="menu-card-icon" style={{ backgroundColor: item.bg }}>
                <item.icon size={24} color={item.color} strokeWidth={2} />
              </div>
              <div className="menu-card-content">
                <h3 className="menu-card-title">{item.label}</h3>
                <p className="menu-card-desc">{item.desc}</p>
              </div>
              <ChevronRight size={20} color="#D1D5DB" strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ goBack, setShowAddressModal }) => (
  <div className="screen">
    <ScreenHeader title="Profile" subtitle="Your personal information" onBack={goBack} />
    <div className="content-scroll">
      <div className="info-card">
        <div className="info-card-header">
          <User size={20} color="#6B7280" />
          <span className="info-card-label">Profile name</span>
        </div>
        <p className="info-card-value">OscorTech</p>
      </div>

      <div className="info-card">
        <div className="info-card-header">
          <MapPin size={20} color="#6B7280" />
          <span className="info-card-label">Delivery address</span>
        </div>
        <div className="info-card-row">
          <p className="info-card-value">Not set</p>
          <button className="btn-link" onClick={() => setShowAddressModal(true)}>Edit</button>
        </div>
      </div>
    </div>
  </div>
);

const AccountScreen = ({ goBack, setShowPhoneModal, setShowEmailModal, setShowPasswordModal, setShowBillingModal }) => (
  <div className="screen">
    <ScreenHeader title="Account" subtitle="Security & authentication" onBack={goBack} />
    <div className="content-scroll">
      <div className="section-label">Security</div>
      
      <div className="info-card">
        <div className="info-card-header">
          <Phone size={20} color="#6B7280" />
          <span className="info-card-label">Phone verification</span>
        </div>
        <button className="btn-link" onClick={() => setShowPhoneModal(true)}>Add number</button>
      </div>

      <div className="info-card">
        <div className="info-card-header">
          <Mail size={20} color="#6B7280" />
          <span className="info-card-label">Email address</span>
        </div>
        <div className="info-card-row">
          <p className="info-card-value">tiwariraj1202@gmail.com</p>
          <button className="btn-link" onClick={() => setShowEmailModal(true)}>Change</button>
        </div>
      </div>

      <div className="info-card">
        <div className="info-card-header">
          <Lock size={20} color="#6B7280" />
          <span className="info-card-label">Password</span>
        </div>
        <div className="info-card-row">
          <p className="info-card-value">••••••••</p>
          <button className="btn-link" onClick={() => setShowPasswordModal(true)}>Change</button>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: '24px' }}>Activity</div>
      <div className="activity-badge">
        <Bell size={18} color="#10B981" />
        <span className="activity-text">You have 4 active ads</span>
      </div>

      <div className="section-label" style={{ marginTop: '24px' }}>Billing</div>
      <div className="info-card">
        <div className="info-card-header">
          <MapPin size={20} color="#6B7280" />
          <span className="info-card-label">Billing address</span>
        </div>
        <div className="info-card-row">
          <p className="info-card-value">Not set</p>
          <button className="btn-link" onClick={() => setShowBillingModal(true)}>Edit</button>
        </div>
      </div>

      <button className="btn-danger">Delete account</button>
    </div>
  </div>
);

const PaymentsScreen = ({ goBack }) => (
  <div className="screen">
    <ScreenHeader title="Payments" subtitle="Payment methods" onBack={goBack} />
    <div className="content-scroll">
      <div className="info-card">
        <div className="info-card-header">
          <CreditCard size={20} color="#6B7280" />
          <span className="info-card-label">Payout account</span>
        </div>
        <div className="info-card-row">
          <p className="info-card-value">•••• •••• •••• 1234</p>
          <button className="btn-link">Change</button>
        </div>
      </div>
    </div>
  </div>
);

const DataProtectionScreen = ({ goBack }) => (
  <div className="screen">
    <ScreenHeader title="Data Protection" subtitle="Privacy settings" onBack={goBack} />
    <div className="content-scroll">
      {['Privacy Settings & Analysis', 'Privacy Policy', 'Data Protection'].map((item, i) => (
        <button key={i} className="link-card">
          <Shield size={20} color="#10B981" />
          <span className="link-text">{item}</span>
          <ChevronRight size={20} color="#D1D5DB" />
        </button>
      ))}
    </div>
  </div>
);

const EmailsScreen = ({ goBack }) => {
  const [newsletter, setNewsletter] = useState(false);
  const [messages, setMessages] = useState(true);

  return (
    <div className="screen">
      <ScreenHeader title="Email Preferences" subtitle="Manage notifications" onBack={goBack} />
      <div className="content-scroll">
        <div className="toggle-card">
          <div className="toggle-content">
            <h4 className="toggle-title">Newsletter</h4>
            <p className="toggle-desc">Receive updates, tips, and promotions</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="toggle-card">
          <div className="toggle-content">
            <h4 className="toggle-title">User messages</h4>
            <p className="toggle-desc">Get notified when users message you</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={messages} onChange={(e) => setMessages(e.target.checked)} />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

const ClassifiedAdsScreen = ({ goBack }) => (
  <div className="screen">
    <ScreenHeader title="Classified Ads" subtitle="Information" onBack={goBack} />
    <div className="content-scroll">
      <div className="info-card">
        <p className="info-text">Learn about classified ads features and how to use them effectively.</p>
      </div>
    </div>
  </div>
);

const ScreenHeader = ({ title, subtitle, onBack }) => (
  <div className="screen-header-modern">
    <button className="icon-button-dark" onClick={onBack}>
      <ChevronLeft size={22} strokeWidth={2.5} />
    </button>
    <div className="screen-header-text">
      <h2 className="screen-title">{title}</h2>
      {subtitle && <p className="screen-subtitle">{subtitle}</p>}
    </div>
  </div>
);

const PhoneModal = ({ phoneData, setPhoneData, phoneStep, setPhoneStep, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-modern">
        <h3 className="modal-title-modern">{phoneStep === 1 ? 'Add Phone Number' : 'Verify OTP'}</h3>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body-modern">
        {phoneStep === 1 ? (
          <>
            <p className="modal-desc">We'll send you a verification code</p>
            <div className="input-group-horizontal">
              <select className="select-modern" value={phoneData.countryCode} onChange={(e) => setPhoneData({...phoneData, countryCode: e.target.value})}>
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <input className="input-modern flex-1" placeholder="Phone number" value={phoneData.phoneNumber} onChange={(e) => setPhoneData({...phoneData, phoneNumber: e.target.value})} />
            </div>
          </>
        ) : (
          <>
            <p className="modal-desc">Code sent to {phoneData.countryCode} {phoneData.phoneNumber}</p>
            <input className="input-modern otp-input-modern" placeholder="• • • • • •" maxLength="6" value={phoneData.otp} onChange={(e) => setPhoneData({...phoneData, otp: e.target.value})} />
            <button className="btn-text-link">Resend code</button>
          </>
        )}
      </div>
      <div className="modal-footer-modern">
        <button className="btn-secondary-modern" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modern" onClick={() => phoneStep === 1 ? setPhoneStep(2) : onClose()}>
          {phoneStep === 1 ? 'Send Code' : 'Verify'}
        </button>
      </div>
    </div>
  </div>
);

const EmailModal = ({ emailData, setEmailData, showPassword, setShowPassword, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-modern">
        <h3 className="modal-title-modern">Change Email</h3>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body-modern">
        <div className="alert-info">
          <Shield size={18} color="#3B82F6" />
          <p className="alert-text">You'll receive confirmation emails at both addresses</p>
        </div>
        <div className="input-group">
          <label className="label-modern">Current email</label>
          <input className="input-modern input-disabled" value={emailData.currentEmail} disabled />
        </div>
        <div className="input-group">
          <label className="label-modern">New email</label>
          <input className="input-modern" placeholder="Enter new email" value={emailData.newEmail} onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="label-modern">Confirm email</label>
          <input className="input-modern" placeholder="Confirm new email" value={emailData.repeatEmail} onChange={(e) => setEmailData({...emailData, repeatEmail: e.target.value})} />
        </div>
        <div className="input-group">
          <label className="label-modern">Password</label>
          <div className="input-with-icon">
            <input className="input-modern" type={showPassword ? "text" : "password"} placeholder="Enter password" value={emailData.password} onChange={(e) => setEmailData({...emailData, password: e.target.value})} />
            <button className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
              <Eye size={20} color="#9CA3AF" />
            </button>
          </div>
        </div>
      </div>
      <div className="modal-footer-modern">
        <button className="btn-secondary-modern" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modern">Save Changes</button>
      </div>
    </div>
  </div>
);

const PasswordModal = ({ passwordData, setPasswordData, showCurrentPassword, setShowCurrentPassword, showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-modern">
        <h3 className="modal-title-modern">Change Password</h3>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body-modern">
        <div className="input-group">
          <label className="label-modern">Current password</label>
          <div className="input-with-icon">
            <input className="input-modern" type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
            <button className="input-icon-btn" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Eye size={20} color="#9CA3AF" />
            </button>
          </div>
        </div>
        <div className="input-group">
          <label className="label-modern">New password</label>
          <div className="input-with-icon">
            <input className="input-modern" type={showNewPassword ? "text" : "password"} placeholder="Enter new password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
            <button className="input-icon-btn" onClick={() => setShowNewPassword(!showNewPassword)}>
              <Eye size={20} color="#9CA3AF" />
            </button>
          </div>
        </div>
        <div className="input-group">
          <label className="label-modern">Confirm password</label>
          <div className="input-with-icon">
            <input className="input-modern" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
            <button className="input-icon-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Eye size={20} color="#9CA3AF" />
            </button>
          </div>
        </div>
      </div>
      <div className="modal-footer-modern">
        <button className="btn-secondary-modern" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modern">Update Password</button>
      </div>
    </div>
  </div>
);

const AddressModal = ({ title, addressData, setAddressData, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header-modern">
        <h3 className="modal-title-modern">{title}</h3>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body-modern">
        <div className="input-group">
          <input className="input-modern" placeholder="First name *" value={addressData.firstName} onChange={(e) => setAddressData({...addressData, firstName: e.target.value})} />
        </div>
        <div className="input-group">
          <input className="input-modern" placeholder="Last name *" value={addressData.lastName} onChange={(e) => setAddressData({...addressData, lastName: e.target.value})} />
        </div>
        <div className="input-group">
          <input className="input-modern" placeholder="Address suffix" value={addressData.addressSuffix} onChange={(e) => setAddressData({...addressData, addressSuffix: e.target.value})} />
        </div>
        <div className="input-group-horizontal">
          <input className="input-modern flex-1" placeholder="Street *" value={addressData.street} onChange={(e) => setAddressData({...addressData, street: e.target.value})} />
          <input className="input-modern" style={{width: '120px'}} placeholder="No. *" value={addressData.houseNumber} onChange={(e) => setAddressData({...addressData, houseNumber: e.target.value})} />
        </div>
        <div className="input-group-horizontal">
          <input className="input-modern" style={{width: '140px'}} placeholder="Postal *" value={addressData.postalCode} onChange={(e) => setAddressData({...addressData, postalCode: e.target.value})} />
          <input className="input-modern flex-1" placeholder="Location *" value={addressData.location} onChange={(e) => setAddressData({...addressData, location: e.target.value})} />
        </div>
      </div>
      <div className="modal-footer-modern">
        <button className="btn-secondary-modern" onClick={onClose}>Cancel</button>
        <button className="btn-primary-modern">Save Address</button>
      </div>
    </div>
  </div>
);

const Style = () => <style>{`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html { width: 100%; height: 100%; overflow: hidden; }

  .app-container {
    width: 100vw;
    height: 100vh;
    background: #F8FAFC;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    overflow: hidden;
  }

  .screen {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #F8FAFC;
  }

  .header-gradient {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    padding: 16px 16px 24px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icon-button {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-button:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }

  .header-title-wrap {
    flex: 1;
  }

  .header-title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .header-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    margin: 2px 0 0;
  }

  .content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 24px;
  }

  .menu-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .menu-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fff;
    padding: 16px;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .menu-card:active {
    transform: scale(0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .menu-card-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .menu-card-content {
    flex: 1;
    text-align: left;
  }

  .menu-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1F2937;
    margin: 0 0 2px;
  }

  .menu-card-desc {
    font-size: 13px;
    color: #9CA3AF;
    margin: 0;
  }

  .screen-header-modern {
    background: #fff;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #F3F4F6;
  }

  .icon-button-dark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #F3F4F6;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-button-dark:active {
    background: #E5E7EB;
    transform: scale(0.95);
  }

  .screen-header-text {
    flex: 1;
  }

  .screen-title {
    font-size: 20px;
    font-weight: 700;
    color: #1F2937;
    margin: 0;
  }

  .screen-subtitle {
    font-size: 13px;
    color: #9CA3AF;
    margin: 2px 0 0;
  }

  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }

  .info-card {
    background: #fff;
    padding: 16px;
    border-radius: 14px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .info-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .info-card-label {
    font-size: 14px;
    font-weight: 500;
    color: #6B7280;
  }

  .info-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .info-card-value {
    font-size: 16px;
    font-weight: 500;
    color: #1F2937;
    margin: 0;
  }

  .btn-link {
    background: none;
    border: none;
    color: #10B981;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .btn-link:active {
    opacity: 0.7;
  }

  .activity-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ECFDF5;
    padding: 14px 16px;
    border-radius: 12px;
    margin-bottom: 10px;
  }

  .activity-text {
    font-size: 14px;
    font-weight: 500;
    color: #059669;
  }

  .btn-danger {
    background: #FEE2E2;
    color: #DC2626;
    border: none;
    padding: 14px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 20px;
    width: 100%;
    transition: all 0.2s;
  }

  .btn-danger:active {
    background: #FECACA;
    transform: scale(0.98);
  }

  .link-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    padding: 16px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    margin-bottom: 10px;
    width: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.2s;
  }

  .link-card:active {
    transform: scale(0.98);
  }

  .link-text {
    flex: 1;
    text-align: left;
    font-size: 15px;
    font-weight: 500;
    color: #1F2937;
  }

  .toggle-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fff;
    padding: 16px;
    border-radius: 14px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .toggle-content {
    flex: 1;
  }

  .toggle-title {
    font-size: 16px;
    font-weight: 600;
    color: #1F2937;
    margin: 0 0 4px;
  }

  .toggle-desc {
    font-size: 13px;
    color: #9CA3AF;
    margin: 0;
  }

  .switch {
    position: relative;
    width: 52px;
    height: 32px;
    flex-shrink: 0;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #E5E7EB;
    border-radius: 32px;
    transition: 0.3s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .switch input:checked + .slider {
    background: #10B981;
  }

  .switch input:checked + .slider:before {
    transform: translateX(20px);
  }

  .info-text {
    font-size: 15px;
    color: #6B7280;
    line-height: 1.6;
    margin: 0;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .modal-modern {
    background: #fff;
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
  }

  .modal-header-modern {
    padding: 20px 20px 16px;
    border-bottom: 1px solid #F3F4F6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title-modern {
    font-size: 20px;
    font-weight: 700;
    color: #1F2937;
    margin: 0;
  }

  .modal-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #F3F4F6;
    border: none;
    font-size: 28px;
    color: #6B7280;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modal-close-btn:active {
    background: #E5E7EB;
  }

  .modal-body-modern {
    padding: 20px;
  }

  .modal-desc {
    font-size: 14px;
    color: #6B7280;
    margin: 0 0 20px;
  }

  .alert-info {
    display: flex;
    gap: 10px;
    background: #EFF6FF;
    border-left: 3px solid #3B82F6;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .alert-text {
    font-size: 13px;
    color: #1E40AF;
    margin: 0;
    line-height: 1.5;
  }

  .input-group {
    margin-bottom: 16px;
  }

  .input-group-horizontal {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .flex-1 {
    flex: 1;
  }

  .label-modern {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .input-modern {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #E5E7EB;
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.2s;
    font-family: inherit;
    background: #fff;
  }

  .input-modern:focus {
    outline: none;
    border-color: #10B981;
    background: #F0FDF4;
  }

  .input-modern::placeholder {
    color: #9CA3AF;
  }

  .input-disabled {
    background: #F9FAFB;
    color: #9CA3AF;
    cursor: not-allowed;
  }

  .select-modern {
    padding: 14px 12px;
    border: 2px solid #E5E7EB;
    border-radius: 12px;
    font-size: 15px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .select-modern:focus {
    outline: none;
    border-color: #10B981;
  }

  .input-with-icon {
    position: relative;
  }

  .input-icon-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: opacity 0.2s;
  }

  .input-icon-btn:active {
    opacity: 0.6;
  }

  .otp-input-modern {
    text-align: center;
    font-size: 24px;
    letter-spacing: 12px;
    font-weight: 600;
  }

  .btn-text-link {
    background: none;
    border: none;
    color: #10B981;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 0;
    margin-top: 8px;
    width: 100%;
  }

  .btn-text-link:active {
    opacity: 0.7;
  }

  .modal-footer-modern {
    padding: 16px 20px 24px;
    display: flex;
    gap: 12px;
  }

  .btn-secondary-modern {
    flex: 1;
    padding: 14px;
    border: 2px solid #E5E7EB;
    background: #fff;
    color: #374151;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary-modern:active {
    background: #F9FAFB;
    transform: scale(0.98);
  }

  .btn-primary-modern {
    flex: 1;
    padding: 14px;
    border: none;
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: #fff;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-primary-modern:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }

  .content-scroll::-webkit-scrollbar {
    width: 0;
  }

  .modal-modern::-webkit-scrollbar {
    width: 0;
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }

  @media (min-width: 769px) {
    .app-container {
      max-width: 480px;
      margin: 0 auto;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    }

    .modal-backdrop {
      align-items: center;
    }

    .modal-modern {
      border-radius: 24px;
      max-height: 90vh;
    }
  }
`}</style>;