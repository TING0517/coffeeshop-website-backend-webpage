import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAEKrtUed8tzL1s072W9eWrTfT1RXfkOKA",
    authDomain: "test01-dd13e.firebaseapp.com",
    projectId: "test01-dd13e",
    storageBucket: "test01-dd13e.firebasestorage.app",
    messagingSenderId: "262581605790",
    appId: "1:262581605790:web:456fcca5091299e285728f"
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