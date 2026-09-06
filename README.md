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

## 部署到 NAS（Docker）

适合 Synology / QNAP / TrueNAS / 任意已装 Docker 的 NAS。

1. 把本仓库放到 NAS（Git 克隆，或拷贝文件）
2. 在项目目录创建 `.env`：

```env
AUTH_SECRET=请换成很长的随机字符串
SEED_ON_START=true
TZ=America/New_York
```

3. 构建并启动：

```bash
docker compose up -d --build
```

4. 浏览器访问：`http://NAS的IP:3000`  
   首次启动会自动建库并写入演示账号（工号 `1001` / PIN `1234`）。

### Synology 提示

- 套件中心安装 **Container Manager**
- 项目文件夹建议：`/volume1/docker/pos`
- 如需固定数据目录，把 `docker-compose.yml` 里的卷改成：

```yaml
volumes:
  - /volume1/docker/pos/data:/data
```

- 若要外网访问：在路由器做端口转发，或走反向代理（Nginx / 群晖反向代理）并建议启用 HTTPS

### 常用命令

```bash
docker compose logs -f      # 看日志
docker compose pull         #（若用镜像仓库时）
docker compose up -d --build  # 更新代码后重建
```

把 `SEED_ON_START` 改为 `false` 可避免以后误触种子逻辑；已写入过的数据目录有 `/data/.seeded` 标记，默认也不会重复清空。
