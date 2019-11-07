(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./functions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const functions_1 = require("./functions");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/ban-types */
    const metadataInternalSlot = new WeakMap();
    function $typeError(operation, args, paramName, actualValue, expectedType) {
        return new TypeError(`${operation}(${args.map(String).join(',')}) - Expected '${paramName}' to be of type ${expectedType}, but got: ${Object.prototype.toString.call(actualValue)} (${String(actualValue)})`);
    }
    function toPropertyKeyOrUndefined(propertyKey) {
        switch (typeof propertyKey) {
            case 'undefined':
            case 'string':
            case 'symbol':
                return propertyKey;
            default:
                return `${propertyKey}`;
        }
    }
    function toPropertyKey(propertyKey) {
        switch (typeof propertyKey) {
            case 'string':
            case 'symbol':
                return propertyKey;
            default:
                return `${propertyKey}`;
        }
    }
    function ensurePropertyKeyOrUndefined(propertyKey) {
        switch (typeof propertyKey) {
            case 'undefined':
            case 'string':
            case 'symbol':
                return propertyKey;
            default:
                throw new TypeError(`Invalid metadata propertyKey: ${propertyKey}.`);
        }
    }
    function GetOrCreateMetadataMap(O, P, Create) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let targetMetadata be the value of O's [[Metadata]] internal slot.
        let targetMetadata = metadataInternalSlot.get(O);
        // 3. If targetMetadata is undefined, then
        if (targetMetadata === void 0) {
            // 3. a. If Create is false, return undefined.
            if (!Create) {
                return void 0;
            }
            // 3. b. Set targetMetadata to be a newly created Map object.
            targetMetadata = new Map();
            // 3. c. Set the [[Metadata]] internal slot of O to targetMetadata.
            metadataInternalSlot.set(O, targetMetadata);
        }
        // 4. Let metadataMap be ? Invoke(targetMetadata, "get", P).
        let metadataMap = targetMetadata.get(P);
        // 5. If metadataMap is undefined, then
        if (metadataMap === void 0) {
            // 5. a. If Create is false, return undefined.
            if (!Create) {
                return void 0;
            }
            // 5. b. Set metadataMap to be a newly created Map object.
            metadataMap = new Map();
            // 5. c. Perform ? Invoke(targetMetadata, "set", P, metadataMap).
            targetMetadata.set(P, metadataMap);
        }
        // 6. Return metadataMap.
        return metadataMap;
    }
    // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
    function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
        const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);
        // 3. If metadataMap is undefined, return false.
        if (metadataMap === void 0) {
            return false;
        }
        // 4. Return ? ToBoolean(? Invoke(metadataMap, "has", MetadataKey)).
        return metadataMap.has(MetadataKey);
    }
    // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
    function OrdinaryHasMetadata(MetadataKey, O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let hasOwn be ? OrdinaryHasOwnMetadata(MetadataKey, O, P).
        // 3. If hasOwn is true, return true.
        if (OrdinaryHasOwnMetadata(MetadataKey, O, P)) {
            return true;
        }
        // 4. Let parent be ? O.[[GetPrototypeOf]]().
        const parent = Object.getPrototypeOf(O);
        // 5. If parent is not null, Return ? parent.[[HasMetadata]](MetadataKey, P).
        if (parent !== null) {
            return OrdinaryHasMetadata(MetadataKey, parent, P);
        }
        // 6. Return false.
        return false;
    }
    // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
    function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
        const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);
        // 3. If metadataMap is undefined, return undefined.
        if (metadataMap === void 0) {
            return void 0;
        }
        // 4. Return ? Invoke(metadataMap, "get", MetadataKey).
        return metadataMap.get(MetadataKey);
    }
    // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
    function OrdinaryGetMetadata(MetadataKey, O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let hasOwn be ? OrdinaryHasOwnMetadata(MetadataKey, O, P).
        // 3. If hasOwn is true, return ? OrdinaryGetOwnMetadata(MetadataKey, O, P).
        if (OrdinaryHasOwnMetadata(MetadataKey, O, P)) {
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
        }
        // 4. Let parent be ? O.[[GetPrototypeOf]]().
        const parent = Object.getPrototypeOf(O);
        // 5. If parent is not null, return ? parent.[[GetMetadata]](MetadataKey, P).
        if (parent !== null) {
            return OrdinaryGetMetadata(MetadataKey, parent, P);
        }
        // 6. Return undefined.
        return void 0;
    }
    // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
    function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, true).
        const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ true);
        // 3. Return ? Invoke(metadataMap, "set", MetadataKey, MetadataValue).
        metadataMap.set(MetadataKey, MetadataValue);
    }
    // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
    function OrdinaryOwnMetadataKeys(O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let keys be ? ArrayCreate(0).
        const keys = [];
        // 3. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
        const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);
        // 4. If metadataMap is undefined, return keys.
        if (metadataMap === void 0) {
            return keys;
        }
        // 5. Let keysObj be ? Invoke(metadataMap, "keys").
        const keysObj = metadataMap.keys();
        // 6. Let iterator be ? GetIterator(keysObj).
        // 7. Let k be 0.
        let k = 0;
        // 8. Repeat
        for (const key of keysObj) {
            // 8. a. Let Pk be ! ToString(k).
            // 8. b. Let next be ? IteratorStep(iterator).
            // 8. c. If next is false, then
            // 8. c. i. Let setStatus be ? Set(keys, "length", k, true).
            // 8. c. ii. Assert: setStatus is true.
            // 8. c. iii. Return keys.
            // 8. d. Let nextValue be ? IteratorValue(next).
            // 8. e. Let defineStatus be CreateDataPropertyOrThrow(keys, Pk, nextValue).
            keys[k] = key;
            // 8. f. If defineStatus is an abrupt completion, return ? IteratorClose(iterator, defineStatus).
            // 8. g. Increase k by 1.
            ++k;
        }
        return keys;
    }
    // 3.1.6.1 OrdinaryMetadataKeys(O, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
    function OrdinaryMetadataKeys(O, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let ownKeys be ? OrdinaryOwnMetadataKeys(O, P).
        const ownKeys = OrdinaryOwnMetadataKeys(O, P);
        // 3. Let parent be ? O.[[GetPrototypeOf]]().
        const parent = Object.getPrototypeOf(O);
        // 4. If parent is null, then return ownKeys.
        if (parent === null) {
            return ownKeys;
        }
        // 5. Let parentKeys be ? O.[[OrdinaryMetadataKeys]](P).
        const parentKeys = OrdinaryMetadataKeys(parent, P);
        // 6. Let ownKeysLen = ? Get(ownKeys, "length").
        const ownKeysLen = ownKeys.length;
        // 7. If ownKeysLen is 0, return parentKeys.
        if (ownKeysLen === 0) {
            return parentKeys;
        }
        // 8. Let parentKeysLen = ? Get(parentKeys, "length").
        const parentKeysLen = parentKeys.length;
        // 9. If parentKeysLen is 0, return ownKeys.
        if (parentKeysLen === 0) {
            return ownKeys;
        }
        // 10. Let set be a newly created Set object.
        const set = new Set();
        // 11. Let keys be ? ArrayCreate(0).
        const keys = [];
        // 12. Let k be 0.
        let k = 0;
        // 13. For each element key of ownKeys
        let key;
        for (let i = 0; i < ownKeysLen; ++i) {
            key = ownKeys[i];
            // 13. a. Let hasKey be ? Invoke(set, "has", key).
            // 13. b. If hasKey is false, then
            if (!set.has(key)) {
                // 13. b. i. Let Pk be ! ToString(k).
                // 13. b. ii. Perform ? Invoke(set, "add", key).
                set.add(key);
                // 13. b. iii. Let defineStatus be CreateDataProperty(keys, Pk, key).
                // 13. b. iv. Assert: defineStatus is true.
                keys[k] = key;
                // 13. b. v. Increase k by 1.
                ++k;
            }
        }
        // 14. For each element key of parentKeys
        for (let i = 0; i < parentKeysLen; ++i) {
            key = parentKeys[i];
            // 14. a. Let hasKey be ? Invoke(set, "has", key).
            // 14. b. If hasKey is false, then
            if (!set.has(key)) {
                // 14. b. i. Let Pk be ! ToString(k).
                // 14. b. ii. Perform ? Invoke(set, "add", key).
                set.add(key);
                // 14. b. iii. Let defineStatus be CreateDataProperty(keys, Pk, key).
                // 14. b. iv. Assert: defineStatus is true.
                keys[k] = key;
                // 14. b. v. Increase k by 1.
                ++k;
            }
        }
        // 15. Perform ? Set(keys, "length", k).
        // 16. return keys.
        return keys;
    }
    // 3.1.8 DeleteMetadata(MetadataKey, P)
    // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots-deletemetadata
    function OrdinaryDeleteMetadata(O, MetadataKey, P) {
        // 1. Assert: P is undefined or IsPropertyKey(P) is true.
        // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
        const metadataMap = GetOrCreateMetadataMap(O, P, false);
        // 3. If metadataMap is undefined, return false.
        if (metadataMap === void 0) {
            return false;
        }
        // 4. Return ? Invoke(metadataMap, "delete", MetadataKey).
        return metadataMap.delete(MetadataKey);
    }
    // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
    // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
    /**
     * A default metadata decorator factory that can be used on a class, class member, or parameter.
     *
     * @param metadataKey - The key for the metadata entry.
     * If `metadataKey` is already defined for the target and target key, the
     * metadataValue for that key will be overwritten.
     * @param metadataValue - The value for the metadata entry.
     * @returns A decorator function.
     */
    function metadata(metadataKey, metadataValue) {
        function decorator(target, propertyKey) {
            // 1. Assert: F has a [[MetadataKey]] internal slot whose value is an ECMAScript language value, or undefined.
            // 2. Assert: F has a [[MetadataValue]] internal slot whose value is an ECMAScript language value, or undefined.
            // 3. If Type(target) is not Object, throw a TypeError exception.
            if (!functions_1.isObject(target)) {
                throw $typeError('@metadata', [metadataKey, metadataValue, target, propertyKey], 'target', target, 'Object or Function');
            }
            // 4. If key is not undefined and IsPropertyKey(key) is false, throw a TypeError exception.
            // 5. Let metadataKey be the value of F's [[MetadataKey]] internal slot.
            // 6. Let metadataValue be the value of F's [[MetadataValue]] internal slot.
            // 7. Perform ? target.[[DefineMetadata]](metadataKey, metadataValue, target, key).
            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, ensurePropertyKeyOrUndefined(propertyKey));
            // 8. Return undefined.
        }
        return decorator;
    }
    exports.metadata = metadata;
    function decorate(decorators, target, propertyKey, attributes) {
        if (propertyKey !== void 0) {
            if (!Array.isArray(decorators)) {
                throw $typeError('Metadata.decorate', [decorators, target, propertyKey, attributes], 'decorators', decorators, 'Array');
            }
            if (!functions_1.isObject(target)) {
                throw $typeError('Metadata.decorate', [decorators, target, propertyKey, attributes], 'target', target, 'Object or Function');
            }
            if (!functions_1.isObject(attributes) && !functions_1.isNullOrUndefined(attributes)) {
                throw $typeError('Metadata.decorate', [decorators, target, propertyKey, attributes], 'attributes', attributes, 'Object, Function, null, or undefined');
            }
            if (attributes === null) {
                attributes = void 0;
            }
            propertyKey = toPropertyKey(propertyKey);
            return DecorateProperty(decorators, target, propertyKey, attributes);
        }
        else {
            if (!Array.isArray(decorators)) {
                throw $typeError('Metadata.decorate', [decorators, target, propertyKey, attributes], 'decorators', decorators, 'Array');
            }
            if (typeof target !== 'function') {
                throw $typeError('Metadata.decorate', [decorators, target, propertyKey, attributes], 'target', target, 'Function');
            }
            return DecorateConstructor(decorators, target);
        }
    }
    function DecorateConstructor(decorators, target) {
        for (let i = decorators.length - 1; i >= 0; --i) {
            const decorator = decorators[i];
            const decorated = decorator(target);
            if (!functions_1.isNullOrUndefined(decorated)) {
                if (typeof decorated !== 'function') {
                    throw $typeError('DecorateConstructor', [decorators, target], 'decorated', decorated, 'Function, null, or undefined');
                }
                target = decorated;
            }
        }
        return target;
    }
    function DecorateProperty(decorators, target, propertyKey, descriptor) {
        for (let i = decorators.length - 1; i >= 0; --i) {
            const decorator = decorators[i];
            const decorated = decorator(target, propertyKey, descriptor);
            if (!functions_1.isNullOrUndefined(decorated)) {
                if (!functions_1.isObject(decorated)) {
                    throw $typeError('DecorateProperty', [decorators, target, propertyKey, descriptor], 'decorated', decorated, 'Object, Function, null, or undefined');
                }
                descriptor = decorated;
            }
        }
        return descriptor;
    }
    function $define(metadataKey, metadataValue, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.define', [metadataKey, metadataValue, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[DefineMetadata]](metadataKey, metadataValue, propertyKey).
        return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $has(metadataKey, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.has', [metadataKey, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[HasMetadata]](metadataKey, propertyKey).
        return OrdinaryHasMetadata(metadataKey, target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $hasOwn(metadataKey, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.hasOwn', [metadataKey, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[HasOwn]](metadataKey, propertyKey).
        return OrdinaryHasOwnMetadata(metadataKey, target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $get(metadataKey, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.get', [metadataKey, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[GetMetadata]](metadataKey, propertyKey).
        return OrdinaryGetMetadata(metadataKey, target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $getOwn(metadataKey, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.getOwn', [metadataKey, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[GetOwnMetadata]](metadataKey, propertyKey).
        return OrdinaryGetOwnMetadata(metadataKey, target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $getKeys(target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.getKeys', [target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[GetMetadataKeys]](propertyKey).
        return OrdinaryMetadataKeys(target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $getOwnKeys(target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.getOwnKeys', [target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[GetOwnMetadataKeys]](propertyKey).
        return OrdinaryOwnMetadataKeys(target, toPropertyKeyOrUndefined(propertyKey));
    }
    function $delete(metadataKey, target, propertyKey) {
        // 1. If Type(target) is not Object, throw a TypeError exception.
        if (!functions_1.isObject(target)) {
            throw $typeError('Metadata.delete', [metadataKey, target, propertyKey], 'target', target, 'Object or Function');
        }
        // 2. Return ? target.[[DeleteMetadata]](metadataKey, propertyKey).
        return OrdinaryDeleteMetadata(target, metadataKey, toPropertyKeyOrUndefined(propertyKey));
    }
    const Metadata = {
        define: $define,
        has: $has,
        hasOwn: $hasOwn,
        get: $get,
        getOwn: $getOwn,
        getKeys: $getKeys,
        getOwnKeys: $getOwnKeys,
        delete: $delete,
    };
    exports.Metadata = Metadata;
    function def(obj, key, value) {
        Reflect.defineProperty(obj, key, {
            writable: true,
            enumerable: false,
            configurable: true,
            value,
        });
    }
    def(Metadata, '$Internal', metadataInternalSlot);
    const hasMetadata = 'metadata' in Reflect;
    const hasDecorate = 'decorate' in Reflect;
    const hasDefineMetadata = 'defineMetadata' in Reflect;
    const hasHasMetadata = 'hasMetadata' in Reflect;
    const hasHasOwnMetadata = 'hasOwnMetadata' in Reflect;
    const hasGetMetadata = 'getMetadata' in Reflect;
    const hasGetOwnMetadata = 'getOwnMetadata' in Reflect;
    const hasGetMetadataKeys = 'getMetadataKeys' in Reflect;
    const hasGetOwnMetadataKeys = 'getOwnMetadataKeys' in Reflect;
    const hasDeleteMetadata = 'deleteMetadata' in Reflect;
    const hasSome = (hasMetadata ||
        hasDecorate ||
        hasDefineMetadata ||
        hasHasMetadata ||
        hasHasOwnMetadata ||
        hasGetMetadata ||
        hasGetOwnMetadata ||
        hasGetMetadataKeys ||
        hasGetOwnMetadataKeys ||
        hasDeleteMetadata);
    const hasAll = (hasMetadata &&
        hasDecorate &&
        hasDefineMetadata &&
        hasHasMetadata &&
        hasHasOwnMetadata &&
        hasGetMetadata &&
        hasGetOwnMetadata &&
        hasGetMetadataKeys &&
        hasGetOwnMetadataKeys &&
        hasDeleteMetadata);
    if (hasSome && !hasAll) {
        // This is temporary until we have the reporter / logging component working properly.
        // We should kind of throw here, but it's a bit harsh to completely stop Aurelia from loading for something that's not guaranteed to fail,
        // so just log a warning instead.
        /* eslint-disable no-console, no-undef, @typescript-eslint/ban-ts-ignore */
        // @ts-ignore
        console.warn('Partial existing Reflect.metadata polyfill found. Working environment cannot be guaranteed. Please file an issue at https://github.com/aurelia/aurelia/issues so that we can look into compatibility options for this scenario.');
    }
    if (!hasMetadata) {
        def(Reflect, 'metadata', metadata);
    }
    if (!hasDecorate) {
        def(Reflect, 'decorate', decorate);
    }
    if (!hasDefineMetadata) {
        def(Reflect, 'defineMetadata', $define);
    }
    if (!hasHasMetadata) {
        def(Reflect, 'hasMetadata', $has);
    }
    if (!hasHasOwnMetadata) {
        def(Reflect, 'hasOwnMetadata', $hasOwn);
    }
    if (!hasGetMetadata) {
        def(Reflect, 'getMetadata', $get);
    }
    if (!hasGetOwnMetadata) {
        def(Reflect, 'getOwnMetadata', $getOwn);
    }
    if (!hasGetMetadataKeys) {
        def(Reflect, 'getMetadataKeys', $getKeys);
    }
    if (!hasGetOwnMetadataKeys) {
        def(Reflect, 'getOwnMetadataKeys', $getOwnKeys);
    }
    if (!hasDeleteMetadata) {
        def(Reflect, 'deleteMetadata', $delete);
    }
});
//# sourceMappingURL=metadata.js.map