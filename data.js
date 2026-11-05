/* ============================================
   URBAN CART - PRODUCT DATA
   Shared product catalog data
   ============================================ */

const PRODUCTS = [
  {
    id: 1,
    name: "Wireless Noise-Cancelling Headphones",
    description: "Premium over-ear headphones with active noise cancellation and 40-hour battery life.",
    category: "Electronics",
    price: 199.99,
    oldPrice: 299.99,
    discount: 33,
    rating: 4.8,
    reviews: 1240,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/9058883/pexels-photo-9058883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/3394653/pexels-photo-3394653.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/9058878/pexels-photo-9058878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "SoundWave",
    sku: "SW-NC100",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 2,
    name: "Luxury Chronograph Wristwatch",
    description: "Elegant chronograph watch with genuine leather strap and sapphire crystal display.",
    category: "Accessories",
    price: 249.99,
    oldPrice: 399.99,
    discount: 38,
    rating: 4.9,
    reviews: 856,
    image: "https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/30077330/pexels-photo-30077330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/14312717/pexels-photo-14312717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "TimeLux",
    sku: "TL-CHR200",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 3,
    name: "Premium Leather Handbag",
    description: "Handcrafted genuine leather handbag with gold-tone hardware and adjustable strap.",
    category: "Fashion",
    price: 129.99,
    oldPrice: 189.99,
    discount: 32,
    rating: 4.7,
    reviews: 432,
    image: "https://images.pexels.com/photos/27046147/pexels-photo-27046147.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/27204288/pexels-photo-27204288.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/27174573/pexels-photo-27174573.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "Urban Leather",
    sku: "UL-HB300",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 4,
    name: "Latest 5G Smartphone Pro",
    description: "6.7-inch OLED display, triple camera system, 256GB storage, and all-day battery life.",
    category: "Electronics",
    price: 899.99,
    oldPrice: 1099.99,
    discount: 18,
    rating: 4.6,
    reviews: 2100,
    image: "https://images.pexels.com/photos/18311092/pexels-photo-18311092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/36680544/pexels-photo-36680544.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/947407/pexels-photo-947407.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/11120516/pexels-photo-11120516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "TechPro",
    sku: "TP-5G400",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 5,
    name: "Signature Eau de Parfum",
    description: "Long-lasting fragrance with notes of bergamot, cedar, and amber. 100ml bottle.",
    category: "Beauty",
    price: 79.99,
    oldPrice: 119.99,
    discount: 33,
    rating: 4.8,
    reviews: 678,
    image: "https://images.pexels.com/photos/29982967/pexels-photo-29982967.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/27572999/pexels-photo-27572999.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/28481966/pexels-photo-28481966.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/22589355/pexels-photo-22589355.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "Maison Luxe",
    sku: "ML-EP500",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 6,
    name: "Premium Sneakers Collection",
    description: "Comfortable athletic sneakers with breathable mesh upper and cushioned sole.",
    category: "Shoes",
    price: 89.99,
    oldPrice: 149.99,
    discount: 40,
    rating: 4.5,
    reviews: 920,
    image: "https://images.pexels.com/photos/33597709/pexels-photo-33597709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/19869760/pexels-photo-19869760.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/8313383/pexels-photo-8313383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/33597709/pexels-photo-33597709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "StepUp",
    sku: "SU-SN600",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 7,
    name: "Designer Sunglasses Pro",
    description: "UV400 protection polarized sunglasses with lightweight acetate frame.",
    category: "Accessories",
    price: 59.99,
    oldPrice: 99.99,
    discount: 40,
    rating: 4.6,
    reviews: 345,
    image: "https://images.pexels.com/photos/32677231/pexels-photo-32677231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/32677246/pexels-photo-32677246.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/32677251/pexels-photo-32677251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/32677241/pexels-photo-32677241.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "VisionLux",
    sku: "VL-SG700",
    stock: "In Stock",
    isNew: false
  },
  {
    id: 8,
    name: "Modern Wooden Desk Lamp",
    description: "Minimalist desk lamp with warm LED light, adjustable arm, and USB charging port.",
    category: "Home",
    price: 49.99,
    oldPrice: 79.99,
    discount: 38,
    rating: 4.4,
    reviews: 210,
    image: "https://images.pexels.com/photos/31410610/pexels-photo-31410610.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/38986383/pexels-photo-38986383.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/38986380/pexels-photo-38986380.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/35329516/pexels-photo-35329516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "Sale",
    brand: "HomeStyle",
    sku: "HS-DL800",
    stock: "In Stock",
    isNew: false
  },
  // New Arrivals
  {
    id: 9,
    name: "Pro DSLR Camera Kit",
    description: "24MP DSLR with 18-55mm zoom lens, 4K video, and Wi-Fi connectivity.",
    category: "Electronics",
    price: 749.99,
    oldPrice: 899.99,
    discount: 17,
    rating: 4.9,
    reviews: 540,
    image: "https://images.pexels.com/photos/28472226/pexels-photo-28472226.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/28472225/pexels-photo-28472225.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/26292003/pexels-photo-26292003.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/16671406/pexels-photo-16671406.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "New",
    brand: "OptiShot",
    sku: "OS-DSLR900",
    stock: "In Stock",
    isNew: true
  },
  {
    id: 10,
    name: "Classic Cotton T-Shirt",
    description: "Premium 100% organic cotton t-shirt with relaxed fit. Available in multiple colors.",
    category: "Fashion",
    price: 24.99,
    oldPrice: 39.99,
    discount: 38,
    rating: 4.3,
    reviews: 180,
    image: "https://images.pexels.com/photos/8146450/pexels-photo-8146450.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/8146448/pexels-photo-8146448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/13811772/pexels-photo-13811772.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/8146450/pexels-photo-8146450.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "New",
    brand: "Urban Wear",
    sku: "UW-TS100",
    stock: "In Stock",
    isNew: true
  },
  {
    id: 11,
    name: "Travel Backpack Pro",
    description: "Water-resistant 30L backpack with laptop compartment, USB port, and anti-theft design.",
    category: "Accessories",
    price: 69.99,
    oldPrice: 109.99,
    discount: 36,
    rating: 4.7,
    reviews: 410,
    image: "https://images.pexels.com/photos/2416871/pexels-photo-2416871.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/31453948/pexels-photo-31453948.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/2416871/pexels-photo-2416871.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/31453948/pexels-photo-31453948.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "New",
    brand: "TravelPro",
    sku: "TP-BP200",
    stock: "In Stock",
    isNew: true
  },
  {
    id: 12,
    name: "Luxury Face Cream Set",
    description: "Complete skincare set with day cream, night cream, and eye serum. For all skin types.",
    category: "Beauty",
    price: 89.99,
    oldPrice: 129.99,
    discount: 31,
    rating: 4.8,
    reviews: 320,
    image: "https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail2: "https://images.pexels.com/photos/24602077/pexels-photo-24602077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail3: "https://images.pexels.com/photos/1776331/pexels-photo-1776331.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    thumbnail4: "https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    badge: "New",
    brand: "GlowLab",
    sku: "GL-FC300",
    stock: "In Stock",
    isNew: true
  }
];


