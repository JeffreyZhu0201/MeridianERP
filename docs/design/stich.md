<!-- Design System -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Unified Catalog - Meridian Store</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-container": "#da3437",
                    "primary-fixed": "#e1e0ff",
                    "on-tertiary-fixed-variant": "#930013",
                    "background": "#f9f9ff",
                    "on-secondary": "#ffffff",
                    "tertiary-fixed-dim": "#ffb3ad",
                    "on-tertiary-container": "#fffbff",
                    "surface-bright": "#f9f9ff",
                    "surface-tint": "#494bd6",
                    "on-secondary-fixed": "#002113",
                    "on-tertiary": "#ffffff",
                    "secondary-fixed": "#6ffbbe",
                    "outline-variant": "#c7c4d7",
                    "error": "#ba1a1a",
                    "primary": "#4648d4",
                    "surface-container-lowest": "#ffffff",
                    "on-surface": "#141b2b",
                    "error-container": "#ffdad6",
                    "on-primary-fixed": "#07006c",
                    "secondary-fixed-dim": "#4edea3",
                    "surface-container-highest": "#dce2f7",
                    "surface-dim": "#d3daef",
                    "on-tertiary-fixed": "#410004",
                    "tertiary": "#b61722",
                    "outline": "#767586",
                    "surface-variant": "#dce2f7",
                    "on-primary-container": "#fffbff",
                    "primary-container": "#6063ee",
                    "on-primary-fixed-variant": "#2f2ebe",
                    "on-error-container": "#93000a",
                    "on-surface-variant": "#464554",
                    "secondary": "#006c49",
                    "surface": "#f9f9ff",
                    "on-primary": "#ffffff",
                    "primary-fixed-dim": "#c0c1ff",
                    "surface-container-high": "#e1e8fd",
                    "on-error": "#ffffff",
                    "surface-container": "#e9edff",
                    "on-secondary-fixed-variant": "#005236",
                    "secondary-container": "#6cf8bb",
                    "inverse-surface": "#293040",
                    "inverse-on-surface": "#edf0ff",
                    "inverse-primary": "#c0c1ff",
                    "on-background": "#141b2b",
                    "surface-container-low": "#f1f3ff",
                    "on-secondary-container": "#00714d",
                    "tertiary-fixed": "#ffdad7"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "lg": "24px",
                    "base": "4px",
                    "md": "16px",
                    "3xl": "64px",
                    "sm": "12px",
                    "margin-mobile": "16px",
                    "margin-desktop": "48px",
                    "2xl": "48px",
                    "xs": "8px",
                    "gutter": "24px",
                    "xl": "32px"
            },
            "fontFamily": {
                    "headline-lg": ["Inter"],
                    "price-display": ["Inter"],
                    "body-md": ["Inter"],
                    "body-sm": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "headline-xl": ["Inter"]
            },
            "fontSize": {
                    "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "price-display": ["20px", {"lineHeight": "24px", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                    "headline-lg-mobile": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "headline-xl": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "600"}]
            }
          }
        }
      }
    </script>
<style>
        .glass-overlay {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
        }
        
        .bento-card {
            border: 1px solid theme('colors.outline-variant');
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            transition: all 0.2s ease-in-out;
        }
        
        .bento-card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col antialiased">
<!-- TopNavBar (Shared Component) -->
<nav class="bg-surface dark:bg-surface-dim docked full-width top-0 sticky border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none z-50">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-7xl mx-auto h-20">
<!-- Brand -->
<a class="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed flex items-center gap-2" href="/">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">widgets</span>
                Meridian Store
            </a>
<!-- Branch Select / Desktop Nav -->
<div class="hidden md:flex items-center gap-gutter">
<button class="flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary font-label-md text-label-md">
<span class="material-symbols-outlined text-[18px]">domain</span>
                    Flagship Branch
                    <span class="material-symbols-outlined text-[18px]">arrow_drop_down</span>
</button>
<div class="flex items-center gap-md">
<a class="text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-label-md text-label-md" href="/shop">Shop</a>
<a class="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors duration-200 font-label-md text-label-md" href="/cart">Cart</a>
<a class="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors duration-200 font-label-md text-label-md" href="/account">Account</a>
</div>
</div>
<!-- Actions -->
<div class="flex items-center gap-xs">
<button aria-label="Search" class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-on-surface-variant">
<span class="material-symbols-outlined">search</span>
</button>
<button aria-label="Language" class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-on-surface-variant">
<span class="material-symbols-outlined">language</span>
</button>
<button aria-label="Cart" class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-on-surface-variant relative">
<span class="material-symbols-outlined">shopping_cart</span>
<span class="absolute top-1 right-1 w-2 h-2 bg-tertiary-container rounded-full"></span>
</button>
<button aria-label="Account" class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-on-surface-variant">
<span class="material-symbols-outlined">person</span>
</button>
</div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-xl">
<!-- BentoDashboardFrame: Header & Metrics -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-xl">
<!-- Header (Spans 8 cols on desktop) -->
<div class="md:col-span-8 flex flex-col justify-center">
<h1 class="font-headline-xl text-headline-xl mb-xs text-on-surface">Unified Catalog</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Browse products across all our flagship branches.</p>
</div>
<!-- Metrics (Spans 4 cols on desktop) -->
<div class="md:col-span-4 flex gap-md">
<div class="flex-1 bg-surface-container-lowest rounded-xl p-md bento-card flex flex-col justify-center">
<span class="font-label-md text-label-md text-on-surface-variant mb-1">Total Items</span>
<span class="font-headline-lg text-headline-lg text-primary">124</span>
</div>
<div class="flex-1 bg-primary-container rounded-xl p-md bento-card flex flex-col justify-center text-on-primary-container">
<span class="font-label-md text-label-md opacity-80 mb-1">Active Cart</span>
<span class="font-headline-lg text-headline-lg">3 items</span>
</div>
</div>
</div>
<!-- Featured Section (Bento Tile) -->
<div class="w-full rounded-xl bento-card bg-surface-container-lowest overflow-hidden mb-xl relative min-h-[400px] flex items-end">
<!-- Background Image -->
<div class="absolute inset-0 bg-cover bg-center" data-alt="A sleek, modern premium mechanical keyboard sitting on a pristine white minimalist desk setup. The scene is illuminated by soft, natural studio lighting creating a high-key, airy atmosphere typical of high-end e-commerce photography. Subtle shadows give depth, emphasizing the premium build quality. The overall color palette is predominantly white and light gray, with indigo accents matching the brand identity." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAL1rY9UEyR4Fx4VlSUM7OkrR-Rb3Vz-gH5-gfcQvAlHfvn4B4v_hEOOgZLKRcFp3f_uwtnhLKcOu_QKCXtq1E_aGyoDJN0QrLp168FCUQp7lhfDVFkYDxpmmDQM4jNQNyEbEtA-E8ki3_-bdXfMTXfwwQhQoZn5xXbDUGvTBr1CHnkCQzfx-pPMhpkQJauZc4YBAfc04AR18mNrsqwEbgeEbeAtopo_keqSfB0HvPMUtXPhaXOrggcQ')"></div>
<!-- Glassmorphism Content Overlay -->
<div class="relative w-full p-lg m-md rounded-xl glass-overlay border border-white/20 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
<div>
<span class="inline-block px-sm py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-md text-label-md text-[12px] mb-sm">Featured Flagship</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-xs">Pro Mechanical Keyboard V2</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">Experience tactile perfection with our newly engineered mechanical switches. Designed for both deep focus work and intense gaming sessions.</p>
</div>
<div class="flex flex-col items-end gap-sm">
<span class="font-price-display text-price-display text-on-surface">$149.00</span>
<button class="bg-primary hover:bg-primary-fixed-dim text-on-primary px-lg py-sm rounded-full font-label-md text-label-md transition-colors flex items-center gap-2">
                        Add to Cart
                        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
</button>
</div>
</div>
</div>
<!-- Toolbar / Filters -->
<div class="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
<h3 class="font-headline-lg text-headline-lg text-on-surface">All Products</h3>
<div class="flex gap-sm">
<button class="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md text-label-md">
<span class="material-symbols-outlined text-[18px]">filter_list</span>
                    Filter
                </button>
<button class="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md text-label-md">
<span class="material-symbols-outlined text-[18px]">sort</span>
                    Sort
                </button>
