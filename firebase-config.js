// Pegá acá la configuración de tu proyecto de Firebase.
// Dónde está: consola de Firebase → ⚙ Configuración del proyecto → General → Tus apps → App web → "Configuración del SDK".
export const firebaseConfig = {
  apiKey: "PEGAR_AQUI",
  authDomain: "PEGAR_AQUI.firebaseapp.com",
  projectId: "PEGAR_AQUI",
  storageBucket: "PEGAR_AQUI.appspot.com",
  messagingSenderId: "PEGAR_AQUI",
  appId: "PEGAR_AQUI"
};

// false = la página entra directo, sin usuario ni contraseña (como está ahora).
// true  = pide usuario y contraseña (ver LEEME: hay que crear los usuarios y cambiar las reglas).
export const pedirIngreso = false;
