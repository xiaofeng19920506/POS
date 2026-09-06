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

## 飞牛 NAS（fnOS）部署步骤

飞牛桌面打开 **Docker** → 左侧 **Compose**。

### 1. 准备目录

在文件管理里建（名称建议英文）：

- `Docker/pos` — 放项目代码
- `Docker/pos/data` — 放数据库

右键 `pos` 文件夹看**属性**，记下绝对路径（常见类似 `/vol1/1000/Docker/pos`，以你机器为准）。

### 2. 放入代码

任选其一：

- **SSH**（推荐）：

```bash
cd /vol1/1000/Docker   # 改成你的路径
git clone https://github.com/xiaofeng19920506/POS.git pos
cd pos
mkdir -p data
```

- 或在电脑下载仓库 ZIP，解压内容放进 `Docker/pos`（需包含 `Dockerfile`、`package.json`、`src` 等，不能只放一个 yml）。

### 3. 写环境变量

在 `Docker/pos` 下新建文件 `.env`：

```env
AUTH_SECRET=换成很长的随机字符串
SEED_ON_START=true
TZ=America/New_York
```

### 4. 改数据目录映射

编辑 `docker-compose.fnos.yml`，把卷路径改成你的真实路径，例如：

```yaml
- /vol1/1000/Docker/pos/data:/data
```

### 5. 用 Compose 启动

**方式 A — 飞牛界面**

1. Docker → Compose → **新增项目**
2. 名称：`pos`
3. 路径：选 `Docker/pos` 这个文件夹
4. 若界面要求 compose 文件：选已有的 `docker-compose.fnos.yml`，或把内容复制进去  
   （若界面固定读 `docker-compose.yml`，可把 `docker-compose.fnos.yml` 改名为 `docker-compose.yml`，并改好里面的 `/data` 映射）
5. 勾选创建后启动 → 等待**本地构建**（第一次可能较久，要下载 Node 并编译）

**方式 B — SSH**

```bash
cd /vol1/1000/Docker/pos
docker compose -f docker-compose.fnos.yml up -d --build
```

### 6. 访问

浏览器打开：`http://飞牛的局域网IP:3000`  
演示账号：工号 `1001`，PIN `1234`

平板/iPad 用同一 WiFi，把该地址「添加到主屏幕」即可当 PWA 用。

### 飞牛注意点

- 必须用**完整源码 + build**，不能只贴一个镜像名（当前仓库尚未发布到 Docker Hub）。
- 构建吃内存：建议 NAS 可用内存 ≥ 4GB；失败时先停掉其它容器再构建。
- 端口 `3000` 若冲突，把 compose 里改成 `"3080:3000"`，访问时用 `3080`。
- 更新代码：`git pull` 后再 `docker compose -f docker-compose.fnos.yml up -d --build`。
