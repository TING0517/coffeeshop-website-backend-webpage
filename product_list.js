import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, query, orderBy, } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
const db = getFirestore(app);
const auth = getAuth(app);
const adminEmails = ["moonlightcafe.com@gmail.com"]; // 商家管理帳號權限

// 執行身分檢查
onAuthStateChanged(auth, (user) => {
    if (user && adminEmails.includes(user.email)) {
        console.log("驗證通過");
        document.body.style.display = "block"; 
    } else {
        if (user) {
            alert("此帳號無管理權限");
        }
        // 直接強制跳轉回登入首頁
        window.location.href = "index.html";
    }
});



async function loadProducts() {
    const container = document.getElementById('productCardContainer');
    const loader = document.getElementById('loadingSpinner');

    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "asc"));  
        // asc:升冪排序  desc:降冪排序
        const querySnapshot = await getDocs(q);

        if (loader) loader.remove();
        container.innerHTML = '';

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-muted">目前尚無上架商品</div>';
            return;
        }

        querySnapshot.forEach((documentSnapshot) => {
            const item = documentSnapshot.data();
            const id = documentSnapshot.id;

            const mainImg = (item.imageUrls && item.imageUrls.length > 0)
                ? item.imageUrls[0]
                : 'https://via.placeholder.com/300x200?text=No+Image';

            const date = item.createdAt ? item.createdAt.toDate().toLocaleDateString() : '未知';

            const cardHtml = 
            `<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-1">
            <div class="card product-card shadow-sm h-60" style="background-color: #2d3748; border: none;">
                <div class="card-img-container">
                    <img src="${mainImg}" class="card-img-top" alt="${item.name}">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold text-white text-truncate mb-3">${item.name}</h5>
                    
                    <p class="card-text small mb-2" style="color: #dbb752; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">
                        ${item.description}
                    </p>
                    
                    <div class="price-text mb-2">NT$ ${item.price}</div>
                    
                    <div class="keywords-area mb-2">
                        ${(item.keywords || []).map(k => 
                            `<span class="badge rounded-pill border border-secondary text-light me-1" style="font-size: 0.7rem; background: rgba(255,255,255,0.1);">${k}</span>`
                        ).join('')}
                    </div>
                    
                    <div>
                        <small style="color: #718096;">上架日期: ${date}</small>
                    </div>
                </div>
                <div class="card-footer d-flex gap-2" style="background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05);">
                    <button class="btn btn-outline-info btn-sm flex-fill edit-btn" data-id="${id}">修改</button>
                    <button class="btn btn-outline-danger btn-sm flex-fill delete-btn" data-id="${id}">刪除</button>
                </div>
            </div>
        </div>`;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        addEventHandlers();

    } catch (err) {
        console.error("讀取失敗:", err);
        container.innerHTML = `<div class="col-12 text-center text-danger py-5">讀取失敗：${err.message}</div>`;
    }
}

function addEventHandlers() {
    // 刪除
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('確定要永久刪除此商品嗎？')) {
                try {
                    await deleteDoc(doc(db, "products", id));
                    alert('商品已刪除');
                    loadProducts();
                } catch (err) {
                    alert('刪除失敗：' + err.message);
                }
            }
        });
    });

    // 修改
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            try {
                const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const item = docSnap.data();
                    const editData = {
                        title: item.name,
                        price: item.price,
                        detail: item.description,
                        keywords: item.keywords,
                        oldImageUrls: item.imageUrls || [],
                        isEditMode: true,
                        docId: id
                    };
                    localStorage.setItem('pending_product', JSON.stringify(editData));
                    window.location.href = "product_upload.html";
                }
            } catch (err) {
                alert("讀取商品失敗");
            }
        });
    });
}

loadProducts();