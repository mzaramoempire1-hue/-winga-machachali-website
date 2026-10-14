// Import Firebase SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration (Decoded dynamically for Firebase Web SDK)
const firebaseConfig = {
    apiKey: atob("QUl6YVN5RFhweHNFbFlVbEJPZFZ2NTI0MEtDWWRFT3QxNlhCaGs="),
    authDomain: "com-mzaramo-wingamachach-73b22.firebaseapp.com",
    projectId: "com-mzaramo-wingamachach-73b22",
    storageBucket: "com-mzaramo-wingamachach-73b22.firebasestorage.app",
    messagingSenderId: "871702528170",
    appId: "1:871702528170:android:df1f5f6331a3e295b150d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let allListings = [];
let currentCategory = "Vyote";
let currentSearchQuery = "";
let uploadedImageBase64 = "";

// DOM Elements
const listingsGrid = document.getElementById("listingsGrid");
const listingsLoading = document.getElementById("listingsLoading");
const noListings = document.getElementById("noListings");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const categoriesFilter = document.getElementById("categoriesFilter");
const postChickenForm = document.getElementById("postChickenForm");
const postImageFile = document.getElementById("postImageFile");
const imagePreviewBox = document.getElementById("imagePreviewBox");
const imagePreviewImg = document.getElementById("imagePreviewImg");
const removeImageBtn = document.getElementById("removeImageBtn");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const navLinks = document.getElementById("navLinks");

// Order Modal Elements
const orderModal = document.getElementById("orderModal");
const closeOrderModal = document.getElementById("closeOrderModal");
const orderForm = document.getElementById("orderForm");
const orderItemTitle = document.getElementById("orderItemTitle");
const orderItemPrice = document.getElementById("orderItemPrice");
const orderChickenId = document.getElementById("orderChickenId");
const orderChickenTitleHidden = document.getElementById("orderChickenTitleHidden");
const orderPricePerUnit = document.getElementById("orderPricePerUnit");
const orderQuantity = document.getElementById("orderQuantity");
const orderTotalPricePreview = document.getElementById("orderTotalPricePreview");

// Cart Modal Elements
const cartModal = document.getElementById("cartModal");
const closeCartModal = document.getElementById("closeCartModal");
const openCartModalBtn = document.getElementById("openCartModalBtn");
const cartOrdersList = document.getElementById("cartOrdersList");

// Contact Choice Modal Elements (Piga Simu / WhatsApp)
const contactChoiceModal = document.getElementById("contactChoiceModal");
const closeContactChoiceModal = document.getElementById("closeContactChoiceModal");
const contactChoiceSub = document.getElementById("contactChoiceSub");
const contactPhoneDisplay = document.getElementById("contactPhoneDisplay");
const btnCallPhone = document.getElementById("btnCallPhone");
const btnOpenWhatsapp = document.getElementById("btnOpenWhatsapp");

// Image Viewer Modal Elements
const imageViewerModal = document.getElementById("imageViewerModal");
const fullImageViewerImg = document.getElementById("fullImageViewerImg");
const closeImageViewerModal = document.getElementById("closeImageViewerModal");

// Admin Modal Elements (Direct Access with Passcode)
const adminDashboardModal = document.getElementById("adminDashboardModal");
const closeAdminDashboardModal = document.getElementById("closeAdminDashboardModal");
const tabOrdersBtn = document.getElementById("tabOrdersBtn");
const tabShippedBtn = document.getElementById("tabShippedBtn");
const tabListingsBtn = document.getElementById("tabListingsBtn");
const adminOrdersContent = document.getElementById("adminOrdersContent");
const adminShippedContent = document.getElementById("adminShippedContent");
const adminListingsContent = document.getElementById("adminListingsContent");
const adminOrdersCount = document.getElementById("adminOrdersCount");
const adminShippedCount = document.getElementById("adminShippedCount");
const adminListingsCount = document.getElementById("adminListingsCount");

// Toggle Nav Menu on Mobile
if (menuToggleBtn && navLinks) {
    menuToggleBtn.addEventListener("click", () => {
        if (navLinks.style.display === "flex") {
            navLinks.style.display = "none";
        } else {
            navLinks.style.display = "flex";
            navLinks.style.flexDirection = "column";
            navLinks.style.position = "absolute";
            navLinks.style.top = "60px";
            navLinks.style.left = "0";
            navLinks.style.width = "100%";
            navLinks.style.backgroundColor = "#1E1E1E";
            navLinks.style.padding = "20px";
            navLinks.style.boxShadow = "0 10px 20px rgba(0,0,0,0.5)";
        }
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        if (navLinks && window.innerWidth <= 768) {
            navLinks.style.display = "none";
        }
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

if (closeAdminDashboardModal) {
    closeAdminDashboardModal.addEventListener("click", () => {
        adminDashboardModal.style.display = "none";
    });
}

if (openCartModalBtn) {
    openCartModalBtn.addEventListener("click", () => {
        openCartModal();
    });
}

if (closeCartModal) {
    closeCartModal.addEventListener("click", () => {
        cartModal.style.display = "none";
    });
}

// Open Cart Modal & Load User Orders from localStorage / Firestore
async function openCartModal() {
    cartModal.style.display = "flex";
    cartOrdersList.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-gray);'><i class='fas fa-spinner fa-spin'></i> Inapakia oda zako...</p>";

    try {
        const savedPhone = localStorage.getItem("winga_user_phone") || "";
        const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        const userOrders = [];

        ordersSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (!savedPhone || data.customerPhone === savedPhone) {
                userOrders.push({ id: docSnap.id, ...data });
            }
        });

        if (userOrders.length === 0) {
            cartOrdersList.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-gray);'>Huna oda zilizowekwa kwa sasa kwenye kifaa hiki.</p>";
        } else {
            cartOrdersList.innerHTML = userOrders.map(o => `
                <div style="background:#121212; border:1px solid var(--card-border); border-radius:10px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="color:var(--primary-orange);">${o.orderId || 'ODA'}</strong>
                        <span style="font-size:0.75rem; background:${o.status === 'Shipped' ? 'rgba(46,204,113,0.15); color:#2ECC71;' : 'rgba(255,152,0,0.15); color:var(--primary-orange);'}; padding:2px 8px; border-radius:4px;">${o.status === 'Shipped' ? 'Imetumwa 🚚' : 'Inasubiri (Pending) 📦'}</span>
                    </div>
                    <p style="font-size:0.9rem; font-weight:600; margin-bottom:4px;">${o.chickenTitle || 'Kuku'} (x${o.quantity || '1'})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Mteja: ${o.customerName || ''} (${o.customerPhone || ''})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Eneo: ${o.customerLocation || ''}</p>
                    <p style="font-size:0.85rem; font-weight:700; color:var(--primary-orange); margin-top:4px;">Jumla: ${(o.totalPrice || 0).toLocaleString()} TZS</p>
                    ${o.status === 'Shipped' ? `
                        <button onclick="window.confirmReceived('${o.id}')" style="width:100%; margin-top:10px; background:#2ECC71; color:#000; border:none; padding:8px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fas fa-check-circle"></i> Nimepokea Mzigo Wangu ✓</button>
                    ` : ''}
                </div>
            `).join("");
        }
    } catch (e) {
        console.error("Cart error:", e);
        cartOrdersList.innerHTML = "<p style='text-align:center; padding:20px; color:#E74C3C;'>Imeshindikana kupakia oda. Jaribu tena.</p>";
    }
}

