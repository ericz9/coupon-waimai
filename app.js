// const ald = require('./utils/ald-stat.js')

App({
  onLaunch: function() {
    // 用于自定义导航
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.statusBar = systemInfo.statusBarHeight
    const custom = wx.getMenuButtonBoundingClientRect()
    this.globalData.custom = custom
    this.globalData.customBar = custom.bottom + custom.top - systemInfo.statusBarHeight + 4

    this.globalData.share = {
      shareTitle: '美团、饿了么，单单帮你省',
      shareUrl: '',
      shareImageUrl: `${this.globalData.fileServerUrl}/waimai/upload/images/2021/1/7af146ac01c4934e.png`
    }
  },
  globalData: {
    fileServerUrl: 'https://mdn.duomai88.com',
    share: {}
  }
})
