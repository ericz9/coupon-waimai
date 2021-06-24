import api from '../../utils/api.js'
import util from '../../utils/util.js'
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'loading',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    canUseCustomBar: false, // 自定义导航栏是否可用
    isPageScrolled: false, // 用户有下滑页面
    currentCategoryId: '100', // 当前选择的分类ID
    categories: [], // 分类列表
    banners: [], // banner
    navs: [], // 导航按钮
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
          selected: 2
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
        // 获取分类列表
        api.getDictionary('GoodsCategory').then((d) => {
          const categories = d.filter(k => k.isSysDefine === 1)
          this.setData({
            loading: 'success',
            categories: categories,
            canUseCustomBar: app.globalData.canUseCustomBar
          })
        })

        // 获取广告
        api.getAds(2, {
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

        // 获取导航按钮
        api.getDictionary('GoodsNav', {
          ignoreLoading: true
        }).then((d) => {
          this.setData({
            navs: d
          })
        })

        // 查询商品
        this.queryGoods(true).then((d) => {
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
    // 查询商品
    queryGoods(ignoreLoading) {
      return new Promise((resolve, reject) => {
        const queryGoodsPromise = this.data.currentCategoryId === '100' // 精选
          ? api.queryPackageGoods({
              page: {
                pageIndex: this.data.pager.start
              },
              package: 2 // 购物页
            }, {
              ignoreLoading: ignoreLoading
            })
          : api.queryGoods({
              page: {
                pageIndex: this.data.pager.start
              },
              queryBy: 1,
              category: this.data.currentCategoryId
            }, {
              ignoreLoading: ignoreLoading
            })

        queryGoodsPromise.then((d) => {
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
    // 点击搜索
    onClickSearch() {
      wx.navigateTo({ 
        url: '/pages/taoke/search/index' 
      })
    },
    // 切换分类
    handleTabClick(evt) {
      this.setData({
        currentCategoryId: evt.target.id,
        'pager.start': 1,
        'pager.hasMore': true
      })

      this.queryGoods(false).then((d) => {
        wx.pageScrollTo({
          scrollTop: 0
        })

        this.setData({
          goods: d.data,
          'pager.hasMore': d.page.totalPage > 1
        })
      })
    },
    // 跳转到导航地址
    onGotoNav(evt) {
      const nav = this.data.navs.find(k => k.id === evt.currentTarget.id)
      if (nav) {
        wx.navigateTo({
          url: nav.describe
        })
      }
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

      this.queryGoods(false).then((d) => {
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
    // 监听用户滑动页面事件
    onPageScroll(evt) {
      const isPageScrolled = evt.scrollTop >= 5
      if (this.data.isPageScrolled !== isPageScrolled) {
        this.setData({
          isPageScrolled: isPageScrolled
        })
      }
    }
  }
})
