/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    getLevelDBData(key) {
        return this.db.get(key)
            .then(value => JSON.parse(value));
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        return this.db.put(key, JSON.stringify(value))
            .then(() => this.getLevelDBData(key))
    }

    // Method that return the height
    getBlocksCount() {
        let count = 0;
        return new Promise((resolve, reject) => {
            this.db.createKeyStream()
                .on('data', () => count++)
                .on('error', (err) => reject(err))
                .on('close', () => resolve(count))
        })
    }

    // Method that return readable Stream of blocks  to iterate over them
    getBlockStream() {
        return this.db.createValueStream()
    }


}

module.exports.LevelSandbox = LevelSandbox;
