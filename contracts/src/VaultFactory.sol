// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vault} from "./Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultFactory {
    address public immutable OWNER;
    IERC20 public immutable ASSET;
    address public immutable TREASURY;

    event VaultCreated(address indexed vault, string invoiceNumber, address borrower);

    constructor(address _asset, address _treasury) {
        require(_asset != address(0), "Invalid asset address");
        require(_treasury != address(0), "Invalid treasury address");
        OWNER = msg.sender;
        ASSET = IERC20(_asset);
        TREASURY = _treasury;
    }

    function deployVault(
        string memory invoiceName,
        string memory invoiceNumber,
        address borrower,
        uint256 maxCapacity,
        uint256 maturityDate
    ) external returns (address) {
        require(msg.sender == OWNER, "Not owner");

        string memory name = string(abi.encodePacked(invoiceName, "_", invoiceNumber, "_Vault"));
        string memory symbol = string(abi.encodePacked(invoiceName, "_", invoiceNumber));

        Vault vault = new Vault(name, symbol, ASSET, borrower, maxCapacity, maturityDate, msg.sender, TREASURY);

        emit VaultCreated(address(vault), invoiceNumber, borrower);
        return address(vault);
    }
}
