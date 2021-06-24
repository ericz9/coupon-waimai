const api = require("../../../utils/api")
const app = getApp()

Component({
  params: {}, //查询参数
  data: {
    user: {}, // 用户信息
  },
  methods: {
    onLoad(params) {
      this.params = params
      if (app.globalData.whoami) {
        this.initialize()
      } else {
        app.launchCallback = () => {
          this.initialize()
        }
      }
    },
    //初始化
    initialize() {
      const user = {
        nickName: app.globalData.whoami.user.nickName,
        headImg: app.globalData.whoami.user.headImg,
        aliAccount: this.params.aliaccount ? decodeURIComponent(this.params.aliaccount) : '',
        wxAccount: this.params.wxaccount ? decodeURIComponent(this.params.wxaccount) : ''
      }

      this.setData({
        user: user
      })
    },
    // 输入微信号
    onInputWxAccount(evt) {
      this.setData({
        'user.wxAccount': evt.detail.value
      })
    },
    // 输入支付宝账户
    onInputAliAccount(evt) {
      this.setData({
        'user.aliAccount': evt.detail.value
      })
    },
    // 提交表单
    onSubmit() {
      api.updateUserInfo({
        account: this.data.user.aliAccount,
        wxAccount: this.data.user.wxAccount
      }, {
        showToast: true
      }).then(() => {
        wx.showToast({
          title: '保存成功。',
          icon: 'none'
        })
        
        // 数组中第一个元素为首页，最后一个元素为当前页面
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        if (prevPage.route === 'pages/mine/index') {
          // 重新加载
          prevPage.initialize()
        }
      })
    }
  }
})
