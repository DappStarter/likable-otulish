'use strict';
const Blockchain = require( './blockchain');
const dappConfig = require( '../dapp-config.json');
const ClipboardJS = require( 'clipboard');
const SvgIcons = require( './components/svg-icons');
const BN = require('bn.js'); // Required for injected code

const ipfsClient = require( 'ipfs-http-client');
const bs58 = require( 'bs58');


module.exports = class DappLib {

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT RUN STATE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractRunStateActive(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractRunStateActive'
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Run State Active',
            result: result.callData,
            hint: null
        }
    }

    static async setContractRunState(data) {
        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'setContractRunState',
            data.mode
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),    
            hint: `Verify contract run state is ${data.mode ? 'active' : 'inactive'} by calling contract functions that use requireContractRunStateActive().`
        }
    }

    static async onContractRunStateChange(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'ChangeContractRunState', params, callback);
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: ADMINISTRATOR ROLE  <<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractAdmin(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Admin',
            result: result.callData,
            hint: null
        }
    }

    static async addContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'addContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is an administrator by using "Is Contract Admin."`
        }
    }

    static async removeContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'removeContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is no longer an administrator by using "Is Contract Admin."`
        }
    }

    static async removeLastContractAdmin(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'removeLastContractAdmin',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify that all functions that require an administrator no longer work."`
        }
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ACCESS CONTROL: CONTRACT ACCESS  <<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async isContractAuthorized(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'isContractAuthorized',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_BOOLEAN,
            label: 'Is Contract Authorized',
            result: result.callData,
            hint: null
        }
    }

    static async authorizeContract(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'authorizeContract',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is authorized by using "Is Contract Authorized."`
        }
    }

    static async deauthorizeContract(data) {

        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'deauthorizeContract',
            data.account
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify ${DappLib.formatAccount(data.account)} is no longer authorized by using "Is Contract Authorized."`
        }
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ASSET VALUE TRACKING: TOKEN  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async _decimals(data) {
        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: data.from
                }
            },
            'decimals'
        );
        return result.callData
    }

    static async _toSmallestUnit(amount, data) {
        let decimals = await DappLib._decimals(data);
        let units = new BN(10).pow(new BN(decimals));
        return new BN(amount).mul(units);
    }

    static async _fromSmallestUnit(amount, data) {
        let decimals = await DappLib._decimals(data);
        let units = new BN(10).pow(new BN(decimals));
        return new BN(amount).div(units);
    }

    static async totalSupply(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: data.from
                }
            },
            'totalSupply',
        ); 
        let supply = result.callData;
        return {
            type: DappLib.DAPP_RESULT_BIG_NUMBER,
            label: 'Total Supply',
            result: new BN(supply),
            unitResult: await DappLib._fromSmallestUnit(supply, data),
            hint: null
        }
    }

    static async balance(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: data.from
                }
            },
            'balance'
        );
        let balance = result.callData;
        return {
            type: DappLib.DAPP_RESULT_BIG_NUMBER,
            label: 'Account Balance for ' + DappLib.formatAccount(result.callAccount),
            result: new BN(balance),
            unitResult: await DappLib._fromSmallestUnit(balance, data),
            hint: null
        }
    }

    static async balanceOf(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: data.from
                }
            },
            'balanceOf',
            data.account
        );            
        let balance = result.callData;
        return {
            type: DappLib.DAPP_RESULT_BIG_NUMBER,
            label: DappLib.formatAccount(result.callAccount) + ' Account Balance',
            result: new BN(balance),
            unitResult: await DappLib._fromSmallestUnit(balance, data),
            hint: null
        }
    }

    static async transfer(data) {

        let decimals = await DappLib._decimals(data);
        let units = new BN(10).pow(new BN(decimals));
        let amount = new BN(data.amount).mul(units);
        let result = await Blockchain.post({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: data.from
                }
            },
            'transfer',
            data.to,
            amount
        );
        return {
            type: DappLib.DAPP_RESULT_TX_HASH,
            label: 'Transaction Hash',
            result: DappLib.getTransactionHash(result.callData),
            hint: `Verify transfer by using "Balance for Account" to check the balance of ${DappLib.formatAccount(data.to)}.`
        }
    }

    static async onApproval(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'Approval', params, callback);
    }

    static async onTransfer(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'Transfer', params, callback);
    }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FILE STORAGE: IPFS  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static async addIpfsDocument(data) {

        let folder = data.mode === 'folder';
        let config = DappLib.getConfig();

        if (data.mode === 'single') {
            data.files = data.files.slice(0, 1);
        }
        // Push files to IPFS
        let ipfsResult = await DappLib.ipfsUpload(config, data.files, folder, (bytes) => {
           // console.log(bytes);
        });
        let results = [];
        for(let f=0; f<ipfsResult.length; f++) {
            let file = ipfsResult[f];
            file.docId = file.digest.substr(2, 16);

            let result = await Blockchain.post({
                    config: config,
                    contract: DappLib.DAPP_STATE_CONTRACT,
                    params: {
                        from: null,
                        gas: 2000000
                    }
                },
                'addIpfsDocument',
                DappLib.fromAscii(file.docId, 32),
                DappLib.fromAscii(data.label || '', 32),
                file.digest,
                file.hashFunction,
                file.digestLength
            );

            results.push({
                transactionHash: DappLib.getTransactionHash(result.callData),
                ipfsHash: file.hash,
                docId: file.docId
            });
        }

        return {
            type: DappLib.DAPP_RESULT_IPFS_HASH_ARRAY,
            result: results
        }
    }

    static async getIpfsDocument(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'getIpfsDocument',
            DappLib.fromAscii(data.id, 32)
        );
        if (result.callData) {
            result.callData.docId = DappLib.toAscii(result.callData.docId);
            result.callData.docMultihash = DappLib._encodeMultihash({
                                                digest: result.callData.docDigest,
                                                hashFunction: Number(result.callData.docHashFunction),
                                                digestLength: Number(result.callData.docDigestLength)
                                        });
            result.callData.docUrl = DappLib.formatIpfsHash(result.callData.docMultihash);
            result.callData.label = DappLib.toAscii(result.callData.label);
        }
        return {
            type: DappLib.DAPP_RESULT_OBJECT,
            label: 'Document Information',
            result: result.callData
        }
    }

    static async getIpfsDocumentsByOwner(data) {

        let result = await Blockchain.get({
                config: DappLib.getConfig(),
                contract: DappLib.DAPP_STATE_CONTRACT,
                params: {
                    from: null
                }
            },
            'getIpfsDocumentsByOwner',
            data.account
        );
        if (result.callData && Array.isArray(result.callData)) {
            for(let i=0; i< result.callData.length; i++) {
                result.callData[i] = DappLib.toAscii(result.callData[i]);
            }
        }
        return {
            type: DappLib.DAPP_RESULT_ARRAY,
            label: 'Documents',
            result: result.callData,
            formatter: ['Text-20-5']
        }
    }

    static async ipfsUpload(config, files, wrapWithDirectory, progressCallback) {

        let ipfs = ipfsClient(config.ipfs);
        let filesToUpload = [];
        files.map((file) => {
            filesToUpload.push({
                path: file.name,
                content: file
            })
        });
        const options = {
            wrapWithDirectory: wrapWithDirectory,
            pin: true,
            progress: progressCallback
        }
        let results = [];

        for await (const result of ipfs.add(filesToUpload, options)) {
            if (wrapWithDirectory && result.path !== "") {
                continue;
            }
            results.push(
                Object.assign({}, result, DappLib._decodeMultihash(result.cid.string))
            );
        }

        return results;
    }

    static async onAddIpfsDocument(callback) {
        let params = {};
        DappLib.addEventHandler(DappLib.DAPP_STATE_CONTRACT_WS, 'AddIpfsDocument', params, callback);
    }

    static formatIpfsHash(a) {
        let config = DappLib.getConfig();
        let url = `${config.ipfs.protocol}://${config.ipfs.host}/ipfs/${a}`;
        return `<strong class="teal lighten-5 p-1 black-text number copy-target" title="${url}"><a href="${url}" target="_new">${a.substr(0,6)}...${a.substr(a.length-4, 4)}</a></strong>${ DappLib.addClippy(a)}`;
    }

    /**
     * Partition multihash string into object representing multihash
     * https://github.com/saurfang/ipfs-multihash-on-solidity/blob/master/src/multihash.js
     */
    static _decodeMultihash(multihash) {
        const decoded = bs58.decode(multihash);

        return {
            digest: `0x${decoded.slice(2).toString('hex')}`,
            hashFunction: decoded[0],
            digestLength: decoded[1],
        };
    }

    /**
     * Encode a multihash structure into base58 encoded multihash string
     * https://github.com/saurfang/ipfs-multihash-on-solidity/blob/master/src/multihash.js
     */
    static _encodeMultihash(encodedMultihash) {
        const {
            digest,
            hashFunction,
            digestLength
        } = encodedMultihash;
        if (digestLength === 0) return null;

        // cut off leading "0x"
        const hashBytes = Buffer.from(digest.slice(2), 'hex');

        // prepend hashFunction and digest length
        const multihashBytes = new(hashBytes.constructor)(2 + hashBytes.length);
        multihashBytes[0] = hashFunction;
        multihashBytes[1] = digestLength;
        multihashBytes.set(hashBytes, 2);

        return bs58.encode(multihashBytes);
    }




