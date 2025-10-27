# Stock All - 股票買賣力道分析平台

台灣股票即時分析工具，提供一鍵計算買賣力道、產業分類檢視等功能。

## 功能特色

- 🔍 **股票搜尋**：快速搜尋個股資訊
- 📊 **力道計算**：自動計算買賣壓力指標
- 🏭 **產業分類**：依產業類別瀏覽股票
- 📈 **圖表視覺化**：使用 Highcharts 呈現股價走勢

## 技術棧

- **Frontend**: Next.js 12, React 18
- **State Management**: Redux
- **UI Framework**: Bootstrap 5, Tailwind CSS
- **Charts**: Highcharts
- **Data Source**: FinMind API

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置專案

```bash
npm run build
npm start
```

### 部署到 GitHub Pages

```bash
npm run export
npm run deploy
```

## 專案結構

```
stock_all/
├── components/         # React 元件
│   ├── CategoriesList/ # 產業分類列表
│   ├── Layout/         # 頁面佈局
│   ├── Nav/            # 導航列
│   ├── Stock/          # 股票卡片
│   └── ...
├── pages/              # Next.js 頁面
│   ├── index.js        # 首頁
│   └── category.js     # 分類頁
├── lib/                # 工具函式
│   ├── api/            # API 請求
│   ├── redux/          # Redux store
│   └── presureCalculate.js # 力道計算邏輯
└── styles/             # 樣式文件
```

## License

MIT
