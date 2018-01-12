# Spaceworker.js

make it easier than ever before to launch you rocket (aka webworker) to do some expensive work off the main thread.


## How to run it

import the spaceworker.js into your project

app.js
```javascript
const worker = SpaceWorker("worker.js")

worker.run("sayHelloWorld", "hello", "world")
    .then((result)=>{
        console.log(result) // hello world :)
    })
```
worker.js
```javascript
importScripts("http://localhost:8081/spaceworker.js") // or where you put the spaceworker.js file

class ISS {
    sayHelloWorld(hello, world) {
        return hello + " " + world + " :)"
    }
}

SpaceWorker.provide(ISS, self)
```