import Toast from 'react-native-toast-message';

const showSuccessToast = (message, duration = 3000) => {
  console.log('✅ showSuccessToast called:', message);
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
  });
};

const showErrorToast = (message, duration = 3000) => {
  console.log('❌ showErrorToast called:', message);
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
  });
};

const showWarningToast = (message, duration = 3000) => {
  console.log('⚠️ showWarningToast called:', message);
  Toast.show({
    type: 'info',
    text1: 'Warning',
    text2: message,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
  });
};

const showInfoToast = (message, duration = 3000) => {
  console.log('ℹ️ showInfoToast called:', message);
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    topOffset: 50,
  });
};

export { showSuccessToast, showErrorToast, showWarningToast, showInfoToast };