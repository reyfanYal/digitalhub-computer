/**
 * DigitalHub Computer - Product Detail & Review Engine
 * ES6+, Pure DOM manipulation (XSS Free).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. MIDDLEWARE GUARD
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'user') {
        window.location.href = 'login.html';
        return;
    }

    // 2. TAMPILAN NAVBAR
    document.getElementById('userGreeting').textContent = `Halo, ${currentUser.name}`;
    updateCartBadge(currentUser.id);
    setupLogout();
    setupHamburgerMenu();

    // 3. AMBIL ID PRODUK DARI URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        Swal.fire('Error', 'Produk tidak ditemukan.', 'error').then(() => window.location.href = 'dashboard.html');
        return;
    }

    const allProducts = JSON.parse(localStorage.getItem('products')) || [];
    const productData = allProducts.find(p => p.id === productId);

    if (!productData) {
        Swal.fire('Error', 'Produk tidak ditemukan di database.', 'error').then(() => window.location.href = 'dashboard.html');
        return;
    }

    // 4. INIT RENDER
    renderProductDetail(productData);
    setupActionBox(productData, currentUser);
    setupTabs();
    setupReviews(productData, currentUser);
});

// ==========================================
// RENDER & FUNGSI UTAMA
// ==========================================

const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

function renderProductDetail(product) {
    // Render Teks (Aman dari XSS via textContent)
    document.getElementById('breadCategory').textContent = product.category;
    document.getElementById('breadName').textContent = product.name;
    document.getElementById('detailImage').src = product.image;
    document.getElementById('detailImage').alt = product.name;

    document.getElementById('detailTitle').textContent = product.name;
    document.getElementById('detailBrand').textContent = product.brand;
    document.getElementById('detailPrice').textContent = formatRupiah(product.price);
    document.getElementById('detailStock').textContent = product.stock;
    document.getElementById('detailDescription').textContent = product.description;
}

function setupActionBox(product, user) {
    let currentQty = 1;
    const inputQty = document.getElementById('inputQty');
    const displaySubtotal = document.getElementById('detailSubtotal');
    const btnDecrease = document.getElementById('btnDecrease');
    const btnIncrease = document.getElementById('btnIncrease');
    const btnAddToCart = document.getElementById('btnAddToCart');

    // Cek stok apakah habis
    if (product.stock <= 0) {
        btnAddToCart.textContent = 'Stok Habis';
        btnAddToCart.disabled = true;
        btnAddToCart.style.backgroundColor = '#e5e5ea';
        btnAddToCart.style.color = '#86868b';
        inputQty.value = 0;
        displaySubtotal.textContent = formatRupiah(0);
        return;
    }

    displaySubtotal.textContent = formatRupiah(product.price * currentQty);

    btnIncrease.addEventListener('click', () => {
        if (currentQty < product.stock) {
            currentQty++;
            inputQty.value = currentQty;
            displaySubtotal.textContent = formatRupiah(product.price * currentQty);
        } else {
            Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Batas stok tercapai', showConfirmButton: false, timer: 1500 });
        }
    });

    btnDecrease.addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            inputQty.value = currentQty;
            displaySubtotal.textContent = formatRupiah(product.price * currentQty);
        }
    });

    btnAddToCart.addEventListener('click', () => {
        let carts = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = carts.findIndex(item => item.user_id === user.id && item.product_id === product.id);
        const qtyInCartAlready = existingItemIndex > -1 ? carts[existingItemIndex].quantity : 0;

        // Validasi Ekstra Mencegah Over-Checkout
        if (qtyInCartAlready + currentQty > product.stock) {
            Swal.fire({
                icon: 'error',
                title: 'Stok Terbatas',
                text: `Anda sudah memiliki ${qtyInCartAlready} unit di keranjang. Sisa stok yang bisa ditambah adalah ${product.stock - qtyInCartAlready} unit.`,
                confirmButtonColor: '#14213D'
            });
            return;
        }

        if (existingItemIndex > -1) {
            carts[existingItemIndex].quantity += currentQty;
        } else {
            carts.push({
                user_id: user.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: currentQty,
                image: product.image
            });
        }

        localStorage.setItem('cart', JSON.stringify(carts));
        updateCartBadge(user.id);

        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `${currentQty}x ${product.name} masuk ke keranjang.`,
            showCancelButton: true,
            confirmButtonColor: '#FCA311',
            cancelButtonColor: '#14213D',
            confirmButtonText: 'Lanjut Belanja',
            cancelButtonText: 'Lihat Keranjang'
        }).then((result) => {
            if (!result.isConfirmed) {
                window.location.href = 'cart.html';
            }
        });
    });
}

// ==========================================
// TABS & REVIEW ENGINE
// ==========================================

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function setupReviews(product, user) {
    const reviewListContainer = document.getElementById('reviewsList');
    const reviewCountDisplay = document.getElementById('reviewCount');

    // Fallback jika array reviews belum ada di localStorage product
    if (!product.reviews) product.reviews = [];

    const renderReviews = () => {
        reviewListContainer.textContent = ''; // Aman dari XSS
        reviewCountDisplay.textContent = product.reviews.length;

        if (product.reviews.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Belum ada ulasan untuk produk ini. Jadilah yang pertama!';
            emptyMsg.style.color = '#86868b';
            reviewListContainer.appendChild(emptyMsg);
            return;
        }

        product.reviews.forEach(review => {
            const card = document.createElement('div');
            card.className = 'review-card';

            const name = document.createElement('div');
            name.className = 'reviewer-name';
            name.textContent = review.userName;

            const date = document.createElement('div');
            date.className = 'review-date';
            date.textContent = review.date;

            const text = document.createElement('div');
            text.className = 'review-text';
            text.textContent = review.text; // Render XSS Free

            card.append(name, date, text);
            reviewListContainer.appendChild(card);
        });
    };

    renderReviews();

    // Logika Simpan Review
    document.getElementById('btnSubmitReview').addEventListener('click', () => {
        const textInput = document.getElementById('reviewText').value.trim();

        if (!textInput) {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Ulasan tidak boleh kosong!', showConfirmButton: false, timer: 1500 });
            return;
        }

        const newReview = {
            userName: user.name,
            text: textInput,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        };

        // Simpan ke array reviews milik produk tersebut
        product.reviews.unshift(newReview); // unshift agar ulasan terbaru ada di atas

        // Cari index produk di database utama dan update
        let allProducts = JSON.parse(localStorage.getItem('products')) || [];
        const prodIndex = allProducts.findIndex(p => p.id === product.id);
        if (prodIndex > -1) {
            allProducts[prodIndex] = product;
            localStorage.setItem('products', JSON.stringify(allProducts));
        }

        document.getElementById('reviewText').value = ''; // Reset input
        renderReviews(); // Re-render

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ulasan berhasil dikirim!', showConfirmButton: false, timer: 1500 });
    });
}

// ==========================================
// UTILITY NAVIGASI
// ==========================================

function updateCartBadge(userId) {
    const badge = document.getElementById('cartBadgeCount');
    if (!badge) return;
    const carts = JSON.parse(localStorage.getItem('cart')) || [];
    const userCart = carts.filter(item => item.user_id === userId);
    badge.textContent = userCart.reduce((sum, item) => sum + item.quantity, 0);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}

function setupHamburgerMenu() {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const navMenuContainer = document.getElementById('navMenuContainer');
    if (menuToggleBtn && navMenuContainer) {
        menuToggleBtn.addEventListener('click', () => {
            navMenuContainer.classList.toggle('show');
        });
    }
}