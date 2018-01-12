const workers = {}

class SpaceController {
    constructor (path) {
        if(path === undefined) {
            throw new Error('Missing path to your Worker!')
        }
        this.worker = null
        this.loaded = false
        
        this.functionCalls = {}

        this.run = this.run.bind(this)

        this.fetchedWorker = fetch(path)
            .then(res => res.text())
            .then(text => {
                const blob = new Blob([text])
                const blobURL = window.URL.createObjectURL(blob)
                this.worker = new Worker(blobURL)
                this.loaded = true

                this.worker.addEventListener('message', e => {
                    const type = e.data.type
                    if(type === 'init') {
                        workers[e.data.name] = {
                            controller: this,
                            methods: e.data.methods
                        }
                    }
                    if(type === 'functionCall') {
                        this.functionCalls[e.data.id](e.data.msg)
                    }
                })

            })
    }

    run(func, ...args) {
        return this.fetchedWorker
            .then(() => {
                return new Promise((resolve)=>{
                    const id = guid()
                    this.functionCalls[id] = (data) => {
                        resolve(data)
                    }
                    this.worker.postMessage({
                        type: 'functionCall',
                        func: func,
                        args: args,
                        id: id
                    })
                })
            })
    }
    close() {
        this.worker.terminate()
    }

}

const SpaceWorker = {
    provide: (mod, self)=>{
        const methods = getInstanceMethodNames(new mod())
        self.addEventListener('message', e => {
            if(e.data.type === 'functionCall') {
                if(methods.includes(e.data.func)) {
                    const m = new mod()
                    self.postMessage({
                        type: 'functionCall',
                        id: e.data.id,
                        msg: m[e.data.func](...e.data.args)
                    })
                } else {
                    throw new Error('Function ' + e.data.func + ' was not found on ' + mod.prototype.constructor.name)
                }
            }
        })

        self.postMessage({
            type: 'init',
            name: mod.prototype.constructor.name,
            methods: methods
        })
    }
}



function hasMethod (obj, name) {
    const desc = Object.getOwnPropertyDescriptor (obj, name)
    return !!desc && typeof desc.value === 'function'
}

function getInstanceMethodNames (obj, stop) {
    let array = []
    let proto = Object.getPrototypeOf (obj)
    while (proto && proto !== stop) {
        Object.getOwnPropertyNames (proto)
            .forEach (name => {
                if (name !== 'constructor') {
                    if (hasMethod (proto, name)) {
                        array.push (name)
                    }
                }
            })
        proto = Object.getPrototypeOf (proto)
    }
    return array
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1)
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4()
}