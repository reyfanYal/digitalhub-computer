/**
 * DigitalHub Computer - Core Data Management & DOM Injection
 * Protection: Secured against XSS by avoiding raw innerHTML for user dynamic content.
 */

// 1. DUMMY PRODUCTS INITIALIZATION DATA
const dummyProducts = [
    {
        id: "prod-001",
        name: "Zenith Pro Workstation i9",
        brand: "DigitalHub Elite",
        category: "Workstations",
        price: 24999000,
        stock: 5,
        image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80",
        description: "Ultimate workstation powered by Core i9, 64GB RAM, and Pro Graphics for heavy rendering tasks."
    },
    {
        id: "prod-002",
        name: "Apex Vanguard RTX 4080 RIG",
        brand: "Nexus Gaming",
        category: "Ultimate Gaming",
        price: 38500000,
        stock: 3,
        image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80",
        description: "Pure performance beast. Play any AAA title at maximum settings 4K resolution smoothly."
    },
    {
        id: "prod-003",
        name: "Quantum Mechanical Keyboard v2",
        brand: "HexaType",
        category: "Accessories",
        price: 1850000,
        stock: 25,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        description: "Hot-swappable linear switches with premium PBT keycaps and custom acoustic dampening foam."
    },
    {
        id: "prod-004",
        name: "AeroBlade Liquid Cooler 360",
        brand: "FrostByte",
        category: "Components",
        price: 2250000,
        stock: 12,
        image: "https://images.unsplash.com/photo-1600541519468-4a9127d726fd?auto=format&fit=crop&w=600&q=80",
        description: "High-density aluminum radiator equipped with triple silent ARGB fans for optimal thermal controls."
    },
    {
        id: "prod-005",
        name: "Nova-X Ergonomic Wireless Mouse",
        brand: "SwiftGlide",
        category: "Accessories",
        price: 1200000,
        stock: 18,
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        description: "Ultra-lightweight 59g chassis featuring a flawless 26K DPI optical sensor and 80-hour battery life."
    },
    {
        id: "prod-006",
        name: "Spectra DDR5 RGB 32GB Kit",
        brand: "VoltRAM",
        category: "Components",
        price: 2950000,
        stock: 8,
        image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80",
        description: "Blazing fast 6000MHz memory modules optimized for Intel XMP 3.0 and AMD EXPO profiles."
    }
];

// 2. INITIALIZE LOCALSTORAGE FUNCTION
function initializeDatabase() {
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(dummyProducts));
        console.log('Database Initialization: Success seeding dummy products into LocalStorage.');
    } else {
        console.log('Database Initialization: Products data already verified in LocalStorage.');
    }
}

// 3. SECURE DATA RENDERING ENGINE (XSS-SAFE DOM CREATION)
function formatCurrency(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function renderFeaturedProducts() {
    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;

    // Retrieve fresh data from LocalStorage
    const productsData = JSON.parse(localStorage.getItem('products')) || [];

    // Clear loading placeholder text safely
    container.textContent = '';

    // Dynamically build and inject DOM elements safely
    productsData.forEach(product => {
        // Card Container Element
        const card = document.createElement('div');
        card.classList.add('bento-card', 'product-card');

        // Product Image Wrapper Element
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('product-image-wrapper');
        const img = document.createElement('img');
        img.classList.add('product-image');
        img.src = product.image;
        img.alt = product.name;
        img.loading = "lazy"; // Native performance optimizations
        imgWrapper.appendChild(img);

        // Product Information Group
        const infoGroup = document.createElement('div');

        const brand = document.createElement('p');
        brand.classList.add('product-brand');
        brand.textContent = product.brand;

        const name = document.createElement('h3');
        name.classList.add('product-name');
        name.textContent = product.name;

        const stock = document.createElement('p');
        stock.classList.add('product-stock');
        stock.textContent = `Stock Available: ${product.stock} units`;

        const desc = document.createElement('p');
        desc.classList.add('product-desc');
        desc.textContent = product.description;

        infoGroup.appendChild(brand);
        infoGroup.appendChild(name);
        infoGroup.appendChild(stock);
        infoGroup.appendChild(desc);

        // Product Footer Group (Price & Buy Actions)
        const footerGroup = document.createElement('div');
        footerGroup.classList.add('product-footer');

        const price = document.createElement('span');
        price.classList.add('product-price');
        price.textContent = formatCurrency(product.price);

        const buyBtn = document.createElement('button');
        buyBtn.classList.add('btn', 'btn-primary');
        buyBtn.textContent = 'Add to Cart';
        buyBtn.setAttribute('data-id', product.id);

        // REVISI: Logika Pencegahan Akses (Public Area Redirect)
        buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                icon: 'warning',
                title: 'Akses Terbatas!',
                text: 'Silakan login terlebih dahulu untuk berbelanja komponen premium.',
                confirmButtonText: 'Menuju Halaman Login',
                confirmButtonColor: '#14213D'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login.html';
                }
            });
        });

        footerGroup.appendChild(price);
        footerGroup.appendChild(buyBtn);

        // Assemble structural pieces into Main Card Element
        card.appendChild(imgWrapper);
        card.appendChild(infoGroup);
        card.appendChild(footerGroup);

        // Inject secure node into target container
        container.appendChild(card);
    });
}

// 4. RUN ORCHESTRATION ON WINDOW DOM LOADED
window.addEventListener('DOMContentLoaded', () => {
    initializeDatabase();
    renderFeaturedProducts();
});

// Listener pendukung untuk tombol Auth Navigasi
const authBtn = document.getElementById('authBtn');
if (authBtn) {
    authBtn.addEventListener('click', (e) => {
        // Mencegah konflik ganda jika tombol sudah diubah menjadi tag <a> di HTML
        if (authBtn.tagName !== 'A') {
            window.location.href = 'login.html';
        }
    });
}