/* ============================================================================
   PENCIL PORTRAIT PORTFOLIO — SCRIPT
   Dynamically renders gallery from data.json
   ============================================================================ */

class PortfolioApp {
    constructor() {
        this.data = null;
        this.currentCategory = null;
        this.currentLightboxIndex = null;
        this.currentLightboxCategory = null;

        this.galleryGrid    = document.getElementById('galleryGrid');
        this.categoriesList = document.getElementById('categoriesList');
        this.lightbox       = document.getElementById('lightbox');
        this.loadingEl      = document.getElementById('loading');
        this.heroSection    = document.getElementById('heroSection');

        this.setupLightboxListeners();
        this.loadData();
    }

    // ── Data loading ──────────────────────────────────────────────────────────

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
            this.showError('No categories found. Run python generate.py first.');
            return;
        }
        this.renderCategories();
        this.selectCategory(this.data.categories[0].name);
        this.hideLoading();
    }

    // ── Category rendering ────────────────────────────────────────────────────

    renderCategories() {
        this.categoriesList.innerHTML = '';
        this.data.categories.forEach((category, index) => {
            const li  = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'category-button';
            btn.dataset.category = category.name;
            btn.textContent = category.name.replace(/[-_]/g, ' ');
            btn.addEventListener('click', () => this.selectCategory(category.name));
            li.appendChild(btn);
            this.categoriesList.appendChild(li);
        });
    }

    selectCategory(categoryName) {
        this.currentCategory = categoryName;

        document.querySelectorAll('.category-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryName);
        });

        const category = this.data.categories.find(c => c.name === categoryName);
        if (!category) return;

        this.renderHero(category);
        this.renderGallery(category);
    }

    // ── Hero ──────────────────────────────────────────────────────────────────

    renderHero(category) {
        this.heroSection.innerHTML = '';
        if (!category.pieces?.length) return;

        const first = category.pieces[0];
        const wrap  = document.createElement('div');
        wrap.className = 'hero-image-only';

        const img = document.createElement('img');
        img.src     = first.file;
        img.alt     = first.name || 'Artwork';
        img.loading = 'lazy';
        wrap.appendChild(img);
        wrap.addEventListener('click', () => this.openLightbox(0, category.name));
        this.heroSection.appendChild(wrap);
    }

    // ── Gallery grid ──────────────────────────────────────────────────────────

    renderGallery(category) {
        this.galleryGrid.innerHTML = '';

        const label = document.createElement('p');
        label.className = 'gallery-section-label';
        const extra = category.pieces.length - 1;
        label.textContent = `${extra} more piece${extra !== 1 ? 's' : ''}`;
        this.galleryGrid.appendChild(label);

        category.pieces.slice(1).forEach((piece, i) => {
            const item        = document.createElement('div');
            item.className    = 'gallery-item';
            const catalogueNo = String(i + 2).padStart(3, '0');
            const hasFooter   = piece.name || piece.story;

            item.innerHTML = `
                <div class="gallery-item-image-wrap">
                    <img src="${piece.file}" alt="${piece.name || 'Artwork'}" class="gallery-item-image" loading="lazy">
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

    // ── Lightbox ──────────────────────────────────────────────────────────────

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

        document.getElementById('lightboxImage').src = piece.file;
        document.getElementById('lightboxImage').alt = piece.name || 'Artwork';

        const title = document.getElementById('lightboxTitle');
        const story = document.getElementById('lightboxStory');
        const info  = document.getElementById('lightboxInfo');

        title.textContent   = piece.name  || '';
        story.textContent   = piece.story || '';
        info.style.display  = (piece.name || piece.story) ? 'block' : 'none';
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
        document.getElementById('lightboxPrev').addEventListener('click',  () => this.prevPiece());
        document.getElementById('lightboxNext').addEventListener('click',  () => this.nextPiece());

        this.lightbox.addEventListener('click', e => {
            if (e.target === this.lightbox) this.closeLightbox();
        });

        document.addEventListener('keydown', e => {
            if (!this.lightbox.classList.contains('active')) return;
            if (e.key === 'Escape')     this.closeLightbox();
            if (e.key === 'ArrowLeft')  this.prevPiece();
            if (e.key === 'ArrowRight') this.nextPiece();
        });
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

    hideLoading() {
        this.loadingEl?.classList.add('hidden');
    }

    showError(message) {
        this.galleryGrid.innerHTML = `
            <p style="color:#888; padding:1rem 0;">⚠ ${message}<br>
            <small>Run <code>python generate.py</code> to populate data.json.</small></p>
        `;
        this.hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', () => new PortfolioApp());
