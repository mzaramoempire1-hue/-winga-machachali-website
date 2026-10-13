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
let uploadedImageBase64 = ""; // Holds uploaded image Data URL

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

// Contact Choice Modal Elements (Piga Simu / WhatsApp)
const contactChoiceModal = document.getElementById("contactChoiceModal");
const closeContactChoiceModal = document.getElementById("closeContactChoiceModal");
const contactChoiceSub = document.getElementById("contactChoiceSub");
const contactPhoneDisplay = document.getElementById("contactPhoneDisplay");
const btnCallPhone = document.getElementById("btnCallPhone");
const btnOpenWhatsapp = document.getElementById("btnOpenWhatsapp");

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

// Handle Image File Upload & Compression
if (postImageFile) {
    postImageFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                // Compress & resize image before saving Base64
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
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
                ctx.drawImage(img, 0, 0, width, height);

                uploadedImageBase64 = canvas.toDataURL("image/jpeg", 0.7);
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

        // Show ONLY the user-uploaded image (HTTP URL or Data URL Base64).
        const hasUserImage = item.imageUrl && (item.imageUrl.trim().startsWith("http") || item.imageUrl.trim().startsWith("data:image"));
        const imageElement = hasUserImage
            ? `<img src="${item.imageUrl}" alt="${item.title}">`
            : `<div class="placeholder-no-img"><i class="fas fa-drumstick-bite"></i><span>Picha haijatumiwa</span></div>`;

        // Always prioritize main support number 0680234423 if none specified
        const phone = item.farmerPhone || "0680234423";
        const safeTitle = escapeHtml(item.title || '');
        const safeFarmer = escapeHtml(item.farmerName || 'Mfugaji');

        return `
            <div class="listing-card">
                <div class="listing-img">
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

// Utility to escape HTML strings
function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Open Contact Choice Modal (Piga Simu / WhatsApp)
window.openContactModal = function(phone, title, farmerName) {
    // Both Piga Simu & WhatsApp default to 0680234423
    const mainPhone = "0680234423";
    const intPhone = "255680234423";

    contactPhoneDisplay.innerText = mainPhone;
    if (farmerName && farmerName !== 'Admin') {
        contactChoiceSub.innerText = `Kuwasiliana na ${farmerName} (${title || 'Kuku'}):`;
    } else {
        contactChoiceSub.innerText = `Kuwasiliana na Winga Machachali Support (${mainPhone}):`;
    }

    // Direct phone call button (0680234423)
    btnCallPhone.innerHTML = `<i class="fas fa-phone-alt"></i> Piga Simu (0680234423)`;
    btnCallPhone.onclick = function() {
        window.location.href = 'tel:' + mainPhone;
    };

    // WhatsApp button (0680234423)
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
        const farmerName = document.getElementById("postFarmerName").value;
        const farmerPhone = document.getElementById("postFarmerPhone").value || "0680234423";
        const description = document.getElementById("postDescription").value;

        // Use uploaded image base64
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
initFirestoreListener();
