# 全局CSS导入

## 简介

向页面中储存 CSS 规则, 打开对应网站的时候会自动添加自定义的 CSS 规则到页面上.



### 按钮 - 修改CSS

点击页面后, 页面中心会出现一个弹窗, 有两个输入框:

![image.png](https://scriptcat.org/api/v2/resource/image/WBPX6Ygr792YKdEk)

**当前页面CSS**

上面的大输入框是即将载入页面的 CSS 文本, 语法内容和正常 CSS 样式文件一样输入.

> - 输入内容后, 离开文本框之后, 会显示 CSS 语法高亮.
> - 需要点击 "保存" 按钮之后, 内容才会保存并载入页面.

**快速隐藏元素**

下面的输入框 **"快速隐藏元素"** 是上面的补充, 在里面输入 CSS 选择器之后, 点击 "确定" 按钮或者按下 Enter , 可以快速将该元素添加到上面的 CSS 内容, 并添加上隐藏样式 `{display: none !importtant;}`.

比如, 在 "**快速隐藏元素**" 输入框输入 `.test` , 点击 "确认" 之后, 在上面的 **当前页面CSS** 输入框的最后会新增一行文本: `.test {display: none !importtant;}`



## 示例

### 屏蔽元素

> 这里以屏蔽B站的UP主发的淘宝广告为例.

> ![04.jpg](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025915aiibn21a82wwkcbc.jpg)

通过开发者工具找到B站动态的每一个动态都是一个 `.bili-dyn-list__item` 容器, 有广告的动态就有淘宝的链接图标, 再往下找就能找到淘宝图标用的是一个 `.goods.icon--taobao` 元素.

所以包含广告的动态卡片的选择器是: `.bili-dyn-list__item:has(.goods.icon--taobao)`.

![image.png](https://scriptcat.org/api/v2/resource/image/vTZxc4lt2o7jS8Ty)



### 改变页面CSS布局

由于本质上就是往页面中写入 CSS  , 所以改页面布局也是可以的, 这里简单说明一下.

> 还是以B站动态为例. 在某个版本之后进入UP主主页之后的动态下的按钮会是一个两端对齐的状态, 不如之前的都是居左按钮的方便, 所以将其改回居左的状态.

> ![02.png](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025721ylp8hhchpyysrvij.png)

首先找到底部按钮对应的 `div` 容器 `.bili-dyn-item__footer` , 然后看到原有的属性是:

```css
.bili-dyn-item__footer {
    display: -ms-flexbox;
    display: flex;
    height: 50px;
    -ms-flex-pack: justify;
    justify-content: space-between;
    padding-right: 20px;
}
```

这里需要将 `justify-content: space-between;` 属性覆盖掉变成 `justify-content: left;`, 所以我们写入的 CSS 规则优先级稍微比原来高一些即可.

所以输入 `div.bili-dyn-item__footer {justify-content: left;}`, 所有的动态按钮就都会居左了.

![image.png](https://scriptcat.org/api/v2/resource/image/HOPizSc4iVjOlW7l)

> ![03.png](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025731djj5578faz4h285z.png)

同理, 只要是页面布局, 只要优先级能够覆盖掉原来的样式所有的页面都可以改.

~~(全部使用 `!important` 强制覆盖也不是不行)~~


## 许可证

[GPL-3](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html)



## 问题反馈

如有问题或建议，请联系：

- 邮箱: aluibyiero@qq.com
- Github Issue: https://github.com/AliubYiero/Yiero_WebScripts/issues

**功能增加模板**

```
脚本名称: 全局CSS导入
脚本版本: [如 0.6.0]
需要的新功能:
[...]
```

**Bug提交模板**

```
脚本名称: 全局CSS导入
脚本版本: [如 0.6.0]
使用的浏览器及其版本: [如 Google Chrome 版本 142.0.7444.61（正式版本） （64 位）]

出现的问题:
[...]

重现步骤:
1.
2.
3.

补充(如报错截图):
```
