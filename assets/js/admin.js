/**
 * DigitalHub Computer - Admin Workspace Core Engine
 * Architecture: Clean Client-Side Firewall, Secure Dom Element Factories (Anti-XSS Frameworks).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. GATEWAY MIDDLEWARE SECURITY CHECK
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // 2. RUNTIME PIPELINE INITIALIZATION
    refreshStatisticsDashboard();
    renderProductsTableRegistry();
    renderOrdersTableRegistry();

    // 3. EVENT LISTENER REGISTRATION CENTRAL
    setupAdminActionInteractions();
});

// ==========================================================
// UTILITY HELPERS
// ==========================================================
const formatCurrencyToIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

function refreshStatisticsDashboard() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    document.getElementById('statTotalProducts').textContent = products.length;
    document.getElementById('statTotalOrders').textContent = orders.length;
    document.getElementById('statTotalUsers').textContent = users.length;
}

// ==========================================================
// CORE CRUD PRODUCTS REGISTRY CONTROLLER
// ==========================================================
function renderProductsTableRegistry() {
    const tableBody = document.getElementById('productTableBody');
    tableBody.textContent = ''; // Safe wipe elements fragment

    const products = JSON.parse(localStorage.getItem('products')) || [];

    if (products.length === 0) {
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '6');
        td.style.textAlign = 'center';
        td.style.color = '#86868b';
        td.textContent = 'Inventory database records are currently empty.';
        row.appendChild(td);
        tableBody.appendChild(row);
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');

        // Image TD
        const tdImg = document.createElement('td');
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        img.className = 'table-img';
        img.loading = 'lazy';
        tdImg.appendChild(img);

        // Details TD
        const tdDetails = document.createElement('td');
        const wrapperDiv = document.createElement('div');
        const bTitle = document.createElement('strong');
        bTitle.style.display = 'block';
        bTitle.style.color = '#14213D';
        bTitle.textContent = product.name;
        const spanBrand = document.createElement('span');
        spanBrand.style.fontSize = '0.8rem';
        spanBrand.style.color = '#86868b';
        spanBrand.textContent = `Brand: ${product.brand}`;
        wrapperDiv.append(bTitle, spanBrand);
        tdDetails.appendChild(wrapperDiv);

        // Category TD
        const tdCat = document.createElement('td');
        tdCat.textContent = product.category;

        // Price TD
        const tdPrice = document.createElement('td');
        tdPrice.style.fontWeight = '700';
        tdPrice.textContent = formatCurrencyToIDR(product.price);

        // Stock TD
        const tdStock = document.createElement('td');
        tdStock.textContent = `${product.stock} units`;

        // Actions Dynamic Bindings TD
        const tdActions = document.createElement('td');
        const actionGroup = document.createElement('div');
        actionGroup.className = 'action-btn-group';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn btn-edit';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => openFormModalWorkflow('edit', product));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => executeProductDeletionLifecycle(product.id));

        actionGroup.append(editBtn, deleteBtn);
        tdActions.appendChild(actionGroup);

        // Assemble Row Node Elements Tree
        tr.append(tdImg, tdDetails, tdCat, tdPrice, tdStock, tdActions);
        tableBody.appendChild(tr);
    });
}

function executeProductDeletionLifecycle(productId) {
    Swal.fire({
        title: 'Purge Inventory Record?',
        text: 'Are you sure you want to permanently delete this hardware item setup?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff3b30',
        cancelButtonColor: '#14213D',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            let products = JSON.parse(localStorage.getItem('products')) || [];
            products = products.filter(p => p.id !== productId);
            localStorage.setItem('products', JSON.stringify(products));

            refreshStatisticsDashboard();
            renderProductsTableRegistry();

            Swal.fire('Deleted Successfully!', 'Hardware asset has been purged from array records.', 'success');
        }
    });
}

// ==========================================================
// CUSTOMER TRANSACTION STATUS CONTROLLER 
// ==========================================================
function renderOrdersTableRegistry() {
    const tableBody = document.getElementById('orderTableBody');
    tableBody.textContent = ''; // Flush DOM secure node matrix tree

    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Sorting Descending timestamp
    orders.sort((a, b) => Number(b.id_order) - Number(a.id_order));

    if (orders.length === 0) {
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '6');
        td.style.textAlign = 'center';
        td.style.color = '#86868b';
        td.textContent = 'No transaction logs filed inside local storage matrices.';
        row.appendChild(td);
        tableBody.appendChild(row);
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');

        // Invoice ID TD
        const tdInvoice = document.createElement('td');
        tdInvoice.className = 'invoice-text';
        tdInvoice.style.fontSize = '0.95rem';
        tdInvoice.textContent = order.invoice;

        // Date Timestamp TD
        const tdDate = document.createElement('td');
        tdDate.style.fontSize = '0.85rem';
        tdDate.style.color = '#86868b';
        tdDate.textContent = order.date;

        // Customer Details Info TD
        const tdCust = document.createElement('td');
        const divCust = document.createElement('div');
        const nameStrong = document.createElement('strong');
        nameStrong.textContent = order.customer_info.name;
        const addressP = document.createElement('p');
        addressP.style.margin = '4px 0 0 0';
        addressP.style.fontSize = '0.8rem';
        addressP.style.color = '#86868b';
        addressP.textContent = `${order.customer_info.phone} | ${order.customer_info.address}`;
        divCust.append(nameStrong, addressP);
        tdCust.appendChild(divCust);

        // Total Amount Value TD
        const tdAmount = document.createElement('td');
        tdAmount.style.fontWeight = '700';
        tdAmount.textContent = formatCurrencyToIDR(order.total_price);

        // Status Badge Dynamic Rendering Matrix TD
        const tdBadge = document.createElement('td');
        const badgeSpan = document.createElement('span');
        badgeSpan.className = `status-badge badge-${order.status.toLowerCase()}`;
        badgeSpan.textContent = order.status;
        tdBadge.appendChild(badgeSpan);

        // Dropdown Status Transition Select Controller TD
        const tdControl = document.createElement('td');
        const selectNode = document.createElement('select');
        selectNode.className = 'status-select';

        const trackingStatusOptions = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai'];
        trackingStatusOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (opt === order.status) option.selected = true;
            selectNode.appendChild(option);
        });

        // Trigger mutation event handlers pipeline changes
        selectNode.addEventListener('change', (e) => {
            executeOrderStatusTransitionCommit(order.id_order, e.target.value);
        });
        tdControl.appendChild(selectNode);

        // Assemble structural fragments sequence rows
        tr.append(tdInvoice, tdDate, tdCust, tdAmount, tdBadge, tdControl);
        tableBody.appendChild(tr);
    });
}

function executeOrderStatusTransitionCommit(orderId, newStatus) {
    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const targetedIndex = allOrders.findIndex(o => o.id_order === orderId);

    if (targetedIndex > -1) {
        allOrders[targetedIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(allOrders));

        // Re-render only rows framework pipelines
        renderOrdersTableRegistry();

        // Trigger SweetAlert2 Notif Success Toast
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Invoice tracking status committed to: ${newStatus}`,
            showConfirmButton: false,
            timer: 2000
        });
    }
}

// ==========================================================
// MODAL WORKFLOW & FORM HANDLERS INTERACTION
// ==========================================================
const modalOverlay = document.getElementById('productModalOverlay');
const productForm = document.getElementById('productForm');

function openFormModalWorkflow(mode = 'add', targetProduct = null) {
    productForm.reset(); // Wipe values baseline
    document.getElementById('formProductId').value = '';

    const titleHeader = document.getElementById('modalTemplateTitle');

    if (mode === 'edit' && targetProduct) {
        titleHeader.textContent = 'Edit Asset Configuration';
        document.getElementById('formProductId').value = targetProduct.id;
        document.getElementById('formProdName').value = targetProduct.name;
        document.getElementById('formProdBrand').value = targetProduct.brand;
        document.getElementById('formProdCategory').value = targetProduct.category;
        document.getElementById('formProdPrice').value = targetProduct.price;
        document.getElementById('formProdStock').value = targetProduct.stock;
        document.getElementById('formProdImage').value = targetProduct.image;
        document.getElementById('formProdDesc').value = targetProduct.description;
    } else {
        titleHeader.textContent = 'Add Product Configuration';
    }

    modalOverlay.classList.add('active');
}

function closeFormModalWorkflow() {
    modalOverlay.classList.remove('active');
    productForm.reset();
}

function setupAdminActionInteractions() {
    // Top fixed navigation layout filters view triggers 
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Form Modals Open Buttons
    document.getElementById('openAddModalBtn').addEventListener('click', () => openFormModalWorkflow('add'));
    document.getElementById('closeModalBtn').addEventListener('click', closeFormModalWorkflow);
    document.getElementById('cancelFormBtn').addEventListener('click', closeFormModalWorkflow);

    // REVISI: Logika Navigasi Smooth Scrolling Sidebar (Menampilkan Semua Section)
    const menuDash = document.getElementById('menuDashLink');
    const menuProd = document.getElementById('menuProdLink');
    const menuOrder = document.getElementById('menuOrderLink');

    const secProd = document.getElementById('productsManagementSection');
    const secOrder = document.getElementById('ordersManagementSection');
    const gridStats = document.querySelector('.stats-bento-grid');

    if (menuDash && menuProd && menuOrder) {
        // Pastikan semua panel ter-display secara penuh
        if (gridStats) gridStats.style.display = 'grid';
        if (secProd) secProd.style.display = 'block';
        if (secOrder) secOrder.style.display = 'block';

        function scrollToSection(activeLink, targetElement) {
            // Ubah indikator link aktif di sidebar
            [menuDash, menuProd, menuOrder].forEach(link => link.classList.remove('active'));
            activeLink.classList.add('active');

            // Gulir layar ke area yang dituju
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Gulir paling atas untuk Dashboard Stats
            }
        }

        menuDash.addEventListener('click', (e) => { e.preventDefault(); scrollToSection(menuDash, null); });
        menuProd.addEventListener('click', (e) => { e.preventDefault(); scrollToSection(menuProd, secProd); });
        menuOrder.addEventListener('click', (e) => { e.preventDefault(); scrollToSection(menuOrder, secOrder); });
    }

    // Form Event Submit Lifecycle Listener
    productForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop native refresh mutations pipelines

        const idValue = document.getElementById('formProductId').value;
        const nameValue = document.getElementById('formProdName').value.trim();
        const brandValue = document.getElementById('formProdBrand').value.trim();
        const catValue = document.getElementById('formProdCategory').value;
        const priceValue = Number(document.getElementById('formProdPrice').value);
        const stockValue = Number(document.getElementById('formProdStock').value);
        const imgValue = document.getElementById('formProdImage').value.trim();
        const descValue = document.getElementById('formProdDesc').value.trim();

        // Strict client fields checks verification bounds
        if (!nameValue || !brandValue || !imgValue || !descValue || priceValue < 0 || stockValue < 0) {
            Swal.fire('Validation Error', 'Please complete all required forms with realistic value fields.', 'error');
            return;
        }

        let products = JSON.parse(localStorage.getItem('products')) || [];

        if (idValue) {
            // Mode: Update Existing Object Configurations
            const matchIdx = products.findIndex(p => p.id === idValue);
            if (matchIdx > -1) {
                products[matchIdx] = {
                    id: idValue,
                    name: nameValue,
                    brand: brandValue,
                    category: catValue,
                    price: priceValue,
                    stock: stockValue,
                    image: imgValue,
                    description: descValue
                };
            }
        } else {
            // Mode: Insert Brand New Mapping Object Configurations
            const newProduct = {
                id: 'prod-' + Date.now(),
                name: nameValue,
                brand: brandValue,
                category: catValue,
                price: priceValue,
                stock: stockValue,
                image: imgValue,
                description: descValue
            };
            products.push(newProduct);
        }

        localStorage.setItem('products', JSON.stringify(products));

        // Re-orchestrate tracking logs and data views refresh pipelines
        refreshStatisticsDashboard();
        renderProductsTableRegistry();
        closeFormModalWorkflow();

        Swal.fire('Data Committed!', 'Product registry changes successfully applied to operational memory repositories.', 'success');
    });
}