window.confirmReceived = async function(orderId) {
    if (confirm("Thibitisha kuwa umepokea mzigo wako ili kukamilisha oda?")) {
        try {
            await deleteDoc(doc(db, "orders", orderId));
            alert("Asante! Oda imethibitishwa na kukamilishwa.");
            openCartModal();
        } catch (e) {
            alert("Imeshindikana kuthibitisha oda.");
        }
    }
};

// Track Daily Visitors
async function trackVisitorAnalytics() {
    try {
        const todayKey = new Date().toISOString().split('T')[0];
        const visitorDocRef = doc(db, "analytics", todayKey);
        const docSnap = await getDoc(visitorDocRef);
        if (docSnap.exists()) {
            await updateDoc(visitorDocRef, { visits: increment(1) });
        } else {
            await setDoc(visitorDocRef, { visits: 1, date: todayKey });
        }
    } catch (e) {
        console.error("Visitor analytics error:", e);
    }
}

// Open Admin Dashboard directly & Fetch Real Data (No Infinite Loading)
async function openAdminDashboard() {
    adminDashboardModal.style.display = "flex";
    await loadAdminData();
}

async function loadAdminData() {
    adminOrdersContent.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-gray);'><i class='fas fa-spinner fa-spin'></i> Inapakia oda...</p>";
    adminShippedContent.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-gray);'><i class='fas fa-spinner fa-spin'></i> Inapakia mizigo...</p>";
    adminListingsContent.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-gray);'><i class='fas fa-spinner fa-spin'></i> Inapakia matangazo...</p>";

    try {
        // 1. Fetch Real Users Count
        const usersSnap = await getDocs(collection(db, "users"));
        const usersCount = usersSnap.size;
        document.getElementById("statUsersCount").innerText = usersCount;

        // 2. Fetch Today's Visitors Count
        const todayKey = new Date().toISOString().split('T')[0];
        const visitorDocRef = doc(db, "analytics", todayKey);
        const visitorSnap = await getDoc(visitorDocRef);
        const visitorsCount = visitorSnap.exists() ? (visitorSnap.data().visits || 1) : 1;
        document.getElementById("statVisitorsCount").innerText = visitorsCount;

        // 3. Fetch Real Orders (Oda)
        const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        const pendingOrders = [];
        const shippedOrders = [];

        ordersSnap.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            const status = data.status || "Pending";
            if (status === "Shipped") {
                shippedOrders.push(data);
            } else {
                pendingOrders.push(data);
            }
        });

        const totalOrdersCount = pendingOrders.length + shippedOrders.length;
        document.getElementById("statOrdersCount").innerText = totalOrdersCount;
        adminOrdersCount.innerText = pendingOrders.length;
        adminShippedCount.innerText = shippedOrders.length;

        // Render Pending Orders (Oda Mpya)
        if (pendingOrders.length === 0) {
            adminOrdersContent.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-gray);'>Hakuna oda mpya kwa sasa.</p>";
        } else {
            adminOrdersContent.innerHTML = pendingOrders.map(o => `
                <div style="background:#121212; border:1px solid var(--card-border); border-radius:10px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:var(--primary-orange);">${o.orderId || 'ODA'}</strong>
                        <span style="font-size:0.75rem; background:rgba(255,152,0,0.15); color:var(--primary-orange); padding:2px 8px; border-radius:4px;">Mpya</span>
                    </div>
                    <p style="font-size:0.9rem; font-weight:600; margin-bottom:4px;">${o.chickenTitle || 'Kuku'} (x${o.quantity || '1'})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Mteja: <strong>${o.customerName || ''}</strong> (${o.customerPhone || ''})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Eneo: ${o.customerLocation || ''}</p>
                    <p style="font-size:0.85rem; font-weight:700; color:var(--primary-orange); margin-top:4px;">Jumla: ${(o.totalPrice || 0).toLocaleString()} TZS</p>
                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <a href="tel:${o.customerPhone || '0680234423'}" style="flex:1; background:#2E7D32; color:#fff; text-align:center; padding:8px; border-radius:6px; font-size:0.8rem; text-decoration:none; font-weight:600;"><i class="fas fa-phone-alt"></i> Piga Simu Mteja</a>
                        <button onclick="window.markAsShipped('${o.id}')" style="flex:1; background:var(--primary-orange); color:#000; border:none; padding:8px; border-radius:6px; font-size:0.8rem; font-weight:700; cursor:pointer;"><i class="fas fa-check-circle"></i> Imetumwa ✓</button>
                    </div>
                </div>
            `).join("");
        }

        // Render Shipped Orders (Mizigo)
        if (shippedOrders.length === 0) {
            adminShippedContent.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-gray);'>Hakuna mizigo iliyotumwa kwa sasa.</p>";
        } else {
            adminShippedContent.innerHTML = shippedOrders.map(o => `
                <div style="background:#121212; border:1px solid var(--card-border); border-radius:10px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:var(--primary-orange);">${o.orderId || 'MZIGO'}</strong>
                        <span style="font-size:0.75rem; background:rgba(46,204,113,0.15); color:#2ECC71; padding:2px 8px; border-radius:4px;">Imetumwa</span>
                    </div>
                    <p style="font-size:0.9rem; font-weight:600; margin-bottom:4px;">${o.chickenTitle || 'Kuku'} (x${o.quantity || '1'})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Mteja: <strong>${o.customerName || ''}</strong> (${o.customerPhone || ''})</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Eneo: ${o.customerLocation || ''}</p>
                    <p style="font-size:0.85rem; font-weight:700; color:var(--primary-orange); margin-top:4px;">Jumla: ${(o.totalPrice || 0).toLocaleString()} TZS</p>
                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <a href="tel:${o.customerPhone || '0680234423'}" style="flex:1; background:#2E7D32; color:#fff; text-align:center; padding:8px; border-radius:6px; font-size:0.8rem; text-decoration:none; font-weight:600;"><i class="fas fa-phone-alt"></i> Piga Simu Mteja</a>
                        <button onclick="window.markAsDelivered('${o.id}')" style="flex:1; background:var(--primary-orange); color:#000; border:none; padding:8px; border-radius:6px; font-size:0.8rem; font-weight:700; cursor:pointer;"><i class="fas fa-check-circle"></i> Amepokea ✓</button>
                    </div>
                </div>
            `).join("");
        }

        // 4. Fetch Real Listings (Matangazo) with 30-Day Expiration Auto-Cleanup
        const listingsSnap = await getDocs(query(collection(db, "chickens"), orderBy("datePosted", "desc")));
        const listings = [];
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        listingsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const datePosted = data.datePosted || now;
            if ((now - datePosted) > thirtyDaysMs) {
                deleteDoc(doc(db, "chickens", docSnap.id)).catch(err => console.error("Auto-delete expired listing error:", err));
            } else {
                listings.push({ id: docSnap.id, ...data });
            }
        });

        document.getElementById("statListingsCount").innerText = listings.length;
        adminListingsCount.innerText = listings.length;

        if (listings.length === 0) {
            adminListingsContent.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-gray);'>Hakuna matangazo sokoni kwa sasa.</p>";
        } else {
            adminListingsContent.innerHTML = listings.map(l => {
                const farmerPhone = l.farmerPhone || "0680234423";
                return `
                <div style="background:#121212; border:1px solid var(--card-border); border-radius:10px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="font-size:0.9rem; color:var(--text-white);">${l.title || 'Tangazo'}</strong>
                        <span style="font-size:0.75rem; background:rgba(255,152,0,0.15); color:var(--primary-orange); padding:2px 8px; border-radius:4px;">${l.category || 'Kuku'}</span>
                    </div>
                    <p style="font-size:0.85rem; font-weight:700; color:var(--primary-orange);">${Number(l.price || 0).toLocaleString()} TZS • Idadi: ${l.quantity || '1'}</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Eneo: ${l.location || 'Tanzania'}</p>
                    <p style="font-size:0.8rem; color:var(--text-gray);">Muuzaji: <strong>${l.farmerName || 'Mfugaji'}</strong> (${farmerPhone})</p>
                    <div style="display:flex; gap:10px; margin-top:12px;">
                        <a href="tel:${farmerPhone}" style="flex:1; background:#2E7D32; color:#fff; text-align:center; padding:8px; border-radius:6px; font-size:0.8rem; text-decoration:none; font-weight:600;"><i class="fas fa-phone-alt"></i> Piga Simu Muuzaji</a>
                        <button onclick="window.deleteListing('${l.id}')" style="background:#E74C3C; color:#fff; border:none; padding:8px 12px; border-radius:6px; font-size:0.8rem; font-weight:700; cursor:pointer;"><i class="fas fa-trash"></i> Futa</button>
                    </div>
                </div>
            `;
            }).join("");
        }

    } catch (error) {
        console.error("Error loading admin data:", error);
        adminOrdersContent.innerHTML = "<p style='text-align:center; padding:20px; color:#E74C3C;'>Imeshindikana kupakia oda.</p>";
        adminShippedContent.innerHTML = "<p style='text-align:center; padding:20px; color:#E74C3C;'>Imeshindikana kupakia mizigo.</p>";
        adminListingsContent.innerHTML = "<p style='text-align:center; padding:20px; color:#E74C3C;'>Imeshindikana kupakia matangazo.</p>";
    }
}

