const handleForge = async () => {
    if (!canForge || !address || address.length!==42) {
      alert("Please connect your wallet and fill all fields before forging.");
      return;
    }
    const message = `Forge: ${selectedNFTs[0]?.name} + ${selectedNFTs[1]?.name}. Prompt: ${prompt}`;
    console.log("Contract args:", {
      sender: address,
      chainID: 0,
      destination: ZERO_ADDRESS,
      gasfee: "0x",
      relayer: ZERO_ADDRESS,
    }, ZERO_ADDRESS, 0, message);
    console.log("DEBUG addresses:", {
      senderEVM: address,
      relayer: ZERO_ADDRESS,
      destination: ZERO_ADDRESS,
      zrc20: zetaForgeContractAddress
    });
     
    writeContract({
      address: zetaForgeContractAddress,
      abi: zetaForgeContractABI,
      functionName: 'onCall',
      args: [
        // The MessageContext struct as a tuple (array)
        [
          address,        // sender (address, which is valid bytes)
          '0x0000000000000000000000000000000000000000',           // chainID (bytes) - an empty bytes value
          ZERO_ADDRESS,   // destination (address)
          '0x0000000000000000000000000000000000000000',           // gasfee (bytes) - an empty bytes value
          ZERO_ADDRESS    // relayer (address)
        ],
        ZERO_ADDRESS,     // zrc20 (address)
        0,                // amount (uint256)
        toHex(message),   // message (bytes)
      ],


    });
  };