</div>
</div>
<!-- UnifiedProductGrid: 4-column Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter mb-xl">
<!-- Product 1: Wireless Headphones -->
<div class="bento-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group cursor-pointer">
<div class="relative h-48 bg-surface-container-low p-sm">
<div class="w-full h-full bg-contain bg-no-repeat bg-center mix-blend-multiply" data-alt="Premium over-ear wireless headphones resting elegantly on a minimalist white pedestal. Clean, bright studio lighting accentuates the matte finish and plush ear cushions. The composition is highly symmetrical, exuding a sense of premium audio quality and contemporary design within a light, airy environment." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC0wmkhzwqirDK88MdBgu8-pH1soFuvrqShpr3TVlCLYLMZXloEwY22T9yXVpp6ImV0YN0nF99d0fTkeXnnol5FF4hDjoJAHvz8F3b2zzhE9mA5NbxSFVxXOAW1tSocNSCoBFv5MzzsQktgMxCw9PkaqLDpIIbVxIXJWDDxYza4MFjOKdRAoc8lo1ZTWXsiwSsLht2f6bjYjyNx2dQ3OIkfLz3rG1-PWoagw_P3G9nJb5wrjySXuvf_Fg')"></div>
<div class="absolute top-sm right-sm">
<button class="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-outline hover:text-tertiary-container transition-colors shadow-sm">
<span class="material-symbols-outlined text-[18px]">favorite</span>
</button>
</div>
</div>
<div class="p-md flex flex-col flex-grow">
<div class="flex justify-between items-start mb-xs">
<h4 class="font-body-md text-body-md font-medium text-on-surface line-clamp-2">Studio Wireless ANC Headphones</h4>
</div>
<span class="font-price-display text-price-display text-primary mt-auto">$199.00</span>
<button class="mt-sm w-full py-xs border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors">Add to Cart</button>
</div>
</div>
<!-- Product 2: Laptop Stand -->
<div class="bento-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group cursor-pointer">
<div class="relative h-48 bg-surface-container-low p-sm">
<div class="absolute top-sm left-sm z-10">
<span class="inline-block px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-sm font-label-md text-label-md text-[10px]">Flagship</span>
</div>
<div class="w-full h-full bg-contain bg-no-repeat bg-center mix-blend-multiply" data-alt="An ergonomic, sleek aluminum laptop stand displayed on a pristine white desk surface. The bright, high-key lighting creates soft shadows that highlight the precision engineering and brushed metal texture. The setting is a minimalist workspace aesthetic, reflecting a clean, modern, and professional lifestyle." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBoG6_iMDImz3CW7q-SSU2vxc0KWLypwglacFkMTLGC_gwTsku74cEEalnDLozgCIhD-UtTZsY1iAkK6gyC7iALuZpySAn_VWaEykuKEh1kim7p6Ome4P01aWwf5wjLYH0gqMg19dzkh_QG7j9TBA_uOMHf2z1H0qcJ4zfBFD3V_so8RDJyGGgfWWUnC52AG8PONXirgI9kGGOVT__BE_PBwC1-T64fEIZ0isnGDw_88jEQ7rCEv6MUZg')"></div>
</div>
<div class="p-md flex flex-col flex-grow">
<div class="flex justify-between items-start mb-xs">
<h4 class="font-body-md text-body-md font-medium text-on-surface line-clamp-2">Ergonomic Aluminum Laptop Riser</h4>
</div>
<span class="font-price-display text-price-display text-primary mt-auto">$45.00</span>
<button class="mt-sm w-full py-xs border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors">Add to Cart</button>
</div>
</div>
<!-- Product 3: Smart Watch (Out of Stock) -->
<div class="bento-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group cursor-pointer opacity-70">
<div class="relative h-48 bg-surface-container-low p-sm">
<div class="absolute inset-0 bg-white/40 z-10 flex items-center justify-center">
<span class="bg-error text-on-error px-sm py-1 rounded-full font-label-md text-label-md text-sm">Out of Stock</span>
</div>
<div class="w-full h-full bg-contain bg-no-repeat bg-center mix-blend-multiply grayscale" data-alt="A cutting-edge smartwatch with a sleek digital display lying on a light gray marble surface. The lighting is crisp and bright, emphasizing the high-resolution screen and metallic casing. The minimalist composition conveys technological sophistication and premium build quality suited for a modern lifestyle aesthetic." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCgsPOzPreYVgUREDwEOC7bXl0L8PM58o1fidBT22w0_ejs10j_L2r-k2w8gNBF_vQ2OOPzmf5NrnA_CaE1FcBAyJIcruCX5KSgufD83rfL-uCBRJUAs6CZ52Ohz-vBBDLy8_7u_thCrfgNinfzJmAczTqK5zGydIHvsi_QDFJXEbtbMTNzHCaY7lWrOkFLjXRJu99srQXAz8ygvHTKpggrH3JelqgGJEKu2RbGSPbljkS2MiuFnFujQ')"></div>
</div>
<div class="p-md flex flex-col flex-grow">
<div class="flex justify-between items-start mb-xs">
<h4 class="font-body-md text-body-md font-medium text-on-surface line-clamp-2">Meridian Fitness Smart Watch Pro</h4>
</div>
<span class="font-price-display text-price-display text-outline mt-auto">$299.00</span>
<button class="mt-sm w-full py-xs border border-outline-variant text-outline rounded-full font-label-md text-label-md cursor-not-allowed bg-surface-container-low" disabled="">Notify Me</button>
</div>
</div>
<!-- Product 4: Desk Mat -->
<div class="bento-card bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col group cursor-pointer">
<div class="relative h-48 bg-surface-container-low p-sm">
<div class="w-full h-full bg-contain bg-no-repeat bg-center mix-blend-multiply" data-alt="A wide, premium vegan leather desk mat rolled out slightly on a bright, minimalist wooden desk. Soft natural lighting from a nearby window creates a bright, airy workspace vibe. The texture of the mat is visible, conveying durability and high quality in a clean, contemporary setting." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDPLWdaBIjWR585MaKTk09BxDaLHY0ocTMbChOoif9B9wJt_0GXxiJnwRL9LW1rGjZcGQc1gwXa_vGA1hulNiGvCgc16Q9u_g3lhXwW4kJ5U7_4OwmCuVn0P-qs7t0ZEM8-NWsclHjawI82U5HtgWlWYRVRcgGFwZ8v3EvW0u8HA_PyVkmESt08uCy9mNjGym0StX2UBQFPHtdrQDPyTj7b1WXpJXWVatB176ZEKnd5108PXBKlswO5Nw')"></div>
</div>
<div class="p-md flex flex-col flex-grow">
<div class="flex justify-between items-start mb-xs">
<h4 class="font-body-md text-body-md font-medium text-on-surface line-clamp-2">Premium Vegan Leather Desk Mat</h4>
</div>
<span class="font-price-display text-price-display text-primary mt-auto">$35.00</span>
<button class="mt-sm w-full py-xs border border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors">Add to Cart</button>
</div>
</div>
<!-- Empty State / No Results (For testing visual layout) -->
<div class="col-span-full py-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl mt-lg bg-surface-bright">
<span class="material-symbols-outlined text-[48px] text-outline mb-sm">inventory_2</span>
<h4 class="font-headline-lg text-headline-lg text-on-surface mb-xs">No more results</h4>
<p class="font-body-md text-body-md text-on-surface-variant text-center max-w-sm mb-md">We couldn't find any other products matching your current filters in this branch.</p>
<button class="text-primary hover:text-primary-fixed-dim font-label-md text-label-md underline">Clear Filters</button>
</div>
</div>
</main>
<!-- Footer (Shared Component) -->
<footer class="bg-surface-container-low dark:bg-inverse-surface full-width bottom border-t border-outline-variant dark:border-outline">
<div class="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-md">
<!-- Brand -->
<div class="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface flex items-center gap-2">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">widgets</span>
                Meridian Store
            </div>
<!-- Links -->
<div class="flex gap-md font-label-md text-label-md text-on-surface-variant dark:text-outline">
<a class="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Privacy Policy</a>
<a class="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Terms of Service</a>
<a class="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Legal</a>
</div>
<!-- Copyright -->
<div class="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed">
                Powered by MeridianERP
            </div>
</div>
</footer>
</body></html>

