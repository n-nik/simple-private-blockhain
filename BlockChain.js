/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js').Block;
const GENESIS_BLOCK_HEIGHT = 0;

class Blockchain {

    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    generateGenesisBlock(){
        return this.getBlock(GENESIS_BLOCK_HEIGHT)
            .catch(err => {
                if (err.notFound) {
                    return this.addBlock(new Block("First block in the chain - Genesis block"))
                }
            })
    }

    // Get block height, it is a helper method that return the height of the blockchain
    getBlockHeight() {
        return this.db.getBlocksCount();
    }

    // Add new block
    addBlock(block) {
        return this.getBlockHeight()
            .then(height => {
                if(height > GENESIS_BLOCK_HEIGHT) {
                    /* Fetch previous block */
                    return this.getBlock(height - 1);
                }
            })
            .then(previousBlock => {
                block.height = previousBlock ? previousBlock.height + 1 : GENESIS_BLOCK_HEIGHT;
                block.previousBlockHash = previousBlock ? previousBlock.hash : "";
                block.time = new Date().getTime().toString().slice(0,-3);
                block.hash = this._getBlockHash(block);

                return this.db.addLevelDBData(block.height, block);
            })
    }

    // Get Block By Height
    getBlock(height) {
        return this.db.getLevelDBData(height)
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        return this.getBlock(height).then(block => this._validateBlockContent(block));
    }

    _validateBlockContent(block) {
        const tmpBlock = JSON.parse(JSON.stringify(block)); // Copy original block
        const blockHash = tmpBlock.hash;
        tmpBlock.hash = "";
        const validBlockHash = this._getBlockHash(tmpBlock);

        return validBlockHash === blockHash;
    }

    _getBlockHash(block) {
        return SHA256(JSON.stringify(block)).toString();
    }

    // Validate Blockchain
    validateChain() {
        const errors = [];
        return new Promise((resolve, reject) => {
            // iterate over each block to validate
            this.db.getBlockStream()
                .on('data', blockRaw => {
                    const block = JSON.parse(blockRaw);

                    const getPreviousBlock = block.height !== GENESIS_BLOCK_HEIGHT
                        ? this.getBlock(block.height - 1)
                        : Promise.resolve(null);

                    getPreviousBlock.then(previousBlock => {
                        const isValidBlock = this._validateBlockContent(block);

                        if(!isValidBlock || previousBlock && previousBlock.hash !== block.previousBlockHash) {
                            errors.push("Invalid block # " + block.height);
                        }
                    });
                })
                .on('errors', () => reject())
                .on('close', () => resolve(errors))
        })
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        return new Promise( (resolve, reject) => {
            this.db.addLevelDBData(height, block).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
   
}

module.exports.Blockchain = Blockchain;
