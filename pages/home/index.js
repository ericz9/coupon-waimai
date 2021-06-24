import api from '../../utils/api.js'
import util from '../../utils/util.js'
import store from '../../utils/store.js'
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    showAddTips: true, // 是否显示“添加到我的小程序”
    fileServerUrl: '', // 文件服务地址
    navigationHomeTitle: '', // 首页导航栏标题
    logoUrl: '', // 产品LOGO地址
    canUseCustomBar: false, // 自定义导航栏是否可用
    customBarHeight: 0, // 自定义导航栏高度
    banners: [], // banner
    coupons: [], // 优惠券
    infos: [], // 手动收集的优惠券信息列表
    goods: [], // 商品列表
    // 分页信息
    pager: {
      // 页码
      start: 1,
      // 加载状态
      // loading 加载中
      // success 成功
      // fail 失败
      loading: 'success',
      // 是否还有下一页更多数据
      hasMore: true
    }
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
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
    // 初始化
    initialize() {
      return new Promise((resolve, reject) => {
        this.setData({
          loading: 'success',
          fileServerUrl: util.env().fileServerUrl,
          navigationHomeTitle: (app.globalData.whoami.sysInfo || {}).navigationHomeTitle,
          canUseCustomBar: app.globalData.canUseCustomBar,
          customBarHeight: app.globalData.customBar,
          logoUrl: app.globalData.whoami.sysInfo.logoUrl || `${util.env().fileServerUrl}/images/coupon/assets/logo.png`
        })

        // 获取广告
        api.getAds(1, {
          ignoreLoading: true
        }).then((d) => {
          // 填充图片尺寸
          d.forEach((item) => {
            item.imageUrl = util.imageClear(item.imageUrl)
          })
          this.setData({
            banners: d
          })
        })

        // 获取外卖优惠券
        api.queryContent({
          ignoreLoading: true
        }).then((d) => {
          const coupons = []
          d.forEach((item) => {
            coupons.push({
              id: item.id,
              title: item.title,
              channel: item.channel,
              activityId: item.activityId,
              miniUrl: item.miniUrl,
              qrcodeUrl: item.qrcodeUrl,
              money: item.couponMoney,
              tips: item.couponTips,
              content: item.content
            })
          })
          
          store.setCoupons(coupons)
          this.setData({
            coupons: coupons.slice(0, 2)
          })
        })

        // 获取收集的优惠券信息
        api.queryCoupon({
          page: {
            pageIndex: 1,
            pageSize: 2
          }
        }, {
          ignoreLoading: true
        }).then((d) => {
          d.data.forEach((item) => {
            // 封面图片
            item.imageUrl = util.imageResizer(item.imageUrl)
            item.createTime = item.createTime.substr(5, 5)

            // 过期时间（时间戳）
            const expireTime = new Date(`${item.expireTime.replace(/-/g, '/')} 00:00:00`)
            item.expireTimestamp = expireTime.getTime()
            item.currentTimestamp = (new Date()).getTime()
          })
          this.setData({
            infos: d.data
          })
        })

        // 查询首页商品
        this.queryPackageGoods(true).then((d) => {
          this.setData({
            goods: d.data,
            'pager.hasMore': d.page.totalPage > 1
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
    // 关闭“添加到我的小程序”的显示状态
    onClickCloseAddTips() {
      this.setData({
        showAddTips: false
      })
    },
    // 点击搜索
    onClickSearch() {
      wx.navigateTo({ 
        url: '/pages/taoke/search/index' 
      })
    },
    // 领取优惠券
    onGetCoupon() {
      wx.vibrateShort()
      wx.switchTab({
        url: '/pages/waimai/index'
      })
    },
    // 查看手动收集的优惠券信息列表
    onGotoInfoList() {
      wx.navigateTo({ url: `/pages/home/info/index` })
    },
    // 查看手动收集的优惠券详情
    onGotoInfoDetail(evt) {
      wx.navigateTo({ url: `/pages/home/info-detail/index?id=${evt.currentTarget.id}` })
    },
    // 查看商品详情
    onGotoGoodsDetail(evt) {
      wx.navigateTo({ url: `/pages/taoke/detail/index?channel=${evt.currentTarget.dataset.channel}&id=${evt.currentTarget.id}` })
    },
    // 查询首页商品
    queryPackageGoods(ignoreLoading) {
      return new Promise((resolve, reject) => {
        api.queryPackageGoods({
          page: {
            pageIndex: this.data.pager.start
          },
          package: 1 // 首页
        }, {
          ignoreLoading: ignoreLoading
        }).then((d) => {
          d.data.forEach((item) => {
            // 预估返佣
            item.sharingMoney = util.getSharingMoney(item.commission)
          })
          resolve(d)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    // 加载分页数据
    loadMore() {
      if (!this.data.pager.hasMore
        || this.data.pager.loading === 'loading') {
        return
      }

      this.data.pager.start += 1
      this.data.pager.loading = 'loading'
      this.setData({
        pager: this.data.pager
      })

      this.queryPackageGoods(false).then((d) => {
        this.data.goods = [...this.data.goods, ...d.data]
        this.data.pager.loading = 'success'
        this.data.pager.hasMore = d.page.totalPage > this.data.pager.start
        this.setData({
          goods: this.data.goods,
          pager: this.data.pager
        })
      }).catch(() => {
        // 重新加载时再次失败，重置标识
        this.data.pager.start = this.data.pager.start > 1 ? this.data.pager.start - 1 : 1
        this.data.pager.loading = 'fail'
        this.setData({
          pager: this.data.pager
        })
      })
    },
    // 监听用户上拉触底事件
    onReachBottom(evt) {
      this.loadMore()
    },
    // 监听分享事件
    onShareAppMessage(res) {
      return {
        title: app.globalData.whoami.sysInfo.shareTitle,
        path: `/pages/home/index?companyId=${app.globalData.whoami.companyId}&recommendUserId=${app.globalData.whoami.user.id}`,
        imageUrl: app.globalData.whoami.sysInfo.shareImage
      }
    }
  }
})
