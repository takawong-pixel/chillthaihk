// Chill Thai Amulet - Main App
let products = [];
let cart = JSON.parse(localStorage.getItem('cta_cart') || '[]');
let currentFilter = 'all';
let searchQuery = '';

// Load products
async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    if (res.ok) {
      products = await res.json();
    } else {
      throw new Error('fetch failed');
    }
  } catch (e) {
    const stored = localStorage.getItem('cta_products');
    if (stored) {
      products = JSON.parse(stored);
    } else {
      products = [];
      console.warn('No products loaded');
    }
  }
  // Merge with localStorage overrides if any
  const overrides = localStorage.getItem('cta_products');
  if (overrides) {
    try {
      const localProds = JSON.parse(overrides);
      if (localProds.length > 0) products = localProds;
    } catch {}
  }
  renderProducts();
  updateCartUI();
}

// Helper: get categories as array
function getCats(p) {
  if (Array.isArray(p.category)) return p.category;
  if (typeof p.category === 'string' && p.category) return [p.category];
  return [];
}

function displayPrice(p) {
  if (p.section === 'preorder' && p.variants && p.variants.length) {
    const prices = p.variants.map(v => v.price).filter(x => x > 0);
    if (!prices.length) return '$—';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? '$' + min.toLocaleString() : '$' + min.toLocaleString() + ' 起';
  }
  return '$' + Number(p.price || 0).toLocaleString();
}

function statusBadge(p) {
  if (p.section === 'preorder' && p.preorderStatus) {
    return '<span class="tag" style="background:rgba(201,162,39,0.2)">' + p.preorderStatus + '</span>';
  }
  return '';
}


// Only show products that are NOT sold, filtered by section
// section: 'shop' (default) | 'preorder' | 'casing'
function getPageSection() {
  if (typeof window.PAGE_SECTION !== 'undefined') return window.PAGE_SECTION;
  if (location.pathname.includes('preorder')) return 'preorder';
  if (location.pathname.includes('casing')) return 'casing';
  return 'shop';
}

