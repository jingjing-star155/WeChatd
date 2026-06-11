const { KEYS, read, write, createId } = require('../../utils/storage');

Page({
  data: {
    accounts: [],
    accountsWithGroups: [],
    groups: [],
    accountName: '',
    groupName: '',
    groupAccount: {}
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const accounts = read(KEYS.accounts, []);
    const groups = read(KEYS.groups, []);
    const groupsByAccount = groups.reduce((map, group) => {
      if (!map[group.accountId]) map[group.accountId] = [];
      map[group.accountId].push(group);
      return map;
    }, {});
    const accountsWithGroups = accounts.map((account) => ({
      ...account,
      groups: groupsByAccount[account.id] || []
    }));
    const groupAccount = this.data.groupAccount.id
      ? this.data.groupAccount
      : accounts[0] || {};
    this.setData({ accounts, accountsWithGroups, groups, groupAccount });
  },

  onAccountName(event) {
    this.setData({ accountName: event.detail.value });
  },

  onGroupName(event) {
    this.setData({ groupName: event.detail.value });
  },

  onAccountPick(event) {
    this.setData({
      groupAccount: this.data.accounts[Number(event.detail.value)] || {}
    });
  },

  addAccount() {
    const name = this.data.accountName.trim();
    if (!name) {
      wx.showToast({ title: '请输入微信号名称', icon: 'none' });
      return;
    }
    const accounts = [
      { id: createId('account'), name, createdAt: new Date().toISOString() },
      ...this.data.accounts
    ];
    write(KEYS.accounts, accounts);
    this.setData({ accountName: '' }, this.loadData);
  },

  addGroup() {
    const name = this.data.groupName.trim();
    if (!name || !this.data.groupAccount.id) {
      wx.showToast({ title: '请选择微信号并输入群名', icon: 'none' });
      return;
    }
    const groups = [
      {
        id: createId('group'),
        accountId: this.data.groupAccount.id,
        name,
        createdAt: new Date().toISOString()
      },
      ...this.data.groups
    ];
    write(KEYS.groups, groups);
    this.setData({ groupName: '' }, this.loadData);
  },

  removeAccount(event) {
    const id = event.currentTarget.dataset.id;
    const accounts = this.data.accounts.filter((account) => account.id !== id);
    const groups = this.data.groups.filter((group) => group.accountId !== id);
    write(KEYS.accounts, accounts);
    write(KEYS.groups, groups);
    this.loadData();
  },

  removeGroup(event) {
    const id = event.currentTarget.dataset.id;
    const groups = this.data.groups.filter((group) => group.id !== id);
    write(KEYS.groups, groups);
    this.loadData();
  }
});
