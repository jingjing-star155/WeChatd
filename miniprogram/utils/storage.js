const KEYS = {
  accounts: 'rebate_accounts',
  groups: 'rebate_groups',
  products: 'rebate_products',
  tasks: 'rebate_send_tasks'
};

function read(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  wx.setStorageSync(key, value);
  return value;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

module.exports = {
  KEYS,
  read,
  write,
  createId
};
