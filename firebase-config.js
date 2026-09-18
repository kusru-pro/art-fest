// === Firebase Configuration & Initialization (Modular SDK v10) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// TODO: Replace with your actual Firebase Project Configuration keys
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if actual configuration has been provided
export const isConfigured = Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" && 
    !firebaseConfig.projectId.includes("YOUR_PROJECT")
);

// Initialize Firebase services
let app = null;
let db = null;
let storage = null;
let auth = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
} catch (error) {
    console.warn("Firebase initialized with placeholder config. Please update firebaseConfig with your project credentials.", error);
}

export { 
    app, 
    db, 
    storage, 
    auth, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
};
