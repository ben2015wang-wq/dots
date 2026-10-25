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

## 分享連結
作品庫右鍵「分享與權限」或編輯器的分享鈕可複製連結（`#/b/<作品id>`）。設定 Firebase 後，知道連結且登入 Google 的人都可以編輯；選「只有名單」則限制名單內的人。

## 個人工作頁面
登入 Firebase 後，每個人只看到自己的作品與資料夾；別人分享的作品出現在「與我共用」。這是前端區隔，Firestore 規則仍只要求登入。

## 繪圖工具
矩形、圓形、箭頭、直線畫完後會停留在同一工具，可連續繪製；按 Esc 或 V 回到選取。

## 帳號
帳號區固定在作品庫左下角。點開可編輯顯示名稱與頭像（Firebase 模式存在 `profiles/<uid>`，可還原為 Google 資料；本機模式存在瀏覽器）。
