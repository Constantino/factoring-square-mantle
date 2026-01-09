// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external returns (MockUSDC) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Mock USDC Deployment Starting ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDC
        MockUSDC mockUSDC = new MockUSDC();
        require(address(mockUSDC) != address(0), "MockUSDC deployment failed");
        require(mockUSDC.owner() == deployer, "MockUSDC owner mismatch");
        require(mockUSDC.decimals() == 6, "MockUSDC decimals mismatch");
        
        // Verify initial mint
        uint256 deployerBalance = mockUSDC.balanceOf(deployer);
        console.log("Deployer initial balance:", deployerBalance / 1e6, "USDC");

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("MockUSDC Address:", address(mockUSDC));
        console.log("Name:", mockUSDC.name());
        console.log("Symbol:", mockUSDC.symbol());
        console.log("Decimals:", mockUSDC.decimals());
        console.log("\nTo use this in your tests, add to .env:");
        console.log("USDC_ADDRESS=", address(mockUSDC));

        return mockUSDC;
    }
}
