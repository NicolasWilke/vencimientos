// Pegá acá la configuración de tu proyecto de Firebase.
// Dónde está: consola de Firebase → ⚙ Configuración del proyecto → General → Tus apps → App web → "Configuración del SDK".
export const firebaseConfig = {
  apiKey: "AIzaSyAFEiMEYAF9Tk_m2fVax0DXDv-Y4C9TrAs",

  authDomain: "vencimientos-b00bb.firebaseapp.com",

  projectId: "vencimientos-b00bb",

  storageBucket: "vencimientos-b00bb.firebasestorage.app",

  messagingSenderId: "223775662636",

  appId: "1:223775662636:web:2ebf00605561feaf1a2789"

};

// false = la página entra directo, sin usuario ni contraseña (como está ahora).
// true  = pide usuario y contraseña (ver LEEME: hay que crear los usuarios y cambiar las reglas).
export const pedirIngreso = false;

