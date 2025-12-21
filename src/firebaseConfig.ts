// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
    apiKey: "AIzaSyCjl9nQySKq3biIlLr7e3nzcZt-AU4Efcs",
    authDomain: "someting-special-68881.firebaseapp.com",
    databaseURL: "https://someting-special-68881-default-rtdb.firebaseio.com",
    projectId: "someting-special-68881",
    storageBucket: "someting-special-68881.firebasestorage.app",
    messagingSenderId: "264521734146",
    appId: "1:264521734146:web:fc6cc1048b039bb6d0ef1b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
