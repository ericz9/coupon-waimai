import util from '../../../utils/util.js'
const app = getApp()

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    logoUrl: '', //LOGO地址
  },
  onLoad() {
    if (app.globalData.whoami) {
      this.setData({
        logoUrl: app.globalData.whoami.sysInfo.logoUrl,
        canIUseGetUserProfile: wx.getUserProfile
      })
    } else {
      app.launchCallback = () => {
        this.setData({
          logoUrl: app.globalData.whoami.sysInfo.logoUrl,
          canIUseGetUserProfile: wx.getUserProfile
        })
      }
    }
  },
  bindGetUserProfile(e) {
    util.login(true).then(() => {
      wx.navigateBack()
    })
  },
  bindGetUserInfo(e) {
    if (e.detail.userInfo) {
      util.login(true).then(() => {
        wx.navigateBack()
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '需要通过授权才能继续，请重新点击并授权。',
        showCancel: false
      })
    }
  }
})