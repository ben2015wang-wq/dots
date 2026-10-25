# DOTS

協作白板、文件與簡報。建置後是單一檔案 `index.html`（加上 PWA 檔案），部署到 GitHub Pages。

- 不設定 Firebase：每位訪客使用本機模式（資料存在自己的瀏覽器）。
- 設定 Firebase：Google 登入 + 多人即時協作 + 跨裝置同步。步驟見 [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md)。

## 專案結構
```
src/            原始碼（修改這裡）
  build.py        建置腳本
  pre.html, body.html, dots.html   頁面骨架
  dash.new.js, dash.css            作品庫
  parts/*.js, dots.css             編輯器（白板、文件、簡報）
  shim.js                          獨立版執行環境（本機儲存、Firebase、AI）
  pwa/                             PWA 檔案：manifest、離線 service worker、圖示、隱私權政策、服務條款
  assets/                          標誌與圖示資料
firestore.rules   Firestore 安全規則
tests/smoke.py    建置後的煙霧測試
docs/             設定說明
.github/workflows 自動建置與部署
```

## 本機建置
```
python src/build.py --out dist      # 產生 dist/index.html 與 PWA 檔案
python tests/smoke.py dist          # 煙霧測試（需要 pip install playwright）
```
開發時也可以直接執行 `python src/build.py`，會在 `src/` 旁產生 `standalone.html`。

## 自動部署（GitHub Actions）
每次推送到 `main`：
1. `CI`：檢查 JavaScript 語法、建置、用瀏覽器跑煙霧測試。
2. `Deploy to GitHub Pages`：建置後自動發布到 GitHub Pages。

**第一次要做的設定（只需一次）：** 到 repo 的 Settings → Pages → Build and deployment → Source，選 **GitHub Actions**。之後根目錄的 `index.html`（舊的手動版本）就不會再被使用，可以刪除。
再到 Firebase 的授權網域加入 `<帳號>.github.io`。

## 安全規則
`firestore.rules` 在伺服器端限制每個作品的存取。發布前請先閱讀 [docs/FIREBASE-SETUP.md](docs/FIREBASE-SETUP.md) 的順序與驗證步驟。

## PWA 與上架
網站可安裝成 App（離線可開啟）。要上架 Google Play 可用 TWA 包裝；上架前請先在 `src/pwa/privacy.html` 與 `terms.html` 填入聯絡信箱。

## AI 分析
每位使用者自行設定自己的 AI（Anthropic、OpenAI、Gemini、自訂端點，或在裝置上執行的本機模型）。金鑰只存在使用者自己的瀏覽器。

## 分享連結
作品庫右鍵「分享與權限」或編輯器的分享鈕可複製連結（`#/b/<作品id>`）。連結模式有三種：知道連結的人可編輯、知道連結的人僅能檢視、關閉連結（只有名單內的人）。

## 個人工作頁面
登入 Firebase 後，每個人只看到自己的作品與資料夾；別人分享的作品出現在「與我共用」。部署 `firestore.rules` 後，這個區隔也由伺服器強制執行。星號與垃圾桶是每個人各自一份，不會影響別人。

## 繪圖工具
矩形、圓形、箭頭、直線畫完後會停留在同一工具，可連續繪製；按 Esc 或 V 回到選取。

## 帳號
帳號區固定在作品庫左下角。點開可編輯顯示名稱與頭像（Firebase 模式存在 `profiles/<uid>`，可還原為 Google 資料；本機模式存在瀏覽器）。

## 使用者區與即時在線
編輯器的使用者區在左下角（頁面列上方），顯示自己與目前在線的人，點對方頭像可跳到他的游標。作品庫在手機寬度（≤800px）時，帳號改成左下角浮動按鈕。

## 誰正在編輯
別人選取或編輯的物件，會在你的畫面上框起來並標示名字（「選取中」／「正在編輯」）。作品庫的卡片上也會顯示目前有誰開著這個作品。
