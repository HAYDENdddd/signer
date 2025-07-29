// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract HTT is ERC20Permit {
    constructor() ERC20("HTToken", "HTT") ERC20Permit("HTToken") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
