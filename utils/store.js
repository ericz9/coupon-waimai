// 获取外卖优惠券列表
const getCoupons = () => {
  const coupons = wx.getStorageSync('coupons')
  return coupons || []
}

// 设置外卖优惠券列表
const setCoupons = (coupons, callback) => {
  // 执行业务回调函数
  if (callback) {
    try {
      callback()
      // 执行成功则设置本地缓存
      wx.setStorageSync('coupons', coupons)
    } catch(ex) {
      console.error(ex)
      throw ex
    }
  } else {
    // 直接设置
    wx.setStorageSync('coupons', coupons)
  }
}

//获取历史搜索关键词
const getKw = () => {
  const kw = wx.getStorageSync('kw')
  return kw || []
}

//设置历史搜索关键词
const setKw = (kws, callback) => {
  //执行业务回调函数
  if (callback) {
    try {
      callback()
      //执行成功则设置本地缓存
      wx.setStorageSync('kw', kws)
    } catch(ex) {
      console.error(ex)
      throw ex
    }
  } else {
    //直接设置
    wx.setStorageSync('kw', kws)
  }
}

//清空历史搜索关键词
const clearKw = (callback) => {
  //执行业务回调函数
  if (callback) {
    try {
      callback()
      //执行成功则清除本地缓存
      wx.removeStorageSync('kw')
    } catch(ex) {
      console.error(ex)
      throw ex
    }
  } else {
    //直接清除
    wx.removeStorageSync('kw')
  }
}

module.exports = {
  // 外卖优惠券列表
  getCoupons: getCoupons,
  setCoupons: setCoupons,
  //历史搜索关键词
  getKw: getKw,
  setKw: setKw,
  clearKw: clearKw,
}
