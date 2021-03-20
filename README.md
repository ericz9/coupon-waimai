# 美团饿了么外卖优惠券小程序

#### 效果预览:
![外卖好券天天领](https://github.com/ericz9/coupon-waimai/raw/master/assets/images/qrcode-simple.jpg)

# 开始使用
导入到微信开发者工具即可

# 常见问题

## 注册美团联盟
美团联盟个人无法注册，可以挂靠在企业帐号下（也可以联系我挂靠）

## 注册淘宝联盟
[查看注册教程](http://mp.weixin.qq.com/s?__biz=MzIyOTEwNTkwMQ==&mid=100000638&idx=1&sn=d80803a5415b960e559e67f4e4bcb2de&chksm=68468afc5f3103ead9bcfb5060d554bf55d69e2b5a0980bf4eb8263e2ff3b01b8bc0fd15fc77#rd)

## 如何获取<饿了么天天领大红包>活动的链接
![饿了么天天领红包](https://github.com/ericz9/coupon-waimai/raw/master/assets/images/ele.jpg)

将复制的链接，替换index.js文件中，id为2的coupons对象的url值
```
{
  id: 2,
  title: '饿了么天天领大红包',
  channel: 'ele',
  appId: 'wxece3a9a4c82f58c9',
  url: 'ele-recommend-price/pages/guest/index?inviterId=f2ddb01',
  money: 20,
  tips: '今日仅剩232个'
}
```

## 如何获取<饿了么专享66元红包>、<饿了么吃货联盟36元红包>活动的链接
* <饿了么专享66元红包>活动ID：20150318020002192
* <饿了么吃货联盟36元红包>活动ID：20150318020002597

前往[淘宝开放平台](https://open.taobao.com/docV3.htm?docId=1&docType=15)进行转链，转链对应的api是[taobao.tbk.activity.info.get](https://open.taobao.com/api.htm?docId=48340&docType=2&scopeId=18294)

请求后，将返回的`wx_miniprogram_path`值，替换到对应的url值中

# 多级分销版本，全额返佣！无需开发，10分钟上线！

#### 效果预览:
![外卖小多](https://github.com/ericz9/coupon-waimai/raw/master/assets/images/qrcode-saas.jpg)

#### 联系我开通:
微信（qian_z）