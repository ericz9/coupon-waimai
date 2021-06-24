import api from '../../utils/api.js'
import store from '../../utils/store.js'
import util from '../../utils/util.js'
const app = getApp()

Component({
  currentCoupon: null, // 当前需要去领取的优惠券
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    fileServerUrl: '', // 文件服务地址
    coupons: [], // 所有的优惠券
    recommendMtCoupon: null, // 优先显示的美团优惠券
    recommendEleCoupon: null, // 优先显示的饿了么优惠券
    remainCoupons: [], // 除优先显示的美团、饿了么优惠券外，剩余的优惠券
    navigateToBinding: false, // 监听去绑定事件，返回时重新设置
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1
        })
      }
    }
  },
  methods: {
    onLoad() {
      if (app.globalData.whoami) {
        this.initialize()
      } else {
        app.launchCallback = () => {
          this.initialize()
        }
      }
    },
    onShow() {
      // 从去绑定页面返回时
      if (this.data.navigateToBinding) {
        // 重置标识
        this.data.navigateToBinding = false
        api.isBindTaobaoRelationId().then((d) => {
          if (d === '1') {
            app.globalData.whoami.user.isBindTaobaoRelationId = 1
            this.onGotoMini()
          }
        })
      }
    },
    // 初始化
    initialize() {
      this.data.coupons = store.getCoupons()
      this.data.coupons.forEach(coupon => {
        if (coupon.channel === 1 && !this.data.recommendMtCoupon) {
          this.data.recommendMtCoupon = coupon
        } else if (coupon.channel === 2 && !this.data.recommendEleCoupon) {
          this.data.recommendEleCoupon = coupon
        } else {
          this.data.remainCoupons.push(coupon)
        }
      })

      this.setData({
        fileServerUrl: util.env().fileServerUrl,
        recommendMtCoupon: this.data.recommendMtCoupon,
        recommendEleCoupon: this.data.recommendEleCoupon,
        remainCoupons: this.data.remainCoupons
      })
    },
    // 领取优惠券
    onGetCoupon(evt) {
      wx.vibrateShort()
      util.login().then(() => {
        this.currentCoupon = this.data.coupons.find(k => k.id === evt.target.id)
        if (this.currentCoupon) {
          // 领取饿了么时，如果用户未授权，则直接跳转到授权页
          if (this.currentCoupon.channel === 2 && 
            this.currentCoupon.activityId > 0 && 
            app.globalData.whoami.user.isBindTaobaoRelationId === 0) {
            wx.showModal({
              title: '申请授权',
              content: '应淘宝要求，获取返佣前请先进行官方授权。',
              confirmText: '去授权',
              confirmColor: '#f85812',
              success: (res) => {
                if (res.confirm) {
                  this.data.navigateToBinding = true
      
                  if (app.globalData.whoami.version === 2) {
                    wx.navigateTo({ url: '/pages/_shared/auth-taobao/index' })
                  } else {
                    const siteUrl = util.env().apiUrl.split('/api/')[0]
                    const url = `${siteUrl}/index.html#/pages/auth/taobao?companyId=${app.globalData.whoami.companyId}&userId=${app.globalData.whoami.user.id}`
                    wx.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(url)}` })
                  }
                }
              }
            })
          } else {
            this.onGotoMini()
          }
        }
      })
    },
    // 跳转小程序领取优惠券
    onGotoMini() {
      // 刷新内容，使用自己的推广链接领券
      api.getContent(this.currentCoupon.id).then((d) => {
        wx.navigateToMiniProgram({
          appId: app.globalData.whoami.sysInfo[`navAppId${d.channel}`],
          path: d.miniUrl,
          success(res) {
            // 打开成功
          }
        })
      })
    },
  }
})
