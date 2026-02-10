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
  doc,
  updateDoc,
  where
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

// 更新函式掛載到 window，讓 HTML onclick 可以直接呼叫
window.updateStatus = async (orderId, newStatus) => {
  if (newStatus === 0 && !confirm("確定要取消這筆訂單嗎？")) return;
  try {
    const orderRef = doc(db, "cafe_orders", orderId);
    await updateDoc(orderRef, { order_status: newStatus });
  } catch (e) {
    console.error("更新失敗:", e);
    alert("更新失敗");
  }
};

let unsubscribe = null;
let activeOrders = []; // 儲存目前顯示的訂單，供逾時檢查使用
// 切換篩選狀態的函式
// 供 HTML 按鈕呼叫的切換函數
window.changeFilter = (filterType) => {
  startListeningOrders(filterType);
};

function startListeningOrders(filterType = 'pending') {
  //如果已經有在監聽，先停止它，避免重複渲染
  if (unsubscribe) unsubscribe();
  const ordersRef = collection(db, "cafe_orders");
  let q;

  // 根據傳入的參數決定查詢條件
  if (filterType === 'completed') {
    q = query(ordersRef, where("order_status", "==", 3), orderBy("timestamp", "desc"));
  } else if (filterType === 'cancelled') {
    q = query(ordersRef, where("order_status", "==", 0), orderBy("timestamp", "desc"));
  } else {
    // 預設待處理：1 (成立) 與 2 (製作中)
    q = query(ordersRef, where("order_status", "in", [1, 2]), orderBy("timestamp", "desc"));
  }

  // 開始監聽
  unsubscribe = onSnapshot(q, (snapshot) => {
    const listContainer = document.getElementById("order-display-area");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    activeOrders = []; // 重置列表

    if (snapshot.empty) {
      listContainer.innerHTML = `<div class="alert alert-info text-center w-100">目前沒有這類別的訂單。</div>`;
      return;
    }

    snapshot.forEach((doc) => {
      const order = doc.data();
      // 儲存 ID 供後續操作
      order.id = doc.id;
      activeOrders.push(order);
      
      const orderNumber = order.timestamp
        ? (() => {
            const d = new Date(order.timestamp);
            const f = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}${f(d.getMonth() + 1)}${f(d.getDate())}${f(d.getHours())}${f(d.getMinutes())}${f(d.getSeconds())}`;
          })()
        : "無編號";

      const orderTime = order.timestamp ? (() => {
        const d = new Date(order.timestamp);
        const f = (n) => String(n).padStart(2, "0");
        return `${f(d.getHours())}:${f(d.getMinutes())}`;
      })() : "--:--";
      
      let actionButtons = "";
      const status = order.order_status;

      if (status === 1) {
        actionButtons = `
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-success fw-bold" style="flex: 3;" onclick="window.updateStatus('${doc.id}', 2)">接單</button>
            <button class="btn btn-danger" style="flex: 2;" onclick="window.updateStatus('${doc.id}', 0)">取消</button>
          </div>`;
      } else if (status === 2) {
        actionButtons = `
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-warning fw-bold" style="flex: 3;" onclick="window.updateStatus('${doc.id}', 3)">完成訂單</button>
            <button class="btn btn-danger" style="flex: 2;" onclick="window.updateStatus('${doc.id}', 0)">取消</button>
          </div>`;
      }

      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 d-flex";

      const itemsHtml = (order.items || []).map(item => `
        <li class="list-group-item bg-transparent border-secondary px-0">
            <div class="d-flex justify-content-between align-items-center w-100">
                <div class="text-start">
                    <span class="fw-bold text-white fs-5">${item.name} x ${item.qty}</span>
                    ${item.note ? `<div class="text-warning fw-bold fs-6 mt-1"> ${item.note}</div>` : ""}
                </div>
            </div>
        </li>
      `).join("");

      const card = document.createElement("div");
      card.className = "card mb-4 shadow-sm w-100";


      card.innerHTML = `
        <div class="card-header bg-dark d-flex justify-content-between">
          <span class="fw-bold" style="color: var(--primary);">訂單編號：${orderNumber}</span>
          <span class="fw-bold text-white">${orderTime}</span>
        </div>
        <div class="card-body d-flex flex-column" style="background-color: transparent;">
          <ul class="list-group list-group-flush flex-grow-1" style="background-color: transparent;">
            ${itemsHtml}
          </ul>
          <div class="d-flex justify-content-between mt-auto mb-2 pt-3 border-top border-secondary">
            <h5 class="card-title fw-bold text-warning fs-5" style="margin-bottom: 0;">${order.customer?.name} (${order.customer?.phone})</h5>
            <h5 class="fw-bold text-danger fs-5" style="margin-bottom: 0;">總計: $${order.total}</h5>
          </div>
          ${actionButtons}
        </div>
      `;

      col.appendChild(card);
      listContainer.appendChild(col);
    });
  }, (error) => {
    console.error("Firestore 監聽失敗:", error);
  });
}

// 自動檢查逾時訂單 (每15秒檢查一次)
// 規則：狀態為 1 (待處理) 且建立時間超過 5 分鐘
function checkTimeoutOrders() {
    const now = Date.now();
    const timeoutDuration = 5 * 60 * 1000; // 5分鐘 (毫秒)

    activeOrders.forEach(async (order) => {
        if (order.order_status === 1 && order.timestamp) {
            const orderTime = new Date(order.timestamp).getTime();
            if (now - orderTime > timeoutDuration) {
                console.log(`訂單 ${order.id} 逾時 (${Math.floor((now-orderTime)/1000)}秒)，自動取消`);
                
                try {
                    // 直接呼叫 updateDoc，不經過 window.updateStatus 以免觸發 confirm 視窗
                    const orderRef = doc(db, "cafe_orders", order.id);
                    await updateDoc(orderRef, { order_status: 0 }); // 0 = 已取消
                    console.log(`訂單 ${order.id} 已自動取消`);
                } catch (e) {
                    console.error(`自動取消訂單 ${order.id} 失敗:`, e);
                }
            }
        }
    });
}

setInterval(checkTimeoutOrders, 15000); // 15000ms = 15秒


function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-TW', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const timeDisplay = document.getElementById("current-time");
    if (timeDisplay) {
        timeDisplay.innerText = `${timeString}`;
    }
}

// 每 1000 毫秒 (1秒) 更新一次
setInterval(updateClock, 1000);

// 頁面載入時立刻執行一次，避免空白一秒
updateClock();
