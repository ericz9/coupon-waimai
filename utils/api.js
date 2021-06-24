module.exports = {
  // HTTP请求构造
  http: {
    // 会话token
    token: '',
    // API接口前缀
    baseURL: '',
    // 分页设置
    pager: {
      limit: 10 // 分页大小
    },
    // 发起API请求
    request(options) {
      return new Promise((resolve, reject) => {
        // ext中包含 ignoreLoading 等配置项
        const ext = options.ext || {}
        if (!ext.ignoreLoading) {
          wx.showLoading({
            title: '拼命加载中',
            mask: true
          })
        }

        wx.request({
          url: this.baseURL + options.url,
          method: options.method,
          data: options.data || {},
          header: {
            'token': this.token,
            'content-type': 'application/json'
          },
          success(res) {
            !ext.ignoreLoading && wx.hideLoading()

            switch (res.data.errcode) {
              case 0:
                // 分页api，数据原样返回
                options.data && options.data.page ? resolve(res.data) : resolve(res.data.data)
                break
              // 登录状态已过期
              case 407:
                reject(res.data)
                break
              default:
                if (ext.showToast) {
                  wx.showToast({
                    title: res.data.errmsg || '当前网络不稳定，请稍后再试。',
                    icon: 'none'
                  })
                }

                reject(res.data)
                break
            }
          },
          fail(err) {
            !ext.ignoreLoading && wx.hideLoading()
            reject(err)
          }
        })
      })
    }
  },

  // 代理提交请求
  proxy(options) {
    return new Promise((resolve, reject) => {
      this.http.request({
        method: options.method,
        url: options.url,
        data: options.data,
        ext: options.ext
      }).then((d) => {
        resolve(d)
      }).catch((err) => {
        // 登录状态已过期
        if (err && err.errcode === 407) {          
          // 静默登录（可直接换取unionId）
          this.wxSilentLogin().then((d) => {
            this.http.token = d.token
            wx.setStorageSync('sessionId', d.token)
            
            const app = getApp()
            d.login = !!(d && d.user && d.user.id)
            app.globalData.whoami = d

            return this.http.request({
              method: options.method,
              url: options.url,
              data: options.data,
              ext: options.ext
            })
          }).then((d) => {
            resolve(d)
          }).catch((err) => {
            reject(err)
          })
        } else {
          reject(err)
        }
      })
    })
  },

  // 具体接口
  
  // 登录
  login(data, ext) {
    return this.http.request({
      method: 'POST',
      url: '/account/loginMini',
      data: data,
      ext: ext
    })
  },
  // 微信授权登录
  wxLogin(ext) {
    return new Promise((resolve, reject) => {
      const app = getApp()

      // wx.getUserInfo能力被回收，新增getUserProfile
      if (wx.getUserProfile) {
        wx.getUserProfile({
          desc: '您的信息将用于完善购物流程体验', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
          success: res => {
            const profile = res

            // 获取登录凭证
            wx.login({
              success: res => {
                // 请求后台API接口登录
                this.login({
                  scene: app.globalData.launchOptions.scene,
                  code: res.code,
                  encryptedData: profile.encryptedData,
                  rawData: profile.rawData,
                  signature: profile.signature,
                  iv: profile.iv,
                  companyId: app.globalData.launchOptions.query.companyId || app.globalData.companyId,
                  recommendUserId: app.globalData.launchOptions.query.recommendUserId
                }, ext).then((d) => {
                  resolve(d)
                }).catch((err) => {
                  reject(err)
                })
              },
              fail: res => {
                reject(res)
              }
            })
          },
          fail: res => {
            reject(res)
          }
        })
      } else {
        // 获取用户的当前设置
        wx.getSetting({
          success: res => {
            // 未授权，进入授权页
            if (!res.authSetting['scope.userInfo']) {
              reject({ redirect: true })
              return
            }
            
            // 获取登录凭证
            wx.login({
              success: res => {
                const code = res.code
  
                wx.getUserInfo({
                  withCredentials: true,
                  success: res => {
                    // 请求后台API接口登录
                    this.login({
                      scene: app.globalData.launchOptions.scene,
                      code: code,
                      encryptedData: res.encryptedData,
                      rawData: res.rawData,
                      signature: res.signature,
                      iv: res.iv,
                      companyId: app.globalData.launchOptions.query.companyId || app.globalData.companyId,
                      recommendUserId: app.globalData.launchOptions.query.recommendUserId
                    }, ext).then((d) => {
                      resolve(d)
                    }).catch((err) => {
                      reject(err)
                    })
                  },
                  fail: res => {
                    reject(res)
                  }
                })
              },
              fail: res => {
                reject(res)
              }
            })
          },
          fail: () => {
            reject(res)
          }
        })
      }
    })
  },
  // 静默登录（可直接换取unionId）
  wxSilentLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          const app = getApp()
          // 请求后台API接口登录
          this.login({
            scene: app.globalData.launchOptions.scene,
            code: res.code,
            companyId: app.globalData.launchOptions.query.companyId || app.globalData.companyId,
            recommendUserId: app.globalData.launchOptions.query.recommendUserId
          }).then((d) => {
            resolve(d)
          }).catch((err) => {
            reject(err)
          })
        },
        fail: res => {
          reject(res)
        }
      })
    })
  },
  // 获取字典项
  getDictionary(catalog, ext) {
    return this.proxy({
      method: 'GET',
      url: `/console/getDictionary?catalog=${catalog}`,
      ext: ext
    })
  },
  // 获取广告
  getAds(region, ext) {
    return this.proxy({
      method: 'GET',
      url: `/console/getAds?region=${region}`,
      ext: ext
    })
  },
  // 获取内容列表
  queryContent(ext) {
    return this.proxy({
      method: 'GET',
      url: '/console/queryContent',
      ext: ext
    })
  },
  // 获取单个内容
  getContent(id, ext) {
    return this.proxy({
      method: 'GET',
      url: `/console/getContent?contentId=${id}`,
      ext: ext
    })
  },
  // 查询优惠券
  queryCoupon(data, ext) {
    data.page.pageSize = data.page.pageSize || this.http.pager.limit
    return this.proxy({
      method: 'POST',
      url: '/console/queryCoupon',
      data: data,
      ext: ext
    })
  },
  // 获取单个优惠券信息
  getCoupon(id, ext) {
    return this.proxy({
      method: 'GET',
      url: `/console/getCoupon?couponId=${id}`,
      ext: ext
    })
  },
  // 获取自动绑定用户推广关系的二维码
  getBindingQrcode(ext) {
    return this.proxy({
      method: 'GET',
      url: '/console/getBindingQrcode',
      ext: ext
    })
  },
  // 获取用户钱包
  getUserWallet(ext) {
    return this.proxy({
      method: 'GET',
      url: '/console/getUserWallet',
      ext: ext
    })
  },
  // 设置用户个人信息
  updateUserInfo(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/console/updateUserInfo',
      data: data,
      ext: ext
    })
  },
  // 用户发起提现
  userDraw(money, ext) {
    return this.proxy({
      method: 'POST',
      url: '/console/userDraw',
      data: {
        drawingMoney: money
      },
      ext: ext
    })
  },
  // 查询用户资金流水
  queryUserWalletFlow(data, ext) {
    data.page.pageSize = data.page.pageSize || this.http.pager.limit
    return this.proxy({
      method: 'POST',
      url: '/console/queryUserWalletFlow',
      data: data,
      ext: ext
    })
  },
  // 查询用户所推荐的客户
  queryUserRecommend(data, ext) {
    data.page.pageSize = data.page.pageSize || this.http.pager.limit
    return this.proxy({
      method: 'POST',
      url: '/console/queryUserRecommend',
      data: data,
      ext: ext
    })
  },
  // 获取用户的推荐人信息
  getUserInviter(ext) {
    return this.proxy({
      method: 'GET',
      url: '/console/getUserInviter',
      ext: ext
    })
  },
  // 查询用户是否已绑定淘宝渠道ID
  isBindTaobaoRelationId(ext) {
    return this.proxy({
      method: 'GET',
      url: '/console/isBindTaobaoRelationId',
      ext: ext
    })
  },
  // 查询商品
  queryGoods(data, ext) {
    data.page.pageSize = data.page.pageSize || this.http.pager.limit
    return this.proxy({
      method: 'POST',
      url: '/taoke/queryGoods',
      data: data,
      ext: ext
    })
  },
  // 查询一揽子商品
  queryPackageGoods(data, ext) {
    data.page.pageSize = data.page.pageSize || this.http.pager.limit
    return this.proxy({
      method: 'POST',
      url: '/taoke/queryPackageGoods',
      data: data,
      ext: ext
    })
  },
  // 获取单个商品信息
  getGoods(channel, goodsId, ext) {
    return this.proxy({
      method: 'GET',
      url: `/taoke/getGoods?channel=${channel}&materialId=${goodsId}`,
      ext: ext
    })
  },
  // 商品转链
  generateGoodsLink(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/taoke/generateGoodsLink',
      data: data,
      ext: ext
    })
  },
  // 获取商品海报
  getPosterShareGoods(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/taoke/getPosterShareGoods',
      data: data,
      ext: ext
    })
  },
  // 获取商品渠道
  getGoodsChannel(ext) {
    return this.proxy({
      method: 'GET',
      url: `/taoke/getGoodsChannel`,
      ext: ext
    })
  },
  // 根据淘口令或商品链接智能识别商品
  aiGoods(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/taoke/aiGoods',
      data: data,
      ext: ext
    })
  },
  // 生成备案淘口令
  createPublisherTkl(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/h5/createPublisherTkl',
      data: data,
      ext: ext
    })
  },
  // 更新用户淘宝渠道ID
  updateUserTaobaoRelationId(data, ext) {
    return this.proxy({
      method: 'POST',
      url: '/h5/updateUserTaobaoRelationId',
      data: data,
      ext: Object.assign({
        loading: true,
        showToast: true
      }, ext)
    })
  },
}