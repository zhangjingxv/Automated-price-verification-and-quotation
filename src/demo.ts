import express from 'express';
import cors from 'cors';

// 演示数据
const sampleSkuCatalog = [
  {
    sku: 'CHASSIS-DL380-G10',
    category: 'Chassis',
    brand: 'HP',
    model: 'DL380 Gen10',
    cost: 8000,
    currency: 'CNY'
  },
  {
    sku: 'CPU-XEON-4214',
    category: 'CPU',
    brand: 'Intel',
    model: 'Xeon Silver 4214',
    cost: 3500,
    currency: 'CNY'
  },
  {
    sku: 'MEM-DDR4-32GB-3200',
    category: 'Memory',
    brand: 'Samsung',
    model: 'DDR4-3200',
    cost: 1200,
    currency: 'CNY'
  },
  {
    sku: 'STORAGE-SAS-900GB-10K',
    category: 'Storage',
    brand: 'Seagate',
    model: 'Constellation ES.3',
    cost: 800,
    currency: 'CNY'
  }
];

const aliasMap: Record<string, string> = {
  'DL380 G10': 'CHASSIS-DL380-G10',
  'DL380 Gen10': 'CHASSIS-DL380-G10',
  '惠普DL380': 'CHASSIS-DL380-G10',
  '4214': 'CPU-XEON-4214',
  'Xeon 4214': 'CPU-XEON-4214',
  '至强4214': 'CPU-XEON-4214',
  '32G内存': 'MEM-DDR4-32GB-3200',
  '32GB内存': 'MEM-DDR4-32GB-3200',
  '900G SAS': 'STORAGE-SAS-900GB-10K',
  '900G硬盘': 'STORAGE-SAS-900GB-10K'
};

// 匹配引擎
function simpleMatch(rawText: string) {
  const matches: any[] = [];
  const words = rawText.split(/[\s,，;；]+/);
  
  for (const word of words) {
    if (aliasMap[word]) {
      const sku = sampleSkuCatalog.find(s => s.sku === aliasMap[word]);
      if (sku) {
        matches.push({
          raw: word,
          sku: sku.sku,
          category: sku.category,
          brand: sku.brand,
          model: sku.model,
          cost: sku.cost,
          confidence: 0.9
        });
      }
    }
  }
  
  return matches;
}

// 定价引擎
function simplePricing(matches: any[], margin: number = 0.15) {
  return matches.map(match => ({
    ...match,
    sellUnit: match.cost * (1 + margin),
    sellTotal: match.cost * (1 + margin),
    explain: '应用 ' + (margin * 100).toFixed(0) + '% 毛利'
  }));
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    message: '核价报价自动化系统演示版运行正常'
  });
});

// 解析接口
app.post('/api/parse', (req, res) => {
  try {
    const { rawText } = req.body;
    
    if (!rawText) {
      return res.status(400).json({
        success: false,
        error: 'rawText is required'
      });
    }

    const items = rawText.split(/[\s,，;；]+/).map((item: string) => ({
      raw: item.trim(),
      category: 'Unknown',
      qty: 1,
      attrs: {},
      confidence: 0.5,
      evidence: '简单解析'
    }));

    res.json({
      success: true,
      data: { items },
      message: '配置解析成功（演示版）'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '解析失败'
    });
  }
});

// 匹配接口
app.post('/api/match', (req, res) => {
  try {
    const { rawText } = req.body;
    
    if (!rawText) {
      return res.status(400).json({
        success: false,
        error: 'rawText is required'
      });
    }

    const matches = simpleMatch(rawText);

    res.json({
      success: true,
      data: matches,
      message: 'SKU匹配完成（演示版）'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '匹配失败'
    });
  }
});

// 报价构建接口
app.post('/api/build-quote', (req, res) => {
  try {
    const { rawText, customerTier = 'standard' } = req.body;
    
    if (!rawText) {
      return res.status(400).json({
        success: false,
        error: 'rawText is required'
      });
    }

    const matches = simpleMatch(rawText);
    const margin = customerTier === 'premium' ? 0.25 : 0.15;
    const pricedItems = simplePricing(matches, margin);
    
    const totalCost = pricedItems.reduce((sum, item) => sum + item.cost, 0);
    const totalSell = pricedItems.reduce((sum, item) => sum + item.sellTotal, 0);
    const totalGp = totalSell - totalCost;
    const totalGpPercent = totalCost > 0 ? totalGp / totalCost : 0;

    res.json({
      success: true,
      data: {
        quoteId: 'DEMO-' + Date.now(),
        summary: {
          totalLines: pricedItems.length,
          totalCost,
          totalSell,
          totalGp,
          totalGpPercent,
          customerTier,
          margin: margin * 100 + '%'
        },
        lines: pricedItems,
        audit: {
          autoMatched: matches.length,
          manualReview: 0,
          unmatched: 0,
          rulesApplied: 0,
          warnings: []
        }
      },
      message: '报价构建完成（演示版）'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '报价构建失败'
    });
  }
});

// 获取SKU目录
app.get('/api/skus', (req, res) => {
  res.json({
    success: true,
    data: sampleSkuCatalog,
    message: 'SKU目录获取成功'
  });
});

// 获取别名映射
app.get('/api/aliases', (req, res) => {
  res.json({
    success: true,
    data: aliasMap,
    message: '别名映射获取成功'
  });
});

app.listen(port, () => {
  console.log('🚀 核价报价自动化系统演示版启动成功!');
  console.log('📍 服务地址: http://localhost:' + port);
  console.log('🔧 环境: 演示版');
  console.log('📊 健康检查: http://localhost:' + port + '/health');
  console.log('📝 API接口: http://localhost:' + port + '/api');
  console.log('');
  console.log('🧪 测试命令:');
  console.log('curl -X POST http://localhost:' + port + '/api/build-quote \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"rawText": "DL380 G10, Xeon 4214, 32G内存 × 4, 900G SAS硬盘 × 6"}\'');
  console.log('');
  console.log('📚 更多信息请查看 README.md');
});