<!-- Unified Catalog -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Checkout - Meridian Store</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-container": "#da3437",
                        "primary-fixed": "#e1e0ff",
                        "on-tertiary-fixed-variant": "#930013",
                        "background": "#f9f9ff",
                        "on-secondary": "#ffffff",
                        "tertiary-fixed-dim": "#ffb3ad",
                        "on-tertiary-container": "#fffbff",
                        "surface-bright": "#f9f9ff",
                        "surface-tint": "#494bd6",
                        "on-secondary-fixed": "#002113",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed": "#6ffbbe",
                        "outline-variant": "#c7c4d7",
                        "error": "#ba1a1a",
                        "primary": "#4648d4",
                        "surface-container-lowest": "#ffffff",
                        "on-surface": "#141b2b",
                        "error-container": "#ffdad6",
                        "on-primary-fixed": "#07006c",
                        "secondary-fixed-dim": "#4edea3",
                        "surface-container-highest": "#dce2f7",
                        "surface-dim": "#d3daef",
                        "on-tertiary-fixed": "#410004",
                        "tertiary": "#b61722",
                        "outline": "#767586",
                        "surface-variant": "#dce2f7",
                        "on-primary-container": "#fffbff",
                        "primary-container": "#6063ee",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "on-error-container": "#93000a",
                        "on-surface-variant": "#464554",
                        "secondary": "#006c49",
                        "surface": "#f9f9ff",
                        "on-primary": "#ffffff",
                        "primary-fixed-dim": "#c0c1ff",
                        "surface-container-high": "#e1e8fd",
                        "on-error": "#ffffff",
                        "surface-container": "#e9edff",
                        "on-secondary-fixed-variant": "#005236",
                        "secondary-container": "#6cf8bb",
                        "inverse-surface": "#293040",
                        "inverse-on-surface": "#edf0ff",
                        "inverse-primary": "#c0c1ff",
                        "on-background": "#141b2b",
                        "surface-container-low": "#f1f3ff",
                        "on-secondary-container": "#00714d",
                        "tertiary-fixed": "#ffdad7"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "lg": "24px",
                        "base": "4px",
                        "md": "16px",
                        "3xl": "64px",
                        "sm": "12px",
                        "margin-mobile": "16px",
                        "margin-desktop": "48px",
                        "2xl": "48px",
                        "xs": "8px",
                        "gutter": "24px",
                        "xl": "32px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Inter"],
                        "price-display": ["Inter"],
                        "body-md": ["Inter"],
                        "body-sm": ["Inter"],
                        "label-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-xl": ["Inter"]
                    },
                    "fontSize": {
                        "headline-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "price-display": ["20px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-xl": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-background text-on-background font-body-md min-h-screen flex flex-col">
<!-- Top Navigation Anchor (Suppressed nav links for transactional flow) -->
<header class="bg-surface dark:bg-surface-dim shadow-sm dark:shadow-none border-b border-outline-variant dark:border-outline docked full-width top-0 sticky z-50">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-7xl mx-auto h-20">
<a class="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed" href="#">Meridian Store</a>
<div class="flex items-center gap-4 text-primary dark:text-primary-fixed-dim">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">lock</span>
<span class="font-label-md text-label-md">Secure Checkout</span>
</div>
</div>
</header>
<!-- Main Content -->
<main class="flex-grow px-margin-mobile md:px-margin-desktop py-lg md:py-2xl max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-gutter">
<!-- Left Column: Form Page Frame (Bento Grid) -->
<div class="md:col-span-7 lg:col-span-8 flex flex-col gap-lg">
<!-- Section 1: Contact Information -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
<h2 class="font-headline-lg text-headline-lg mb-md text-on-surface">Contact Information</h2>
<div class="flex flex-col gap-sm">
<label class="font-label-md text-label-md text-on-surface-variant" for="email">Email Address</label>
<input class="border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface" id="email" placeholder="Enter your email" type="email"/>
</div>
</section>
<!-- Section 2: Fulfillment Method -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
<h2 class="font-headline-lg text-headline-lg mb-md text-on-surface">Fulfillment Method</h2>
<div class="grid grid-cols-2 gap-md">
<label class="cursor-pointer">
<input checked="" class="peer sr-only" name="fulfillment" type="radio" value="delivery"/>
<div class="border border-outline-variant rounded-lg p-md text-center peer-checked:border-primary peer-checked:bg-primary-container/10 transition-colors">
<span class="material-symbols-outlined mb-xs text-primary" style="font-variation-settings: 'FILL' 0;">local_shipping</span>
<div class="font-label-md text-label-md text-on-surface">Delivery</div>
</div>
</label>
<label class="cursor-pointer">
<input class="peer sr-only" name="fulfillment" type="radio" value="pickup"/>
<div class="border border-outline-variant rounded-lg p-md text-center peer-checked:border-primary peer-checked:bg-primary-container/10 transition-colors">
<span class="material-symbols-outlined mb-xs text-primary" style="font-variation-settings: 'FILL' 0;">storefront</span>
<div class="font-label-md text-label-md text-on-surface">Pickup</div>
</div>
</label>
</div>
</section>
<!-- Section 3: Shipping Address -->
<section class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
<h2 class="font-headline-lg text-headline-lg mb-md text-on-surface">Shipping Address</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
<div class="flex flex-col gap-sm md:col-span-2">
<label class="font-label-md text-label-md text-on-surface-variant" for="name">Full Name</label>
<input class="border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface" id="name" type="text"/>
</div>
<div class="flex flex-col gap-sm md:col-span-2">
<label class="font-label-md text-label-md text-on-surface-variant" for="street">Street Address</label>
<input class="border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface" id="street" type="text"/>
</div>
<div class="flex flex-col gap-sm">
<label class="font-label-md text-label-md text-on-surface-variant" for="city">City</label>
<input class="border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface" id="city" type="text"/>
</div>
<div class="flex flex-col gap-sm">
<label class="font-label-md text-label-md text-on-surface-variant" for="zip">ZIP Code</label>
<input class="border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface" id="zip" type="text"/>
</div>
</div>
</section>
<button class="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-label-md text-label-md rounded-lg py-md w-full transition-colors mt-4">
                Continue to Payment
            </button>
</div>
<!-- Right Column: Sticky Summary (Bento Tile) -->
<div class="md:col-span-5 lg:col-span-4 relative">
<div class="sticky top-[104px] bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-md">
<h2 class="font-headline-lg text-headline-lg text-on-surface">Order Summary</h2>
<!-- Cart Items -->
<div class="flex flex-col gap-md border-b border-outline-variant pb-md">
<!-- Item 1 -->
<div class="flex gap-md items-center">
<div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A minimalist overhead view of a sleek, matte black wireless headphone set resting on a pristine white marble surface, bathed in soft, diffused natural daylight. The design aesthetic is premium, modern, and high-fidelity tech." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNYKXp7b2HqTty_KOfOF3R7Flc5ZJZ-y8JyKR4Tzm7omxHlsuVvLdIcSUFl1OgHxcSQjdxfrplt7e1uT5HKYwCWi9smWF4CVvUtjV7spTHKvI5h3tUQAs6GaD_vtHbAeZ2yWCUuj8AVutAAOypnVQ7003jDmOfvhWesIO-bMU5ykw3jcWomMlRb-pzjLo6ErPKSriKXGmOLXlIe0npbbuMkseQdFuloUdCfrxGNoGjefQVJuf8coIVlg"/>
</div>
<div class="flex-grow">
<h3 class="font-label-md text-label-md text-on-surface">Aura Noise-Cancelling Headphones</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">Matte Black, Qty: 1</p>
</div>
<span class="font-price-display text-price-display text-on-surface">$299.00</span>
</div>
<!-- Item 2 -->
<div class="flex gap-md items-center">
<div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A clean, close-up shot of an elegant, minimalist titanium smart watch with a woven silver band, sitting against a subtle light grey background. High-key lighting emphasizes the premium metallic finish and modern design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtrEJVBHW4QxRC0ITa__s4gHkvwcsuTXHs5QS1UVwzlQKdLKN28aiLGQlIh-NsJ0PmR7am2RVrmW55zA17VowAShIJN0785mDg0ztZ0qpe4eK17PJCnvE0Ou3L3CX8bKmMKlTugIgC6XsLysspEh8DsqIgw9lotXbalpdxLrMupov6PNTo7Ov55KiX4sDa6lxQZeVCtGmrRXt2QO5JRoxdFysrUH_c6hs8dNvRcapyvcP1si7Evm5GvQ"/>
</div>
<div class="flex-grow">
<h3 class="font-label-md text-label-md text-on-surface">Meridian Smart Chrono</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">Titanium, Qty: 1</p>
</div>
<span class="font-price-display text-price-display text-on-surface">$199.00</span>
</div>
</div>
<!-- Promo Code -->
<div class="flex gap-sm py-sm border-b border-outline-variant">
<input class="flex-grow border border-outline-variant rounded-lg px-sm py-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-transparent text-on-surface text-body-sm font-body-sm" placeholder="Promo code" type="text"/>
<button class="bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md rounded-lg px-md transition-colors border border-outline-variant">Apply</button>
</div>
<!-- Totals -->
<div class="flex flex-col gap-sm pt-sm">
<div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Subtotal</span>
<span>$498.00</span>
</div>
<div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Shipping</span>
<span>Calculated at next step</span>
</div>
<div class="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
<span>Tax</span>
<span>$44.82</span>
</div>
<div class="flex justify-between font-price-display text-price-display text-on-surface mt-sm pt-sm border-t border-outline-variant">
<span>Total</span>
<span>$542.82</span>
</div>
</div>
</div>
</div>
</main>
<!-- Footer Component Anchor -->
<footer class="bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant dark:border-outline full-width bottom mt-auto">
<div class="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">Powered by MeridianERP</span>
<div class="flex gap-lg mt-md md:mt-0">
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Privacy Policy</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Terms of Service</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Legal</a>
</div>
</div>
</footer>
</body></html>

<!-- Checkout -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Meridian Pro Wireless Headphones - Meridian Store</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-container": "#da3437",
                        "primary-fixed": "#e1e0ff",
                        "on-tertiary-fixed-variant": "#930013",
                        "background": "#f9f9ff",
                        "on-secondary": "#ffffff",
                        "tertiary-fixed-dim": "#ffb3ad",
                        "on-tertiary-container": "#fffbff",
                        "surface-bright": "#f9f9ff",
                        "surface-tint": "#494bd6",
                        "on-secondary-fixed": "#002113",
                        "on-tertiary": "#ffffff",
                        "secondary-fixed": "#6ffbbe",
                        "outline-variant": "#c7c4d7",
                        "error": "#ba1a1a",
                        "primary": "#4648d4",
                        "surface-container-lowest": "#ffffff",
                        "on-surface": "#141b2b",
                        "error-container": "#ffdad6",
                        "on-primary-fixed": "#07006c",
                        "secondary-fixed-dim": "#4edea3",
                        "surface-container-highest": "#dce2f7",
                        "surface-dim": "#d3daef",
                        "on-tertiary-fixed": "#410004",
                        "tertiary": "#b61722",
                        "outline": "#767586",
                        "surface-variant": "#dce2f7",
                        "on-primary-container": "#fffbff",
                        "primary-container": "#6063ee",
                        "on-primary-fixed-variant": "#2f2ebe",
                        "on-error-container": "#93000a",
                        "on-surface-variant": "#464554",
                        "secondary": "#006c49",
                        "surface": "#f9f9ff",
                        "on-primary": "#ffffff",
                        "primary-fixed-dim": "#c0c1ff",
                        "surface-container-high": "#e1e8fd",
                        "on-error": "#ffffff",
                        "surface-container": "#e9edff",
                        "on-secondary-fixed-variant": "#005236",
                        "secondary-container": "#6cf8bb",
                        "inverse-surface": "#293040",
                        "inverse-on-surface": "#edf0ff",
                        "inverse-primary": "#c0c1ff",
                        "on-background": "#141b2b",
                        "surface-container-low": "#f1f3ff",
                        "on-secondary-container": "#00714d",
                        "tertiary-fixed": "#ffdad7"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "lg": "24px",
                        "base": "4px",
                        "md": "16px",
                        "3xl": "64px",
                        "sm": "12px",
                        "margin-mobile": "16px",
                        "margin-desktop": "48px",
                        "2xl": "48px",
                        "xs": "8px",
                        "gutter": "24px",
                        "xl": "32px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Inter"],
                        "price-display": ["Inter"],
                        "body-md": ["Inter"],
                        "body-sm": ["Inter"],
                        "label-md": ["Inter"],
                        "headline-lg-mobile": ["Inter"],
                        "headline-xl": ["Inter"]
                    },
                    "fontSize": {
                        "headline-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "price-display": ["20px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500" }],
                        "headline-lg-mobile": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "headline-xl": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        
        /* Select styling */
        .select-trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--tw-colors-outline-variant);
            border-radius: var(--tw-border-radius-DEFAULT);
            background-color: var(--tw-colors-surface-container-lowest);
            color: var(--tw-colors-on-surface);
            transition: all 0.2s;
        }
        .select-trigger:focus {
            outline: none;
            border-color: var(--tw-colors-primary);
            box-shadow: 0 0 0 2px var(--tw-colors-primary-fixed);
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col font-body-md">
<!-- TopNavBar -->
<nav class="bg-surface border-b border-outline-variant shadow-sm w-full top-0 sticky z-50">
<div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto h-20">
<!-- Brand -->
<div class="flex-shrink-0 flex items-center">
<span class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary">Meridian Store</span>
</div>
<!-- Navigation Links (Desktop) -->
<div class="hidden md:flex space-x-8 items-center">
<a class="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 transition-all" href="#">Shop</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Cart</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Account</a>
</div>
<!-- Trailing Icons -->
<div class="flex items-center space-x-4">
<button aria-label="storefront" class="text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors duration-200">
<span class="material-symbols-outlined">storefront</span>
</button>
<button aria-label="language" class="text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors duration-200 hidden md:block">
<span class="material-symbols-outlined">language</span>
</button>
<button aria-label="shopping_cart" class="text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors duration-200 relative">
<span class="material-symbols-outlined">shopping_cart</span>
<span class="absolute top-1 right-1 bg-tertiary text-on-tertiary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
</button>
<button aria-label="person" class="text-on-surface-variant hover:text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors duration-200 hidden md:block">
<span class="material-symbols-outlined">person</span>
</button>
<!-- Mobile Menu Toggle -->
<button class="md:hidden text-on-surface-variant hover:text-primary p-2 rounded-full transition-colors duration-200">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</div>
</nav>
<!-- Main Content -->
<main class="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-2xl">
<!-- Bento Layout for PDP -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<!-- Left Column: Product Image -->
<div class="lg:col-span-7 flex flex-col gap-sm">
<div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant aspect-square shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] relative group">
<img alt="Meridian Pro Wireless Headphones" class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" data-alt="A sleek, high-end pair of over-ear wireless headphones presented on a pristine, minimalist white background. The lighting is studio quality, creating soft highlights that accentuate the premium matte black finish and metallic hinges. The overall aesthetic is clean, modern, and technologically advanced, perfectly suited for a premium e-commerce product detail page." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWz-6sTwESqcvL80tJgB-u5psH4xdxT_KXFVIsGR4WqEkmjnsdo5epiE3WpQmEFfSCysTIJxjG7jC-PAP5X25c6DV5F1aIvBmTVqv3Dm5mEC5Lh5CoLkcaaC0WD8bckqoz2_ufCM5y79-klcWbo7EKwV9oviBhOzresD_DGbRzWG6LzIT6wi-ZkzlqiWfrVxQ5H-9nkz3gvrSePA4F1UxvcNtdqKCCD2i12MPXyr7z0NBEZnT15iRoYQ"/>
<!-- Image Gallery Indicators -->
<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
<div class="w-2 h-2 rounded-full bg-primary"></div>
<div class="w-2 h-2 rounded-full bg-outline-variant"></div>
<div class="w-2 h-2 rounded-full bg-outline-variant"></div>
<div class="w-2 h-2 rounded-full bg-outline-variant"></div>
</div>
</div>
<!-- Thumbnails -->
<div class="grid grid-cols-4 gap-sm hidden md:grid">
<div class="bg-surface-container-lowest rounded-lg overflow-hidden border-2 border-primary cursor-pointer aspect-square">
<img alt="Thumbnail 1" class="w-full h-full object-cover" data-alt="Close up shot of the ear cup of premium wireless headphones showing the plush memory foam padding and sleek outer shell on a clean white background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRIEZs1hQCjhaTl_9x9acsFucn3YV5Y7BRq93wEKzb2GUqRX8J-97PLI_Ovubv0G9RIjHhNqe6nuzt64Qyik8EwqRqfErNZ02gQTJlPdezIoe_gL62fjenhfDx6BcaeRiq2vffds16vWHIbatynBMoSdeT1neM-MchHN6sHqjGMc13P7dMvylAMcTxE_alexqJW3VLqr-gyrPh7X-7KiV5lUHMoxi7ZxFos-iMvC5sJAYqhDpb4l6cZg"/>
</div>
<div class="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant hover:border-primary-fixed-dim cursor-pointer aspect-square transition-colors">
<img alt="Thumbnail 2" class="w-full h-full object-cover" data-alt="Side profile view of premium wireless headphones, emphasizing the adjustable headband and metallic hinges against a minimalist white backdrop." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs_0NGw8675D4cEPWjmSBl3GMubmp7DBTdqa6NgKNfWsS1BwPYmNO-S-EalyKQ36OucFd6TFkC6psUpKtCAaepgAuNcBufxLlEUFij1R2NpDJB4wys63_tR_yXyzKvYvmMT6MIT7TFrZIYZxl8YQtTvl5nJ8wxiZ5FGU58X2Hl-6d3txIiRSVAA61JEcqT3mlAgBwpYnbMj8FKl_hJpY4GU8sVfFi0wLDKNB5-bFqWUJJsXXO9fzEgdg"/>
</div>
<div class="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant hover:border-primary-fixed-dim cursor-pointer aspect-square transition-colors">
<img alt="Thumbnail 3" class="w-full h-full object-cover" data-alt="Premium wireless headphones shown folded flat in their sleek protective carrying case, bright studio lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB57p0syvoiMihCeUh_P86nx-kpeBGc4tLkP7SD9lrI1KWAnHS6MDOu-tSlWfA5Q6ACIcxDXnR4TMawfzh7wglYxnlF3jbdbtHFspjfTM2l1pHHTrkcfAxOiM74hBXnCbcdIoAJ8K7Tn1MtHtQCSpyhZMvoqzgmL1uR7tjKYeRh1EUo3rjaVDO44l5ArBVsDVYO_neAH_8APHdafPmscTwGhy9sR0y_DPac4ZUUFWYfgUPGCYcYNleN4w"/>
</div>
<div class="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant hover:border-primary-fixed-dim cursor-pointer aspect-square transition-colors">
<img alt="Thumbnail 4" class="w-full h-full object-cover" data-alt="Detail shot focusing on the tactile control buttons and USB-C charging port on the right ear cup of premium wireless headphones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcjw2A8Ru8ftf9DNk2aFO98OJmS2758OehWtCGHNTzW3Bi2Pek3Mn4OccPzxSrqaRPpLdwC6s43_iBO02t3UItk7JQPp4446_VLo7QwSXvklygGNe2qbifda9Jfn5XsP0TU2w2KsfkVlnzdAzNLh1erg6LXonV7nxtBKlOCgktX05jvfdTNd6AiemVACVRvoCU-ncWnwjLg5xg1Ewxyq3m8bFhV2s2mofpR2EMBao-Y2q8ylzn7t3x0Q"/>
</div>
</div>
</div>
<!-- Right Column: Product Details -->
<div class="lg:col-span-5 flex flex-col gap-lg lg:sticky lg:top-28 h-fit">
<!-- Header Info -->
<div class="flex flex-col gap-base">
<!-- Badges -->
<div class="flex items-center gap-2 mb-2">
<span class="inline-flex items-center px-2 py-1 rounded-full bg-surface-container-high text-primary font-label-md text-label-md">New Arrival</span>
<span class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
<span class="material-symbols-outlined fill text-yellow-400 text-[18px]">star</span>
                            4.9 (128 reviews)
                        </span>
