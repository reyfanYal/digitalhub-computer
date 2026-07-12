/**
 * DigitalHub Computer - Order & Checkout Interactive Logic
 * ES6+ standard with strict XSS prevention (Pure DOM Architecture) and local storage bindings.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. MIDDLEWARE: Proteksi Client-Side Role User
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'user') {
        window.location.href = 'login.html';
        return;
    }

    // Identifikasi routing halaman berdasarkan id form/container
    const checkoutForm = document.getElementById('checkoutForm');
    const historyContainer = document.getElementById('historyContainer');

    if (checkoutForm) {
        initCheckoutSystem(currentUser, checkoutForm);
    }

    if (historyContainer) {
        initOrderHistorySystem(currentUser, historyContainer);
    }
});

// ==========================================================
// UTILITAS BERSAMA
// ==========================================================

const formatCurrencyIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

// ==========================================================
// MODUL CHECKOUT (READ CART, VALIDATE, SUBMIT TO ORDERS)
// ==========================================================

const initCheckoutSystem = (user, formElement) => {
    const carts = JSON.parse(localStorage.getItem('cart')) || [];
    const userCart = carts.filter(item => item.user_id === user.id);

    // Proteksi: Jika keranjang kosong, lemparkan kembali ke cart.html
    if (userCart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    const itemsListContainer = document.getElementById('checkoutItemsList');
    const subtotalDisplay = document.getElementById('checkoutSubtotal');
    const grandTotalDisplay = document.getElementById('checkoutGrandTotal');
    let calculatedSubtotal = 0;

    // Render Ringkasan Belanja ke Kolom Kanan (Aman dari XSS)
    userCart.forEach(item => {
        const lineTotal = item.price * item.quantity;
        calculatedSubtotal += lineTotal;

        const row = document.createElement('div');
        row.className = 'summary-item-row';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.className = 'summary-img';

        const infoDiv = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'summary-info-title';
        title.textContent = item.name;
        const qty = document.createElement('div');
        qty.className = 'summary-info-qty';
        qty.textContent = `${item.quantity} x ${formatCurrencyIDR(item.price)}`;
        infoDiv.append(title, qty);

        const priceDiv = document.createElement('div');
        priceDiv.className = 'summary-price';
        priceDiv.textContent = formatCurrencyIDR(lineTotal);

        row.append(img, infoDiv, priceDiv);
        itemsListContainer.appendChild(row);
    });

    // Tarik Diskon Promo Jika Aktif
    let finalGrandTotal = calculatedSubtotal;
    const isPromoApplied = localStorage.getItem('activePromo') === 'HUB2026';

    if (isPromoApplied) {
        const discountAmount = calculatedSubtotal * 0.10;
        finalGrandTotal = calculatedSubtotal - discountAmount;

        const discRow = document.getElementById('checkoutDiscountRow');
        const discAmount = document.getElementById('checkoutDiscountAmount');
        if (discRow) {
            discRow.style.display = 'flex';
            discAmount.textContent = `- ${formatCurrencyIDR(discountAmount)}`;
        }
    }

    if (subtotalDisplay) subtotalDisplay.textContent = formatCurrencyIDR(calculatedSubtotal);
    if (grandTotalDisplay) grandTotalDisplay.textContent = formatCurrencyIDR(finalGrandTotal);


    // ==========================================
    // REVISI: REAL-TIME INLINE VALIDATION
    // ==========================================
    const inputName = document.getElementById('receiverName');
    const errName = document.getElementById('nameError');

    const inputPhone = document.getElementById('receiverPhone');
    const errPhone = document.getElementById('phoneError');

    const inputAddr = document.getElementById('receiverAddress');
    const errAddr = document.getElementById('addressError');

    // Fungsi pengatur UI Error
    const toggleErrorUI = (inputEl, errorEl, hasError, msg) => {
        if (hasError) {
            inputEl.classList.add('input-error');
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        } else {
            inputEl.classList.remove('input-error');
            errorEl.style.display = 'none';
        }
    };

    // 1. Validasi Nama Real-time (Sambil diketik)
    inputName.addEventListener('input', (e) => {
        const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
        // Tampilkan error jika user sudah mengetik tapi belum sampai 4 kata
        const hasError = words.length > 0 && words.length < 4;
        toggleErrorUI(e.target, errName, hasError, `Nama harus minimal 4 kata (baru ${words.length} kata)`);
    });

    // 2. Validasi Nomor HP Real-time (Sambil diketik & Cegah Huruf)
    inputPhone.addEventListener('input', (e) => {
        let val = e.target.value;
        const phoneRegex = /^[0-9]*$/;

        // Mencegah dan menghapus langsung jika ada karakter selain angka (Anti-Text)
        if (!phoneRegex.test(val)) {
            val = val.replace(/[^0-9]/g, '');
            e.target.value = val;
            toggleErrorUI(e.target, errPhone, true, 'Nomor HP hanya boleh diisi angka murni.');
        } else {
            toggleErrorUI(e.target, errPhone, false, '');
        }
    });

    // 3. Validasi Alamat Real-time (Sambil diketik)
    inputAddr.addEventListener('input', (e) => {
        const words = e.target.value.trim().split(/\s+/).filter(w => w.length > 0);
        const hasError = words.length > 0 && words.length < 12;
        toggleErrorUI(e.target, errAddr, hasError, `Alamat kurang detail, harus minimal 12 kata (baru ${words.length} kata)`);
    });


    // ==========================================
    // HANDLE FORM SUBMISSION (FINAL CHECK)
    // ==========================================
    formElement.addEventListener('submit', (e) => {
        e.preventDefault(); // Cegah reload halaman

        const nameVal = inputName.value.trim();
        const phoneVal = inputPhone.value.trim();
        const addressVal = inputAddr.value.trim();
        const notesVal = document.getElementById('orderNotes').value.trim();
        const paymentMethod = document.getElementById('paymentMethod').value;

        const nameWords = nameVal.split(/\s+/).filter(word => word.length > 0);
        const addressWords = addressVal.split(/\s+/).filter(word => word.length > 0);

        // Final Barrier: Jika lolos ketikan, tetap dicek saat klik tombol
        if (nameWords.length < 4 || !/^[0-9]+$/.test(phoneVal) || addressWords.length < 12) {
            Swal.fire({
                icon: 'error',
                title: 'Data Belum Lengkap',
                text: 'Mohon periksa kembali kolom berwarna merah. Data pengiriman belum memenuhi syarat.',
                confirmButtonColor: '#14213D'
            });
            // Triggers UI Error Color manually if empty
            if (nameWords.length < 4) toggleErrorUI(inputName, errName, true, 'Nama harus minimal 4 kata');
            if (!/^[0-9]+$/.test(phoneVal)) toggleErrorUI(inputPhone, errPhone, true, 'Nomor wajib diisi angka');
            if (addressWords.length < 12) toggleErrorUI(inputAddr, errAddr, true, 'Alamat harus minimal 12 kata');
            return;
        }

        const customerInfo = {
            name: nameVal,
            phone: phoneVal,
            address: addressVal,
            notes: notesVal
        };

        // Generator Invoice
        const dateObj = new Date();
        const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
        const randomChar = Math.random().toString(36).substring(2, 6).toUpperCase();
        const invoiceNumber = `INV-${dateStr}-${randomChar}`;

        // Konstruksi Pesanan
        const newOrder = {
            id_order: Date.now().toString(),
            invoice: invoiceNumber,
            user_id: user.id,
            customer_info: customerInfo,
            payment_method: paymentMethod,
            items: userCart,
            total_price: finalGrandTotal,
            status: 'Menunggu',
            date: dateObj.toLocaleString('id-ID')
        };

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Kurangi Stok Asli di Database Produk
        let productsDB = JSON.parse(localStorage.getItem('products')) || [];
        userCart.forEach(cartItem => {
            const productIndex = productsDB.findIndex(p => p.id === cartItem.product_id);
            if (productIndex > -1) {
                productsDB[productIndex].stock -= cartItem.quantity;
                if (productsDB[productIndex].stock < 0) productsDB[productIndex].stock = 0;
            }
        });
        localStorage.setItem('products', JSON.stringify(productsDB));

        // Bersihkan Keranjang & Promo
        const remainingCarts = carts.filter(item => item.user_id !== user.id);
        localStorage.setItem('cart', JSON.stringify(remainingCarts));
        localStorage.removeItem('activePromo');

        // Sukses Redirect
        Swal.fire({
            icon: 'success',
            title: 'Pesanan Berhasil Dibuat!',
            text: `Nomor Invoice Anda: ${invoiceNumber}`,
            confirmButtonColor: '#14213D'
        }).then(() => {
            window.location.href = 'riwayat.html';
        });
    });
};

// ==========================================================
// MODUL RIWAYAT PESANAN
// ==========================================================

const initOrderHistorySystem = (user, containerElement) => {
    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = allOrders.filter(order => order.user_id === user.id);

    userOrders.sort((a, b) => Number(b.id_order) - Number(a.id_order));
    containerElement.textContent = '';

    if (userOrders.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.gridColumn = '1 / -1';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '40px';
        emptyMsg.style.color = '#86868b';
        emptyMsg.textContent = 'Anda belum memiliki riwayat transaksi pesanan.';
        containerElement.appendChild(emptyMsg);
        return;
    }

    userOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'history-card';

        const header = document.createElement('div');
        header.className = 'history-header';

        const invoiceWrap = document.createElement('div');
        const invTitle = document.createElement('div');
        invTitle.className = 'invoice-text';
        invTitle.textContent = order.invoice;
        const dateText = document.createElement('div');
        dateText.className = 'history-date';
        dateText.textContent = order.date;
        invoiceWrap.append(invTitle, dateText);

        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge badge-${order.status.toLowerCase()}`;
        statusBadge.textContent = order.status;

        header.append(invoiceWrap, statusBadge);

        const bodyPreview = document.createElement('div');
        bodyPreview.className = 'history-items-preview';

        order.items.forEach((item, idx) => {
            if (idx < 2) {
                const itemRow = document.createElement('div');
                itemRow.className = 'history-item-line';
                itemRow.textContent = `${item.quantity}x ${item.name}`;
                bodyPreview.appendChild(itemRow);
            }
        });

        if (order.items.length > 2) {
            const moreItemsText = document.createElement('em');
            moreItemsText.style.display = 'block';
            moreItemsText.style.marginTop = '4px';
            moreItemsText.style.color = '#86868b';
            moreItemsText.textContent = `...dan ${order.items.length - 2} produk lainnya`;
            bodyPreview.appendChild(moreItemsText);
        }

        const footer = document.createElement('div');
        footer.className = 'history-footer';

        const payMethod = document.createElement('div');
        payMethod.style.fontSize = '0.85rem';
        payMethod.style.color = '#86868b';
        payMethod.textContent = `Pembayaran: ${order.payment_method}`;

        const grandTotal = document.createElement('div');
        grandTotal.className = 'history-total-price';
        grandTotal.textContent = formatCurrencyIDR(order.total_price);

        footer.append(payMethod, grandTotal);

        card.append(header, bodyPreview, footer);
        containerElement.appendChild(card);
    });
};