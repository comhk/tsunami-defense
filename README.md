# 海嘯：最後防線 · 半 3D 版

[![Deploy to GitHub Pages](https://github.com/comhk/tsunami-defense/actions/workflows/pages.yml/badge.svg)](https://github.com/comhk/tsunami-defense/actions/workflows/pages.yml)

純 HTML + JS（零依賴、零建置）的 Canvas 塔防遊戲。你要在巨浪來臨前收集物資、建造防線，
用沙包 / 防護林 / 石牆 / 堤壩擋水，用機槍塔 / 火箭炮塔 / 冷凍光線塔主動削弱海嘯，
撐過 5 波即勝利。

## 玩法重點

- **水會流動**：逐格模擬水流，撞到障礙物會損傷它並向斜前方漫流——防線留缺口反而會被繞過。
- **家前水深刻度**超過門檻即失敗，所以防線要「壓密」而不是只堆厚。
- **牆擋水、塔清水**：牆血厚但只能拖時間，單靠牆大約只撐到第 3–4 波；後期要靠塔清水。
- **每波流程**：準備（建造）→ 海嘯（分幾道湧浪從右側注水）→ 退水 → 下一波。
  第 1 波只有一道湧浪，之後每波兩到三道，最大的一道常在第二或第三道。
  湧浪之間停止注水，HUD 倒數下一道湧浪，到達前約 3 秒會出警告。
  最後一道湧浪結束後，水量降到很低即提早完結；否則到時限自動進入退水。塔清水越快，波次越早完結。
- **水流出地圖**：流到最左邊的水會流走，不會堆積在家後面。
- **電力系統**：發電廠供電，塔、垃圾場、回收站、科技中心、超級武器基地都耗電；
  電力不足時回收站收益減半、垃圾場停止生產垃圾車（塔照常運作）。
- **科技樹**：科技中心 → 解鎖超級武器基地 → 建成後可發射軌道離子炮（CD 45 秒）。
- **垃圾車**：垃圾場自動生產垃圾車，自動撿物資箱。

## 操作

| 操作 | 說明 |
|------|------|
| 左鍵 | 建造 / 撿物資箱 / 超級武器確認落點 |
| 右鍵 | 取消當前選擇 |
| `1`–`0`、`T`、`Y` | 建造快速鍵（沙包…回收站、科技中心、超級武器基地）|
| `R` | 超級武器瞄準 |
| `P` / `Space` / ⏸ | 暫停 / 繼續（切換分頁時自動暫停）|
| 滑鼠停留 | 建築按鈕、資源列顯示說明；暫停時可查看地圖上的建築血量、水深、物資箱 |

## 語言 / Language

支援繁體中文與 English。第一次按「開始遊戲」時會詢問語言，之後記住選擇（瀏覽器 `localStorage`）；
開始畫面的「Language / 語言」可隨時切換。所有文字都在 `lang/` 內（`zh-Hant.js`、`en.js`）；新增語言時加一個檔案，並在 `index.html` 加一行 `<script>`。

Traditional Chinese and English are supported. The game asks on the first Start and remembers the choice;
use "Language / 語言" on the start screen to switch. All strings live in `lang/` (`zh-Hant.js`, `en.js`).
| `Esc` | 取消 |

## 執行

直接用瀏覽器打開 `index.html`，或：

```bash
python -m http.server 8000
# http://localhost:8000
```

線上遊玩：<https://comhk.github.io/tsunami-defense/>

## 發佈

每次 push 到 `main`，GitHub Actions（`.github/workflows/pages.yml`）會自動把 `index.html` 與 `lang/` 發佈到 GitHub Pages。
只發佈遊戲本身，`docs/`、`.scratch/` 不會公開。

## 結構

```
index.html   # 全部遊戲邏輯、渲染、UI（Canvas 2D，半 3D 等角擠出繪製）
lang/        # 語言檔（繁體中文、English）
docs/        # 遊戲研究筆記、agent 設定
.scratch/    # 本地 issue（markdown）
.github/     # GitHub Pages 自動發佈 workflow
```

## 參數速查（改數值就喺 `index.html` 頂部）

- `COLS / ROWS`：地圖 32 × 16 格
- `DEFS`：所有建築的名稱、成本、HP、高度、快捷鍵
- `DEFS` 塔的 `range` / `dmg` / `cd`：射程、每發清水量（冷凍光線為每秒）、冷卻秒數
- `WAVES`：5 波的速度 / 準備秒數 / `pulses` 湧浪列表；每道湧浪 `{ at, dur, power }` 為開始進度、注水長度、強度（注水速率倍數；>1 時右邊緣注水上限由 92% 提高，最多至滿水深）。進度 = 遊戲時間 × 速度。最後一道湧浪結束前波次不會完結
- `BAY_PEAK` / `BAY_FLOOR` / `BAY_WIDTH`：海灣。由第 2 波起，每波的注水集中在以隨機一列為中心的平滑隆起：中心列倍率約 ×1.5（`BAY_PEAK` 為上限），遠離的列約 ×0.7（`BAY_FLOOR` 為下限），`BAY_WIDTH` 為隆起寬度（列）；整組倍率平均為 1，所以每波總水量不變。第 1 波平坦（每列 ×1.0）。右邊緣每列強度 = 湧浪強度 × 該列倍率，同時決定注水速率與注水上限。每局開局時抽一個種子，以小型可設種子亂數得出每波海灣，所以每局位置不同，湧浪時間與強度則固定
- `START_MATS` / `BASE_INCOME`：開局材料、準備階段每秒收入
- `SUPER`：超級武器 CD 與半徑
- `FLOW_INTERVAL`：水流模擬步長（數值越細越平滑但越貴）
- `FLOW_RATE`：每步流向下一格的水量比例
- `TSUNAMI_MAX`：最後一道湧浪結束後最多再等的進度
- `SEEP_KEEP` / `DRAIN_KEEP`：湧浪之間及之後 / 退水階段每秒保留的水量比例
- `LOSE_DEPTH`：家前失敗水深

MIT License
