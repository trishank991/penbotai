# ScholarSync Mobile App

React Native mobile app for ScholarSync - Ethical AI Learning Assistant.

## Features

- **AI Disclosure Generator**: Generate professional AI usage statements
- **Prompt Coach**: Get feedback on your AI prompts with scoring
- **Research Assistant**: Search 200M+ academic papers
- **Profile Management**: Manage your account and subscription

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **Supabase** for authentication and database
- **Expo SecureStore** for secure token storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "supabaseUrl": "YOUR_SUPABASE_URL",
         "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY",
         "apiUrl": "https://scholarsync.app/api"
       }
     }
   }
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
mobile-app/
├── App.tsx                 # App entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── assets/                # Images and icons
└── src/
    ├── components/        # Reusable UI components
    ├── hooks/             # Custom React hooks
    │   └── useAuth.tsx    # Authentication hook
    ├── navigation/        # Navigation configuration
    │   └── RootNavigator.tsx
    ├── screens/           # Screen components
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── SignUpScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── DisclosureScreen.tsx
    │   ├── PromptCoachScreen.tsx
    │   ├── ResearchScreen.tsx
    │   └── ProfileScreen.tsx
    ├── services/          # API and external services
    │   └── supabase.ts
    ├── styles/            # Shared styles
    └── utils/             # Utility functions
```

## Building for Production

### iOS

```bash
expo build:ios
# or with EAS Build
eas build --platform ios
```

### Android

```bash
expo build:android
# or with EAS Build
eas build --platform android
```

## App Store Submission

1. Configure app store metadata in `app.json`
2. Generate app icons and splash screens
3. Build production binaries
4. Submit to App Store Connect (iOS) or Google Play Console (Android)

## API Endpoints Used

The mobile app connects to the ScholarSync web API:

- `POST /api/disclosure` - Generate AI disclosure statements
- `POST /api/prompt-coach` - Analyze prompts
- External: Semantic Scholar API for research

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## License

MIT License - see LICENSE file for details
