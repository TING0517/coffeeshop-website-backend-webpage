import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const adminEmails = ["moonlightcafe.com@gmail.com"];

// 身分檢查
onAuthStateChanged(auth, (user) => {
  if (user && adminEmails.includes(user.email)) {
    //已登入且是管理員
    console.log("驗證通過");
    document.body.style.display = "block";
    startListeningOrders();
  } else {
    //未登入或身分不符
    if (user) {
      alert("此帳號無管理權限");
    }
    // 直接強制跳轉回登入首頁
    window.location.href = "index.html";
  }
});

function startListeningOrders() {
  console.log("📡 啟動監聽程序：正在嘗試連線到 cafe_orders...");
  const ordersRef = query(
    collection(db, "cafe_orders"),
    orderBy("timestamp", "desc"),
  );
  onSnapshot(
    ordersRef,
    (snapshot) => {
      console.log("📥 收到資料！目前文件數量:", snapshot.size);
      const listContainer = document.getElementById("order-display-area");

      if (!listContainer) {
        console.error("❌ 找不到 HTML 容器: order-display-area");
        return;
      }

      listContainer.innerHTML = "";

      if (snapshot.empty) {
        listContainer.innerHTML = `<div class="alert alert-info text-center">📭 目前資料庫是空的，尚無訂單。</div>`;
        return;
      }

      snapshot.forEach((doc) => {
        const order = doc.data();
        console.log("📝 正在處理訂單資料:", order);

        const timeString = order.timestamp
          ? new Date(order.timestamp).toLocaleString()
          : "未知時間";

        // 1. 建立外層欄位容器 (決定一排幾張)
        const col = document.createElement("div");
        col.className = "col-12 col-md-6 col-lg-4 d-flex"; // 加入 d-flex 確保卡片高度一致

        // 2. 生成商品明細 HTML
        const itemsHtml = (order.items || [])
          .map(
            (item) => `
        <li class="list-group-item bg-transparent border-secondary px-0">
            <div class="d-flex justify-content-between align-items-center w-100">
                <div class="text-start">
                    <span class="fw-bold text-white fs-5">${item.name} x ${item.qty}</span>
                    ${item.note ? `<div class="text-warning fw-bold fs-6 mt-1"> ${item.note}</div>` : ""}
                </div>
                <div class="text-end">
                    <span class="fw-bold text-white fs-5">$${item.price * item.qty}</span>
                </div>
            </div>
        </li>
    `,
          )
          .join("");

        // 3. 建立卡片並填入 HTML
        const card = document.createElement("div");
        // 加入 h-100 讓同一排卡片等高，w-100 確保填滿欄位
        card.className = "card mb-4 shadow-sm border-0 w-100 h-100";
        card.style.backgroundColor = "#2d3748"; // 補回你原本 CSS 的卡片顏色

        card.innerHTML = `
      <div class="card-header bg-dark text-white d-flex justify-content-between">
        <span class="fw-bold text-white">訂單編號:${order.orderId}</span>
        <span class="text-white">${timeString}</span>
      </div>
      <div class="card-body d-flex flex-column">
        
        <ul class="list-group list-group-flush flex-grow-1">
          ${itemsHtml}
        </ul>
        
        <div class="d-flex justify-content-between mt-auto pt-3 border-top border-secondary">
          <h5 class="card-title fw-bold text-warning fs-5">${order.customer?.name} (${order.customer?.phone})</h5>
          <h5 class="fw-bold text-danger fs-5">總計: $${order.total}</h5>
        </div>
      </div>
    `;

        // ⭐ 重點修正：將 card 放進 col，再將 col 放進 listContainer
        col.appendChild(card);
        listContainer.appendChild(col);
      });
    },
    (error) => {
      console.error("🔥 Firestore 監聽失敗:", error.code, error.message);
      const listContainer = document.getElementById("order-display-area");
      if (listContainer) {
        listContainer.innerHTML = `<div class="alert alert-danger">讀取失敗：${error.message}</div>`;
      }
    },
  );
}
