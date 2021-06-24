import api from '../../utils/api.js'
import util from '../../utils/util.js'
const app = getApp()

Component({
  data: {
    canUseCustomBar: false, // 自定义导航栏是否可用
    user: {}, // 用户信息
    // 用户钱包
    wallet: {
      balance: 0,
      totalMoney: 0,
      pendingMoney: 0,
      drawingMoney: 0
    },
    inviter: {}, // 用户的推荐人信息
    showOffiaccountDialog: false, // 是否显示公众号二维码弹出框
    offiaccountUrl: '', // 公众号二维码URL地址
    showShareImgDialog: false, // 是否显示分享海报弹出框
    shareCanvasImgPath: '', // 分享海报地址
    showCustomDialog: false, // 是否显示客服二维码弹出框
    customQrcodeUrl: '', // 客服二维码URL地址
    custom: '0', // 联系客服时，是否跳转到小程序客服会话
    mpFlowLinkText: '关注公众号，接收更多优惠信息', // 公众号引导关注文案
    showBusinessDialog: false, // 是否显示我也要做返利小程序弹出框
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 3
        })
      }
    }
  },
  methods: {
    onLoad() {
      const updateData = {
        canUseCustomBar: app.globalData.canUseCustomBar,
        offiaccountUrl: `${util.env().fileServerUrl}/images/public/assets/offiaccountQrcode.jpg`
      }

      if (app.globalData.whoami.login) {
        updateData['customQrcodeUrl'] = app.globalData.whoami.sysInfo.customQrcodeUrl
        updateData['custom'] = app.globalData.whoami.sysInfo.custom
        updateData['mpFlowLinkText'] = app.globalData.whoami.sysInfo.mpFlowLinkText
      }

      this.setData(updateData)
    },
    onShow() {
      if (this.data.user.login !== 1) {
        if (app.globalData.whoami) {
          this.initialize()
        } else {
          app.launchCallback = () => {
            this.initialize()
          }
        }
      }
    },
    // 初始化
    initialize() {
      return new Promise((resolve, reject) => {
        const user = {
          login: 0,
          nickName: '',
          headImg: `${util.env().fileServerUrl}/images/public/assets/avatar.png`
        }
  
        if (app.globalData.whoami.login) {
          user.login = 1
          user.nickName = app.globalData.whoami.user.nickName
          user.headImg = app.globalData.whoami.user.headImg

          // 获取用户钱包
          api.getUserWallet().then((d) => {
            this.setData({
              user: user,
              wallet: d
            })
          }).catch(() => {
            this.setData({
              user: user
            })
          })
  
          // 获取用户的推荐人信息
          api.getUserInviter().then((d) => {
            this.setData({
              inviter: d
            })
            resolve()
          }).catch((err) => {
            reject(err)
          })
        } else {
          this.setData({
            user: user
          })
          resolve()
        }
      })
    },
    // 登录
    onClickLogin() {
      util.login().then(() => {
        this.initialize()
      })
    },
    // 个人设置
    onGotoInfo() {
      util.login().then(() => {
        const wxAccount = encodeURIComponent(this.data.wallet.wxAccount)
        const aliAccount = encodeURIComponent(this.data.wallet.aliAccount)
        wx.navigateTo({
          url: `/pages/mine/info/index?wxaccount=${wxAccount}&aliaccount=${aliAccount}`
        })
      })
    },
    // 生成海报
    generatePoster() {
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
  
        // 获取自动绑定用户推广关系的二维码
        api.getBindingQrcode({
          ignoreLoading: true,
          showToast: true
        }).then((d) => {
          wx.getImageInfo({
            src: d.value,
            success: (res) => {
              const ctx = wx.createCanvasContext('poster')
              ctx.drawImage('/assets/images/poster.jpg', 0, 0, 750, 1334)
              ctx.drawImage(res.path, 203, 715, 350, 350)
              ctx.draw(false, () => {
                // canvas画布转成图片并返回图片地址
                wx.canvasToTempFilePath({
                  canvasId: 'poster',
                  success: res => {
                    wx.hideLoading()
                    this.setData({
                      showShareImgDialog: true,
                      shareCanvasImgPath: res.tempFilePath
                    })
                  },
                  fail: () => {
                    wx.hideLoading()
                    wx.showToast({
                      title: '海报生成失败。',
                      icon: 'none'
                    })
                  }
                })
              })
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({
                title: '海报生成失败。',
                icon: 'none'
              })
            }
          })
        }).catch(() => {
          wx.hideLoading()
        })
      })
    },
    // 隐藏分享海报弹出框
    onHideShareImgDialog() {
      this.setData({
        showShareImgDialog: false
      })
    },
    // 去提现
    onGotoDraw() {
      util.login().then(() => {
        wx.navigateTo({url: '/pages/mine/draw/index'})
      })
    },
    // 显示公众号二维码弹出框
    onShowOffiaccountDialog() {
      this.setData({
        showOffiaccountDialog: true
      })
    },
    // 隐藏公众号二维码弹出框
    onHideOffiaccountDialog() {
      this.setData({
        showOffiaccountDialog: false
      })
    },
    // 复制推荐人微信号
    onCopyInviterWxAccount() {
      if (this.data.inviter.value) {
        wx.setClipboardData({
          data: this.data.inviter.value,
          success(res) {
            wx.showToast({
              title: '已复制推荐人的微信号。',
              icon: 'none',
              duration: 2000
            })
          }
        })
      } else {
        wx.showToast({
          title: '推荐人未设置微信号。',
          icon: 'none',
          duration: 2000
        })
      }
    },
    // 去我邀请的朋友页
    onGotoFriends() {
      util.login().then(() => {
        wx.navigateTo({url: '/pages/mine/friends/index'})
      })
    },
    // 去资金流水页
    onGotoFlows() {
      util.login().then(() => {
        wx.navigateTo({url: '/pages/mine/flows/index'})
      })
    },
    // 显示客服二维码弹出框
    onShowCustomDialog() {
      this.setData({
        showCustomDialog: true
      })
    },
    // 隐藏客服二维码弹出框
    onHideCustomDialog() {
      this.setData({
        showCustomDialog: false
      })
    },
    // 显示我也要做返利小程序弹出框
    onShowBusinessDialog() {
      this.setData({
        showBusinessDialog: true
      })
    },
    // 隐藏我也要做返利小程序弹出框
    onHideBusinessDialog() {
      this.setData({
        showBusinessDialog: false
      })
    },
    //复制微信号
    onClickClipboardWx() {
      wx.setClipboardData({
        data: app.globalData.whoami.sysInfo.businessWxAccount,
        success: () => {
          this.onHideBusinessDialog()
        }
      })
    },
    // 下拉刷新
    onPullDownRefresh() {
      this.initialize().then(() => {
        wx.stopPullDownRefresh()
      }).catch(() => {
        wx.stopPullDownRefresh()
      })
    }
  }
})