</div>
<h1 class="font-headline-xl text-headline-xl text-on-surface">Meridian Pro Wireless Headphones</h1>
<p class="font-price-display text-price-display text-primary mt-2">$199.00</p>
<p class="font-body-md text-body-md text-on-surface-variant mt-2">
                        High-fidelity audio with active noise cancellation and 40-hour battery life. Experience immersive sound in a premium, lightweight design.
                    </p>
</div>
<hr class="border-outline-variant/50"/>
<!-- Variation Selection -->
<div class="flex flex-col gap-xs relative">
<label class="font-label-md text-label-md text-on-surface">Color</label>
<!-- Custom Select (Shadcn style approach) -->
<div class="relative w-full">
<button aria-expanded="false" aria-haspopup="listbox" class="select-trigger font-body-sm text-body-sm" id="color-select-btn">
<span class="flex items-center gap-2">
<span class="w-4 h-4 rounded-full bg-slate-900 border border-outline-variant"></span>
                                Midnight Black
                            </span>
<span class="material-symbols-outlined text-outline">expand_more</span>
</button>
<!-- Dropdown (Hidden by default, visual representation) -->
<div class="absolute w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-lg z-10 hidden" id="color-dropdown">
<ul class="py-1 font-body-sm text-body-sm" role="listbox">
<li aria-selected="true" class="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex items-center justify-between" role="option">
<div class="flex items-center gap-2">
<span class="w-4 h-4 rounded-full bg-slate-900 border border-outline-variant"></span>
<span>Midnight Black</span>
</div>
<span class="material-symbols-outlined text-primary text-[18px]">check</span>
</li>
<li class="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex items-center gap-2" role="option">
<span class="w-4 h-4 rounded-full bg-gray-400 border border-outline-variant"></span>
                                    Silver Grey
                                </li>
