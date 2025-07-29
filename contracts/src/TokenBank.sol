// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract TokenBank {
    IERC20 public token; // ERC20 Token 合约引用
    IERC20Permit public permitToken; // 支持 permit 方法的引用

    // 每个地址的存款余额
    mapping(address => uint256) public balances;

    // 事件定义
    event Deposit(address indexed user, uint256 amount, string method);
    event Withdraw(address indexed user, uint256 amount);

    constructor(address tokenAddress) {
        token = IERC20(tokenAddress); // ✅ 使用传入参数
        permitToken = IERC20Permit(tokenAddress); // ✅ 支持permit的引用
    }

    // 通过离线签名授权（permit）进行存款
    function permitDeposit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(amount > 0, "deposit amount must be > 0");
        require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");

        // 执行 permit 授权
        permitToken.permit(msg.sender, address(this), amount, deadline, v, r, s);

        // 从用户转账代币
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "deposit failed"
        );

        // 更新余额
        balances[msg.sender] += amount;

        // 触发事件
        emit Deposit(msg.sender, amount, "permit");
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "deposit amount must be > 0");

        bool success = IERC20(address(token)).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "deposit failed");

        balances[msg.sender] += amount;

        // 触发事件
        emit Deposit(msg.sender, amount, "standard");
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "withdraw amount must be > 0");
        require(balances[msg.sender] >= amount, "insufficient balance");

        balances[msg.sender] -= amount;

        bool success = IERC20(address(token)).transfer(msg.sender, amount);
        require(success, "withdraw failed");

        // 触发事件
        emit Withdraw(msg.sender, amount);
    }
}
