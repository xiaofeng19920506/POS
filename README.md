# POS 餐饮收银（Web/PWA）

品牌暂定 **POS**，可在「设置」中修改显示名与主题色。

## 快速开始

```bash
npm install
npm run db:setup
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 演示账号（PIN 均为 `1234`）

| 工号 | 角色 |
|------|------|
| 1001 | 店长 |
| 2001 | 收银 |
| 3001 | 服务员 |
| 4001 | 后厨 |

## 功能

- 营业桌台图：状态切换、进桌点餐（SSE 多端同步）
- 桌台布局 CMS：拖放、命名编号、百分比坐标
- 点餐 / 送厨 / 结账 / 打印客单
- 后厨 KDS
- 菜单、员工、日报、品牌设置
- PWA：可「添加到主屏幕」

## 技术栈

Next.js 15 · Prisma · SQLite · Tailwind · JWT 会话
