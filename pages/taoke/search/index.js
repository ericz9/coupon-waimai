import api from '../../../utils/api.js'
import util from '../../../utils/util.js'
import store from '../../../utils/store.js'
const app = getApp()

Component({
  data: {
    // 数据初始化加载状态
    // init 进入界面时的初始状态，直至触发搜索动作
    // loading 加载中
    // success 成功
    // fail 失败
    loading: 'init',
    loadingRetry: false, // 加载失败后，尝试重试获取数据时为TRUE
    canUseCustomBar: false, // 自定义导航栏是否可用
    kw: '', //搜索关键词
    currentChannel: '', // 当前商品渠道
    historyKws: [], //历史搜索关键词
    channels: [], // 商品渠道
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
    onLoad() {
      if (app.globalData.whoami) {
        this.initialize()
      } else {
        app.launchCallback = () => {
          this.initialize()
        }
      }
    },
    onShow() {
      // 智能识别商品
      wx.getClipboardData({
        success: (clipboard) => {
          const clipboardData = clipboard.data
          if (clipboardData) {
            // 清空剪贴板内容
            wx.setClipboardData({
              data: '',
              success: function() {
                wx.hideToast()
              }
            })

            wx.showModal({
              title: '是否搜索以下商品',
              content: clipboardData,
              confirmText: '立即搜索',
              confirmColor: '#f85812',
              success: (res) => {
                if (res.confirm) {
                  wx.vibrateShort()

                  // 写入历史搜索
                  this.setData({
                    historyKws: this.updateHistoryKw(clipboardData)
                  })

                  api.aiGoods({
                    id: clipboardData
                  }, {
                    ignoreLoading: true,
                    showToast: true
                  }).then((d) => {
                    wx.navigateTo({
                      url: `/pages/taoke/detail/index?channel=${d.channel}&id=${d.materialId}`
                    })
                  })
                }
              }
            })
          }
        }
      })
    },
    // 初始化
    initialize() {
      return new Promise((resolve, reject) => {
        api.getGoodsChannel().then((d) => {
          // 历史搜索关键词
          const historyKws = store.getKw()

          this.setData({
            canUseCustomBar: app.globalData.canUseCustomBar,
            channels: d,
            currentChannel: d[0].value,
            historyKws: historyKws
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
    // 切换商品渠道
    handleGoodsChannelTabClick(evt) {
      this.setData({
        currentChannel: evt.target.id,
        'pager.start': 1,
        'pager.hasMore': true
      })

      if (this.data.kw) {
        this.queryGoods(1).then((d) => {
          wx.pageScrollTo({
            scrollTop: 0
          })
  
          this.setData({
            loading: 'success',
            goods: d.data,
            'pager.hasMore': d.page.totalPage > 1
          })
        }).catch(() => {
          this.setData({
            loading: 'fail',
            goods: []
          })
        })
      } else {
        this.onClearKw()
      }
    },
    // 切换排序
    handleGoodsSortTabClick(evt) {
      this.setData({
        sort: evt.target.id,
        'pager.start': 1,
        'pager.hasMore': true
      })

      this.queryGoods(1).then((d) => {
        wx.pageScrollTo({
          scrollTop: 0
        })

        this.setData({
          goods: d.data,
          'pager.hasMore': d.page.totalPage > 1
        })
      }).catch(() => {
        this.setData({
          loading: 'fail',
          goods: []
        })
      })
    },
    // 搜索关键词改变
    handleSearchEvent(evt) {
      this.setData({
        kw: evt.detail
      })

      if (this.data.kw) {
        this.onSearch()
      } else {
        this.onClearKw()
      }
    },
    // 点击搜索关键词
    onClickKw(evt) {
      // 写入搜索框
      const header = this.selectComponent('#header')
      header.onSearchTextInput({
        detail: {
          value: evt.currentTarget.dataset.kw
        }
      })

      this.setData({
        kw: evt.currentTarget.dataset.kw
      })

      this.onSearch()
    },
    // 清空搜索关键词
    onClearKw() {
      this.setData({
        kw: '',
        loading: 'init'
      })
    },
    // 删除搜索历史记录
    onDeleteKw() {
      store.clearKw(() => {
        this.setData({
          historyKws: []
        })
      })
    },
    // 搜索
    onSearch() {
      return new Promise((resolve, reject) => {
        this.queryGoods(1).then((d) => {
          const updateData = {
            loading: 'success',
            loadingRetry: false,
            goods: d.data,
            pager: {
              start: 1,
              loading: 'success',
              hasMore: d.page.totalPage > 1
            }
          }

          // 写入历史搜索
          updateData.historyKws = this.updateHistoryKw(this.data.kw)
  
          wx.pageScrollTo({
            scrollTop: 0
          })
          this.setData(updateData)
          resolve()
        }).catch((err) => {
          console.error(err)
          this.setData({
            loading: 'fail'
          })
          reject(err)
        })
      })
    },
    // 更新历史搜索
    updateHistoryKw(kw) {
      const kws = this.data.historyKws
      kw = kw.replace(/\s*/g,'')
      if (kw && kw.length > 0) {
        const index = kws.indexOf(kw)
        if (index > -1) {
          kws.splice(index, 1)
        } else if (kws.length >= 20) {
          kws.splice(kws.length - 1, 1)
        }

        kws.unshift(kw)
        store.setKw(kws)
      }

      return kws
    },
    // 查询商品
    queryGoods(pageIndex) {
      return new Promise((resolve, reject) => {
        api.queryGoods({
          page: {
            pageIndex: pageIndex,
            sortField: this.data.sort,
            isAsc: this.data.sort === 'price' ? 1 : 0
          },
          queryBy: 2,
          channel: this.data.currentChannel,
          keywords: this.data.kw
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

      this.queryGoods(this.data.pager.start).then((d) => {
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
  }
})
