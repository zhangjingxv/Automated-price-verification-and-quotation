## 核价报价自动化系统（Automated-price-verification-and-quotation）

面向配置类产品的核价与报价自动化系统，结合 LLM 做智能配置解析，并通过匹配引擎、规则引擎与定价引擎完成端到端报价。

---

## 系统要求

- Node.js >= 18.17（建议 >= 20.5）
- npm >= 10（随 Node 20 安装）
- Docker 与 Docker Compose（本地运行 PostgreSQL）

---

## 架构概览

- **HTTP 层**: `src/index.ts` 启动服务；`src/controllers/quoteController.ts` 暴露报价相关接口。
- **业务编排**: `src/services/quoteService.ts` 组织完整报价链路。
- **智能解析**: `src/services/llmParser.ts` 调用 LLM 将自然语言/非结构化配置解析为结构化数据（建议使用 Zod 校验）。
- **匹配引擎**: `src/services/matchEngine.ts` 将解析结果匹配到产品/料号/规则项。
- **规则引擎**: `src/services/ruleEngine.ts` 计算折扣、优先级与合规规则。
- **定价引擎**: `src/services/pricingEngine.ts` 计算成本、税费、汇率及舍入策略。
- **数据与类型**: `src/data/sampleData.ts`, `src/types/index.ts`。
- **数据库**: `prisma/schema.prisma` 定义模型；迁移与数据浏览见 Prisma 脚本。
- **测试**: `src/test/llmParser.test.ts`, `src/test/setup.ts`（建议补充集成测试）。

---

## 快速开始

1) 安装与初始化

```bash
cd /Users/zhangjingxu/Desktop/Automated-price-verification-and-quotation
cp env.example .env
npm i
npm run db:migrate
```

2) 开发运行

```bash
npm run dev
```

3) 生产构建与启动

```bash
npm run build
npm start
```

4) 测试

```bash
npm test
```

5) 数据库可视化（可选）

```bash
npm run db:studio
```

---

## 环境变量

在 `.env` 中配置：

- `OPENAI_API_KEY`: LLM 访问密钥
- `DATABASE_URL`: Prisma 数据库连接串
- `DEFAULT_CURRENCY`: 默认币种（如 `USD`）
- `LOG_LEVEL`: 日志级别（如 `info`）
- `CACHE_TTL_MS`: 缓存 TTL（毫秒），用于产品/成本/汇率查询

可从 `env.example` 拷贝生成 `.env` 后补充实际值。

---

## 常用脚本（package.json）

- `npm run dev`: 使用 tsx 监听运行 `src/index.ts`
- `npm run build`: TypeScript 编译到 `dist`
- `npm start`: 运行编译后的服务
- `npm test`: 运行 Jest 测试
- `npm run lint`: ESLint 检查
- `npm run db:migrate`: Prisma 迁移
- `npm run db:studio`: 打开 Prisma Studio

---

## 端到端流程（请求 → 报价）

1. 请求到达 Controller（`quoteController.ts`）并进行参数校验（建议使用 Zod）。
2. 交由 `quoteService.ts` 编排：
   - 调用 `llmParser.ts` 将输入解析为结构化配置。
   - 调用 `matchEngine.ts` 将配置映射到产品/料号。
   - 调用 `ruleEngine.ts` 计算折扣与规则命中。
   - 调用 `pricingEngine.ts` 计算最终价格（含汇率、税费、舍入）。
3. 汇总结果并返回标准化响应；将关键步骤与耗时写入日志。

> 提示：实际路由路径与请求体模型以 `src/controllers/quoteController.ts` 为准。

---

## 调试与优化重点

- **环境与依赖**
  - 确保 `.env` 中 `OPENAI_API_KEY` 与 `DATABASE_URL` 已配置；先执行数据库迁移。
  - Jest 使用 `ts-jest` 编译 TS 测试；必要时在 `jest.config.js` 调整。

- **LLM 稳定性**
  - 解析阶段设置 `temperature: 0`，对输出进行严格 JSON Schema（Zod）校验。
  - 增加重试与超时控制；为相同输入做缓存（hash 输入 → 命中直接返回）。

- **匹配与规则可解释性**
  - 打印候选相似度/评分与阈值，保留 Top-N 作为回退路径。
  - 明确规则优先级与短路策略；日志输出命中顺序与前后价格对比。

- **价格一致性**
  - 汇率与税费来源一致且可追溯；折扣与税费的计算顺序固定。
  - 最终价格统一舍入；为极端值、缺项数据做防御式校验。

- **可观测性**
  - 贯穿 `traceId` 的分级日志（Winston），覆盖 LLM、匹配、规则、定价与 DB。
  - 关键阶段记录耗时；区分 4xx（用户错误）与 5xx（系统错误）。

