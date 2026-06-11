const { KEYS, read, write, createId } = require('../../utils/storage');
const { sampleProducts } = require('../../utils/mock-data');

Page({
  data: {
    accounts: [],
    groups: [],
    filteredGroups: [],
    products: [],
    selectedAccount: {},
    selectedGroup: {},
    selectedProducts: [],
    message: ''
  },

  onShow() {
    const accounts = read(KEYS.accounts, []);
    const groups = read(KEYS.groups, []);
    const products = read(KEYS.products, sampleProducts).filter((item) => item.score >= 60);
    this.setData({ accounts, groups, products });
    this.restoreSelection();
  },

  restoreSelection() {
    const selectedAccount = this.data.selectedAccount.id ? this.data.selectedAccount : (this.data.accounts[0] || {});
    const filteredGroups = selectedAccount.id
      ? this.data.groups.filter((group) => group.accountId === selectedAccount.id)
      : [];
    const selectedGroup = filteredGroups.find((group) => group.id === this.data.selectedGroup.id) || filteredGroups[0] || {};
    this.setData({ selectedAccount, filteredGroups, selectedGroup });
  },

  onAccountChange(event) {
    const selectedAccount = this.data.accounts[Number(event.detail.value)] || {};
    const filteredGroups = this.data.groups.filter((group) => group.accountId === selectedAccount.id);
    this.setData({
      selectedAccount,
      filteredGroups,
      selectedGroup: filteredGroups[0] || {}
    });
  },

  onGroupChange(event) {
    this.setData({
      selectedGroup: this.data.filteredGroups[Number(event.detail.value)] || {}
    });
  },

  onProductToggle(event) {
    const selectedIds = event.detail.value;
    const products = this.data.products.map((product) => ({
      ...product,
      checked: selectedIds.includes(product.id)
    }));
    const selectedProducts = products.filter((product) => product.checked);
    this.setData({
      products,
      selectedProducts,
      message: this.buildMessage(selectedProducts)
    });
  },

  buildMessage(products) {
    if (!products.length) return '';
    const lines = ['今日精选返利：'];
    products.forEach((product, index) => {
      lines.push(`${index + 1}. ${product.title}`);
      lines.push(`${product.url}`);
    });
    return lines.join('\n');
  },

  onMessageInput(event) {
    this.setData({ message: event.detail.value });
  },

  copyMessage() {
    if (!this.data.message.trim()) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.message,
      success: () => wx.showToast({ title: '已复制' })
    });
  },

  createTask() {
    if (!this.data.selectedAccount.id || !this.data.selectedGroup.id) {
      wx.showToast({ title: '请选择微信号和群', icon: 'none' });
      return;
    }
    if (!this.data.message.trim()) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    const tasks = read(KEYS.tasks, []);
    const task = {
      id: createId('task'),
      accountId: this.data.selectedAccount.id,
      accountName: this.data.selectedAccount.name,
      groupId: this.data.selectedGroup.id,
      groupName: this.data.selectedGroup.name,
      message: this.data.message,
      status: 'ready',
      createdAt: new Date().toISOString()
    };
    write(KEYS.tasks, [task, ...tasks]);
    wx.setClipboardData({
      data: this.data.message,
      success: () => {
        wx.showModal({
          title: '文案已复制',
          content: `请切换到微信，将内容发送到「${task.groupName}」。小程序不能直接控制微信群自动发消息。`,
          showCancel: false
        });
      }
    });
  },

  goProducts() {
    wx.switchTab({ url: '/pages/products/products' });
  }
});
