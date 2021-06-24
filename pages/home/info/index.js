import api from '../../../utils/api.js'
import util from '../../../utils/util.js'
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    // 查询参数
    queryParams: {
      categoryId: '', // 分类ID
    },
    categories: [], // 分类列表
    coupons: [], // 优惠券
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
        const failed = { loading: '' }
        let categories = []

        // 获取字典项
        api.getDictionary('CouponCategory',{
          ignoreLoading: true
        }).then((d) => {
          categories = d
          this.setData({
            'queryParams.categoryId': (d[0] || {}).id
          })
          // 获取优惠券
          return this.queryCoupon()
        }).then((d) => {
          this.setData({
            loading: 'success',
            loadingRetry: false,
            categories: categories,
            coupons: d.data,
            'pager.hasMore': d.page.totalPage > 1
          })
          resolve()
        }, () => {
          failed.loading = failed.loading || 'fail'
          return Promise.reject()
        }).catch((err) => {
          this.setData(failed)
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
    // 查询优惠券
    queryCoupon() {
      return new Promise((resolve, reject) => {
        api.queryCoupon({
          page: {
            pageIndex: this.data.pager.start
          },
          categoryId: this.data.queryParams.categoryId
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
          resolve(d)
        }).catch(() => {
          reject()
        })
      })
    },
    // 切换分类
    handleTabClick(evt) {
      this.setData({
        'queryParams.categoryId': evt.target.id,
        'pager.start': 1
      })
      this.queryCoupon().then((d) => {
        this.setData({
          coupons: d.data,
          'pager.hasMore': d.page.totalPage > 1
        })
      })
    },
    // 查看详情
    onGotoDetail(evt) {
      wx.navigateTo({ url: `/pages/home/info-detail/index?id=${evt.currentTarget.id}` })
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

      this.queryCoupon().then((d) => {
        this.data.coupons = [...this.data.coupons, ...d.data]
        this.data.pager.loading = 'success'
        this.data.pager.hasMore = d.page.totalPage > this.data.pager.start
        this.setData({
          coupons: this.data.coupons,
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
    // 下拉刷新
    onPullDownRefresh() {
      //重置分页信息
      this.data.pager = {
        //页码
        start: 1,
        //加载状态
        //loading 加载中
        //success 成功
        //fail 失败
        loading: 'success',
        //是否还有下一页更多数据
        hasMore: true
      }

      this.initialize().then(() => {
        wx.stopPullDownRefresh()
      }).catch(() => {
        wx.stopPullDownRefresh()
      })
    }
  }
})
