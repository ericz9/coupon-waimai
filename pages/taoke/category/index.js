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
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    goods: [], // 商品列表
    sort: 'default', // 排序字段名
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
    onLoad(params) {
      this.params = params
      wx.setNavigationBarTitle({ title: decodeURIComponent(params.name) })

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
        // 查询商品
        this.queryPackageGoods().then((d) => {
          this.setData({
            loading: 'success',
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
    // 查询商品
    queryPackageGoods() {
      return new Promise((resolve, reject) => {
        api.queryPackageGoods({
          page: {
            pageIndex: this.data.pager.start,
            sortField: this.data.sort,
            isAsc: this.data.sort === 'price' ? 1 : 0
          },
          package: this.params.id
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
    // 切换排序
    handleTabClick(evt) {
      this.setData({
        sort: evt.target.id,
        'pager.start': 1,
        'pager.hasMore': true
      })

      this.queryPackageGoods().then((d) => {
        wx.pageScrollTo({
          scrollTop: 0
        })

        this.setData({
          goods: d.data,
          'pager.hasMore': d.page.totalPage > 1
        })
      })
    },
    // 查看商品详情
    onGotoGoodsDetail(evt) {
      wx.navigateTo({ url: `/pages/taoke/detail/index?channel=${evt.currentTarget.dataset.channel}&id=${evt.currentTarget.id}` })
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

      this.queryPackageGoods().then((d) => {
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
    }
  }
})
