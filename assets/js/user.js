/**
 * DigitalHub Computer - User & Cart Interactive Logic
 * ES6+ standard with strict XSS prevention and local storage bindings.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. MIDDLEWARE: Proteksi Client-Side
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'user') {
        window.location.href = 'login.html';
        return; // Hentikan eksekusi script selanjutnya
    }

    // 2. NAVIGASI: Logika Hamburger Menu
    setupHamburgerMenu();

    // Identifikasi halaman aktif berdasarkan keberadaan elemen DOM
    const isDashboard = document.getElementById('productGrid') !== null;
    const isCart = document.getElementById('cartContainer') !== null;

    if (isDashboard) {
        initDashboard(currentUser);
    }

    if (isCart) {
        initCart(currentUser);
    }

    // Fitur Global: Update Badge Cart & Logout
    updateCartBadge(currentUser.id);
    setupLogout();
});

// ==========================================================
// UTILITAS GLOBAL
// ==========================================================

const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

const setupLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
};

const updateCartBadge = (userId) => {
    const badge = document.getElementById('cartBadgeCount');
    if (!badge) return;

    const carts = JSON.parse(localStorage.getItem('cart')) || [];
    const userCart = carts.filter(item => item.user_id === userId);

    // Hitung total unit barang
    const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
};

const setupHamburgerMenu = () => {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const navMenuContainer = document.getElementById('navMenuContainer');
    if (menuToggleBtn && navMenuContainer) {
        menuToggleBtn.addEventListener('click', () => {
            navMenuContainer.classList.toggle('show');
        });
    }
};

// ==========================================================
// MODUL DASHBOARD (KATALOG, PENCARIAN, FILTER)
// ==========================================================

const initDashboard = (currentUser) => {
    // Tampilkan Greeting
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) greetingEl.textContent = `Halo, ${currentUser.name}`;

    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Ambil data produk
    const products = JSON.parse(localStorage.getItem('products')) || [];

    // Fungsi Render Produk dengan Proteksi XSS
    const renderProducts = (dataToRender) => {
        if (!productGrid) return;
        productGrid.textContent = ''; // Kosongkan grid

        if (dataToRender.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Produk tidak ditemukan.';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.style.textAlign = 'center';
            productGrid.appendChild(emptyMsg);
            return;
        }

        dataToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.name;
            img.className = 'product-image';

            const category = document.createElement('span');
            category.className = 'product-category';
            category.textContent = product.category;

            const title = document.createElement('h3');
            title.className = 'product-title';
            title.textContent = product.name;

            const price = document.createElement('div');
            price.className = 'product-price';
            price.textContent = formatRupiah(product.price);

            const btnWrapper = document.createElement('div');
            btnWrapper.style.marginTop = 'auto';

            const actionBtn = document.createElement('button');
            actionBtn.className = 'add-to-cart-btn';
            actionBtn.style.width = '100%';

            // PERBAIKAN: Tombol menuju Detail Produk, bukan langsung masuk keranjang
            if (product.stock <= 0) {
                actionBtn.textContent = 'Stok Habis';
                actionBtn.disabled = true;
            } else {
                actionBtn.textContent = 'Lihat Detail';
                actionBtn.addEventListener('click', () => {
                    window.location.href = `product-detail.html?id=${product.id}`;
                });
            }

            btnWrapper.appendChild(actionBtn);

            // Assemble Component
            card.append(img, category, title, price, btnWrapper);
            productGrid.appendChild(card);
        });
    };

    // Filter & Search Logic (Real-time)
    let currentCategory = 'Semua';
    let currentSearch = '';

    const applyFilters = () => {
        const filtered = products.filter(product => {
            const matchCategory = currentCategory === 'Semua' || product.category === currentCategory;
            const matchSearch = product.name.toLowerCase().includes(currentSearch.toLowerCase());
            return matchCategory && matchSearch;
        });
        renderProducts(filtered);
    };

    // Event Listeners Pencarian
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            applyFilters();
        });
    }

    // Event Listeners Kategori
    if (filterBtns) {
        filterBtns.forEach(btn => {
            if (btn.id === 'logoutBtn') return;

            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.getAttribute('data-category');
                applyFilters();
            });
        });
    }

    // Render Awal
    renderProducts(products);
};

// ==========================================================
// MODUL KERANJANG BELANJA (CART, PROMO, REALTIME CALCULATION)
// ==========================================================

const initCart = (currentUser) => {
    const cartContainer = document.getElementById('cartContainer');
    const subtotalEl = document.getElementById('summarySubtotal');
    const grandTotalEl = document.getElementById('summaryGrandTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Elemen Promo
    const promoInput = document.getElementById('promoCodeInput');
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const discountRow = document.getElementById('discountRow');
    const discountEl = document.getElementById('summaryDiscount');

    if (!cartContainer) return;

    const renderCart = () => {
        let carts = JSON.parse(localStorage.getItem('cart')) || [];
        const userCart = carts.filter(item => item.user_id === currentUser.id);

        cartContainer.textContent = ''; // Kosongkan DOM dengan aman

        if (userCart.length === 0) {
            cartContainer.innerHTML = '<p style="text-align:center; color: #86868b;">Keranjang Anda masih kosong.</p>';
            if (subtotalEl) subtotalEl.textContent = formatRupiah(0);
            if (grandTotalEl) grandTotalEl.textContent = formatRupiah(0);
            if (discountRow) discountRow.style.display = 'none';
            return;
        }

        let totalCartPrice = 0;

        userCart.forEach(item => {
            const lineTotal = item.price * item.quantity;
            totalCartPrice += lineTotal;

            const row = document.createElement('div');
            row.className = 'cart-item';

            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;

            const titleWrap = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'cart-item-title';
            title.textContent = item.name;
            const priceUnit = document.createElement('div');
            priceUnit.style.color = '#86868b';
            priceUnit.style.fontSize = '0.9rem';
            priceUnit.textContent = formatRupiah(item.price);
            titleWrap.append(title, priceUnit);

            // Input Quantity
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.className = 'cart-qty-input';
            qtyInput.value = item.quantity;
            qtyInput.min = 1;

            // Logika Validasi & Update Harga Otomatis
            qtyInput.addEventListener('change', (e) => {
                let newQty = parseInt(e.target.value);

                // Ambil batas maksimal stok dari database LocalStorage
                const allProducts = JSON.parse(localStorage.getItem('products')) || [];
                const matchedProduct = allProducts.find(p => p.id === item.product_id);
                const maxStockAvailable = matchedProduct ? matchedProduct.stock : 0;

                if (isNaN(newQty) || newQty <= 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Jumlah tidak valid',
                        text: 'Kuantitas minimal adalah 1.',
                        confirmButtonColor: '#14213D'
                    });
                    newQty = 1;
                    e.target.value = 1;
                } else if (newQty > maxStockAvailable) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Stok Tidak Mencukupi',
                        text: `Maksimal pembelian untuk ${item.name} adalah ${maxStockAvailable} unit.`,
                        confirmButtonColor: '#14213D'
                    });
                    newQty = maxStockAvailable;
                    e.target.value = maxStockAvailable;
                }

                // Update data di local storage
                const itemIndex = carts.findIndex(c => c.user_id === currentUser.id && c.product_id === item.product_id);
                if (itemIndex > -1) {
                    carts[itemIndex].quantity = newQty;
                    localStorage.setItem('cart', JSON.stringify(carts));
                    renderCart();
                }
            });

            const subtotalText = document.createElement('div');
            subtotalText.className = 'cart-item-subtotal';
            subtotalText.textContent = formatRupiah(lineTotal);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.textContent = 'Hapus';
            removeBtn.addEventListener('click', () => {
                Swal.fire({
                    title: 'Hapus Produk?',
                    text: `Apakah Anda yakin ingin menghapus ${item.name} dari keranjang?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#14213D',
                    confirmButtonText: 'Ya, Hapus!',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        carts = carts.filter(c => !(c.user_id === currentUser.id && c.product_id === item.product_id));
                        localStorage.setItem('cart', JSON.stringify(carts));
                        renderCart();
                        updateCartBadge(currentUser.id);
                        Swal.fire('Terhapus!', 'Produk telah dihapus.', 'success');
                    }
                });
            });

            // Susun Komponen Cart Row
            row.append(img, titleWrap, qtyInput, subtotalText, removeBtn);
            cartContainer.appendChild(row);
        });

        // Kalkulasi Diskon Promo
        let isPromoApplied = localStorage.getItem('activePromo') === 'HUB2026';
        let finalGrandTotal = totalCartPrice;

        if (isPromoApplied) {
            const discountAmount = totalCartPrice * 0.10; // Potongan 10%
            finalGrandTotal = totalCartPrice - discountAmount;

            if (discountRow) {
                discountRow.style.display = 'flex';
                discountEl.textContent = `- ${formatRupiah(discountAmount)}`;
            }
            if (promoInput) {
                promoInput.value = 'HUB2026';
                promoInput.disabled = true;
                applyPromoBtn.textContent = 'Terpakai';
                applyPromoBtn.disabled = true;
                applyPromoBtn.style.backgroundColor = '#2a9d8f';
            }
        } else {
            if (discountRow) discountRow.style.display = 'none';
        }

        // Update Summary DOM
        if (subtotalEl) subtotalEl.textContent = formatRupiah(totalCartPrice);
        if (grandTotalEl) grandTotalEl.textContent = formatRupiah(finalGrandTotal);
    };

    renderCart();

    // Event Listener Terapan Promo
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            if (code === 'HUB2026') {
                localStorage.setItem('activePromo', 'HUB2026');
                renderCart(); // Rekalkulasi harga otomatis
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success',
                    title: 'Kode Promo Berhasil Diterapkan!', showConfirmButton: false, timer: 2000
                });
            } else {
                Swal.fire({
                    icon: 'error', title: 'Kode Tidak Valid', text: 'Kode promo salah atau sudah kedaluwarsa.', confirmButtonColor: '#14213D'
                });
            }
        });
    }

    // Validasi dan Navigasi ke Halaman Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const carts = JSON.parse(localStorage.getItem('cart')) || [];
            const userCart = carts.filter(item => item.user_id === currentUser.id);

            if (userCart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Keranjang Anda kosong!',
                    confirmButtonColor: '#14213D'
                });
                return;
            }

            // Alihkan user ke halaman checkout
            window.location.href = 'checkout.html';
        });
    }
};