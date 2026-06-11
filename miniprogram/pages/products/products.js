const { KEYS, read, write } = require('../../utils/storage');
const { classifyProduct } = require('../../utils/classify');
const { sampleProducts } = require('../../utils/mock-data');

Page({
  data: {
    loading: false,
    products: [],
    visibleProducts: [],
    platforms: ['全部'],
    categories: ['全部'],
    platformFilter: '全部',
    categoryFilter: '全部'
  },

  onShow() {
    const products = read(KEYS.products, sampleProducts).map(classifyProduct);
    this.setProducts(products);
  },

  setProducts(products) {
    const platforms = ['全部', ...Array.from(new Set(products.map((item) => item.platform)))];
    const categories = ['全部', ...Array.from(new Set(products.map((item) => item.category)))];
    this.setData({ products, platforms, categories }, this.applyFilters);
  },

  applyFilters() {
    const visibleProducts = this.data.products.filter((product) => {
      const platformMatched = this.data.platformFilter === '全部' || product.platform === this.data.platformFilter;
      const categoryMatched = this.data.categoryFilter === '全部' || product.category === this.data.categoryFilter;
      return platformMatched && categoryMatched && product.score >= 50;
    });
    this.setData({ visibleProducts });
  },

  setPlatform(event) {
    this.setData({ platformFilter: event.currentTarget.dataset.value }, this.applyFilters);
  },

  setCategory(event) {
    this.setData({ categoryFilter: event.currentTarget.dataset.value }, this.applyFilters);
  },

  refreshProducts() {
    if (!wx.cloud) {
      wx.showToast({ title: '请启用云开发', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'fetchDeals',
      success: (res) => {
        const products = (res.result && res.result.products && res.result.products.length)
          ? res.result.products.map(classifyProduct)
          : sampleProducts;
        write(KEYS.products, products);
        this.setProducts(products);
        wx.showToast({ title: `已更新${products.length}条`, icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '抓取失败，保留本地数据', icon: 'none' });
      },
      complete: () => this.setData({ loading: false })
    });
  }
});
