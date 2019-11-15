import { __decorate, __metadata, __param } from "tslib";
/* eslint-disable no-await-in-loop */
import { bound } from '@aurelia/kernel';
import { IDOM, IScheduler, TaskQueue, IClock, DOM } from '@aurelia/runtime';
import { HTMLDOM } from '@aurelia/runtime-html';
// Note on the flush requestors: we're probably overdoing it here with the binds and all the wrapping.
// Just want to start off with something as robust as possible, add many tests first so that we're sure it all works, etc.
// Once all the proper tests are in place, we can then start simplifying and rely on those tests to tell us precisely which things are necessary and which aren't.
// Besides looking at test results, we also need to look at benchmark results, memory usage, memory leaks, etc.
function createQueueMicrotaskFlushRequestor(window, flush) {
    return (function ($window, $flush) {
        const callFlush = function () {
            $flush();
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
        return function () {
            $window.queueMicrotask(callFlush);
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
    })(window, flush);
}
function createPromiseFlushRequestor(flush) {
    return (function ($flush) {
        const callFlush = function () {
            $flush();
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
        // eslint-disable-next-line compat/compat
        const p = Promise.resolve();
        return function () {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            p.then(callFlush);
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
    })(flush);
}
function createMutationObserverFlushRequestor(window, flush) {
    return (function ($window, $flush) {
        const callFlush = function () {
            $flush();
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
        const observer = new $window.MutationObserver(callFlush);
        const node = $window.document.createTextNode('a');
        // eslint-disable-next-line compat/compat
        const flip = Object.assign(Object.create(null), { a: 'b', b: 'a' });
        let val = 'a';
        observer.observe(node, { characterData: true });
        return function () {
            node.data = val = flip[val];
            // eslint-disable-next-line no-extra-bind
        }.bind(void 0);
    })(window, flush);
}
// Create a microtask queue, trying the available options starting with the most performant
const createMicrotaskFlushRequestor = (function () {
    // Ensure we only ever create one requestor (at least, per loaded bundle..).
    let called = false;
    return function (wnd, flush) {
        if (called) {
            throw new Error('Cannot have more than one global MicrotaskFlushRequestor');
        }
        called = true;
        if (wnd.queueMicrotask !== void 0 && wnd.queueMicrotask.toString().includes('[native code]')) {
            return createQueueMicrotaskFlushRequestor(wnd, flush);
        }
        else if (Promise.toString().includes('[native code]')) {
            return createPromiseFlushRequestor(flush);
        }
        else {
            return createMutationObserverFlushRequestor(wnd, flush);
        }
    };
})();
const createPostMessageFlushRequestor = (function () {
    let called = false;
    return function (window, flush) {
        if (called) {
            throw new Error('Cannot have more than one global PostMessageFlushRequestor');
        }
        called = true;
        return (function ($window, $flush) {
            const handleMessage = function (event) {
                if (event.data === 'au-message' && event.source === $window) {
                    $flush();
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            $window.addEventListener('message', handleMessage);
            return function () {
                $window.postMessage('au-message', $window.origin);
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
        })(window, flush);
    };
})();
const createSetTimeoutFlushRequestor = (function () {
    let called = false;
    return function (window, flush) {
        if (called) {
            throw new Error('Cannot have more than one global SetTimeoutFlushRequestor');
        }
        called = true;
        return (function ($window, $flush) {
            let handle = -1;
            const callFlush = function () {
                if (handle > -1) {
                    handle = -1;
                    $flush();
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const cancel = function () {
                if (handle > -1) {
                    $window.clearTimeout(handle);
                    handle = -1;
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const request = function () {
                if (handle === -1) {
                    handle = $window.setTimeout(callFlush, 0);
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            return {
                cancel,
                request,
            };
        })(window, flush);
    };
})();
const createRequestAnimationFrameFlushRequestor = (function () {
    let called = false;
    return function (window, flush) {
        if (called) {
            throw new Error('Cannot have more than one global RequestAnimationFrameFlushRequestor');
        }
        called = true;
        return (function ($window, $flush) {
            let handle = -1;
            const callFlush = function () {
                if (handle > -1) {
                    handle = -1;
                    $flush();
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const cancel = function () {
                if (handle > -1) {
                    $window.cancelAnimationFrame(handle);
                    handle = -1;
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const request = function () {
                if (handle === -1) {
                    handle = $window.requestAnimationFrame(callFlush);
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            return {
                cancel,
                request,
            };
        })(window, flush);
    };
})();
const createPostRequestAnimationFrameFlushRequestor = (function () {
    let called = false;
    return function (window, flush) {
        if (called) {
            throw new Error('Cannot have more than one global PostRequestAnimationFrameFlushRequestor');
        }
        called = true;
        return (function ($window, $flush) {
            let rafHandle = -1;
            let timeoutHandle = -1;
            const callFlush = function () {
                if (timeoutHandle > -1) {
                    timeoutHandle = -1;
                    $flush();
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const queueFlush = function () {
                if (rafHandle > -1) {
                    rafHandle = -1;
                    if (timeoutHandle === -1) {
                        timeoutHandle = $window.setTimeout(callFlush, 0);
                    }
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const cancel = function () {
                if (rafHandle > -1) {
                    $window.cancelAnimationFrame(rafHandle);
                    rafHandle = -1;
                }
                if (timeoutHandle > -1) {
                    $window.clearTimeout(timeoutHandle);
                    timeoutHandle = -1;
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const request = function () {
                if (rafHandle === -1) {
                    rafHandle = $window.requestAnimationFrame(queueFlush);
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            return {
                cancel,
                request,
            };
        })(window, flush);
    };
})();
const createRequestIdleCallbackFlushRequestor = (function () {
    let called = false;
    return function (window, flush) {
        if (called) {
            throw new Error('Cannot have more than one global RequestIdleCallbackFlushRequestor');
        }
        called = true;
        const hasNative = window.requestIdleCallback !== void 0 && window.requestIdleCallback.toString().includes('[native code]');
        return (function ($window, $flush) {
            let handle = -1;
            const options = { timeout: 1000 }; // TODO: make this configurable
            const callFlush = function () {
                if (handle > -1) {
                    handle = -1;
                    $flush();
                }
                // eslint-disable-next-line no-extra-bind
            }.bind(void 0);
            const cancel = hasNative
                ? function () {
                    if (handle > -1) {
                        $window.cancelIdleCallback(handle);
                        handle = -1;
                    }
                    // eslint-disable-next-line no-extra-bind
                }.bind(void 0)
                : function () {
                    if (handle > -1) {
                        $window.clearTimeout(handle);
                        handle = -1;
                    }
                    // eslint-disable-next-line no-extra-bind
                }.bind(void 0);
            const request = hasNative
                ? function () {
                    if (handle === -1) {
                        handle = $window.requestIdleCallback(callFlush, options);
                    }
                    // eslint-disable-next-line no-extra-bind
                }.bind(void 0)
                : function () {
                    if (handle === -1) {
                        // Instead of trying anything fancy with event handler debouncers (we could do that if there was a request for it),
                        // we just wait 45ms which is approximately the interval in a native idleCallback loop in chrome, to at least make it look
                        // the same from a timing perspective
                        handle = $window.setTimeout(callFlush, 45);
                    }
                    // eslint-disable-next-line no-extra-bind
                }.bind(void 0);
            return {
                cancel,
                request,
            };
        })(window, flush);
    };
})();
const defaultQueueTaskOptions = {
    delay: 0,
    preempt: false,
    priority: 1 /* render */,
    reusable: true,
    persistent: false,
};
let BrowserScheduler = class BrowserScheduler {
    constructor(clock, dom) {
        const microTaskTaskQueue = new TaskQueue({ clock, scheduler: this, priority: 0 /* microTask */ });
        const renderTaskQueue = new TaskQueue({ clock, scheduler: this, priority: 1 /* render */ });
        const macroTaskTaskQueue = new TaskQueue({ clock, scheduler: this, priority: 2 /* macroTask */ });
        const postRenderTaskQueue = new TaskQueue({ clock, scheduler: this, priority: 3 /* postRender */ });
        const idleTaskQueue = new TaskQueue({ clock, scheduler: this, priority: 4 /* idle */ });
        this.taskQueue = [
            microTaskTaskQueue,
            renderTaskQueue,
            macroTaskTaskQueue,
            postRenderTaskQueue,
            idleTaskQueue,
        ];
        const wnd = dom.window;
        this.flush = [
            createMicrotaskFlushRequestor(wnd, microTaskTaskQueue.flush.bind(microTaskTaskQueue)),
            createRequestAnimationFrameFlushRequestor(wnd, renderTaskQueue.flush.bind(renderTaskQueue)),
            createSetTimeoutFlushRequestor(wnd, macroTaskTaskQueue.flush.bind(macroTaskTaskQueue)),
            createPostRequestAnimationFrameFlushRequestor(wnd, postRenderTaskQueue.flush.bind(postRenderTaskQueue)),
            createRequestIdleCallbackFlushRequestor(wnd, idleTaskQueue.flush.bind(idleTaskQueue)),
        ];
    }
    static register(container) {
        container.registerResolver(IScheduler, {
            resolve() {
                if (DOM.scheduler === void 0) {
                    const clock = container.get(IClock);
                    const dom = container.get(IDOM);
                    const scheduler = new BrowserScheduler(clock, dom);
                    Reflect.defineProperty(DOM, 'scheduler', {
                        value: scheduler,
                        writable: false,
                        enumerable: false,
                        configurable: false,
                    });
                }
                return DOM.scheduler;
            }
        });
    }
    getTaskQueue(priority) {
        return this.taskQueue[priority];
    }
    yield(priority) {
        return this.taskQueue[priority].yield();
    }
    queueTask(callback, opts) {
        const { delay, preempt, priority, persistent, reusable } = { ...defaultQueueTaskOptions, ...opts };
        return this.taskQueue[priority].queueTask(callback, { delay, preempt, persistent, reusable });
    }
    getMicroTaskQueue() {
        return this.taskQueue[0 /* microTask */];
    }
    getRenderTaskQueue() {
        return this.taskQueue[1 /* render */];
    }
    getMacroTaskQueue() {
        return this.taskQueue[2 /* macroTask */];
    }
    getPostRenderTaskQueue() {
        return this.taskQueue[3 /* postRender */];
    }
    getIdleTaskQueue() {
        return this.taskQueue[4 /* idle */];
    }
    yieldMicroTask() {
        return this.taskQueue[0 /* microTask */].yield();
    }
    yieldRenderTask() {
        return this.taskQueue[1 /* render */].yield();
    }
    yieldMacroTask() {
        return this.taskQueue[2 /* macroTask */].yield();
    }
    yieldPostRenderTask() {
        return this.taskQueue[3 /* postRender */].yield();
    }
    yieldIdleTask() {
        return this.taskQueue[4 /* idle */].yield();
    }
    async yieldAll(repeat = 1) {
        // Yield sequentially from "large" to "small" so that any smaller tasks initiated by larger tasks are also still awaited,
        // as well as guaranteeing a single round of persistent tasks from each queue.
        // Don't change the order or into parallel, without thoroughly testing the ramifications on persistent and recursively queued tasks.
        // These aspects are currently relatively poorly tested.
        while (repeat-- > 0) {
            await this.yieldIdleTask();
            await this.yieldPostRenderTask();
            await this.yieldMacroTask();
            await this.yieldRenderTask();
            await this.yieldMicroTask();
        }
    }
    queueMicroTask(callback, opts) {
        return this.taskQueue[0 /* microTask */].queueTask(callback, opts);
    }
    queueRenderTask(callback, opts) {
        return this.taskQueue[1 /* render */].queueTask(callback, opts);
    }
    queueMacroTask(callback, opts) {
        return this.taskQueue[2 /* macroTask */].queueTask(callback, opts);
    }
    queuePostRenderTask(callback, opts) {
        return this.taskQueue[3 /* postRender */].queueTask(callback, opts);
    }
    queueIdleTask(callback, opts) {
        return this.taskQueue[4 /* idle */].queueTask(callback, opts);
    }
    requestFlush(taskQueue) {
        switch (taskQueue.priority) {
            case 0 /* microTask */:
                return this.flush[taskQueue.priority]();
            case 1 /* render */:
            case 2 /* macroTask */:
            case 3 /* postRender */:
            case 4 /* idle */:
                return this.flush[taskQueue.priority].request();
        }
    }
    cancelFlush(taskQueue) {
        switch (taskQueue.priority) {
            case 0 /* microTask */:
                return;
            case 1 /* render */:
            case 2 /* macroTask */:
            case 3 /* postRender */:
            case 4 /* idle */:
                return this.flush[taskQueue.priority].cancel();
        }
    }
};
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldMicroTask", null);
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldRenderTask", null);
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldMacroTask", null);
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldPostRenderTask", null);
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldIdleTask", null);
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BrowserScheduler.prototype, "yieldAll", null);
BrowserScheduler = __decorate([
    __param(0, IClock),
    __param(1, IDOM),
    __metadata("design:paramtypes", [Object, HTMLDOM])
], BrowserScheduler);
export { BrowserScheduler };
//# sourceMappingURL=browser-scheduler.js.map