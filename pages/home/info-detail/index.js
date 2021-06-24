const api = require("../../../utils/api")
const util = require("../../../utils/util")
const app = getApp()

Component({
  params: {}, // 查询参数
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    fileServerUrl: '', // 文件服务地址
    coupon: {}, // 优惠券信息
    // 倒计时数值
    msTime: {
      show: false, // 倒计时状态
      day: '', // 天
      hour: '', // 小时
      minutes: '', // 分钟
      seconds: '' // 秒
    },
    timer: null,
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
    // 初始化
    initialize() {
      return new Promise((resolve, reject) => {
        // 获取优惠券信息
        api.getCoupon(this.params.id).then((d) => {
          // 过期时间（时间戳）
          const expireTime = new Date(`${d.expireTime.replace(/-/g, '/')} 00:00:00`)
          d.expireTimestamp = expireTime.getTime()
          d.currentTimestamp = (new Date()).getTime()

          // 富文本图片宽度100%
          if (d.section1Content) {
            d.section1Content = d.section1Content.replace(/<img/gi, '<img style="max-width:100%"')
          }
          if (d.section2Content) {
            d.section2Content = d.section2Content.replace(/<img/gi, '<img style="max-width:100%"')
          }
          if (d.section3Content) {
            d.section3Content = d.section3Content.replace(/<img/gi, '<img style="max-width:100%"')
          }

          this.setData({
            loading: 'success',
            fileServerUrl: util.env().fileServerUrl,
            coupon: d
          })

          // 倒计时
          this.data.timer = setTimeout(() => {
            this.countDown(this.data.coupon.expireTimestamp, this.data.coupon.currentTimestamp)
          }, 1)

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
    // 倒计时
    countDown(startTime, endTime) {
      if (startTime < endTime) {
        return
      }

      let timeDistance = startTime - endTime
      this.data.msTime.day = Math.floor(timeDistance / 86400000)
      timeDistance -= this.data.msTime.day * 86400000
      this.data.msTime.hour = Math.floor(timeDistance / 3600000)
      timeDistance -= this.data.msTime.hour * 3600000
      this.data.msTime.minutes = Math.floor(timeDistance / 60000)
      timeDistance -= this.data.msTime.minutes * 60000
      this.data.msTime.seconds = Math.floor(timeDistance / 1000).toFixed(0)
      timeDistance -= this.data.msTime.seconds * 1000

      if (this.data.msTime.hour < 10) {
        this.data.msTime.hour = '0' + this.data.msTime.hour
      }
      if (this.data.msTime.minutes < 10) {
        this.data.msTime.minutes = '0' + this.data.msTime.minutes
      }
      if (this.data.msTime.seconds < 10) {
        this.data.msTime.seconds = '0' + this.data.msTime.seconds
      }
      this.data.msTime.show = true
      this.setData({
        msTime: this.data.msTime
      })

      const _s = Date.now()
      const _e = Date.now()
      const diffPerFunc = _e - _s
      this.data.timer = setTimeout(() => {
        this.countDown(this.data.coupon.expireTimestamp, this.data.coupon.currentTimestamp += 1000)
      }, 1000 - diffPerFunc)
    },
    // 复制内容
    setClipboardData(evt) {
      wx.setClipboardData({
        data: this.data.coupon[`section${evt.target.dataset.section}Content`],
        success(res) {
          wx.vibrateShort()
        }
      })
    }
  }
})
