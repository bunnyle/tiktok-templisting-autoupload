# TikTok Live小助手

在 TikTok LIVE Manager 自動填寫並上架 Temporary listing 的 Tampermonkey 腳本。

## 安裝（只需一次）

1. 在 Chrome 安裝 [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)。
2. 打開 `chrome://extensions` → Tampermonkey →「詳細資料」→ 開啟 **允許使用者指令碼（Allow User Scripts）**。
3. 點這個連結，在 Tampermonkey 彈出的頁面按 **安裝**：

   **👉 [安裝 / 更新腳本](https://raw.githubusercontent.com/bunnyle/tiktok-templisting-autoupload/main/tiktok-templisting-autoupload.user.js)**

4. 打開或刷新 [LIVE Manager](https://shop.tiktok.com/streamer/live/product/dashboard?tool_tab=auction)，左下角出現「一鍵上架」面板就完成了。

## 更新

Tampermonkey 會自動檢查新版本並更新。想馬上更新：點 Tampermonkey 圖示 →「檢查使用者指令碼更新」，或再點一次上面的安裝連結。

## 圖片庫

部分類目要求上傳商品圖片。在「商品庫 → 圖片庫」上傳圖片：
- 上傳時會先彈出**正方形裁剪框**（拖動、放大，按「確定」；或「不裁剪」）。圖片上的 ✂ 可以重新裁剪。
- 點 ★ 設定**預設圖片**：類目要求圖片、商品又沒指定時自動使用。
- 在商品「編輯」裡可以指定每個商品用哪一張圖片（有指定就一定會上傳）。
- 上架時 TikTok 若彈出「Edit image」，會自動按 Done。
- 類目要求圖片但沒有可用的圖片時，該商品會先跳過，最後提示手動處理。

圖片存在瀏覽器裡，「下載完整備份」會一起打包。

## 直播檢測

「直播檢測」分頁 → 按「開始檢測」（直播時保持 LIVE Manager 頁面開著）：
- 畫面下方出現「won!」就記錄：拍賣編號、完整 listing 名稱、客人、成交價、得標時間。
- 得標後指定時間內（預設 3 分鐘），該客人在聊天區的每句留言都連同時間記到這一單；同時可以有很多單在等回覆。
- 聊天區出現「won auction item」時標記為已付款。
- 「匯出 CSV」下載全部記錄。重新整理頁面後會自動繼續檢測。

## 換電腦

舊電腦：商品庫 → 匯入 · 備份 · 工具 →「下載完整備份」。
新電腦：安裝腳本後 →「匯入備份檔」，商品庫、類目庫、圖片庫和設定都會搬過去。
