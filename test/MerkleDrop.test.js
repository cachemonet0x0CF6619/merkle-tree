const { expect } = require('chai');
const { ethers } = require('hardhat');

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe('MerkleDrop', function () {
  let contract, buyer, owner, vip, hacker, tree;
  before(async () => {
    const [owner_, buyer_, vip_, alice, bob, hacker_] = await ethers.getSigners();
    buyer = buyer_;
    owner = owner_;
    vip   = vip_;
    hacker = hacker_;

    const leaves = [
      owner.address,
      buyer.address,
      vip.address,
      alice.address,
      bob.address,
    ];

    tree = generateMerkleTree(leaves);

    const root = tree.getHexRoot();

    const Contract = await ethers.getContractFactory('MerkleDrop');
    contract = await Contract.deploy(
      "MerkleDrop",
      "MERK",
      [owner.address],
      [100],
      root
    );

    await contract.deployed();
  });
  it('should mint token', async () => {
    try {
      await contract
        .connect(buyer)
        .mint({ value: ethers.utils.parseEther('0.04') });
      expect(await contract.totalSupply()).to.equal(1);
    } catch (error) {
      expect(error).to.not.exist;
    }
  });

  it('should respond to claimable', async () => {
    const proof = prove(tree, buyer.address);
    try {
      const claimable = await contract.connect(buyer).claimable(proof);
      expect(claimable).to.eq(true);
    } catch (error) {
      expect(error).to.not.exist;
    }
  });

  it('should allow vip to claim token', async () => {
    const proof = prove(tree, buyer.address);

    try {
      await contract.connect(buyer).claim(proof);
      expect(await contract.totalSupply()).to.equal(2);
    } catch (error) {
      expect(error).to.not.exist;
    }
  });
  it('should not allow hacker to claim token', async () => {
    const proof = prove(tree, hacker.address);
    try {
      await contract.connect(hacker).claim(proof);
    } catch (error) {
      expect(error.message).to.include('Not VIP');
      expect(await contract.totalSupply()).to.equal(2);
    }
  });

  it('should prevent minting for less than cost', async () => {
    try {
      await contract
        .connect(buyer)
        .mint({ value: ethers.utils.parseEther('0.01') });
    } catch (error) {
      expect(error.message).to.include("Invalid value");
      expect(await contract.totalSupply()).to.equal(1);
    } 
  });

  it('should allow owner to release funds', async () => {
    try {
      await contract.release(owner.address);
    } catch (error) {
      expect(error).to.not.exist;
    }
  });

  it('should prevent others from releasing funds', async () => {
    try {
      await contract.release(buyer.address);
    } catch (error) {
      expect(error.message).to.include("account has no shares");
    }
  });
});

// convert hex string (0xabcd123) to hash, hashing not the string but the actual value
const hashStringAddress = (address)  => keccak256(Buffer.from(address.substring(2), "hex"));

const generateMerkleTree = (addresses) => {
  const leaves = addresses.map(hashStringAddress);
  return new MerkleTree(leaves, keccak256, { sort: true });
}

const prove = (tree, address) => tree.getHexProof(hashStringAddress(address));