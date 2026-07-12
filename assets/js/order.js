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
    let calculatedGrandTotal = 0;

    // Render Ringkasan Belanja ke Kolom Kanan (Aman dari XSS)
    userCart.forEach(item => {
        const lineTotal = item.price * item.quantity;
        calculatedGrandTotal += lineTotal;

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

    subtotalDisplay.textContent = formatCurrencyIDR(calculatedGrandTotal);
    grandTotalDisplay.textContent = formatCurrencyIDR(calculatedGrandTotal);

    // Handle Form Submission Checkout
    formElement.addEventListener('submit', (e) => {
        e.preventDefault(); // Cegah reload halaman

        // Ambil Data Form
        const customerInfo = {
            name: document.getElementById('receiverName').value.trim(),
            phone: document.getElementById('receiverPhone').value.trim(),
            address: document.getElementById('receiverAddress').value.trim(),
            notes: document.getElementById('orderNotes').value.trim()
        };
        const paymentMethod = document.getElementById('paymentMethod').value;

        const dateObj = new Date();
        const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
        const randomChar = Math.random().toString(36).substring(2, 6).toUpperCase();
        const invoiceNumber = `INV-${dateStr}-${randomChar}`;

        const newOrder = {
            id_order: Date.now().toString(),
            invoice: invoiceNumber,
            user_id: user.id,
            customer_info: customerInfo,
            payment_method: paymentMethod,
            items: userCart,
            total_price: calculatedGrandTotal,
            status: 'Menunggu',
            date: dateObj.toLocaleString('id-ID')
        };

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));

        // REVISI: Logika Pengurangan Stok pada Produk
        let productsDB = JSON.parse(localStorage.getItem('products')) || [];
        userCart.forEach(cartItem => {
            const productIndex = productsDB.findIndex(p => p.id === cartItem.product_id);
            if (productIndex > -1) {
                // Kurangi stok sebesar kuantitas yang di checkout
                productsDB[productIndex].stock -= cartItem.quantity;
                // Pengamanan fallback jika terjadi kesalahan matematika yang membuatnya minus
                if (productsDB[productIndex].stock < 0) {
                    productsDB[productIndex].stock = 0;
                }
            }
        });
        localStorage.setItem('products', JSON.stringify(productsDB));

        // Bersihkan data cart eksklusif untuk user aktif
        const remainingCarts = carts.filter(item => item.user_id !== user.id);
        localStorage.setItem('cart', JSON.stringify(remainingCarts));

        // Notifikasi Sukses & Redirect
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
// MODUL RIWAYAT PESANAN (REVISED: SECURE XSS-FREE DOM RENDERING)
// ==========================================================

const initOrderHistorySystem = (user, containerElement) => {
    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = allOrders.filter(order => order.user_id === user.id);

    // Sorting Descending (Pesanan terbaru di atas)
    userOrders.sort((a, b) => Number(b.id_order) - Number(a.id_order));

    containerElement.textContent = ''; // Pembersihan DOM mutlak sebelum render

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

        // 1. Header (Invoice & Date)
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

        // 2. Body Preview Items (REVISED: Pure DOM Node Factory, Anti-XSS)
        const bodyPreview = document.createElement('div');
        bodyPreview.className = 'history-items-preview';

        // Render maksimal 2 produk pertama secara aman menggunakan textContent
        order.items.forEach((item, idx) => {
            if (idx < 2) {
                const itemRow = document.createElement('div');
                itemRow.className = 'history-item-line';
                itemRow.textContent = `${item.quantity}x ${item.name}`;
                bodyPreview.appendChild(itemRow);
            }
        });

        // Tambahkan indikator sisa produk jika item di dalam invoice > 2
        if (order.items.length > 2) {
            const moreItemsText = document.createElement('em');
            moreItemsText.style.display = 'block';
            moreItemsText.style.marginTop = '4px';
            moreItemsText.style.color = '#86868b';
            moreItemsText.textContent = `...dan ${order.items.length - 2} produk lainnya`;
            bodyPreview.appendChild(moreItemsText);
        }

        // 3. Footer (Payment Method & Grand Total)
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

        // Assemble Component
        card.append(header, bodyPreview, footer);
        containerElement.appendChild(card);
    });
};