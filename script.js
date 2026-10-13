// Import Firebase SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// DOM Elements
const listingsGrid = document.getElementById("listingsGrid");
const listingsLoading = document.getElementById("listingsLoading");
const noListings = document.getElementById("noListings");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const categoriesFilter = document.getElementById("categoriesFilter");
const postChickenForm = document.getElementById("postChickenForm");

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

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Fetch & Listen to Firestore "chickens" collection
function initFirestoreListener() {
    listingsLoading.style.display = "block";
    listingsGrid.innerHTML = "";
    noListings.style.display = "none";

    const q = query(collection(db, "chickens"), orderBy("datePosted", "desc"));

    getDocs(q).then((snapshot) => {
        allListings = [];
        snapshot.forEach((docSnap) => {
            allListings.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderListings();
    }).catch((error) => {
        console.error("Error fetching listings:", error);
        listingsLoading.style.display = "none";
        noListings.style.display = "block";
        noListings.innerHTML = "<p>Imeshindikana kupakia matangazo. Hakikisha mtandao uko sawa.</p>";
    });
}

// Render Listings based on filters
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
        const imageUrl = item.imageUrl && item.imageUrl.startsWith("http")
            ? item.imageUrl
            : "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80";

        const phone = item.farmerPhone || "0680234423";
        const whatsappMsg = encodeURIComponent(`Habari ${item.farmerName || 'Muuzaji'}, nimeona tangazo lako la "${item.title}" (${priceFormatted}) kwenye Winga Machachali. Bado lipo?`);

        return `
            <div class="listing-card">
                <div class="listing-img">
                    <img src="${imageUrl}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80'">
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
                    <div style="font-size: 0.8rem; color: #aaa; margin-top: 4px;">
                        Muuzaji: <strong>${item.farmerName || 'Mfugaji'}</strong>
                    </div>
                    <div class="listing-actions">
                        <button class="order-btn-action" onclick="openOrderModal('${item.id || ''}', '${escapeHtml(item.title || '')}', ${priceNum})">
                            <i class="fas fa-shopping-cart"></i> Weka Oda
                        </button>
                        <a href="https://wa.me/255${phone.replace(/^0/, '')}?text=${whatsappMsg}" target="_blank" class="whatsapp-btn-action">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Utility to escape HTML strings
function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
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
});

// Submit Order to Firestore "orders" collection
orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = orderChickenId.value;
    const title = orderChickenTitleHidden.value;
    const unitPrice = parseFloat(orderPricePerUnit.value) || 0;
    const name = document.getElementById("orderCustomerName").value;
    const phone = document.getElementById("orderCustomerPhone").value;
    const location = document.getElementById("orderCustomerLocation").value;
    const qty = document.getElementById("orderQuantity").value;
    const totalPrice = unitPrice * (parseInt(qty) || 1);

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

// Search Event Listeners
searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    clearSearch.style.display = currentSearchQuery ? "block" : "none";
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
        const imageUrl = document.getElementById("postImageUrl").value;
        const farmerName = document.getElementById("postFarmerName").value;
        const farmerPhone = document.getElementById("postFarmerPhone").value;
        const description = document.getElementById("postDescription").value;

        const newListing = {
            title,
            category,
            price,
            quantity,
            location,
            imageUrl,
            farmerName,
            farmerPhone,
            description,
            datePosted: Date.now(),
            hiddenForUser: false
        };

        try {
            await addDoc(collection(db, "chickens"), newListing);
            alert("Tangazo limechapishwa kwa mafanikio! Sasa linaonekana kwenye App na Website na Admin ataliona.");
            postChickenForm.reset();
            initFirestoreListener();
            document.getElementById("marketplace").scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Kimetokea kitu kibaya wakati wa kuchapisha tangazo. Tafadhali jaribu tena.");
        }
    });
}

// Initialize on load
initFirestoreListener();
