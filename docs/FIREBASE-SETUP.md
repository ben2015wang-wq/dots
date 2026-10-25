# DOTS 接上 Firebase（多人即時協作＋Google 登入）

## 1. 建立專案
1. 到 https://console.firebase.google.com 建立專案。
2. **Authentication → Sign-in method** 啟用 **Google**。
3. **Firestore Database → 建立資料庫**（正式模式即可）。
4. **專案設定 → 一般 → 你的應用程式 → 新增網頁應用程式**，複製 `firebaseConfig`。

## 2. 貼上安全規則（Firestore → 規則）
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /data/users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /profiles/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /presence/{id}       { allow read, write: if request.auth != null; }
    match /dash/{id}           { allow read, write: if request.auth != null; }
    match /thumbs/{id}         { allow read, write: if request.auth != null; }
    match /b/{board}/{col}/{id} { allow read, write: if request.auth != null; }
  }
}
```
這份規則只要求「有登入」。任何登入的人都能讀寫所有作品；作品的「分享名單」只由頁面本身執行，懂技術的人可以繞過。

## 3. 把設定放進網頁（二選一）
- **寫死在檔案裡（建議，團隊共用）**：用文字編輯器開 `dots-standalone.html`，在最前面的 `<script>` 之前加入
  `<script>window.DOTS_FIREBASE={ apiKey:"…", authDomain:"…", projectId:"…", appId:"…" };</script>`
- **在網頁裡貼**：開啟網頁，左下角帳號按鈕 → 貼上設定 → 儲存並重新載入（只存在那個瀏覽器）。

## 4. 放到網路上
Firebase Hosting：`npm i -g firebase-tools` → `firebase login` → `firebase init hosting`（public 資料夾）→ 把檔案改名 `index.html` 放進去 → `firebase deploy`。
用 Hosting 網域會自動列入「已授權網域」；用自己的網域要到 **Authentication → Settings → 已授權網域** 加入。
不能直接雙擊開檔（file://）登入，Google 登入需要 http(s) 網址。

## 費用與限制
- 免費方案每天約 2 萬次寫入；畫筆或拖曳會連續寫入，頁面已合併為每個物件約 0.35 秒一次，但人多仍可能超過。
- 游標位置每個人每 0.7 秒更新一次，所以對方的游標會稍微卡頓。
- 離線時 Firestore 會把變更存在瀏覽器，連線後自動上傳。
