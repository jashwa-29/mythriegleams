import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import Product from './models/Product';
import Collection from './models/Collection';

dotenv.config();

connectDB();

const collections = [
    {
        name: 'Miniatures',
        slug: 'miniatures',
        description: 'Lifelike artisanal clay replicas of your favorite food and cultural aspects.',
        metaDescription: 'Shop handcrafted miniature clay art.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'
    },
    {
        name: 'Clocks',
        slug: 'clocks',
        description: 'Bespoke sculptural timepieces capturing heritage and culinary art.',
        metaDescription: 'Shop artisanal designer clocks.',
        image: 'https://images.unsplash.com/photo-1563861826-1efe393625ef?auto=format&fit=crop&q=80&w=800'
    },
    {
        name: 'Magnets',
        slug: 'magnets',
        description: 'Tiny detailed magnetic art for your fridge.',
        metaDescription: 'Shop handcrafted clay fridge magnets.',
        image: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=800'
    }
];

const products = [
    {
        name: 'Traditional Samosa Miniature Clock',
        slug: 'traditional-samosa-miniature-clock',
        category: 'Clocks',
        price: 2499,
        mrp: 3200,
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
        category: 'Magnets',
        price: 499,
        mrp: 650,
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
        category: 'Miniatures',
        price: 1899,
        mrp: 2500,
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
        category: 'Miniatures',
        price: 1299,
        mrp: 1800,
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
        category: 'Miniatures',
        price: 3499,
        mrp: 4200,
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
        category: 'Clocks',
        price: 2899,
        mrp: 3500,
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
        await Product.deleteMany();

        console.log('🧹 Cleared existing database records.');

        const createdCollections = await Collection.insertMany(collections);
        console.log('✅ Collections Seeded: ', createdCollections.length);

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
