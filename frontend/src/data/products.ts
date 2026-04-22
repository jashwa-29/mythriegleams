export interface Product {
  id: number;
  _id?: string; // Backend Mongo ID
  slug?: string; // SEO Slug
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp?: number; // Backend valuation
  oldPrice: number | null;
  emoji: string;
  bg: string;
  badge: string | null;
  rating: number;
  reviews: number;
  custom: boolean;
  desc: string;
  story?: string; // Artisanal Narrative
  details?: string; // Technical details
  metaDescription?: string; // SEO summary
  stockStatus?: 'in-stock' | 'out-of-stock' | 'made-to-order';
  images?: string[]; // Dynamic image array
  sizes: string[];
  variants?: any[]; // Dynamic variations
  colors: string[];
  specs: Record<string, string>;
  thumb_emojis: string[];
  thumb_bgs: string[];
}

export const ALL_PRODUCTS: Product[] = [
  { id:1, name:'Handmade Miniature Food Clock – Pizza', category:'miniature', subcategory:'food-clock', price:499, oldPrice:699, emoji:'🍕', bg:'prod-bg-1', badge:'hot', rating:4.9, reviews:48, custom:true,
    desc:'A breathtaking handcrafted miniature food clock made from premium air-dry clay, hand-sculpted and painted by Uma Gayathri. This pizza-themed wall clock combines functional timekeeping with whimsical art. Each piece is uniquely made — no two are identical. Perfect for kitchens, kids rooms, gifting, and home decor.\n\nAvailable in pizza, burger, sushi and more themes. Custom themes available on request. Ideal for gifting across India.',
    sizes:['Small (6 inch)','Medium (8 inch)','Large (10 inch)'],
    colors:['#e8c99f','#f5deb3','#ffccbc'],
    specs:{ Material:'Air-dry clay & resin', Finish:'Hand-painted, matte', Size:'Available in 3 sizes', Weight:'~150g (Medium)', 'Clock Mechanism':'Battery-operated (AA)', 'Occasion':'Gifting, Home Decor', 'Delivery Time':'5–7 business days', 'Custom Available':'Yes, all themes' },
    thumb_emojis:['🍕','🍕','🍕'],
    thumb_bgs:['prod-bg-1', 'prod-bg-3', 'prod-bg-5'],
  },
  { id:2, name:'Miniature Burger Clock', category:'miniature', subcategory:'food-clock', price:479, oldPrice:649, emoji:'🍔', bg:'prod-bg-2', badge:'hot', rating:4.8, reviews:35, custom:true,
    desc:'Adorable burger-themed miniature food clock, hand-sculpted from clay by Uma Gayathri. Each layer — bun, patty, cheese, lettuce — is crafted individually for hyper-realistic detail. A show-stopper wall decor item and a one-of-a-kind gift.',
    sizes:['Small (6 inch)','Medium (8 inch)'],
    colors:['#c8e6c9','#e8f5e9','#f5deb3'],
    specs:{ Material:'Air-dry clay', Finish:'Hand-painted', Size:'6 or 8 inch', Weight:'~130g', 'Clock Mechanism':'Battery-operated', 'Custom Available':'Yes' },
    thumb_emojis:['🍔','🍔','🍔'],
    thumb_bgs:['prod-bg-2', 'prod-bg-4', 'prod-bg-7'],
  },
  { id:3, name:'Miniature Sushi Clock', category:'miniature', subcategory:'food-clock', price:529, oldPrice:749, emoji:'🍱', bg:'prod-bg-3', badge:'new', rating:4.9, reviews:19, custom:true,
    desc:'Exquisite sushi bento miniature food clock — an artistic masterpiece for Japanese cuisine lovers. Multiple sushi pieces arranged in a bento box, all hand-sculpted from clay. A truly unique wall decor and gift item.',
    sizes:['Medium (8 inch)','Large (10 inch)'],
    colors:['#e3f2fd','#bbdefb','#E8CFCF'],
    specs:{ Material:'Air-dry clay & polymer clay', Finish:'Hand-painted', Size:'8 or 10 inch', 'Custom Available':'Yes' },
    thumb_emojis:['🍱','🍱','🍱'],
    thumb_bgs:['prod-bg-3','prod-bg-1','prod-bg-8'],
  },
  { id:4, name:'Miniature Donut Clock', category:'miniature', subcategory:'food-clock', price:459, oldPrice:null, emoji:'🍩', bg:'prod-bg-4', badge:null, rating:4.7, reviews:12, custom:true,
    desc:'Delicious looking donut wall clock. Hand-painted with realistic textures and sprinkles.',
    sizes:['Medium (8 inch)'],
    colors:['#fce4ec'],
    specs:{ Material: 'Air-dry clay', Size: '8 inch' },
    thumb_emojis: ['🍩'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:5, name:'Food Wall Spatula – Set of 3', category:'miniature', subcategory:'wall-spatula', price:329, oldPrice:449, emoji:'🍳', bg:'prod-bg-7', badge:'new', rating:4.7, reviews:11, custom:false,
    desc:'Miniature food arranged on wooden spatulas for kitchen wall decor.',
    sizes:['Set of 3'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Wood & Clay', Count: '3 Spatulas' },
    thumb_emojis: ['🍳'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:6, name:'Food Wall Spatula – Set of 5', category:'miniature', subcategory:'wall-spatula', price:549, oldPrice:699, emoji:'🥄', bg:'prod-bg-8', badge:null, rating:4.8, reviews:8, custom:false,
    desc:'Extensive set of 5 miniature food spatulas for a complete kitchen decor look.',
    sizes:['Set of 5'],
    colors:['#e0f7fa'],
    specs:{ Material: 'Wood & Clay', Count: '5 Spatulas' },
    thumb_emojis: ['🥄'],
    thumb_bgs: ['prod-bg-8']
  },
  { id:7, name:'Miniature Food Magnet Set', category:'miniature', subcategory:'magnets', price:249, oldPrice:349, emoji:'🧲', bg:'prod-bg-5', badge:'sale', rating:4.6, reviews:22, custom:false,
    desc:'Strong fridge magnets with hyper-realistic miniature food designs.',
    sizes:['Set of 3'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Clay', Count: '3 Magnets', 'Magnet Type': 'Neodymium' },
    thumb_emojis: ['🧲'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:8, name:'Miniature Food Keychain – Donut', category:'miniature', subcategory:'keychains', price:179, oldPrice:null, emoji:'🍩', bg:'prod-bg-9', badge:null, rating:4.7, reviews:61, custom:false,
    desc:'Carry your favorite food everywhere with this adorable donut keychain.',
    sizes:['Standard'],
    colors:['#f9fbe7'],
    specs:{ Material: 'Polymer Clay', Weight: '20g' },
    thumb_emojis: ['🍩'],
    thumb_bgs: ['prod-bg-9']
  },
  { id:9, name:'Miniature Food Keychain – Strawberry', category:'miniature', subcategory:'keychains', price:189, oldPrice:null, emoji:'🍓', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:17, custom:false,
    desc:'Hand-sculpted strawberry keychain with amazing detail.',
    sizes:['Standard'],
    colors:['#fce4ec'],
    specs:{ Material: 'Polymer Clay', Weight: '15g' },
    thumb_emojis: ['🍓'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:10, name:'Navaratri Thamboolam Return Gift', category:'miniature', subcategory:'navaratri', price:799, oldPrice:999, emoji:'🪔', bg:'prod-bg-1', badge:'hot', rating:5.0, reviews:19, custom:true,
    desc:'Traditional thamboolam set miniature for Navaratri gifting.',
    sizes:['Single Pack', 'Pack of 5'],
    colors:['#fce4ec'],
    specs:{ Material: 'Clay', Occasion: 'Navaratri' },
    thumb_emojis: ['🪔'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:11, name:'Navaratri Golu Display Miniature', category:'miniature', subcategory:'navaratri', price:599, oldPrice:799, emoji:'🌺', bg:'prod-bg-2', badge:'new', rating:4.9, reviews:14, custom:true,
    desc:'Beautiful miniature display items for Navaratri Golu.',
    sizes:['Standard'],
    colors:['#e8f5e9'],
    specs:{ Material: 'Clay', Occasion: 'Navaratri' },
    thumb_emojis: ['🌺'],
    thumb_bgs: ['prod-bg-2']
  },
  // Kawaii
  { id:12, name:'Kawaii Fridge Magnet Set', category:'kawaii', subcategory:'magnets', price:249, oldPrice:349, emoji:'🐣', bg:'prod-bg-4', badge:'new', rating:4.8, reviews:32, custom:false,
    desc:'Super cute kawaii characters as fridge magnets.',
    sizes:['Set of 4'],
    colors:['#e3f2fd'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐣'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:13, name:'Kawaii Keychain – Bunny', category:'kawaii', subcategory:'keychains', price:199, oldPrice:null, emoji:'🐰', bg:'prod-bg-4', badge:null, rating:4.7, reviews:28, custom:false,
    desc:'Handmade bunny keychain in kawaii style.',
    sizes:['Standard'],
    colors:['#e3f2fd'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐰'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:14, name:'Kawaii Keychain – Panda', category:'kawaii', subcategory:'keychains', price:199, oldPrice:null, emoji:'🐼', bg:'prod-bg-5', badge:null, rating:4.8, reviews:21, custom:false,
    desc:'Adorable panda keychain for all ages.',
    sizes:['Standard'],
    colors:['#E8CFCF'],
    specs:{ Material: 'Polymer Clay' },
    thumb_emojis: ['🐼'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:15, name:'Tic Tac Toe Clay Game – Kids', category:'kawaii', subcategory:'games', price:449, oldPrice:599, emoji:'🎮', bg:'prod-bg-6', badge:'hot', rating:4.9, reviews:40, custom:false,
    desc:'Functional and cute Tic Tac Toe game board with clay pieces.',
    sizes:['One Size'],
    colors:['#f3e5f5'],
    specs:{ Material: 'Clay & Wood' },
    thumb_emojis: ['🎮'],
    thumb_bgs: ['prod-bg-6']
  },
  { id:16, name:'Kawaii Trinket Tray – Floral', category:'kawaii', subcategory:'trinket', price:399, oldPrice:null, emoji:'🌷', bg:'prod-bg-7', badge:null, rating:4.6, reviews:15, custom:true,
    desc:'Beautiful tray for your jewelry and small items.',
    sizes:['Standard'],
    colors:['#fbe9e7'],
    specs:{ Material: 'Resin & Clay' },
    thumb_emojis: ['🌷'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:17, name:'Cute Mini Decor – Cloud Set', category:'kawaii', subcategory:'decor', price:349, oldPrice:479, emoji:'☁️', bg:'prod-bg-8', badge:'new', rating:4.7, reviews:9, custom:false,
    desc:'Wall decor clouds for kids rooms.',
    sizes:['Set of 3'],
    colors:['#e0f7fa'],
    specs:{ Material: 'Clay' },
    thumb_emojis: ['☁️'],
    thumb_bgs: ['prod-bg-8']
  },
  // Gifts
  { id:18, name:"Valentine's Day Clay Gift Set", category:'gifts', subcategory:'valentine', price:699, oldPrice:899, emoji:'❤️', bg:'prod-bg-9', badge:'hot', rating:4.9, reviews:53, custom:true,
    desc: 'Perfect gift for your loved one.',
    sizes: ['Gift Pack'],
    colors: ['#f9fbe7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['❤️'],
    thumb_bgs: ['prod-bg-9']
  },
  { id:19, name:"Mother's Day Flower Decor", category:'gifts', subcategory:'mothers', price:599, oldPrice:799, emoji:'💐', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:27, custom:true,
    desc: 'Everlasting flowers for Mother\'s Day.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['💐'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:20, name:"Father's Day Miniature Gift", category:'gifts', subcategory:'fathers', price:499, oldPrice:649, emoji:'👨', bg:'prod-bg-1', badge:null, rating:4.7, reviews:18, custom:true,
    desc: 'Unique miniature gift for Father\'s Day.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['👨'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:21, name:'Birthday Gift Clay Set', category:'gifts', subcategory:'birthday', price:649, oldPrice:849, emoji:'🎂', bg:'prod-bg-2', badge:'hot', rating:4.9, reviews:63, custom:true,
    desc: 'Celebrate birthdays with unique handmade gifts.',
    sizes: ['Standard'],
    colors: ['#e8f5e9'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎂'],
    thumb_bgs: ['prod-bg-2']
  },
  { id:22, name:'Naming Ceremony Return Gifts', category:'gifts', subcategory:'naming', price:399, oldPrice:499, emoji:'👶', bg:'prod-bg-3', badge:'new', rating:4.8, reviews:22, custom:true,
    desc: 'Adorable return gifts for naming ceremonies.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['👶'],
    thumb_bgs: ['prod-bg-3']
  },
  { id:23, name:'Housewarming Clay Gift Set', category:'gifts', subcategory:'housewarming', price:749, oldPrice:999, emoji:'🏠', bg:'prod-bg-4', badge:null, rating:4.9, reviews:16, custom:true,
    desc: 'Handmade home decor for housewarming gifts.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🏠'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:24, name:'Return Gift Bulk Set (25 pcs)', category:'gifts', subcategory:'return', price:4999, oldPrice:6499, emoji:'🎁', bg:'prod-bg-5', badge:'sale', rating:5.0, reviews:11, custom:true,
    desc: 'Bulk set of return gifts for events.',
    sizes: ['Set of 25'],
    colors: ['#E8CFCF'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎁'],
    thumb_bgs: ['prod-bg-5']
  },
  // Utility
  { id:25, name:'Clay Pen Holder – Floral', category:'utility', subcategory:'pen-holder', price:349, oldPrice:449, emoji:'✏️', bg:'prod-bg-6', badge:null, rating:4.7, reviews:19, custom:true,
    desc: 'Floral desktop pen holder.',
    sizes: ['Standard'],
    colors: ['#f3e5f5'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['✏️'],
    thumb_bgs: ['prod-bg-6']
  },
  { id:26, name:'Car Charm – Elephant', category:'utility', subcategory:'car-charm', price:279, oldPrice:null, emoji:'🐘', bg:'prod-bg-7', badge:'new', rating:4.8, reviews:31, custom:false,
    desc: 'Protective elephant charm for your car.',
    sizes: ['Standard'],
    colors: ['#fbe9e7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🐘'],
    thumb_bgs: ['prod-bg-7']
  },
  { id:27, name:'Agarbathi Holder – Peacock', category:'utility', subcategory:'agarbathi', price:299, oldPrice:399, emoji:'🦚', bg:'prod-bg-8', badge:null, rating:4.8, reviews:22, custom:false,
    desc: 'Exquisite peacock design incense holder.',
    sizes: ['Standard'],
    colors: ['#e0f7fa'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🦚'],
    thumb_bgs: ['prod-bg-8']
  },
  { id:28, name:'Table Top Decor – Mushroom', category:'utility', subcategory:'tabletop', price:399, oldPrice:549, emoji:'🍄', bg:'prod-bg-9', badge:'hot', rating:4.9, reviews:14, custom:false,
    desc: 'Whimsical mushroom decor for your table.',
    sizes: ['Standard'],
    colors: ['#f9fbe7'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🍄'],
    thumb_bgs: ['prod-bg-9']
  },
  // Jewellery
  { id:29, name:'Polymer Clay Stud Earrings', category:'jewellery', subcategory:'polymer', price:299, oldPrice:399, emoji:'💫', bg:'prod-bg-10', badge:'new', rating:4.8, reviews:41, custom:true,
    desc: 'Lightweight polymer clay earrings.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Polymer Clay' },
    thumb_emojis: ['💫'],
    thumb_bgs: ['prod-bg-10']
  },
  { id:30, name:'Terracotta Jhumka Earrings', category:'jewellery', subcategory:'terracotta', price:349, oldPrice:499, emoji:'💛', bg:'prod-bg-1', badge:'hot', rating:4.9, reviews:27, custom:true,
    desc: 'Traditional terracotta earrings.',
    sizes: ['Standard'],
    colors: ['#fce4ec'],
    specs: { Material: 'Terracotta' },
    thumb_emojis: ['💛'],
    thumb_bgs: ['prod-bg-1']
  },
  { id:31, name:'Air Dry Clay Necklace', category:'jewellery', subcategory:'airdry', price:449, oldPrice:599, emoji:'💎', bg:'prod-bg-2', badge:null, rating:4.7, reviews:13, custom:true,
    desc: 'Unique air dry clay necklace.',
    sizes: ['Standard'],
    colors: ['#e8f5e9'],
    specs: { Material: 'Air Dry Clay' },
    thumb_emojis: ['💎'],
    thumb_bgs: ['prod-bg-2']
  },
  { id:32, name:'Polymer Clay Bracelet', category:'jewellery', subcategory:'polymer', price:399, oldPrice:null, emoji:'🌸', bg:'prod-bg-3', badge:'new', rating:4.8, reviews:8, custom:true,
    desc: 'Handmade polymer clay bracelet.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Polymer Clay' },
    thumb_emojis: ['🌸'],
    thumb_bgs: ['prod-bg-3']
  },
  // Corporate
  { id:33, name:'Corporate Gift Box – Premium', category:'corporate', subcategory:'corporate', price:1499, oldPrice:1999, emoji:'🏢', bg:'prod-bg-4', badge:'hot', rating:5.0, reviews:7, custom:true,
    desc: 'Premium corporate gift box.',
    sizes: ['Standard'],
    colors: ['#e3f2fd'],
    specs: { Material: 'Multiple' },
    thumb_emojis: ['🏢'],
    thumb_bgs: ['prod-bg-4']
  },
  { id:34, name:'Bulk Return Gift Set (50 pcs)', category:'corporate', subcategory:'bulk', price:7999, oldPrice:9999, emoji:'📦', bg:'prod-bg-5', badge:'sale', rating:5.0, reviews:5, custom:true,
    desc: 'Bulk set for corporate events.',
    sizes: ['Set of 50'],
    colors: ['#E8CFCF'],
    specs: { Material: 'Multiple' },
    thumb_emojis: ['📦'],
    thumb_bgs: ['prod-bg-5']
  },
  { id:35, name:'Custom Corporate Name Plaque', category:'corporate', subcategory:'custom', price:899, oldPrice:1199, emoji:'🎖️', bg:'prod-bg-6', badge:'new', rating:4.9, reviews:9, custom:true,
    desc: 'Personalized office name plaques.',
    sizes: ['Standard'],
    colors: ['#f3e5f5'],
    specs: { Material: 'Clay' },
    thumb_emojis: ['🎖️'],
    thumb_bgs: ['prod-bg-6']
  },
];
