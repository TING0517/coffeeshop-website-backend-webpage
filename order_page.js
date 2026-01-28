import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const adminEmails = ["moonlightcafe.com@gmail.com"]; 

// 身分檢查
onAuthStateChanged(auth, (user) => {
    if (user && adminEmails.includes(user.email)) {
        //已登入且是管理員
        console.log("驗證通過");
        document.body.style.display = "block"; 
    } else {
        //未登入或身分不符
        if (user) {
            alert("此帳號無管理權限");
        }
        // 直接強制跳轉回登入首頁
        window.location.href = "index.html";
    }
});