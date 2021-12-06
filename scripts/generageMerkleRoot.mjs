
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

// collected somehow
const vips = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
];

//const bads = [
//  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92274",
//  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
//];

// Before creating air drop token
const buf2hex = (x) => '0x' + x.toString('hex');

const leaves = vips.map(keccak256);
// const badleaves = bads.map(keccak256);

const tree = new MerkleTree(leaves, keccak256, { sort: true });
//const bad = new MerkleTree(badleaves, keccak256);

// root generated from VIPs only
const root = buf2hex(tree.getRoot());

// This is what we will pass in to our contract when we deploy it
console.log(root);

// the airdrop contract w/ website
const leaf = keccak256("0x0CF661907E76C4921f7dF302092697799dc63B24");
const hexProof = tree.getProof(leaf).map(({data}) => data).map(buf2hex);
console.log('hexp', hexProof);

const positions = tree.getProof(leaf).map(x => x.position == 'right' ? 1 : 0);

console.log('pos', positions);

//const badleaf = keccak256("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92274");

console.log('leaf:',buf2hex(leaf));

const proof = tree.getProof(leaf);
//const badproof = tree.getProof(badleaf);
console.log('proof', proof);

const omg = tree.verify(proof, leaf, root);

//const oof = tree.verify(badproof, badleaf, root);

console.log(omg);
//console.log(omg, oof);

console.log(tree.toString());
