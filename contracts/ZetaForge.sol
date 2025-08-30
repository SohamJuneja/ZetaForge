// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

contract ZetaForge is UniversalContract, ERC721 {
    address public owner;
    uint256 public nftIdCounter;

    constructor() ERC721("ZetaForge Creations", "ZFC") {
        owner = msg.sender;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override {
        // --- THIS IS THE CORRECTED LINE ---
        // We get the sender's address from context.sender and convert it from 'bytes' to 'address'.
        // abi.decode is the standard, safe way to perform this conversion.
        forgeNFT(abi.decode(context.sender, (address)));
        // ------------------------------------
    }

    function forgeNFT(address recipient) internal {
        uint256 newItemId = nftIdCounter;
        _safeMint(recipient, newItemId);
        nftIdCounter = nftIdCounter + 1;
    }
    function mint() external {
        // msg.sender is always the address that called the function.
        // This is secure and direct.
        forgeNFT(msg.sender);
    }

}