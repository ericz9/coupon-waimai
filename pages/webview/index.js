const app = getApp()

Page({
  data: {
    url: ''
  },
  onLoad(params) {
    this.setData({
      url: decodeURIComponent(params.url)
    })
  }
})