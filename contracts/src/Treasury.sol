// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Treasury
 * @notice Contract to collect and manage protocol fees from loan repayments
 * @dev Fees are collected as a percentage of loan repayments and can be withdrawn by the owner
 */
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The USDC token used for fee collection
    IERC20 public immutable ASSET;

    /// @notice Total fees collected by the treasury
    uint256 public totalFeesCollected;

    /// @notice Emitted when fees are deposited to the treasury
    event FeeDeposited(address indexed from, uint256 amount, uint256 totalCollected);

    /// @notice Emitted when the owner withdraws fees
    event FeeWithdrawn(address indexed to, uint256 amount);

    /**
     * @notice Constructor to initialize the treasury
     * @param _asset The address of the USDC token contract
     * @param _owner The address of the treasury owner (admin)
     */
    constructor(address _asset, address _owner) Ownable(_owner) {
        require(_asset != address(0), "Invalid asset address");
        ASSET = IERC20(_asset);
    }

    /**
     * @notice Deposit fees to the treasury
     * @dev Called by vault contracts when borrowers repay loans
     * @param amount The amount of fees to deposit
     */
    function depositFee(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer fees from sender to treasury
        ASSET.safeTransferFrom(msg.sender, address(this), amount);

        // Update total fees collected
        totalFeesCollected += amount;

        emit FeeDeposited(msg.sender, amount, totalFeesCollected);
    }

    /**
     * @notice Withdraw fees from the treasury
     * @dev Only the owner can withdraw fees
     * @param amount The amount to withdraw
     * @param recipient The address to send the withdrawn fees to
     */
    function withdraw(uint256 amount, address recipient) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient address");
        require(ASSET.balanceOf(address(this)) >= amount, "Insufficient balance");

        ASSET.safeTransfer(recipient, amount);

        emit FeeWithdrawn(recipient, amount);
    }

    /**
     * @notice Get the current balance of the treasury
     * @return The current USDC balance
     */
    function balance() external view returns (uint256) {
        return ASSET.balanceOf(address(this));
    }

    /**
     * @notice Withdraw all fees from the treasury
     * @dev Convenience function to withdraw entire balance
     * @param recipient The address to send the withdrawn fees to
     */
    function withdrawAll(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");

        uint256 currentBalance = ASSET.balanceOf(address(this));
        require(currentBalance > 0, "Treasury is empty");

        ASSET.safeTransfer(recipient, currentBalance);

        emit FeeWithdrawn(recipient, currentBalance);
    }
}