// Admin Order & Listing Actions
window.markAsShipped = async function(orderId) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: "Shipped" });
        alert("Oda imewekwa kama Imetumwa ✓ na kuhamishiwa kwenye tab ya Mizigo!");
        loadAdminData();
    } catch (e) {
        alert("Imeshindikana kusasisha oda.");
    }
};

window.markAsDelivered = async function(orderId) {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        alert("Oda imethibitishwa na kufutwa kwenye mfumo baada ya kupokelewa!");
        loadAdminData();
    } catch (e) {
        alert("Imeshindikana kusasisha oda.");
    }
};

window.deleteListing = async function(listingId) {
    if (confirm("Una uhakika unataka kufuta tangazo hili sokoni?")) {
        try {
            await deleteDoc(doc(db, "chickens", listingId));
            alert("Tangazo limefutwa.");
            loadAdminData();
            initFirestoreListener();
        } catch (e) {
            alert("Imeshindikana kufuta tangazo.");
        }
    }
};

// Admin Tabs Switching
if (tabOrdersBtn && tabShippedBtn && tabListingsBtn) {
    tabOrdersBtn.addEventListener("click", () => {
        tabOrdersBtn.style.background = "var(--primary-orange)";
        tabOrdersBtn.style.color = "#000";
        tabShippedBtn.style.background = "var(--card-dark)";
        tabShippedBtn.style.color = "var(--text-white)";
        tabListingsBtn.style.background = "var(--card-dark)";
        tabListingsBtn.style.color = "var(--text-white)";
        adminOrdersContent.style.display = "block";
        adminShippedContent.style.display = "none";
        adminListingsContent.style.display = "none";
    });

    tabShippedBtn.addEventListener("click", () => {
        tabShippedBtn.style.background = "var(--primary-orange)";
        tabShippedBtn.style.color = "#000";
        tabOrdersBtn.style.background = "var(--card-dark)";
        tabOrdersBtn.style.color = "var(--text-white)";
        tabListingsBtn.style.background = "var(--card-dark)";
        tabListingsBtn.style.color = "var(--text-white)";
        adminShippedContent.style.display = "block";
        adminOrdersContent.style.display = "none";
        adminListingsContent.style.display = "none";
    });

    tabListingsBtn.addEventListener("click", () => {
        tabListingsBtn.style.background = "var(--primary-orange)";
        tabListingsBtn.style.color = "#000";
        tabOrdersBtn.style.background = "var(--card-dark)";
        tabOrdersBtn.style.color = "var(--text-white)";
        tabShippedBtn.style.background = "var(--card-dark)";
        tabShippedBtn.style.color = "var(--text-white)";
        adminListingsContent.style.display = "block";
        adminOrdersContent.style.display = "none";
        adminShippedContent.style.display = "none";
    });
}

