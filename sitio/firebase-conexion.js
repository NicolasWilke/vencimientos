// Conexión de la página con Firebase: ingreso con usuario y base de datos Firestore.
// La página usa la misma forma de trabajar que tenía en claude.ai (colecciones y documentos),
// y este archivo la traduce a Firestore. No hace falta tocarlo: la configuración va en firebase-config.js.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot, FieldPath
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = s => document.querySelector(s);
const msg = (t, ok) => { const m = $("#loginMsg"); m.textContent = t; m.className = "loginMsg" + (ok ? " ok" : ""); };

let firebaseConfig = null, pedirIngreso = false;
try {
  ({ firebaseConfig, pedirIngreso = false } = await import("./firebase-config.js"));
} catch (e) { /* se avisa abajo */ }
if (!firebaseConfig || !firebaseConfig.apiKey || /PEGAR/i.test(firebaseConfig.apiKey)) {
  window.__resolverDb(null);   // la página muestra "falta configurar Firebase"
  throw new Error("Falta firebase-config.js");
}

const app = initializeApp(firebaseConfig);
let fdb;
try {
  // Guarda una copia en el dispositivo: si se corta internet en el local, se sigue viendo y cargando
  fdb = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) { fdb = getFirestore(app); }

/* ---------- traducción de errores de Firestore a los que espera la página ---------- */
function error(e) {
  const c = String((e && e.code) || "").replace(/^firestore\//, "");
  const mapa = { "not-found": "invalid_argument", "invalid-argument": "invalid_argument", "failed-precondition": "invalid_argument",
    "permission-denied": "revoked", "unauthenticated": "revoked", "resource-exhausted": "quota_exceeded", "unavailable": "unavailable" };
  const err = new Error((e && e.message) || "Error de base de datos");
  err.code = mapa[c] || "unavailable";
  return err;
}
// update({ labs: { "779...": "Gador" } }) debe sumar ese campo sin borrar los demás laboratorios
function aplanar(obj, pre = [], out = []) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) aplanar(v, [...pre, k], out);
    else out.push(new FieldPath(...pre, k), v);
  }
  return out;
}
const snapDoc = s => ({ id: s.id, exists: s.exists(), data: () => s.data(), metadata: s.metadata });
function refDoc(ref) {
  return {
    set: d => setDoc(ref, d).catch(e => { throw error(e); }),
    update: d => { const a = aplanar(d); return updateDoc(ref, a[0], a[1], ...a.slice(2)).catch(e => { throw error(e); }); },
    delete: () => deleteDoc(ref).catch(e => { throw error(e); }),
    onSnapshot: (next, err) => onSnapshot(ref, s => next(snapDoc(s)), e => err && err(error(e)))
  };
}
function refCol(nombre) {
  const ref = collection(fdb, nombre);
  return {
    doc: id => refDoc(doc(fdb, nombre, id)),
    onSnapshot: (next, err) => onSnapshot(ref,
      s => next({ docs: s.docs.map(d => ({ id: d.id, exists: true, data: () => d.data(), metadata: d.metadata })), size: s.size, empty: s.empty }),
      e => err && err(error(e)))
  };
}
const base = {
  collection: nombre => refCol(nombre),
  doc: ruta => { const [c, id] = ruta.split("/"); return refDoc(doc(fdb, c, id)); }
};

/* ---------- ingreso ----------
   Con pedirIngreso = false (así está ahora) la página entra directo, sin usuario ni contraseña.
   Para volver a pedir usuario: poné pedirIngreso = true en firebase-config.js y usá las reglas con login. */
if (!pedirIngreso) {
  window.__resolverDb(base);
} else {
  const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } =
    await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
  const auth = getAuth(app);
  let listo = false;
  onAuthStateChanged(auth, user => {
    if (user) {
      $("#login").hidden = true;
      $("#userbar").hidden = false;
      $("#userEmail").textContent = user.email || "";
      if (!listo) { listo = true; window.__resolverDb(base); }
    } else {
      if (listo) { location.reload(); return; }   // se cerró la sesión: empezar de cero
      $("#login").hidden = false;
      $("#userbar").hidden = true;
      setTimeout(() => $("#loginEmail").focus(), 50);
    }
  });
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim(), pass = $("#loginPass").value;
    if (!email || !pass) { msg("Completá email y contraseña."); return; }
    $("#loginBtn").disabled = true; msg("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      const c = err && err.code;
      msg(c === "auth/too-many-requests" ? "Demasiados intentos. Esperá unos minutos y probá de nuevo."
        : c === "auth/network-request-failed" ? "Sin conexión a internet."
        : c === "auth/invalid-email" ? "El email no es válido."
        : "Email o contraseña incorrectos.");
    }
    $("#loginBtn").disabled = false;
  });
  $("#loginReset").addEventListener("click", async () => {
    const email = $("#loginEmail").value.trim();
    if (!email) { msg("Escribí tu email arriba y tocá de nuevo “Olvidé mi contraseña”."); $("#loginEmail").focus(); return; }
    try { await sendPasswordResetEmail(auth, email); msg("Te mandamos un email para cambiar la contraseña.", true); }
    catch (err) { msg("No se pudo enviar el email. Revisá que esté bien escrito."); }
  });
  $("#logout").addEventListener("click", () => signOut(auth));
}
