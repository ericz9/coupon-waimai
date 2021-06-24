const api = require("../../../utils/api")
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    sysInfo: {}, // 系统配置项
    wallet: {}, // 用户钱包
    needDrawMoney: '', // 需提现金额
    submiting: false, // 是否正在提交表单
  },
  methods: {
    onShow() {
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
      return new Promise((resolve, reject) => {
        // 获取用户钱包
        api.getUserWallet().then((d) => {
          this.setData({
            loading: 'success',
            wallet: d,
            sysInfo: app.globalData.whoami.sysInfo
          })
          
          resolve()
        }).catch((err) => {
          this.setData({
            loading: 'fail'
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
    // 个人设置
    onGotoInfo() {
      const wxAccount = encodeURIComponent(this.data.wallet.wxAccount)
      const aliAccount = encodeURIComponent(this.data.wallet.aliAccount)
      wx.navigateTo({
        url: `/pages/mine/info/index?wxaccount=${wxAccount}&aliaccount=${aliAccount}`
      })
    },
    // 输入提现金额
    onInputMoney(evt) {
      this.setData({
        needDrawMoney: evt.detail.value
      })
    },
    // 提交表单
    onSubmit() {
      this.setData({
        submiting: true
      })

      api.userDraw(this.data.needDrawMoney, {
        showToast: true
      }).then(() => {
        this.setData({
          submiting: false
        })

        wx.showModal({
          title: '提示',
          content: '提现申请成功，请留意实际到账情况。',
          showCancel: false,
          complete: () => {
            this.initialize()
            this.setData({
              needDrawMoney: ''
            })
          }
        })
      }).catch(() => {
        this.setData({
          submiting: false
        })
      })
    }
  }
})