<li class="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex items-center gap-2" role="option">
<span class="w-4 h-4 rounded-full bg-blue-800 border border-outline-variant"></span>
                                    Ocean Blue
                                </li>
</ul>
</div>
</div>
</div>
<!-- Status & Action -->
<div class="flex flex-col gap-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
<div class="flex items-start gap-2">
<span class="material-symbols-outlined text-secondary text-[20px] mt-0.5">check_circle</span>
<div>
<p class="font-label-md text-label-md text-on-surface">In Stock</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">Ready for pickup or delivery</p>
</div>
</div>
<button class="w-full bg-[#6366F1] hover:bg-indigo-600 text-white font-label-md text-label-md py-3 rounded-lg flex justify-center items-center gap-2 transition-colors duration-200">
<span class="material-symbols-outlined text-[20px]">shopping_bag</span>
                        Add to Cart
                    </button>
</div>
<!-- Accordions (Progressive Disclosure) -->
<div class="flex flex-col border-t border-outline-variant mt-2">
<!-- Spec Accordion -->
<div class="border-b border-outline-variant">
<button class="w-full py-4 flex justify-between items-center group cursor-pointer">
<span class="font-label-md text-label-md text-on-surface">Specifications</span>
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">expand_more</span>
</button>
<!-- Content would go here in actual implementation, hidden for default state -->
</div>
<!-- Shipping Accordion -->
<div class="border-b border-outline-variant">
<button class="w-full py-4 flex justify-between items-center group cursor-pointer">
<span class="font-label-md text-label-md text-on-surface">Shipping Policy</span>
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">expand_more</span>
</button>
</div>
</div>
</div>
</div>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low w-full bottom border-t border-outline-variant mt-auto">
<div class="w-full py-lg px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-md">
<div class="flex items-center">
<span class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Powered by MeridianERP</span>
</div>
<div class="flex flex-wrap justify-center gap-md">
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Privacy Policy</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Terms of Service</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Legal</a>
</div>
</div>
</footer>
<script>
        // Simple script to handle the select dropdown toggle for demonstration
        document.addEventListener('DOMContentLoaded', () => {
            const selectBtn = document.getElementById('color-select-btn');
            const dropdown = document.getElementById('color-dropdown');
            
            if(selectBtn && dropdown) {
                selectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = selectBtn.getAttribute('aria-expanded') === 'true';
                    selectBtn.setAttribute('aria-expanded', !isExpanded);
                    dropdown.classList.toggle('hidden');
                    
                    const icon = selectBtn.querySelector('.material-symbols-outlined');
                    if(isExpanded) {
                        icon.textContent = 'expand_more';
                    } else {
                        icon.textContent = 'expand_less';
                    }
                });
                
                // Close when clicking outside
                document.addEventListener('click', () => {
                    selectBtn.setAttribute('aria-expanded', 'false');
                    dropdown.classList.add('hidden');
                    selectBtn.querySelector('.material-symbols-outlined').textContent = 'expand_more';
                });
            }
        });
    </script>
</body></html>

