# 潮泰佛 Chill Thai Amulet

正宗泰國佛牌網路商店 — 可直接部署到 Netlify。

## 功能

- 🏠 首頁精選佛牌
- 📿 佛牌目錄（分類篩選、搜尋）
- 🛒 詢價清單（類似購物車，導向 LINE）
- 📄 關於我們 / 聯絡我們
- ⚙️ 後台管理（新增 / 編輯 / 刪除佛牌）

## 快速部署到 Netlify

1. 把整個 `chill-thai-amulet` 資料夾推到 GitHub
2. 到 [Netlify](https://app.netlify.com) → Add new site → Import from Git
3. 選擇 repo，Build settings 保持預設（靜態網站，不用 build command）
4. Publish directory 設為 `/`（或專案根目錄）
5. Deploy！

或直接拖曳整個資料夾到 Netlify Drop：https://app.netlify.com/drop

## 後台使用方式

1. 開啟網站後點右上角「後台」或直接進 `/admin/`
2. 可新增、編輯、刪除佛牌
3. **資料存在瀏覽器 localStorage**（示範用）
4. 正式上線建議：
   - 匯出 JSON → 覆蓋 `data/products.json` → 重新部署
   - 或改用 [Decap CMS](https://decapcms.org/)（原 Netlify CMS）接 Git

## 需要你自己改的地方

| 項目 | 檔案位置 | 說明 |
|------|----------|------|
| LINE ID | `js/app.js`、`contact.html` | 搜尋 `yourlineid` 換成你的 |
| 聯絡資訊 | 各頁 footer、contact.html | LINE / IG / Email |
| 佛牌圖片 | 後台或 `data/products.json` | 建議用自己的圖床或 Cloudinary |
| Logo | 目前用 emoji 📿 | 可換成圖片 |

## 自訂 Logo

目前 Logo 是金色圓形 + 📿 emoji。  
若要換成圖片：

1. 把 logo.png 放到 `images/logo.png`
2. 修改各 HTML 的 `.logo-icon` 部分為：
   ```html
   <img src="images/logo.png" alt="潮泰佛" style="width:42px;height:42px;border-radius:50%">
   ```

## 技術

- 純 HTML / CSS / JS（無框架）
- 響應式設計，手機友善
- 深色主題 + 金色強調色

---

有問題歡迎再問！
