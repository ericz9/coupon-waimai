const api = require("../../../utils/api")
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    settleNotice: '', // 订单结算周期提示
    flows: [], // 资金流水
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

        // 查询用户资金流水
        this.queryUserWalletFlow().then((d) => {
          this.setData({
            loading: 'success',
            settleNotice: app.globalData.whoami.sysInfo.settleNotice,
            flows: d.data,
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
    // 查询用户资金流水
    queryUserWalletFlow() {
      return new Promise((resolve, reject) => {
        api.queryUserWalletFlow({
          page: {
            pageIndex: this.data.pager.start
          }
        }).then((d) => {
          resolve(d)
        }).catch(() => {
          reject()
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

      this.queryUserWalletFlow().then((d) => {
        this.data.flows = [...this.data.flows, ...d.data]
        this.data.pager.loading = 'success'
        this.data.pager.hasMore = d.page.totalPage > this.data.pager.start
        this.setData({
          flows: this.data.flows,
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
