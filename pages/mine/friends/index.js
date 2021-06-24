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
    level: '1', // 默认查询的推荐层级
    friends: [], // 推荐的客户
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

        // 查询用户所推荐的客户
        this.queryUserRecommend().then((d) => {
          this.setData({
            loading: 'success',
            friends: d.data,
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
    // 切换层级
    handleTabClick(evt) {
      this.setData({
        level: evt.target.id,
        'pager.start': 1,
        'pager.hasMore': true
      })

      this.queryUserRecommend().then((d) => {
        wx.pageScrollTo({
          scrollTop: 0
        })

        this.setData({
          friends: d.data,
          'pager.hasMore': d.page.totalPage > 1
        })
      })
    },
    // 查询用户所推荐的客户
    queryUserRecommend() {
      return new Promise((resolve, reject) => {
        api.queryUserRecommend({
          page: {
            pageIndex: this.data.pager.start
          },
          level: this.data.level
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

      this.queryUserRecommend().then((d) => {
        this.data.friends = [...this.data.friends, ...d.data]
        this.data.pager.loading = 'success'
        this.data.pager.hasMore = d.page.totalPage > this.data.pager.start
        this.setData({
          friends: this.data.friends,
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