// Handle Image File Upload & High Quality Processing
if (postImageFile) {
    postImageFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, width, height);

                uploadedImageBase64 = canvas.toDataURL("image/jpeg", 0.85);
                imagePreviewImg.src = uploadedImageBase64;
                imagePreviewBox.style.display = "block";
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => {
        uploadedImageBase64 = "";
        postImageFile.value = "";
        imagePreviewImg.src = "";
        imagePreviewBox.style.display = "none";
    });
}

// Fetch & Listen to Firestore "chickens" collection with 30-Day Auto-Cleanup
function initFirestoreListener() {
    listingsLoading.style.display = "block";
    listingsGrid.innerHTML = "";
    noListings.style.display = "none";

    const q = query(collection(db, "chickens"), orderBy("datePosted", "desc"));

    getDocs(q).then((snapshot) => {
        allListings = [];
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const datePosted = data.datePosted || now;
            if ((now - datePosted) > thirtyDaysMs) {
                deleteDoc(doc(db, "chickens", docSnap.id)).catch(err => console.error("Auto-delete expired listing error:", err));
            } else {
                allListings.push({ id: docSnap.id, ...data });
            }
        });
        renderListings();
    }).catch((error) => {
        console.error("Error fetching listings:", error);
        listingsLoading.style.display = "none";
        noListings.style.display = "block";
        noListings.innerHTML = "<p>Imeshindikana kupakia matangazo. Hakikisha mtandao uko sawa.</p>";
    });
}

