// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeqdhc8HleO5R5MK5G7QxfQE8ZXp35roo",
  authDomain: "claw-machine-reviews.firebaseapp.com",
  projectId: "claw-machine-reviews",
  storageBucket: "claw-machine-reviews.firebasestorage.app",
  messagingSenderId: "1039777704688",
  appId: "1:1039777704688:web:dc80bb7f015327f493f035"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; // ← 이거 꼭 필요