/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DAPP LIBRARY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<*/

    static get DAPP_STATE_CONTRACT() {
        return 'dappStateContract'
    }
    static get DAPP_CONTRACT() {
        return 'dappContract'
    }

    static get DAPP_STATE_CONTRACT_WS() {
        return 'dappStateContractWs'
    }
    static get DAPP_CONTRACT_WS() {
        return 'dappContractWs'
    }

    static get DAPP_RESULT_BIG_NUMBER() {
        return 'big-number'
    }

    static get DAPP_RESULT_ACCOUNT() {
        return 'account'
    }

    static get DAPP_RESULT_TX_HASH() {
        return 'tx-hash'
    }

    static get DAPP_RESULT_IPFS_HASH_ARRAY() {
        return 'ipfs-hash-array'
    }

    static get DAPP_RESULT_SIA_HASH_ARRAY() {
        return 'sia-hash-array'
    }

    static get DAPP_RESULT_ARRAY() {
        return 'array'
    }

    static get DAPP_RESULT_OBJECT() {
        return 'object'
    }

    static get DAPP_RESULT_ERROR() {
        return 'error'
    }

    static get SVG_ICONS() {
        return SvgIcons;
    }

    static async addEventHandler(contract, event, params, callback) {
            Blockchain.handleEvent({
                config: DappLib.getConfig(),
                contract: contract,
                params: params || {}
            }, 
            event, 
            (error, result) => {
                                if (error) {
                                    callback({
                                        event: event,
                                        type: DappLib.DAPP_RESULT_ERROR,
                                        label: 'Error Message',
                                        result: error
                                    });    
                                } else {
                                    callback({
                                        event: event,
                                        type: DappLib.DAPP_RESULT_OBJECT,
                                        label: 'Event ' + event,
                                        result: DappLib.getObjectNamedProperties(result)
                                    });    
                                }
                            }
            );
    }

    static getTransactionHash(t) {
        if (!t) { return ''; }
        let value = '';
        if (typeof t === 'string') {                
            value = t;
        } else if (typeof t === 'object') {    
            if (t.hasOwnProperty('transactionHash')) {
                    value = t.transactionHash;       // Ethereum                
            } else {
                value = JSON.stringify(t);
            }
        }
        return value;
    }

    static formatHint(hint) {
        if (hint) {
            return `<p class="mt-3 grey-text"><strong>Hint:</strong> ${hint}</p>`;
        } else {
            return '';
        }
    }

    static formatNumber(n) {
        var parts = n.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `<strong class="p-1 blue-grey-text number copy-target" style="font-size:1.1rem;" title="${n}">${parts.join(".")}</strong>`;
    }

    static formatAccount(a) {
        return `<strong class="green accent-1 p-1 blue-grey-text number copy-target" title="${a}">${DappLib.toCondensed(a, 6, 4)}</strong>${ DappLib.addClippy(a)}`;
    }

    static formatTxHash(a) {
        let value = DappLib.getTransactionHash(a);
        return `<strong class="teal lighten-5 p-1 blue-grey-text number copy-target" title="${value}">${DappLib.toCondensed(value, 6, 4)}</strong>${ DappLib.addClippy(value)}`;
    }

    static formatBoolean(a) {
        return (a ? 'YES' : 'NO');
    }

    static formatText(a, copyText) {
        if (!a) { return; }
        if (a.startsWith('<')) {
            return a;
        }
        return `<span title="${copyText ? copyText : a}">${a}</span>${DappLib.addClippy(copyText ? copyText : a)}`;
    }

    static formatStrong(a) {
        return `<strong>${a}</strong>`;
    }

    static formatPlain(a) {
        return a;
    }

    static formatObject(a) {
        let data = [];
        let labels = [ 'Item', 'Value' ];
        let keys = [ 'item', 'value' ];
        let formatters = [ 'Strong', 'Text-20-5' ];
        let reg = new RegExp('^\\d+$'); // only digits
        for(let key in a) {
            if (!reg.test(key)) {
                data.push({
                    item: key.substr(0,1).toUpperCase() + key.substr(1),
                    value: a[key]
                });
            }
        }
        return DappLib.formatArray(data, formatters, labels, keys);
    }

    static formatArray(h, dataFormatters, dataLabels, dataKeys) {

        let output = '<table class="table table-striped">';

        if (dataLabels) {
            output += '<thead><tr>';
            for(let d=0; d<dataLabels.length; d++) {
                output += `<th scope="col">${dataLabels[d]}</th>`;
            }    
            output += '</tr></thead>';
        }
        output += '<tbody>';
        h.map((item) => {
            output += '<tr>';
            for(let d=0; d<dataFormatters.length; d++) {
                let text = String(dataKeys && dataKeys[d] ? item[dataKeys[d]] : item);
                let copyText =  dataKeys && dataKeys[d] ? item[dataKeys[d]] : item;
                if (text.startsWith('<')) {
                    output += (d == 0 ? '<th scope="row">' : '<td>') + text + (d == 0 ? '</th>' : '</td>');
                } else {
                    let formatter = 'format' + dataFormatters[d];
                    if (formatter.startsWith('formatText')) {
                        let formatterFrags = formatter.split('-');
                        if (formatterFrags.length === 3) {
                            text = DappLib.toCondensed(text, Number(formatterFrags[1]), Number(formatterFrags[2]));
                        } else if (formatterFrags.length === 2) {
                            text = DappLib.toCondensed(text, Number(formatterFrags[1]));
                        }
                        formatter = formatterFrags[0];    
                    }
                    output += (d == 0 ? '<th scope="row">' : '<td>') + DappLib[formatter](text, copyText) + (d == 0 ? '</th>' : '</td>');                        
                }
            }    
            output += '</tr>';
        })
        output += '</tbody></table>';
        return output;
    }

    static getFormattedResultNode(retVal, key) {

        let returnKey = 'result';
        if (key && (key !== null) && (key !== 'null') && (typeof(key) === 'string')) {
            returnKey = key;
        }
        let formatted = '';
        switch (retVal.type) {
            case DappLib.DAPP_RESULT_BIG_NUMBER:
                formatted = DappLib.formatNumber(retVal[returnKey].toString(10));
                break;
            case DappLib.DAPP_RESULT_TX_HASH:
                formatted = DappLib.formatTxHash(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_ACCOUNT:
                formatted = DappLib.formatAccount(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_BOOLEAN:
                formatted = DappLib.formatBoolean(retVal[returnKey]);
                break;
            case DappLib.DAPP_RESULT_IPFS_HASH_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    ['TxHash', 'IpfsHash', 'Text-10-5'],
                    ['Transaction', 'IPFS URL', 'Doc Id'],
                    ['transactionHash', 'ipfsHash', 'docId']
                );
                break;
            case DappLib.DAPP_RESULT_SIA_HASH_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    ['TxHash', 'SiaHash', 'Text-10-5'],
                    ['Transaction', 'Sia URL', 'Doc Id'],
                    ['transactionHash', 'docId', 'docId']
                );
                break;
            case DappLib.DAPP_RESULT_ARRAY:
                formatted = DappLib.formatArray(
                    retVal[returnKey],
                    retVal.formatter ? retVal.formatter : ['Text'],
                    null,
                    null
                );
                break;
            case DappLib.DAPP_RESULT_OBJECT:
                formatted = DappLib.formatObject(retVal[returnKey]);
                break;
            default:
                formatted = retVal[returnKey];
                break;
        }

        let resultNode = document.createElement('div');
        resultNode.className = `note ${retVal.type === DappLib.DAPP_RESULT_ERROR ? 'bg-red-400' : 'bg-green-400'} m-3 p-3`; 
        let closeMarkup = '<div class="float-right" onclick="this.parentNode.parentNode.removeChild(this.parentNode)" title="Dismiss" class="text-right mb-1 mr-2" style="cursor:pointer;">X</div>';    
        resultNode.innerHTML = closeMarkup + `${retVal.type === DappLib.DAPP_RESULT_ERROR ? '☹️' : '👍️'} ` + (Array.isArray(retVal[returnKey]) ? 'Result' : retVal.label) + ': ' + formatted + DappLib.formatHint(retVal.hint);
        // Wire-up clipboard copy
        new ClipboardJS('.copy-target', {
            text: function (trigger) {
                return trigger.getAttribute('data-copy');
            }
        });

        return resultNode;
    }

    static getObjectNamedProperties(a) {
        let reg = new RegExp('^\\d+$'); // only digits
        let newObj = {};
        for(let key in a) {
            if (!reg.test(key)) {
                newObj[key] = a[key];
            }
        }
        return newObj;
    }
    
    static addClippy(data) {
        let icon = SvgIcons.clippy;
        return icon.replace('<svg ', `<svg data-copy="${data}" `)
    }

    static getAccounts() {
        let accounts = dappConfig.accounts;
        return accounts;
    }

    static fromAscii(str, padding) {

        if (str.startsWith('0x') || !padding) {
            return str;
        }

        if (str.length > padding) {
            str = str.substr(0, padding);
        }

        var hex = '0x';
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            var n = code.toString(16);
            hex += n.length < 2 ? '0' + n : n;
        }
        return hex + '0'.repeat(padding*2 - hex.length + 2);
    };
    
    static toAscii(hex) {
        var str = '',
            i = 0,
            l = hex.length;
        if (hex.substring(0, 2) === '0x') {
            i = 2;
        }
        for (; i < l; i+=2) {
            var code = parseInt(hex.substr(i, 2), 16);
            if (code === 0) continue; // this is added
            str += String.fromCharCode(code);
        }
        return str;
    };

    static toCondensed(s, begin, end) {
        if (!s) { return; }
        if (s.length && s.length <= begin + end) {
            return s;
        } else {
            if (end) {
                return `${s.substr(0, begin)}...${s.substr(s.length-end, end)}`;
            } else {
                return `${s.substr(0, begin)}...`;
            }
        }
    }

    // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    static getUniqueId() {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    static getConfig() {
        return dappConfig;
    }

    // Return value of this function is used to dynamically re-define getConfig()
    // for use during testing. With this approach, even though getConfig() is static
    // it returns the correct contract addresses as its definition is re-written
    // before each test run. Look for the following line in test scripts to see it done:
    //  DappLib.getConfig = Function(`return ${ JSON.stringify(DappLib.getTestConfig(testDappStateContract, testDappContract, testAccounts))}`);
    static getTestConfig(testDappStateContract, testDappContract, testAccounts) {

        return Object.assign(
            {}, 
            dappConfig,
            {
                dappStateContractAddress: testDappStateContract.address,
                dappContractAddress: testDappContract.address,
                accounts: testAccounts,
                owner: testAccounts[0],
                admins: [
                    testAccounts[1],
                    testAccounts[2],
                    testAccounts[3]
                ],
                users: [
                    testAccounts[4],
                    testAccounts[5],
                    testAccounts[6],
                    testAccounts[7],
                    testAccounts[8]
                ]
                ,ipfsTestFiles: [
                    "QmaWf4HjxvCH5W8Cm8AoFkSNwPUTr3VMZ3uXp8Szoqun53",
                    "QmTrjnQTaUfEEoJ8DgsDG2A8AqsiN5bSV62q98tWkZMU2D",
                    "QmSn26zrUd5CbuNoBPwGhPrktLv94rPiZxNmkHx5smTYj3",
                    "QmTy9aLjFxV8sDK7GEp8uR1zC8ukq3NrV6aSNxjvBTTcqu",
                    "QmWJU1FQghgi69VSDpEunEwemPDFqmBvXzp8b9DxKHP7QQ",
                    "QmYT1ejAMbG2fP7AMdH2Pi2QpQRxQXBUC3CbENzpY2icok",
                    "QmQJh3yLX9z6dmKbFhCyGsZrUEtRXeurcDG39eXbkwQG7C",
                    "QmWRYExBZgZ67R43jW2vfwL3Hio78JaR7Vq3ouiJTsZ6qw",
                    "QmWwPLQVVJizkwwiqPcknBUnRH359TfbusHpVGZtWNGMxu",
                    "QmbtFKnBuyUmRoFh9EueP2r6agYpwGJwG4VBikQ4wwjGAY"
                ]

            }
        );
    }

}