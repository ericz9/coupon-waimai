import api from 'api.js'
const app = getApp()

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const env = () => {
  return app.globalData.env[app.globalData.mode]
}

// 填充图片地址
const imageResizer = (value, width, height, mode) => {
  if (!width) width = '300'
  if (!height) height = '300'
  if (!mode) mode = 'c'

  return (env().fileServerUrl + value).replace('{0}', width).replace('{1}', height).replace('{2}', mode)
}

//原始图片
const imageClear = (value) => {
  return (env().fileServerUrl + value).replace('{0}x{1}{2}', '')
}

// 微信授权登录
const login = (ignoreRedirect) => {
  return new Promise((resolve, reject) => {
    // 是否已登录
    if (app.globalData.whoami.login) {
      resolve()
    } else {
      wx.showLoading({
        title: '拼命加载中',
        mask: true
      })

      api.wxLogin().then((d) => {
        api.http.token = d.token
        wx.setStorageSync('sessionId', d.token)
        
        d.login = !!(d && d.user && d.user.id)
        app.globalData.whoami = d

        wx.hideLoading()
        d.login ? resolve() : reject()
      }).catch((err) => {
        app.globalData.whoami.login = 0
        app.globalData.whoami.user = {}
        wx.hideLoading()
        err.redirect && !ignoreRedirect && wx.navigateTo({url: '/pages/_shared/auth/index'})
        reject(err)
      })
    }
  })
}

// 渠道名称
const getChannelName = (channel) => {
  switch (Number(channel)) {
    case 1:
      return '淘宝'
    case 2:
      return '京东'
  }
}

// 预估返佣
const getSharingMoney = (commission) => {
  return app.globalData.whoami.login
    ? (app.globalData.whoami.sysInfo.sharingRatioSelf * commission).toFixed(2)
    : commission
}

module.exports = {
  formatTime: formatTime,
  env: env,
  imageResizer: imageResizer,
  imageClear: imageClear,
  login: login,
  getChannelName: getChannelName,
  getSharingMoney: getSharingMoney
}
