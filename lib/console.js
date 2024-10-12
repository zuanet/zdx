const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const utils = require('./utils');
const pkg = require('../package');
const du = require('du');

class Console {

    constructor(controller, terminal) {
        this.controller = controller;
        this.manager = controller.manager;
        this.terminal = terminal;
        this.handlers = { };

        ['help','native_wallet','rpc'].forEach(cmd=>this.handlers[cmd.replace(/_/g,'-')]=this[cmd].bind(this));
        
        terminal.registerSink(this);




        this.appFolder = this.manager.appFolder;
        this.binFolder = path.join(this.appFolder,'bin',utils.platform);

        this.NPM = { 'win32' : 'npm.cmd', 'darwin' : 'npm', 'linux' : 'npm' }[process.platform];

        
        //this.walletBin = path.join(this.binFolder,'wallet'+(utils.platform == 'windows-x64'?'.exe':''));
        

        terminal.write(`ZDX console v${pkg.version}\r\n\r\ntype 'help' for usage information\n`);


        terminal.registerLinkHandler(controller.handleBrowserLink);
    }

	// getDeployableBinary(...args) {
	// 	let buildType = this.controller.buildType || 'generic';
	// 	switch(buildType) {
	// 		case 'generic': {
	// 			return path.join(this.manager.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}
			
	// 		case 'local': {
	// 			return path.join(os.homedir(),'.zdx','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}			
	// 	}
    // }
    
	complete() {}

	digest(cmd) {
		return new Promise((resolve,reject) => {
			let args = cmd.split(/\s+/);
			let op = args.shift();
			if(!op)
				return Promise.resolve();

            if(/digest|complete/i.test(op))
                return reject(`digest/complete keywords are not allowed`);

            const handler = this.handlers[op];
            //    const handler = this[op] || this.handlers[op];
                /*            
            if(!handler) {
                let taskMap = { }
                this.manager.tasks.forEach((task) => {
                    console.log(`testing task [${task.id}]:`,task);
                    taskMap[task.id] = task;
                });

                console.log('tasking op:',op);
                let task = taskMap[op];
                if(task) {
                    console.log("found matching task!", task);

                    if(!process.env['ZUA_JSON_RPC'])
                        return reject(`rpc is not supported in this version`);
                    
                    let instr = args.shift();
                    if(!instr)
                        return reject(`usage: ${op} <function> [space separated args]`);

                    let params;
                    try {
                        params = args.map(v=>JSON.parse(v));
                    } catch(ex) {
                        return reject(`unable to parse rpc call arguments: ${ex.toString()}`);
                    }

                    task.impl.rpc.call(instr, params).then((resp) => {
                        let text = ((typeof resp == 'string') ? resp : JSON.stringify(resp,null,'  ')).replace(/\n/g,'\n\r');
                        resolve(text);
                    }, (err) => {
                        reject(err.toString());
                    })

                    // return resolve(`${op}: found matchin task`);
                    return;
                }
            }
*/
			if(!handler) {
				reject(`${op}: unknown command`);
				return;
			}

			let ret = handler.call(this, ...args);
			if(ret && ret.then && typeof ret.then == 'function') {
				ret.then(resolve).catch(reject);
			}
			else {
				resolve();
			}
		})
	}

/*	
	echo(...args) { return Promise.resolve(`echo returns text`.red); }
	test(...args) { 
        this.terminal.write('writing to terminal...'); 
    }

    set(...args) {
        let [k,v] = args;
        if(!k)
            this.log(`\r\nbuild type is '${this.controller.buildType}'\r\n`);

        if(!k || !v)
            return Promise.reject(`use 'set <key> <value>' to change settings`);

        switch(k) {
            case 'build': {
                if(!['generic','local'].includes(v))
                    return Promise.reject(`value must be 'generic' or 'local'`);
                this.controller.setBuildType(v);
                return Promise.resolve(`setting build type to '${v}'`);
            } break;

            default: {
                return Promise.reject(`unknown setting: ${k}`);
            }
        }

        // TODO - STORE IN CONFIG
        
    }

    async du(...args) {
        let tasks = [...this.manager.tasks];
        let width = tasks.reduce((p,task)=>{ return Math.max(p||0,task.key.length); }) + 1;
        console.log
        let total = 0;
        while(tasks.length) {
            let task = tasks.shift();
            if(!task.impl) {
                this.log((task.key+':').padStart(width),'N/A'.padStart(12));
                continue;
            }

            let bytes = await task.impl.du();
            total += bytes;
            this.log((task.key+':').padStart(width),bytes.toFileSize().padStart(12));
        }
        this.log(('total:').padStart(width),total.toFileSize().padStart(12));
    }
*/

    // "demo-wallet"() {

    //     if(!fs.existsSync(this.walletBin))
    //         return Promise.reject(`wallet executable not found`);
    //     this.isWalletEnabled = true;
    //     this.terminal.write('demo wallet is accessible'.brightGreen);
    // }

    // getZuaTasks() {
    //     return this.manager.tasks.filter(t=>t.type=="zuanetworkd");
    // }

