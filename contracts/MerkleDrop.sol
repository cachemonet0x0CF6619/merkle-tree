// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "./MerkleProof.sol";

contract MerkleDrop is ERC721, PaymentSplitter {
    // CONSTRUCTOR
    constructor(
        string memory name,
        string memory symbol,
        address[] memory payees,
        uint256[] memory shares,
        bytes32 root
    ) ERC721(name, symbol) PaymentSplitter(payees, shares) {
        _root = root;
    }

    // EVENTS
    event Minted(address indexed owner, string tokenURI, uint256 indexed time);
    event Claimed(
        address indexed owner,
        string tokenURI,
        uint256 indexed index,
        uint256 indexed time
    );

    address internal owner = msg.sender;
    uint16 internal _totalSupply;

    using BitMaps for BitMaps.BitMap;
    BitMaps.BitMap private claimed;

    bytes32 public _root;

    function mint() public payable {
        require(_totalSupply + 1 <= 10_000, "All gone!");
        require(msg.value >= 0.01 ether, "Must send enough money!");
        _totalSupply++;
        _safeMint(msg.sender, _totalSupply);
        emit Minted(msg.sender, tokenURI(_totalSupply - 1), block.timestamp);
    }

    function claimable(bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        (bool valid, uint256 index) = MerkleProof.verify(proof, _root, leaf);
        if (!valid) return false;
        return !claimed.get(index);
    }

    function claim(bytes32[] calldata proof) public {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        (bool valid, uint256 index) = MerkleProof.verify(proof, _root, leaf);
        require(valid, "Not VIP");
        require(!claimed.get(index), "Already claimed");
        require(_totalSupply + 1 <= 10_000, "All gone!");
        claimed.set(index);
        _totalSupply++;
        _safeMint(msg.sender, _totalSupply);
        emit Claimed(
            msg.sender,
            tokenURI(_totalSupply - 1),
            index,
            block.timestamp
        );
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://${data.metadataCID}/";
    }

    function totalSupply() public view returns (uint16) {
        return _totalSupply;
    }

    function tokenURI(uint256 tokenId)
        public
        pure
        override(ERC721)
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(_baseURI(), Strings.toString(tokenId), ".json")
            );
    }
}
