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
        name: 'Navaratri Miniature Shops',
        slug: 'miniature-shops',
        description: 'Traditional South Indian street stalls and culinary shops sculpted by hand in polymer clay and wood.',
        metaDescription: 'Shop handcrafted Navaratri miniature shops and heritage stalls.',
        image: '/Miniature shops/jigardhanda.png',
        subcategories: [
            { name: 'Miniature Shops', slug: 'miniature-shops-sub', image: '/Miniature shops/idlykadai.png' }
        ]
    },
    {
        name: 'Miniature Fruit Baskets',
        slug: 'fruit-baskets',
        description: 'Exquisite hand-sculpted clay fruit baskets in woven hampers. Perfect for Golu market scenes and collectors.',
        metaDescription: 'Shop miniature fruit baskets in clay.',
        image: '/Fruit baskets/apple.png',
        subcategories: [
            { name: 'Handcrafted Fruit Baskets', slug: 'fruit-baskets-sub', image: '/Fruit baskets/Banana.png' }
        ]
    },
    {
        name: 'Miniature Vegetable Crates',
        slug: 'vegetable-crates',
        description: 'Realistic South Indian farm vegetables in miniature pine wood crates. Handcrafted with love at â‚¹199 each.',
        metaDescription: 'Shop miniature vegetable crates.',
        image: '/Vegetable Baskets/carrot.png',
        subcategories: [
            { name: 'Handcrafted Vegetable Crates', slug: 'vegetable-crates-sub', image: '/Vegetable Baskets/potato.png' }
        ]
    },
    {
        name: 'Navaratri Thamboolam Collections',
        slug: 'navaratri-thamboolam',
        description: 'Auspicious miniature return gifts featuring betel leaves, supari, and coconuts in decorative trays.',
        metaDescription: 'Shop Navaratri Thamboolam miniature return gifts.',
        image: '/Navarathri Thamboolam/Navaratri Thamboolam 1.png',
        subcategories: [
            { name: 'Navaratri Thamboolam Gifts', slug: 'thamboolam-gifts-sub', image: '/Navarathri Thamboolam/Navaratri Thamboolam 2.png' }
        ]
    },
    {
        name: 'Custom Miniature Wall Clocks',
        slug: 'wall-clocks',
        description: 'Bespoke sculptural timepieces capturing heritage and culinary art. Sabi food-themed clocks, custom scenes and personalized name clocks.',
        metaDescription: 'Shop handcrafted custom miniature wall clocks.',
        image: '/chef-damu-clock.jpg',
        subcategories: [
            { name: 'Personalized Food-Themed Clocks', slug: 'food-themed-clocks', image: '/chef-damu-clock.jpg' },
            { name: 'Custom Miniature Scenes', slug: 'custom-scenes', image: '/Miniature shops/dosashop.png' },
            { name: 'Name / Personalized Clocks', slug: 'name-clocks', image: '/chef-damu-clock.jpg' },
        ]
    },
    {
        name: 'Miniature Art & Wall Décor',
        slug: 'wall-decor',
        description: 'Miniature art pieces and wall décor crafted with air-dry clay — spatulas, kitchen themes and decorative miniatures.',
        metaDescription: 'Shop miniature wall décor and art.',
        image: '/souvenirs/Karnataka yakshagana and oota.png',
        subcategories: [
            { name: 'Miniature Wall Décor', slug: 'mini-wall-decor', image: '/souvenirs/Karnataka yakshagana and oota.png' },
            { name: 'Miniature Spatulas', slug: 'mini-spatulas', image: '/souvenirs/Kerala Sadya.png' },
            { name: 'Kitchen-Themed Miniatures', slug: 'kitchen-miniatures', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
            { name: 'Other Decorative Miniatures', slug: 'decorative-miniatures', image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png' },
            { name: 'Cultural Souvenirs', slug: 'cultural-souvenirs', image: '/souvenirs/Karnataka yakshagana and oota.png' },
        ]
    },
    {
        name: 'Miniature Shops & Scenes',
        slug: 'shops-scenes',
        description: 'Lifelike standalone miniature shops and street scenes â€” saree shops, flower shops, food stalls and festival setups.',
        metaDescription: 'Shop miniature shops and street scenes.',
        image: '/Miniature shops/sungudi.png',
        subcategories: [
            { name: 'Individual Miniature Shops', slug: 'individual-shops', image: '/Miniature shops/jigardhanda.png' },
            { name: 'Sungudi Saree Shop', slug: 'sungudi-saree-shop', image: '/Miniature shops/sungudi.png' },
            { name: 'Flower Shop', slug: 'flower-shop', image: '/Miniature shops/Malligaipoo.png' },
            { name: 'Food Shops', slug: 'food-shops', image: '/Miniature shops/dosashop.png' },
            { name: 'Festival Stalls', slug: 'festival-stalls', image: '/Miniature shops/sweetcorn.png' },
            { name: 'Other Standalone Miniature Setups', slug: 'standalone-setups', image: '/Miniature shops/tendercoconut.png' },
        ]
    },
    {
        name: 'Golu & Navaratri Collections',
        slug: 'golu-navaratri',
        description: 'Navaratri Thamboolam gifts and Golu themes â€” Sai Baba sets, Madurai Nagaram, village and temple festival themes, custom Golu scenes.',
        metaDescription: 'Shop Golu and Navaratri themed miniatures.',
        image: '/Navarathri Thamboolam/Navaratri Thamboolam 13.png',
        subcategories: [
            { name: 'Golu Thamboolam Sets', slug: 'golu-thamboolam-sets', image: '/Navarathri Thamboolam/Navaratri Thamboolam 13.png' },
            { name: 'Golu Themes', slug: 'golu-themes', image: '/Navarathri Thamboolam/Navaratri Thamboolam 2.png' },
            { name: 'Sai Baba Set', slug: 'sai-baba-set', image: '/Miniature shops/idlykadai.png' },
            { name: 'Madurai Nagaram', slug: 'madurai-nagaram', image: '/Miniature shops/jigardhanda.png' },
            { name: 'Village Theme', slug: 'village-theme', image: '/Miniature shops/Sugarcane.png' },
            { name: 'Temple Festival Theme', slug: 'temple-festival-theme', image: '/Miniature shops/sweetcorn.png' },
            { name: 'Custom Golu Scenes', slug: 'custom-golu-scenes', image: '/Miniature shops/Paanipoori.png' },
        ]
    },
    {
        name: 'Miniature Dolls & Figures',
        slug: 'dolls-figures',
        description: 'Acrylic dolls, miniature characters and festival and cultural figures hand-finished for your Golu and displays.',
        metaDescription: 'Shop miniature dolls and figures.',
        image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png',
        subcategories: [
            { name: 'Acrylic Dolls', slug: 'acrylic-dolls', image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png' },
            { name: 'Miniature Characters', slug: 'mini-characters', image: '/Miniature shops/tendercoconut.png' },
            { name: 'Festival and Cultural Figures', slug: 'cultural-figures', image: '/souvenirs/Karnataka yakshagana and oota.png' },
        ]
    },
    {
        name: 'Fridge Magnets',
        slug: 'fridge-magnets',
        description: 'Tiny detailed magnetic art for your fridge â€” miniature food magnets, customized magnets and theme-based magnets.',
        metaDescription: 'Shop handcrafted clay fridge magnets.',
        image: '/Fridge Magnets/Banana leaf thali with mdf base.png',
        subcategories: [
            { name: 'Miniature Food Magnets', slug: 'food-magnets', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
            { name: 'Customized Magnets', slug: 'custom-magnets', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
            { name: 'Theme-Based Magnets', slug: 'theme-magnets', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
        ]
    },
    {
        name: 'Clay & Miniature-Making Supplies',
        slug: 'supplies',
        description: 'Everything for miniature making â€” air-dry clay, miniature-making materials, tools and accessories.',
        metaDescription: 'Shop clay and miniature-making supplies.',
        image: '/Miniature shops/tiffen.png',
        subcategories: [
            { name: 'Clay', slug: 'clay', image: '/Miniature shops/sweetcorn.png' },
            { name: 'Miniature-Making Materials', slug: 'materials', image: '/Miniature shops/Limesoda.png' },
            { name: 'Tools', slug: 'tools', image: '/Miniature shops/Sugarcane.png' },
            { name: 'Accessories', slug: 'accessories', image: '/Miniature shops/Malligaipoo.png' },
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
        description: 'Handcrafted miniatures that make birthdays personal â€” themed scenes, kids\' parties and custom birthday gifts.',
        metaDescription: 'Shop miniature birthday gifts and themed scenes.',
        image: '/Miniature shops/sweetcorn.png',
        subcategories: [
            { name: 'Theme-Based Birthday Scenes', slug: 'theme-birthday-scenes', image: '/Miniature shops/sweetcorn.png' },
            { name: 'Kids\' Birthday Themes', slug: 'kids-birthday', image: '/Miniature shops/Paanipoori.png' },
            { name: 'Custom Birthday Gifts', slug: 'custom-birthday-gifts', image: '/chef-damu-clock.jpg' },
        ]
    },
    {
        name: 'Wedding',
        slug: 'wedding',
        description: 'Wedding-day miniatures and keepsakes â€” couple figurines, decor and traditional Tamil wedding themes.',
        metaDescription: 'Shop miniature wedding decor and keepsakes.',
        image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png',
        subcategories: [
            { name: 'Couple Miniatures', slug: 'couple-miniatures', image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png' },
            { name: 'Wedding Day DÃ©cor', slug: 'wedding-day-decor', image: '/souvenirs/Kerala Sadya.png' },
            { name: 'Traditional Tamil Wedding Themes', slug: 'tamil-wedding-themes', image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png' },
        ]
    },
    {
        name: 'Anniversary',
        slug: 'anniversary',
        description: 'Celebrate milestones with personalised couple themes and anniversary keepsakes.',
        metaDescription: 'Shop miniature anniversary gifts.',
        image: '/chef-damu-clock.jpg',
        subcategories: [
            { name: 'Couple Celebration Themes', slug: 'couple-anniversary-themes', image: '/chef-damu-clock.jpg' },
            { name: 'Milestone Year Gifts', slug: 'milestone-year-gifts', image: '/souvenirs/Karnataka yakshagana and oota.png' },
        ]
    },
    {
        name: 'Festivals & Religious Events',
        slug: 'festivals',
        description: 'Festive miniatures for Navaratri, Diwali, Christmas, Pongal and temple and cultural celebrations.',
        metaDescription: 'Shop festival themed miniature decor and gifts.',
        image: '/Navarathri Thamboolam/Navaratri Thamboolam 1.png',
        subcategories: [
            { name: 'Navaratri / Golu', slug: 'navaratri-golu', image: '/Navarathri Thamboolam/Navaratri Thamboolam 1.png' },
            { name: 'Diwali', slug: 'diwali', image: '/Navarathri Thamboolam/Navaratri Thamboolam 2.png' },
            { name: 'Christmas', slug: 'christmas', image: '/Fruit baskets/apple.png' },
            { name: 'Pongal & Harvest', slug: 'pongal', image: '/Vegetable Baskets/banana stem.png' },
            { name: 'Temple & Cultural Events', slug: 'temple-cultural-events', image: '/souvenirs/Karnataka yakshagana and oota.png' },
        ]
    },
    {
        name: 'Housewarming',
        slug: 'housewarming',
        description: 'Griha Pravesham and new home miniatures â€” auspicious themes, home dÃ©cor and gift sets.',
        metaDescription: 'Shop miniature housewarming gifts and dÃ©cor.',
        image: '/Fridge Magnets/Banana leaf thali with mdf base.png',
        subcategories: [
            { name: 'Griha Pravesham Themes', slug: 'griha-pravesham', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
            { name: 'New Home DÃ©cor', slug: 'new-home-decor', image: '/chef-damu-clock.jpg' },
            { name: 'Housewarming Gift Sets', slug: 'housewarming-gift-sets', image: '/Fridge Magnets/Banana leaf thali with mdf base.png' },
        ]
    },
    {
        name: 'Naming Ceremony',
        slug: 'naming-ceremony',
        description: 'Traditional naming ceremony miniatures â€” lamps, dÃ©cor and baby celebration themes.',
        metaDescription: 'Shop naming ceremony miniature dÃ©cor.',
        image: '/Fruit baskets/Banana.png',
        subcategories: [
            { name: 'Traditional Lamp & DÃ©cor', slug: 'naming-decor', image: '/Navarathri Thamboolam/Navaratri Thamboolam 13.png' },
            { name: 'Baby Celebration Themes', slug: 'naming-baby-themes', image: '/Fruit baskets/strawberry.png' },
        ]
    },
    {
        name: 'Baby Shower',
        slug: 'baby-shower',
        description: 'Cute and pastel miniatures for baby showers and new beginnings.',
        metaDescription: 'Shop baby shower themed miniatures.',
        image: '/Fruit baskets/strawberry.png',
        subcategories: [
            { name: 'Cute Baby Themes', slug: 'cute-baby-themes', image: '/Fruit baskets/strawberry.png' },
            { name: 'Pastel Miniatures', slug: 'pastel-miniatures', image: '/Fruit baskets/papaya.png' },
        ]
    },
    {
        name: 'Congratulations',
        slug: 'congratulations',
        description: 'Graduation and achievement themed miniatures to celebrate every milestone.',
        metaDescription: 'Shop graduation and achievement miniature gifts.',
        image: '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png',
        subcategories: [
            { name: 'Graduation Gifts', slug: 'graduation-gifts', image: '/souvenirs/Karnataka yakshagana and oota.png' },
            { name: 'Achievement Themes', slug: 'achievement-themes', image: '/chef-damu-clock.jpg' },
        ]
    },
];

const products = [
    {
        name: 'Traditional Jigarthanda Shop Miniature',
        slug: 'traditional-jigarthanda-shop-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 2499,
        mrp: 4499,
        weight: 650,
        story: 'A handcrafted miniature Jigarthanda shop inspired by traditional Tamil Nadu drink stalls, created for Golu and Navaratri displays.',
        details: 'Bring the charm of a traditional Tamil Nadu Jigarthanda shop to your Golu display with this detailed handmade miniature scene. The shop features a rustic tiled roof, wooden-style counter, miniature storage containers, serving vessels and a shopkeeper serving the drink. A customer figure adds life and storytelling to the scene. Display it as a standalone Golu decoration or combine it with other Mythris Gleams miniature shops to create a traditional street or Madurai-themed scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade Jigarthanda shop miniature for Golu and Navaratri. Add a traditional Tamil Nadu street-shop feel to your miniature display.',
        images: [
            '/Miniature shops/jigardhanda.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 33
    },
    {
        name: 'Traditional Idly Shop Miniature',
        slug: 'traditional-idly-shop-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 2499,
        mrp: 4499,
        weight: 650,
        story: 'A detailed handmade miniature Idly shop with traditional vessels, food, customers and a shopkeeper, perfect for Golu and Navaratri displays.',
        details: 'Create a nostalgic South Indian food-stall scene with this handmade miniature Idly shop. The scene includes a traditional shop structure, miniature cooking and serving vessels, idlis, accompaniments, a shopkeeper and seated customers enjoying their food. Every small element helps recreate the familiar feeling of a local Tamil Nadu tiffin shop. Use it as a standalone Golu piece or place it alongside other miniature shops to build a lively traditional street scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade South Indian Idly shop miniature with tiny food, vessels and figures. Perfect for Golu, Navaratri displays and miniature collections.',
        images: [
            '/Miniature shops/idlykadai.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 26
    },
    {
        name: 'Traditional Dosa Shop Miniature',
        slug: 'traditional-dosa-shop-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 2499,
        mrp: 4499,
        weight: 650,
        story: 'A handcrafted miniature Dosa shop inspired by a traditional South Indian tiffin stall, made for Golu, Navaratri and miniature street displays.',
        details: 'Recreate the warmth of a traditional South Indian tiffin shop with this detailed handmade Dosa shop miniature. The scene features a miniature dosa on the cooking surface, serving vessels, food accessories, a shopkeeper and a customer seated at the stall. The rustic shop structure and tiny details make it a beautiful storytelling piece for Golu displays. Pair it with other Mythris Gleams miniature shops to create a complete Tamil Nadu food-street or village-style scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade Dosa shop miniature inspired by a traditional South Indian tiffin stall. Ideal for Golu, Navaratri and miniature street displays.',
        images: [
            '/Miniature shops/dosashop.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 26
    },
    {
        name: 'Traditional Sungudi Saree Shop Miniature',
        slug: 'traditional-sungudi-saree-shop-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 2499,
        mrp: 4499,
        weight: 650,
        story: 'A colourful handmade miniature Sungudi saree shop featuring tiny sarees, a shopkeeper and customers, inspired by traditional textile shopping streets of Tamil Nadu.',
        details: 'Add the colour and charm of a traditional Tamil Nadu textile shop to your Golu display with this handmade Sungudi saree shop miniature. The scene features miniature sarees displayed across the shop, folded sarees on the counter, a seated shopkeeper and customers browsing the collection. The bright fabrics and detailed arrangement make this a beautiful cultural miniature for a traditional street, Madurai or Tamil Nadu-themed Golu setup. Material: Clay, miniature modelling materials, fabric-like miniature elements and decorative materials Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Colourful handmade Sungudi saree shop miniature with tiny sarees and figures. Perfect for Golu, Navaratri and Tamil Nadu themed displays.',
        images: [
            '/Miniature shops/sungudi.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 15
    },
    {
        name: 'Traditional Malligai Poo Shop Miniature',
        slug: 'traditional-malligai-poo-shop-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 2499,
        mrp: 4499,
        weight: 650,
        story: 'A beautiful handmade Malligai Poo shop miniature with flower garlands, baskets, flower sellers and a customer, perfect for a traditional Golu display.',
        details: 'Bring the beauty of a traditional Tamil Nadu flower market into your Golu display with this detailed Malligai Poo shop miniature. The scene shows a flower stall filled with tiny jasmine and colourful flower garlands, baskets of flowers, a seated flower seller preparing flowers and a customer buying them. The layered baskets, garlands and figures create a lively everyday-market scene that can be displayed on its own or combined with other miniature shops to build a complete traditional street. Material: Clay, miniature modelling materials and decorative flower elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade Malligai Poo flower shop miniature with jasmine garlands, baskets and figures. Perfect for Golu, Navaratri and traditional displays.',
        images: [
            '/Miniature shops/Malligaipoo.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 34
    },
    {
        name: 'Traditional Sugarcane Juice Cart Miniature',
        slug: 'traditional-sugarcane-juice-cart-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1699,
        mrp: 4199,
        weight: 650,
        story: 'A handmade miniature sugarcane juice cart with a traditional juicing machine and vendor, perfect for a Tamil Nadu village, street or Golu display.',
        details: 'Recreate the familiar sight of a traditional sugarcane juice cart with this detailed handmade miniature. The scene features a wheeled wooden-style cart, a miniature sugarcane juice machine, sugarcane pieces and a vendor operating the setup. It is a charming standalone piece for Navaratri Golu and works beautifully when placed alongside other food carts and miniature shops to create a lively South Indian street scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade sugarcane juice cart miniature with vendor and traditional juicing machine. Perfect for Golu, Navaratri and Tamil Nadu street scenes.',
        images: [
            '/Miniature shops/Sugarcane.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 17
    },
    {
        name: 'Traditional Lemon Soda Cart Miniature',
        slug: 'traditional-lemon-soda-cart-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1799,
        mrp: 4499,
        weight: 650,
        story: 'A colourful handmade lemon soda cart miniature with bottles, lemons, a vendor and customer, inspired by traditional roadside drink carts.',
        details: 'Add a fun roadside drink-stall scene to your Golu display with this handmade lemon soda cart miniature. The colourful wheeled cart is arranged with miniature bottles, lemons, a drink machine and a vendor serving a customer. Its bright details and everyday street-market feel make it a great standalone Golu piece or a perfect addition to a larger Tamil Nadu village, market or festival scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Colourful handmade lemon soda cart miniature with bottles, vendor and customer. Ideal for Golu, Navaratri and traditional street scenes.',
        images: [
            '/Miniature shops/Limesoda.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 32
    },
    {
        name: 'Traditional Tender Coconut Seller Bicycle Miniature',
        slug: 'tender-coconut-seller-bicycle-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1299,
        mrp: 3799,
        weight: 650,
        story: 'A handmade miniature tender coconut seller with a bicycle, coconuts and a traditional roadside-selling scene for Golu displays.',
        details: 'Capture the charm of a traditional roadside tender coconut seller with this detailed miniature scene. The miniature features a bicycle loaded with tender coconuts and a seller holding a coconut ready to serve. This compact cultural piece brings an everyday Tamil Nadu street moment into your Golu display and pairs beautifully with other miniature carts, shops and village-market scenes. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade tender coconut seller miniature with bicycle and coconuts. A charming Tamil Nadu street scene for Golu and Navaratri displays.',
        images: [
            '/Miniature shops/tendercoconut.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 26
    },
    {
        name: 'Traditional South Indian Tiffin Stall Miniature',
        slug: 'traditional-south-indian-tiffin-stall-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1999,
        mrp: 4299,
        weight: 650,
        story: 'A detailed handmade South Indian tiffin stall miniature with idlis, vadas, chutneys, banana leaves, cooking vessels and a woman serving food.',
        details: 'Bring a traditional South Indian breakfast scene to your Golu display with this detailed handmade tiffin stall miniature. The scene features idlis, vadas, chutneys, banana leaves, serving vessels and a woman holding a plate of food. Every tiny food element is arranged to recreate the warmth of a local breakfast stall. Display it independently or combine it with other Mythris Gleams miniature shops and carts for a complete food-street scene. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade South Indian tiffin stall miniature with idli, vada, chutney and banana leaves. Perfect for Golu and Navaratri displays.',
        images: [
            '/Miniature shops/tiffen.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 22
    },
    {
        name: 'Traditional Street Sweet Corn Cart Miniature',
        slug: 'traditional-street-vegetable-cart-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1999,
        mrp: 4499,
        weight: 650,
        story: 'A colourful handmade miniature street sweet corn cart with a vendor and fresh produce, perfect for traditional Golu and village-market scenes.',
        details: 'Add the charm of a traditional roadside sweet corn cart to your Golu display with this handmade miniature. The wheeled red cart is arranged with miniature sweet corn and a vendor standing behind the cart, creating a simple and familiar everyday-market scene. It works beautifully as a standalone miniature or as part of a larger Tamil Nadu village, market or festival-themed Golu setup. Material: Clay, miniature modelling materials and decorative elements Care: Keep away from water, direct moisture and rough handling. Dust gently with a soft dry brush or cloth.',
        metaDescription: 'Handmade street vegetable cart miniature with vendor and colourful vegetables. Perfect for Golu, Navaratri and Tamil Nadu village scenes.',
        images: [
            '/Miniature shops/sweetcorn.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 19
    },
    {
        name: 'Miniature Apple Fruit Basket',
        slug: 'miniature-apple-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature apple basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Apple Fruit Basket from Mythris Gleams. The basket is carefully created with tiny apple miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature apple fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/apple.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 23
    },
    {
        name: 'Miniature Banana Fruit Basket',
        slug: 'miniature-banana-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature banana basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Banana Fruit Basket from Mythris Gleams. The basket is carefully created with tiny banana miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature banana fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/Banana.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 24
    },
    {
        name: 'Miniature Mango Fruit Basket',
        slug: 'miniature-mango-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature mango basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Mango Fruit Basket from Mythris Gleams. The basket is carefully created with tiny mango miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature mango fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/mango.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 23
    },
    {
        name: 'Miniature Papaya Fruit Basket',
        slug: 'miniature-papaya-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature papaya basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Papaya Fruit Basket from Mythris Gleams. The basket is carefully created with tiny papaya miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature papaya fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/papaya.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 24
    },
    {
        name: 'Miniature Strawberry Fruit Basket',
        slug: 'miniature-strawberry-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature strawberry basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Strawberry Fruit Basket from Mythris Gleams. The basket is carefully created with tiny strawberry miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature strawberry fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/strawberry.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 28
    },
    {
        name: 'Miniature Pineapple Fruit Basket',
        slug: 'miniature-pineapple-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature pineapple basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Pineapple Fruit Basket from Mythris Gleams. The basket is carefully created with tiny pineapple miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature pineapple fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/Orange.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },

    {
        name: 'Miniature Pear Fruit Basket',
        slug: 'miniature-pear-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature pear basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Pear Fruit Basket from Mythris Gleams. The basket is carefully created with tiny pear miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature pear fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/pears.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 22
    },
    {
        name: 'Miniature Watermelon Fruit Basket',
        slug: 'miniature-watermelon-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature watermelon basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Watermelon Fruit Basket from Mythris Gleams. The basket is carefully created with tiny watermelon miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature watermelon fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/watermelon.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 28
    },
    {
        name: 'Miniature Jamun Fruit Basket',
        slug: 'miniature-jamun-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature jamun basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Jamun Fruit Basket from Mythris Gleams. The basket is carefully created with tiny jamun miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature jamun fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/pears.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 23
    },
    {
        name: 'Miniature Custard Apple Fruit Basket',
        slug: 'miniature-custard-apple-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature custard apple basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Custard Apple Fruit Basket from Mythris Gleams. The basket is carefully created with tiny custard apple miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature custard apple fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/apple.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 31
    },
    {
        name: 'Miniature Guava Fruit Basket',
        slug: 'miniature-guava-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature guava basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Guava Fruit Basket from Mythris Gleams. The basket is carefully created with tiny guava miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature guava fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/apple.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 23
    },
    {
        name: 'Miniature Muskmelon Fruit Basket',
        slug: 'miniature-muskmelon-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature muskmelon basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Muskmelon Fruit Basket from Mythris Gleams. The basket is carefully created with tiny muskmelon miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature muskmelon fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/watermelon.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },
    {
        name: 'Miniature Dragon Fruit Fruit Basket',
        slug: 'miniature-dragon-fruit-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature dragon fruit basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Dragon Fruit Fruit Basket from Mythris Gleams. The basket is carefully created with tiny dragon fruit miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature dragon fruit fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/strawberry.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 30
    },
    {
        name: 'Miniature Jackfruit Fruit Basket',
        slug: 'miniature-jackfruit-fruit-basket',
        category: 'Miniature Fruit Baskets',
        subcategory: 'Handcrafted Fruit Baskets',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature jackfruit basket made with detailed clay fruit miniatures in a charming traditional basket.',
        details: 'Bring the charm of a traditional fruit basket into your miniature collection with this handcrafted Miniature Jackfruit Fruit Basket from Mythris Gleams. The basket is carefully created with tiny jackfruit miniatures, detailed and arranged to look like a real fruit basket in miniature. It is a lovely addition to Golu and Navaratri displays, miniature shop setups, village themes, miniature kitchens, dioramas and craft collections. Each piece is handmade and may have tiny natural variations that make it unique. Material: Clay / polymer clay miniature fruit, miniature basket and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny fruits and basket carefully.',
        metaDescription: 'Shop a handcrafted miniature jackfruit fruit basket from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops and dioramas.',
        images: [
            '/Fruit baskets/papaya.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },

    {
        name: 'Miniature Potato Vegetable Crate',
        slug: 'miniature-potato-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature potato crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Potato Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny potato miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature potato vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/potato.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },
    {
        name: 'Miniature Brinjal Vegetable Crate',
        slug: 'miniature-brinjal-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature brinjal crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Brinjal Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny brinjal miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature brinjal vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/brinjal.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 28
    },

    {
        name: 'Miniature Drumstick Vegetable Crate',
        slug: 'miniature-drumstick-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature drumstick crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Drumstick Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny drumstick miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature drumstick vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/drumstick.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 30
    },
    {
        name: 'Miniature Banana Stem Vegetable Crate',
        slug: 'miniature-banana-stem-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature banana stem crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Banana Stem Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny banana stem miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature banana stem vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/banana stem.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 32
    },
    {
        name: 'Miniature Carrot Vegetable Crate',
        slug: 'miniature-carrot-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature carrot crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Carrot Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny carrot miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature carrot vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/carrot.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },
    {
        name: 'Miniature Radish Vegetable Crate',
        slug: 'miniature-radish-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature radish crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Radish Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny radish miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature radish vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/raddish.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 27
    },
    {
        name: 'Miniature Beetroot Vegetable Crate',
        slug: 'miniature-beetroot-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature beetroot crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Beetroot Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny beetroot miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature beetroot vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/beetroot.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 29
    },
    {
        name: 'Miniature Lemon Vegetable Crate',
        slug: 'miniature-lemon-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature lemon crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Lemon Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny lemon miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature lemon vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/lemon.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 26
    },
    {
        name: 'Miniature Pumpkin Vegetable Crate',
        slug: 'miniature-pumpkin-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature pumpkin crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Pumpkin Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny pumpkin miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature pumpkin vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/pumkin.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 28
    },
    {
        name: 'Miniature Cucumber Vegetable Crate',
        slug: 'miniature-cucumber-vegetable-crate',
        category: 'Miniature Vegetable Crates',
        subcategory: 'Handcrafted Vegetable Crates',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 199,
        mrp: 300,
        weight: 120,
        story: 'Handcrafted miniature cucumber crate made with detailed clay vegetable miniatures, designed for realistic Golu and miniature market displays.',
        details: 'Bring the charm of a traditional vegetable market into your miniature collection with this handcrafted Miniature Cucumber Vegetable Crate from Mythris Gleams. The crate is carefully created with tiny cucumber miniatures and arranged to look like a real vegetable crate in miniature. Perfect for Navaratri Golu displays, miniature vegetable shops, village themes, market scenes, dioramas, miniature kitchens and craft collections. Each piece is handmade, so tiny variations in colour, shape and arrangement may occur. Material: Clay / polymer clay miniature vegetables, miniature crate and craft materials Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the tiny vegetables and crate carefully.',
        metaDescription: 'Shop a handcrafted miniature cucumber vegetable crate from Mythris Gleams. Perfect for Golu, Navaratri décor, miniature shops, village scenes and dioramas.',
        images: [
            '/Vegetable Baskets/cucumber.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 33
    },
    {
        name: 'Navaratri Miniature Thamboolam – Real Cloth Edition',
        slug: 'navaratri-miniature-thamboolam-real-cloth',
        category: 'Navaratri Thamboolam Collections',
        subcategory: 'Navaratri Thamboolam Gifts',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 350,
        mrp: 700,
        weight: 180,
        story: 'A beautifully handcrafted Navaratri Thamboolam gift set featuring a real miniature cloth, traditional festive essentials and a decorative gold-toned tray.',
        details: 'Celebrate the tradition of Navaratri Thamboolam with this beautifully handcrafted miniature return-gift set from Mythris Gleams. This edition features a real miniature cloth, carefully arranged with traditional festive elements on a decorative tray. The miniature set includes traditional Thamboolam-inspired details such as fruits, betel leaf and festive items, presented as a charming keepsake. A thoughtful choice for Navaratri return gifts, Golu gatherings, festive décor and miniature collectors. Material: Miniature craft materials, real fabric cloth and decorative tray Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the miniature cloth and small decorative elements carefully.',
        metaDescription: 'Handcrafted Navaratri miniature Thamboolam with real miniature cloth and traditional festive details. A unique Golu and return gift idea.',
        images: [
            '/Navarathri Thamboolam/Navaratri Thamboolam 13.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 26
    },
    {
        name: 'Navaratri Miniature Thamboolam – Clay Cloth Tray Edition',
        slug: 'navaratri-miniature-thamboolam-clay-cloth-tray',
        category: 'Navaratri Thamboolam Collections',
        subcategory: 'Navaratri Thamboolam Gifts',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 250,
        mrp: 350,
        weight: 180,
        story: 'A handcrafted Navaratri miniature Thamboolam arranged on a decorative tray, featuring a miniature cloth recreated in clay and traditional festive elements.',
        details: 'Add a unique miniature touch to your Navaratri celebrations with this handcrafted Thamboolam set from Mythris Gleams. This edition features a decorative tray with a miniature cloth recreated in clay, along with traditional festive elements arranged in a beautiful Thamboolam-style presentation. The clay-made details make this a lasting miniature keepsake that can be displayed as part of a Golu setup or treasured as a festive collectible. It is designed to capture the beauty of traditional South Indian festive gifting in miniature form. Material: Clay, miniature modelling materials and decorative tray Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the miniature cloth and small decorative elements carefully.',
        metaDescription: 'Handmade Navaratri miniature Thamboolam with a clay-made miniature cloth and festive details. Perfect for Golu and traditional décor.',
        images: [
            '/Navarathri Thamboolam/Navaratri Thamboolam 2.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 31
    },
    {
        name: 'Navaratri Miniature Thamboolam – Ornate Clay Cloth Edition',
        slug: 'navaratri-miniature-thamboolam-ornate-clay-cloth',
        category: 'Navaratri Thamboolam Collections',
        subcategory: 'Navaratri Thamboolam Gifts',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 250,
        mrp: 350,
        weight: 180,
        story: 'A traditional-style Navaratri miniature Thamboolam with an ornate decorative base, clay-made miniature cloth and festive return-gift elements.',
        details: 'This handcrafted Navaratri Miniature Thamboolam combines traditional festive gifting with detailed miniature art. The set features an ornate decorative base, a miniature cloth recreated in clay and carefully arranged festive elements including fruits, betel leaf and other traditional Thamboolam details. Designed as a beautiful Navaratri keepsake, it can be used for Golu décor, festive gifting or as part of a miniature collection. Its ornate presentation makes it a special choice for festive display and traditional gifting. Material: Clay, miniature modelling materials and decorative tray Care: Keep away from water, moisture and direct sunlight. Dust gently with a soft dry brush or cloth. Handle the miniature cloth and small decorative elements carefully.',
        metaDescription: 'Handcrafted ornate Navaratri miniature Thamboolam with clay-made miniature cloth and traditional festive details for Golu and gifting.',
        images: [
            '/Navarathri Thamboolam/Navaratri Thamboolam 1.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 33
    },
    {
        name: 'Traditional Pani Puri Cart Miniature',
        slug: 'traditional-pani-puri-cart-miniature',
        category: 'Navaratri Miniature Shops',
        subcategory: 'Miniature Shops',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Navaratri / Golu',
        price: 1799,
        mrp: 3499,
        weight: 650,
        story: 'A colourful handmade miniature Pani Puri and chaat cart with tiny puris, flavoured water pots, vendor and customer for Golu and street displays.',
        details: 'Handcrafted in clay and wood. Includes clay chaat pots, miniature puris, vendor figurine and decorative stall structure. Keep dry and dust with a soft cloth.',
        metaDescription: 'Buy handcrafted traditional Pani Puri chaat cart miniature for Golu by Mythris Gleams.',
        images: [
            '/Miniature shops/Paanipoori.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 24
    },
    {
        name: 'South Indian Banana Leaf Thali Fridge Magnet',
        slug: 'south-indian-banana-leaf-thali-fridge-magnet',
        category: 'Fridge Magnets',
        subcategory: 'Miniature Food Magnets',
        occasion: 'Housewarming',
        occasionSub: 'Housewarming Gift Sets',
        price: 499,
        mrp: 699,
        weight: 120,
        story: 'A delicious South Indian feast miniature mounted on an MDF base with a strong neodymium magnet.',
        details: 'Air-dry polymer clay, hand-painted details with rice, sambar, rasam, kootu, poriyal, payasam and appalam. Neodymium magnet on back.',
        metaDescription: 'Buy South Indian Banana Leaf Thali fridge magnet handcrafted in clay.',
        images: [
            '/Fridge Magnets/Banana leaf thali with mdf base.png'
        ],
        variants: [],
        stockStatus: 'in-stock',
        rating: 4.9,
        reviewCount: 38
    },
    {
        name: 'Karnataka Yakshagana & Oota Heritage Souvenir',
        slug: 'karnataka-yakshagana-and-oota-heritage-souvenir',
        category: 'Miniature Art & Wall DÃ©cor',
        subcategory: 'Cultural Souvenirs',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Diwali',
        price: 1499,
        mrp: 2499,
        weight: 350,
        story: 'A magnificent South Indian cultural souvenir capturing Karnataka\'s iconic Yakshagana performer and traditional meal platter in handcrafted clay.',
        details: 'Handcrafted polymer clay art mounted on a polished display plaque. Ideal for cultural gifting, living rooms and office showcases.',
        metaDescription: 'Buy handcrafted Karnataka Yakshagana & Oota Heritage Souvenir by Mythris Gleams.',
        images: [
            '/souvenirs/Karnataka yakshagana and oota.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 29
    },
    {
        name: 'Kerala Onam Sadya Miniature Souvenir',
        slug: 'kerala-onam-sadya-miniature-souvenir',
        category: 'Miniature Art & Wall DÃ©cor',
        subcategory: 'Cultural Souvenirs',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Diwali',
        price: 1499,
        mrp: 2499,
        weight: 350,
        story: 'An artisanal miniature tribute to Kerala\'s celebrated Grand Sadya feast with traditional side dishes on a banana leaf.',
        details: 'Handcrafted polymer clay art mounted on a polished display plaque. Ideal for cultural gifting, living rooms and office showcases.',
        metaDescription: 'Buy handcrafted Kerala Onam Sadya Miniature Souvenir by Mythris Gleams.',
        images: [
            '/souvenirs/Kerala Sadya.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 29
    },
    {
        name: 'Tamil Nadu Bharatanatyam & Vazhaillai Sapadu Souvenir',
        slug: 'tamil-nadu-bharatanatyam-vazhaillai-sapadu-souvenir',
        category: 'Miniature Art & Wall DÃ©cor',
        subcategory: 'Cultural Souvenirs',
        occasion: 'Festivals & Religious Events',
        occasionSub: 'Diwali',
        price: 1499,
        mrp: 2499,
        weight: 350,
        story: 'A celebration of Tamil culture depicting a classical Bharatanatyam dancer alongside an authentic Vazhaillai virundhu sapadu.',
        details: 'Handcrafted polymer clay art mounted on a polished display plaque. Ideal for cultural gifting, living rooms and office showcases.',
        metaDescription: 'Buy handcrafted Tamil Nadu Bharatanatyam & Vazhaillai Sapadu Souvenir by Mythris Gleams.',
        images: [
            '/souvenirs/tamilnadu vazhaillai sapadu and bharathanatyam 1.png'
        ],
        variants: [],
        stockStatus: 'made-to-order',
        rating: 4.9,
        reviewCount: 29
    }
];

const importData = async () => {
    try {
        await Collection.deleteMany();
        await Occasion.deleteMany();
        await Product.deleteMany();

        console.log('ðŸ§¹ Cleared existing database records.');

        const createdCollections = await Collection.insertMany(categorySeed.map(c => ({
            name: c.name,
            slug: c.slug,
            description: c.description,
            metaDescription: c.metaDescription,
            image: c.image
        })));
        console.log('âœ… Top-level collections seeded: ', createdCollections.length);

        // Seed subcategories with parent references
        let subcategoryCount = 0;
        const subcategoryDocs: any[] = [];
        categorySeed.forEach((cat, i) => {
            (cat.subcategories || []).forEach(sc => {
                subcategoryDocs.push({
                    name: sc.name,
                    slug: sc.slug,
                    description: sc.name + ' - a subcategory of ' + cat.name,
                    image: sc.image,
                    parent: createdCollections[i]._id
                });
                subcategoryCount++;
            });
        });
        await Collection.insertMany(subcategoryDocs);
        console.log('âœ… Subcategories seeded: ', subcategoryCount);

        const createdOccasions = await Occasion.insertMany(occasionSeed.map(o => ({
            name: o.name,
            slug: o.slug,
            description: o.description,
            metaDescription: o.metaDescription,
            image: o.image
        })));
        console.log('âœ… Top-level occasions seeded: ', createdOccasions.length);

        // Seed occasion subcategories with parent references
        let occasionSubCount = 0;
        const occasionSubDocs: any[] = [];
        occasionSeed.forEach((occ, i) => {
            (occ.subcategories || []).forEach(sc => {
                occasionSubDocs.push({
                    name: sc.name,
                    slug: sc.slug,
                    description: sc.name + ' - a subcategory of ' + occ.name,
                    image: sc.image,
                    parent: createdOccasions[i]._id
                });
                occasionSubCount++;
            });
        });
        await Occasion.insertMany(occasionSubDocs);
        console.log('âœ… Occasion subcategories seeded: ', occasionSubCount);

        const createdProducts = await Product.insertMany(products);
        console.log('âœ… Products Seeded: ', createdProducts.length);

        console.log('ðŸŽ‰ Data Import Successful!');
        process.exit();
    } catch (error) {
        console.error('âŒ Error during seeding: ', error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Collection.deleteMany();
        await Occasion.deleteMany();
        await Product.deleteMany();

        console.log('ðŸ’¥ Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error('âŒ Error during destruction: ', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}