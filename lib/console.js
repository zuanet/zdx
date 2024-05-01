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
        

        terminal.write(`Zua-Desktop console v${pkg.version}\r\n\r\ntype 'help' for usage information\n`);


        terminal.registerLinkHandler(controller.handleBrowserLink);
    }

	// getDeployableBinary(...args) {
	// 	let buildType = this.controller.buildType || 'generic';
	// 	switch(buildType) {
	// 		case 'generic': {
	// 			return path.join(this.manager.getBinaryFolder(), ...args)+this.PLATFORM_BINARY_EXTENSION;
	// 		}
			
	// 		case 'local': {
	// 			return path.join(os.homedir(),'.zua-gesktop','bin',utils.platform, ...args)+this.PLATFORM_BINARY_EXTENSION;
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