<!-- Product Detail -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Shopping Cart - Meridian Store</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "tertiary-container": "#da3437",
                      "primary-fixed": "#e1e0ff",
                      "on-tertiary-fixed-variant": "#930013",
                      "background": "#f9f9ff",
                      "on-secondary": "#ffffff",
                      "tertiary-fixed-dim": "#ffb3ad",
                      "on-tertiary-container": "#fffbff",
                      "surface-bright": "#f9f9ff",
                      "surface-tint": "#494bd6",
                      "on-secondary-fixed": "#002113",
                      "on-tertiary": "#ffffff",
                      "secondary-fixed": "#6ffbbe",
                      "outline-variant": "#c7c4d7",
                      "error": "#ba1a1a",
                      "primary": "#4648d4",
                      "surface-container-lowest": "#ffffff",
                      "on-surface": "#141b2b",
                      "error-container": "#ffdad6",
                      "on-primary-fixed": "#07006c",
                      "secondary-fixed-dim": "#4edea3",
                      "surface-container-highest": "#dce2f7",
                      "surface-dim": "#d3daef",
                      "on-tertiary-fixed": "#410004",
                      "tertiary": "#b61722",
                      "outline": "#767586",
                      "surface-variant": "#dce2f7",
                      "on-primary-container": "#fffbff",
                      "primary-container": "#6063ee",
                      "on-primary-fixed-variant": "#2f2ebe",
                      "on-error-container": "#93000a",
                      "on-surface-variant": "#464554",
                      "secondary": "#006c49",
                      "surface": "#f9f9ff",
                      "on-primary": "#ffffff",
                      "primary-fixed-dim": "#c0c1ff",
                      "surface-container-high": "#e1e8fd",
                      "on-error": "#ffffff",
                      "surface-container": "#e9edff",
                      "on-secondary-fixed-variant": "#005236",
                      "secondary-container": "#6cf8bb",
                      "inverse-surface": "#293040",
                      "inverse-on-surface": "#edf0ff",
                      "inverse-primary": "#c0c1ff",
                      "on-background": "#141b2b",
                      "surface-container-low": "#f1f3ff",
                      "on-secondary-container": "#00714d",
                      "tertiary-fixed": "#ffdad7"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "lg": "24px",
                      "base": "4px",
                      "md": "16px",
                      "3xl": "64px",
                      "sm": "12px",
                      "margin-mobile": "16px",
                      "margin-desktop": "48px",
                      "2xl": "48px",
                      "xs": "8px",
                      "gutter": "24px",
                      "xl": "32px"
              },
              "fontFamily": {
                      "headline-lg": [
                              "Inter"
                      ],
                      "price-display": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "body-sm": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Inter"
                      ],
                      "headline-xl": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "headline-lg": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "600"
                              }
                      ],
                      "price-display": [
                              "20px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "body-sm": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "500"
                              }
                      ],
                      "headline-lg-mobile": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-xl": [
                              "36px",
                              {
                                      "lineHeight": "44px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
    </script>
<style>
        body {
            background-color: #f9f9ff;
            color: #141b2b;
        }
        .bento-shadow {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .bento-shadow:hover {
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col font-body-md text-body-md bg-background">
<!-- TopNavBar -->
<nav class="bg-surface docked full-width top-0 sticky border-b border-outline-variant shadow-sm z-50">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-7xl mx-auto h-20 md:px-margin-desktop px-margin-mobile">
<!-- Brand -->
<div class="flex items-center gap-4">
<span class="font-headline-lg text-headline-lg font-bold text-primary md:hidden font-headline-lg-mobile text-headline-lg-mobile">Meridian Store</span>
<span class="font-headline-lg text-headline-lg font-bold text-primary hidden md:block">Meridian Store</span>
</div>
<!-- Navigation Links (Hidden on mobile) -->
<div class="hidden md:flex gap-8 items-center font-label-md text-label-md">
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Shop</a>
<a class="text-primary border-b-2 border-primary pb-1" href="#">Cart</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Account</a>
</div>
<!-- Trailing Icons -->
<div class="flex gap-4 items-center">
<button class="text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 p-2 rounded-full hidden md:block">
<span class="material-symbols-outlined" data-icon="storefront">storefront</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 p-2 rounded-full hidden md:block">
<span class="material-symbols-outlined" data-icon="language">language</span>
</button>
<button class="text-primary hover:bg-surface-container-low transition-colors duration-200 p-2 rounded-full opacity-80 scale-95 transition-all">
<span class="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 p-2 rounded-full">
<span class="material-symbols-outlined" data-icon="person">person</span>
</button>
</div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-xl md:py-3xl flex flex-col gap-lg">
<!-- BentoListHeader -->
<header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-sm md:gap-0 pb-sm border-b border-outline-variant">
<div>
<h1 class="font-headline-xl text-headline-xl text-on-surface md:hidden font-headline-lg-mobile text-headline-lg-mobile">Your Cart</h1>
<h1 class="font-headline-xl text-headline-xl text-on-surface hidden md:block">Your Cart</h1>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">3 items</p>
</div>
<div class="flex flex-col items-start md:items-end">
<span class="font-label-md text-label-md text-on-surface-variant">Subtotal</span>
<span class="font-price-display text-price-display text-primary mt-base">$2,499.00</span>
</div>
</header>
<!-- CartView Bento Grid -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<!-- Cart Items List (Spans 8 columns on large screens) -->
<div class="lg:col-span-8 flex flex-col gap-md">
<!-- Item 1 -->
<div class="bg-surface-container-lowest rounded-xl p-md border border-outline-variant bento-shadow flex flex-col sm:flex-row items-start sm:items-center gap-md transition-all duration-300">
<div class="w-full sm:w-32 aspect-square rounded-lg overflow-hidden shrink-0 border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A sleek, minimalist silver laptop computer resting on a pristine white desk. The lighting is bright and even, highlighting the premium metallic finish and modern design. The environment feels high-end, clean, and technologically advanced, perfectly aligned with a light-mode e-commerce aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt8_6Qh9Cx7-PAa7fMB_hCxsFPbZ_aAcUfd38LJrR7WZUoEV1rvgIqiRPV3JFTbp_Ijje_jaVI9H0FJlYYh1OEZw-iIfjF21-IN1DVOq43OTP3FobsKkIIYI7Xee5QP0CTRdDSQNFmvGNcgJmorWSLmr7n3dBroHzJ4qltg6CzYb4cv_5PKSmKH5i7qECXD8vcNIDw_XedN1RJaOjma_OHsIv5Mu1qv6RucNxsxNmaGaN2cJ3xulQY-w"/>
</div>
<div class="flex-grow flex flex-col gap-base w-full">
<div class="flex justify-between items-start w-full">
<h3 class="font-headline-lg text-headline-lg text-on-surface text-lg">Meridian Book Pro</h3>
<button aria-label="Remove item" class="text-outline hover:text-error transition-colors p-1">
<span class="material-symbols-outlined" data-icon="delete">delete</span>
</button>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">Silver, 16GB RAM, 512GB SSD</p>
<div class="flex justify-between items-center mt-sm w-full">
<div class="flex items-center border border-outline-variant rounded-full overflow-hidden bg-surface-container-lowest">
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">-</button>
<span class="px-3 py-1 font-body-sm text-body-sm text-on-surface border-x border-outline-variant min-w-[2.5rem] text-center">1</span>
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">+</button>
</div>
<span class="font-price-display text-price-display text-on-surface">$1,499.00</span>
</div>
</div>
</div>
<!-- Item 2 -->
<div class="bg-surface-container-lowest rounded-xl p-md border border-outline-variant bento-shadow flex flex-col sm:flex-row items-start sm:items-center gap-md transition-all duration-300">
<div class="w-full sm:w-32 aspect-square rounded-lg overflow-hidden shrink-0 border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A pair of premium noise-canceling over-ear headphones in matte black, placed elegantly on a light marble surface. Soft, ambient lighting creates subtle shadows, emphasizing the sleek curves and high-quality materials. The overall mood is sophisticated and modern, fitting a high-end tech store." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR1ekdxJn7cVKXylfkwFDK91JBYL8-M3IExUNkk1eMpYVShrKU-zZVCmhbasKvQqCi5Dy9Dg4IEvc4St5XPHFnW4eCShuH63k54dWwfsLMCxW_CH1AuFPtJn1bSYyketyZhQv0hlW81Cc9J_RtOdpD2fwsp3cXRoM57Z0GRpJK9vql7U0XpJL4q8MqNngGBCv3ocfiEpc2z4T_xxhgxi59u-M-UHBsogl1YjPLwYLnvh3WjfG_VNPiSw"/>
</div>
<div class="flex-grow flex flex-col gap-base w-full">
<div class="flex justify-between items-start w-full">
<h3 class="font-headline-lg text-headline-lg text-on-surface text-lg">Aura Sound ANC</h3>
<button aria-label="Remove item" class="text-outline hover:text-error transition-colors p-1">
<span class="material-symbols-outlined" data-icon="delete">delete</span>
</button>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">Matte Black, Over-ear</p>
<div class="flex justify-between items-center mt-sm w-full">
<div class="flex items-center border border-outline-variant rounded-full overflow-hidden bg-surface-container-lowest">
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">-</button>
<span class="px-3 py-1 font-body-sm text-body-sm text-on-surface border-x border-outline-variant min-w-[2.5rem] text-center">2</span>
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">+</button>
</div>
<span class="font-price-display text-price-display text-on-surface">$598.00</span>
</div>
</div>
</div>
<!-- Item 3 -->
<div class="bg-surface-container-lowest rounded-xl p-md border border-outline-variant bento-shadow flex flex-col sm:flex-row items-start sm:items-center gap-md transition-all duration-300">
<div class="w-full sm:w-32 aspect-square rounded-lg overflow-hidden shrink-0 border border-outline-variant">
<img class="w-full h-full object-cover" data-alt="A modern smart home hub with a circular minimalist design, glowing softly with a blue indicator light. It sits on a minimal wooden shelf against a clean white wall. The scene is brightly lit with natural light, conveying a sense of smart, contemporary living in a light-mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3b9bH6perFAk4suRSYp9b29z5j1v8kPjWiVmEzSb_VkvY5-Cze-ijgO3MNeuwHrwNto1p4G-J-q0BTnVc--NEIEMlSpTOWSe0X5lgRG2NxzALvtpve5INqBSA6NFSb85qhtfo8XbP1MopvXZ8z3CSOkraKiI3eu7DZLk6lKa_yiHGMA4CWkTRRUmR2TiGVkA2xpinPMrF96zz6NrgahAUmIKD3d4-DDIxC3T0S4QKabVkOVlXZRF3Ew"/>
</div>
<div class="flex-grow flex flex-col gap-base w-full">
<div class="flex justify-between items-start w-full">
<h3 class="font-headline-lg text-headline-lg text-on-surface text-lg">Nexus Home Hub</h3>
<button aria-label="Remove item" class="text-outline hover:text-error transition-colors p-1">
<span class="material-symbols-outlined" data-icon="delete">delete</span>
</button>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">Glacier White, 2nd Gen</p>
<div class="flex justify-between items-center mt-sm w-full">
<div class="flex items-center border border-outline-variant rounded-full overflow-hidden bg-surface-container-lowest">
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">-</button>
<span class="px-3 py-1 font-body-sm text-body-sm text-on-surface border-x border-outline-variant min-w-[2.5rem] text-center">1</span>
<button class="px-3 py-1 hover:bg-surface-container-low transition-colors text-on-surface-variant font-label-md text-label-md">+</button>
</div>
<span class="font-price-display text-price-display text-on-surface">$149.00</span>
</div>
</div>
</div>
</div>
<!-- Order Summary Sidebar (Spans 4 columns on large screens) -->
<div class="lg:col-span-4">
<div class="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant bento-shadow flex flex-col gap-md sticky top-[104px]">
<h2 class="font-headline-lg text-headline-lg text-on-surface border-b border-outline-variant pb-sm">Order Summary</h2>
<div class="flex flex-col gap-sm font-body-sm text-body-sm">
<div class="flex justify-between items-center">
<span class="text-on-surface-variant">Subtotal</span>
<span class="text-on-surface">$2,246.00</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant">Shipping Estimate</span>
<span class="text-on-surface">$15.00</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant">Tax Estimate</span>
<span class="text-on-surface">$238.00</span>
</div>
</div>
<div class="border-t border-outline-variant pt-sm mt-xs">
<div class="flex justify-between items-center font-price-display text-price-display">
<span class="text-on-surface font-medium">Total</span>
<span class="text-primary">$2,499.00</span>
</div>
</div>
<button class="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-full hover:bg-on-primary-fixed-variant transition-colors mt-sm flex items-center justify-center gap-2">
                        Proceed to Checkout
                        <span class="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
</button>
<a class="w-full border border-outline-variant text-on-surface-variant font-label-md text-label-md py-3 rounded-full hover:bg-surface-container-low transition-colors text-center mt-xs block" href="#">
                        Continue Shopping
                    </a>
</div>
</div>
</div>
<!-- Optional Empty State Example (Hidden by default) -->
<div class="hidden bg-surface-container-lowest rounded-xl p-3xl border border-outline-variant flex flex-col items-center justify-center text-center gap-md min-h-[400px]">
<span class="material-symbols-outlined text-[64px] text-outline-variant" data-icon="production_quantity_limits">production_quantity_limits</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface">Your cart is empty</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">Looks like you haven't added anything to your cart yet. Discover our latest products and exclusive deals.</p>
<button class="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-full hover:bg-on-primary-fixed-variant transition-colors mt-sm">
                Browse Shop
            </button>
</div>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low full-width bottom border-t border-outline-variant mt-auto">
<div class="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto md:px-margin-desktop px-margin-mobile gap-lg md:gap-0">
<!-- Brand Logo -->
<div class="font-headline-lg text-headline-lg text-on-surface md:hidden font-headline-lg-mobile text-headline-lg-mobile">Meridian Store</div>
<div class="font-headline-lg text-headline-lg text-on-surface hidden md:block">Meridian Store</div>
<!-- Links -->
<div class="flex gap-6 font-label-md text-label-md">
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#">Legal</a>
</div>
<!-- Copyright -->
<div class="font-body-sm text-body-sm text-secondary">
                Powered by MeridianERP
            </div>
</div>
</footer>
</body></html>

<!-- Shopping Cart -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Meridian Store - My Account</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-secondary": "#ffffff",
                    "secondary": "#006c49",
                    "surface": "#f9f9ff",
                    "surface-bright": "#f9f9ff",
                    "tertiary-container": "#da3437",
                    "on-secondary-container": "#00714d",
                    "tertiary": "#b61722",
                    "on-background": "#141b2b",
                    "secondary-fixed-dim": "#4edea3",
                    "tertiary-fixed-dim": "#ffb3ad",
                    "on-primary-fixed-variant": "#2f2ebe",
                    "on-primary-container": "#fffbff",
                    "primary-fixed-dim": "#c0c1ff",
                    "surface-dim": "#d3daef",
                    "on-secondary-fixed-variant": "#005236",
                    "on-tertiary-container": "#fffbff",
                    "error-container": "#ffdad6",
                    "secondary-container": "#6cf8bb",
                    "inverse-primary": "#c0c1ff",
                    "primary-container": "#6063ee",
                    "surface-tint": "#494bd6",
                    "on-surface-variant": "#464554",
                    "inverse-surface": "#293040",
                    "outline": "#767586",
                    "surface-container-lowest": "#ffffff",
                    "on-error-container": "#93000a",
                    "outline-variant": "#c7c4d7",
                    "surface-container-highest": "#dce2f7",
                    "error": "#ba1a1a",
                    "on-error": "#ffffff",
                    "tertiary-fixed": "#ffdad7",
                    "secondary-fixed": "#6ffbbe",
                    "background": "#f9f9ff",
                    "surface-container-high": "#e1e8fd",
                    "surface-container": "#e9edff",
                    "surface-container-low": "#f1f3ff",
                    "on-tertiary": "#ffffff",
                    "on-tertiary-fixed": "#410004",
                    "on-surface": "#141b2b",
                    "primary": "#4648d4",
                    "on-secondary-fixed": "#002113",
                    "on-primary": "#ffffff",
                    "on-primary-fixed": "#07006c",
                    "primary-fixed": "#e1e0ff",
                    "on-tertiary-fixed-variant": "#930013",
                    "surface-variant": "#dce2f7",
                    "inverse-on-surface": "#edf0ff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "gutter": "24px",
                    "base": "4px",
                    "md": "16px",
                    "3xl": "64px",
                    "xl": "32px",
                    "xs": "8px",
                    "margin-mobile": "16px",
                    "sm": "12px",
                    "lg": "24px",
                    "margin-desktop": "48px",
                    "2xl": "48px"
            },
            "fontFamily": {
                    "label-md": ["Inter", "sans-serif"],
                    "headline-lg-mobile": ["Inter", "sans-serif"],
                    "headline-xl": ["Inter", "sans-serif"],
                    "headline-lg": ["Inter", "sans-serif"],
                    "price-display": ["Inter", "sans-serif"],
                    "body-sm": ["Inter", "sans-serif"],
                    "body-md": ["Inter", "sans-serif"]
            },
            "fontSize": {
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                    "headline-lg-mobile": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "headline-xl": ["36px", {"lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "headline-lg": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "price-display": ["20px", {"lineHeight": "24px", "fontWeight": "600"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}]
            }
          }
        }
      }
    </script>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<nav class="bg-surface dark:bg-surface-dim docked full-width top-0 sticky border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none z-50">
<div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto h-20">
<!-- Brand Logo -->
<a class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary dark:text-primary-fixed flex items-center gap-2" href="#">
                Meridian Store
            </a>
<!-- Search Bar (hidden on mobile, visible md+) -->
<div class="hidden md:flex flex-1 max-w-md mx-8">
<div class="relative w-full">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style="font-variation-settings: 'FILL' 0;">search</span>
<input class="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-full bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition-all font-body-sm text-body-sm" placeholder="Search products..." type="text"/>
</div>
</div>
<!-- Navigation Links -->
<div class="hidden md:flex items-center gap-gutter">
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Shop</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Cart</a>
<a class="font-label-md text-label-md text-primary border-b-2 border-primary pb-1" href="#">Account</a>
</div>
<!-- Trailing Icons -->
<div class="flex items-center gap-sm">
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 group md:hidden">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">search</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 group">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">storefront</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 group hidden sm:block">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">language</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 group relative">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">shopping_cart</span>
<span class="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 group hidden md:block">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">person</span>
</button>
<!-- Mobile Menu Toggle -->
<button class="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 md:hidden">
<span class="material-symbols-outlined text-on-surface-variant">menu</span>
</button>
</div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg md:py-2xl grid grid-cols-1 md:grid-cols-12 gap-gutter">
<!-- Sidebar Navigation -->
<aside class="md:col-span-3 hidden md:block">
<nav class="sticky top-32 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                    Orders
                </a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">location_on</span>
                    Addresses
                </a>
<a class="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary font-label-md text-label-md transition-all" href="#">
<span class="material-symbols-outlined">settings</span>
                    Settings
                </a>
</nav>
</aside>
<!-- Main Workspace -->
<div class="col-span-1 md:col-span-9 space-y-gutter">
<!-- User Profile Header -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md md:p-lg flex flex-col sm:flex-row items-center sm:items-start gap-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300">
<div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-container flex-shrink-0">
<img alt="User Avatar" class="w-full h-full object-cover" data-alt="A close-up studio portrait of a young professional wearing a casual yet stylish outfit against a clean white background. High-key lighting, bright and modern aesthetic matching a premium e-commerce platform. Indigo accents subtly visible in the background styling." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUGf8tr0kGVLdXxk4rtxTn5ysqJAUEchbHD0IUcmGayV7g_t55uhClyQ_EqX06QxAEjJgEZp6qabVKXBPJn3x9MfA98NKI-aMu82cLT7Ie04LfWGCGufSm2-kJIxrP_yxdkjTMwtdtm5QAuWhJzmqIsXBovuJayHxOK0L95talqEpC-NPV5kv5PhyJyZfjZsFPJ_MKfnCCgwNT1D_SFPT3GTJeCXINY2V7QB8kasbkEspuztlPQyp21Q"/>
</div>
<div class="text-center sm:text-left flex-1">
<h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Alex Morgan</h1>
<p class="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
<span class="material-symbols-outlined text-[16px]">mail</span>
                        alex.morgan@example.com
                    </p>
<div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md text-xs">
<span class="material-symbols-outlined text-[14px]">star</span> Premium Member
                        </span>
</div>
</div>
<div class="mt-4 sm:mt-0">
<button class="px-4 py-2 border border-outline-variant rounded-lg text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors duration-200">
                        Edit Profile
                    </button>
</div>
</div>
<!-- Bento Metrics -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
<!-- Total Orders Metric -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group">
<div class="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors"></div>
<div class="flex items-start justify-between relative z-10">
<div>
<p class="font-label-md text-label-md text-on-surface-variant mb-2">Total Orders</p>
<p class="font-headline-xl text-headline-xl text-on-surface">14</p>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
<span class="material-symbols-outlined">shopping_bag</span>
</div>
</div>
<div class="mt-4 flex items-center gap-2">
<span class="text-secondary font-label-md text-label-md flex items-center text-xs">
<span class="material-symbols-outlined text-[14px]">trending_up</span> +2 this month
                        </span>
</div>
</div>
<!-- Lifetime Spend Metric -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden group">
<div class="absolute -right-6 -top-6 w-24 h-24 bg-secondary/5 rounded-full blur-xl group-hover:bg-secondary/10 transition-colors"></div>
<div class="flex items-start justify-between relative z-10">
<div>
<p class="font-label-md text-label-md text-on-surface-variant mb-2">Lifetime Spend</p>
<p class="font-headline-xl text-headline-xl text-on-surface font-price-display">$1,249.50</p>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
<span class="material-symbols-outlined">account_balance_wallet</span>
</div>
</div>
<div class="mt-4 flex items-center gap-2">
<span class="text-on-surface-variant font-body-sm text-body-sm text-xs">Top 15% of shoppers</span>
</div>
</div>
</div>
<!-- Order History List Frame -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
<div class="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Order History</h2>
<button class="text-primary font-label-md text-label-md hover:underline flex items-center gap-1">
                        View All <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="border-b border-outline-variant bg-surface-container-lowest">
<th class="p-md font-label-md text-label-md text-on-surface-variant font-medium">Order ID</th>
<th class="p-md font-label-md text-label-md text-on-surface-variant font-medium">Date</th>
<th class="p-md font-label-md text-label-md text-on-surface-variant font-medium">Total</th>
<th class="p-md font-label-md text-label-md text-on-surface-variant font-medium">Status</th>
<th class="p-md font-label-md text-label-md text-on-surface-variant font-medium text-right">Action</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<!-- Row 1 -->
<tr class="hover:bg-surface-container-low transition-colors duration-150">
<td class="p-md font-body-sm text-body-sm text-on-surface font-medium">#ORD-9021</td>
<td class="p-md font-body-sm text-body-sm text-on-surface-variant">Oct 24, 2023</td>
<td class="p-md font-body-sm text-body-sm text-on-surface font-price-display">$129.99</td>
<td class="p-md">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
                                        Processing
                                    </span>
</td>
<td class="p-md text-right">
<button class="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-highest">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Row 2 -->
<tr class="hover:bg-surface-container-low transition-colors duration-150">
<td class="p-md font-body-sm text-body-sm text-on-surface font-medium">#ORD-8843</td>
<td class="p-md font-body-sm text-body-sm text-on-surface-variant">Sep 12, 2023</td>
<td class="p-md font-body-sm text-body-sm text-on-surface font-price-display">$84.50</td>
<td class="p-md">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                                        Shipped
                                    </span>
</td>
<td class="p-md text-right">
<button class="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-highest">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Row 3 -->
<tr class="hover:bg-surface-container-low transition-colors duration-150">
<td class="p-md font-body-sm text-body-sm text-on-surface font-medium">#ORD-7652</td>
<td class="p-md font-body-sm text-body-sm text-on-surface-variant">Aug 05, 2023</td>
<td class="p-md font-body-sm text-body-sm text-on-surface font-price-display">$345.00</td>
<td class="p-md">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface">
                                        Delivered
                                    </span>
</td>
<td class="p-md text-right">
<button class="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-highest">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Pagination / Footer -->
<div class="p-md border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
<span class="font-body-sm text-body-sm text-on-surface-variant">Showing 1 to 3 of 14 orders</span>
<div class="flex gap-2">
<button class="p-1 border border-outline-variant rounded hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50" disabled="">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="p-1 border border-outline-variant rounded hover:bg-surface-container-low text-on-surface-variant">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</div>
<!-- Example of Empty State (Hidden by default, shown here for structure reference if needed dynamically) -->
<!-- 
            <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-3xl flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div class="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant mb-4">
                    <span class="material-symbols-outlined text-[32px]">inventory_2</span>
                </div>
                <h3 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">No orders yet</h3>
                <p class="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">Looks like you haven't made any purchases yet. Start exploring our collection to find something you love.</p>
                <button class="bg-primary text-on-primary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-surface-tint transition-colors shadow-sm">
                    Start Shopping
                </button>
            </div>
            -->
</div>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant dark:border-outline full-width bottom w-full py-lg px-margin-mobile md:px-margin-desktop mt-auto">
<div class="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface">Meridian Store</span>
<div class="flex flex-wrap justify-center gap-6">
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Privacy Policy</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Terms of Service</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Legal</a>
</div>
<span class="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed">Powered by MeridianERP</span>
</div>
</footer>
</body></html>

<!-- User Account & Orders -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Address Management - Meridian Store</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary": "#ffffff",
                      "secondary": "#006c49",
                      "surface": "#f9f9ff",
                      "surface-bright": "#f9f9ff",
                      "tertiary-container": "#da3437",
                      "on-secondary-container": "#00714d",
                      "tertiary": "#b61722",
                      "on-background": "#141b2b",
                      "secondary-fixed-dim": "#4edea3",
                      "tertiary-fixed-dim": "#ffb3ad",
                      "on-primary-fixed-variant": "#2f2ebe",
                      "on-primary-container": "#fffbff",
                      "primary-fixed-dim": "#c0c1ff",
                      "surface-dim": "#d3daef",
                      "on-secondary-fixed-variant": "#005236",
                      "on-tertiary-container": "#fffbff",
                      "error-container": "#ffdad6",
                      "secondary-container": "#6cf8bb",
                      "inverse-primary": "#c0c1ff",
                      "primary-container": "#6063ee",
                      "surface-tint": "#494bd6",
                      "on-surface-variant": "#464554",
                      "inverse-surface": "#293040",
                      "outline": "#767586",
                      "surface-container-lowest": "#ffffff",
                      "on-error-container": "#93000a",
                      "outline-variant": "#c7c4d7",
                      "surface-container-highest": "#dce2f7",
                      "error": "#ba1a1a",
                      "on-error": "#ffffff",
                      "tertiary-fixed": "#ffdad7",
                      "secondary-fixed": "#6ffbbe",
                      "background": "#f9f9ff",
                      "surface-container-high": "#e1e8fd",
                      "surface-container": "#e9edff",
                      "surface-container-low": "#f1f3ff",
                      "on-tertiary": "#ffffff",
                      "on-tertiary-fixed": "#410004",
                      "on-surface": "#141b2b",
                      "primary": "#4648d4",
                      "on-secondary-fixed": "#002113",
                      "on-primary": "#ffffff",
                      "on-primary-fixed": "#07006c",
                      "primary-fixed": "#e1e0ff",
                      "on-tertiary-fixed-variant": "#930013",
                      "surface-variant": "#dce2f7",
                      "inverse-on-surface": "#edf0ff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "gutter": "24px",
                      "base": "4px",
                      "md": "16px",
                      "3xl": "64px",
                      "xl": "32px",
                      "xs": "8px",
                      "margin-mobile": "16px",
                      "sm": "12px",
                      "lg": "24px",
                      "margin-desktop": "48px",
                      "2xl": "48px"
              },
              "fontFamily": {
                      "label-md": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Inter"
                      ],
                      "headline-xl": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Inter"
                      ],
                      "price-display": [
                              "Inter"
                      ],
                      "body-sm": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "500"
                              }
                      ],
                      "headline-lg-mobile": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-xl": [
                              "36px",
                              {
                                      "lineHeight": "44px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-lg": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "600"
                              }
                      ],
                      "price-display": [
                              "20px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-sm": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ]
              }
      },
          },
        }
      </script>
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
<!-- TopNavBar -->
<header class="bg-surface dark:bg-surface-dim docked full-width top-0 sticky border-b border-outline-variant dark:border-outline shadow-sm dark:shadow-none z-50">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-7xl mx-auto h-20">
<div class="flex items-center gap-gutter">
<a class="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed" href="#">Meridian Store</a>
<nav class="hidden md:flex gap-md items-center">
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 px-sm py-xs rounded" href="#">Shop</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 px-sm py-xs rounded" href="#">Cart</a>
<a class="font-label-md text-label-md text-primary dark:text-primary-fixed-dim border-b-2 border-primary dark:border-primary-fixed-dim pb-1 opacity-80 scale-95 transition-all px-sm py-xs rounded" href="#">Account</a>
</nav>
</div>
<div class="flex items-center gap-sm">
<button aria-label="storefront" class="p-xs rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-primary dark:text-primary-fixed-dim">
<span class="material-symbols-outlined" data-icon="storefront">storefront</span>
</button>
<button aria-label="language" class="p-xs rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-primary dark:text-primary-fixed-dim">
<span class="material-symbols-outlined" data-icon="language">language</span>
</button>
<button aria-label="shopping_cart" class="p-xs rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-primary dark:text-primary-fixed-dim">
<span class="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
</button>
<button aria-label="person" class="p-xs rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors duration-200 text-primary dark:text-primary-fixed-dim">
<span class="material-symbols-outlined" data-icon="person">person</span>
</button>
</div>
</div>
</header>
<main class="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-xl flex flex-col md:flex-row gap-gutter">
<!-- Account Sidebar -->
<aside class="w-full md:w-64 flex-shrink-0 mb-xl md:mb-0">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm sticky top-24">
<nav class="flex flex-col gap-xs">
<a class="px-md py-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-sm" href="#">
<span class="material-symbols-outlined" data-icon="person">person</span>
                        Profile Summary
                    </a>
