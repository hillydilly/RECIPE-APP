// Firebase Configuration for Nourish Meal Planner
// ================================================

const firebaseConfig = {
    apiKey: "AIzaSyCYUZMB052YNUMXmv8VbNDlKR6gSimKPhk",
    authDomain: "recipe-app-96183.firebaseapp.com",
    projectId: "recipe-app-96183",
    storageBucket: "recipe-app-96183.firebasestorage.app",
    messagingSenderId: "181306175586",
    appId: "1:181306175586:web:871982f5a6b8b8b20de13b",
    measurementId: "G-QTPGNJ6VRL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Enable offline persistence (data works offline and syncs when back online)
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.log('Persistence not supported by browser');
        }
    });

// Collection references
const COLLECTIONS = {
    RECIPES: 'recipes',
    WEEKLY_PLANS: 'weeklyPlans',
    SETTINGS: 'settings'
};

// Single user mode (expand for multi-user with Firebase Auth later)
const USER_ID = 'default_user';

console.log('Firebase initialized successfully');
