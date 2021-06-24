const app = getApp();
Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: {
      type: String,
      default: ''
    }, 
    isCustom: {
      type: [Boolean, String],
      default: false
    },
    isBack: {
      type: [Boolean, String],
      default: false
    },
    isHomePage: {
      type: [Boolean, String],
      default: false
    },
    logoUrl: {
      type: [Boolean, String],
      default: false
    },
    isShare: {
      type: [Boolean, String],
      default: false
    },
    isSearchGuide: {
      type: [Boolean, String],
      default: false
    },
    isSearch: {
      type: [Boolean, String],
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    statusBar: app.globalData.statusBar,
    customBar: app.globalData.customBar,
    custom: app.globalData.custom,
    searchText: ''
  },
  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      })
    },
    toHome(){
      wx.reLaunch({
        url: '/pages/home/index',
      })
    },
    // 搜索内容输入
    onSearchTextInput(evt) {
      this.setData({
        searchText: evt.detail.value
      })
    },
    handleSearchEvent(){
      this.triggerEvent('searchevent', this.data.searchText)
    },
    handleRemoveSearchTextEvent(){
      this.setData({
        searchText: ''
      })
      this.triggerEvent('searchremoveevent')
    }
  }
})