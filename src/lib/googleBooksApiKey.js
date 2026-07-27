// A free Google Books API key, restricted (in the Google Cloud console)
// to only work with the Books API - safe to ship in client-side code for
// the same reason the Firebase config in firebase.js is: the restriction
// is what protects it, not secrecy.
//
// Without this, requests share Google's global "no API key" quota with
// every other keyless app in the world, which runs out fast. This key
// gives this app its own dedicated daily allowance instead.
export const GOOGLE_BOOKS_API_KEY = "AIzaSyBWNiEwNuBSeQwcMpp8msg75th1BXJu3cY";
