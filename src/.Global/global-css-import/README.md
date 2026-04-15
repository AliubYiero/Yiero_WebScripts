# 全局CSS导入

向页面中储存 CSS 规则，打开对应网站的时候自动添加自定义 CSS 规则到页面上。

## 功能特性

- **CSS 编辑**：支持语法高亮的 CSS 代码编辑器
- **快速隐藏元素**：输入 CSS 选择器即可快速隐藏页面元素
- **实时预览**：点击"应用"按钮即可预览效果，无需关闭对话框
- **自动加载**：保存的 CSS 会在匹配的网站自动生效


## 使用方法

### 打开编辑面板

点击页面上的悬浮按钮，页面中心会弹出编辑对话框。

![image.png](https://scriptcat.org/api/v2/resource/image/WBPX6Ygr792YKdEk)


### 当前页面 CSS

上方的大输入框用于输入自定义 CSS 规则，语法与标准 CSS 文件相同。

- 输入内容后，离开文本框会自动显示 CSS 语法高亮
- 点击"应用"按钮保存并预览，不关闭对话框
- 点击"保存"按钮保存并关闭对话框
- 点击"取消"按钮放弃修改并关闭对话框


### 快速隐藏元素

下方的"快速隐藏元素"输入框是快捷功能，输入 CSS 选择器后点击"确认"按钮或按 Enter 键，即可将该元素添加到 CSS 内容中并自动添加隐藏样式。

**示例**：

在"快速隐藏元素"输入框输入 `.test`，点击"确认"后，上方 CSS 输入框会自动追加一行：

```css
.test {display: none !important;}
```



## 使用示例

### 示例一：屏蔽元素

以屏蔽 B 站动态中的淘宝广告为例：

![04.jpg](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025915aiibn21a82wwkcbc.jpg)

通过开发者工具分析，B 站动态的每一条都是一个 `.bili-dyn-list__item` 容器，带有广告的动态包含淘宝链接图标，其图标使用 `.goods.icon--taobao` 元素。

因此，包含广告的动态卡片选择器为：

```css
.bili-dyn-list__item:has(.goods.icon--taobao) {display: none !important;}
```

![image.png](https://scriptcat.org/api/v2/resource/image/vTZxc4lt2o7jS8Ty)


### 示例二：改变页面布局

由于本质上是向页面注入 CSS，因此可以修改页面布局。以下以 B 站动态为例：

某个版本后，UP 主主页动态的底部按钮变为两端对齐，不如之前的居左布局方便，可将其改回：

![02.png](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025721ylp8hhchpyysrvij.png)

首先找到底部按钮对应的 `div` 容器 `.bili-dyn-item__footer`，原有样式为：

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

将 `justify-content: space-between;` 覆盖为 `justify-content: left;`，写入优先级稍高的 CSS 规则：

```css
div.bili-dyn-item__footer {
    justify-content: left;
}
```

![image.png](https://scriptcat.org/api/v2/resource/image/HOPizSc4iVjOlW7l)

![03.png](https://bbs.tampermonkey.net.cn/data/attachment/forum/202403/25/025731djj5578faz4h285z.png)

同理，只要优先级足够覆盖原样式，任何页面布局都可以修改。

> 提示：必要时可使用 `!important` 强制覆盖。


## 许可证

本项目采用 [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html) 开源许可证。


## 问题反馈

如有问题或建议，欢迎通过以下方式联系：

- **邮箱**：aluibyiero@qq.com


- **GitHub Issues**：https://github.com/AliubYiero/Yiero_WebScripts/issues


### 反馈模板

**功能请求**

```text
脚本名称: 全局CSS导入
脚本版本: [如 0.6.0]
需要的新功能:
[...]
```

**Bug 报告**

```text
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
