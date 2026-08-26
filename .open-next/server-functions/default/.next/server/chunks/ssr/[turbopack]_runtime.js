const RUNTIME_PUBLIC_PATH = "server/chunks/ssr/[turbopack]_runtime.js";
const RELATIVE_ROOT_PATH = "..";
const ASSET_PREFIX = "/_next/";
const WORKER_FORWARDED_GLOBALS = ["NEXT_DEPLOYMENT_ID","NEXT_CLIENT_ASSET_SUFFIX"];
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        const { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache[id];
    if (!module) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache[id] = module;
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings);
}
contextPrototype.s = esmExport;
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                for (const obj of reexportedObjects){
                    const value = Reflect.get(obj, prop);
                    if (value !== undefined) return value;
                }
                return undefined;
            },
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
function isPromise(maybePromise) {
    return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}
function isAsyncModuleExt(obj) {
    return turbopackQueues in obj;
}
function createPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        reject = rej;
        resolve = res;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
// everything below is adapted from webpack
// https://github.com/webpack/webpack/blob/6be4065ade1e252c1d8dcba4af0f43e32af1bdc1/lib/runtime/AsyncModuleRuntimeModule.js#L13
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');
function resolveQueue(queue) {
    if (queue && queue.status !== 1) {
        queue.status = 1;
        queue.forEach((fn)=>fn.queueCount--);
        queue.forEach((fn)=>fn.queueCount-- ? fn.queueCount++ : fn());
    }
}
function wrapDeps(deps) {
    return deps.map((dep)=>{
        if (dep !== null && typeof dep === 'object') {
            if (isAsyncModuleExt(dep)) return dep;
            if (isPromise(dep)) {
                const queue = Object.assign([], {
                    status: 0
                });
                const obj = {
                    [turbopackExports]: {},
                    [turbopackQueues]: (fn)=>fn(queue)
                };
                dep.then((res)=>{
                    obj[turbopackExports] = res;
                    resolveQueue(queue);
                }, (err)=>{
                    obj[turbopackError] = err;
                    resolveQueue(queue);
                });
                return obj;
            }
        }
        return {
            [turbopackExports]: dep,
            [turbopackQueues]: ()=>{}
        };
    });
}
function asyncModule(body, hasAwait) {
    const module = this.m;
    const queue = hasAwait ? Object.assign([], {
        status: -1
    }) : undefined;
    const depQueues = new Set();
    const { resolve, reject, promise: rawPromise } = createPromise();
    const promise = Object.assign(rawPromise, {
        [turbopackExports]: module.exports,
        [turbopackQueues]: (fn)=>{
            queue && fn(queue);
            depQueues.forEach(fn);
            promise['catch'](()=>{});
        }
    });
    const attributes = {
        get () {
            return promise;
        },
        set (v) {
            // Calling `esmExport` leads to this.
            if (v !== promise) {
                promise[turbopackExports] = v;
            }
        }
    };
    Object.defineProperty(module, 'exports', attributes);
    Object.defineProperty(module, 'namespaceObject', attributes);
    function handleAsyncDependencies(deps) {
        const currentDeps = wrapDeps(deps);
        const getResult = ()=>currentDeps.map((d)=>{
                if (d[turbopackError]) throw d[turbopackError];
                return d[turbopackExports];
            });
        const { promise, resolve } = createPromise();
        const fn = Object.assign(()=>resolve(getResult), {
            queueCount: 0
        });
        function fnQueue(q) {
            if (q !== queue && !depQueues.has(q)) {
                depQueues.add(q);
                if (q && q.status === 0) {
                    fn.queueCount++;
                    q.push(fn);
                }
            }
        }
        currentDeps.map((dep)=>dep[turbopackQueues](fnQueue));
        return fn.queueCount ? promise : getResult();
    }
    function asyncResult(err) {
        if (err) {
            reject(promise[turbopackError] = err);
        } else {
            resolve(promise[turbopackExports]);
        }
        resolveQueue(queue);
    }
    body(handleAsyncDependencies, asyncResult);
    if (queue && queue.status === -1) {
        queue.status = 0;
    }
}
contextPrototype.a = asyncModule;
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime/runtime-utils.ts" />
function readWebAssemblyAsResponse(path) {
    const { createReadStream } = require('fs');
    const { Readable } = require('stream');
    const stream = createReadStream(path);
    // @ts-ignore unfortunately there's a slight type mismatch with the stream.
    return new Response(Readable.toWeb(stream), {
        headers: {
            'content-type': 'application/wasm'
        }
    });
}
async function compileWebAssemblyFromPath(path) {
    const response = readWebAssemblyAsResponse(path);
    return await WebAssembly.compileStreaming(response);
}
async function instantiateWebAssemblyFromPath(path, importsObj) {
    const response = readWebAssemblyAsResponse(path);
    const { instance } = await WebAssembly.instantiateStreaming(response, importsObj);
    return instance.exports;
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="../../shared-node/node-wasm-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = Object.create(null);
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
async function loadWebAssembly(chunkPath, _edgeModule, imports) {
  const mod = await loadWasmChunk(chunkPath);
  const { exports } = await WebAssembly.instantiate(mod, imports);
  return exports;
}
contextPrototype.w = loadWebAssembly;
function loadWebAssemblyModule(chunkPath, _edgeModule) {
  return loadWasmChunk(chunkPath);
}
contextPrototype.u = loadWebAssemblyModule;
/**
 * Creates a Node.js worker thread by instantiating the given WorkerConstructor
 * with the appropriate path and options, including forwarded globals.
 *
 * @param WorkerConstructor The Worker constructor from worker_threads
 * @param workerPath Path to the worker entry chunk
 * @param workerOptions options to pass to the Worker constructor (optional)
 */ function createWorker(WorkerConstructor, workerPath, workerOptions) {
    // Build the forwarded globals object
    const forwardedGlobals = {};
    for (const name of WORKER_FORWARDED_GLOBALS){
        forwardedGlobals[name] = globalThis[name];
    }
    // Merge workerData with forwarded globals
    const existingWorkerData = workerOptions?.workerData || {};
    const options = {
        ...workerOptions,
        workerData: {
            ...typeof existingWorkerData === 'object' ? existingWorkerData : {},
            __turbopack_globals__: forwardedGlobals
        }
    };
    return new WorkerConstructor(workerPath, options);
}
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.b = createWorker;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache[id] = module1;
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache[id];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache[moduleId];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[root-of-the-server]__0-0atii._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-0atii._.js");
      case "server/chunks/ssr/[root-of-the-server]__0g5s-90._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0g5s-90._.js");
      case "server/chunks/ssr/[root-of-the-server]__0ln09ua._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0ln09ua._.js");
      case "server/chunks/ssr/[root-of-the-server]__0lpvwqm._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0lpvwqm._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_0y2yovo._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_0y2yovo._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js");
      case "server/chunks/ssr/node_modules_0h91jdk._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0h91jdk._.js");
      case "server/chunks/ssr/node_modules_0vtauab._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0vtauab._.js");
      case "server/chunks/ssr/node_modules_next_1iemwhs._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_1iemwhs._.js");
      case "server/chunks/ssr/node_modules_next_dist_0opsz1q._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0opsz1q._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0k6_l1j.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0k6_l1j.js");
      case "server/chunks/ssr/[root-of-the-server]__0f90i_z._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0f90i_z._.js");
      case "server/chunks/ssr/[root-of-the-server]__1dky4g0._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1dky4g0._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0-o-goa.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0-o-goa.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19--w_z.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19--w_z.js");
      case "server/chunks/ssr/[root-of-the-server]__0yu1-rg._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0yu1-rg._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_dashboard_page_actions_1fa04hu.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_dashboard_page_actions_1fa04hu.js");
      case "server/chunks/ssr/node_modules_@opennextjs_cloudflare_dist_api_index_0sdymeh.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_@opennextjs_cloudflare_dist_api_index_0sdymeh.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0ocmn28.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0ocmn28.js");
      case "server/chunks/ssr/src_app_admin_dashboard_AdminDashboardClient_tsx_0nrixfn._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_dashboard_AdminDashboardClient_tsx_0nrixfn._.js");
      case "server/chunks/ssr/src_components_SellerStars_tsx_03wgfle._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_SellerStars_tsx_03wgfle._.js");
      case "server/chunks/ssr/src_lib_0i02cv2._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_0i02cv2._.js");
      case "server/chunks/[root-of-the-server]__0xuaoik._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0xuaoik._.js");
      case "server/chunks/[root-of-the-server]__14hi9zp._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__14hi9zp._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_next-internal_server_app_api_admin_finance_route_actions_12ckh14.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_finance_route_actions_12ckh14.js");
      case "server/chunks/node_modules_@opennextjs_cloudflare_dist_api_index_0ttjp4q.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/node_modules_@opennextjs_cloudflare_dist_api_index_0ttjp4q.js");
      case "server/chunks/src_lib_json-store_ts_0m90tqd._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/src_lib_json-store_ts_0m90tqd._.js");
      case "server/chunks/[root-of-the-server]__189t0lr._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__189t0lr._.js");
      case "server/chunks/_next-internal_server_app_api_admin_kyc_route_actions_0j3zxqf.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_kyc_route_actions_0j3zxqf.js");
      case "server/chunks/node_modules_next_16bdwk4._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/node_modules_next_16bdwk4._.js");
      case "server/chunks/[root-of-the-server]__0yj95hg._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0yj95hg._.js");
      case "server/chunks/_next-internal_server_app_api_admin_kyc-document_route_actions_0yyf8l8.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_kyc-document_route_actions_0yyf8l8.js");
      case "server/chunks/[root-of-the-server]__0wf4nq4._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0wf4nq4._.js");
      case "server/chunks/_next-internal_server_app_api_admin_seller-metrics_route_actions_1gmyz48.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_seller-metrics_route_actions_1gmyz48.js");
      case "server/chunks/[root-of-the-server]__0dclq8u._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0dclq8u._.js");
      case "server/chunks/_next-internal_server_app_api_admin_withdrawals_route_actions_1khztgi.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_withdrawals_route_actions_1khztgi.js");
      case "server/chunks/[root-of-the-server]__20-scsm._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__20-scsm._.js");
      case "server/chunks/_next-internal_server_app_api_avatar_route_actions_1qtwriu.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_avatar_route_actions_1qtwriu.js");
      case "server/chunks/[root-of-the-server]__0lbq_iu._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0lbq_iu._.js");
      case "server/chunks/_next-internal_server_app_api_buyer_profile_route_actions_0sbo2w9.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_buyer_profile_route_actions_0sbo2w9.js");
      case "server/chunks/[root-of-the-server]__0u4td94._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0u4td94._.js");
      case "server/chunks/_next-internal_server_app_api_dashboard_buyer_route_actions_18ayn2m.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_dashboard_buyer_route_actions_18ayn2m.js");
      case "server/chunks/[root-of-the-server]__0vu8qvj._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0vu8qvj._.js");
      case "server/chunks/_next-internal_server_app_api_dashboard_seller_route_actions_0nlx18d.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_dashboard_seller_route_actions_0nlx18d.js");
      case "server/chunks/[root-of-the-server]__14kjima._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__14kjima._.js");
      case "server/chunks/_next-internal_server_app_api_database-status_route_actions_0m3as55.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_database-status_route_actions_0m3as55.js");
      case "server/chunks/[root-of-the-server]__0-u96g8._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0-u96g8._.js");
      case "server/chunks/[root-of-the-server]__1j43nbo._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1j43nbo._.js");
      case "server/chunks/_next-internal_server_app_api_download-source_route_actions_1509fsn.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_download-source_route_actions_1509fsn.js");
      case "server/chunks/src_generated_source-snapshot_json_[json]_cjs_0zaxq_a._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/src_generated_source-snapshot_json_[json]_cjs_0zaxq_a._.js");
      case "server/chunks/[root-of-the-server]__16j9orb._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__16j9orb._.js");
      case "server/chunks/_next-internal_server_app_api_external-link_route_actions_0gnork5.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_external-link_route_actions_0gnork5.js");
      case "server/chunks/[root-of-the-server]__0bw0y_5._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0bw0y_5._.js");
      case "server/chunks/_next-internal_server_app_api_health_route_actions_1ryftkb.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_health_route_actions_1ryftkb.js");
      case "server/chunks/[root-of-the-server]__0e8swek._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0e8swek._.js");
      case "server/chunks/_next-internal_server_app_api_live-content_route_actions_0_lco96.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_live-content_route_actions_0_lco96.js");
      case "server/chunks/[root-of-the-server]__0t2-wq9._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0t2-wq9._.js");
      case "server/chunks/_next-internal_server_app_api_login_route_actions_1apjjct.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_login_route_actions_1apjjct.js");
      case "server/chunks/[root-of-the-server]__0dfeapy._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0dfeapy._.js");
      case "server/chunks/_next-internal_server_app_api_logout_route_actions_0gzx3on.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_logout_route_actions_0gzx3on.js");
      case "server/chunks/[root-of-the-server]__1uiqg75._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1uiqg75._.js");
      case "server/chunks/_next-internal_server_app_api_messages_route_actions_08v1vp_.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_messages_route_actions_08v1vp_.js");
      case "server/chunks/[root-of-the-server]__0cjxnub._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0cjxnub._.js");
      case "server/chunks/_next-internal_server_app_api_orders_archive_route_actions_0uuvaqa.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_archive_route_actions_0uuvaqa.js");
      case "server/chunks/[root-of-the-server]__1zccyr3._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1zccyr3._.js");
      case "server/chunks/_next-internal_server_app_api_orders_cancel_route_actions_11y6egz.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_cancel_route_actions_11y6egz.js");
      case "server/chunks/[root-of-the-server]__120rr__._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__120rr__._.js");
      case "server/chunks/_next-internal_server_app_api_orders_confirm-received_route_actions_1qppuir.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_confirm-received_route_actions_1qppuir.js");
      case "server/chunks/[root-of-the-server]__1r83mwv._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1r83mwv._.js");
      case "server/chunks/_next-internal_server_app_api_orders_pay_route_actions_18hg-ts.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_pay_route_actions_18hg-ts.js");
      case "server/chunks/[root-of-the-server]__0f9mb9g._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0f9mb9g._.js");
      case "server/chunks/_next-internal_server_app_api_orders_select-offer_route_actions_06xrhx2.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_select-offer_route_actions_06xrhx2.js");
      case "server/chunks/[root-of-the-server]__0_crdi6._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0_crdi6._.js");
      case "server/chunks/_next-internal_server_app_api_orders_ship_route_actions_1nuzwv8.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_orders_ship_route_actions_1nuzwv8.js");
      case "server/chunks/[root-of-the-server]__1fm49s9._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1fm49s9._.js");
      case "server/chunks/_next-internal_server_app_api_password_forgot_route_actions_118-udl.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_password_forgot_route_actions_118-udl.js");
      case "server/chunks/[root-of-the-server]__1w13y_a._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1w13y_a._.js");
      case "server/chunks/_next-internal_server_app_api_password_reset_route_actions_1s_3v76.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_password_reset_route_actions_1s_3v76.js");
      case "server/chunks/[root-of-the-server]__1he9uv-._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1he9uv-._.js");
      case "server/chunks/_next-internal_server_app_api_product-image_route_actions_0qlqh_v.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_product-image_route_actions_0qlqh_v.js");
      case "server/chunks/[root-of-the-server]__09wvj20._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__09wvj20._.js");
      case "server/chunks/_next-internal_server_app_api_register_route_actions_0vlzh_c.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_register_route_actions_0vlzh_c.js");
      case "server/chunks/[root-of-the-server]__1r6xoho._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1r6xoho._.js");
      case "server/chunks/_next-internal_server_app_api_reviews_route_actions_0yv3cz6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_reviews_route_actions_0yv3cz6.js");
      case "server/chunks/[root-of-the-server]__1f5x2yp._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1f5x2yp._.js");
      case "server/chunks/_next-internal_server_app_api_seller_profile_route_actions_0jku95k.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_seller_profile_route_actions_0jku95k.js");
      case "server/chunks/[root-of-the-server]__1plb00y._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1plb00y._.js");
      case "server/chunks/_next-internal_server_app_api_seller-matching-requests_route_actions_1itb_qx.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_seller-matching-requests_route_actions_1itb_qx.js");
      case "server/chunks/[root-of-the-server]__1lkyzqf._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1lkyzqf._.js");
      case "server/chunks/_next-internal_server_app_api_seller-performance-event_route_actions_0wmi0t3.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_seller-performance-event_route_actions_0wmi0t3.js");
      case "server/chunks/[root-of-the-server]__16csiy_._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__16csiy_._.js");
      case "server/chunks/_next-internal_server_app_api_seller-request-action_route_actions_0zv1jf6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_seller-request-action_route_actions_0zv1jf6.js");
      case "server/chunks/[root-of-the-server]__1kaau26._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1kaau26._.js");
      case "server/chunks/_next-internal_server_app_api_seller-score_route_actions_1omsiv_.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_seller-score_route_actions_1omsiv_.js");
      case "server/chunks/[root-of-the-server]__1cl9w9o._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1cl9w9o._.js");
      case "server/chunks/_next-internal_server_app_api_source-files_route_actions_0cvoh94.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_source-files_route_actions_0cvoh94.js");
      case "server/chunks/[root-of-the-server]__075mfry._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__075mfry._.js");
      case "server/chunks/_next-internal_server_app_api_submit-offer_route_actions_0y6o200.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_submit-offer_route_actions_0y6o200.js");
      case "server/chunks/node_modules_next_1ir7qn-._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/node_modules_next_1ir7qn-._.js");
      case "server/chunks/[root-of-the-server]__1w21-oq._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1w21-oq._.js");
      case "server/chunks/_next-internal_server_app_api_submit-request_route_actions_1egbt-u.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_submit-request_route_actions_1egbt-u.js");
      case "server/chunks/[root-of-the-server]__0xx7zvt._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0xx7zvt._.js");
      case "server/chunks/_next-internal_server_app_api_wallet_topup_route_actions_06ej2al.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_wallet_topup_route_actions_06ej2al.js");
      case "server/chunks/[root-of-the-server]__1n700ow._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1n700ow._.js");
      case "server/chunks/_next-internal_server_app_api_wallet_withdraw_route_actions_0fmp_fo.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_wallet_withdraw_route_actions_0fmp_fo.js");
      case "server/chunks/ssr/[root-of-the-server]__1e4rldd._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1e4rldd._.js");
      case "server/chunks/ssr/_next-internal_server_app_become-seller_page_actions_0fqa3z2.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_become-seller_page_actions_0fqa3z2.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_195w9h1.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_195w9h1.js");
      case "server/chunks/ssr/src_app_become-seller_page_tsx_0xmstr0._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_become-seller_page_tsx_0xmstr0._.js");
      case "server/chunks/ssr/[root-of-the-server]__1edkrdq._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1edkrdq._.js");
      case "server/chunks/ssr/_next-internal_server_app_buyer_dashboard_page_actions_0hl__bj.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_buyer_dashboard_page_actions_0hl__bj.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ddk_k2.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ddk_k2.js");
      case "server/chunks/ssr/src_1g4z8kf._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_1g4z8kf._.js");
      case "server/chunks/ssr/src_app_buyer_dashboard_page_tsx_1crypvy._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_buyer_dashboard_page_tsx_1crypvy._.js");
      case "server/chunks/ssr/[root-of-the-server]__03s1nxz._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__03s1nxz._.js");
      case "server/chunks/ssr/_next-internal_server_app_buyers_[id]_page_actions_1_efli0.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_buyers_[id]_page_actions_1_efli0.js");
      case "server/chunks/ssr/node_modules_next_dist_1d_onnt._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1d_onnt._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10c3994.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10c3994.js");
      case "server/chunks/ssr/[root-of-the-server]__1jr0xyw._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1jr0xyw._.js");
      case "server/chunks/ssr/_next-internal_server_app_buyers_page_actions_0x11cbk.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_buyers_page_actions_0x11cbk.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0195i8u.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0195i8u.js");
      case "server/chunks/ssr/[root-of-the-server]__0kni2jn._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0kni2jn._.js");
      case "server/chunks/ssr/_next-internal_server_app_categories_[id]_page_actions_0-ly6xx.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_categories_[id]_page_actions_0-ly6xx.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1wc3wes.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1wc3wes.js");
      case "server/chunks/ssr/src_lib_20364yy._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_20364yy._.js");
      case "server/chunks/ssr/[root-of-the-server]__0-w8fgr._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-w8fgr._.js");
      case "server/chunks/ssr/_next-internal_server_app_categories_page_actions_0i9neek.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_categories_page_actions_0i9neek.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0tllqy6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0tllqy6.js");
      case "server/chunks/ssr/[root-of-the-server]__1n76r2t._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1n76r2t._.js");
      case "server/chunks/ssr/_next-internal_server_app_contact_page_actions_0kuoobr.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_contact_page_actions_0kuoobr.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0jcz9n5.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0jcz9n5.js");
      case "server/chunks/ssr/src_app_contact_ContactClient_tsx_0k2ei8u._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_contact_ContactClient_tsx_0k2ei8u._.js");
      case "server/chunks/ssr/[root-of-the-server]__1nsam3s._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1nsam3s._.js");
      case "server/chunks/ssr/_next-internal_server_app_external-link_page_actions_0hc7997.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_external-link_page_actions_0hc7997.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_11v3tbv.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_11v3tbv.js");
      case "server/chunks/ssr/[root-of-the-server]__1xyxk4r._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1xyxk4r._.js");
      case "server/chunks/ssr/_next-internal_server_app_forgot-password_page_actions_20f55ri.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_forgot-password_page_actions_20f55ri.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ko9q2z.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ko9q2z.js");
      case "server/chunks/ssr/src_app_forgot-password_page_tsx_0dn_4c_._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_forgot-password_page_tsx_0dn_4c_._.js");
      case "server/chunks/ssr/[root-of-the-server]__1qwhgi1._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1qwhgi1._.js");
      case "server/chunks/ssr/_next-internal_server_app_how-it-works_page_actions_0zce6j5.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_how-it-works_page_actions_0zce6j5.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1scrcij.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1scrcij.js");
      case "server/chunks/ssr/[root-of-the-server]__0qxwiny._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0qxwiny._.js");
      case "server/chunks/ssr/_next-internal_server_app_login_page_actions_04fnjo0.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_login_page_actions_04fnjo0.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ca3_9j.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1ca3_9j.js");
      case "server/chunks/ssr/src_app_login_page_tsx_0yrgg2z._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_login_page_tsx_0yrgg2z._.js");
      case "server/chunks/ssr/[root-of-the-server]__0mywak0._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0mywak0._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0min3q4.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0min3q4.js");
      case "server/chunks/ssr/[root-of-the-server]__1fxstzm._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1fxstzm._.js");
      case "server/chunks/ssr/_next-internal_server_app_register_page_actions_1op-s-x.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_register_page_actions_1op-s-x.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0ya_r6b.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0ya_r6b.js");
      case "server/chunks/ssr/src_app_register_page_tsx_0l87b37._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_register_page_tsx_0l87b37._.js");
      case "server/chunks/ssr/[root-of-the-server]__1p7ni6n._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1p7ni6n._.js");
      case "server/chunks/ssr/_next-internal_server_app_request-purchase_page_actions_0u0tz2u.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_request-purchase_page_actions_0u0tz2u.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0l9bava.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0l9bava.js");
      case "server/chunks/ssr/src_app_request-purchase_page_tsx_05tcfnf._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_request-purchase_page_tsx_05tcfnf._.js");
      case "server/chunks/ssr/[root-of-the-server]__0u7dmyk._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0u7dmyk._.js");
      case "server/chunks/ssr/_next-internal_server_app_requests_[id]_checkout_page_actions_0yhi244.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_requests_[id]_checkout_page_actions_0yhi244.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0swgr62.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0swgr62.js");
      case "server/chunks/ssr/src_app_requests_[id]_checkout_page_tsx_0sz-woi._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_requests_[id]_checkout_page_tsx_0sz-woi._.js");
      case "server/chunks/ssr/[root-of-the-server]__1v2k9yr._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1v2k9yr._.js");
      case "server/chunks/ssr/_next-internal_server_app_requests_[id]_offer_page_actions_0opz_7o.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_requests_[id]_offer_page_actions_0opz_7o.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0a29vuy.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0a29vuy.js");
      case "server/chunks/ssr/src_app_requests_[id]_offer_OfferFormClient_tsx_14tacnv._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_requests_[id]_offer_OfferFormClient_tsx_14tacnv._.js");
      case "server/chunks/ssr/src_components_ProductImages_tsx_05odmpf._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_ProductImages_tsx_05odmpf._.js");
      case "server/chunks/ssr/[root-of-the-server]__11umm2q._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__11umm2q._.js");
      case "server/chunks/ssr/_next-internal_server_app_requests_[id]_page_actions_0dri2a6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_requests_[id]_page_actions_0dri2a6.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0uh08d9.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0uh08d9.js");
      case "server/chunks/ssr/src_app_requests_[id]_OfferAction_tsx_1c220e5._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_requests_[id]_OfferAction_tsx_1c220e5._.js");
      case "server/chunks/ssr/[root-of-the-server]__0fmuy06._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0fmuy06._.js");
      case "server/chunks/ssr/_next-internal_server_app_requests_page_actions_0raktk6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_requests_page_actions_0raktk6.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1o9nrh8.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1o9nrh8.js");
      case "server/chunks/ssr/src_1becdnq._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_1becdnq._.js");
      case "server/chunks/ssr/[root-of-the-server]__1aujds8._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1aujds8._.js");
      case "server/chunks/ssr/_next-internal_server_app_seller_dashboard_page_actions_0dcm0p9.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_seller_dashboard_page_actions_0dcm0p9.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0kd-2dp.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0kd-2dp.js");
      case "server/chunks/ssr/src_app_seller_dashboard_page_tsx_0rga5ed._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_seller_dashboard_page_tsx_0rga5ed._.js");
      case "server/chunks/ssr/src_components_0u44-ss._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_0u44-ss._.js");
      case "server/chunks/ssr/[root-of-the-server]__0qhku-e._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0qhku-e._.js");
      case "server/chunks/ssr/_next-internal_server_app_seller_sales_page_actions_1g4rjc6.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_seller_sales_page_actions_1g4rjc6.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qsbnls.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qsbnls.js");
      case "server/chunks/ssr/src_1cz1ecv._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_1cz1ecv._.js");
      case "server/chunks/ssr/[root-of-the-server]__0usreha._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0usreha._.js");
      case "server/chunks/ssr/_next-internal_server_app_sellers_[id]_page_actions_08n_8sw.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_sellers_[id]_page_actions_08n_8sw.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0wrc0di.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0wrc0di.js");
      case "server/chunks/ssr/src_app_sellers_[id]_page_tsx_1r5xeky._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_sellers_[id]_page_tsx_1r5xeky._.js");
      case "server/chunks/ssr/[root-of-the-server]__00fgsf7._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__00fgsf7._.js");
      case "server/chunks/ssr/_next-internal_server_app_sellers_page_actions_1m3waeu.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_sellers_page_actions_1m3waeu.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1-7e3a9.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1-7e3a9.js");
      case "server/chunks/ssr/[root-of-the-server]__0j8x_ql._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0j8x_ql._.js");
      case "server/chunks/ssr/_next-internal_server_app_source-code_page_actions_20nqrlo.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_source-code_page_actions_20nqrlo.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_09wpja7.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_09wpja7.js");
      case "server/chunks/ssr/src_app_source-code_page_tsx_0kwgf0j._.js": return require("/home/user/fazilatma/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_source-code_page_tsx_0kwgf0j._.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