    // getZuasyncTasks() {
    //     return this.manager.tasks.filter(t=>t.type=="zuasyncd");
    // }

    // getZuaAddress() {
    //     let cfg = this.getZuaTasks().shift();
    //     if(!cfg)
    //         return Promise.reject(`zua is not instantiated`);
    //     if(!cfg.args)
    //         return Promise.reject(`zua configuration has no args object`);
    //     if(!cfg.args.listen)
    //         return Promise.reject(`zua configuration arguments have no 'listen' property`);
    //     let address = `http://${cfg.args.listen}`;
    //     return Promise.resolve(address);
    // }

    async rpc(...args) {
        let node = path.join(this.manager.appFolder,'node');
        if(process.platform == 'win32')
            node += '.exe';

        if(!fs.existsSync(node))
            node = process.platform == 'win32' ? 'node.exe' : 'node';

        let rpc = path.join(this.manager.appFolder,'rpc.js');

        const isTestnet = !!(global.manager?.tasks[0]?.args?.testnet);
        const flags = [];
        if(isTestnet)
            flags.push('--testnet');

        return this.spawn(node,[rpc, ...flags, ...args]);
    }

    async native_wallet(...args) {
        // if(!this.isWalletEnabled)
        //     return Promise.reject(`Please use 'demo-wallet' command to enable use of the demo wallet`);

        const isTestnet = !!(global.manager?.tasks[0]?.args?.testnet);
        const flags = [];
        if(isTestnet)
            flags.push('--testnet');

        let walletBin = this.manager.getDeployableBinary('zuawallet');

        let cmd = args.shift();
        switch(cmd) {
            case 'create': {
                return this.spawn(walletBin,['create', ...flags]);
            } break;

            case 'balance': {
                //let zua = await this.getZuaAddress();
                // let [address] = args;
                // if(!address)
                //     return Promise.reject('usage: wallet balance <address>');
                //this.log(walletBin,'balance',`/zua-address:${zua}`,`/address:${address}`);
                //return this.spawn(walletBin,['balance',`/zua-address:${zua}`,`/address:${address}`]);
                return this.spawn(walletBin,['balance', ...flags]);
            } break;

            case 'addresses':
            case 'show-addresses': {
                    return this.spawn(walletBin,['show-addresses', ...flags]);
            } break;

            case 'broadcast': {
                let [transaction] = args;
                if(!transaction)
                    return Promise.reject('usage: wallet broadcast <transaction>');
                return this.spawn(walletBin,['broadcast',`--transaction=${transaction}`, ...flags]);
            } break;

            case 'create-tx':
            case 'create-unsigned-transaction': {
                let [address,amount] = args;
                if(!address || !amount)
                    return Promise.reject(`usage: wallet ${cmd} <to-address> <amount>`)
                return this.spawn(walletBin,['create-unsigned-transaction',`--to-address=${address}`,`--send-amount=${amount}`, ...flags]);
            } break;

            case 'new-address':{
                return this.spawn(walletBin,['new-address', ...flags]);
            } break;
            case 'start-daemon':{
                return this.spawn(walletBin,['start-daemon', ...flags]);
            } break;
                

            case 'dump':
            case 'dump-unencrypted-data': {
                    return this.spawn(walletBin,['dump-unencrypted-data', ...flags]);
            } break;

            case 'send': {
                let [address,amount] = args;
                if(!address || !amount)
                    return Promise.reject('usage: wallet send <to-address> <amount>')
                return this.spawn(walletBin,['send',`--to-address=${address}`,`--send-amount=${amount}`, ...flags]);
            } break;


            case 'sign': {
                let [transaction] = args;
                if(!transaction)
                    return Promise.reject('usage: wallet sign <transaction>');
                return this.spawn(walletBin,['sign', ...flags]);
            } break;


            // case 'send': {
            //     //let zua = await this.getZuaAddress();
            //     let [private_key,to_address,amount] = args;
            //     if(!private_key || !to_address)
            //         return Promise.reject('usage: wallet send <private-key> <to-address> <amount>');
            //     return this.spawn(walletBin,['send',`--zua-address=${zua}`,`--private-key=${private_key}`,`--to-address=${to_address}`,`--send-amount=${amount}`]);
            // } break;
            // case 'create': {
            //     return this.spawn(walletBin,['create']);
            // } break;
            default: {
                return this.help('wallet');
            } break;
        }
    }
/*
    async migrate(cmd) {

        const zuasyncdBin = path.join(this.binFolder,'zuasyncd'+(process.platform == 'win32' ? '.exe' : ''));
        if(!fs.existsSync(zuasyncdBin)) {
            this.log(`error: unable to locate ${zuaBin}`.red);
            return Promise.reject(`error: zua executable not found`);
        }

        let tasks = this.getZuasyncTasks();
        if(!tasks.length)
            return Promise.reject(`no zuasync tasks detected`);
        //let folders = tasks.map(task => task.impl.folder);
        let argsList =  tasks.map(task => {
        //    task.impl.options

            let args = (typeof task.impl.options.args  == 'function') ? task.impl.options.args().slice() : task.impl.options.args.slice();
            return args;


        });
        
        tasks.forEach(task => task.impl.terminate());

        // let dc = this.manager.getDC();
        // await this.manager.stop();

        // await utils.spawn(this.getBinary('zuasyncd'), migrateArgs, {
        //     cwd : path.join(this.getBinaryFolder(), 'database'),
        //     stdout : (data) => this.writeToSink(data)
        // });



        while(argsList.length) {
            let args = argsList.shift().slice();
            
            // this.log(args.shift(),['--migrate', ...args]);
            await this.spawn(zuasyncdBin,['--migrate', ...args], { 
                cwd : path.join(this.binFolder,'database')
            });
        }

        //await this.manager.start(dc);
        tasks.forEach(task => task.impl.run());

    }
*/

