require('@babel/register');
({
    ignore: /node_modules/
});
require('@babel/polyfill');

const HDWalletProvider = require('@truffle/hdwallet-provider');

let mnemonic = 'hockey ensure success shadow shock note saddle modify hockey entire sure genuine'; 
let testAccounts = [
"0xb3fa7be7b0443cf6dc27842769261b67f0a384cbfde1ba185ece22f87dd770b9",
"0xd511d241263b372f4cc00f2294787a2300e2962b97d2da5bd98b58abc961db9d",
"0x4e1e8da9d582b63fdd4940ff4e38e5eb4de02e6e76c2601e7cba3594e0366194",
"0x78808f5874f60c907754b55f48ac6c149bc1803dae0f13f3ad8e7c1890a06b86",
"0x0a63e7ef13b2d407944976c7442d04651505cc197b8a3567057480de9dfb1a9a",
"0x4f68864ceb5856ddbec3552a6c30f1be4b4363ccdca2a530128d7c74054c9a86",
"0xc8891778c4c88a8328b80a3b87236a60035a7c3f300106d3a59c55dbc56a9e76",
"0x1939206eeaadbc70ac50af6303230a08a59b69b9433a75091161a90713016a8c",
"0xb99d50d3a76d555791630dad3511a11c94b38b734d7613a3e67c701b08e7ee81",
"0x5550a568f6fc40408783eb5d612d7fec0267be7ea854cda4a5c79e4a89a1808d"
]; 
let devUri = 'http://127.0.0.1:7545/';

module.exports = {
    testAccounts,
    mnemonic,
    networks: {
        development: {
            uri: devUri,
            provider: () => new HDWalletProvider(
                mnemonic,
                devUri, // provider url
                0, // address index
                10, // number of addresses
                true, // share nonce
                `m/44'/60'/0'/0/` // wallet HD path
            ),
            network_id: '*'
        }
    },
    compilers: {
        solc: {
            version: '^0.5.11'
        }
    }
};
