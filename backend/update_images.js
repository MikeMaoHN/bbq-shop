const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database/bbq_shop.db');
const db = new Database(dbPath);

const imageMap = {
  '羊肉串': 'lamb-skewer',
  '牛肉串': 'beef-skewer',
  '五花肉': 'pork-belly',
  '鸡翅中': 'chicken-wing',
  '烤鱿鱼': 'squid',
  '基围虾': 'shrimp',
  '土豆片': 'potato',
  '韭菜': 'leek',
  '金针菇': 'mushroom',
  '牛肉丸': 'beef-ball',
  '亲亲肠': 'sausage',
  '烧烤酱': 'bbq-sauce',
  '孜然粉': 'spice',
  '可乐': 'coke',
  '啤酒': 'beer'
};

console.log('更新商品图片...');
let count = 0;

for (const [name, filename] of Object.entries(imageMap)) {
  const imageUrl = `/uploads/products/${filename}.jpg`;
  const images = JSON.stringify([imageUrl]);
  
  const stmt = db.prepare('UPDATE products SET images = ? WHERE name = ?');
  const result = stmt.run(images, name);
  
  if (result.changes > 0) {
    console.log(`✓ ${name}: ${imageUrl}`);
    count++;
  }
}

console.log(`\n完成！更新了 ${count} 个商品的图片`);
db.close();
