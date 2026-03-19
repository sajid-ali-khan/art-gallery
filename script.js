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
        this.galleryGrid = document.getElementById('galleryGrid');
        this.categoriesList = document.getElementById('categoriesList');
        this.lightbox = document.getElementById('lightbox');
        this.loadingIndicator = document.getElementById('loading');

        this.setupLightboxListeners();
        this.loadData();
    }

    /**
     * Fetch and parse data.json
     */
    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            this.init();
        } catch (error) {
            console.error('Failed to load data.json:', error);
            this.showError('Failed to load portfolio data. Please refresh the page.');
        }
    }

    /**
     * Initialize app after data is loaded
     */
    init() {
        if (!this.data || !this.data.categories || this.data.categories.length === 0) {
            this.showError('No categories found. Make sure images are in the images/ folder and generate.py has been run.');
            return;
        }

        this.renderCategories();
        // Select first category by default
        this.selectCategory(this.data.categories[0].name);
        this.hideLoading();
    }

    /**
     * Render category buttons with numbers only
     */
    renderCategories() {
        this.categoriesList.innerHTML = '';

        this.data.categories.forEach((category, index) => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.textContent = (index + 1).toString();
            button.addEventListener('click', () => this.selectCategory(category.name));
            this.categoriesList.appendChild(button);
        });
    }

    /**
     * Select a category and render its items
     */
    selectCategory(categoryName) {
        this.currentCategory = categoryName;

        // Update active button
        document.querySelectorAll('.category-button').forEach((btn) => {
            const categoryIndex = this.data.categories.findIndex((cat) => cat.name === categoryName);
            const buttonIndex = Array.from(this.categoriesList.children).indexOf(btn);
            btn.classList.toggle('active', buttonIndex === categoryIndex);
        });

        // Find category data
        const category = this.data.categories.find((cat) => cat.name === categoryName);
        if (!category) return;

        // Render hero and gallery items
        this.renderHero(category);
        this.renderGallery(category);
    }

    /**
     * Render hero image section (first piece of category)
     */
    renderHero(category) {
        const heroSection = document.getElementById('heroSection');
        heroSection.innerHTML = '';

        if (!category.pieces || category.pieces.length === 0) {
            return;
        }

        const firstPiece = category.pieces[0];
        const heroItem = document.createElement('div');
        heroItem.className = 'hero-item';

        heroItem.innerHTML = `
            <img src="${firstPiece.file}" alt="${firstPiece.name || 'Artwork'}" class="hero-item-image" loading="lazy">
            ${firstPiece.name || firstPiece.story ? `
                <div class="hero-item-caption">
                    ${firstPiece.name ? `<div class="hero-item-name">${firstPiece.name}</div>` : ''}
                    ${firstPiece.story ? `<div class="hero-item-story">${firstPiece.story}</div>` : ''}
                </div>
            ` : ''}
        `;

        heroItem.addEventListener('click', () => {
            this.openLightbox(0, category.name);
        });

        heroSection.appendChild(heroItem);
    }

    /**
     * Render gallery items for selected category (excluding hero image)
     */
    renderGallery(category) {
        this.galleryGrid.innerHTML = '';

        // Skip first piece (it's the hero)
        const galleryPieces = category.pieces.slice(1);

        galleryPieces.forEach((piece, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            // Catalogue number starts from 002 (since 001 is the hero)
            const catalogueNumber = String(index + 2).padStart(3, '0');
            item.innerHTML = `
                <img src="${piece.file}" alt="${piece.name || 'Artwork'}" class="gallery-item-image" loading="lazy">
                <div class="gallery-item-overlay">
                    <div class="gallery-item-number">${catalogueNumber}</div>
                    ${piece.name ? `<div class="gallery-item-name">${piece.name}</div>` : ''}
                    ${piece.story ? `<div class="gallery-item-story">${piece.story}</div>` : ''}
                </div>
            `;

            item.addEventListener('click', () => {
                // Pass index + 1 to lightbox because hero is at index 0
                this.openLightbox(index + 1, category.name);
            });

            this.galleryGrid.appendChild(item);
        });
    }

    /**
     * Open lightbox at specific piece
     */
    openLightbox(index, categoryName) {
        this.currentLightboxIndex = index;
        this.currentLightboxCategory = categoryName;
        this.updateLightboxContent();
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    /**
     * Update lightbox content
     */
    updateLightboxContent() {
        const category = this.data.categories.find((cat) => cat.name === this.currentLightboxCategory);
        if (!category) return;

        const piece = category.pieces[this.currentLightboxIndex];
        if (!piece) return;

        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxStory = document.getElementById('lightboxStory');

        lightboxImage.src = piece.file;
        lightboxImage.alt = piece.name || 'Artwork';

        if (piece.name) {
            lightboxTitle.textContent = piece.name;
            lightboxTitle.style.display = 'block';
        } else {
            lightboxTitle.style.display = 'none';
        }

        if (piece.story) {
            lightboxStory.textContent = piece.story;
            lightboxStory.style.display = 'block';
        } else {
            lightboxStory.style.display = 'none';
        }
    }

    /**
     * Close lightbox
     */
    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Navigate to previous piece in lightbox
     */
    prevPiece() {
        const category = this.data.categories.find((cat) => cat.name === this.currentLightboxCategory);
        if (!category) return;

        this.currentLightboxIndex = (this.currentLightboxIndex - 1 + category.pieces.length) % category.pieces.length;
        this.updateLightboxContent();
    }

    /**
     * Navigate to next piece in lightbox
     */
    nextPiece() {
        const category = this.data.categories.find((cat) => cat.name === this.currentLightboxCategory);
        if (!category) return;

        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % category.pieces.length;
        this.updateLightboxContent();
    }

    /**
     * Setup lightbox event listeners
     */
    setupLightboxListeners() {
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');

        lightboxClose.addEventListener('click', () => this.closeLightbox());
        lightboxPrev.addEventListener('click', () => this.prevPiece());
        lightboxNext.addEventListener('click', () => this.nextPiece());

        // Close on background click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.prevPiece();
                    break;
                case 'ArrowRight':
                    this.nextPiece();
                    break;
            }
        });
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #a8a8a0;">
            <p style="margin-bottom: 1rem;">⚠ ${message}</p>
            <p style="font-size: 0.85rem;">Run <code style="background: rgba(200, 190, 180, 0.1); padding: 0.25rem 0.5rem; border-radius: 2px;">python generate.py</code> to generate data.json from images.</p>
        </div>`;
        this.hideLoading();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
