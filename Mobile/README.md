# SetGo Mobile App

A React Native mobile application built with Expo for the SetGo marketplace platform.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
```

### 3. Run the App

**Start Development Server:**
```bash
npm start
```

**Run on Android:**
```bash
npm run android
```

**Run on iOS (macOS only):**
```bash
npm run ios
```

**Run on Web:**
```bash
npm run web
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint |

## Project Structure

```
Mobile/
├── app/                    # Expo Router screens
│   ├── _layout.jsx         # Root layout with navigation
│   ├── index.jsx           # Home screen
│   ├── auth.jsx            # Authentication screen
│   ├── product/[id].jsx    # Product detail screen
│   ├── order/[orderId].jsx # Order detail screen
│   └── ...
├── Components/             # Reusable components
│   ├── PaymentDialog.jsx   # Payment modal
│   ├── ErrorBoundary.jsx   # Error handling
│   └── ...
├── Store/                  # State management (Zustand/Redux)
│   ├── authStore.js        # Authentication state
│   └── store.js            # Redux store
├── services/               # API and services
│   ├── api.js              # Axios configuration
│   └── secureAuthService.js # Secure token storage
├── utils/                  # Utility functions
│   ├── logger.js           # Development logging
│   └── validation.js       # Input validation
└── context/                # React contexts
```

## Features

- User authentication (login/signup)
- Product browsing and search
- Shopping cart and checkout
- Wallet payments
- Order management
- User profile management

## Tech Stack

- **Framework:** React Native with Expo SDK 53
- **Navigation:** Expo Router
- **State Management:** Zustand + Redux Toolkit
- **Styling:** React Native StyleSheet
- **HTTP Client:** Axios
- **Secure Storage:** expo-secure-store

## Development Notes

- Logs are only visible in development mode (`__DEV__`)
- Auth tokens are stored securely using expo-secure-store
- API URL must be configured via environment variable

## Troubleshooting

**Metro bundler issues:**
```bash
npx expo start --clear
```

**Dependency issues:**
```bash
rm -rf node_modules
npm install
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**iOS pod issues (macOS):**
```bash
cd ios && pod install && cd ..
```
