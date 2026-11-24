# 授權伺服器（Cloudflare Workers + D1，免費方案）

月費 / 買斷授權碼、每個碼最多 10 台設備、免費版 1 個 listing／天且鎖定評論區功能。

## 一次性部署（約 10 分鐘，不需要信用卡）
1. 註冊 https://dash.cloudflare.com （免費）。電腦裝 Node.js，在本資料夾執行 `npm i -g wrangler && wrangler login`。
2. 建資料庫：`wrangler d1 create ttf-license` → 把輸出的 `database_id` 貼進 `wrangler.toml`。
3. 建表：`wrangler d1 execute ttf-license --remote --file=schema.sql`
4. 產生簽名金鑰：`node gen-keys.mjs`
   - 私鑰：`wrangler secret put SIGN_KEY`（貼上私鑰那一行）。**私鑰絕不要放進 GitHub**。
   - 公鑰：留給下一步。
5. 管理密碼：`wrangler secret put ADMIN_KEY`（自己想一個長密碼）。
6. 生成發佈版腳本並部署：
   ```
   node build-release.mjs https://ttf-license.<你的子域>.workers.dev '<公鑰那一行>' --obfuscate
   wrangler deploy
   ```
   客人安裝網址：`https://ttf-license.<你的子域>.workers.dev/ttf.user.js`（Tampermonkey 會自動跳出安裝頁，之後自動更新）。

## 發授權碼
```
export TTF_API=https://ttf-license.<你的子域>.workers.dev  TTF_ADMIN=<ADMIN_KEY>
./admin.sh create monthly 30 5 "10月客人"   # 月費碼，30 天，5 個（首次啟用才開始計時）
./admin.sh create lifetime 0 1 "買斷 張三"  # 買斷碼
./admin.sh list                              # 全部授權碼、到期日、使用中設備數
./admin.sh extend CODE 30                    # 續費加 30 天
./admin.sh revoke CODE                       # 停用（退款/濫用）
./admin.sh kick CODE                         # 清空所有設備名額
```

## 運作方式
- TikTok 頁面的 CSP 擋掉所有外部連線，所以腳本用「彈出小視窗 → 授權伺服器 → 把簽名令牌傳回腳本」。令牌用公鑰離線驗證，**48 小時有效**；剩不到 24 小時時，客人下一次點擊會自動彈出一個 1 秒的小窗續期。
- 設備名額 = 最近 48 小時內續期過的設備。第 11 台會被拒絕，可在舊設備按「解除此設備」立即釋放，或等 48 小時。
- 免費版：每天 1 個 listing（以本機日期計），評論窗、置頂小窗、自動公告被鎖。
- 免費額度（Cloudflare）：Workers 10 萬請求／天、D1 寫入 10 萬行／天。每台設備每天約 1–2 次請求，足夠數千台設備。

## 轉私有倉庫
1. 先完成上面部署，並確認 `…/ttf.user.js` 能在 Tampermonkey 安裝。
2. 通知現有用戶改用新安裝網址（舊的 GitHub 網址轉私有後會失效，舊版腳本不會再收到更新）。
3. GitHub → Settings → Danger Zone → Change visibility → Private。
之後每次更新：改腳本 → `node build-release.mjs … --obfuscate` → `wrangler deploy`。

> 提醒：瀏覽器端腳本的限制無法做到 100% 防破解（有技術的人可以改掉判斷）。混淆 + 簽名令牌 + 每日續期已能擋住一般用戶分享。
