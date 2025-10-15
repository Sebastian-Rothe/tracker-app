# 🔥 Routine Tracker

A modern Android habit tracking app built with Expo, React Native & TypeScript. Privacy-first design with local storage, streak tracking, and smart notifications.

## ✨ Features

- **Multiple Routines**: Create and manage unlimited daily habits
- **Streak Tracking**: Build impressive chains and visualize your progress
- **Smart Notifications**: Personalized reminders at the perfect time
- **Analytics Dashboard**: Detailed statistics, trends, and progress insights
- **Achievement System**: Unlock achievements and celebrate milestones
- **Privacy-First**: 100% local data storage, no cloud sync required
- **Dark/Light Theme**: Automatic theme switching support
- **Offline-First**: Works completely without internet connection

## 🚀 Installation

### Prerequisites
- Node.js (18+)
- Expo CLI (`npm install -g @expo/cli`)
- Android device or emulator

### Development Setup
```bash
# Clone repository
git clone https://github.com/Sebastian-Rothe/tracker-app.git
cd tracker-app

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run tests
npm test
```

## 📱 Usage

1. **Setup**: Grant notification permissions on first launch
2. **Create Routines**: Add your daily habits with custom names and categories
3. **Track Progress**: Mark routines as complete with simple tap interactions
4. **Build Streaks**: Watch your consistency grow day by day
5. **Analyze Data**: Review detailed statistics and progress trends
6. **Earn Achievements**: Unlock rewards for reaching milestones

## 🛠️ Tech Stack

- **Expo SDK 54** for cross-platform development
- **React Native 0.81.4** with **React 19.1.0**
- **TypeScript 5.9.2** for type safety
- **Expo Router 6** for file-based navigation
- **AsyncStorage** for local data persistence
- **Jest & React Native Testing Library** for testing
- **EAS Build** for cloud building and distribution

## 📁 Project Structure

```
tracker-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/              # React contexts (Theme, Achievement)
├── hooks/                 # Custom React hooks
├── services/              # Business logic and storage
├── utils/                 # Helper functions and managers
├── types/                 # TypeScript definitions
├── __tests__/             # Test files
└── assets/                # Images, fonts, and static assets
```

## 📦 Build & Distribution

### Android Production Build
```bash
# Build APK for testing
eas build -p android --profile preview

# Build App Bundle for Play Store
eas build -p android --profile production
```

### iOS (Planned)
```bash
# Coming soon
eas build -p ios --profile production
```

## 🔧 Configuration

- **Bundle ID**: `com.routinetracker.app`
- **Minimum Android**: API Level 26 (Android 8.0+)
- **Notification Scheduling**: Configurable reminder times
- **Data Export**: JSON format for personal backups
- **Theme**: System-based automatic switching

## 🎯 Key Highlights

- **No Ads**: Completely ad-free experience
- **No In-App Purchases**: All features included
- **No Data Collection**: Privacy-respecting design
- **Offline Capable**: Works without internet
- **Lightweight**: Minimal storage footprint
- **Fast Performance**: Optimized for smooth user experience

## 👨‍� Development

### Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Environment Configuration
For development with faster notifications:
```typescript
// In utils/notificationManager.ts
// Change notification interval for testing
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related

- [Landing Page](../tracker-app-webpage/) - Responsive website showcasing the app
- [Privacy Policy](../tracker-app-webpage/datenschutz.html) - Data protection information

---

**Made with ❤️ for building better habits**