    async purge(cmd) {
        if(cmd != 'everything')
            return Promise.reject(`To confirm, please enter "purge everything" command`);

        let dc = this.manager.getDC();
        await this.manager.stop();
        await fse.remove(this.manager.dataFolder);
        await mkdirp(this.manager.dataFolder);
        await this.manager.start(dc);
    }

/*

    help(term) {
        switch(term) {
            default: {

                //wallet  <create|send|balance>\r
                //migrate - upgrades Zua database schema\r
                this.terminal.write(`
stop    - stop all daemons\r
start   - start all daemons\r
restart - restart all daemons\r
du      - display current storage utilization\r
build   - rebuild zua node\r
set     - configure a property:\r
          'set build <type>' - where <type> is 'generic' or 'local'\r
          (generic - included with ZDX release; local - local Zua build)
                `)

            } break;
        }
    }
*/



help(term) {
    switch(term) {
        default: {

            //wallet  <create|send|balance>\r
            //migrate - upgrades Zua database schema\r
            this.terminal.write(`
native-wallet <command> - run native Zua CLI wallet command, where command is:\r
\r
    balance\t\t\t show wallet balance\r
    broadcast <transaction>\t broadcast transaction\r
    create\t\t\t create wallet\r
    create-tx <address> <amount> alias for 'create-unsigned-transaction'\r
    create-unsigned-transaction <address> <amount>  create unsigned transaction\r
    dump\t\t\t alias for 'dump-unencrypted-data'\r
    dump-unencrypted-data\t dump unencrypted wallet data\r
    new-address\t\t\t Generates new public address of the current wallet and shows it\r
    send <address> <amount>\t send funds\r
    addresses\t\t\t alias for 'show-address'\r
    show-addresses\t\t Shows all generated public addresses of the current wallet\r
    sign <transaction>\t\t sign transaction\r
    start-daemon\t\t Start the wallet daemon\r
\r
rpc [command] - run RPC command against the default Zuad instance\r
\r
    rpc\t\tdisplays rpc usage help\r
    rpc help\tlist supported RPC commands\r
`)

        } break;
    }
}


/*
    build(...args) {

        return new Promise(async (resolve, reject) => {

            const node_modules = path.join(this.appFolder,'build','node_modules');
            if(!fs.existsSync(node_modules)) {
                await this.spawn(this.NPM,['install'], { stdio : 'inherit'});
            }

            this.spawn(process.argv[0], [path.join(this.appFolder,'build','build.js'), ...args], {
                cwd : path.join(this.appFolder,'build')
            }).then(()=>{
                let target = this.manager.getDeployableBinary('zuad');
                if(fs.existsSync(target)) {
                    this.log(`setting build type to 'local'`);
                    this.set('build','local').then(resolve, reject);
                }
            }, reject);
        })

    }
*/

/*
    ls(...args) {
        const tasks = this.manager.tasks;


    }

    restart() {
        this.controller.restartDaemons();
    }

    async stop(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type.toLowerCase(), task.id.toLowerCase()].includes(ident.toLowerCase()); });
            let jobs = tasks.map(t => t.impl.terminate());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} stopped`);
            return Promise.resolve();
        } 
        else
            return this.controller.stopDaemons();
    }

    async start(ident) {
        if(ident) {
            let tasks = this.manager.tasks.filter(task => { return [task.type.toLowerCase(), task.id.toLowerCase()].includes(ident.toLowerCase()); });
            let jobs = tasks.map(t => t.impl.run());
            await Promise.all(jobs);
            this.log(`${jobs.length} service${jobs.length == 1 ? '' : 's'} started`);
            return Promise.resolve();
        }
        else
            return this.controller.initDaemons();
    }
*/
    spawn(proc, args, opts) {
        console.log('CONSOLE SPAWN',proc,args,this.terminal);
        return utils.spawn(proc, args, {
            stdout : (data) => { this.terminal.term.write(data.toString().replace(/\n/g,'\r\n')); return data; },
            cwd : this.manager.appFolder,
            ...opts
        }, this.terminal);
    }

    log(...args) {
        this.terminal.write(...args);
    }
}

module.exports = Console;