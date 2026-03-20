# SEN 家長實戰指南 — 部署指南

## 專案結構

```
sen-guide/
├── api/
│   └── chat.js          ← Vercel Serverless Function（安全代理）
├── src/
│   ├── main.jsx         ← React 入口
│   └── App.jsx          ← 主程式
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## 安全架構說明

```
瀏覽器 → /api/chat（你的伺服器）→ Anthropic API
         ↑
    API Key 藏在這裡，用戶永遠看不到
```

---

## 部署步驟

### 第一步：安裝工具

確保電腦已安裝 [Node.js](https://nodejs.org)（v18 或以上）和 [Git](https://git-scm.com)。

### 第二步：建立 GitHub 倉庫

1. 登入 [github.com](https://github.com) → 點擊右上角 **+** → **New repository**
2. 名稱填 `sen-guide`，選 **Private**（私人），點 **Create repository**
3. 在電腦終端機執行：

```bash
# 進入專案資料夾
cd sen-guide

# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 連接 GitHub（把 YOUR_USERNAME 換成你的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/sen-guide.git
git branch -M main
git push -u origin main
```

### 第三步：部署到 Vercel

1. 登入 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. 點擊 **Add New → Project**
3. 選擇你剛建立的 `sen-guide` 倉庫
4. Framework Preset 選 **Vite**
5. **暫時不要按 Deploy**，先設定環境變數↓

### 第四步：設定 API Key（最重要！）

在 Vercel 部署頁面，展開 **Environment Variables**：

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-xxxx...`（你的 Anthropic API Key） |

> 你的 API Key 在 [console.anthropic.com](https://console.anthropic.com) → API Keys 找到。

6. 設定好後，點 **Deploy**
7. 等待約 1 分鐘，部署完成後會得到網址，例如 `https://sen-guide.vercel.app`

---

## 日後更新程式

修改程式碼後，只需執行：

```bash
git add .
git commit -m "更新內容"
git push
```

Vercel 會自動重新部署，約 1 分鐘後生效。

---

## 常見問題

**Q：AI 功能沒有反應？**
→ 檢查 Vercel → Settings → Environment Variables，確認 `ANTHROPIC_API_KEY` 已正確設定。

**Q：想換自己的網域？**
→ Vercel → Settings → Domains，按 Add 輸入你的網域，再到域名商設定 DNS 指向 Vercel。

**Q：怎樣控制費用？**
→ 在 [console.anthropic.com](https://console.anthropic.com) → Settings → Limits 設定每月用量上限。
