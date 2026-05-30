# Family Hub – iOS App

A native iOS app built with **SwiftUI** that mirrors all features of the Family Hub web application.

## Requirements

| Tool | Version |
|------|---------|
| Xcode | 15.0+ |
| iOS Deployment Target | 17.0+ |
| Swift | 5.9+ |

## Project Structure

```
src/ios/
├── FamilyHub.xcodeproj/      ← Xcode project
└── FamilyHub/
    ├── FamilyHubApp.swift    ← App entry point
    ├── Config.swift          ← API base URL
    ├── Models/               ← Codable data models
    ├── Networking/           ← APIClient + per-domain API extensions
    ├── ViewModels/           ← @MainActor ObservableObject view models
    ├── Views/
    │   ├── Auth/             ← Login / Register screen
    │   ├── Dashboard/        ← Home screen with stats
    │   ├── Family/           ← Family management
    │   ├── Todos/            ← Todo list with filters & swipe actions
    │   ├── Calendar/         ← Personal + family calendar
    │   ├── Main/             ← TabView shell
    │   └── Common/           ← DesignSystem, extensions, reusable components
    ├── Resources/
    │   └── Assets.xcassets/  ← App icon, accent colour
    └── Info.plist
```

## Features

| Screen | Features |
|--------|---------|
| **Auth** | Login, Registration, animated toggle, form validation |
| **Dashboard** | Greeting, stat cards, pending todos preview, pull-to-refresh |
| **Familie** | Multi-family selector, member list, invite by e-mail, create family |
| **Aufgaben** | Filter (All / Open / Done), swipe-to-toggle, assign to member, due date picker |
| **Kalender** | Personal events (create / delete), Family calendar, member visibility toggle |
| **Settings** | Profile info, API URL, sign out |

## Architecture

- **MVVM** — `@MainActor ObservableObject` view models, `@EnvironmentObject` for dependency injection
- **Networking** — `URLSession` with `async/await`, JWT stored in **Keychain**, custom ISO 8601 date decoder
- **Persistence** — JWT token + user profile in Keychain, survives app restarts
- **Design** — Dark auth screen with gradient + ambient blobs, light/dark adaptive cards, custom button styles, `UserAvatar`, `FHTextField`, `StatusBadge`, swipe actions, pull-to-refresh

## Getting Started

### 1. Configure the API URL

Edit `FamilyHub/Config.swift`:

```swift
// iOS Simulator (default)
static let apiBaseURL = URL(string: "http://localhost:5000")!

// Physical device – replace with your Mac's LAN IP
static let apiBaseURL = URL(string: "http://192.168.1.10:5000")!
```

### 2. Open in Xcode

```bash
open src/ios/FamilyHub.xcodeproj
```

### 3. Select target & run

- Choose **iPhone 17 Simulator** (or any iOS 17+ simulator)
- Press **⌘ R** to build and run

### 4. Start the backend

```bash
cd src/backend
dotnet run --project src/FamilyHub.AppHost
```

## ATS (App Transport Security)

`Info.plist` allows plain HTTP for `localhost` during development.  
**Before App Store submission**, switch to HTTPS and remove `NSAllowsArbitraryLoads`.

## Bundle ID

Default: `com.familyhub.app`  
Change it in Xcode → target → Signing & Capabilities to match your Apple Developer account.
