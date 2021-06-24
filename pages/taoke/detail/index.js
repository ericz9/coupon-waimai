import api from '../../../utils/api.js'
import util from '../../../utils/util.js'
const app = getApp()

Component({
  params: {}, // 查询参数
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    // notfound 未找到商品
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    fileServerUrl: '', // 文件服务地址
    goods: {}, // 商品信息
    link: null, // 立即购买的链接相关信息
    canvasSetting: {}, // 画布相关设置
    showShareImgDialog: false, // 是否显示分享海报弹出框
    shareCanvasImgPath: '', // 分享海报地址
    paletteJson: '', // 生成的palette的JSON数据
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
        // 画布相关设置
        wx.getSystemInfo({
          success: (res) => {
            // 通过像素比计算出画布的实际大小（330x490）是展示的出来的大小
            this.setData({
              canvasSetting: {
                pixelRatio: res.pixelRatio,
                width: 1080 * res.pixelRatio,
                height: 1546 * res.pixelRatio
              }
            })
          }
        })

        // 获取单个商品信息
        api.getGoods(this.params.channel, this.params.id).then((d) => {
          // 预估返佣
          d.sharingMoney = util.getSharingMoney(d.commission)
          d.channel = this.params.channel

          this.setData({
            loading: 'success',
            fileServerUrl: util.env().fileServerUrl,
            goods: d
          })
          resolve()
        }).catch((err) => {
          this.setData({
            loading: err.errcode === 404 ? 'notfound' : 'fail',
            goods: err.errmsg
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
    // 去首页
    onGotoHome() {
      wx.reLaunch({ url: '/pages/home/index' })
    },
    // 立即购买
    onGotoBuy() {
      wx.vibrateShort()
      util.login().then(() => {
        this.generateGoodsLink().then((d) => {
          this.navigateLink(d)
        })
      })
    },
    // 转链
    generateGoodsLink(ext) {
      return new Promise((resolve, reject) => {
        if (this.data.link) {
          resolve(this.data.link)
        } else {
          api.generateGoodsLink({
            channel: this.data.goods.channel,
            goodsId: this.params.id,
            materialId: this.data.goods.materialUrl,
            couponUrl: this.data.goods.couponUrl
          }, {
            ...ext, 
            showToast: true
          }).then((d) => {
            this.data.link = d
            resolve(d)
          }).catch((err) => {
            reject(err)
          })
        }
      })
    },
    // 跳转到指定链接
    navigateLink(link) {
      // 转链后的链接跳转方式
      switch (link.navigateType) {
        // 淘口令
        case 1:
          wx.setClipboardData({
            data: app.globalData.mobileSystem.indexOf('iOS 14') === 0 ? link.tklIOS14 : link.value,
            success(res) {
              wx.showToast({
                title: '口令已复制，打开【Táo宝】即可抢购。',
                icon: 'none',
                duration: 3000
              })
            }
          })
          break
        // 跳转小程序
        case 2:
          wx.navigateToMiniProgram({
            appId: link.appId,
            path: link.value,
            success(res) {
              // 打开成功
            }
          })
          break
        // webview浏览器打开
        case 3:
          if (this.data.goods.channel == 1) {
            wx.showModal({
              title: '申请授权',
              content: '应淘宝要求，获取返佣前请先进行官方授权。',
              confirmText: '去授权',
              confirmColor: '#f85812',
              success (res) {
                if (res.confirm) {
                  app.globalData.whoami.version === 2
                    ? wx.navigateTo({ url: '/pages/_shared/auth-taobao/index' })
                    : wx.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(link.value)}` })
                }
              }
            })
          } else {
            wx.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(link.value)}` })
          }
          break
      }
    },
    // 生成海报JSON数据
    createPosterJson() {
      wx.vibrateShort()
      util.login().then(() => {
        if (this.data.shareCanvasImgPath.length > 0) {
          this.setData({
            showShareImgDialog: true
          })
          return
        }
  
        wx.showLoading({
          title: '正在生成海报',
          mask: true
        })
  
        // 从后台获取已组装好的商品海报模板JSON数据
        api.getPosterShareGoods({
          channel: this.data.goods.channel,
          goods: {
            ...this.data.goods
          }
        }, {
          ignoreLoading: true
        }).then((d) => {
          const paletteJson = JSON.parse(d.value)
          this.setData({
            paletteJson: paletteJson
          })
        }).catch((err) => {
          console.error(err)
          wx.hideLoading()
        })
      })
    },
    // 海报生成成功
    onGeneratePosterOK(evt) {
      wx.hideLoading()
      this.setData({
        shareCanvasImgPath: evt.detail.path,
        showShareImgDialog: true
      })
    },
    // 海报生成失败
    onGeneratePosterError() {
      wx.hideLoading()
      wx.showToast({
        title: '海报生成失败。',
        icon: 'none'
      })
    },
    // 隐藏分享海报弹出框
    onHideShareImgDialog() {
      this.setData({
        showShareImgDialog: false
      })
    },
    // 监听分享事件
    onShareAppMessage(res) {
      const channelName = util.getChannelName(this.data.goods.channel)

      return {
        title: `【${channelName}】发现一件好货，券后才¥${this.data.goods.discountPrice}，点击查看>>`,
        path: `/pages/taoke/detail/index?companyId=${app.globalData.whoami.companyId}&recommendUserId=${app.globalData.whoami.user.id}&channel=${this.data.goods.channel}&id=${this.params.id}`,
        imageUrl: this.data.goods.images[0]
      }
    }
  }
})