<a class="px-md py-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-sm" href="#">
<span class="material-symbols-outlined" data-icon="history">history</span>
                        Order History
                    </a>
<a class="px-md py-sm rounded-lg bg-surface-container-low text-primary font-label-md text-label-md flex items-center gap-sm" href="#">
<span class="material-symbols-outlined" data-icon="location_on" data-weight="fill" style="font-variation-settings: 'FILL' 1;">location_on</span>
                        Saved Addresses
                    </a>
<a class="px-md py-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-sm" href="#">
<span class="material-symbols-outlined" data-icon="credit_card">credit_card</span>
                        Payment Methods
                    </a>
<div class="h-px bg-outline-variant my-sm"></div>
<a class="px-md py-sm rounded-lg font-label-md text-label-md text-error hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-sm" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
                        Sign Out
                    </a>
</nav>
</div>
</aside>
<!-- Main Content -->
<div class="flex-grow">
<div class="mb-lg">
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-xs">Saved Addresses</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Manage your shipping and billing addresses for faster checkout.</p>
</div>
<!-- Bento Grid for Addresses -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
<!-- Add New Address Card -->
<button class="bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center min-h-[220px] hover:border-primary hover:bg-surface-container-low transition-all group shadow-sm hover:shadow-md cursor-pointer">
<div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-2xl" data-icon="add">add</span>
</div>
<span class="font-label-md text-label-md text-primary font-semibold">Add New Address</span>
</button>
<!-- Default Address Card -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col min-h-[220px] shadow-sm hover:shadow-md transition-shadow relative">
<div class="absolute top-md right-md">
<span class="bg-primary-container text-on-primary-container font-label-md text-xs px-sm py-1 rounded-full uppercase tracking-wider font-semibold">Default</span>
</div>
<div class="flex items-start gap-sm mb-md">
<span class="material-symbols-outlined text-outline" data-icon="home">home</span>
<div>
<h3 class="font-label-md text-label-md text-on-surface font-semibold mb-1">Home</h3>
<p class="font-body-md text-body-md text-on-surface-variant font-medium">Eleanor Shellstrop</p>
</div>
</div>
<div class="flex-grow">
<p class="font-body-sm text-body-sm text-on-surface-variant mb-1">321 Fake Street, Apt 4B</p>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-1">Springfield, OR 97477</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">United States</p>
</div>
<div class="mt-md pt-md border-t border-outline-variant flex items-center justify-between">
<p class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]" data-icon="call">call</span>
                            (555) 123-4567
                        </p>
