import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import Product from './models/Product';
import Collection from './models/Collection';
import Occasion from './models/Occasion';

dotenv.config();

connectDB();

type CategorySeed = {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string;
    image?: string;
    subcategories?: { name: string; slug: string; image?: string }[];
};

const categorySeed: CategorySeed[] = [
    {
        name: 'Custom Miniature Wall Clocks',
        slug: 'wall-clocks',
        description: 'Bespoke sculptural timepieces capturing heritage and culinary art. Sabi food-themed clocks, custom scenes and personalized name clocks.',
        metaDescription: 'Shop handcrafted custom miniature wall clocks.',
        image: 'https://images.unsplash.com/photo-1563861826-1efe393625ef?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Personalized Food-Themed Clocks', slug: 'food-themed-clocks', image: 'https://images.unsplash.com/photo-1563861826-1efe393625ef?auto=format&fit=crop&q=80&w=800' },
            { name: 'Custom Miniature Scenes', slug: 'custom-scenes', image: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&q=80&w=800' },
            { name: 'Name / Personalized Clocks', slug: 'name-clocks', image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Miniature Art & Wall Décor',
        slug: 'wall-decor',
        description: 'Miniature art pieces and wall décor crafted with air-dry clay — spatulas, kitchen themes and decorative miniatures.',
        metaDescription: 'Shop miniature wall décor and art.',
        image: 'https://images.unsplash.com/photo-1575995872537-3793d29d972c?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Miniature Wall Décor', slug: 'mini-wall-decor', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800' },
            { name: 'Miniature Spatulas', slug: 'mini-spatulas', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800' },
            { name: 'Kitchen-Themed Miniatures', slug: 'kitchen-miniatures', image: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&q=80&w=800' },
            { name: 'Other Decorative Miniatures', slug: 'decorative-miniatures', image: 'https://images.unsplash.com/photo-1513604902203-11a9156481b4?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Miniature Shops & Scenes',
        slug: 'shops-scenes',
        description: 'Lifelike standalone miniature shops and street scenes — saree shops, flower shops, food stalls and festival setups.',
        metaDescription: 'Shop miniature shops and street scenes.',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Individual Miniature Shops', slug: 'individual-shops', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
            { name: 'Sungudi Saree Shop', slug: 'sungudi-saree-shop', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&q=80&w=800' },
            { name: 'Flower Shop', slug: 'flower-shop', image: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&q=80&w=800' },
            { name: 'Food Shops', slug: 'food-shops', image: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?auto=format&fit=crop&q=80&w=800' },
            { name: 'Festival Stalls', slug: 'festival-stalls', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800' },
            { name: 'Other Standalone Miniature Setups', slug: 'standalone-setups', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Golu & Navaratri Collections',
        slug: 'golu-navaratri',
        description: 'Navaratri Thamboolam gifts and Golu themes — Sai Baba sets, Madurai Nagaram, village and temple festival themes, custom Golu scenes.',
        metaDescription: 'Shop Golu and Navaratri themed miniatures.',
        image: 'https://images.unsplash.com/photo-1523167508699-c34fd042260d?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Navaratri Thamboolam Gifts', slug: 'navaratri-thamboolam', image: 'https://images.unsplash.com/photo-1523167508699-c34fd042260d?auto=format&fit=crop&q=80&w=800' },
            { name: 'Golu Themes', slug: 'golu-themes', image: 'https://images.unsplash.com/photo-1598654893244-cd46a1b817b6?auto=format&fit=crop&q=80&w=800' },
            { name: 'Sai Baba Set', slug: 'sai-baba-set', image: 'https://images.unsplash.com/photo-1544851026-5a85d554c5df?auto=format&fit=crop&q=80&w=800' },
            { name: 'Madurai Nagaram', slug: 'madurai-nagaram', image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&q=80&w=800' },
            { name: 'Village Theme', slug: 'village-theme', image: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800' },
            { name: 'Temple Festival Theme', slug: 'temple-festival-theme', image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800' },
            { name: 'Custom Golu Scenes', slug: 'custom-golu-scenes', image: 'https://images.unsplash.com/photo-1574428585190-dbbbbdd3d1cd?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Miniature Dolls & Figures',
        slug: 'dolls-figures',
        description: 'Acrylic dolls, miniature characters and festival and cultural figures hand-finished for your Golu and displays.',
        metaDescription: 'Shop miniature dolls and figures.',
        image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Acrylic Dolls', slug: 'acrylic-dolls', image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&q=80&w=800' },
            { name: 'Miniature Characters', slug: 'mini-characters', image: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=800' },
            { name: 'Festival and Cultural Figures', slug: 'cultural-figures', image: 'https://images.unsplash.com/photo-1518563228349-0dfa13a938c7?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Fridge Magnets',
        slug: 'fridge-magnets',
        description: 'Tiny detailed magnetic art for your fridge — miniature food magnets, customized magnets and theme-based magnets.',
        metaDescription: 'Shop handcrafted clay fridge magnets.',
        image: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Miniature Food Magnets', slug: 'food-magnets', image: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=800' },
            { name: 'Customized Magnets', slug: 'custom-magnets', image: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&q=80&w=800' },
            { name: 'Theme-Based Magnets', slug: 'theme-magnets', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Clay & Miniature-Making Supplies',
        slug: 'supplies',
        description: 'Everything for miniature making — air-dry clay, miniature-making materials, tools and accessories.',
        metaDescription: 'Shop clay and miniature-making supplies.',
        image: 'https://images.unsplash.com/photo-1567879542765-5b7853296a67?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Clay', slug: 'clay', image: 'https://images.unsplash.com/photo-1567879542765-5b7853296a67?auto=format&fit=crop&q=80&w=800' },
            { name: 'Miniature-Making Materials', slug: 'materials', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800' },
            { name: 'Tools', slug: 'tools', image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=800' },
            { name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&q=80&w=800' },
        ]
    },
];

type OccasionSeed = {
    name: string;
    slug: string;
    description?: string;
    metaDescription?: string;
    image?: string;
    subcategories?: { name: string; slug: string; image?: string }[];
};

const occasionSeed: OccasionSeed[] = [
    {
        name: 'Birthday',
        slug: 'birthday',
        description: 'Handcrafted miniatures that make birthdays personal — themed scenes, kids\' parties and custom birthday gifts.',
        metaDescription: 'Shop miniature birthday gifts and themed scenes.',
        image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Theme-Based Birthday Scenes', slug: 'theme-birthday-scenes', image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&q=80&w=800' },
            { name: 'Kids\' Birthday Themes', slug: 'kids-birthday', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800' },
            { name: 'Custom Birthday Gifts', slug: 'custom-birthday-gifts', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Wedding',
        slug: 'wedding',
        description: 'Wedding-day miniatures and keepsakes — couple figurines, decor and traditional Tamil wedding themes.',
        metaDescription: 'Shop miniature wedding decor and keepsakes.',
        image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Couple Miniatures', slug: 'couple-miniatures', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
            { name: 'Wedding Day Décor', slug: 'wedding-day-decor', image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
            { name: 'Traditional Tamil Wedding Themes', slug: 'tamil-wedding-themes', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Anniversary',
        slug: 'anniversary',
        description: 'Celebrate milestones with personalised couple themes and anniversary keepsakes.',
        metaDescription: 'Shop miniature anniversary gifts.',
        image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Couple Celebration Themes', slug: 'couple-anniversary-themes', image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=800' },
            { name: 'Milestone Year Gifts', slug: 'milestone-year-gifts', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Festivals & Religious Events',
        slug: 'festivals',
        description: 'Festive miniatures for Navaratri, Diwali, Christmas, Pongal and temple and cultural celebrations.',
        metaDescription: 'Shop festival themed miniature decor and gifts.',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Navaratri / Golu', slug: 'navaratri-golu', image: 'https://images.unsplash.com/photo-1598654893244-cd46a1b817b6?auto=format&fit=crop&q=80&w=800' },
            { name: 'Diwali', slug: 'diwali', image: 'https://images.unsplash.com/photo-1605991452273-51a182ef8a50?auto=format&fit=crop&q=80&w=800' },
            { name: 'Christmas', slug: 'christmas', image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=800' },
            { name: 'Pongal & Harvest', slug: 'pongal', image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&q=80&w=800' },
            { name: 'Temple & Cultural Events', slug: 'temple-cultural-events', image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Housewarming',
        slug: 'housewarming',
        description: 'Griha Pravesham and new home miniatures — auspicious themes, home décor and gift sets.',
        metaDescription: 'Shop miniature housewarming gifts and décor.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Griha Pravesham Themes', slug: 'griha-pravesham', image: 'https://images.unsplash.com/photo-1522661067900-ab829854a57f?auto=format&fit=crop&q=80&w=800' },
            { name: 'New Home Décor', slug: 'new-home-decor', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800' },
            { name: 'Housewarming Gift Sets', slug: 'housewarming-gift-sets', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Naming Ceremony',
        slug: 'naming-ceremony',
        description: 'Traditional naming ceremony miniatures — lamps, décor and baby celebration themes.',
        metaDescription: 'Shop naming ceremony miniature décor.',
        image: 'https://images.unsplash.com/photo-1533613220915-609158661114?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Traditional Lamp & Décor', slug: 'naming-decor', image: 'https://images.unsplash.com/photo-1533613220915-609158661114?auto=format&fit=crop&q=80&w=800' },
            { name: 'Baby Celebration Themes', slug: 'naming-baby-themes', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Baby Shower',
        slug: 'baby-shower',
        description: 'Cute and pastel miniatures for baby showers and new beginnings.',
        metaDescription: 'Shop baby shower themed miniatures.',
        image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Cute Baby Themes', slug: 'cute-baby-themes', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800' },
            { name: 'Pastel Miniatures', slug: 'pastel-miniatures', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&q=80&w=800' },
        ]
    },
    {
        name: 'Congratulations',
        slug: 'congratulations',
        description: 'Graduation and achievement themed miniatures to celebrate every milestone.',
        metaDescription: 'Shop graduation and achievement miniature gifts.',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800',
        subcategories: [
            { name: 'Graduation Gifts', slug: 'graduation-gifts', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800' },
            { name: 'Achievement Themes', slug: 'achievement-themes', image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&q=80&w=800' },
        ]
    },
];

const products = [
    {
        name: 'Traditional Samosa Miniature Clock',
        slug: 'traditional-samosa-miniature-clock',
        category: 'Custom Miniature Wall Clocks',
        subcategory: 'Personalized Food-Themed Clocks',
        occasion: 'Birthday',
        occasionSub: 'Custom Birthday Gifts',
        price: 2499,
        mrp: 3200,
        weight: 850,
        story: 'Inspired by the vibrant streets of Mumbai, this clock captures the essence of a warm chai and samosa evening.',
        details: 'Hand sculpted with premium polymer clay. Mounted on a 10-inch wooden base. Silent sweep mechanism.',
        metaDescription: 'Buy handcrafted samosa and chai miniature wall clock.',
        images: [
            'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['Small (8 inch)', 'Large (10 inch)'] }],
        stockStatus: 'made-to-order',
        rating: 4.8,
        reviewCount: 12
    },
    {
        name: 'South Indian Filter Coffee Magnet',
        slug: 'south-indian-filter-coffee-magnet',
        category: 'Fridge Magnets',
        subcategory: 'Miniature Food Magnets',
        occasion: 'Housewarming',
        occasionSub: 'Housewarming Gift Sets',
        price: 499,
        mrp: 650,
        weight: 120,
        story: 'A miniature tribute to the quintessential morning ritual of South India. Complete with a tiny brass dabarah set.',
        details: 'Air-dry clay base with acrylic detailing. High-grade neodymium magnet attached.',
        metaDescription: 'Handcrafted South Indian Filter Coffee Fridge Magnet.',
        images: [
            'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['Standard'] }],
        stockStatus: 'in-stock',
        rating: 5.0,
        reviewCount: 45
    },
    {
        name: 'Biryani Handi Miniature',
        slug: 'biryani-handi-miniature',
        category: 'Miniature Art & Wall Décor',
        subcategory: 'Kitchen-Themed Miniatures',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Diwali',
        price: 1899,
        mrp: 2500,
        weight: 640,
        story: 'A hyper-realistic clay sculpture of Hyderabadi Dum Biryani, complete with individual rice grains and a traditional copper handi.',
        details: 'Meticulously shaped using dental tools for precision. Set in resin broth.',
        metaDescription: 'Realistic clay miniature of Biryani in a copper handi.',
        images: [
            'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Scale', options: ['1:12 Scale', '1:6 Scale'] }],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 8
    },
    {
        name: 'Masala Dosa Platter Miniature',
        slug: 'masala-dosa-platter-miniature',
        category: 'Miniature Art & Wall Décor',
        subcategory: 'Miniature Spatulas',
        occasion: 'Housewarming',
        occasionSub: 'Housewarming Gift Sets',
        price: 1299,
        mrp: 1800,
        weight: 420,
        story: 'The quintessential South Indian breakfast platter, featuring crispy dosa, three types of chutney, and sambar on a banana leaf.',
        details: 'Hand-painted banana leaf made from polymer clay. Sambar crafted with colored resin.',
        metaDescription: 'Handmade Masala Dosa Platter miniature art.',
        images: [
            'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Base', options: ['Banana Leaf', 'Silver Plate'] }],
        stockStatus: 'in-stock',
        rating: 4.7,
        reviewCount: 22
    },
    {
        name: 'Vintage Camera Miniature Desk Art',
        slug: 'vintage-camera-miniature-desk-art',
        category: 'Miniature Art & Wall Décor',
        subcategory: 'Other Decorative Miniatures',
        occasion: 'Congratulations',
        occasionSub: 'Graduation Gifts',
        price: 3499,
        mrp: 4200,
        weight: 780,
        story: 'For the photography enthusiast. A nostalgic ode to vintage twin-lens reflex cameras.',
        details: 'Crafted with black polymer clay and brushed metallic accents. Perfect for office desks.',
        metaDescription: 'Vintage Camera miniature sculpture for desk decor.',
        images: [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Style', options: ['Black & Silver', 'Vintage Brown'] }],
        stockStatus: 'made-to-order',
        rating: 5.0,
        reviewCount: 15
    },
    {
        name: 'Idli Sambar Wall Clock',
        slug: 'idli-sambar-wall-clock',
        category: 'Custom Miniature Wall Clocks',
        subcategory: 'Personalized Food-Themed Clocks',
        occasion: 'Birthday',
        occasionSub: 'Theme-Based Birthday Scenes',
        price: 2899,
        mrp: 3500,
        weight: 920,
        story: 'Start your day on time and with an appetite! A delightful kitchen clock featuring South India\'s beloved breakfast.',
        details: '12-inch diameter. Requires 1 AA battery. Vibrant non-fade acrylics.',
        metaDescription: 'Idli Sambar themed handmade kitchen wall clock.',
        images: [
            'https://images.unsplash.com/photo-1626082895617-2c6b4122d3d3?auto=format&fit=crop&q=80&w=800'
        ],
        variants: [{ type: 'Size', options: ['12 inch', '14 inch'] }],
        stockStatus: 'in-stock',
        rating: 4.6,
        reviewCount: 30
    }
];

const importData = async () => {
    try {
        await Collection.deleteMany();
        await Occasion.deleteMany();
        await Product.deleteMany();

        console.log('🧹 Cleared existing database records.');

        const createdCollections = await Collection.insertMany(categorySeed.map(c => ({
            name: c.name,
            slug: c.slug,
            description: c.description,
            metaDescription: c.metaDescription,
            image: c.image
        })));
        console.log('✅ Top-level collections seeded: ', createdCollections.length);

        // Seed subcategories with parent references
        let subcategoryCount = 0;
        const subcategoryDocs: any[] = [];
        categorySeed.forEach((cat, i) => {
            (cat.subcategories || []).forEach(sc => {
                subcategoryDocs.push({
                    name: sc.name,
                    slug: sc.slug,
                    description: `${sc.name} — a subcategory of ${cat.name}.`,
                    image: sc.image,
                    parent: createdCollections[i]._id
                });
                subcategoryCount++;
            });
        });
        await Collection.insertMany(subcategoryDocs);
        console.log('✅ Subcategories seeded: ', subcategoryCount);

        const createdOccasions = await Occasion.insertMany(occasionSeed.map(o => ({
            name: o.name,
            slug: o.slug,
            description: o.description,
            metaDescription: o.metaDescription,
            image: o.image
        })));
        console.log('✅ Top-level occasions seeded: ', createdOccasions.length);

        // Seed occasion subcategories with parent references
        let occasionSubCount = 0;
        const occasionSubDocs: any[] = [];
        occasionSeed.forEach((occ, i) => {
            (occ.subcategories || []).forEach(sc => {
                occasionSubDocs.push({
                    name: sc.name,
                    slug: sc.slug,
                    description: `${sc.name} — a subcategory of ${occ.name}.`,
                    image: sc.image,
                    parent: createdOccasions[i]._id
                });
                occasionSubCount++;
            });
        });
        await Occasion.insertMany(occasionSubDocs);
        console.log('✅ Occasion subcategories seeded: ', occasionSubCount);

        const createdProducts = await Product.insertMany(products);
        console.log('✅ Products Seeded: ', createdProducts.length);

        console.log('🎉 Data Import Successful!');
        process.exit();
    } catch (error) {
        console.error('❌ Error during seeding: ', error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Collection.deleteMany();
        await Occasion.deleteMany();
        await Product.deleteMany();

        console.log('💥 Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error('❌ Error during destruction: ', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}