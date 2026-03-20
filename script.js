/* ============================================================================
   PENCIL PORTRAIT PORTFOLIO — SCRIPT
   Architect Theme Edition
   Dynamically renders gallery from data.json
   ============================================================================ */

class PortfolioApp {
    constructor() {
        this.data = null;
        this.currentCategory = null;
        this.currentLightboxIndex = null;
        this.currentLightboxCategory = null;

        // DOM refs
        this.galleryGrid      = document.getElementById('galleryGrid');
        this.categoriesList   = document.getElementById('categoriesList');
        this.lightbox         = document.getElementById('lightbox');
        this.loadingIndicator = document.getElementById('loading');
        this.sectionHeader    = document.getElementById('sectionHeader');
        this.heroSection      = document.getElementById('heroSection');

        this.setupLightboxListeners();
        this.setupMobileMenu();
        this.loadData();
    }

    // -------------------------------------------------------------------------
    // Data loading
    // -------------------------------------------------------------------------

    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.data = await response.json();
            this.init();
        } catch (err) {
            console.error('Failed to load data.json:', err);
            this.showError('Failed to load portfolio data. Please refresh the page.');
        }
    }

    init() {
        if (!this.data?.categories?.length) {
            this.showError('No categories found. Run python generate.py to populate data.json.');
            return;
        }
        this.renderCategories();
        this.selectCategory(this.data.categories[0].name);
        this.hideLoading();
    }

    // -------------------------------------------------------------------------
    // Category rendering
    // -------------------------------------------------------------------------

    renderCategories() {
        this.categoriesList.innerHTML = '';
        this.data.categories.forEach((category, index) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'category-button';
            btn.dataset.category = category.name;
            btn.innerHTML = `
                <span class="cat-index">${index + 1}</span>
                <span class="cat-name">${category.name.replace(/[-_]/g, ' ')}</span>
                <span class="cat-count">${category.pieces.length}</span>
            `;
            btn.addEventListener('click', () => {
                this.selectCategory(category.name);
                this.closeMobileMenu();
            });
            li.appendChild(btn);
            this.categoriesList.appendChild(li);
        });
    }

    selectCategory(categoryName) {
        this.currentCategory = categoryName;

        // Update active button
        document.querySelectorAll('.category-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryName);
        });

        const category = this.data.categories.find(c => c.name === categoryName);
        if (!category) return;

        this.renderSectionHeader(category);
        this.renderHero(category);
        this.renderGallery(category);

        // Scroll main content to top
        document.getElementById('mainContent')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // -------------------------------------------------------------------------
    // Section header
    // -------------------------------------------------------------------------

    renderSectionHeader(category) {
        const displayName = category.name.replace(/[-_]/g, ' ');
        const count = category.pieces.length;
        this.sectionHeader.innerHTML = `
            <h2 class="section-title">${displayName}</h2>
            <p class="section-meta">${count} piece${count !== 1 ? 's' : ''}</p>
        `;
    }

    // -------------------------------------------------------------------------
    // Hero image
    // -------------------------------------------------------------------------

    renderHero(category) {
        this.heroSection.innerHTML = '';
        if (!category.pieces?.length) return;

        const first = category.pieces[0];
        const hasInfo = first.name || first.story;

        if (hasInfo) {
            const card = document.createElement('div');
            card.className = 'hero-card';
            card.innerHTML = `
                <img src="${first.file}" alt="${first.name || 'Artwork'}" class="hero-card-image" loading="lazy">
                <div class="hero-card-body">
                    <span class="hero-badge">Featured</span>
                    ${first.name ? `<h3 class="hero-card-title">${first.name}</h3>` : ''}
                    ${first.story ? `<p class="hero-card-story">${first.story}</p>` : ''}
                    <p class="hero-card-cta">Click to view full size →</p>
                </div>
            `;
            card.addEventListener('click', () => this.openLightbox(0, category.name));
            this.heroSection.appendChild(card);
        } else {
            const wrap = document.createElement('div');
            wrap.className = 'hero-image-only';
            const img = document.createElement('img');
            img.src   = first.file;
            img.alt   = first.name || 'Artwork';
            img.className = 'hero-image';
            img.loading = 'lazy';
            wrap.appendChild(img);
            wrap.addEventListener('click', () => this.openLightbox(0, category.name));
            this.heroSection.appendChild(wrap);
        }
    }

    // -------------------------------------------------------------------------
    // Gallery grid
    // -------------------------------------------------------------------------

    renderGallery(category) {
        this.galleryGrid.innerHTML = '';

        // Gallery label
        const label = document.createElement('p');
        label.className = 'gallery-section-label';
        label.textContent = `All pieces (${category.pieces.length - 1} more)`;
        this.galleryGrid.appendChild(label);

        // Skip hero (index 0)
        const pieces = category.pieces.slice(1);

        pieces.forEach((piece, i) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const catalogueNo = String(i + 2).padStart(3, '0');
            const hasFooter   = piece.name || piece.story;

            item.innerHTML = `
                <div class="gallery-item-image-wrap">
                    <img
                        src="${piece.file}"
                        alt="${piece.name || 'Artwork'}"
                        class="gallery-item-image"
                        loading="lazy"
                    >
                    <div class="gallery-item-badge">${catalogueNo}</div>
                    <div class="gallery-item-overlay">View</div>
                </div>
                ${hasFooter ? `
                    <div class="gallery-item-footer">
                        ${piece.name  ? `<div class="gallery-item-name">${piece.name}</div>` : ''}
                        ${piece.story ? `<div class="gallery-item-story">${piece.story}</div>` : ''}
                    </div>
                ` : ''}
            `;

            item.addEventListener('click', () => this.openLightbox(i + 1, category.name));
            this.galleryGrid.appendChild(item);
        });
    }

    // -------------------------------------------------------------------------
    // Lightbox
    // -------------------------------------------------------------------------

    openLightbox(index, categoryName) {
        this.currentLightboxIndex    = index;
        this.currentLightboxCategory = categoryName;
        this.updateLightboxContent();
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    updateLightboxContent() {
        const category = this.data.categories.find(c => c.name === this.currentLightboxCategory);
        if (!category) return;

        const piece = category.pieces[this.currentLightboxIndex];
        if (!piece) return;

        const img   = document.getElementById('lightboxImage');
        const title = document.getElementById('lightboxTitle');
        const story = document.getElementById('lightboxStory');
        const info  = document.getElementById('lightboxInfo');

        img.src = piece.file;
        img.alt = piece.name || 'Artwork';

        if (piece.name) {
            title.textContent  = piece.name;
            title.style.display = 'block';
        } else {
            title.style.display = 'none';
        }

        if (piece.story) {
            story.textContent  = piece.story;
            story.style.display = 'block';
        } else {
            story.style.display = 'none';
        }

        // Hide info panel if no name or story
        info.style.display = (piece.name || piece.story) ? 'block' : 'none';
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    prevPiece() {
        const cat = this.data.categories.find(c => c.name === this.currentLightboxCategory);
        if (!cat) return;
        this.currentLightboxIndex = (this.currentLightboxIndex - 1 + cat.pieces.length) % cat.pieces.length;
        this.updateLightboxContent();
    }

    nextPiece() {
        const cat = this.data.categories.find(c => c.name === this.currentLightboxCategory);
        if (!cat) return;
        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % cat.pieces.length;
        this.updateLightboxContent();
    }

    setupLightboxListeners() {
        document.getElementById('lightboxClose').addEventListener('click', () => this.closeLightbox());
        document.getElementById('lightboxPrev').addEventListener('click', () => this.prevPiece());
        document.getElementById('lightboxNext').addEventListener('click', () => this.nextPiece());

        this.lightbox.addEventListener('click', e => {
            if (e.target === this.lightbox) this.closeLightbox();
        });

        document.addEventListener('keydown', e => {
            if (!this.lightbox.classList.contains('active')) return;
            if (e.key === 'Escape')      this.closeLightbox();
            if (e.key === 'ArrowLeft')   this.prevPiece();
            if (e.key === 'ArrowRight')  this.nextPiece();
        });
    }

    // -------------------------------------------------------------------------
    // Mobile menu
    // -------------------------------------------------------------------------

    setupMobileMenu() {
        const toggle  = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!toggle || !sidebar || !overlay) return;

        toggle.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                sidebar.classList.add('open');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        overlay.addEventListener('click', () => this.closeMobileMenu());
    }

    closeMobileMenu() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
        if (!this.lightbox?.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }

    // -------------------------------------------------------------------------
    // Utils
    // -------------------------------------------------------------------------

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    showError(message) {
        this.galleryGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-muted);">
                <p style="font-size:1.1rem; margin-bottom:0.75rem;">⚠ ${message}</p>
                <p style="font-size:0.85rem;">Run <code style="background:var(--accent-light); color:var(--accent); padding:0.2rem 0.5rem; border-radius:4px;">python generate.py</code> to generate data.json from images.</p>
            </div>
        `;
        this.hideLoading();
    }
}

// Initialise
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
