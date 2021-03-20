const app = getApp()

Component({
  data: {
    showAddTips: true, // 是否显示“添加到我的小程序”
    fileServerUrl: '', // 文件服务地址
    navigationHomeTitle: '天天领外卖红包', // 首页导航栏标题
    currentBannerIndex: 0, // 当前选中的banner
    banners: [], // banner
    currentUser: {}, // 当前展示的用户
    timer: null,
    hideCurrentUser: false, // 隐藏当前展示的用户
    users: [], // 已领取优惠券的用户
    coupons: [], // 优惠券
  },
  methods: {
    onLoad() {
      this.initialize()
    },
    // 初始化
    initialize() {
      // banner
      const banners = [
        `${app.globalData.fileServerUrl}/waimai/upload/images/2021/1/89ee5fafe04874df.jpg`,
        `${app.globalData.fileServerUrl}/waimai/upload/images/2021/1/debd9b1c676df789.png`,
        `${app.globalData.fileServerUrl}/waimai/upload/images/2021/1/a9d1a6a06a626e83.jpg`
      ]

      // 已领取优惠券的用户
      // 产生30个用户
      const allUsers = []
      for (let i = 1; i <= 30; i++) {
        allUsers.push({
          id: i,
          text: this.getAllureText()
        })
      }

      // 随机顺序
      allUsers.sort(function() {
        return (0.5 - Math.random())
      })

      // 优惠券
      const coupons = [
        {
          id: 1,
          title: '美团外卖神券',
          channel: 'mt',
          appId: 'wxde8ac0a21135c07d',
          url: '/index/pages/h5/h5?weburl=https%3A%2F%2Frunion.meituan.com%2Furl%3Fkey%3Dd349c7b5e012f1bd4c77b311ab19af78%26url%3Dhttps%253A%252F%252Fi.meituan.com%252Fawp%252Fhfe%252Fblock%252Fa13b87919a9ace9cfab4%252F89400%252Findex.html%253Fappkey%253Dd349c7b5e012f1bd4c77b311ab19af78%253A426bc2fdeaa841c38b5bd18aca98dd36%26sid%3D426bc2fdeaa841c38b5bd18aca98dd36&lch=cps:waimai:5:d349c7b5e012f1bd4c77b311ab19af78:426bc2fdeaa841c38b5bd18aca98dd36&f_token=1&f_userId=1',
          money: 68,
          tips: '今日仅剩202个'
        },
        {
          id: 2,
          title: '饿了么天天领大红包',
          channel: 'ele',
          appId: 'wxece3a9a4c82f58c9',
          url: 'ele-recommend-price/pages/guest/index?inviterId=f2ddb01',
          money: 20,
          tips: '今日仅剩232个'
        },
        {
          id: 3,
          title: '饿了么专享66元红包',
          channel: 'ele',
          appId: 'wxece3a9a4c82f58c9',
          url: 'taoke/pages/shopping-guide/index?scene=6GZ2Tqu',
          money: 66,
          tips: '今日仅剩217个'
        },
        {
          id: 4,
          title: '美团商超生鲜红包',
          channel: 'mt',
          appId: 'wxde8ac0a21135c07d',
          url: '/index/pages/h5/h5?weburl=https%3A%2F%2Frunion.meituan.com%2Furl%3Fkey%3Dd349c7b5e012f1bd4c77b311ab19af78%26url%3Dhttps%253A%252F%252Fi.meituan.com%252Fawp%252Fhfe%252Fblock%252Fc9ff59b58f6f5bf385b6%252F94455%252Findex.html%253Fappkey%253Dd349c7b5e012f1bd4c77b311ab19af78%253A426bc2fdeaa841c38b5bd18aca98dd36%26sid%3D426bc2fdeaa841c38b5bd18aca98dd36&lch=cps:waimai:5:d349c7b5e012f1bd4c77b311ab19af78:426bc2fdeaa841c38b5bd18aca98dd36&f_token=1&f_userId=1',
          money: 34,
          tips: '今日仅剩301个'
        },
        {
          id: 5,
          title: '饿了么吃货联盟36元红包',
          channel: 'ele',
          appId: 'wxece3a9a4c82f58c9',
          url: 'pages/sharePid/web/index?scene=https://s.click.ele.me/qniCyqu',
          money: 36,
          tips: '今日仅剩327个'
        }
      ]

      this.setData({
        fileServerUrl: app.globalData.fileServerUrl,
        banners: banners,
        coupons: coupons,
        users: allUsers.slice(0, 17)
      })

      // 当前展示的用户
      this.changeCurrentUser()
      setInterval(() => {
        this.changeCurrentUser()
      }, 5000)
    },
    // 改变当前展示的用户
    changeCurrentUser() {
      // 获取需展示的用户，排除当前用户
      const currentUser = this.data.currentUser || { id: 0 }
      const nextUser = this.data.users
        .filter(k => k.id !== currentUser.id)
        .sort(function() {
          return (0.5 - Math.random())
        })[0]
      this.setData({
        currentUser: nextUser,
        hideCurrentUser: false
      })

      // 三秒后隐藏
      clearTimeout(this.data.timer)
      this.data.timer = setTimeout(() => {
        this.setData({
          hideCurrentUser: true
        })
      }, 3000)
    },
    getAllureText() {
      const texts = [
        `获得了${Math.ceil(5 + (Math.random() * (20 - 5)))}元饿了么优惠券`, // 5 - 20元优惠券
        `获得了${Math.ceil(5 + (Math.random() * (20 - 5)))}元美团优惠券`, // 5 - 20元优惠券
      ]

      return texts[Math.floor(Math.random() * 2)]
    },
    // banner改变
    onChangeBanner(evt) {
      this.setData({
        currentBannerIndex: evt.detail.current
      })
    },
    // 关闭“添加到我的小程序”的显示状态
    onClickCloseAddTips() {
      this.setData({
        showAddTips: false
      })
    },
    // 领取优惠券
    onGetCoupon(evt) {
      const coupon = this.data.coupons.find(k => k.id == evt.target.id)
      wx.navigateToMiniProgram({
        appId: coupon.appId,
        path: coupon.url,
        success(res) {
          // 打开成功
        }
      })
    },
    // 监听分享事件
    onShareAppMessage(res) {
      return {
        title: app.globalData.share.shareTitle,
        path: app.globalData.share.shareUrl,
        imageUrl: app.globalData.share.shareImageUrl
      }
    }
  }
})
