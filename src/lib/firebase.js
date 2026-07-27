import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// These values identify which Firebase project to talk to. They're safe
// to ship in client-side code - Firestore's security rules (not these
// keys) are what actually protect your data.
const firebaseConfig = {
  apiKey: "AIzaSyAE4a4TtqgCPilKqDttPEdk8u490B5pEKI",
  authDomain: "book-library-a4c9e.firebaseapp.com",
  projectId: "book-library-a4c9e",
  storageBucket: "book-library-a4c9e.firebasestorage.app",
  messagingSenderId: "496005476888",
  appId: "1:496005476888:web:f012ab3a2acbce9068896d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Keeps a local (IndexedDB) copy of your library on this device, so the
// app has something to show immediately even before a network request
// finishes - and still works read-only if you open it with no signal at
// all. `persistentMultipleTabManager` avoids the errors you'd otherwise
// get if this app is ever open in more than one browser tab at once.
//
// `ignoreUndefinedProperties` matters more than it looks: Firestore
// normally throws (and crashes the app, since nothing here catches it)
// if you try to save an object with an explicit `undefined` field
// anywhere in it - e.g. `{ ...book, releaseDate: undefined }`. That
// pattern shows up in a few places in this app (a book without a release
// date, a book that's never been flagged "reading"), so without this
// setting, ordinary actions like unchecking a finished book can crash
// the whole page.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});