// Render Listings based on filters in a 2-Column Grid
function renderListings() {
    listingsLoading.style.display = "none";

    let filtered = allListings;

    if (currentCategory !== "Vyote") {
        filtered = filtered.filter(item =>
            item.category && item.category.trim().toLowerCase() === currentCategory.trim().toLowerCase()
        );
    }

    if (currentSearchQuery.trim() !== "") {
        const queryText = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            (item.title && item.title.toLowerCase().includes(queryText)) ||
            (item.location && item.location.toLowerCase().includes(queryText)) ||
            (item.category && item.category.toLowerCase().includes(queryText)) ||
            (item.farmerName && item.farmerName.toLowerCase().includes(queryText))
        );
    }

    if (filtered.length === 0) {
        listingsGrid.innerHTML = "";
        noListings.style.display = "block";
        return;
    }

    noListings.style.display = "none";

    listingsGrid.innerHTML = filtered.map(item => {
        const priceNum = Number(item.price || 0);
        const priceFormatted = priceNum.toLocaleString() + " TZS";

        const hasUserImage = item.imageUrl && (item.imageUrl.trim().startsWith("http") || item.imageUrl.trim().startsWith("data:image"));
        const cleanImgUrl = hasUserImage ? item.imageUrl.replace(/'/g, "\\'") : "";

        const imageElement = hasUserImage
            ? `<img src="${item.imageUrl}" alt="${item.title}" onclick="openImageViewerModal('${cleanImgUrl}')">`
            : `<div class="placeholder-no-img"><i class="fas fa-drumstick-bite"></i><span>Picha haijatumiwa</span></div>`;

        const phone = item.farmerPhone || "0680234423";
        const safeTitle = escapeHtml(item.title || '');
        const safeFarmer = escapeHtml(item.farmerName || 'Mfugaji');

        return `
            <div class="listing-card">
                <div class="listing-img" title="Bonyeza kuangalia picha kamili">
                    ${imageElement}
                </div>
                <div class="listing-body">
                    <span class="listing-qty">${item.category || 'Kuku'} • Idadi: ${item.quantity || '1'}</span>
                    <h3 class="listing-title">${item.title || 'Tangazo la Kuku'}</h3>
                    <div class="listing-price-row">
                        <span class="listing-price">${priceFormatted}</span>
                    </div>
                    <div class="listing-location">
                        <i class="fas fa-map-marker-alt"></i> ${item.location || 'Tanzania'}
                    </div>
                    <div class="listing-farmer">
                        Muuzaji: <strong>${item.farmerName || 'Mfugaji'}</strong>
                    </div>
                    <div class="listing-actions">
                        <button class="order-btn-action" onclick="openOrderModal('${item.id || ''}', '${safeTitle}', ${priceNum})">
                            <i class="fas fa-shopping-cart"></i> Oda
                        </button>
                        <button class="contact-btn-action" onclick="openContactModal('${phone}', '${safeTitle}', '${safeFarmer}')" title="Mawasiliano">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Open Full Image Viewer Modal
window.openImageViewerModal = function(imageUrl) {
    if (!imageUrl) return;
    fullImageViewerImg.src = imageUrl;
    imageViewerModal.style.display = "flex";
};

if (closeImageViewerModal) {
    closeImageViewerModal.addEventListener("click", () => {
        imageViewerModal.style.display = "none";
    });
}

// Utility to escape HTML strings
function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Open Contact Choice Modal (Piga Simu / WhatsApp)
window.openContactModal = function(phone, title, farmerName) {
    const mainPhone = "0680234423";
    const intPhone = "255680234423";

    contactPhoneDisplay.innerText = mainPhone;
    if (farmerName && farmerName !== 'Admin') {
        contactChoiceSub.innerText = `Kuwasiliana na ${farmerName} (${title || 'Kuku'}):`;
    } else {
        contactChoiceSub.innerText = `Kuwasiliana na Winga Machachali Support (${mainPhone}):`;
    }

    btnCallPhone.innerHTML = `<i class="fas fa-phone-alt"></i> Piga Simu (0680234423)`;
    btnCallPhone.onclick = function() {
        window.location.href = 'tel:' + mainPhone;
    };

    const msg = encodeURIComponent(`Habari, ninaulizia kuhusu tangazo la "${title || 'Kuku'}" kwenye Winga Machachali.`);
    btnOpenWhatsapp.innerHTML = `<i class="fab fa-whatsapp"></i> WhatsApp (0680234423)`;
    btnOpenWhatsapp.href = `https://wa.me/${intPhone}?text=${msg}`;

    contactChoiceModal.style.display = "flex";
};

if (closeContactChoiceModal) {
    closeContactChoiceModal.addEventListener("click", () => {
        contactChoiceModal.style.display = "none";
    });
}

// Open Order Modal
window.openOrderModal = function(id, title, price) {
    orderChickenId.value = id;
    orderChickenTitleHidden.value = title;
    orderPricePerUnit.value = price;
    orderItemTitle.innerText = title;
    orderItemPrice.innerText = Number(price).toLocaleString() + " TZS";
    orderQuantity.value = 1;
    updateTotalPricePreview();
    orderModal.style.display = "flex";
};

// Update Order Total Preview
function updateTotalPricePreview() {
    const unitPrice = parseFloat(orderPricePerUnit.value) || 0;
    const qty = parseInt(orderQuantity.value) || 1;
    const total = unitPrice * qty;
    orderTotalPricePreview.innerText = total.toLocaleString() + " TZS";
}

orderQuantity.addEventListener("input", updateTotalPricePreview);

closeOrderModal.addEventListener("click", () => {
    orderModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === orderModal) {
        orderModal.style.display = "none";
    }
    if (e.target === contactChoiceModal) {
        contactChoiceModal.style.display = "none";
    }
    if (e.target === imageViewerModal) {
        imageViewerModal.style.display = "none";
    }
    if (e.target === adminDashboardModal) {
        adminDashboardModal.style.display = "none";
    }
    if (e.target === cartModal) {
        cartModal.style.display = "none";
    }
});

// Submit Order to Firestore "orders" collection
orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = orderChickenId.value;
    const title = orderChickenTitleHidden.value;
    const unitPrice = parseFloat(orderPricePerUnit.value) || 0;
    const name = document.getElementById("orderCustomerName").value;
    const phone = document.getElementById("orderCustomerPhone").value || "0680234423";
    const location = document.getElementById("orderCustomerLocation").value;
    const qty = document.getElementById("orderQuantity").value;
    const totalPrice = unitPrice * (parseInt(qty) || 1);

    // Save user phone locally for orders history tracking
    localStorage.setItem("winga_user_phone", phone);

    const generatedOrderId = "WEB-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const orderData = {
        orderId: generatedOrderId,
        chickenTitle: title,
        chickenId: id,
        pricePerUnit: unitPrice,
        quantity: qty.toString(),
        totalPrice: totalPrice,
        customerName: name,
        customerPhone: phone,
        customerLocation: location,
        status: "Pending",
        createdAt: Date.now()
    };

    try {
        await setDoc(doc(db, "orders", generatedOrderId), orderData);
        alert("Oda yako imetumwa kwa mafanikio! Admin ataiona kwenye App na kuifanyia kazi mara moja.");
        orderForm.reset();
        orderModal.style.display = "none";
    } catch (error) {
        console.error("Error creating order:", error);
        alert("Imeshindikana kutuma oda. Tafadhali jaribu tena.");
    }
});

