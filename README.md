# DOTS

協作白板、文件與簡報。單一檔案 `index.html`，可直接部署到 GitHub Pages。

- 不設定 Firebase：每位訪客使用本機模式（資料存在自己的瀏覽器）。
- 設定 Firebase：Google 登入 + 多人即時協作 + 跨裝置同步。步驟見 [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)。

## 部署到 GitHub Pages
Settings → Pages → Source 選 `main` / root。再到 Firebase 的授權網域加入 `<帳號>.github.io`。

## 重新建置
原始碼在 `src/`，`src/build.py` 會組出 HTML（路徑可能需要依你的環境調整）。

## 注意
目前 Firestore 規則只要求登入；分享名單只由前端執行。公開給陌生人前請先收緊規則。