- **测试策略**
  - 单测：`llmParser` 使用固定快照/样例；`matchEngine` 用可重复样本库。
  - 集成：对 Controller 使用 supertest 模拟端到端（可 mock OpenAI）。
  - 回归：沉淀典型配置与边界场景样例（来源于 `data/sampleData.ts`）。

- **性能优化**
  - 对外部调用（OpenAI/DB）增加并发控制与退避重试。
  - 预热与缓存常用规则、映射、汇率；能批处理的尽量批处理。

---

## 数据库与运行指引（更新）

1) 启动数据库与安装依赖

```bash
nvm use 20
cp env.example .env
docker compose up -d db
npm i
```

2) 初始化数据库（二选一）

- 分步执行：
```bash
npx prisma generate
npx prisma migrate dev --name init --create-only
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

- 一键脚本：
```bash
bash scripts/init-db.sh
```

3) 启动服务

```bash
npm run dev
```

---

## API（当前稳定接口）

- POST `/api/quotes`
  - 请求体：
    ```json
    {
      "sku": "SKU-001",
      "quantity": 10,
      "region": "CN",
      "customer": "optional-customer-id",
      "targetCurrency": "USD",
      "at": "2024-01-01T00:00:00.000Z"
    }
    ```
  - 响应体（示例）：
    ```json
    {
      "traceId": "...",
      "data": {
        "sku": "SKU-001",
        "quantity": 10,
        "currency": "USD",
        "unitPrice": "10.00",
        "totalPrice": "100.00",
        "breakdown": {
          "cost": {
            "source": "supplierQuote",
            "currency": "USD",
            "unitCost": "10.0000",
            "quantity": 10,
            "subtotal": "100.0000"
          },
          "ruleAdjustments": []
        }
      }
    }
    ```

---

## 数据库模型（简述）

- `Product`：产品主数据（`sku`, `name`, `baseCurrency`）。
- `SupplierQuote`：供应商成本报价（区域、数量阶梯、生效期），按条件取最优。
- `CostOverride`：客户/区域覆盖价（有效期、原因），优先于供应商报价。
- `ExchangeRate`：汇率快照（`base`, `quote`, `rate`, `date`），取最近且不晚于报价时间。

---

## 后期优化路线图

- **缓存与性能**：成本/汇率查询内存缓存（按 `productId+region+qty`，TTL/主动失效）；批量报价、连接池与限流熔断。
- **规则引擎**：折扣/加价规则表、优先级与短路策略，多维度（客户/区域/SKU），命中审计与可解释性输出。
- **汇率与税费**：定时拉取汇率并失败重试；税费/关税/运费组件化叠加，来源可配置。
- **LLM/解析**：Zod 严格校验、温度 0、重试与裁剪；常见输入缓存与回退策略（模板/规则优先，LLM 兜底）。
- **可观测性与审计**：贯穿 `traceId` 的结构化日志、阶段耗时、错误分级；报价与规则命中入库审计与回放。
- **数据治理与安全**：字典与索引优化、最小权限、敏感字段加密；输入校验/速率限制/鉴权（API key/JWT）。

---

## 故障排查（FAQ）

- Node/npm 版本错误：使用 Node 20（如 `nvm use 20`）。
- 无法连接数据库：确认 `docker compose up -d db` 已启动，`.env` 的 `DATABASE_URL` 正确。
- 迁移失败：检查 `prisma/schema.prisma` 与现有数据；必要时清理本地卷重试。
- 接口无响应：确认服务监听 3000 端口；检查防火墙与端口占用。

---

## 自检清单（建议先跑）

1. 环境就绪
   - 复制 `.env` 并补齐变量；`npm i && npm run db:migrate`。
2. 本地开发
   - `npm run dev` 后用 Postman/curl 调用报价接口（以 Controller 实际路由为准）。
3. 测试
   - `npm test` 通过；补齐关键断言与边界样例。
4. 数据与日志
   - `npm run db:studio` 检查入库；查看日志是否包含 `traceId` 与阶段耗时。

---

## 目录结构（节选）

```
Automated-price-verification-and-quotation/
  - prisma/
    - schema.prisma
  - src/
    - controllers/
      - quoteController.ts
    - services/
      - llmParser.ts
      - matchEngine.ts
      - pricingEngine.ts
      - quoteService.ts
      - ruleEngine.ts
    - data/
      - sampleData.ts
    - test/
      - llmParser.test.ts
      - setup.ts
    - index.ts
```

---

## 备注

- 如需新增接口或修改路由，请同步更新本 README 与测试用例。
- 欢迎补充更多样例数据与端到端测试，确保报价链路稳定与可解释。


