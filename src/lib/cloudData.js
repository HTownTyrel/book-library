import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

// Each signed-in user gets exactly one document holding their whole
// library. `onSnapshot` pushes updates in real time, so a change made
// on one device shows up on every other device within moments - no
// manual export/import string needed anymore.
function libraryDocRef(uid) {
  return doc(db, "libraries", uid);
}

export function subscribeToLibrary(uid, onData) {
  return onSnapshot(libraryDocRef(uid), (snap) => {
    onData(snap.exists() ? snap.data() : null);
  });
}

export function saveLibrary(uid, data) {
  return setDoc(libraryDocRef(uid), data);
}
