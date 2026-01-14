# 🍃 Nourish — Family Meal Planner

A beautiful meal planning app with Firebase backend and GitHub Pages hosting. Designed for families with dietary restrictions (dairy-free, wheat-free, no seed oils).

## Features

- 📅 **Weekly Meal Planning** - Plan your entire week with drag-and-drop simplicity
- 🔄 **21-Day Rotation** - Automatic tracking prevents recipe repetition
- 🛒 **Smart Shopping Lists** - Auto-generated, categorized grocery lists
- 🥗 **Auto-Substitutions** - Automatically converts recipes to dairy-free, wheat-free alternatives
- ☁️ **Cloud Sync** - Data syncs across all your devices via Firebase
- 📱 **Mobile-First** - Beautiful responsive design works on any device

## Quick Setup Guide

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup wizard
3. Name your project (e.g., "nourish-meal-planner")

### Step 2: Enable Firestore Database

1. In your Firebase project, go to **Build > Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location closest to you

### Step 3: Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (e.g., "Nourish Web")
5. Copy the `firebaseConfig` object

### Step 4: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### Step 5: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database > Rules**
2. Copy the rules from `firestore.rules` file
3. Click "Publish"

### Step 6: Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push all files to the repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nourish-meal-planner.git
git push -u origin main
```

3. Go to repository **Settings > Pages**
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click Save

### Step 7: Add GitHub Pages Domain to Firebase

1. In Firebase Console, go to **Authentication > Settings > Authorized domains**
2. Add your GitHub Pages domain: `YOUR_USERNAME.github.io`

## File Structure

```
nourish-app/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js              # Application logic
├── firebase-config.js  # Firebase configuration (edit this!)
├── firestore.rules     # Security rules for Firestore
└── README.md           # This file
```

## Customization

### Changing the Rotation Period

In `app.js`, modify the `ROTATION_DAYS` constant:

```javascript
const ROTATION_DAYS = 21; // Change to your preferred days
```

### Adding New Dietary Substitutions

In `app.js`, find the `applySubstitutions()` function and add new rules:

```javascript
function applySubstitutions(ingredient) {
    // Add your custom substitutions here
    result = result.replace(/\b(your ingredient)\b/gi, 'replacement');
    return result;
}
```

### Modifying Default Recipes

In `app.js`, find the `getDefaultRecipes()` function to add or modify the starter recipes.

## Multi-User Support (Future Enhancement)

To add user authentication:

1. Enable **Authentication** in Firebase Console
2. Add sign-in methods (Google, Email, etc.)
3. Update `firebase-config.js` to use Firebase Auth
4. Change `USER_ID` to use authenticated user's ID
5. Update Firestore rules to the production version in `firestore.rules`

## Troubleshooting

### "Permission denied" errors
- Check that Firestore rules are set to test mode
- Verify your Firebase config is correct

### Data not syncing
- Check browser console for errors
- Verify your internet connection
- Make sure Firebase config matches your project

### Offline mode not working
- The app requires initial online connection to load
- After first load, offline persistence is enabled

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Firebase Firestore
- **Hosting**: GitHub Pages
- **Fonts**: Fraunces (display), DM Sans (body)

## License

MIT License - feel free to customize for your family!

---

Made with 💚 for healthy family meals