<div class="flex gap-sm">
<button class="font-label-md text-label-md text-primary hover:text-primary-fixed-dim hover:underline px-xs py-1 transition-colors">Edit</button>
</div>
</div>
</div>
<!-- Secondary Address Card -->
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col min-h-[220px] shadow-sm hover:shadow-md transition-shadow">
<div class="flex items-start gap-sm mb-md">
<span class="material-symbols-outlined text-outline" data-icon="work">work</span>
<div>
<h3 class="font-label-md text-label-md text-on-surface font-semibold mb-1">Office</h3>
<p class="font-body-md text-body-md text-on-surface-variant font-medium">Eleanor Shellstrop</p>
</div>
</div>
<div class="flex-grow">
<p class="font-body-sm text-body-sm text-on-surface-variant mb-1">100 Tech Plaza, Suite 900</p>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-1">San Francisco, CA 94105</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">United States</p>
</div>
<div class="mt-md pt-md border-t border-outline-variant flex items-center justify-between">
<p class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[16px]" data-icon="call">call</span>
                            (555) 987-6543
                        </p>
<div class="flex gap-sm">
<button class="font-label-md text-label-md text-primary hover:text-primary-fixed-dim hover:underline px-xs py-1 transition-colors">Edit</button>
<button class="font-label-md text-label-md text-error hover:text-on-error-container hover:underline px-xs py-1 transition-colors">Delete</button>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant dark:border-outline full-width bottom mt-auto">
<div class="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
<div class="mb-md md:mb-0">
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-inverse-on-surface font-bold">Meridian Store</span>
<p class="font-body-sm text-body-sm text-secondary dark:text-secondary-fixed mt-xs">Powered by MeridianERP</p>
</div>
<nav class="flex gap-md">
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Privacy Policy</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Terms of Service</a>
<a class="font-label-md text-label-md text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Legal</a>
</nav>
</div>
</footer>
</body></html>