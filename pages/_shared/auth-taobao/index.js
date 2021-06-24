import api from '../../../utils/api'
const app = getApp()

Page({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    tkl: {}, // 淘口令
  },
  onLoad() {
    if (app.globalData.whoami) {
      this.initialize()
    } else {
      app.launchCallback = () => {
        this.initialize()
      }
    }
  },
  // 初始化
  initialize() {
    return new Promise((resolve, reject) => {
      // 生成备案淘口令
      api.createPublisherTkl({
        companyId: app.globalData.whoami.companyId,
        id: app.globalData.whoami.user.id
      }).then((d) => {
        this.setData({
          loading: 'success',
          tkl: d
        })
        resolve()
      }).catch((err) => {
        this.setData({
          loading: 'fail',
        })
        reject(err)
      })
    })
  },
  // 初始化失败时重新加载
  reInitialize() {
    this.setData({
      loadingRetry: true
    })
    this.initialize().catch(() => {
      // 重新加载时再次失败，重置标识
      this.setData({
        loadingRetry: false
      })
    })
  },
  // 复制淘口令
  onCopyTkl(evt) {
    wx.setClipboardData({
      data: evt.currentTarget.dataset.tkl,
      success(res) {
        wx.showToast({
          title: '口令已复制，打开【Táo宝】进行官方授权。',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },
  // 提交表单
  onSubmit() {
    // 更新用户淘宝渠道ID
    api.updateUserTaobaoRelationId({
      companyId: app.globalData.whoami.companyId,
      id: app.globalData.whoami.user.id
    }).then(() => {
      wx.showToast({
        title: '绑定成功，现在下单即可享受返现。',
        icon: 'none'
      })
    })
  }
})