/* ===== EXPANDED 50-PRODUCT CATALOG ===== */
(function expandCatalog() {
  const extraProducts = [
    ['4K Smart TV 55 Inch','Electronics',649.99,799.99,19,'VisionTech','VT-TV013','https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80'],
    ['Ultrabook Laptop 14','Electronics',899.99,1099.99,18,'NovaTech','NT-LP014','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'],
    ['Wireless Mechanical Keyboard','Electronics',79.99,109.99,27,'KeyForge','KF-KB015','https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'],
    ['Smart Fitness Watch','Electronics',119.99,159.99,25,'PulseOne','PO-WT016','https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
    ['Portable Bluetooth Speaker','Electronics',64.99,89.99,28,'SoundCore','SC-SP017','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80'],
    ['Gaming Mouse RGB','Electronics',39.99,59.99,33,'GameGrid','GG-MS018','https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80'],
    ['Denim Jacket Classic','Fashion',69.99,99.99,30,'Urban Wear','UW-DJ019','https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80'],
    ['Oversized Hoodie','Fashion',54.99,79.99,31,'StreetMode','SM-HD020','https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=80'],
    ['Classic Polo Shirt','Fashion',34.99,49.99,30,'Urban Wear','UW-PS021','https://images.unsplash.com/photo-1625910513413-5fc45c0f0e0d?auto=format&fit=crop&w=900&q=80'],
    ['Running Leggings','Fashion',44.99,64.99,31,'ActiveFit','AF-LG022','https://images.unsplash.com/photo-1506629905607-d9e7a0f6b6f4?auto=format&fit=crop&w=900&q=80'],
    ['Canvas Crossbody Bag','Accessories',39.99,59.99,33,'CarryCo','CC-BG023','https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80'],
    ['Minimalist Wallet','Accessories',29.99,44.99,33,'Urban Leather','UL-WL024','https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80'],
    ['Leather Belt Premium','Accessories',32.99,49.99,34,'Urban Leather','UL-BT025','https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=900&q=80'],
    ['Aviator Sunglasses','Accessories',49.99,74.99,33,'VisionLux','VL-SG026','https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80'],
    ['Classic Baseball Cap','Accessories',19.99,29.99,33,'StreetMode','SM-CAP027','https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80'],
    ['White Running Sneakers','Shoes',74.99,109.99,32,'StepUp','SU-SN028','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'],
    ['High Top Street Sneakers','Shoes',84.99,119.99,29,'StepUp','SU-SN029','https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=80'],
    ['Casual Slip-On Shoes','Shoes',59.99,89.99,33,'WalkEasy','WE-SN030','https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80'],
    ['Trail Hiking Shoes','Shoes',109.99,149.99,27,'TrailPro','TP-SN031','https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=900&q=80'],
    ['Modern Coffee Table','Home',189.99,249.99,24,'HomeStyle','HS-CT032','https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=900&q=80'],
    ['Soft Area Rug','Home',129.99,179.99,28,'HomeStyle','HS-RG033','https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=80'],
    ['Decorative Wall Mirror','Home',89.99,129.99,31,'CasaLine','CL-MR034','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80'],
    ['Ceramic Vase Set','Home',44.99,64.99,31,'CasaLine','CL-VS035','https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=80'],
    ['Cotton Bedding Set','Home',79.99,119.99,33,'HomeStyle','HS-BD036','https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80'],
    ['Hydrating Face Cream','Beauty',39.99,59.99,33,'GlowLab','GL-FC037','https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80'],
    ['Vitamin C Serum','Beauty',34.99,49.99,30,'GlowLab','GL-SR038','https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
    ['Daily Sunscreen SPF 50','Beauty',24.99,34.99,29,'SunCare','SC-SP039','https://images.unsplash.com/photo-1556229010-aa3d7d9f7f7a?auto=format&fit=crop&w=900&q=80'],
    ['Perfume Gift Set','Beauty',89.99,129.99,31,'Maison Luxe','ML-PF040','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'],
    ['Hair Care Essentials','Beauty',54.99,79.99,31,'GlowLab','GL-HC041','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80'],
    ['Smartphone Case Pro','Accessories',17.99,24.99,28,'CaseLab','CL-CS042','https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80'],
    ['Wireless Charging Pad','Electronics',29.99,44.99,33,'ChargeX','CX-WC043','https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=900&q=80'],
    ['Noise Isolating Earbuds','Electronics',69.99,99.99,30,'SoundWave','SW-EB044','https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80'],
    ['Mini Projector Full HD','Electronics',159.99,219.99,27,'VisionTech','VT-PJ045','https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80'],
    ['Travel Trolley Bag','Accessories',99.99,139.99,29,'CarryCo','CC-TB046','https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=900&q=80'],
    ['Premium Leather Boots','Shoes',119.99,169.99,29,'StepUp','SU-BT047','https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'],
    ['LED Floor Lamp','Home',99.99,149.99,33,'HomeStyle','HS-FL048','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'],
    ['Scented Candle Collection','Home',29.99,44.99,33,'CasaLine','CL-CD049','https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80'],
    ['Makeup Brush Collection','Beauty',32.99,49.99,34,'GlowLab','GL-MB050','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80']
  ];
  extraProducts.forEach(function(item) {
    const [name, category, price, oldPrice, discount, brand, sku, image] = item;
    PRODUCTS.push({
      id: PRODUCTS.length + 1,
      name, description: 'Premium ' + name.toLowerCase() + ' selected for everyday quality, comfort and style.',
      category, price, oldPrice, discount, rating: Number((4.2 + ((PRODUCTS.length + 1) % 8) * 0.1).toFixed(1)), reviews: 80 + (PRODUCTS.length + 1) * 17,
      image, thumbnail2: image, thumbnail3: image, thumbnail4: image, badge: discount >= 30 ? 'Sale' : 'New', brand, sku, stock: 'In Stock', isNew: (PRODUCTS.length + 1) % 3 === 0,
      specifications: { Brand: brand, Category: category, SKU: sku, Availability: 'In Stock', Material: 'Premium quality', Warranty: '1 Year' },
      tags: [category.toLowerCase(), brand.toLowerCase(), 'urban cart'],
      shipping: 'Delivery within 2-4 business days across Egypt.',
      returns: '14-day hassle-free returns in original condition.'
    });
  });
  PRODUCTS.forEach(function(product) {
    if (!product.specifications) product.specifications = { Brand: product.brand, Category: product.category, SKU: product.sku, Availability: product.stock, Warranty: '1 Year' };
    if (!product.tags) product.tags = [product.category.toLowerCase(), product.brand.toLowerCase()];
    if (!product.shipping) product.shipping = 'Delivery within 2-4 business days across Egypt.';
    if (!product.returns) product.returns = '14-day hassle-free returns in original condition.';
  });
})();

const CATEGORIES = [
  {
    name: "Fashion",
    description: "Trendy apparel & clothing",
    image: "https://images.pexels.com/photos/8743972/pexels-photo-8743972.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  },
  {
    name: "Electronics",
    description: "Latest tech & gadgets",
    image: "https://images.pexels.com/photos/4533076/pexels-photo-4533076.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  },
  {
    name: "Shoes",
    description: "Sneakers & footwear",
    image: "https://images.pexels.com/photos/33597709/pexels-photo-33597709.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  },
  {
    name: "Accessories",
    description: "Watches, bags & more",
    image: "https://images.pexels.com/photos/32677246/pexels-photo-32677246.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  },
  {
    name: "Home",
    description: "Decor & essentials",
    image: "https://images.pexels.com/photos/32269118/pexels-photo-32269118.png?auto=compress&cs=tinysrgb&h=650&w=940"
  },
  {
    name: "Beauty",
    description: "Skincare & cosmetics",
    image: "https://images.pexels.com/photos/36339062/pexels-photo-36339062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
  }
];

const REVIEWS = [
  {
    name: "Sarah Johnson",
    rating: 5,
    date: "2026-08-15",
    text: "Absolutely love this product! Exceeded my expectations. The quality is outstanding and delivery was super fast."
  },
  {
    name: "Michael Chen",
    rating: 5,
    date: "2026-08-10",
    text: "Best purchase I've made this year. Great value for money and the build quality is premium."
  },
  {
    name: "Emily Davis",
    rating: 4,
    date: "2026-07-28",
    text: "Really good product overall. Minor issues with packaging but the item itself is fantastic."
  },
  {
    name: "James Wilson",
    rating: 5,
    date: "2026-07-20",
    text: "Highly recommend! Works exactly as described. Urban Cart has become my go-to online store."
  },
  {
    name: "Lisa Anderson",
    rating: 4,
    date: "2026-07-05",
    text: "Very satisfied with my purchase. The product is well-made and looks even better in person."
  }
];

const RATING_DISTRIBUTION = {
  5: 68,
  4: 22,
  3: 7,
  2: 2,
  1: 1
};


function getProductFallback(product) {
  var category = String(product && product.category || '').toLowerCase();
  var map = {
    electronics: 'images/products/fallback-electronics.svg',
    fashion: 'images/products/fallback-fashion.svg',
    shoes: 'images/products/fallback-shoes.svg',
    accessories: 'images/products/fallback-accessories.svg',
    home: 'images/products/fallback-home.svg',
    beauty: 'images/products/fallback-beauty.svg'
  };
  return map[category] || 'images/products/fallback-home.svg';
}

/* Expose globally */
if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.getProductFallback = getProductFallback;
  window.CATEGORIES = CATEGORIES;
  window.REVIEWS = REVIEWS;
  window.RATING_DISTRIBUTION = RATING_DISTRIBUTION;
}
