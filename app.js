import api from 'utils/api.js'

App({
  onLaunch: function(options) {
    // 全局配置API请求
    api.http.baseURL = this.globalData.env[this.globalData.mode].apiUrl

    // 启动参数
    if (options) {
      this.globalData.launchOptions = options
    }

    // 用于自定义导航
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.mobileSystem = systemInfo.system
    this.globalData.canUseCustomBar = this.compareVersion(systemInfo.SDKVersion, '2.4.3') >= 0
    if (this.globalData.canUseCustomBar) {
      this.globalData.statusBar = systemInfo.statusBarHeight
      const custom = wx.getMenuButtonBoundingClientRect()
      this.globalData.custom = custom
      this.globalData.customBar = custom.bottom + custom.top - systemInfo.statusBarHeight + 4
    }

    // 从本地存储中获取sessionId
    const sessionId = wx.getStorageSync('sessionId')
    if (sessionId) {
      api.http.token = sessionId
    }

    // 静默登录（可直接换取unionId）
    api.wxSilentLogin().then((d) => {
      this.setWhoami(d)
    }).catch(() => {
      this.setWhoami(null)
    })
  },
  // 设置whoami对象的数据
  setWhoami(whoami) {
    if (whoami) {
      api.http.token = whoami.token
      wx.setStorageSync('sessionId', whoami.token)
    } else {
      whoami = {}
    }
    
    whoami.login = !!(whoami && whoami.user && whoami.user.id)
    this.globalData.whoami = whoami

    // 由于 api.user 是网络请求，可能会在 Page.onLoad 之后才返回
    // 所以此处加入 callback 以防止这种情况
    this.launchCallback && this.launchCallback()
  },
  // 版本比较
  compareVersion(v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)
  
    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }
  
    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])
  
      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }
  
    return 0
  },
  globalData: {
    mode: 'devp',
    // 环境配置
    env: {
      // 开发环境
      devp: {
        apiUrl: 'http://vc.mline.vip/api/customer', // 接口地址
        fileServerUrl: 'http://oss.mline.vip', // 文件服务地址
      },
      // 测试环境
      test: {
        apiUrl: 'https://vctest.duomai88.com/api/customer', // 接口地址
        fileServerUrl: 'https://file.duomai88.com', // 文件服务地址
      },
      // 生产环境
      prod: {
        apiUrl: '', // 接口地址
        fileServerUrl: '', // 文件服务地址
      }
    },
    companyId: '', // 公司ID（联系微信（qian_z）获取，请备注<github>，否则可能不会通过哦）
    launchOptions: {}, // 启动参数
    mobileSystem: '', // 手机操作系统及版本信息
    canUseCustomBar: false, // 自定义导航栏是否可用
    whoami: null, // 系统配置信息
  }
})