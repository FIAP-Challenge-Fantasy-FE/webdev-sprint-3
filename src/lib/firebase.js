import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSkYyoWALg4RTLaA4rTHTOapeIZDU181g",
  authDomain: "challenge-mahindra.firebaseapp.com",
  projectId: "challenge-mahindra",
  storageBucket: "challenge-mahindra.appspot.com",
  messagingSenderId: "734013056297",
  appId: "1:734013056297:web:e8b4b6abca78079bb9c338",
  measurementId: "G-YHQ8TKQFFC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);