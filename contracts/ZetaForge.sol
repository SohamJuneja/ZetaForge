// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

// Inherit from ERC721URIStorage
contract ZetaForge is UniversalContract, ERC721URIStorage {
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
        address recipient = abi.decode(context.sender, (address));
        forgeNFT(recipient, ""); // Mint with an empty URI for cross-chain calls
    }

    function forgeNFT(address recipient, string memory tokenURI) internal {
        uint256 newItemId = nftIdCounter;
        _safeMint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        nftIdCounter = nftIdCounter + 1;
    }

    function mint(string memory tokenURI) external {
        forgeNFT(msg.sender, tokenURI);
    }
    
    // The _burn and tokenURI functions have been removed.
    // We will now inherit them directly from ERC721URIStorage.
}