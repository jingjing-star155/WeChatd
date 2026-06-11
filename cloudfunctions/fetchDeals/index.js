const cloud = require('wx-server-sdk');
const https = require('https');
const http = require('http');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const SOURCE_URL = 'http://www.msmds.com.cn/about-us.html';

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

function request(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(request(res.headers.location));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function decodeHtml(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(text) {
  return decodeHtml(String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function pickByRules(text, rules, fallback) {
  const normalized = String(text || '').toLowerCase();
  const hit = rules.find((rule) => rule.words.some((word) => normalized.includes(word.toLowerCase())));
  return hit ? hit.name : fallback;
}

function scoreProduct(product) {
  let score = 50;
  if (product.platform !== '其他') score += 20;
  if (product.category !== '其他') score += 15;
  if (/coupon|rebate|返利|优惠|券|佣金/i.test(`${product.title} ${product.url}`)) score += 15;
  return Math.min(score, 100);
}

function parseProducts(html) {
  const products = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const url = decodeHtml(match[1]);
    const title = stripTags(match[2]) || url;
    const text = `${title} ${url}`;
    if (!/^https?:\/\//i.test(url)) continue;
    if (!/(taobao|tmall|jd\.com|jingdong|pinduoduo|yangkeduo|douyin|vip\.com|返利|优惠|券|rebate|coupon)/i.test(text)) continue;
    const product = {
      id: `deal_${Buffer.from(url).toString('base64').slice(0, 18).replace(/[+/=]/g, '')}`,
      title,
      url,
      category: pickByRules(text, categoryRules, '其他'),
      platform: pickByRules(text, platformRules, '其他'),
      source: SOURCE_URL,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    product.score = scoreProduct(product);
    products.push(product);
  }
  const unique = new Map(products.map((product) => [product.url, product]));
  return Array.from(unique.values()).sort((a, b) => b.score - a.score);
}

exports.main = async () => {
  const html = await request(SOURCE_URL);
  const products = parseProducts(html);
  return {
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    products
  };
};
