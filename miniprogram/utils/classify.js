const categoryRules = [
  { name: '食品饮料', words: ['食品', '零食', '饮料', '牛奶', '茶', '酒', '粮油', '生鲜'] },
  { name: '美妆个护', words: ['美妆', '护肤', '洗面奶', '面膜', '口红', '香水', '个护'] },
  { name: '母婴玩具', words: ['母婴', '奶粉', '纸尿裤', '玩具', '童装'] },
  { name: '服饰鞋包', words: ['服饰', '女装', '男装', '鞋', '包', '内衣'] },
  { name: '数码家电', words: ['数码', '手机', '电脑', '电器', '家电', '耳机'] },
  { name: '家清日用', words: ['家清', '清洁', '洗护', '纸巾', '日用', '收纳'] }
];

const platformRules = [
  { name: '淘宝', words: ['taobao', 'tmall', '淘宝', '天猫'] },
  { name: '京东', words: ['jd.com', 'jingdong', '京东'] },
  { name: '拼多多', words: ['pinduoduo', 'yangkeduo', '拼多多'] },
  { name: '抖音', words: ['douyin', 'iesdouyin', '抖音'] },
  { name: '唯品会', words: ['vip.com', '唯品会'] }
];

function pickByRules(text, rules, fallback) {
  const normalized = String(text || '').toLowerCase();
  const hit = rules.find((rule) => rule.words.some((word) => normalized.includes(word.toLowerCase())));
  return hit ? hit.name : fallback;
}

function classifyProduct(product) {
  const text = `${product.title || ''} ${product.url || ''}`;
  return {
    ...product,
    category: product.category || pickByRules(text, categoryRules, '其他'),
    platform: product.platform || pickByRules(text, platformRules, '其他')
  };
}

module.exports = {
  categoryRules,
  platformRules,
  classifyProduct
};