// Search Event Listeners with Secret Passcode Trigger -> Opens Admin Dashboard DIRECTLY
searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    clearSearch.style.display = currentSearchQuery ? "block" : "none";

    const cleanedQuery = currentSearchQuery.trim().replace(/\s+/g, '+');

    if (cleanedQuery === "019+02005+01+017" || cleanedQuery.includes("019+02005+01+017") || currentSearchQuery.replace(/\s/g, '').includes("019+02005+01+017")) {
        searchInput.value = "";
        clearSearch.style.display = "none";
        currentSearchQuery = "";
        renderListings();
        openAdminDashboard(); // Open admin dashboard DIRECTLY with zero secondary PIN prompts!
        return;
    }

    renderListings();
});

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    currentSearchQuery = "";
    clearSearch.style.display = "none";
    renderListings();
});

// Category Chip Event Listeners
categoriesFilter.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
        categoriesFilter.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentCategory = chip.getAttribute("data-category");
        renderListings();
    });
});

// Post Listing Form Handler
if (postChickenForm) {
    postChickenForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("postTitle").value;
        const category = document.getElementById("postCategory").value;
        const price = parseFloat(document.getElementById("postPrice").value) || 0;
        const quantity = document.getElementById("postQuantity").value;
        const location = document.getElementById("postLocation").value;
        const farmerName = document.getElementById("postFarmerName").value;
        const farmerPhone = document.getElementById("postFarmerPhone").value || "0680234423";
        const description = document.getElementById("postDescription").value;

        const finalImageUrl = uploadedImageBase64 || "";

        const newListing = {
            title,
            category,
            price,
            quantity,
            location,
            imageUrl: finalImageUrl,
            farmerName,
            farmerPhone,
            description,
            datePosted: Date.now(),
            hiddenForUser: false
        };

        try {
            await addDoc(collection(db, "chickens"), newListing);
            alert("Tangazo limechapishwa kwa mafanikio pamoja na picha yako! Sasa linaonekana kwenye App na Website.");
            postChickenForm.reset();
            uploadedImageBase64 = "";
            if (imagePreviewBox) imagePreviewBox.style.display = "none";
            if (imagePreviewImg) imagePreviewImg.src = "";
            initFirestoreListener();
            document.getElementById("marketplace").scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Kimetokea kitu kibaya wakati wa kuchapisha tangazo. Tafadhali jaribu tena.");
        }
    });
}

// Initialize on load
trackVisitorAnalytics();
initFirestoreListener();
