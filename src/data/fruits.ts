export interface BloxFruit {
  name: string;
  thaiName: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Mythical';
  type: 'Natural' | 'Elemental' | 'Beast';
  beliPrice: number;
  robuxPrice: number;
  image: string;
  awakening?: boolean;
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
  description: string;
}

export const FRUITS_DATABASE: Record<string, BloxFruit> = {
  // --- Common ---
  Rocket: {
    name: 'Rocket',
    thaiName: 'ผลจรวด',
    rarity: 'Common',
    type: 'Natural',
    beliPrice: 5000,
    robuxPrice: 50,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/d4/Rocket_Fruit.png/revision/latest',
    tier: 'D',
    description: 'ผลระเบิดจรวด ยิงจรวดสร้างดาเมจระเบิด เหมาะสำหรับผู้เล่นเริ่มต้น (มีขายตลอดกาล)'
  },
  Spin: {
    name: 'Spin',
    thaiName: 'ผลคอปเตอร์',
    rarity: 'Common',
    type: 'Natural',
    beliPrice: 7500,
    robuxPrice: 75,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e0/Spin_Fruit.png/revision/latest',
    tier: 'D',
    description: 'หมุนตัวบินและโจมตีเหมือนใบพัดคอปเตอร์ (มีขายตลอดกาล)'
  },
  Blade: {
    name: 'Blade',
    thaiName: 'ผลแยกส่วน (Chop)',
    rarity: 'Common',
    type: 'Natural',
    beliPrice: 30000,
    robuxPrice: 100,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/1/15/Chop_Fruit.png/revision/latest',
    tier: 'C',
    description: 'ภูมิคุ้มกันการโจมตีด้วยดาบทุกชนิด (Sword Immunity) ฟาร์มช่วงแรกดีมาก'
  },
  Spring: {
    name: 'Spring',
    thaiName: 'ผลสปริง',
    rarity: 'Common',
    type: 'Natural',
    beliPrice: 60000,
    robuxPrice: 180,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a2/Spring_Fruit.png/revision/latest',
    tier: 'D',
    description: 'กระโดดเด้งดึ๋ง พุ่งเข้าใส่ศัตรูด้วยสปริง'
  },
  Bomb: {
    name: 'Bomb',
    thaiName: 'ผลระเบิด',
    rarity: 'Common',
    type: 'Natural',
    beliPrice: 80000,
    robuxPrice: 220,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6a/Bomb_Fruit.png/revision/latest',
    tier: 'C',
    description: 'ปล่อยพลังระเบิดรุนแรงรอบตัว มีท่าระเบิดตัวเองขนาดใหญ่'
  },
  Smoke: {
    name: 'Smoke',
    thaiName: 'ผลควัน',
    rarity: 'Common',
    type: 'Elemental',
    beliPrice: 100000,
    robuxPrice: 250,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/b/b3/Smoke_Fruit.png/revision/latest',
    tier: 'B',
    description: 'ผลสายโรเกีย (Elemental) บินได้ ศัตรูธรรมดาตีไม่เข้า ราคาถูก'
  },

  // --- Uncommon ---
  Spike: {
    name: 'Spike',
    thaiName: 'ผลหนาม',
    rarity: 'Uncommon',
    type: 'Natural',
    beliPrice: 180000,
    robuxPrice: 380,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/1/16/Spike_Fruit.png/revision/latest',
    tier: 'C',
    description: 'ปล่อยหนามแทงรอบทิศทาง กลิ้งเป็นลูกบอลหนาม'
  },
  Flame: {
    name: 'Flame',
    thaiName: 'ผลไฟ',
    rarity: 'Uncommon',
    type: 'Elemental',
    beliPrice: 250000,
    robuxPrice: 550,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/90/Flame_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'ผลสายไฟ มีร่างตื่น (Awakening) ดาเมจเผาไหม้และ AoE ดีมาก'
  },
  Eagle: {
    name: 'Eagle',
    thaiName: 'ผลนกอินทรี (Falcon)',
    rarity: 'Uncommon',
    type: 'Beast',
    beliPrice: 300000,
    robuxPrice: 650,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/5/52/Falcon_Fruit.png/revision/latest',
    tier: 'C',
    description: 'แปลงร่างเป็นนกอินทรี บินเร็ว ปล่อยขนนกโจมตี'
  },
  Ice: {
    name: 'Ice',
    thaiName: 'ผลน้ำแข็ง',
    rarity: 'Uncommon',
    type: 'Elemental',
    beliPrice: 350000,
    robuxPrice: 750,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/7/7b/Ice_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'แช่แข็งศัตรูได้ เดินบนผิวน้ำได้ มีร่างตื่น ทะเลาะ PvP คอมโบโหด'
  },
  Sand: {
    name: 'Sand',
    thaiName: 'ผลทราย',
    rarity: 'Uncommon',
    type: 'Elemental',
    beliPrice: 420000,
    robuxPrice: 850,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/8/87/Sand_Fruit.png/revision/latest',
    awakening: true,
    tier: 'B',
    description: 'ผลทรายสายโรเกีย ดูดพลังศัตรูและสร้างพายุทราย มีร่างตื่น'
  },
  Dark: {
    name: 'Dark',
    thaiName: 'ผลมืด',
    rarity: 'Uncommon',
    type: 'Elemental',
    beliPrice: 500000,
    robuxPrice: 950,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/2/29/Dark_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'ดูดศัตรูเข้ามาสตั้น ยอดนิยมในการเล่นสายดาบ PvP มีร่างตื่น'
  },
  Diamond: {
    name: 'Diamond',
    thaiName: 'ผลเพชร',
    rarity: 'Uncommon',
    type: 'Natural',
    beliPrice: 600000,
    robuxPrice: 1000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a2/Diamond_Fruit.png/revision/latest',
    tier: 'B',
    description: 'เพิ่มเกราะป้องกันมหาศาล ส่องแสงทำให้ศัตรูตาพร่า'
  },

  // --- Rare ---
  Light: {
    name: 'Light',
    thaiName: 'ผลแสง',
    rarity: 'Rare',
    type: 'Elemental',
    beliPrice: 650000,
    robuxPrice: 1100,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/63/Light_Fruit.png/revision/latest',
    awakening: true,
    tier: 'S',
    description: 'ผลบินเร็วที่สุดในเกม ฟาร์มโลก 1 และโลก 2 ดีเลิศ ดาเมจสูง มีดาบแสง'
  },
  Rubber: {
    name: 'Rubber',
    thaiName: 'ผลยาง',
    rarity: 'Rare',
    type: 'Natural',
    beliPrice: 750000,
    robuxPrice: 1200,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/ef/Rubber_Fruit.png/revision/latest',
    tier: 'B',
    description: 'ยืดแขนขา ภูมิคุ้มกันผลสายฟ้า (Rumble) มีเกียร์ 2 พุ่งไว'
  },
  Ghost: {
    name: 'Ghost',
    thaiName: 'ผลโกสต์ (ผี)',
    rarity: 'Rare',
    type: 'Natural',
    beliPrice: 940000,
    robuxPrice: 1275,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9c/Ghost_Fruit.png/revision/latest',
    tier: 'B',
    description: 'เรียกร่างวิญญาณมาช่วยต่อสู้ และชุบชีวิตตัวเองได้ 1 ครั้งเมื่อตาย'
  },
  Magma: {
    name: 'Magma',
    thaiName: 'ผลแม็กม่า',
    rarity: 'Rare',
    type: 'Elemental',
    beliPrice: 850000,
    robuxPrice: 1300,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6f/Magma_Fruit.png/revision/latest',
    awakening: true,
    tier: 'S+',
    description: 'ดาเมจต่อวินาที (DPS) สูงที่สุดในเกม ยอดนิยมอันดับ 1 ในการล่า Sea Beast'
  },

  // --- Legendary ---
  Quake: {
    name: 'Quake',
    thaiName: 'ผลสั่นสะเทือน',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 1000000,
    robuxPrice: 1500,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/1/14/Quake_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'ทุบมิติสร้างคลื่นสึนามิและแผ่นดินไหวขนาดใหญ่ มีร่างตื่น'
  },
  Buddha: {
    name: 'Buddha',
    thaiName: 'ผลพระ',
    rarity: 'Legendary',
    type: 'Beast',
    beliPrice: 1200000,
    robuxPrice: 1650,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/df/Buddha_Fruit.png/revision/latest',
    awakening: true,
    tier: 'S+',
    description: 'ราชาแห่งการฟาร์มเลเวล ขยายร่างยักษ์ ตีระยะไกลและลดดาเมจที่ได้รับ 50%'
  },
  Love: {
    name: 'Love',
    thaiName: 'ผลความรัก',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 1300000,
    robuxPrice: 1700,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/8/8d/Love_Fruit.png/revision/latest',
    tier: 'A',
    description: 'ขี่ฟลามิงโก้บิน ขว้างหัวใจ และเสกเพื่อน NPC มาช่วยสู้'
  },
  Spider: {
    name: 'Spider',
    thaiName: 'ผลใยแมงมุม',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 1500000,
    robuxPrice: 1800,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/d/dc/Spider_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'ปล่อยใยแมงมุมดักจับและฟันศัตรู ร่างตื่นสามารถเดินบนอากาศได้'
  },
  Sound: {
    name: 'Sound',
    thaiName: 'ผลเสียง',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 1700000,
    robuxPrice: 1900,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/91/Sound_Fruit.png/revision/latest',
    tier: 'A',
    description: 'สร้างคลื่นเสียงจังหวะดนตรี บัฟความเร็วและเกราะให้เพื่อนร่วมทีม'
  },
  Phoenix: {
    name: 'Phoenix',
    thaiName: 'ผลฟีนิกซ์',
    rarity: 'Legendary',
    type: 'Beast',
    beliPrice: 1800000,
    robuxPrice: 2000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c8/Phoenix_Fruit.png/revision/latest',
    awakening: true,
    tier: 'A',
    description: 'แปลงร่างเป็นนกฟีนิกซ์สีฟ้า บินได้และฮีลเลือดตัวเองกับเพื่อน'
  },
  Portal: {
    name: 'Portal',
    thaiName: 'ผลประตู',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 1900000,
    robuxPrice: 2000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e7/Portal_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'วาร์ปไปทุกเกาะในเกมได้ทันที ยอดนิยมอันดับ 1 ในการเดินทางและ PvP'
  },
  Lightning: {
    name: 'Lightning',
    thaiName: 'ผลสายฟ้า (Rumble)',
    rarity: 'Legendary',
    type: 'Elemental',
    beliPrice: 2100000,
    robuxPrice: 2100,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6b/Rumble_Fruit.png/revision/latest',
    awakening: true,
    tier: 'S',
    description: 'สตั้นศัตรูอย่างรุนแรง เสาสายฟ้าผ่า มีร่างตื่น PvP คอมโบนิยมสูงสุด'
  },
  Pain: {
    name: 'Pain',
    thaiName: 'ผลความเจ็บปวด (Paw)',
    rarity: 'Legendary',
    type: 'Natural',
    beliPrice: 2300000,
    robuxPrice: 2200,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/5/52/Pain_Fruit.png/revision/latest',
    tier: 'B',
    description: 'ยิงอุ้งเท้ากระแทกมิติ ดาเมจระยะไกลรวดเร็ว'
  },
  Blizzard: {
    name: 'Blizzard',
    thaiName: 'ผลพายุหิมะ',
    rarity: 'Legendary',
    type: 'Elemental',
    beliPrice: 2400000,
    robuxPrice: 2250,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/b/b3/Blizzard_Fruit.png/revision/latest',
    tier: 'S',
    description: 'สร้างพายุหิมะรอบตัวต่อเนื่อง ดาเมจ AoE โหดมากสำหรับการฟาร์มและสู้บอส'
  },

  // --- Mythical ---
  Gravity: {
    name: 'Gravity',
    thaiName: 'ผลแรงโน้มถ่วง',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 2500000,
    robuxPrice: 2300,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/2/2f/Gravity_Fruit.png/revision/latest',
    tier: 'B',
    description: 'ดึงดูดอุกกาบาตลงมาถล่มพื้น เพิ่มและลดแรงโน้มถ่วง'
  },
  Mammoth: {
    name: 'Mammoth',
    thaiName: 'ผลแมมมอธ',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 2700000,
    robuxPrice: 2350,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/3/36/Mammoth_Fruit.png/revision/latest',
    tier: 'S',
    description: 'แปลงร่างเป็นช้างแมมมอธโบราณ วิ่งชนต่อเนื่องและเพิ่มเกราะป้องกัน'
  },
  'T-Rex': {
    name: 'T-Rex',
    thaiName: 'ผลทีเร็กซ์',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 2700000,
    robuxPrice: 2350,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/91/T-Rex_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'แปลงร่างเป็นไดโนเสาร์ทีเร็กซ์ มีระบบ Rage Bar และคำรามสร้างดาเมจ'
  },
  Dough: {
    name: 'Dough',
    thaiName: 'ผลโมจิ',
    rarity: 'Mythical',
    type: 'Elemental',
    beliPrice: 2800000,
    robuxPrice: 2400,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/6f/Dough_Fruit.png/revision/latest',
    awakening: true,
    tier: 'S+',
    description: 'ผลโมจิ ร่างตื่นคือที่สุดของคอมโบ PvP สตั้นดึงคู่ต่อสู้ไม่ให้ขยับ'
  },
  Shadow: {
    name: 'Shadow',
    thaiName: 'ผลเงา',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 2900000,
    robuxPrice: 2425,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c2/Shadow_Fruit.png/revision/latest',
    tier: 'A',
    description: 'ดูดซับเกจ Umbra เพื่อปล่อยค้างคาวเงาและระเบิดพลังดูดเลือด'
  },
  Venom: {
    name: 'Venom',
    thaiName: 'ผลพิษ',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 3000000,
    robuxPrice: 2450,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c5/Venom_Fruit.png/revision/latest',
    tier: 'S',
    description: 'แปลงร่างเป็นมังกรพิษ 3 หัว ดาเมจพิษกัดกร่อนศัตรูต่อเนื่องรุนแรง'
  },
  Control: {
    name: 'Control',
    thaiName: 'ผลคอนโทรล',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 3200000,
    robuxPrice: 2500,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/0/07/Control_Fruit.png/revision/latest',
    tier: 'A',
    description: 'กางอาณาเขต Room ยกอาคารและหินขว้างใส่ศัตรู เทเลพอร์ตและสลับที่'
  },
  Gas: {
    name: 'Gas',
    thaiName: 'ผลแก๊ส',
    rarity: 'Mythical',
    type: 'Elemental',
    beliPrice: 3400000,
    robuxPrice: 2500,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/3/30/Gas_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'ผลแก๊สพิษ ปล่อยหมอกแก๊สระเบิดและเผาผลาญศัตรูวงกว้าง'
  },
  Spirit: {
    name: 'Spirit',
    thaiName: 'ผลวิญญาณ',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 3400000,
    robuxPrice: 2550,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/0/0a/Spirit_Fruit.png/revision/latest',
    tier: 'S',
    description: 'ควบคุมภูตไฟและภูตน้ำแข็ง ปล่อยวิญญาณไล่ตามโจมตี'
  },
  Leopard: {
    name: 'Leopard',
    thaiName: 'ผลเสือดาว (ลีโอพาร์ด)',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 5000000,
    robuxPrice: 3000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9e/Leopard_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'แปลงร่างเป็นเสือดาวมนุษย์ ความเร็วและการโจมตีต่อเนื่องมหาศาล'
  },
  Yeti: {
    name: 'Yeti',
    thaiName: 'ผลเยติ',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 6000000,
    robuxPrice: 3500,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9b/Yeti_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'แปลงร่างเป็นอสูรหิมะเยติ พลังทำลายล้างเยือกแข็งและ AoE มหาศาล'
  },
  Kitsune: {
    name: 'Kitsune',
    thaiName: 'ผลจิ้งจอกเก้าหาง (คิทสึเนะ)',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 8000000,
    robuxPrice: 4000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e9/Kitsune_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'ผลสัตว์ในตำนานจิ้งจอก 9 หาง วิ่งบนน้ำเร็วที่สุด แปลงร่างแล้วพลังไร้เทียมทาน'
  },
  Dragon: {
    name: 'Dragon',
    thaiName: 'ผลมังกร (Dragon)',
    rarity: 'Mythical',
    type: 'Beast',
    beliPrice: 10000000,
    robuxPrice: 5000,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/3/3a/Dragon_Fruit.png/revision/latest',
    tier: 'S+',
    description: 'ผลมังกรในตำนาน รูปลักษณ์อัปเดตใหม่ ทรงพลังและอลังการที่สุดในโลกวันพีซ'
  },
  Creation: {
    name: 'Creation',
    thaiName: 'ผลการสร้าง',
    rarity: 'Mythical',
    type: 'Natural',
    beliPrice: 3800000,
    robuxPrice: 2600,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/2/29/Dark_Fruit.png/revision/latest',
    tier: 'S',
    description: 'ผลแห่งการสรรสร้าง ปล่อยพลังเนรมิตการโจมตีอันหลากหลาย'
  }
};

export const RARITY_COLORS: Record<BloxFruit['rarity'], { text: string; bg: string; border: string; hex: number; hexStr: string }> = {
  Common: { text: 'text-zinc-300', bg: 'bg-zinc-800/80', border: 'border-zinc-700', hex: 0x95a5a6, hexStr: '#95a5a6' },
  Uncommon: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-700/60', hex: 0x2ecc71, hexStr: '#2ecc71' },
  Rare: { text: 'text-sky-400', bg: 'bg-sky-950/40', border: 'border-sky-700/60', hex: 0x3498db, hexStr: '#3498db' },
  Legendary: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-700/60', hex: 0x9b59b6, hexStr: '#9b59b6' },
  Mythical: { text: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-700/60', hex: 0xe74c3c, hexStr: '#e74c3c' },
};