function availableProducts(section) {
  const sec = section || getPageSection();
  return products.filter(p => !p.sold && (p.section || 'shop') === sec);
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let filtered = availableProducts().filter(p => {
    const cats = getCats(p);
    const matchCat = currentFilter === 'all' || 
                     (currentFilter === 'featured' && p.featured) ||
                     cats.includes(currentFilter);
    const matchSearch = !searchQuery || 
      p.name.includes(searchQuery) || 
      (p.nameEn && p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.master.includes(searchQuery) ||
      (p.tags && p.tags.some(t => t.includes(searchQuery))) ||
      cats.some(c => c.includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">📿</div>
        <p>找不到符合條件的佛牌</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="openProduct('${p.id}')">
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" 
             onerror="this.src='https://via.placeholder.com/400x400/1a1a1a/c9a227?text=佛牌'">
        ${p.featured ? '<span class="product-badge featured">精選</span>' : ''}
        ${p.stock <= 0 ? '<span class="product-badge" style="background:#9b2226">已售罄</span>' : ''}
        ${p.originalPrice ? '<span class="product-badge" style="right:10px;left:auto;background:#2d6a4f">特價</span>' : ''}
      </div>
      <div class="product-info">
        <div class="product-master">${p.master ? p.master + (p.year ? ' · ' + p.year : '') : (p.preorderStatus || '')}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-tags">
          ${getCats(p).slice(0,2).map(t => `<span class="tag">${t}</span>`).join('')}
          ${(p.tags || []).slice(0,2).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="product-price-row">
          <div class="product-price">
            ${displayPrice(p)}
            ${p.originalPrice && p.section !== 'preorder' ? `<span class="original">$${p.originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <div class="product-stock">
            ${p.section === 'preorder' ? (p.preorderStatus || '') : (p.stock > 0 ? `剩 ${p.stock} 件` : '售罄')}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.sold) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-body');
  
  const images = p.images && p.images.length ? p.images : [p.image];
  const cats = getCats(p);
  
  content.innerHTML = `
    <div class="modal-content">
      <div class="modal-gallery">
        <div class="modal-main-img">
          <img id="main-img" src="${images[0]}" alt="${p.name}"
               onerror="this.src='https://via.placeholder.com/400x400/1a1a1a/c9a227?text=佛牌'">
        </div>
        ${images.length > 1 ? `
        <div class="modal-thumbs">
          ${images.map((img, i) => `
            <img src="${img}" class="${i===0?'active':''}" 
                 onclick="document.getElementById('main-img').src=this.src; 
                          document.querySelectorAll('.modal-thumbs img').forEach(t=>t.classList.remove('active'));
                          this.classList.add('active');"
                 onerror="this.style.display='none'">
          `).join('')}
        </div>` : ''}
      </div>
      <div class="modal-details">
        <div class="product-master" style="margin-bottom:0.3rem">${p.master}</div>
        <h2>${p.name}</h2>
        <div class="modal-meta">
          <span>📅 ${p.year || '—'}</span>
          <span>🛕 ${p.temple || '—'}</span>
          <span>🔩 ${p.material || '—'}</span>
          <span>📂 ${cats.join('、') || '—'}</span>
        </div>
        <div class="modal-price">
          ${displayPrice(p)}
          ${p.originalPrice && p.section !== 'preorder' ? `<span class="original">$${p.originalPrice.toLocaleString()}</span>` : ''}
        </div>
        ${p.section === 'preorder' && p.variants && p.variants.length ? `
        <div style="margin-bottom:1rem;font-size:0.9rem;color:var(--text-muted)">
          ${p.variants.map(v => `<div style="margin-bottom:0.25rem">${v.material}　<strong style="color:var(--primary)">$${Number(v.price).toLocaleString()}</strong></div>`).join('')}
        </div>` : ''}
        <div class="product-tags" style="margin-bottom:1rem">
          ${p.section === 'preorder' && p.preorderStatus ? `<span class="tag" style="background:rgba(201,162,39,0.25)">${p.preorderStatus}</span>` : ''}
          ${cats.map(t => `<span class="tag">${t}</span>`).join('')}
          ${(p.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        ${p.section === 'preorder' ? `
        <div class="modal-meta" style="margin-bottom:1rem">
          ${p.deadline ? `<span>截單：${p.deadline}</span>` : ''}
          ${p.expectedRelease ? `<span>預計出廟：${p.expectedRelease}</span>` : ''}
        </div>` : ''}
        <p class="modal-desc">${p.description}</p>
        <div class="modal-actions">
          <div class="qty-control">
            <button onclick="changeQty(-1)">−</button>
            <span id="qty">1</span>
            <button onclick="changeQty(1)">+</button>
          </div>
          <button class="btn btn-primary" onclick="addToCart('${p.id}')" ${p.stock<=0?'disabled style="opacity:0.5"':''}>
            ${p.stock > 0 ? '加入詢價清單' : '已售罄'}
          </button>
          <button class="btn btn-outline" onclick="window.open('https://wa.me/60184057','_blank')">
            WhatsApp 詢問
          </button>
        </div>
        <p style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted)">
          * 佛牌皆為正品。庫存有限，售完為止。
        </p>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function changeQty(delta) {
  const el = document.getElementById('qty');
  let v = parseInt(el.textContent) + delta;
  if (v < 1) v = 1;
  if (v > 10) v = 10;
  el.textContent = v;
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0 || p.sold) return;
  
  const qty = parseInt(document.getElementById('qty')?.textContent || 1);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, name: p.name, price: p.price, image: p.image, qty });
  }
  localStorage.setItem('cta_cart', JSON.stringify(cart));
  updateCartUI();
  showToast('已加入詢價清單');
  closeModal();
}

function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  
  const itemsEl = document.getElementById('cart-items');
  if (!itemsEl) return;
  
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><p>詢價清單是空的</p></div>`;
  } else {
    itemsEl.innerHTML = cart.map((c, i) => `
      <div class="cart-item">
        <img src="${c.image}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/64/1a1a1a/c9a227?text=潮'">
        <div class="cart-item-info">
          <h4>${c.name}</h4>
          <div class="price">$${c.price.toLocaleString()} × ${c.qty}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>
    `).join('');
  }
  
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalEl = document.getElementById('cart-total-price');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cta_cart', JSON.stringify(cart));
  updateCartUI();
}

function toggleCart() {
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

function checkout() {
  if (cart.length === 0) {
    showToast('清單是空的');
    return;
  }
  const msg = cart.map(c => `${c.name} × ${c.qty}`).join('%0A');
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const text = `您好，我想詢問以下佛牌：%0A${msg}%0A合計約 $${total.toLocaleString()}`;
  window.open(`https://wa.me/60184057?text=${text}`, '_blank');
}

function setFilter(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === cat);
  });
  renderProducts();
}

function onSearch(val) {
  searchQuery = val.trim();
  renderProducts();
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function toggleMenu() {
  document.getElementById('nav').classList.toggle('open');
}

document.addEventListener('click', e => {
  if (e.target.id === 'product-modal') closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    const check = setInterval(() => {
      if (products.length) {
        clearInterval(check);
        const featured = availableProducts().filter(p => p.featured).slice(0, 4);
        featuredGrid.innerHTML = featured.map(p => `
          <div class="product-card" onclick="openProduct('${p.id}')">
            <div class="product-img">
              <img src="${p.image}" alt="${p.name}" loading="lazy"
                   onerror="this.src='https://via.placeholder.com/400x400/1a1a1a/c9a227?text=佛牌'">
              <span class="product-badge featured">精選</span>
            </div>
            <div class="product-info">
              <div class="product-master">${p.master}</div>
              <div class="product-name">${p.name}</div>
              <div class="product-price">${displayPrice(p)}</div>
            </div>
          </div>
        `).join('');
      }
    }, 100);
  }
});
