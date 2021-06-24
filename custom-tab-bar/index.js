Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#333333",
    list: [
      {
        "pagePath": "/pages/home/index",
        "iconPath": "/assets/images/tabbar-home.png",
        "selectedIconPath": "/assets/images/tabbar-home-active.png",
        "text": "首页"
      },
      {
        "pagePath": "/pages/waimai/index",
        "iconPath": "/assets/images/tabbar-waimai.png",
        "selectedIconPath": "/assets/images/tabbar-waimai-active.png",
        "text": "外卖"
      },
      {
        "pagePath": "/pages/taoke/index",
        "iconPath": "/assets/images/tabbar-taoke.png",
        "selectedIconPath": "/assets/images/tabbar-taoke-active.png",
        "text": "购物"
      },
      {
        "pagePath": "/pages/mine/index",
        "iconPath": "/assets/images/mine-dynamic.gif",
        "selectedIconPath": "/assets/images/mine-dynamic.gif",
        "text": "我的"
      }
    ]
  },
  methods: {
    switchTab(e) {
      wx.vibrateShort()
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url})
      this.setData({
        selected: data.index
      })
    }
  }
})