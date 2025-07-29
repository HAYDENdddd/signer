# 智能合约部署指南

## 配置步骤

### 1. 配置环境变量

编辑 `.env` 文件，填入你的配置信息：

```bash
# 必填：部署用的私钥（不要包含 0x 前缀）
PRIVATE_KEY=your_private_key_here

# 可选：Etherscan API 密钥（用于合约验证）
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# 可选：Infura API 密钥（提供更稳定的 RPC 服务）
INFURA_API_KEY=your_infura_api_key_here
```

### 2. 获取测试 ETH

部署到 Sepolia 测试网需要测试 ETH，可以从以下水龙头获取：
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## 部署方法

### 方法一：使用部署脚本（推荐）

```bash
# 进入 contracts 目录
cd contracts

# 部署到 Sepolia 测试网
./deploy.sh sepolia

# 部署到 Sepolia 并验证合约
./deploy.sh sepolia verify

# 部署到本地网络
./deploy.sh local
```

### 方法二：使用 Forge 命令

```bash
# 部署到 Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --private-key $PRIVATE_KEY --broadcast

# 部署并验证
forge script script/Deploy.s.sol --rpc-url sepolia --private-key $PRIVATE_KEY --broadcast --verify
```

## 部署后操作

1. **查看部署结果**：
   - 部署信息保存在 `broadcast/Deploy.s.sol/` 目录下
   - 查看 `run-latest.json` 文件获取合约地址

2. **更新前端配置**：
   - 复制合约地址到 `frontend/src/config/contracts.ts`
   - 确保前端网络配置包含对应的网络

3. **验证部署**：
   ```bash
   # 测试合约调用
   cast call <CONTRACT_ADDRESS> "name()" --rpc-url sepolia
   ```

## 支持的网络

- `sepolia` - Sepolia 测试网
- `mainnet` - 以太坊主网（谨慎使用）
- `local` - 本地 Anvil 网络

## 故障排除

### 常见错误

1. **私钥未配置**：
   ```
   Error: PRIVATE_KEY not configured in .env file!
   ```
   解决：在 `.env` 文件中设置正确的私钥

2. **余额不足**：
   ```
   Error: insufficient funds for gas * price + value
   ```
   解决：确保账户有足够的 ETH 支付 gas 费用

3. **RPC 连接失败**：
   ```
   Error: error sending request for url
   ```
   解决：检查网络连接或更换 RPC 端点

### 获取帮助

如果遇到问题，可以：
1. 检查 `.env` 文件配置
2. 确认网络连接正常
3. 验证账户余额充足
4. 查看详细的错误日志