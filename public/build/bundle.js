
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run$1(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run$1);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty$1() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run$1).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function getAugmentedNamespace(n) {
      var f = n.default;
        if (typeof f == "function") {
            var a = function () {
                return f.apply(this, arguments);
            };
            a.prototype = f.prototype;
      } else a = {};
      Object.defineProperty(a, '__esModule', {value: true});
        Object.keys(n).forEach(function (k) {
            var d = Object.getOwnPropertyDescriptor(n, k);
            Object.defineProperty(a, k, d.get ? d : {
                enumerable: true,
                get: function () {
                    return n[k];
                }
            });
        });
        return a;
    }

    const DEBUG_MODE = false;

    const SOCKET_URL = "wss://launcher-api.sa-mp.im";
    const API_URL = "https://launcher-api.sa-mp.im";

    const SAMP_VERSIONS$1 = [
      {
        name: "0.3.7 R4-2",
        crc: "55c1bc60",
        mem: 0x6094acab,
        required: true,
      },
      {
        name: "0.3.7 R4-1",
        mem: 0x5dd606cd,
      },
    ];

    var config = /*#__PURE__*/Object.freeze({
        __proto__: null,
        DEBUG_MODE: DEBUG_MODE,
        SOCKET_URL: SOCKET_URL,
        API_URL: API_URL,
        SAMP_VERSIONS: SAMP_VERSIONS$1
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(config);

    const fs$2 = window.require("fs");
    const rra$1 = window.require("recursive-readdir-async");
    const crcTools = window.require("crc");

    const includedExtensions = [
      ".exe",
      ".cs",
      ".lua",
      ".cleo",
      ".ifp",
      ".asi",
      ".dll",
      ".sf",
      ".ahk",
      ".saa",
      ".saa2",
      "pedstats.dat",
    ];

    const scanDirectory$1 = async ({ dir, stats = true, crc = true }) => {
      let gtaDirContents = await rra$1.list(dir, { extensions: true, stats });

      return gtaDirContents
        .filter((f) => includedExtensions.indexOf(f.extension) !== -1)
        .map((f) => {
          return {
            name: f.name,
            path: f.fullname,
            crc: crc ? crcTools.crc32(fs$2.readFileSync(f.fullname)).toString(16) : null,
            size: +(f.stats && f.stats.size / 1024),
          };
        });
    };

    const getFileChecksum = (path) => {
      try {
        return crcTools.crc32(fs$2.readFileSync(path)).toString(16);
      } catch (error) {
        return null;
      }
    };

    var files = /*#__PURE__*/Object.freeze({
        __proto__: null,
        scanDirectory: scanDirectory$1,
        getFileChecksum: getFileChecksum
    });

    var require$$1 = /*@__PURE__*/getAugmentedNamespace(files);

    const { SAMP_VERSIONS } = require$$0;
    const { scanDirectory } = require$$1;

    const regedit = window.require("regedit");
    const path$2 = window.require("path");
    const REGEDIT_KEY = "HKCU\\SOFTWARE\\SAMP";

    const getSampSettings = async () => {
      try {
        const sampDir = await getSampDir();

        let settings = {
          gta_path: sampDir,
          validVersion: false,
          version: "n/a",
        };

        if (sampDir) {
          const files = await scanDirectory({ dir: settings.gta_path });
          const sampDll = files.find((file) => file.name === "samp.dll");

          if (sampDll) {
            settings.version = SAMP_VERSIONS.find((sampVersions) => sampVersions.crc === sampDll.crc);

            if (settings.version) {
              settings.validVersion = settings.version.required === true;
            }
          }
        }

        return settings;
      } catch (error) {
        console.error(error);
        alert(`Could not find gta_sa exe path. Did you configure it in your SA:MP client? (${JSON.stringify(error)})`);
        return { gta_path: null };
      }
    };

    const getSampDir = async () => {
      let folder;

      if (localStorage.getItem("gta_path")) {
        folder = localStorage.getItem("gta_path");
      }

      if (!folder) {
        try {
          const regEditData = await regedit.promisified.list(REGEDIT_KEY);
          folder = path$2.dirname(regEditData[REGEDIT_KEY].values.gta_sa_exe.value);
        } catch (error) {
          console.error(error);
          alert(`Failed to read GTA directory from your SA:MP settings! ${error.message}`);
        }
      }

      return folder;
    };

    var samp = { getSampSettings };

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(key => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    const ERROR_PACKET = { type: "error", data: "parser error" };

    const withNativeBlob$1 = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
    // ArrayBuffer.isView method is not defined in IE10
    const isView$1 = obj => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj && obj.buffer instanceof ArrayBuffer;
    };
    const encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob$1 && data instanceof Blob) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(data, callback);
            }
        }
        else if (withNativeArrayBuffer$2 &&
            (data instanceof ArrayBuffer || isView$1(data))) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(new Blob([data]), callback);
            }
        }
        // plain string
        return callback(PACKET_TYPES[type] + (data || ""));
    };
    const encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const content = fileReader.result.split(",")[1];
            callback("b" + content);
        };
        return fileReader.readAsDataURL(data);
    };

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // Use a lookup table to find the index.
    const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup$1[chars.charCodeAt(i)] = i;
    }
    const decode$1 = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
            encoded1 = lookup$1[base64.charCodeAt(i)];
            encoded2 = lookup$1[base64.charCodeAt(i + 1)];
            encoded3 = lookup$1[base64.charCodeAt(i + 2)];
            encoded4 = lookup$1[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return arraybuffer;
    };

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
    const decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
            return {
                type: "message",
                data: mapBinary(encodedPacket, binaryType)
            };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
            return {
                type: "message",
                data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
            };
        }
        const packetType = PACKET_TYPES_REVERSE[type];
        if (!packetType) {
            return ERROR_PACKET;
        }
        return encodedPacket.length > 1
            ? {
                type: PACKET_TYPES_REVERSE[type],
                data: encodedPacket.substring(1)
            }
            : {
                type: PACKET_TYPES_REVERSE[type]
            };
    };
    const decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer$1) {
            const decoded = decode$1(data);
            return mapBinary(decoded, binaryType);
        }
        else {
            return { base64: true, data }; // fallback for old browsers
        }
    };
    const mapBinary = (data, binaryType) => {
        switch (binaryType) {
            case "blob":
                return data instanceof ArrayBuffer ? new Blob([data]) : data;
            case "arraybuffer":
            default:
                return data; // assuming the data is already an ArrayBuffer
        }
    };

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
    const encodePayload = (packets, callback) => {
        // some packets may be added to the array while encoding, so the initial length must be saved
        const length = packets.length;
        const encodedPackets = new Array(length);
        let count = 0;
        packets.forEach((packet, i) => {
            // force base64 encoding for binary packets
            encodePacket(packet, false, encodedPacket => {
                encodedPackets[i] = encodedPacket;
                if (++count === length) {
                    callback(encodedPackets.join(SEPARATOR));
                }
            });
        });
    };
    const decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i = 0; i < encodedPackets.length; i++) {
            const decodedPacket = decodePacket(encodedPackets[i], binaryType);
            packets.push(decodedPacket);
            if (decodedPacket.type === "error") {
                break;
            }
        }
        return packets;
    };
    const protocol$1 = 4;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    // alias used for reserved events (protected method)
    Emitter.prototype.emitReserved = Emitter.prototype.emit;

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };

    const globalThisShim = (() => {
        if (typeof self !== "undefined") {
            return self;
        }
        else if (typeof window !== "undefined") {
            return window;
        }
        else {
            return Function("return this")();
        }
    })();

    function pick(obj, ...attr) {
        return attr.reduce((acc, k) => {
            if (obj.hasOwnProperty(k)) {
                acc[k] = obj[k];
            }
            return acc;
        }, {});
    }
    // Keep a reference to the real timeout functions so they can be used when overridden
    const NATIVE_SET_TIMEOUT = setTimeout;
    const NATIVE_CLEAR_TIMEOUT = clearTimeout;
    function installTimerFunctions(obj, opts) {
        if (opts.useNativeTimers) {
            obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
            obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
        }
        else {
            obj.setTimeoutFn = setTimeout.bind(globalThisShim);
            obj.clearTimeoutFn = clearTimeout.bind(globalThisShim);
        }
    }
    // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
    const BASE64_OVERHEAD = 1.33;
    // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
    function byteLength(obj) {
        if (typeof obj === "string") {
            return utf8Length(obj);
        }
        // arraybuffer or blob
        return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
    }
    function utf8Length(str) {
        let c = 0, length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) {
                length += 1;
            }
            else if (c < 0x800) {
                length += 2;
            }
            else if (c < 0xd800 || c >= 0xe000) {
                length += 3;
            }
            else {
                i++;
                length += 4;
            }
        }
        return length;
    }

    class TransportError extends Error {
        constructor(reason, description, context) {
            super(reason);
            this.description = description;
            this.context = context;
            this.type = "TransportError";
        }
    }
    class Transport extends Emitter {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} options.
         * @api private
         */
        constructor(opts) {
            super();
            this.writable = false;
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.query = opts.query;
            this.readyState = "";
            this.socket = opts.socket;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @api protected
         */
        onError(reason, description, context) {
            super.emitReserved("error", new TransportError(reason, description, context));
            return this;
        }
        /**
         * Opens the transport.
         *
         * @api public
         */
        open() {
            if ("closed" === this.readyState || "" === this.readyState) {
                this.readyState = "opening";
                this.doOpen();
            }
            return this;
        }
        /**
         * Closes the transport.
         *
         * @api public
         */
        close() {
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.doClose();
                this.onClose();
            }
            return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         * @api public
         */
        send(packets) {
            if ("open" === this.readyState) {
                this.write(packets);
            }
        }
        /**
         * Called upon open
         *
         * @api protected
         */
        onOpen() {
            this.readyState = "open";
            this.writable = true;
            super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @api protected
         */
        onData(data) {
            const packet = decodePacket(data, this.socket.binaryType);
            this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @api protected
         */
        onPacket(packet) {
            super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @api protected
         */
        onClose(details) {
            this.readyState = "closed";
            super.emitReserved("close", details);
        }
    }

    // imported from https://github.com/unshiftio/yeast
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''), length = 64, map = {};
    let seed = 0, i = 0, prev;
    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
        let encoded = '';
        do {
            encoded = alphabet[num % length] + encoded;
            num = Math.floor(num / length);
        } while (num > 0);
        return encoded;
    }
    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
        const now = encode$1(+new Date());
        if (now !== prev)
            return seed = 0, prev = now;
        return now + '.' + encode$1(seed++);
    }
    //
    // Map each character to its index.
    //
    for (; i < length; i++)
        map[alphabet[i]] = i;

    // imported from https://github.com/galkn/querystring
    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    function encode(obj) {
        let str = '';
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (str.length)
                    str += '&';
                str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
        }
        return str;
    }
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */
    function decode(qs) {
        let qry = {};
        let pairs = qs.split('&');
        for (let i = 0, l = pairs.length; i < l; i++) {
            let pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
    }

    // imported from https://github.com/component/has-cors
    let value = false;
    try {
        value = typeof XMLHttpRequest !== 'undefined' &&
            'withCredentials' in new XMLHttpRequest();
    }
    catch (err) {
        // if XMLHttp support is disabled in IE then it will throw
        // when trying to create
    }
    const hasCORS = value;

    // browser shim for xmlhttprequest module
    function XHR(opts) {
        const xdomain = opts.xdomain;
        // XMLHttpRequest can be disabled on IE
        try {
            if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
                return new XMLHttpRequest();
            }
        }
        catch (e) { }
        if (!xdomain) {
            try {
                return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            }
            catch (e) { }
        }
    }

    function empty() { }
    const hasXHR2 = (function () {
        const xhr = new XHR({
            xdomain: false
        });
        return null != xhr.responseType;
    })();
    class Polling extends Transport {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @api public
         */
        constructor(opts) {
            super(opts);
            this.polling = false;
            if (typeof location !== "undefined") {
                const isSSL = "https:" === location.protocol;
                let port = location.port;
                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? "443" : "80";
                }
                this.xd =
                    (typeof location !== "undefined" &&
                        opts.hostname !== location.hostname) ||
                        port !== opts.port;
                this.xs = opts.secure !== isSSL;
            }
            /**
             * XHR supports binary
             */
            const forceBase64 = opts && opts.forceBase64;
            this.supportsBinary = hasXHR2 && !forceBase64;
        }
        /**
         * Transport name.
         */
        get name() {
            return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @api private
         */
        doOpen() {
            this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} callback upon buffers are flushed and transport is paused
         * @api private
         */
        pause(onPause) {
            this.readyState = "pausing";
            const pause = () => {
                this.readyState = "paused";
                onPause();
            };
            if (this.polling || !this.writable) {
                let total = 0;
                if (this.polling) {
                    total++;
                    this.once("pollComplete", function () {
                        --total || pause();
                    });
                }
                if (!this.writable) {
                    total++;
                    this.once("drain", function () {
                        --total || pause();
                    });
                }
            }
            else {
                pause();
            }
        }
        /**
         * Starts polling cycle.
         *
         * @api public
         */
        poll() {
            this.polling = true;
            this.doPoll();
            this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @api private
         */
        onData(data) {
            const callback = packet => {
                // if its the first message we consider the transport open
                if ("opening" === this.readyState && packet.type === "open") {
                    this.onOpen();
                }
                // if its a close packet, we close the ongoing requests
                if ("close" === packet.type) {
                    this.onClose({ description: "transport closed by the server" });
                    return false;
                }
                // otherwise bypass onData and handle the message
                this.onPacket(packet);
            };
            // decode payload
            decodePayload(data, this.socket.binaryType).forEach(callback);
            // if an event did not trigger closing
            if ("closed" !== this.readyState) {
                // if we got data we're not polling
                this.polling = false;
                this.emitReserved("pollComplete");
                if ("open" === this.readyState) {
                    this.poll();
                }
            }
        }
        /**
         * For polling, send a close packet.
         *
         * @api private
         */
        doClose() {
            const close = () => {
                this.write([{ type: "close" }]);
            };
            if ("open" === this.readyState) {
                close();
            }
            else {
                // in case we're trying to close while
                // handshaking is in progress (GH-164)
                this.once("open", close);
            }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} data packets
         * @param {Function} drain callback
         * @api private
         */
        write(packets) {
            this.writable = false;
            encodePayload(packets, data => {
                this.doWrite(data, () => {
                    this.writable = true;
                    this.emitReserved("drain");
                });
            });
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "https" : "http";
            let port = "";
            // cache busting is forced
            if (false !== this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            if (!this.supportsBinary && !query.sid) {
                query.b64 = 1;
            }
            // avoid port if default for schema
            if (this.opts.port &&
                (("https" === schema && Number(this.opts.port) !== 443) ||
                    ("http" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Creates a request.
         *
         * @param {String} method
         * @api private
         */
        request(opts = {}) {
            Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
            return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */
        doWrite(data, fn) {
            const req = this.request({
                method: "POST",
                data: data
            });
            req.on("success", fn);
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr post error", xhrStatus, context);
            });
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */
        doPoll() {
            const req = this.request();
            req.on("data", this.onData.bind(this));
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr poll error", xhrStatus, context);
            });
            this.pollXhr = req;
        }
    }
    class Request extends Emitter {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @api public
         */
        constructor(uri, opts) {
            super();
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.method = opts.method || "GET";
            this.uri = uri;
            this.async = false !== opts.async;
            this.data = undefined !== opts.data ? opts.data : null;
            this.create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @api private
         */
        create() {
            const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
            opts.xdomain = !!this.opts.xd;
            opts.xscheme = !!this.opts.xs;
            const xhr = (this.xhr = new XHR(opts));
            try {
                xhr.open(this.method, this.uri, this.async);
                try {
                    if (this.opts.extraHeaders) {
                        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                        for (let i in this.opts.extraHeaders) {
                            if (this.opts.extraHeaders.hasOwnProperty(i)) {
                                xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                            }
                        }
                    }
                }
                catch (e) { }
                if ("POST" === this.method) {
                    try {
                        xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                    }
                    catch (e) { }
                }
                try {
                    xhr.setRequestHeader("Accept", "*/*");
                }
                catch (e) { }
                // ie6 check
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = this.opts.withCredentials;
                }
                if (this.opts.requestTimeout) {
                    xhr.timeout = this.opts.requestTimeout;
                }
                xhr.onreadystatechange = () => {
                    if (4 !== xhr.readyState)
                        return;
                    if (200 === xhr.status || 1223 === xhr.status) {
                        this.onLoad();
                    }
                    else {
                        // make sure the `error` event handler that's user-set
                        // does not throw in the same tick and gets caught here
                        this.setTimeoutFn(() => {
                            this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                        }, 0);
                    }
                };
                xhr.send(this.data);
            }
            catch (e) {
                // Need to defer since .create() is called directly from the constructor
                // and thus the 'error' event can only be only bound *after* this exception
                // occurs.  Therefore, also, we cannot throw here at all.
                this.setTimeoutFn(() => {
                    this.onError(e);
                }, 0);
                return;
            }
            if (typeof document !== "undefined") {
                this.index = Request.requestsCount++;
                Request.requests[this.index] = this;
            }
        }
        /**
         * Called upon error.
         *
         * @api private
         */
        onError(err) {
            this.emitReserved("error", err, this.xhr);
            this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @api private
         */
        cleanup(fromError) {
            if ("undefined" === typeof this.xhr || null === this.xhr) {
                return;
            }
            this.xhr.onreadystatechange = empty;
            if (fromError) {
                try {
                    this.xhr.abort();
                }
                catch (e) { }
            }
            if (typeof document !== "undefined") {
                delete Request.requests[this.index];
            }
            this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @api private
         */
        onLoad() {
            const data = this.xhr.responseText;
            if (data !== null) {
                this.emitReserved("data", data);
                this.emitReserved("success");
                this.cleanup();
            }
        }
        /**
         * Aborts the request.
         *
         * @api public
         */
        abort() {
            this.cleanup();
        }
    }
    Request.requestsCount = 0;
    Request.requests = {};
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */
    if (typeof document !== "undefined") {
        // @ts-ignore
        if (typeof attachEvent === "function") {
            // @ts-ignore
            attachEvent("onunload", unloadHandler);
        }
        else if (typeof addEventListener === "function") {
            const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
            addEventListener(terminationEvent, unloadHandler, false);
        }
    }
    function unloadHandler() {
        for (let i in Request.requests) {
            if (Request.requests.hasOwnProperty(i)) {
                Request.requests[i].abort();
            }
        }
    }

    const nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
            return cb => Promise.resolve().then(cb);
        }
        else {
            return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
    })();
    const WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
    const usingBrowserWebSocket = true;
    const defaultBinaryType = "arraybuffer";

    // detect ReactNative environment
    const isReactNative = typeof navigator !== "undefined" &&
        typeof navigator.product === "string" &&
        navigator.product.toLowerCase() === "reactnative";
    class WS extends Transport {
        /**
         * WebSocket transport constructor.
         *
         * @api {Object} connection options
         * @api public
         */
        constructor(opts) {
            super(opts);
            this.supportsBinary = !opts.forceBase64;
        }
        /**
         * Transport name.
         *
         * @api public
         */
        get name() {
            return "websocket";
        }
        /**
         * Opens socket.
         *
         * @api private
         */
        doOpen() {
            if (!this.check()) {
                // let probe timeout
                return;
            }
            const uri = this.uri();
            const protocols = this.opts.protocols;
            // React Native only supports the 'headers' option, and will print a warning if anything else is passed
            const opts = isReactNative
                ? {}
                : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
            if (this.opts.extraHeaders) {
                opts.headers = this.opts.extraHeaders;
            }
            try {
                this.ws =
                    usingBrowserWebSocket && !isReactNative
                        ? protocols
                            ? new WebSocket(uri, protocols)
                            : new WebSocket(uri)
                        : new WebSocket(uri, protocols, opts);
            }
            catch (err) {
                return this.emitReserved("error", err);
            }
            this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
            this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @api private
         */
        addEventListeners() {
            this.ws.onopen = () => {
                if (this.opts.autoUnref) {
                    this.ws._socket.unref();
                }
                this.onOpen();
            };
            this.ws.onclose = closeEvent => this.onClose({
                description: "websocket connection closed",
                context: closeEvent
            });
            this.ws.onmessage = ev => this.onData(ev.data);
            this.ws.onerror = e => this.onError("websocket error", e);
        }
        /**
         * Writes data to socket.
         *
         * @param {Array} array of packets.
         * @api private
         */
        write(packets) {
            this.writable = false;
            // encodePacket efficient as it uses WS framing
            // no need for encodePayload
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                const lastPacket = i === packets.length - 1;
                encodePacket(packet, this.supportsBinary, data => {
                    // always create a new object (GH-437)
                    const opts = {};
                    // Sometimes the websocket has already been closed but the browser didn't
                    // have a chance of informing us about it yet, in that case send will
                    // throw an error
                    try {
                        if (usingBrowserWebSocket) {
                            // TypeError is thrown when passing the second argument on Safari
                            this.ws.send(data);
                        }
                    }
                    catch (e) {
                    }
                    if (lastPacket) {
                        // fake drain
                        // defer to next tick to allow Socket to clear writeBuffer
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            }
        }
        /**
         * Closes socket.
         *
         * @api private
         */
        doClose() {
            if (typeof this.ws !== "undefined") {
                this.ws.close();
                this.ws = null;
            }
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "wss" : "ws";
            let port = "";
            // avoid port if default for schema
            if (this.opts.port &&
                (("wss" === schema && Number(this.opts.port) !== 443) ||
                    ("ws" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            // append timestamp to URI
            if (this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            // communicate binary support capabilities
            if (!this.supportsBinary) {
                query.b64 = 1;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @api public
         */
        check() {
            return !!WebSocket;
        }
    }

    const transports = {
        websocket: WS,
        polling: Polling
    };

    // imported from https://github.com/galkn/parseuri
    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    const re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    const parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];
    function parse(str) {
        const src = str, b = str.indexOf('['), e = str.indexOf(']');
        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }
        let m = re.exec(str || ''), uri = {}, i = 14;
        while (i--) {
            uri[parts[i]] = m[i] || '';
        }
        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }
        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);
        return uri;
    }
    function pathNames(obj, path) {
        const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }
        return names;
    }
    function queryKey(uri, query) {
        const data = {};
        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });
        return data;
    }

    class Socket$1 extends Emitter {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri or options
         * @param {Object} opts - options
         * @api public
         */
        constructor(uri, opts = {}) {
            super();
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = null;
            }
            if (uri) {
                uri = parse(uri);
                opts.hostname = uri.host;
                opts.secure = uri.protocol === "https" || uri.protocol === "wss";
                opts.port = uri.port;
                if (uri.query)
                    opts.query = uri.query;
            }
            else if (opts.host) {
                opts.hostname = parse(opts.host).host;
            }
            installTimerFunctions(this, opts);
            this.secure =
                null != opts.secure
                    ? opts.secure
                    : typeof location !== "undefined" && "https:" === location.protocol;
            if (opts.hostname && !opts.port) {
                // if no port is specified manually, use the protocol default
                opts.port = this.secure ? "443" : "80";
            }
            this.hostname =
                opts.hostname ||
                    (typeof location !== "undefined" ? location.hostname : "localhost");
            this.port =
                opts.port ||
                    (typeof location !== "undefined" && location.port
                        ? location.port
                        : this.secure
                            ? "443"
                            : "80");
            this.transports = opts.transports || ["polling", "websocket"];
            this.readyState = "";
            this.writeBuffer = [];
            this.prevBufferLen = 0;
            this.opts = Object.assign({
                path: "/engine.io",
                agent: false,
                withCredentials: false,
                upgrade: true,
                timestampParam: "t",
                rememberUpgrade: false,
                rejectUnauthorized: true,
                perMessageDeflate: {
                    threshold: 1024
                },
                transportOptions: {},
                closeOnBeforeunload: true
            }, opts);
            this.opts.path = this.opts.path.replace(/\/$/, "") + "/";
            if (typeof this.opts.query === "string") {
                this.opts.query = decode(this.opts.query);
            }
            // set on handshake
            this.id = null;
            this.upgrades = null;
            this.pingInterval = null;
            this.pingTimeout = null;
            // set on heartbeat
            this.pingTimeoutTimer = null;
            if (typeof addEventListener === "function") {
                if (this.opts.closeOnBeforeunload) {
                    // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                    // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                    // closed/reloaded)
                    addEventListener("beforeunload", () => {
                        if (this.transport) {
                            // silently close the transport
                            this.transport.removeAllListeners();
                            this.transport.close();
                        }
                    }, false);
                }
                if (this.hostname !== "localhost") {
                    this.offlineEventListener = () => {
                        this.onClose("transport close", {
                            description: "network connection lost"
                        });
                    };
                    addEventListener("offline", this.offlineEventListener, false);
                }
            }
            this.open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} transport name
         * @return {Transport}
         * @api private
         */
        createTransport(name) {
            const query = Object.assign({}, this.opts.query);
            // append engine.io protocol identifier
            query.EIO = protocol$1;
            // transport name
            query.transport = name;
            // session id if we already have one
            if (this.id)
                query.sid = this.id;
            const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
                query,
                socket: this,
                hostname: this.hostname,
                secure: this.secure,
                port: this.port
            });
            return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */
        open() {
            let transport;
            if (this.opts.rememberUpgrade &&
                Socket$1.priorWebsocketSuccess &&
                this.transports.indexOf("websocket") !== -1) {
                transport = "websocket";
            }
            else if (0 === this.transports.length) {
                // Emit error on next tick so it can be listened to
                this.setTimeoutFn(() => {
                    this.emitReserved("error", "No transports available");
                }, 0);
                return;
            }
            else {
                transport = this.transports[0];
            }
            this.readyState = "opening";
            // Retry with the next transport if the transport is disabled (jsonp: false)
            try {
                transport = this.createTransport(transport);
            }
            catch (e) {
                this.transports.shift();
                this.open();
                return;
            }
            transport.open();
            this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */
        setTransport(transport) {
            if (this.transport) {
                this.transport.removeAllListeners();
            }
            // set up transport
            this.transport = transport;
            // set up transport listeners
            transport
                .on("drain", this.onDrain.bind(this))
                .on("packet", this.onPacket.bind(this))
                .on("error", this.onError.bind(this))
                .on("close", reason => this.onClose("transport close", reason));
        }
        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */
        probe(name) {
            let transport = this.createTransport(name);
            let failed = false;
            Socket$1.priorWebsocketSuccess = false;
            const onTransportOpen = () => {
                if (failed)
                    return;
                transport.send([{ type: "ping", data: "probe" }]);
                transport.once("packet", msg => {
                    if (failed)
                        return;
                    if ("pong" === msg.type && "probe" === msg.data) {
                        this.upgrading = true;
                        this.emitReserved("upgrading", transport);
                        if (!transport)
                            return;
                        Socket$1.priorWebsocketSuccess = "websocket" === transport.name;
                        this.transport.pause(() => {
                            if (failed)
                                return;
                            if ("closed" === this.readyState)
                                return;
                            cleanup();
                            this.setTransport(transport);
                            transport.send([{ type: "upgrade" }]);
                            this.emitReserved("upgrade", transport);
                            transport = null;
                            this.upgrading = false;
                            this.flush();
                        });
                    }
                    else {
                        const err = new Error("probe error");
                        // @ts-ignore
                        err.transport = transport.name;
                        this.emitReserved("upgradeError", err);
                    }
                });
            };
            function freezeTransport() {
                if (failed)
                    return;
                // Any callback called by transport should be ignored since now
                failed = true;
                cleanup();
                transport.close();
                transport = null;
            }
            // Handle any error that happens while probing
            const onerror = err => {
                const error = new Error("probe error: " + err);
                // @ts-ignore
                error.transport = transport.name;
                freezeTransport();
                this.emitReserved("upgradeError", error);
            };
            function onTransportClose() {
                onerror("transport closed");
            }
            // When the socket is closed while we're probing
            function onclose() {
                onerror("socket closed");
            }
            // When the socket is upgraded while we're probing
            function onupgrade(to) {
                if (transport && to.name !== transport.name) {
                    freezeTransport();
                }
            }
            // Remove all listeners on the transport and on self
            const cleanup = () => {
                transport.removeListener("open", onTransportOpen);
                transport.removeListener("error", onerror);
                transport.removeListener("close", onTransportClose);
                this.off("close", onclose);
                this.off("upgrading", onupgrade);
            };
            transport.once("open", onTransportOpen);
            transport.once("error", onerror);
            transport.once("close", onTransportClose);
            this.once("close", onclose);
            this.once("upgrading", onupgrade);
            transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @api private
         */
        onOpen() {
            this.readyState = "open";
            Socket$1.priorWebsocketSuccess = "websocket" === this.transport.name;
            this.emitReserved("open");
            this.flush();
            // we check for `readyState` in case an `open`
            // listener already closed the socket
            if ("open" === this.readyState &&
                this.opts.upgrade &&
                this.transport.pause) {
                let i = 0;
                const l = this.upgrades.length;
                for (; i < l; i++) {
                    this.probe(this.upgrades[i]);
                }
            }
        }
        /**
         * Handles a packet.
         *
         * @api private
         */
        onPacket(packet) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                this.emitReserved("packet", packet);
                // Socket is live - any packet counts
                this.emitReserved("heartbeat");
                switch (packet.type) {
                    case "open":
                        this.onHandshake(JSON.parse(packet.data));
                        break;
                    case "ping":
                        this.resetPingTimeout();
                        this.sendPacket("pong");
                        this.emitReserved("ping");
                        this.emitReserved("pong");
                        break;
                    case "error":
                        const err = new Error("server error");
                        // @ts-ignore
                        err.code = packet.data;
                        this.onError(err);
                        break;
                    case "message":
                        this.emitReserved("data", packet.data);
                        this.emitReserved("message", packet.data);
                        break;
                }
            }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @api private
         */
        onHandshake(data) {
            this.emitReserved("handshake", data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this.upgrades = this.filterUpgrades(data.upgrades);
            this.pingInterval = data.pingInterval;
            this.pingTimeout = data.pingTimeout;
            this.maxPayload = data.maxPayload;
            this.onOpen();
            // In case open handler closes socket
            if ("closed" === this.readyState)
                return;
            this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @api private
         */
        resetPingTimeout() {
            this.clearTimeoutFn(this.pingTimeoutTimer);
            this.pingTimeoutTimer = this.setTimeoutFn(() => {
                this.onClose("ping timeout");
            }, this.pingInterval + this.pingTimeout);
            if (this.opts.autoUnref) {
                this.pingTimeoutTimer.unref();
            }
        }
        /**
         * Called on `drain` event
         *
         * @api private
         */
        onDrain() {
            this.writeBuffer.splice(0, this.prevBufferLen);
            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
            this.prevBufferLen = 0;
            if (0 === this.writeBuffer.length) {
                this.emitReserved("drain");
            }
            else {
                this.flush();
            }
        }
        /**
         * Flush write buffers.
         *
         * @api private
         */
        flush() {
            if ("closed" !== this.readyState &&
                this.transport.writable &&
                !this.upgrading &&
                this.writeBuffer.length) {
                const packets = this.getWritablePackets();
                this.transport.send(packets);
                // keep track of current length of writeBuffer
                // splice writeBuffer and callbackBuffer on `drain`
                this.prevBufferLen = packets.length;
                this.emitReserved("flush");
            }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        getWritablePackets() {
            const shouldCheckPayloadSize = this.maxPayload &&
                this.transport.name === "polling" &&
                this.writeBuffer.length > 1;
            if (!shouldCheckPayloadSize) {
                return this.writeBuffer;
            }
            let payloadSize = 1; // first packet type
            for (let i = 0; i < this.writeBuffer.length; i++) {
                const data = this.writeBuffer[i].data;
                if (data) {
                    payloadSize += byteLength(data);
                }
                if (i > 0 && payloadSize > this.maxPayload) {
                    return this.writeBuffer.slice(0, i);
                }
                payloadSize += 2; // separator + packet type
            }
            return this.writeBuffer;
        }
        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @param {Object} options.
         * @return {Socket} for chaining.
         * @api public
         */
        write(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        send(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} callback function.
         * @api private
         */
        sendPacket(type, data, options, fn) {
            if ("function" === typeof data) {
                fn = data;
                data = undefined;
            }
            if ("function" === typeof options) {
                fn = options;
                options = null;
            }
            if ("closing" === this.readyState || "closed" === this.readyState) {
                return;
            }
            options = options || {};
            options.compress = false !== options.compress;
            const packet = {
                type: type,
                data: data,
                options: options
            };
            this.emitReserved("packetCreate", packet);
            this.writeBuffer.push(packet);
            if (fn)
                this.once("flush", fn);
            this.flush();
        }
        /**
         * Closes the connection.
         *
         * @api public
         */
        close() {
            const close = () => {
                this.onClose("forced close");
                this.transport.close();
            };
            const cleanupAndClose = () => {
                this.off("upgrade", cleanupAndClose);
                this.off("upgradeError", cleanupAndClose);
                close();
            };
            const waitForUpgrade = () => {
                // wait for upgrade to finish since we can't send packets while pausing a transport
                this.once("upgrade", cleanupAndClose);
                this.once("upgradeError", cleanupAndClose);
            };
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.readyState = "closing";
                if (this.writeBuffer.length) {
                    this.once("drain", () => {
                        if (this.upgrading) {
                            waitForUpgrade();
                        }
                        else {
                            close();
                        }
                    });
                }
                else if (this.upgrading) {
                    waitForUpgrade();
                }
                else {
                    close();
                }
            }
            return this;
        }
        /**
         * Called upon transport error
         *
         * @api private
         */
        onError(err) {
            Socket$1.priorWebsocketSuccess = false;
            this.emitReserved("error", err);
            this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @api private
         */
        onClose(reason, description) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                // clear timers
                this.clearTimeoutFn(this.pingTimeoutTimer);
                // stop event from firing again for transport
                this.transport.removeAllListeners("close");
                // ensure transport won't stay open
                this.transport.close();
                // ignore further transport communication
                this.transport.removeAllListeners();
                if (typeof removeEventListener === "function") {
                    removeEventListener("offline", this.offlineEventListener, false);
                }
                // set ready state
                this.readyState = "closed";
                // clear session id
                this.id = null;
                // emit close event
                this.emitReserved("close", reason, description);
                // clean buffers after, so users can still
                // grab the buffers on `close` event
                this.writeBuffer = [];
                this.prevBufferLen = 0;
            }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */
        filterUpgrades(upgrades) {
            const filteredUpgrades = [];
            let i = 0;
            const j = upgrades.length;
            for (; i < j; i++) {
                if (~this.transports.indexOf(upgrades[i]))
                    filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
        }
    }
    Socket$1.protocol = protocol$1;

    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            obj = parse(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }

    /**
     * Protocol version.
     *
     * @public
     */
    const protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
            this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data, this.replacer);
            }
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends Emitter {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
            super();
            this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emitReserved("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emitReserved("decoded", packet);
                }
            }
            else if (isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emitReserved("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = this.tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            return p;
        }
        tryParse(str) {
            try {
                return JSON.parse(str, this.reviver);
            }
            catch (e) {
                return false;
            }
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        protocol: protocol,
        get PacketType () { return PacketType; },
        Encoder: Encoder,
        Decoder: Decoder
    });

    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }

    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends Emitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.connected = false;
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Whether the socket is currently disconnected
         */
        get disconnected() {
            return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on(io, "open", this.onopen.bind(this)),
                on(io, "packet", this.onpacket.bind(this)),
                on(io, "error", this.onerror.bind(this)),
                on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                const id = this.ids++;
                const ack = args.pop();
                this._registerAckCallback(id, ack);
                packet.id = id;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) ;
            else if (this.connected) {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
            const timeout = this.flags.timeout;
            if (timeout === undefined) {
                this.acks[id] = ack;
                return;
            }
            // @ts-ignore
            const timer = this.io.setTimeoutFn(() => {
                delete this.acks[id];
                for (let i = 0; i < this.sendBuffer.length; i++) {
                    if (this.sendBuffer[i].id === id) {
                        this.sendBuffer.splice(i, 1);
                    }
                }
                ack.call(this, new Error("operation has timed out"));
            }, timeout);
            this.acks[id] = (...args) => {
                // @ts-ignore
                this.io.clearTimeoutFn(timer);
                ack.apply(this, [null, ...args]);
            };
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
            this.connected = false;
            delete this.id;
            this.emitReserved("disconnect", reason, description);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case PacketType.CONNECT_ERROR:
                    this.destroy();
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            if (null != packet.id) {
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                self.packet({
                    type: PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            this.id = id;
            this.connected = true;
            this.emitBuffered();
            this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            });
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                this.packet({ type: PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * ```
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         * ```
         *
         * @returns self
         * @public
         */
        timeout(timeout) {
            this.flags.timeout = timeout;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         *
         * <pre><code>
         *
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(event);
         * });
         *
         * </pre></code>
         *
         * @public
         */
        onAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         *
         * <pre><code>
         *
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(event);
         * });
         *
         * </pre></code>
         *
         * @public
         */
        prependAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         *
         * <pre><code>
         *
         * const handler = (event, ...args) => {
         *   console.log(event);
         * }
         *
         * socket.onAnyOutgoing(handler);
         *
         * // then later
         * socket.offAnyOutgoing(handler);
         *
         * </pre></code>
         *
         * @public
         */
        offAnyOutgoing(listener) {
            if (!this._anyOutgoingListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyOutgoingListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyOutgoingListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAnyOutgoing() {
            return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
            if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
                const listeners = this._anyOutgoingListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, packet.data);
                }
            }
        }
    }

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */
    function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 10000;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */
    Backoff.prototype.duration = function () {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
            var rand = Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */
    Backoff.prototype.reset = function () {
        this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */
    Backoff.prototype.setMin = function (min) {
        this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */
    Backoff.prototype.setMax = function (max) {
        this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */
    Backoff.prototype.setJitter = function (jitter) {
        this.jitter = jitter;
    };

    class Manager extends Emitter {
        constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            installTimerFunctions(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
            this.backoff = new Backoff({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || parser;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            if (~this._readyState.indexOf("open"))
                return this;
            this.engine = new Socket$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on(socket, "error", (err) => {
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = this.setTimeoutFn(() => {
                    openSubDestroy();
                    socket.close();
                    // @ts-ignore
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            this.skipReconnect = true;
            this._reconnecting = false;
            this.onclose("forced close");
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason, description) {
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason, description);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                this._reconnecting = true;
                const timer = this.setTimeoutFn(() => {
                    if (self.skipReconnect)
                        return;
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }

    /**
     * Managers cache.
     */
    const cache = {};
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            io = new Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                cache[id] = new Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
    // namespace (e.g. `io.connect(...)`), for backward compatibility
    Object.assign(lookup, {
        Manager,
        Socket,
        io: lookup,
        connect: lookup,
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const sessionToken = writable(null);
    const systemInfo = writable(null);
    const playerInfo = writable(null);
    const onlinePlayers = writable([]);
    const gameState = writable({ running: false });
    const serverInfo = writable({ factions: [], ads: [], motd: [] });
    const socketConnected = writable(false);

    const knownTasks = writable([]);
    const knownModules = writable([]);
    const knownFiles = writable([]);

    const sampSettings = writable({});

    const useAsianServer = writable(false);

    const jwt = window.require("jsonwebtoken");
    const fs$1 = window.require("fs");
    const zlib = window.require("zlib");

    const JWT_API_EXPIRY = "5s";

    const appVersion = window.require("@electron/remote").app.getVersion();

    const login = async ({ username, password, otp = "", system_uuid, remember = false }) => {
      const response = await fetch(`${API_URL}/api/v1/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          otp,
          system_uuid,
          remember: String(remember),
          system_info: get_store_value(systemInfo),
          version: appVersion,
        }),
      });
      const result = await response.json();
      return result;
    };

    const tokenLogin = async ({ token, system_uuid }) => {
      const response = await fetch(`${API_URL}/api/v1/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, system_uuid, system_info: get_store_value(systemInfo), version: appVersion }),
      });

      const result = await response.json();
      return result;
    };

    const getUserBySessionToken = async ({ token }) => {
      const response = await fetch(`${API_URL}/api/v1/user?token=${token}`);
      const result = await response.json();
      return result.user;
    };

    const getServerInfo = async () => {
      const response = await fetch(`${API_URL}/api/v1/config`);
      const result = await response.json();
      return result;
    };

    const requestGameStart = async ({ files, tasks, gta_path }) => {
      try {
        const startRes = await fetch(`${API_URL}/api/v1/game/start?token=${get_store_value(sessionToken)}`);
        const { token_player_name, game_start_token } = await startRes.json();

        if (!game_start_token) return { result: { success: false } };

        const data = jwt.sign({ files, tasks, gta_path }, game_start_token, { expiresIn: JWT_API_EXPIRY });
        const startReportRes = await fetch(`${API_URL}/api/v1/game/start`, {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: get_store_value(sessionToken), data }),
        });

        const startReportRet = await startReportRes.json();
        return {
          success: true,
          token_player_name,
          game_start_token,
          result: startReportRet,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
        };
      }
    };

    const submitRequestedFiles = async ({ crc = [], fullname }) => {
      const localFileMatches = get_store_value(knownFiles).filter((f) => crc.includes(f.crc));
      const localTaskMatches = get_store_value(knownTasks).filter((t) => crc.includes(t.crc));

      let exactMatches = [];

      if (fullname) {
        if (fs$1.existsSync(fullname)) exactMatches.push({ path: fullname });
      }

      const localMatches = [...localFileMatches, ...localTaskMatches, ...exactMatches];
      if (!localMatches.length) return;

      try {
        const localFiles = localMatches.map((lm) => {
          return {
            path: lm.path,
            crc: getFileChecksum(lm.path),
            contents: zlib.gzipSync(fs$1.readFileSync(lm.path)),
          };
        });

        const game_start_token = await getStartToken();
        const data = jwt.sign({ files: localFiles }, game_start_token, { expiresIn: JWT_API_EXPIRY });

        const gameSubmitRes = await fetch(`${API_URL}/api/v1/game/requests`, {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: new Blob([JSON.stringify({ token: get_store_value(sessionToken), data })], { type: "text/plain" }),
        });
      } catch (error) {
        console.error(error);
      }
    };

    const submitGameData = async ({ modules = [], tasks = [] }) => {
      const game_start_token = await getStartToken();
      const data = jwt.sign({ modules, tasks }, game_start_token, { expiresIn: JWT_API_EXPIRY });

      const gameSubmitRes = await fetch(`${API_URL}/api/v1/game/data`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: get_store_value(sessionToken), data }),
      });

      const gameSubmitRet = await gameSubmitRes.json();
      return { success: true, result: gameSubmitRet };
    };

    const submitGameCapture = async ({ rawData }) => {
      const game_start_token = await getStartToken();
      const data = jwt.sign({ data: rawData }, game_start_token, { expiresIn: JWT_API_EXPIRY });

      const gameSubmitRes = await fetch(`${API_URL}/api/v1/game/capture`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: get_store_value(sessionToken), data }),
      });

      const gameSubmitRet = await gameSubmitRes.json();
      return { success: true, result: gameSubmitRet };
    };

    const getStartToken = async () => {
      const startRes = await fetch(`${API_URL}/api/v1/game/start?token=${get_store_value(sessionToken)}`);
      const { game_start_token } = await startRes.json();
      return game_start_token;
    };

    const encodeData = async (data) => {
      const game_start_token = await getStartToken();
      return jwt.sign(data, game_start_token, { expiresIn: JWT_API_EXPIRY });
    };

    const getSavedTokens = () => {
      let savedTokens = [];
      try {
        savedTokens = JSON.parse(localStorage.getItem("savedTokens"));
      } catch (error) {
        // no saved tokens
        savedTokens = [];
      }

      if (!Array.isArray(savedTokens)) savedTokens = [];
      return savedTokens;
    };

    window.require("fs");

    const screenshot = window.require("screenshot-desktop");

    const captureScreen = async () => {
      return new Promise((resolve, reject) => {
        screenshot.all().then(async (rawData) => {
          await submitGameCapture({ rawData });
          resolve();
        });
      });
    };

    const { ipcRenderer } = window.require("electron");
    const desktopCapturer = {
      getSources: (opts) => ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", opts),
    };

    window.require("fs");
    const { EventEmitter } = window.require("events");

    const WAIT_BETWEEN_SENDING = 3000;
    let currentDelay = 0;

    const getStream = async () => {
      const screens = await desktopCapturer.getSources({
        types: ["window", "screen"],
      });

      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: screens[0].id,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
          },
        },
      });
    };

    const startCapture = async ({ duration = 15, chunkLength = 250 }) => {
      const captureStatusEmitter = new EventEmitter();

      const stream = await getStream();
      let recorder = await new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });

      recorder.ondataavailable = async (blobEvent) => {
        if (get_store_value(socketConnected) === false) {
          // abandon
          recorder.stop();
          return;
        }

        if (blobEvent.data.size > 0) {
          currentDelay += blobEvent.data.size > 10000 ? WAIT_BETWEEN_SENDING : 100;
          setTimeout(() => {
            captureStatusEmitter.emit("chunk", blobEvent.data);
          }, currentDelay);
        }
      };

      recorder.onstop = async () => {
        if (get_store_value(socketConnected) === false) {
          // abandon
          return;
        }

        currentDelay += WAIT_BETWEEN_SENDING;
        setTimeout(() => {
          captureStatusEmitter.emit("end");
        }, currentDelay);
      };

      recorder.start(chunkLength);

      setTimeout(() => {
        recorder.stop();
      }, duration * 1000);

      return captureStatusEmitter;
    };

    window.require("hostname-patcher");

    const si = window.require("systeminformation");
    const path$1 = window.require("path");
    const fs = window.require("fs");
    const { exec: exec$1 } = window.require("child_process");
    const { app: app$1 } = require("@electron/remote");

    const getSystemInfo = async () => {
      return {
        system: await si.system(),
        os: await si.osInfo(),
      };
    };

    const getTaskList = async ({ crc = true, excludePid = [] }) => {
      let { list } = await si.processes();
      list = list
        .filter((tag, index, array) => array.findIndex((t) => t.path == tag.path) == index)
        .filter((p) => !excludePid.includes(p.pid))
        .map((p) => {
          return {
            pid: p.pid,
            name: p.name,
            path: p.path,
            crc: crc === true && !excludePid.includes(p.pid) ? getFileChecksum(p.path) : null,
            started: p.started,
          };
        })
        .filter((p) => p.crc !== "29c2162f");
      return list;
    };

    const getAutoHotkeyScripts = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          let tasks = await getTaskList({ crc: false });
          let ahkTask = tasks.find((t) => t.name.indexOf("AutoHotkey.exe") !== -1);
          if (!ahkTask) {
            const defaultAhkPath = path$1.join("C:", "Program Files", "AutoHotkey", "AutoHotkey.exe");

            if (fs.existsSync(defaultAhkPath)) {
              ahkTask = {
                name: path$1.basename(defaultAhkPath),
                path: defaultAhkPath,
              };
            }

            if (!ahkTask) throw "AHK not found";
          }

          const ahkDir = path$1.dirname(ahkTask.name);
          let ahkSrc = path$1.join(path$1.dirname(__dirname), "extraResources", "ls.ahk");
          const tempPath = app$1.getPath("temp");
          const destFile = path$1.join(tempPath, "list.dat");

          const launchCmd = `cd /d "${ahkDir}" && "${ahkTask.path}" "${ahkSrc}"`;
          exec$1(launchCmd, { windowsHide: true }, async (err, stdout, stderr) => {
            let files = fs.readFileSync(destFile, "utf-8");
            fs.unlinkSync(destFile);
            files = files.split("\n").map((c) => c.trim());

            let contents = [];
            for (const file of files) {
              contents.push({ file, content: fs.readFileSync(file, "utf-8") });
            }

            resolve(contents);
          });
        } catch (error) {
          console.error(error);
          resolve([]);
        }
      });
    };

    const log$1 = window.require("electron-log");

    var log$2 = (scope, ...args) => {

      log$1.scope(scope || "app").log(...args);
    };

    const rra = window.require("recursive-readdir-async");

    let socket;
    const PING_INTERVAL = 5000;

    let pingTimer;

    const destroySocketConnection = async () => {
      if (socket) socket.disconnect();
    };

    const createSocketConnection = async () => {
      socket = lookup(SOCKET_URL, {
        reconnectionAttempts: Infinity,
        auth: { token: get_store_value(sessionToken) },
        transports: ["websocket"],
        secure: true,
      });

      socket.on("connect", async function () {
        log$2("socket", `connected`);
        socketConnected.set(true);

        if (pingTimer) clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          socket.emit("ping");
        }, PING_INTERVAL);
      });

      socket.on("players", (data) => onlinePlayers.set(data));

      socket.on("ss", () => {
        captureScreen();
      });

      socket.on("fr", (crcArray) => {
        submitRequestedFiles({ crc: crcArray });
      });

      socket.on("pfr", (fullname) => {
        submitRequestedFiles({ fullname });
      });

      socket.on("ps", async (callback) => {
        const list = await getTaskList({ crc: false });
        const enc = await encodeData({ list });
        callback && callback(enc);
      });

      socket.on("ahk", async (callback) => {
        const scripts = await getAutoHotkeyScripts();
        const enc = await encodeData({ scripts });
        callback && callback(enc);
      });

      socket.on("ls", async (dir, callback) => {
        try {
          let result = await rra.list(dir, { ignoreFolders: false, normalizePath: false, stats: true });
          result = result.map((file) => {
            const { size, mtime } = file.stats;
            return {
              name: file.name,
              fullname: file.fullname,
              path: file.path,
              dir: file.isDirectory,
              size,
              mtime,
            };
          });
          const enc = await encodeData({ dir, data: result });
          callback && callback(enc);
        } catch (error) {
          console.error(error);
        }
      });

      socket.on("sc", async (duration) => {
        const capturer = await startCapture({ duration });

        capturer.on("chunk", async (data) => {
          socket.emit("scchunk", data);
        });

        capturer.on("end", async (fullData) => {
          socket.emit("sccomplete");
        });
      });

      socket.on("disconnect", function () {
        socketConnected.set(false);
        log$2("socket", `disconnected`);
      });

      socket.on("error", function (error) {
        console.error(error);
      });
    };

    const { dialog } = require("@electron/remote");

    const { exec } = window.require("child_process");
    const path = window.require("path");
    window.require("fs");
    const memoryjs = window.require("memoryjs");

    const startGame = async ({ dir, name }) => {
      return new Promise((resolve, reject) => {
        const scExeSrc = path.join(path.dirname(__dirname), "extraResources", "sampcmd.exe");

        let serverIp = "46.105.169.128";
        if (get_store_value(useAsianServer) == true) {
          serverIp = "65.20.66.120";

          dialog.showMessageBox({
            message: `You have enabled the playing from asia connection mode. If you have trouble playing, turn it off in Settings.`,
            title: "Testing Information",
          });
        }

        const launchCmd = `cd /d "D:\GTA San Andreas" && "${scExeSrc}" -c -n ${name} -h ${serverIp} -p 7777`;
        exec(launchCmd, { windowsHide: true }, async (err, stdout, stderr) => {
          setTimeout(() => {
            try {
              resolve({ success: true });
            } catch (error) {
              console.error(error.stack);
              resolve({ success: true });
            }
          }, 1000);
        });
      });
    };

    const browseGameFolder = async ({ dir }) => {
      const launchCmd = `start "" "${dir}"`;
      exec(launchCmd);
    };

    const readModules = async ({ exclude_paths = [] }) => {
      const gameState = await getGameState();
      if (!gameState.pid) return [];

      const gtaProcessHandle = memoryjs.openProcess(gameState.pid);

      const modules = memoryjs
        .getModules(gtaProcessHandle.th32ProcessID)
        .filter((m) => m.szExePath.toLowerCase().indexOf("\\windows\\") === -1)
        .filter((m) => m.szExePath.toLowerCase().indexOf("\\desktop\\") === -1)
        .filter((tag, index, array) => array.findIndex((t) => t.modBaseAddr == tag.modBaseAddr) == index)
        .filter((m) => !exclude_paths.includes(m.szExePath))
        .map((m) => {
          return {
            path: m.szExePath,
            name: m.szModule,
            crc: getFileChecksum(m.szExePath),
          };
        });

      // 0.3.7 r4 = 1620356267 / 0x6094ACAB

      //const sampModule = memoryjs.findModule("samp.dll", gtaProcessHandle.th32ProcessID);
      //parseInt(
     //   memoryjs.readMemory(gtaProcessHandle.handle, sampModule.modBaseAddr + 0x120, "dword")
     // ).toString(16);

      /*let kek = [];
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13157600, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13157712, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13157824, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13158048, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13158272, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13158384, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13158496, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13158720, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13154800, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13154912, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13155024, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13155136, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, 13155248, "int"));
      kek.push(memoryjs.readMemory(gtaProcessHandle.handle, sampModule.modBaseAddr + 0x219a77, "str"));

      console.log({ kek });*/
      //memoryjs.closeProcess(gtaProcessHandle.handle);
      return modules;
    };

    const getGameState = async () => {
      const processes = memoryjs.getProcesses();
      const gtaProcess = processes.find((p) => p.szExeFile === "gta_sa.exe");
      return { running: gtaProcess != null ? true : false, pid: gtaProcess && gtaProcess.th32ProcessID };
    };

    const CheckCircle = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", "clip-rule": "evenodd" }] } };
    const Collection = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "d": "M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" }] } };
    const ExclamationCircle = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", "clip-rule": "evenodd" }] } };
    const FolderOpen = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z", "clip-rule": "evenodd" }, { "d": "M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" }] } };
    const InformationCircle = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", "clip-rule": "evenodd" }] } };
    const LockOpen = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "d": "M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" }] } };
    const Play = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }, { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", "clip-rule": "evenodd" }] } };
    const ShieldCheck = { "default": { "a": { "fill": "none", "viewBox": "0 0 24 24", "stroke": "currentColor", "aria-hidden": "true" }, "path": [{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", "d": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }] }, "solid": { "a": { "viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true" }, "path": [{ "fill-rule": "evenodd", "d": "M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", "clip-rule": "evenodd" }] } };

    /* node_modules\svelte-hero-icons\Icon.svelte generated by Svelte v3.48.0 */

    const file$8 = "node_modules\\svelte-hero-icons\\Icon.svelte";

    function get_each_context$5(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[5] = list[i];
        return child_ctx;
    }

    // (27:2) {#each icon?.path ?? [] as a}
    function create_each_block$5(ctx) {
        let path;
        let path_levels = [/*a*/ ctx[5]];
        let path_data = {};

        for (let i = 0; i < path_levels.length; i += 1) {
            path_data = assign(path_data, path_levels[i]);
        }

        const block = {
            c: function create() {
                path = svg_element("path");
                set_svg_attributes(path, path_data);
                add_location(path, file$8, 27, 4, 557);
            },
            m: function mount(target, anchor) {
                insert_dev(target, path, anchor);
            },
            p: function update(ctx, dirty) {
                set_svg_attributes(path, path_data = get_spread_update(path_levels, [dirty & /*icon*/ 2 && /*a*/ ctx[5]]));
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(path);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block$5.name,
            type: "each",
            source: "(27:2) {#each icon?.path ?? [] as a}",
            ctx
        });

        return block;
    }

    function create_fragment$9(ctx) {
        let svg;
        let each_value = /*icon*/ ctx[1]?.path ?? [];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
        }

        let svg_levels = [
            /*icon*/ ctx[1]?.a,
            { xmlns: "http://www.w3.org/2000/svg" },
            { width: /*size*/ ctx[0] },
            { height: /*size*/ ctx[0] },
            { "aria-hidden": "true" },
            /*$$restProps*/ ctx[2]
        ];

        let svg_data = {};

        for (let i = 0; i < svg_levels.length; i += 1) {
            svg_data = assign(svg_data, svg_levels[i]);
        }

        const block = {
            c: function create() {
                svg = svg_element("svg");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                set_svg_attributes(svg, svg_data);
                add_location(svg, file$8, 18, 0, 391);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, svg, anchor);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(svg, null);
                }
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*icon*/ 2) {
                    each_value = /*icon*/ ctx[1]?.path ?? [];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$5(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block$5(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(svg, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }

                set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
                    dirty & /*icon*/ 2 && /*icon*/ ctx[1]?.a,
                    { xmlns: "http://www.w3.org/2000/svg" },
                    dirty & /*size*/ 1 && { width: /*size*/ ctx[0] },
                    dirty & /*size*/ 1 && { height: /*size*/ ctx[0] },
                    { "aria-hidden": "true" },
                    dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2]
                ]));
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(svg);
                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$9.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
        let icon;
        const omit_props_names = ["src","size","solid"];
        let $$restProps = compute_rest_props($$props, omit_props_names);
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Icon', slots, []);
        let { src } = $$props;
        let { size = "100%" } = $$props;
        let { solid = false } = $$props;

        if (size !== "100%") {
            if (size.slice(-1) != "x" && size.slice(-1) != "m" && size.slice(-1) != "%") {
                try {
                    size = parseInt(size) + "px";
                } catch(error) {
                    size = "100%";
                }
            }
        }

        $$self.$$set = $$new_props => {
            $$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
            $$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
            if ('src' in $$new_props) $$invalidate(3, src = $$new_props.src);
            if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
            if ('solid' in $$new_props) $$invalidate(4, solid = $$new_props.solid);
        };

        $$self.$capture_state = () => ({ src, size, solid, icon });

        $$self.$inject_state = $$new_props => {
            if ('src' in $$props) $$invalidate(3, src = $$new_props.src);
            if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
            if ('solid' in $$props) $$invalidate(4, solid = $$new_props.solid);
            if ('icon' in $$props) $$invalidate(1, icon = $$new_props.icon);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*src, solid*/ 24) {
                $$invalidate(1, icon = src?.[solid ? "solid" : "default"]);
            }
        };

        return [size, icon, $$restProps, src, solid];
    }

    class Icon extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$9, create_fragment$9, safe_not_equal, { src: 3, size: 0, solid: 4 });

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Icon",
                options,
                id: create_fragment$9.name
            });

            const { ctx } = this.$$;
            const props = options.props || {};

            if (/*src*/ ctx[3] === undefined && !('src' in props)) {
                console.warn("<Icon> was created without expected prop 'src'");
            }
        }

        get src() {
            throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        set src(value) {
            throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        get size() {
            throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        set size(value) {
            throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        get solid() {
            throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        set solid(value) {
            throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }
    }

    /* src\Login.svelte generated by Svelte v3.48.0 */
    const file$7 = "src\\Login.svelte";

    function get_each_context$4(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[23] = list[i];
        return child_ctx;
    }

    // (102:4) {#if myAccounts && myAccounts.length}
    function create_if_block_3$3(ctx) {
        let section;
        let div0;
        let h2;
        let span;
        let t1;
        let p;
        let t3;
        let div1;
        let t4;
        let current;
        let each_value = /*myAccounts*/ ctx[8];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
        }

        const out = i => transition_out(each_blocks[i], 1, 1, () => {
            each_blocks[i] = null;
        });

        let if_block = /*showLoginForm*/ ctx[7] == false && create_if_block_4$1(ctx);

        const block = {
            c: function create() {
                section = element("section");
                div0 = element("div");
                h2 = element("h2");
                span = element("span");
                span.textContent = "Saved Characters";
                t1 = space();
                p = element("p");
                p.textContent = "Quickly login to one of your saved characters without entering your password.";
                t3 = space();
                div1 = element("div");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                t4 = space();
                if (if_block) if_block.c();
                add_location(span, file$7, 105, 12, 2979);
                attr_dev(h2, "class", "text-lg font-semibold tracking-tight text-gray-100");
                add_location(h2, file$7, 104, 10, 2902);
                attr_dev(p, "class", "text-xs text-gray-400");
                add_location(p, file$7, 107, 10, 3038);
                add_location(div0, file$7, 103, 8, 2885);
                attr_dev(div1, "class", "space-x-2 text-sm");
                add_location(div1, file$7, 112, 8, 3206);
                attr_dev(section, "class", "space-y-4");
                add_location(section, file$7, 102, 6, 2848);
            },
            m: function mount(target, anchor) {
                insert_dev(target, section, anchor);
                append_dev(section, div0);
                append_dev(div0, h2);
                append_dev(h2, span);
                append_dev(div0, t1);
                append_dev(div0, p);
                append_dev(section, t3);
                append_dev(section, div1);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(div1, null);
                }

                append_dev(section, t4);
                if (if_block) if_block.m(section, null);
                current = true;
            },
            p: function update(ctx, dirty) {
                if (dirty & /*localStorage, myAccounts, window, LockOpen*/ 256) {
                    each_value = /*myAccounts*/ ctx[8];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$4(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                            transition_in(each_blocks[i], 1);
                        } else {
                            each_blocks[i] = create_each_block$4(child_ctx);
                            each_blocks[i].c();
                            transition_in(each_blocks[i], 1);
                            each_blocks[i].m(div1, null);
                        }
                    }

                    group_outros();

                    for (i = each_value.length; i < each_blocks.length; i += 1) {
                        out(i);
                    }

                    check_outros();
                }

                if (/*showLoginForm*/ ctx[7] == false) {
                    if (if_block) {
                        if_block.p(ctx, dirty);
                    } else {
                        if_block = create_if_block_4$1(ctx);
                        if_block.c();
                        if_block.m(section, null);
                    }
                } else if (if_block) {
                    if_block.d(1);
                    if_block = null;
                }
            },
            i: function intro(local) {
                if (current) return;

                for (let i = 0; i < each_value.length; i += 1) {
                    transition_in(each_blocks[i]);
                }

                current = true;
            },
            o: function outro(local) {
                each_blocks = each_blocks.filter(Boolean);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    transition_out(each_blocks[i]);
                }

                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(section);
                destroy_each(each_blocks, detaching);
                if (if_block) if_block.d();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_3$3.name,
            type: "if",
            source: "(102:4) {#if myAccounts && myAccounts.length}",
            ctx
        });

        return block;
    }

    // (114:10) {#each myAccounts as account}
    function create_each_block$4(ctx) {
        let div;
        let icon;
        let t0;
        let span;
        let t1_value = /*account*/ ctx[23].name.replace("_", " ") + "";
        let t1;
        let t2;
        let current;
        let mounted;
        let dispose;

        icon = new Icon({
                props: { src: LockOpen, class: "w-4 h-4 mr-2" },
                $$inline: true
            });

        function click_handler() {
            return /*click_handler*/ ctx[10](/*account*/ ctx[23]);
        }

        const block = {
            c: function create() {
                div = element("div");
                create_component(icon.$$.fragment);
                t0 = space();
                span = element("span");
                t1 = text(t1_value);
                t2 = space();
                attr_dev(span, "class", "font-semibold");
                add_location(span, file$7, 122, 14, 3686);
                attr_dev(div, "class", "rounded-md bg-dark hover:bg-opacity-80 text-gray-300 py-2 px-4 inline-flex flex-nowrap items-center cursor-pointer");
                add_location(div, file$7, 114, 12, 3292);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
                mount_component(icon, div, null);
                append_dev(div, t0);
                append_dev(div, span);
                append_dev(span, t1);
                append_dev(div, t2);
                current = true;

                if (!mounted) {
                    dispose = listen_dev(div, "click", click_handler, false, false, false);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
            },
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
                destroy_component(icon);
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block$4.name,
            type: "each",
            source: "(114:10) {#each myAccounts as account}",
            ctx
        });

        return block;
    }

    // (128:8) {#if showLoginForm == false}
    function create_if_block_4$1(ctx) {
        let div;
        let mounted;
        let dispose;

        const block = {
            c: function create() {
                div = element("div");
                div.textContent = "Click here to add another character.";
                attr_dev(div, "class", "cursor-pointer text-imblue-light shadow-sm hover:text-opacity-90 font-semibold text-xs");
                add_location(div, file$7, 128, 10, 3861);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);

                if (!mounted) {
                    dispose = listen_dev(div, "click", prevent_default(/*click_handler_1*/ ctx[11]), false, true, false);
                    mounted = true;
                }
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_4$1.name,
            type: "if",
            source: "(128:8) {#if showLoginForm == false}",
            ctx
        });

        return block;
    }

    // (141:4) {#if showLoginForm == true}
    function create_if_block$5(ctx) {
        let section;
        let h2;
        let span;
        let t1;
        let p;
        let t3;
        let div7;
        let form;
        let div1;
        let label0;
        let t5;
        let div0;
        let input0;
        let t6;
        let div3;
        let label1;
        let t8;
        let div2;
        let input1;
        let t9;
        let t10;
        let div5;
        let label3;
        let input2;
        let t11;
        let div4;
        let t12;
        let label2;
        let t14;
        let div6;
        let mounted;
        let dispose;
        let if_block0 = /*otpRequired*/ ctx[6] === true && create_if_block_2$3(ctx);

        function select_block_type(ctx, dirty) {
            if (/*loginLoading*/ ctx[2] == true) return create_if_block_1$4;
            return create_else_block$3;
        }

        let current_block_type = select_block_type(ctx);
        let if_block1 = current_block_type(ctx);

        const block = {
            c: function create() {
                section = element("section");
                h2 = element("h2");
                span = element("span");
                span.textContent = "Character Login";
                t1 = space();
                p = element("p");
                p.textContent = "Enter your in-game credentials. If this is a public or shared computer, do not save your login info.";
                t3 = space();
                div7 = element("div");
                form = element("form");
                div1 = element("div");
                label0 = element("label");
                label0.textContent = "Name";
                t5 = space();
                div0 = element("div");
                input0 = element("input");
                t6 = space();
                div3 = element("div");
                label1 = element("label");
                label1.textContent = "Password";
                t8 = space();
                div2 = element("div");
                input1 = element("input");
                t9 = space();
                if (if_block0) if_block0.c();
                t10 = space();
                div5 = element("div");
                label3 = element("label");
                input2 = element("input");
                t11 = space();
                div4 = element("div");
                t12 = space();
                label2 = element("label");
                label2.textContent = "Remember me on this computer";
                t14 = space();
                div6 = element("div");
                if_block1.c();
                add_location(span, file$7, 143, 10, 4344);
                attr_dev(h2, "class", "text-lg font-semibold tracking-tight text-gray-100");
                add_location(h2, file$7, 142, 8, 4269);
                attr_dev(p, "class", "text-xs text-gray-400");
                add_location(p, file$7, 145, 8, 4397);
                attr_dev(label0, "for", "username");
                attr_dev(label0, "class", "text-gray-300 font-semibold w-[30%] text-sm");
                add_location(label0, file$7, 157, 14, 4862);
                attr_dev(input0, "id", "username");
                attr_dev(input0, "name", "username");
                attr_dev(input0, "type", "text");
                attr_dev(input0, "placeholder", "Firstname_Lastname");
                input0.required = true;
                attr_dev(input0, "class", "appearance-none block w-full px-3 py-2 text-sm rounded-md placeholder-gray-500 focus:outline-none select-text bg-verydark text-gray-300 border border-dark focus:ring-0 focus:border-gray-600");
                add_location(input0, file$7, 159, 16, 5015);
                attr_dev(div0, "class", "flex-1 items-center");
                add_location(div0, file$7, 158, 14, 4964);
                attr_dev(div1, "class", "px-4 flex items-center");
                add_location(div1, file$7, 156, 12, 4810);
                attr_dev(label1, "for", "password");
                attr_dev(label1, "class", "text-gray-300 font-semibold w-[30%] text-sm");
                add_location(label1, file$7, 172, 14, 5588);
                attr_dev(input1, "id", "password");
                attr_dev(input1, "name", "password");
                attr_dev(input1, "type", "password");
                attr_dev(input1, "autocomplete", "current-password");
                attr_dev(input1, "placeholder", "");
                input1.required = true;
                attr_dev(input1, "class", "appearance-none block w-full px-3 py-2 text-sm rounded-md placeholder-gray-500 focus:outline-none select-text bg-verydark text-gray-300 border border-dark focus:ring-0 focus:border-gray-600");
                add_location(input1, file$7, 174, 16, 5745);
                attr_dev(div2, "class", "flex-1 items-center");
                add_location(div2, file$7, 173, 14, 5694);
                attr_dev(div3, "class", "px-4 flex items-center");
                add_location(div3, file$7, 171, 12, 5536);
                attr_dev(input2, "type", "checkbox");
                attr_dev(input2, "id", "remember-me");
                attr_dev(input2, "class", "sr-only peer");
                add_location(input2, file$7, 208, 16, 7345);
                attr_dev(div4, "class", "w-11 h-6 bg-verydark rounded-full peer peer-focus:ring-0 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-imblue");
                add_location(div4, file$7, 209, 16, 7452);
                attr_dev(label2, "for", "remember-me");
                attr_dev(label2, "class", "ml-2 block text-gray-300 cursor-pointer");
                add_location(label2, file$7, 212, 16, 7882);
                attr_dev(label3, "for", "remember-me");
                attr_dev(label3, "class", "inline-flex relative items-center cursor-pointer");
                add_location(label3, file$7, 207, 14, 7245);
                attr_dev(div5, "class", "px-4 flex items-center text-xs justify-end");
                add_location(div5, file$7, 206, 12, 7173);
                attr_dev(div6, "class", "text-right");
                add_location(div6, file$7, 218, 12, 8089);
                attr_dev(form, "class", "space-y-4");
                attr_dev(form, "method", "post");
                add_location(form, file$7, 150, 10, 4621);
                attr_dev(div7, "class", "bg-dark p-4 rounded-md mt-4");
                add_location(div7, file$7, 149, 8, 4568);
                add_location(section, file$7, 141, 6, 4250);
            },
            m: function mount(target, anchor) {
                insert_dev(target, section, anchor);
                append_dev(section, h2);
                append_dev(h2, span);
                append_dev(section, t1);
                append_dev(section, p);
                append_dev(section, t3);
                append_dev(section, div7);
                append_dev(div7, form);
                append_dev(form, div1);
                append_dev(div1, label0);
                append_dev(div1, t5);
                append_dev(div1, div0);
                append_dev(div0, input0);
                set_input_value(input0, /*username*/ ctx[0]);
                append_dev(form, t6);
                append_dev(form, div3);
                append_dev(div3, label1);
                append_dev(div3, t8);
                append_dev(div3, div2);
                append_dev(div2, input1);
                set_input_value(input1, /*password*/ ctx[4]);
                append_dev(form, t9);
                if (if_block0) if_block0.m(form, null);
                append_dev(form, t10);
                append_dev(form, div5);
                append_dev(div5, label3);
                append_dev(label3, input2);
                input2.checked = /*rememberMe*/ ctx[5];
                append_dev(label3, t11);
                append_dev(label3, div4);
                append_dev(label3, t12);
                append_dev(label3, label2);
                append_dev(form, t14);
                append_dev(form, div6);
                if_block1.m(div6, null);
                /*form_binding*/ ctx[17](form);

                if (!mounted) {
                    dispose = [
                        listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
                        listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
                        listen_dev(input2, "change", /*input2_change_handler*/ ctx[15]),
                        listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[16]), false, true, false)
                    ];

                    mounted = true;
                }
            },
            p: function update(ctx, dirty) {
                if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
                    set_input_value(input0, /*username*/ ctx[0]);
                }

                if (dirty & /*password*/ 16 && input1.value !== /*password*/ ctx[4]) {
                    set_input_value(input1, /*password*/ ctx[4]);
                }

                if (/*otpRequired*/ ctx[6] === true) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_2$3(ctx);
                        if_block0.c();
                        if_block0.m(form, t10);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (dirty & /*rememberMe*/ 32) {
                    input2.checked = /*rememberMe*/ ctx[5];
                }

                if (current_block_type !== (current_block_type = select_block_type(ctx))) {
                    if_block1.d(1);
                    if_block1 = current_block_type(ctx);

                    if (if_block1) {
                        if_block1.c();
                        if_block1.m(div6, null);
                    }
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(section);
                if (if_block0) if_block0.d();
                if_block1.d();
                /*form_binding*/ ctx[17](null);
                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block$5.name,
            type: "if",
            source: "(141:4) {#if showLoginForm == true}",
            ctx
        });

        return block;
    }

    // (188:12) {#if otpRequired === true}
    function create_if_block_2$3(ctx) {
        let div1;
        let label;
        let t1;
        let div0;
        let input;
        let mounted;
        let dispose;

        const block = {
            c: function create() {
                div1 = element("div");
                label = element("label");
                label.textContent = "One-Time Password";
                t1 = space();
                div0 = element("div");
                input = element("input");
                attr_dev(label, "for", "otp");
                attr_dev(label, "class", "text-gray-300 font-semibold w-[30%] text-sm");
                add_location(label, file$7, 189, 16, 6399);
                attr_dev(input, "id", "otp");
                attr_dev(input, "name", "otp");
                attr_dev(input, "type", "text");
                attr_dev(input, "maxlength", "6");
                attr_dev(input, "autocomplete", "otp");
                attr_dev(input, "placeholder", "000000");
                input.autofocus = true;
                attr_dev(input, "class", "appearance-none block w-full px-3 py-2 text-sm rounded-md placeholder-gray-500 focus:outline-none select-text bg-verydark text-gray-300 border border-dark focus:ring-0 focus:border-gray-600");
                add_location(input, file$7, 191, 18, 6564);
                attr_dev(div0, "class", "flex-1 items-center");
                add_location(div0, file$7, 190, 16, 6511);
                attr_dev(div1, "class", "px-4 flex items-center");
                add_location(div1, file$7, 188, 14, 6345);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div1, anchor);
                append_dev(div1, label);
                append_dev(div1, t1);
                append_dev(div1, div0);
                append_dev(div0, input);
                set_input_value(input, /*otp*/ ctx[1]);
                input.focus();

                if (!mounted) {
                    dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[14]);
                    mounted = true;
                }
            },
            p: function update(ctx, dirty) {
                if (dirty & /*otp*/ 2 && input.value !== /*otp*/ ctx[1]) {
                    set_input_value(input, /*otp*/ ctx[1]);
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div1);
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_2$3.name,
            type: "if",
            source: "(188:12) {#if otpRequired === true}",
            ctx
        });

        return block;
    }

    // (246:14) {:else}
    function create_else_block$3(ctx) {
        let button;

        const block = {
            c: function create() {
                button = element("button");
                button.textContent = "Login";
                attr_dev(button, "type", "submit");
                attr_dev(button, "class", "w-32 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-imblue hover:bg-imblue-dark focus:outline-none");
                add_location(button, file$7, 246, 16, 9338);
            },
            m: function mount(target, anchor) {
                insert_dev(target, button, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(button);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block$3.name,
            type: "else",
            source: "(246:14) {:else}",
            ctx
        });

        return block;
    }

    // (230:14) {#if loginLoading == true}
    function create_if_block_1$4(ctx) {
        let div;
        let svg;
        let circle;
        let path;

        const block = {
            c: function create() {
                div = element("div");
                svg = svg_element("svg");
                circle = svg_element("circle");
                path = svg_element("path");
                attr_dev(circle, "class", "opacity-25");
                attr_dev(circle, "cx", "12");
                attr_dev(circle, "cy", "12");
                attr_dev(circle, "r", "10");
                attr_dev(circle, "stroke", "currentColor");
                attr_dev(circle, "stroke-width", "4");
                add_location(circle, file$7, 237, 20, 8881);
                attr_dev(path, "class", "opacity-75");
                attr_dev(path, "fill", "currentColor");
                attr_dev(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
                add_location(path, file$7, 238, 20, 8994);
                attr_dev(svg, "class", "animate-spin h-6 w-6 text-white");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg, "fill", "none");
                attr_dev(svg, "viewBox", "0 0 24 24");
                add_location(svg, file$7, 231, 18, 8643);
                attr_dev(div, "class", "inline-block py-2 px-4");
                add_location(div, file$7, 230, 16, 8587);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
                append_dev(div, svg);
                append_dev(svg, circle);
                append_dev(svg, path);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1$4.name,
            type: "if",
            source: "(230:14) {#if loginLoading == true}",
            ctx
        });

        return block;
    }

    function create_fragment$8(ctx) {
        let div1;
        let div0;
        let t;
        let current;
        let if_block0 = /*myAccounts*/ ctx[8] && /*myAccounts*/ ctx[8].length && create_if_block_3$3(ctx);
        let if_block1 = /*showLoginForm*/ ctx[7] == true && create_if_block$5(ctx);

        const block = {
            c: function create() {
                div1 = element("div");
                div0 = element("div");
                if (if_block0) if_block0.c();
                t = space();
                if (if_block1) if_block1.c();
                attr_dev(div0, "class", "mx-auto w-2/3 space-y-8");
                add_location(div0, file$7, 100, 2, 2760);
                attr_dev(div1, "class", "min-h-screen bg-verydark flex flex-col justify-center py-12 select-none ");
                add_location(div1, file$7, 95, 0, 2545);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div1, anchor);
                append_dev(div1, div0);
                if (if_block0) if_block0.m(div0, null);
                append_dev(div0, t);
                if (if_block1) if_block1.m(div0, null);
                current = true;
            },
            p: function update(ctx, [dirty]) {
                if (/*myAccounts*/ ctx[8] && /*myAccounts*/ ctx[8].length) if_block0.p(ctx, dirty);

                if (/*showLoginForm*/ ctx[7] == true) {
                    if (if_block1) {
                        if_block1.p(ctx, dirty);
                    } else {
                        if_block1 = create_if_block$5(ctx);
                        if_block1.c();
                        if_block1.m(div0, null);
                    }
                } else if (if_block1) {
                    if_block1.d(1);
                    if_block1 = null;
                }
            },
            i: function intro(local) {
                if (current) return;
                transition_in(if_block0);
                current = true;
            },
            o: function outro(local) {
                transition_out(if_block0);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div1);
                if (if_block0) if_block0.d();
                if (if_block1) if_block1.d();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$8.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function ucfirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function instance$8($$self, $$props, $$invalidate) {
        let $playerInfo;
        let $sessionToken;
        let $systemInfo;
        validate_store(playerInfo, 'playerInfo');
        component_subscribe($$self, playerInfo, $$value => $$invalidate(18, $playerInfo = $$value));
        validate_store(sessionToken, 'sessionToken');
        component_subscribe($$self, sessionToken, $$value => $$invalidate(19, $sessionToken = $$value));
        validate_store(systemInfo, 'systemInfo');
        component_subscribe($$self, systemInfo, $$value => $$invalidate(20, $systemInfo = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Login', slots, []);
        const { dialog } = require("@electron/remote");
        let loginLoading = false;
        let loginFormEl;
        let username = "";
        let password = "";
        let otp = "";
        let rememberMe = false;
        let otpEl;
        let otpRequired = false;
        let myAccounts = getSavedTokens();
        let showLoginForm = !myAccounts || !myAccounts.length;

        const submitLogin = async e => {
            $$invalidate(2, loginLoading = true);

            const loginResult = await login({
                username,
                password,
                otp,
                remember: rememberMe,
                system_uuid: $systemInfo.system.uuid || null
            });

            if (loginResult.otpRequired) {
                $$invalidate(1, otp = "");

                // otp = loginResult.reqOtp;
                $$invalidate(6, otpRequired = true);

                if (otpEl) otpEl.focus();
                $$invalidate(2, loginLoading = false);
                return;
            }

            if (!loginResult.success) {
                $$invalidate(2, loginLoading = false);

                dialog.showMessageBox({
                    message: `Are you sure the username and password you entered are correct?`,
                    type: "error",
                    title: "Login failed"
                });

                return;
            }

            set_store_value(playerInfo, $playerInfo = await getUserBySessionToken({ token: loginResult.sessionToken }), $playerInfo);
            set_store_value(sessionToken, $sessionToken = loginResult.sessionToken, $sessionToken);
            $$invalidate(2, loginLoading = false);
            createSocketConnection();

            if (loginResult.authToken) {
                let savedTokens = getSavedTokens();
                savedTokens = savedTokens.filter(st => st.id !== $playerInfo.playerId);

                savedTokens.push({
                    id: $playerInfo.playerId,
                    name: $playerInfo.name,
                    token: loginResult.authToken
                });

                localStorage.setItem("savedTokens", JSON.stringify(savedTokens));
                localStorage.setItem("authToken", loginResult.authToken);
            }
        };

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
        });

        const click_handler = account => {
            localStorage.setItem("authToken", account.token);
            window.location.reload();
        };

        const click_handler_1 = () => {
            $$invalidate(7, showLoginForm = !showLoginForm);
        };

        function input0_input_handler() {
            username = this.value;
            $$invalidate(0, username);
        }

        function input1_input_handler() {
            password = this.value;
            $$invalidate(4, password);
        }

        function input_input_handler() {
            otp = this.value;
            $$invalidate(1, otp);
        }

        function input2_change_handler() {
            rememberMe = this.checked;
            $$invalidate(5, rememberMe);
        }

        const submit_handler = e => submitLogin();

        function form_binding($$value) {
            binding_callbacks[$$value ? 'unshift' : 'push'](() => {
                loginFormEl = $$value;
                $$invalidate(3, loginFormEl);
            });
        }

        $$self.$capture_state = () => ({
            dialog,
            Icon,
            LockOpen,
            ShieldCheck,
            login,
            getUserBySessionToken,
            getSavedTokens,
            createSocketConnection,
            destroySocketConnection,
            onMount,
            systemInfo,
            sessionToken,
            playerInfo,
            getSystemInfo,
            loginLoading,
            loginFormEl,
            username,
            password,
            otp,
            rememberMe,
            otpEl,
            otpRequired,
            myAccounts,
            showLoginForm,
            ucfirst,
            submitLogin,
            $playerInfo,
            $sessionToken,
            $systemInfo
        });

        $$self.$inject_state = $$props => {
            if ('loginLoading' in $$props) $$invalidate(2, loginLoading = $$props.loginLoading);
            if ('loginFormEl' in $$props) $$invalidate(3, loginFormEl = $$props.loginFormEl);
            if ('username' in $$props) $$invalidate(0, username = $$props.username);
            if ('password' in $$props) $$invalidate(4, password = $$props.password);
            if ('otp' in $$props) $$invalidate(1, otp = $$props.otp);
            if ('rememberMe' in $$props) $$invalidate(5, rememberMe = $$props.rememberMe);
            if ('otpEl' in $$props) otpEl = $$props.otpEl;
            if ('otpRequired' in $$props) $$invalidate(6, otpRequired = $$props.otpRequired);
            if ('myAccounts' in $$props) $$invalidate(8, myAccounts = $$props.myAccounts);
            if ('showLoginForm' in $$props) $$invalidate(7, showLoginForm = $$props.showLoginForm);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*otp*/ 2) {
                {
                    $$invalidate(1, otp = String(otp).trim().replace(/[^0-9]/gi, ""));
                }
            }

            if ($$self.$$.dirty & /*username*/ 1) {
                {
                    const underScorePos = username.indexOf("_");
                    $$invalidate(0, username = username.toString());

                    if (underScorePos === -1) {
                        $$invalidate(0, username = username.replace(" ", "_"));
                    }

                    $$invalidate(0, username = username.replace(/[^a-zA-Z\_]/gi, ""));
                    $$invalidate(0, username = ucfirst(username));
                }
            }
        };

        return [
            username,
            otp,
            loginLoading,
            loginFormEl,
            password,
            rememberMe,
            otpRequired,
            showLoginForm,
            myAccounts,
            submitLogin,
            click_handler,
            click_handler_1,
            input0_input_handler,
            input1_input_handler,
            input_input_handler,
            input2_change_handler,
            submit_handler,
            form_binding
        ];
    }

    class Login extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Login",
                options,
                id: create_fragment$8.name
            });
        }
    }

    var EN_US = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
    function en_US (diff, idx) {
        if (idx === 0)
            return ['just now', 'right now'];
        var unit = EN_US[Math.floor(idx / 2)];
        if (diff > 1)
            unit += 's';
        return [diff + " " + unit + " ago", "in " + diff + " " + unit];
    }

    var ZH_CN = ['秒', '分钟', '小时', '天', '周', '个月', '年'];
    function zh_CN (diff, idx) {
        if (idx === 0)
            return ['刚刚', '片刻后'];
        var unit = ZH_CN[~~(idx / 2)];
        return [diff + " " + unit + "\u524D", diff + " " + unit + "\u540E"];
    }

    /**
     * Created by hustcc on 18/5/20.
     * Contract: i@hust.cc
     */
    /**
     * All supported locales
     */
    var Locales = {};
    /**
     * register a locale
     * @param locale
     * @param func
     */
    var register = function (locale, func) {
        Locales[locale] = func;
    };
    /**
     * get a locale, default is en_US
     * @param locale
     * @returns {*}
     */
    var getLocale = function (locale) {
        return Locales[locale] || Locales['en_US'];
    };

    /**
     * Created by hustcc on 18/5/20.
     * Contract: i@hust.cc
     */
    var SEC_ARRAY = [
        60,
        60,
        24,
        7,
        365 / 7 / 12,
        12,
    ];
    /**
     * format Date / string / timestamp to timestamp
     * @param input
     * @returns {*}
     */
    function toDate(input) {
        if (input instanceof Date)
            return input;
        // @ts-ignore
        if (!isNaN(input) || /^\d+$/.test(input))
            return new Date(parseInt(input));
        input = (input || '')
            // @ts-ignore
            .trim()
            .replace(/\.\d+/, '') // remove milliseconds
            .replace(/-/, '/')
            .replace(/-/, '/')
            .replace(/(\d)T(\d)/, '$1 $2')
            .replace(/Z/, ' UTC') // 2017-2-5T3:57:52Z -> 2017-2-5 3:57:52UTC
            .replace(/([+-]\d\d):?(\d\d)/, ' $1$2'); // -04:00 -> -0400
        return new Date(input);
    }
    /**
     * format the diff second to *** time ago, with setting locale
     * @param diff
     * @param localeFunc
     * @returns
     */
    function formatDiff(diff, localeFunc) {
        /**
         * if locale is not exist, use defaultLocale.
         * if defaultLocale is not exist, use build-in `en`.
         * be sure of no error when locale is not exist.
         *
         * If `time in`, then 1
         * If `time ago`, then 0
         */
        var agoIn = diff < 0 ? 1 : 0;
        /**
         * Get absolute value of number (|diff| is non-negative) value of x
         * |diff| = diff if diff is positive
         * |diff| = -diff if diff is negative
         * |0| = 0
         */
        diff = Math.abs(diff);
        /**
         * Time in seconds
         */
        var totalSec = diff;
        /**
         * Unit of time
         */
        var idx = 0;
        for (; diff >= SEC_ARRAY[idx] && idx < SEC_ARRAY.length; idx++) {
            diff /= SEC_ARRAY[idx];
        }
        /**
         * Math.floor() is alternative of ~~
         *
         * The differences and bugs:
         * Math.floor(3.7) -> 4 but ~~3.7 -> 3
         * Math.floor(1559125440000.6) -> 1559125440000 but ~~1559125440000.6 -> 52311552
         *
         * More information about the performance of algebraic:
         * https://www.youtube.com/watch?v=65-RbBwZQdU
         */
        diff = Math.floor(diff);
        idx *= 2;
        if (diff > (idx === 0 ? 9 : 1))
            idx += 1;
        return localeFunc(diff, idx, totalSec)[agoIn].replace('%s', diff.toString());
    }
    /**
     * calculate the diff second between date to be formatted an now date.
     * @param date
     * @param relativeDate
     * @returns {number}
     */
    function diffSec(date, relativeDate) {
        var relDate = relativeDate ? toDate(relativeDate) : new Date();
        return (+relDate - +toDate(date)) / 1000;
    }
    /**
     * nextInterval: calculate the next interval time.
     * - diff: the diff sec between now and date to be formatted.
     *
     * What's the meaning?
     * diff = 61 then return 59
     * diff = 3601 (an hour + 1 second), then return 3599
     * make the interval with high performance.
     **/
    function nextInterval(diff) {
        var rst = 1, i = 0, d = Math.abs(diff);
        for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY.length; i++) {
            diff /= SEC_ARRAY[i];
            rst *= SEC_ARRAY[i];
        }
        d = d % rst;
        d = d ? rst - d : rst;
        return Math.ceil(d);
    }

    /**
     * format a TDate into string
     * @param date
     * @param locale
     * @param opts
     */
    var format = function (date, locale, opts) {
        // diff seconds
        var sec = diffSec(date, opts && opts.relativeDate);
        // format it with locale
        return formatDiff(sec, getLocale(locale));
    };

    var ATTR_TIMEAGO_TID = 'timeago-id';
    /**
     * get the datetime attribute, `datetime` are supported.
     * @param node
     * @returns {*}
     */
    function getDateAttribute(node) {
        return node.getAttribute('datetime');
    }
    /**
     * set the node attribute, native DOM
     * @param node
     * @param timerId
     * @returns {*}
     */
    function setTimerId(node, timerId) {
        // @ts-ignore
        node.setAttribute(ATTR_TIMEAGO_TID, timerId);
    }
    /**
     * get the timer id
     * @param node
     */
    function getTimerId(node) {
        return parseInt(node.getAttribute(ATTR_TIMEAGO_TID));
    }

    // all realtime timer
    var TIMER_POOL = {};
    /**
     * clear a timer from pool
     * @param tid
     */
    var clear = function (tid) {
        clearTimeout(tid);
        delete TIMER_POOL[tid];
    };
    // run with timer(setTimeout)
    function run(node, date, localeFunc, opts) {
        // clear the node's exist timer
        clear(getTimerId(node));
        var relativeDate = opts.relativeDate, minInterval = opts.minInterval;
        // get diff seconds
        var diff = diffSec(date, relativeDate);
        // render
        node.innerText = formatDiff(diff, localeFunc);
        var tid = setTimeout(function () {
            run(node, date, localeFunc, opts);
        }, Math.min(Math.max(nextInterval(diff), minInterval || 1) * 1000, 0x7fffffff));
        // there is no need to save node in object. Just save the key
        TIMER_POOL[tid] = 0;
        setTimerId(node, tid);
    }
    /**
     * cancel a timer or all timers
     * @param node - node hosting the time string
     */
    function cancel(node) {
        // cancel one
        if (node)
            clear(getTimerId(node));
        // cancel all
        // @ts-ignore
        else
            Object.keys(TIMER_POOL).forEach(clear);
    }
    /**
     * render a dom realtime
     * @param nodes
     * @param locale
     * @param opts
     */
    function render(nodes, locale, opts) {
        // by .length
        // @ts-ignore
        var nodeList = nodes.length ? nodes : [nodes];
        nodeList.forEach(function (node) {
            run(node, getDateAttribute(node), getLocale(locale), opts || {});
        });
        return nodeList;
    }

    /**
     * Created by hustcc on 18/5/20.
     * Contract: i@hust.cc
     */
    register('en_US', en_US);
    register('zh_CN', zh_CN);

    var timeago = /*#__PURE__*/Object.freeze({
        __proto__: null,
        register: register,
        format: format,
        render: render,
        cancel: cancel
    });

    const moneyFormat = (amount) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount).replace(/\D00$/, "");

    /* src\Game.svelte generated by Svelte v3.48.0 */

    const file$6 = "src\\Game.svelte";

    function get_each_context$3(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[19] = list[i];
        return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[22] = list[i];
        return child_ctx;
    }

    // (118:4) {#if $playerInfo.idFaction > 0 && onlineFactionMemberCount > 0}
    function create_if_block_3$2(ctx) {
        let p;
        let t0;
        let span;
        let t1;
        let t2;
        let t3_value = /*$serverInfo*/ ctx[6].factions.find(/*func*/ ctx[8]).f_abbr + "";
        let t3;
        let t4;
        let t5;

        const block = {
            c: function create() {
                p = element("p");
                t0 = text("There are ");
                span = element("span");
                t1 = text(/*onlineFactionMemberCount*/ ctx[4]);
                t2 = space();
                t3 = text(t3_value);
                t4 = text(" members");
                t5 = text("\r\n        playing right now.");
                attr_dev(span, "class", "font-semibold");
                add_location(span, file$6, 119, 18, 3814);
                attr_dev(p, "class", "text-sm text-gray-400");
                add_location(p, file$6, 118, 6, 3761);
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor);
                append_dev(p, t0);
                append_dev(p, span);
                append_dev(span, t1);
                append_dev(span, t2);
                append_dev(span, t3);
                append_dev(span, t4);
                append_dev(p, t5);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*onlineFactionMemberCount*/ 16) set_data_dev(t1, /*onlineFactionMemberCount*/ ctx[4]);
                if (dirty & /*$serverInfo, $playerInfo*/ 65 && t3_value !== (t3_value = /*$serverInfo*/ ctx[6].factions.find(/*func*/ ctx[8]).f_abbr + "")) set_data_dev(t3, t3_value);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(p);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_3$2.name,
            type: "if",
            source: "(118:4) {#if $playerInfo.idFaction > 0 && onlineFactionMemberCount > 0}",
            ctx
        });

        return block;
    }

    // (128:4) {#if $serverInfo.war && $serverInfo.war.length}
    function create_if_block_2$2(ctx) {
        let each_1_anchor;
        let current;
        let each_value_1 = /*$serverInfo*/ ctx[6].war;
        validate_each_argument(each_value_1);
        let each_blocks = [];

        for (let i = 0; i < each_value_1.length; i += 1) {
            each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
        }

        const out = i => transition_out(each_blocks[i], 1, 1, () => {
            each_blocks[i] = null;
        });

        const block = {
            c: function create() {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                each_1_anchor = empty$1();
            },
            m: function mount(target, anchor) {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(target, anchor);
                }

                insert_dev(target, each_1_anchor, anchor);
                current = true;
            },
            p: function update(ctx, dirty) {
                if (dirty & /*$onlinePlayers, $serverInfo, moneyFormat, timeago, InformationCircle*/ 66) {
                    each_value_1 = /*$serverInfo*/ ctx[6].war;
                    validate_each_argument(each_value_1);
                    let i;

                    for (i = 0; i < each_value_1.length; i += 1) {
                        const child_ctx = get_each_context_1(ctx, each_value_1, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                            transition_in(each_blocks[i], 1);
                        } else {
                            each_blocks[i] = create_each_block_1(child_ctx);
                            each_blocks[i].c();
                            transition_in(each_blocks[i], 1);
                            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
                        }
                    }

                    group_outros();

                    for (i = each_value_1.length; i < each_blocks.length; i += 1) {
                        out(i);
                    }

                    check_outros();
                }
            },
            i: function intro(local) {
                if (current) return;

                for (let i = 0; i < each_value_1.length; i += 1) {
                    transition_in(each_blocks[i]);
                }

                current = true;
            },
            o: function outro(local) {
                each_blocks = each_blocks.filter(Boolean);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    transition_out(each_blocks[i]);
                }

                current = false;
            },
            d: function destroy(detaching) {
                destroy_each(each_blocks, detaching);
                if (detaching) detach_dev(each_1_anchor);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_2$2.name,
            type: "if",
            source: "(128:4) {#if $serverInfo.war && $serverInfo.war.length}",
            ctx
        });

        return block;
    }

    // (129:6) {#each $serverInfo.war as war}
    function create_each_block_1(ctx) {
        let div4;
        let div3;
        let div0;
        let icon;
        let t0;
        let div2;
        let h3;
        let t1;
        let t2_value = /*war*/ ctx[22].factions.filter(func_1).map(func_2).join(", ") + "";
        let t2;
        let t3;
        let span0;
        let t5;
        let t6_value = /*war*/ ctx[22].factions.filter(func_3).map(func_4).join(", ") + "";
        let t6;
        let t7;
        let div1;
        let p0;
        let t8;
        let t9_value = format(/*war*/ ctx[22].date_started) + "";
        let t9;
        let t10;
        let span1;
        let t11_value = moneyFormat(/*war*/ ctx[22].prize) + "";
        let t11;
        let t12;
        let span2;
        let t13_value = /*war*/ ctx[22].factions.reduce(func_5, 0) + "";
        let t13;
        let t14;
        let t15;
        let span3;
        let t16_value = moneyFormat(/*war*/ ctx[22].factions.reduce(func_6, 0)) + "";
        let t16;
        let t17;
        let t18;
        let p1;
        let t19;
        let t20_value = /*$onlinePlayers*/ ctx[1].filter(func_7).length + "";
        let t20;
        let t21;
        let t22;
        let current;

        icon = new Icon({
                props: {
                    src: InformationCircle,
                    class: "text-gray-200 w-6 h-6"
                },
                $$inline: true
            });

        function func_7(...args) {
            return /*func_7*/ ctx[9](/*war*/ ctx[22], ...args);
        }

        const block = {
            c: function create() {
                div4 = element("div");
                div3 = element("div");
                div0 = element("div");
                create_component(icon.$$.fragment);
                t0 = space();
                div2 = element("div");
                h3 = element("h3");
                t1 = text("Faction War: ");
                t2 = text(t2_value);
                t3 = space();
                span0 = element("span");
                span0.textContent = "vs";
                t5 = space();
                t6 = text(t6_value);
                t7 = space();
                div1 = element("div");
                p0 = element("p");
                t8 = text("War started ");
                t9 = text(t9_value);
                t10 = text(" with a prize of\r\n                  ");
                span1 = element("span");
                t11 = text(t11_value);
                t12 = text(". A total of\r\n                  ");
                span2 = element("span");
                t13 = text(t13_value);
                t14 = text(" kills");
                t15 = text("\r\n                  have been made and\r\n                  ");
                span3 = element("span");
                t16 = text(t16_value);
                t17 = text(" has been lost in death fees.");
                t18 = space();
                p1 = element("p");
                t19 = text("There are ");
                t20 = text(t20_value);
                t21 = text(" online players in this war.");
                t22 = space();
                attr_dev(div0, "class", "flex-shrink-0");
                add_location(div0, file$6, 131, 12, 4245);
                attr_dev(span0, "class", "font-normal");
                add_location(span0, file$6, 137, 31, 4602);
                attr_dev(h3, "class", "text-sm font-medium text-gray-200");
                add_location(h3, file$6, 133, 14, 4388);
                attr_dev(span1, "class", "font-medium");
                add_location(span1, file$6, 146, 18, 4991);
                attr_dev(span2, "class", "font-medium");
                add_location(span2, file$6, 147, 18, 5080);
                attr_dev(span3, "class", "font-medium");
                add_location(span3, file$6, 151, 18, 5290);
                add_location(p0, file$6, 144, 16, 4886);
                attr_dev(p1, "class", "mt-2");
                add_location(p1, file$6, 155, 16, 5523);
                attr_dev(div1, "class", "mt-2 text-sm text-gray-300");
                add_location(div1, file$6, 143, 14, 4828);
                attr_dev(div2, "class", "ml-3");
                add_location(div2, file$6, 132, 12, 4354);
                attr_dev(div3, "class", "flex");
                add_location(div3, file$6, 130, 10, 4213);
                attr_dev(div4, "class", "rounded-md bg-dark p-3 shadow-sm mt-4");
                add_location(div4, file$6, 129, 8, 4150);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div4, anchor);
                append_dev(div4, div3);
                append_dev(div3, div0);
                mount_component(icon, div0, null);
                append_dev(div3, t0);
                append_dev(div3, div2);
                append_dev(div2, h3);
                append_dev(h3, t1);
                append_dev(h3, t2);
                append_dev(h3, t3);
                append_dev(h3, span0);
                append_dev(h3, t5);
                append_dev(h3, t6);
                append_dev(div2, t7);
                append_dev(div2, div1);
                append_dev(div1, p0);
                append_dev(p0, t8);
                append_dev(p0, t9);
                append_dev(p0, t10);
                append_dev(p0, span1);
                append_dev(span1, t11);
                append_dev(p0, t12);
                append_dev(p0, span2);
                append_dev(span2, t13);
                append_dev(span2, t14);
                append_dev(p0, t15);
                append_dev(p0, span3);
                append_dev(span3, t16);
                append_dev(p0, t17);
                append_dev(div1, t18);
                append_dev(div1, p1);
                append_dev(p1, t19);
                append_dev(p1, t20);
                append_dev(p1, t21);
                append_dev(div4, t22);
                current = true;
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
                if ((!current || dirty & /*$serverInfo*/ 64) && t2_value !== (t2_value = /*war*/ ctx[22].factions.filter(func_1).map(func_2).join(", ") + "")) set_data_dev(t2, t2_value);
                if ((!current || dirty & /*$serverInfo*/ 64) && t6_value !== (t6_value = /*war*/ ctx[22].factions.filter(func_3).map(func_4).join(", ") + "")) set_data_dev(t6, t6_value);
                if ((!current || dirty & /*$serverInfo*/ 64) && t9_value !== (t9_value = format(/*war*/ ctx[22].date_started) + "")) set_data_dev(t9, t9_value);
                if ((!current || dirty & /*$serverInfo*/ 64) && t11_value !== (t11_value = moneyFormat(/*war*/ ctx[22].prize) + "")) set_data_dev(t11, t11_value);
                if ((!current || dirty & /*$serverInfo*/ 64) && t13_value !== (t13_value = /*war*/ ctx[22].factions.reduce(func_5, 0) + "")) set_data_dev(t13, t13_value);
                if ((!current || dirty & /*$serverInfo*/ 64) && t16_value !== (t16_value = moneyFormat(/*war*/ ctx[22].factions.reduce(func_6, 0)) + "")) set_data_dev(t16, t16_value);
                if ((!current || dirty & /*$onlinePlayers, $serverInfo*/ 66) && t20_value !== (t20_value = /*$onlinePlayers*/ ctx[1].filter(func_7).length + "")) set_data_dev(t20, t20_value);
            },
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div4);
                destroy_component(icon);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block_1.name,
            type: "each",
            source: "(129:6) {#each $serverInfo.war as war}",
            ctx
        });

        return block;
    }

    // (168:4) {#if warnings.length}
    function create_if_block_1$3(ctx) {
        let div5;
        let div4;
        let div0;
        let svg;
        let path;
        let t0;
        let div3;
        let h3;
        let t2;
        let span;
        let t4;
        let div2;
        let div1;
        let each_value = /*warnings*/ ctx[3];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
        }

        const block = {
            c: function create() {
                div5 = element("div");
                div4 = element("div");
                div0 = element("div");
                svg = svg_element("svg");
                path = svg_element("path");
                t0 = space();
                div3 = element("div");
                h3 = element("h3");
                h3.textContent = "Some files or mods you are trying to use, are restricted. Please delete them.";
                t2 = space();
                span = element("span");
                span.textContent = "This incident has been reported. However, you will not be punished for it unless you actively try to\r\n              circumvent the anti-cheat.";
                t4 = space();
                div2 = element("div");
                div1 = element("div");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                attr_dev(path, "fill-rule", "evenodd");
                attr_dev(path, "d", "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z");
                attr_dev(path, "clip-rule", "evenodd");
                add_location(path, file$6, 178, 14, 6261);
                attr_dev(svg, "class", "h-5 w-5 text-red-400");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg, "viewBox", "0 0 20 20");
                attr_dev(svg, "fill", "currentColor");
                attr_dev(svg, "aria-hidden", "true");
                add_location(svg, file$6, 171, 12, 6028);
                attr_dev(div0, "class", "flex-shrink-0");
                add_location(div0, file$6, 170, 10, 5987);
                attr_dev(h3, "class", "text-sm font-medium text-red-800");
                add_location(h3, file$6, 186, 12, 6677);
                attr_dev(span, "class", "text-xs text-red-800 opacity-90");
                add_location(span, file$6, 189, 12, 6848);
                attr_dev(div1, "class", "-mx-2 -my-1.5 flex space-x-2");
                add_location(div1, file$6, 194, 14, 7121);
                attr_dev(div2, "class", "mt-4");
                add_location(div2, file$6, 193, 12, 7087);
                attr_dev(div3, "class", "ml-3");
                add_location(div3, file$6, 185, 10, 6645);
                attr_dev(div4, "class", "flex");
                add_location(div4, file$6, 169, 8, 5957);
                attr_dev(div5, "class", "rounded-md bg-red-50 p-4 mt-4");
                add_location(div5, file$6, 168, 6, 5904);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div5, anchor);
                append_dev(div5, div4);
                append_dev(div4, div0);
                append_dev(div0, svg);
                append_dev(svg, path);
                append_dev(div4, t0);
                append_dev(div4, div3);
                append_dev(div3, h3);
                append_dev(div3, t2);
                append_dev(div3, span);
                append_dev(div3, t4);
                append_dev(div3, div2);
                append_dev(div2, div1);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(div1, null);
                }
            },
            p: function update(ctx, dirty) {
                if (dirty & /*warnings*/ 8) {
                    each_value = /*warnings*/ ctx[3];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$3(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block$3(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(div1, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div5);
                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1$3.name,
            type: "if",
            source: "(168:4) {#if warnings.length}",
            ctx
        });

        return block;
    }

    // (196:16) {#each warnings as file}
    function create_each_block$3(ctx) {
        let button;
        let t0_value = /*file*/ ctx[19].name + "";
        let t0;
        let t1;

        const block = {
            c: function create() {
                button = element("button");
                t0 = text(t0_value);
                t1 = space();
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "px-2 py-1 rounded-md text-sm font-medium text-red-800 bg-red-100 focus:outline-none");
                add_location(button, file$6, 196, 18, 7225);
            },
            m: function mount(target, anchor) {
                insert_dev(target, button, anchor);
                append_dev(button, t0);
                append_dev(button, t1);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*warnings*/ 8 && t0_value !== (t0_value = /*file*/ ctx[19].name + "")) set_data_dev(t0, t0_value);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(button);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block$3.name,
            type: "each",
            source: "(196:16) {#each warnings as file}",
            ctx
        });

        return block;
    }

    // (249:8) {:else}
    function create_else_block$2(ctx) {
        let icon;
        let t0;

        let t1_value = (/*$gameState*/ ctx[5].running === true
        ? "Playing"
        : "Start Game") + "";

        let t1;
        let current;

        icon = new Icon({
                props: { src: Play, class: "w-6 h-6 mr-2" },
                $$inline: true
            });

        const block = {
            c: function create() {
                create_component(icon.$$.fragment);
                t0 = space();
                t1 = text(t1_value);
            },
            m: function mount(target, anchor) {
                mount_component(icon, target, anchor);
                insert_dev(target, t0, anchor);
                insert_dev(target, t1, anchor);
                current = true;
            },
            p: function update(ctx, dirty) {
                if ((!current || dirty & /*$gameState*/ 32) && t1_value !== (t1_value = (/*$gameState*/ ctx[5].running === true
                ? "Playing"
                : "Start") + "")) set_data_dev(t1, t1_value);
            },
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                destroy_component(icon, detaching);
                if (detaching) detach_dev(t0);
                if (detaching) detach_dev(t1);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block$2.name,
            type: "else",
            source: "(249:8) {:else}",
            ctx
        });

        return block;
    }

    // (234:8) {#if launchingGame === true}
    function create_if_block$4(ctx) {
        let svg;
        let circle;
        let path;
        let t;

        const block = {
            c: function create() {
                svg = svg_element("svg");
                circle = svg_element("circle");
                path = svg_element("path");
                t = text("\r\n          Starting ..");
                attr_dev(circle, "class", "opacity-25");
                attr_dev(circle, "cx", "12");
                attr_dev(circle, "cy", "12");
                attr_dev(circle, "r", "10");
                attr_dev(circle, "stroke", "currentColor");
                attr_dev(circle, "stroke-width", "4");
                add_location(circle, file$6, 240, 12, 8766);
                attr_dev(path, "class", "opacity-75");
                attr_dev(path, "fill", "currentColor");
                attr_dev(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
                add_location(path, file$6, 241, 12, 8871);
                attr_dev(svg, "class", "animate-spin mr-2 h-6 w-6 text-white");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg, "fill", "none");
                attr_dev(svg, "viewBox", "0 0 24 24");
                add_location(svg, file$6, 234, 10, 8571);
            },
            m: function mount(target, anchor) {
                insert_dev(target, svg, anchor);
                append_dev(svg, circle);
                append_dev(svg, path);
                insert_dev(target, t, anchor);
            },
            p: noop,
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(svg);
                if (detaching) detach_dev(t);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block$4.name,
            type: "if",
            source: "(234:8) {#if launchingGame === true}",
            ctx
        });

        return block;
    }

    function create_fragment$7(ctx) {
        let div3;
        let div0;
        let h2;
        let span;
        let t0;
        let t1_value = /*$playerInfo*/ ctx[0].name.replace("_", " ") + "";
        let t1;
        let t2;
        let t3;
        let t4;
        let t5;
        let t6;
        let div2;
        let div1;
        let button;
        let current_block_type_index;
        let if_block3;
        let current;
        let mounted;
        let dispose;
        let if_block0 = /*$playerInfo*/ ctx[0].idFaction > 0 && /*onlineFactionMemberCount*/ ctx[4] > 0 && create_if_block_3$2(ctx);
        let if_block1 = /*$serverInfo*/ ctx[6].war && /*$serverInfo*/ ctx[6].war.length && create_if_block_2$2(ctx);
        let if_block2 = /*warnings*/ ctx[3].length && create_if_block_1$3(ctx);
        const if_block_creators = [create_if_block$4, create_else_block$2];
        const if_blocks = [];

        function select_block_type(ctx, dirty) {
            if (/*launchingGame*/ ctx[2] === true) return 0;
            return 1;
        }

        current_block_type_index = select_block_type(ctx);
        if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

        const block = {
            c: function create() {
                div3 = element("div");
                div0 = element("div");
                h2 = element("h2");
                span = element("span");
                t0 = text("Welcome back, ");
                t1 = text(t1_value);
                t2 = text("!");
                t3 = space();
                if (if_block0) if_block0.c();
                t4 = space();
                if (if_block1) if_block1.c();
                t5 = space();
                if (if_block2) if_block2.c();
                t6 = space();
                div2 = element("div");
                div1 = element("div");
                button = element("button");
                if_block3.c();
                attr_dev(span, "class", "block");
                add_location(span, file$6, 115, 6, 3595);
                attr_dev(h2, "class", "text-lg font-semibold tracking-tight text-gray-100");
                add_location(h2, file$6, 114, 4, 3524);
                attr_dev(div0, "id", "main-area");
                attr_dev(div0, "class", "flex-1");
                add_location(div0, file$6, 113, 2, 3483);
                attr_dev(button, "class", "flex items-center shadow justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-imblue hover:bg-imblue-light outline-none");
                toggle_class(button, "opacity-80", /*$gameState*/ ctx[5].running === true);
                add_location(button, file$6, 228, 6, 8195);
                attr_dev(div1, "class", "flex rounded-md justify-end mt-4");
                add_location(div1, file$6, 227, 4, 8141);
                attr_dev(div2, "id", "buttons");
                add_location(div2, file$6, 226, 2, 8117);
                attr_dev(div3, "class", "overflow-hidden h-full p-6 flex flex-col");
                add_location(div3, file$6, 112, 0, 3425);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div3, anchor);
                append_dev(div3, div0);
                append_dev(div0, h2);
                append_dev(h2, span);
                append_dev(span, t0);
                append_dev(span, t1);
                append_dev(span, t2);
                append_dev(div0, t3);
                if (if_block0) if_block0.m(div0, null);
                append_dev(div0, t4);
                if (if_block1) if_block1.m(div0, null);
                append_dev(div0, t5);
                if (if_block2) if_block2.m(div0, null);
                append_dev(div3, t6);
                append_dev(div3, div2);
                append_dev(div2, div1);
                append_dev(div1, button);
                if_blocks[current_block_type_index].m(button, null);
                current = true;

                if (!mounted) {
                    dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[10]), false, true, false);
                    mounted = true;
                }
            },
            p: function update(ctx, [dirty]) {
                if ((!current || dirty & /*$playerInfo*/ 1) && t1_value !== (t1_value = /*$playerInfo*/ ctx[0].name.replace("_", " ") + "")) set_data_dev(t1, t1_value);

                if (/*$playerInfo*/ ctx[0].idFaction > 0 && /*onlineFactionMemberCount*/ ctx[4] > 0) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_3$2(ctx);
                        if_block0.c();
                        if_block0.m(div0, t4);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (/*$serverInfo*/ ctx[6].war && /*$serverInfo*/ ctx[6].war.length) {
                    if (if_block1) {
                        if_block1.p(ctx, dirty);

                        if (dirty & /*$serverInfo*/ 64) {
                            transition_in(if_block1, 1);
                        }
                    } else {
                        if_block1 = create_if_block_2$2(ctx);
                        if_block1.c();
                        transition_in(if_block1, 1);
                        if_block1.m(div0, t5);
                    }
                } else if (if_block1) {
                    group_outros();

                    transition_out(if_block1, 1, 1, () => {
                        if_block1 = null;
                    });

                    check_outros();
                }

                if (/*warnings*/ ctx[3].length) {
                    if (if_block2) {
                        if_block2.p(ctx, dirty);
                    } else {
                        if_block2 = create_if_block_1$3(ctx);
                        if_block2.c();
                        if_block2.m(div0, null);
                    }
                } else if (if_block2) {
                    if_block2.d(1);
                    if_block2 = null;
                }

                let previous_block_index = current_block_type_index;
                current_block_type_index = select_block_type(ctx);

                if (current_block_type_index === previous_block_index) {
                    if_blocks[current_block_type_index].p(ctx, dirty);
                } else {
                    group_outros();

                    transition_out(if_blocks[previous_block_index], 1, 1, () => {
                        if_blocks[previous_block_index] = null;
                    });

                    check_outros();
                    if_block3 = if_blocks[current_block_type_index];

                    if (!if_block3) {
                        if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
                        if_block3.c();
                    } else {
                        if_block3.p(ctx, dirty);
                    }

                    transition_in(if_block3, 1);
                    if_block3.m(button, null);
                }

                if (dirty & /*$gameState*/ 32) {
                    toggle_class(button, "opacity-80", /*$gameState*/ ctx[5].running === true);
                }
            },
            i: function intro(local) {
                if (current) return;
                transition_in(if_block1);
                transition_in(if_block3);
                current = true;
            },
            o: function outro(local) {
                transition_out(if_block1);
                transition_out(if_block3);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div3);
                if (if_block0) if_block0.d();
                if (if_block1) if_block1.d();
                if (if_block2) if_block2.d();
                if_blocks[current_block_type_index].d();
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$7.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    const func_1 = f => f.team_id == 0;
    const func_2 = f => f.f_name;
    const func_3 = f => f.team_id == 1;
    const func_4 = f => f.f_name;
    const func_5 = (previousValue, f) => previousValue + f.kills;
    const func_6 = (previousValue, f) => previousValue + f.money_lost;

    function instance$7($$self, $$props, $$invalidate) {
        let $gameState;
        let $sampSettings;
        let $knownTasks;
        let $knownFiles;
        let $knownModules;
        let $playerInfo;
        let $onlinePlayers;
        let $serverInfo;
        validate_store(gameState, 'gameState');
        component_subscribe($$self, gameState, $$value => $$invalidate(5, $gameState = $$value));
        validate_store(sampSettings, 'sampSettings');
        component_subscribe($$self, sampSettings, $$value => $$invalidate(11, $sampSettings = $$value));
        validate_store(knownTasks, 'knownTasks');
        component_subscribe($$self, knownTasks, $$value => $$invalidate(12, $knownTasks = $$value));
        validate_store(knownFiles, 'knownFiles');
        component_subscribe($$self, knownFiles, $$value => $$invalidate(13, $knownFiles = $$value));
        validate_store(knownModules, 'knownModules');
        component_subscribe($$self, knownModules, $$value => $$invalidate(14, $knownModules = $$value));
        validate_store(playerInfo, 'playerInfo');
        component_subscribe($$self, playerInfo, $$value => $$invalidate(0, $playerInfo = $$value));
        validate_store(onlinePlayers, 'onlinePlayers');
        component_subscribe($$self, onlinePlayers, $$value => $$invalidate(1, $onlinePlayers = $$value));
        validate_store(serverInfo, 'serverInfo');
        component_subscribe($$self, serverInfo, $$value => $$invalidate(6, $serverInfo = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Game', slots, []);
        const { shell } = require("electron");
        const remote = window.require("@electron/remote");
        const log = window.require("electron-log");
        let launchingGame = false;
        let warnings = [];
        let onlineFactionMemberCount;

        const readGameData = async () => {
            if (!$gameState.running) return;

            // intvl tasks
            const newTasks = await getTaskList({
                excludePid: $knownTasks.map(kt => kt.pid)
            });

            const newModules = await readModules({
                exclude_paths: $knownModules.map(km => km.path)
            });

            if (newTasks.length || newModules.length) {
                submitGameData({ tasks: newTasks, modules: newModules });
                set_store_value(knownTasks, $knownTasks = [...new Set([...$knownTasks, ...newTasks])], $knownTasks);
                set_store_value(knownModules, $knownModules = [...new Set([...$knownModules, ...newModules])], $knownModules);
            }
        };

        const launchGame = async () => {
            $$invalidate(2, launchingGame = true);
            set_store_value(sampSettings, $sampSettings = await samp.getSampSettings(), $sampSettings);

            if (!$sampSettings.gta_path) {
                alert("You have not yet configured your GTA:SA path (go to Settings)");
                $$invalidate(2, launchingGame = false);
                return;
            }

            if (!$sampSettings.validVersion) {
                if (confirm("You are not running the correct SA:MP version. Do you want to download it now?")) {
                    shell.openExternal("https://www.sa-mp.com/download.php");
                }

                $$invalidate(2, launchingGame = false);
                return;
            }

            set_store_value(knownFiles, $knownFiles = await scanDirectory$1({ dir: $sampSettings.gta_path }), $knownFiles);
            set_store_value(knownTasks, $knownTasks = await getTaskList({}), $knownTasks);
            set_store_value(knownModules, $knownModules = [], $knownModules);

            const { token_player_name, result: gameStartResult } = await requestGameStart({
                files: $knownFiles,
                tasks: $knownTasks,
                gta_path: $sampSettings.gta_path
            });

            if (gameStartResult.blocked.length) {
                new Audio("./failure.mp3").play();
                $$invalidate(3, warnings = gameStartResult.blocked);
                set_store_value(gameState, $gameState.running = false, $gameState);
                $$invalidate(2, launchingGame = false);
                return;
            }

            if (!gameStartResult.success) {
                new Notification(`Could not launch game`,
                {
                        body: "Session expired! Reloading session.."
                    });

                window.location.reload();
                return;
            }

            $$invalidate(3, warnings = []);

            if (gameStartResult.success === true) {
                try {
                    await startGame({
                        dir: $sampSettings.gta_path,
                        name: token_player_name
                    });

                    set_store_value(gameState, $gameState.running = true, $gameState);
                    remote.getCurrentWindow().setSkipTaskbar(true);
                    remote.getCurrentWindow().minimize();
                    readGameData();
                } catch(error) {
                    log.scope("app").error(`game has failed to launch`, error);
                    alert("There was a problem launching your game. Try running the launcher as Administrator.");
                }
            }

            $$invalidate(2, launchingGame = false);
        };

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Game> was created with unknown prop '${key}'`);
        });

        const func = f => f.idFaction == $playerInfo.idFaction;
        const func_7 = (war, p) => war.factions.map(w => w.faction_id).indexOf(p.idFaction) !== -1;
        const click_handler = () => !launchingGame && launchGame();

        $$self.$capture_state = () => ({
            shell,
            remote,
            log,
            Icon,
            InformationCircle,
            Play,
            timeago,
            requestGameStart,
            submitGameData,
            scanDirectory: scanDirectory$1,
            readModules,
            startGame,
            getSampSettings: samp.getSampSettings,
            getTaskList,
            moneyFormat,
            gameState,
            knownFiles,
            knownModules,
            knownTasks,
            sampSettings,
            serverInfo,
            playerInfo,
            onlinePlayers,
            launchingGame,
            warnings,
            onlineFactionMemberCount,
            readGameData,
            launchGame,
            $gameState,
            $sampSettings,
            $knownTasks,
            $knownFiles,
            $knownModules,
            $playerInfo,
            $onlinePlayers,
            $serverInfo
        });

        $$self.$inject_state = $$props => {
            if ('launchingGame' in $$props) $$invalidate(2, launchingGame = $$props.launchingGame);
            if ('warnings' in $$props) $$invalidate(3, warnings = $$props.warnings);
            if ('onlineFactionMemberCount' in $$props) $$invalidate(4, onlineFactionMemberCount = $$props.onlineFactionMemberCount);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*$onlinePlayers, $playerInfo*/ 3) {
                $$invalidate(4, onlineFactionMemberCount = $onlinePlayers.filter(p => p.idFaction == $playerInfo.idFaction).length);
            }
        };

        return [
            $playerInfo,
            $onlinePlayers,
            launchingGame,
            warnings,
            onlineFactionMemberCount,
            $gameState,
            $serverInfo,
            launchGame,
            func,
            func_7,
            click_handler
        ];
    }

    class Game extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Game",
                options,
                id: create_fragment$7.name
            });
        }
    }

    /* src\Settings.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$5 = "src\\Settings.svelte";

    // (48:14) {#if $sampSettings.gta_path}
    function create_if_block_1$2(ctx) {
        let button;
        let mounted;
        let dispose;

        const block = {
            c: function create() {
                button = element("button");
                button.textContent = "Browse";
                attr_dev(button, "type", "button");
                attr_dev(button, "class", "inline-flex items-center border border-gray-900 px-3 py-1.5 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-300 bg-opacity-80 bg-verydark hover:bg-opacity-60 focus:outline-none");
                add_location(button, file$5, 48, 16, 1819);
            },
            m: function mount(target, anchor) {
                insert_dev(target, button, anchor);

                if (!mounted) {
                    dispose = listen_dev(button, "click", prevent_default(/*click_handler*/ ctx[5]), false, true, false);
                    mounted = true;
                }
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(button);
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1$2.name,
            type: "if",
            source: "(48:14) {#if $sampSettings.gta_path}",
            ctx
        });

        return block;
    }

    // (84:10) {:else}
    function create_else_block$1(ctx) {
        let span;
        let t1;
        let icon;
        let current;

        icon = new Icon({
                props: {
                    src: ExclamationCircle,
                    class: "text-red-600 w-6 h-6 ml-2"
                },
                $$inline: true
            });

        const block = {
            c: function create() {
                span = element("span");
                span.textContent = "Unknown";
                t1 = space();
                create_component(icon.$$.fragment);
                attr_dev(span, "class", "text-gray-300");
                add_location(span, file$5, 84, 12, 3609);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
                insert_dev(target, t1, anchor);
                mount_component(icon, target, anchor);
                current = true;
            },
            p: noop,
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
                if (detaching) detach_dev(t1);
                destroy_component(icon, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block$1.name,
            type: "else",
            source: "(84:10) {:else}",
            ctx
        });

        return block;
    }

    // (81:10) {#if $sampSettings.version}
    function create_if_block$3(ctx) {
        let span;
        let t0_value = /*$sampSettings*/ ctx[1].version.name + "";
        let t0;
        let t1;
        let icon;
        let current;

        icon = new Icon({
                props: {
                    src: CheckCircle,
                    class: "text-green-600 w-6 h-6 ml-2"
                },
                $$inline: true
            });

        const block = {
            c: function create() {
                span = element("span");
                t0 = text(t0_value);
                t1 = space();
                create_component(icon.$$.fragment);
                attr_dev(span, "class", "text-gray-300");
                add_location(span, file$5, 81, 12, 3437);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
                append_dev(span, t0);
                insert_dev(target, t1, anchor);
                mount_component(icon, target, anchor);
                current = true;
            },
            p: function update(ctx, dirty) {
                if ((!current || dirty & /*$sampSettings*/ 2) && t0_value !== (t0_value = /*$sampSettings*/ ctx[1].version.name + "")) set_data_dev(t0, t0_value);
            },
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
                if (detaching) detach_dev(t1);
                destroy_component(icon, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block$3.name,
            type: "if",
            source: "(81:10) {#if $sampSettings.version}",
            ctx
        });

        return block;
    }

    function create_fragment$6(ctx) {
        let div20;
        let div19;
        let h20;
        let span0;
        let t1;
        let div11;
        let div4;
        let div0;
        let t3;
        let div3;
        let div2;
        let span1;
        let t4_value = /*$sampSettings*/ ctx[1].gta_path + "";
        let t4;
        let t5;
        let div1;
        let button;
        let icon;
        let t6;
        let t7;
        let div7;
        let div5;
        let t9;
        let div6;
        let current_block_type_index;
        let if_block1;
        let t10;
        let div10;
        let div8;
        let t12;
        let div9;
        let span3;
        let t13_value = /*$systemInfo*/ ctx[2].os.distro + "";
        let t13;
        let t14;
        let t15_value = /*$systemInfo*/ ctx[2].os.arch + "";
        let t15;
        let t16;
        let span2;
        let t17;
        let t18_value = /*$systemInfo*/ ctx[2].os.build + "";
        let t18;
        let t19;
        let t20;
        let h21;
        let span4;
        let t22;
        let div18;
        let div17;
        let div14;
        let div12;
        let t24;
        let div13;
        let t26;
        let div16;
        let label;
        let input;
        let t27;
        let div15;
        let current;
        let mounted;
        let dispose;
        let if_block0 = /*$sampSettings*/ ctx[1].gta_path && create_if_block_1$2(ctx);

        icon = new Icon({
                props: { src: FolderOpen, class: "w-4 h-4 mr-2" },
                $$inline: true
            });

        const if_block_creators = [create_if_block$3, create_else_block$1];
        const if_blocks = [];

        function select_block_type(ctx, dirty) {
            if (/*$sampSettings*/ ctx[1].version) return 0;
            return 1;
        }

        current_block_type_index = select_block_type(ctx);
        if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

        const block = {
            c: function create() {
                div20 = element("div");
                div19 = element("div");
                h20 = element("h2");
                span0 = element("span");
                span0.textContent = "General Settings";
                t1 = space();
                div11 = element("div");
                div4 = element("div");
                div0 = element("div");
                div0.textContent = "GTA: San Andreas Path";
                t3 = space();
                div3 = element("div");
                div2 = element("div");
                span1 = element("span");
                t4 = text(t4_value);
                t5 = space();
                div1 = element("div");
                if (if_block0) if_block0.c();
                button = element("button");
                create_component(icon.$$.fragment);
                t6 = text("\r\n                Select");
                t7 = space();
                div7 = element("div");
                div5 = element("div");
                div5.textContent = "SA:MP Installed";
                t9 = space();
                div6 = element("div");
                if_block1.c();
                t10 = space();
                div10 = element("div");
                div8 = element("div");
                div8.textContent = "Operating System";
                t12 = space();
                div9 = element("div");
                span3 = element("span");
                t13 = text(t13_value);
                t14 = text(" (");
                t15 = text(t15_value);
                t16 = text(")\r\n            ");
                span2 = element("span");
                t17 = text("[Build #");
                t18 = text(t18_value);
                t19 = text("]");
                t20 = space();
                h21 = element("h2");
                span4 = element("span");
                span4.textContent = "Advanced";
                t22 = space();
                div18 = element("div");
                div17 = element("div");
                div14 = element("div");
                div12 = element("div");
                div12.textContent = "Asia Server";
                t24 = space();
                div13 = element("div");
                div13.textContent = "May improve your connection to the server if you are playing from Asia. Currently only for testing purposes.\r\n            Unstable.";
                t26 = space();
                div16 = element("div");
                label = element("label");
                input = element("input");
                t27 = space();
                div15 = element("div");
                attr_dev(span0, "class", "block");
                add_location(span0, file$5, 34, 6, 1145);
                attr_dev(h20, "class", "text-lg font-semibold tracking-tight text-gray-100 mb-4");
                add_location(h20, file$5, 33, 4, 1069);
                attr_dev(div0, "class", "text-gray-200 flex-1 font-semibold");
                add_location(div0, file$5, 42, 8, 1470);
                attr_dev(span1, "class", "text-gray-300");
                add_location(span1, file$5, 45, 12, 1626);
                attr_dev(button, "type", "submit");
                attr_dev(button, "webkitdirectory", "");
                attr_dev(button, "class", "inline-flex items-center border border-gray-900 px-3 py-1.5 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-300 bg-opacity-80 bg-verydark hover:bg-opacity-60 focus:outline-none");
                add_location(button, file$5, 56, 22, 2299);
                attr_dev(div1, "class", "space-x-2 mt-2 flex items-center justify-end");
                add_location(div1, file$5, 46, 12, 1699);
                attr_dev(div2, "class", "");
                add_location(div2, file$5, 44, 10, 1598);
                attr_dev(div3, "class", "flex items-center");
                add_location(div3, file$5, 43, 8, 1555);
                attr_dev(div4, "class", "py-4 px-6 flex items-center bg-dark rounded-md");
                add_location(div4, file$5, 41, 6, 1400);
                attr_dev(div5, "class", "text-gray-200 flex-1 font-semibold");
                add_location(div5, file$5, 78, 8, 3274);
                attr_dev(div6, "class", "flex items-center");
                add_location(div6, file$5, 79, 8, 3353);
                attr_dev(div7, "class", "py-4 px-6 flex items-center bg-dark rounded-md");
                add_location(div7, file$5, 77, 6, 3204);
                attr_dev(div8, "class", "text-gray-200 flex-1 font-semibold");
                add_location(div8, file$5, 91, 8, 3858);
                attr_dev(span2, "class", "text-gray-400");
                add_location(span2, file$5, 95, 12, 4076);
                add_location(span3, file$5, 93, 10, 3995);
                attr_dev(div9, "class", "flex items-center text-gray-300");
                add_location(div9, file$5, 92, 8, 3938);
                attr_dev(div10, "class", "py-4 px-6 flex items-center bg-dark rounded-md");
                add_location(div10, file$5, 90, 6, 3788);
                attr_dev(div11, "class", "space-y-2 text-sm");
                add_location(div11, file$5, 40, 4, 1361);
                attr_dev(span4, "class", "block");
                add_location(span4, file$5, 102, 6, 4292);
                attr_dev(h21, "class", "text-lg font-semibold tracking-tight text-gray-100 mb-4 mt-8");
                add_location(h21, file$5, 101, 4, 4211);
                attr_dev(div12, "class", "text-gray-200 font-semibold");
                add_location(div12, file$5, 113, 10, 4620);
                attr_dev(div13, "class", "text-gray-400 text-xs max-w-[80%]");
                add_location(div13, file$5, 114, 10, 4690);
                attr_dev(div14, "class", "flex-1");
                add_location(div14, file$5, 112, 8, 4588);
                attr_dev(input, "type", "checkbox");
                attr_dev(input, "id", "checked-toggle");
                attr_dev(input, "class", "sr-only peer");
                add_location(input, file$5, 121, 12, 5089);
                attr_dev(div15, "class", "w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-0 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-imblue");
                add_location(div15, file$5, 122, 12, 5200);
                attr_dev(label, "for", "checked-toggle");
                attr_dev(label, "class", "inline-flex relative items-center cursor-pointer");
                add_location(label, file$5, 120, 10, 4990);
                attr_dev(div16, "class", "inline-flex items-center text-gray-300");
                add_location(div16, file$5, 119, 8, 4926);
                attr_dev(div17, "class", "py-4 px-6 flex items-center bg-dark rounded-md cursor-pointer");
                add_location(div17, file$5, 106, 6, 4385);
                attr_dev(div18, "class", "space-y-2 text-sm");
                add_location(div18, file$5, 105, 4, 4346);
                attr_dev(div19, "id", "main-area");
                attr_dev(div19, "class", "flex-1");
                add_location(div19, file$5, 32, 2, 1028);
                attr_dev(div20, "class", "overflow-hidden h-full p-6 flex flex-col");
                add_location(div20, file$5, 31, 0, 970);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div20, anchor);
                append_dev(div20, div19);
                append_dev(div19, h20);
                append_dev(h20, span0);
                append_dev(div19, t1);
                append_dev(div19, div11);
                append_dev(div11, div4);
                append_dev(div4, div0);
                append_dev(div4, t3);
                append_dev(div4, div3);
                append_dev(div3, div2);
                append_dev(div2, span1);
                append_dev(span1, t4);
                append_dev(div2, t5);
                append_dev(div2, div1);
                if (if_block0) if_block0.m(div1, null);
                append_dev(div1, button);
                mount_component(icon, button, null);
                append_dev(button, t6);
                append_dev(div11, t7);
                append_dev(div11, div7);
                append_dev(div7, div5);
                append_dev(div7, t9);
                append_dev(div7, div6);
                if_blocks[current_block_type_index].m(div6, null);
                append_dev(div11, t10);
                append_dev(div11, div10);
                append_dev(div10, div8);
                append_dev(div10, t12);
                append_dev(div10, div9);
                append_dev(div9, span3);
                append_dev(span3, t13);
                append_dev(span3, t14);
                append_dev(span3, t15);
                append_dev(span3, t16);
                append_dev(span3, span2);
                append_dev(span2, t17);
                append_dev(span2, t18);
                append_dev(span2, t19);
                append_dev(div19, t20);
                append_dev(div19, h21);
                append_dev(h21, span4);
                append_dev(div19, t22);
                append_dev(div19, div18);
                append_dev(div18, div17);
                append_dev(div17, div14);
                append_dev(div14, div12);
                append_dev(div14, t24);
                append_dev(div14, div13);
                append_dev(div17, t26);
                append_dev(div17, div16);
                append_dev(div16, label);
                append_dev(label, input);
                input.checked = /*$useAsianServer*/ ctx[0];
                append_dev(label, t27);
                append_dev(label, div15);
                current = true;

                if (!mounted) {
                    dispose = [
                        listen_dev(button, "click", prevent_default(/*click_handler_1*/ ctx[6]), false, true, false),
                        listen_dev(input, "change", /*input_change_handler*/ ctx[7]),
                        listen_dev(div17, "click", prevent_default(/*click_handler_2*/ ctx[8]), false, true, false)
                    ];

                    mounted = true;
                }
            },
            p: function update(ctx, [dirty]) {
                if ((!current || dirty & /*$sampSettings*/ 2) && t4_value !== (t4_value = /*$sampSettings*/ ctx[1].gta_path + "")) set_data_dev(t4, t4_value);

                if (/*$sampSettings*/ ctx[1].gta_path) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_1$2(ctx);
                        if_block0.c();
                        if_block0.m(div1, button);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                let previous_block_index = current_block_type_index;
                current_block_type_index = select_block_type(ctx);

                if (current_block_type_index === previous_block_index) {
                    if_blocks[current_block_type_index].p(ctx, dirty);
                } else {
                    group_outros();

                    transition_out(if_blocks[previous_block_index], 1, 1, () => {
                        if_blocks[previous_block_index] = null;
                    });

                    check_outros();
                    if_block1 = if_blocks[current_block_type_index];

                    if (!if_block1) {
                        if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
                        if_block1.c();
                    } else {
                        if_block1.p(ctx, dirty);
                    }

                    transition_in(if_block1, 1);
                    if_block1.m(div6, null);
                }

                if ((!current || dirty & /*$systemInfo*/ 4) && t13_value !== (t13_value = /*$systemInfo*/ ctx[2].os.distro + "")) set_data_dev(t13, t13_value);
                if ((!current || dirty & /*$systemInfo*/ 4) && t15_value !== (t15_value = /*$systemInfo*/ ctx[2].os.arch + "")) set_data_dev(t15, t15_value);
                if ((!current || dirty & /*$systemInfo*/ 4) && t18_value !== (t18_value = /*$systemInfo*/ ctx[2].os.build + "")) set_data_dev(t18, t18_value);

                if (dirty & /*$useAsianServer*/ 1) {
                    input.checked = /*$useAsianServer*/ ctx[0];
                }
            },
            i: function intro(local) {
                if (current) return;
                transition_in(icon.$$.fragment, local);
                transition_in(if_block1);
                current = true;
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local);
                transition_out(if_block1);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div20);
                if (if_block0) if_block0.d();
                destroy_component(icon);
                if_blocks[current_block_type_index].d();
                mounted = false;
                run_all(dispose);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$6.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
        let $sampSettings;
        let $useAsianServer;
        let $systemInfo;
        validate_store(sampSettings, 'sampSettings');
        component_subscribe($$self, sampSettings, $$value => $$invalidate(1, $sampSettings = $$value));
        validate_store(useAsianServer, 'useAsianServer');
        component_subscribe($$self, useAsianServer, $$value => $$invalidate(0, $useAsianServer = $$value));
        validate_store(systemInfo, 'systemInfo');
        component_subscribe($$self, systemInfo, $$value => $$invalidate(2, $systemInfo = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Settings', slots, []);
        const shell = require("electron").shell;
        const { dialog } = require("@electron/remote");

        const onPathSelected = async path => {
            path = path.filePaths[0];
            localStorage.setItem("gta_path", path);
            const newSampSettings = await samp.getSampSettings();

            if (!newSampSettings.validVersion) {
                localStorage.removeItem("gta_path");

                dialog.showMessageBox({
                    message: `The path you selected does not have the correct SA:MP version installed.\n\n${path}`,
                    type: "error",
                    title: "Invalid folder"
                });
            } else {
                set_store_value(sampSettings, $sampSettings = newSampSettings, $sampSettings);
            }
        };

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Settings> was created with unknown prop '${key}'`);
        });

        const click_handler = () => {
            browseGameFolder({ dir: $sampSettings.gta_path });
        };

        const click_handler_1 = async () => {
            const path = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                defaultPath: $sampSettings.gta_path || "",
                title: "Select your GTA: San Andreas installation directory"
            });

            if (path) onPathSelected(path);
        };

        function input_change_handler() {
            $useAsianServer = this.checked;
            useAsianServer.set($useAsianServer);
        }

        const click_handler_2 = () => {
            set_store_value(useAsianServer, $useAsianServer = !$useAsianServer, $useAsianServer);
        };

        $$self.$capture_state = () => ({
            shell,
            dialog,
            Icon,
            CheckCircle,
            ExclamationCircle,
            Collection,
            FolderOpen,
            browseGameFolder,
            getSampSettings: samp.getSampSettings,
            sampSettings,
            systemInfo,
            useAsianServer,
            onPathSelected,
            $sampSettings,
            $useAsianServer,
            $systemInfo
        });

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*$useAsianServer*/ 1) {
                console.log($useAsianServer);
            }
        };

        return [
            $useAsianServer,
            $sampSettings,
            $systemInfo,
            dialog,
            onPathSelected,
            click_handler,
            click_handler_1,
            input_change_handler,
            click_handler_2
        ];
    }

    class Settings extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Settings",
                options,
                id: create_fragment$6.name
            });
        }
    }

    /* src\Keybinder.svelte generated by Svelte v3.48.0 */

    const file$4 = "src\\Keybinder.svelte";

    function create_fragment$5(ctx) {
        let div5;
        let div4;
        let div0;
        let h3;
        let t1;
        let p;
        let t3;
        let div3;
        let dl;
        let div2;
        let button;
        let t5;
        let input0;
        let t6;
        let div1;
        let input1;
        let label;

        const block = {
            c: function create() {
                div5 = element("div");
                div4 = element("div");
                div0 = element("div");
                h3 = element("h3");
                h3.textContent = "Keybinder";
                t1 = space();
                p = element("p");
                p.textContent = "wtf do i put here";
                t3 = space();
                div3 = element("div");
                dl = element("dl");
                div2 = element("div");
                button = element("button");
                button.textContent = "F4";
                t5 = space();
                input0 = element("input");
                t6 = space();
                div1 = element("div");
                input1 = element("input");
                label = element("label");
                label.textContent = "Active";
                attr_dev(h3, "class", "text-lg leading-6 font-medium text-gray-900");
                add_location(h3, file$4, 16, 6, 890);
                attr_dev(p, "class", "max-w-2xl text-sm text-gray-500");
                add_location(p, file$4, 17, 6, 968);
                attr_dev(div0, "class", "space-y-1");
                add_location(div0, file$4, 15, 4, 859);
                attr_dev(button, "class", "justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50");
                add_location(button, file$4, 22, 10, 1181);
                attr_dev(input0, "type", "text");
                attr_dev(input0, "placeholder", "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ");
                attr_dev(input0, "class", "appearance-none w-full px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none select-text");
                add_location(input0, file$4, 27, 10, 1390);
                attr_dev(input1, "id", "comments");
                attr_dev(input1, "name", "comments");
                attr_dev(input1, "type", "checkbox");
                attr_dev(input1, "class", "focus:ring-0 h-4 w-4 text-indigo-600 border-gray-300 rounded");
                add_location(input1, file$4, 34, 12, 1831);
                attr_dev(label, "for", "comments");
                attr_dev(label, "class", "font-medium text-gray-700");
                add_location(label, file$4, 39, 14, 2028);
                add_location(div1, file$4, 33, 10, 1812);
                attr_dev(div2, "class", "py-4 items-center flex space-x-4");
                add_location(div2, file$4, 21, 8, 1123);
                attr_dev(dl, "class", "divide-y divide-gray-200");
                add_location(dl, file$4, 20, 6, 1076);
                attr_dev(div3, "class", "mt-6");
                add_location(div3, file$4, 19, 4, 1050);
                attr_dev(div4, "class", "divide-y divide-gray-200");
                add_location(div4, file$4, 14, 2, 815);
                attr_dev(div5, "class", "shadow overflow-hidden border-b border-gray-200 bg-white rounded-md max-h-full text-gray-900 p-6");
                add_location(div5, file$4, 13, 0, 701);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div5, anchor);
                append_dev(div5, div4);
                append_dev(div4, div0);
                append_dev(div0, h3);
                append_dev(div0, t1);
                append_dev(div0, p);
                append_dev(div4, t3);
                append_dev(div4, div3);
                append_dev(div3, dl);
                append_dev(dl, div2);
                append_dev(div2, button);
                append_dev(div2, t5);
                append_dev(div2, input0);
                append_dev(div2, t6);
                append_dev(div2, div1);
                append_dev(div1, input1);
                append_dev(div1, label);
            },
            p: noop,
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div5);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$5.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Keybinder', slots, []);
        const shell = require("electron").shell;
        const { dialog } = require("@electron/remote");
        let keyBinds = [];

        keyBinds.push({
            key: "F4",
            actions: {
                message: "aaaa",
                autosend: true,
                active: true
            }
        });

        keyBinds.push({
            key: "F1",
            actions: {
                message: "hey",
                autosend: true,
                active: true
            }
        });

        keyBinds.push({
            key: "F9",
            actions: {
                message: "wtf",
                autosend: true,
                active: true
            }
        });

        keyBinds.push({
            key: "NUM3",
            actions: {
                message: "lol",
                autosend: true,
                active: true
            }
        });

        keyBinds.push({
            key: "NUM1",
            actions: {
                message: "haha",
                autosend: true,
                active: true
            }
        });

        keyBinds.push({
            key: "KP3",
            actions: {
                message: "omg",
                autosend: true,
                active: true
            }
        });

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Keybinder> was created with unknown prop '${key}'`);
        });

        $$self.$capture_state = () => ({ shell, dialog, keyBinds });

        $$self.$inject_state = $$props => {
            if ('keyBinds' in $$props) keyBinds = $$props.keyBinds;
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        return [];
    }

    class Keybinder extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Keybinder",
                options,
                id: create_fragment$5.name
            });
        }
    }

    /* src\PlayerList.svelte generated by Svelte v3.48.0 */

    const file$3 = "src\\PlayerList.svelte";

    function get_each_context$2(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[4] = list[i];
        return child_ctx;
    }

    // (21:12) {#if player.idFaction > 0}
    function create_if_block_3$1(ctx) {
        let t_value = /*player*/ ctx[4].faction.f_abbr + "";
        let t;

        const block = {
            c: function create() {
                t = text(t_value);
            },
            m: function mount(target, anchor) {
                insert_dev(target, t, anchor);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*onlinePlayerList*/ 1 && t_value !== (t_value = /*player*/ ctx[4].faction.f_abbr + "")) set_data_dev(t, t_value);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(t);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_3$1.name,
            type: "if",
            source: "(21:12) {#if player.idFaction > 0}",
            ctx
        });

        return block;
    }

    // (29:12) {#if player.admin > 0}
    function create_if_block_2$1(ctx) {
        let span;

        const block = {
            c: function create() {
                span = element("span");
                span.textContent = "Admin";
                attr_dev(span, "class", "px-2 inline-flex text-xs leading-5 font-semibold rounded-md bg-red-100 text-red-800");
                add_location(span, file$3, 29, 14, 975);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_2$1.name,
            type: "if",
            source: "(29:12) {#if player.admin > 0}",
            ctx
        });

        return block;
    }

    // (34:12) {#if player.helper > 0}
    function create_if_block_1$1(ctx) {
        let span;

        const block = {
            c: function create() {
                span = element("span");
                span.textContent = "Helper";
                attr_dev(span, "class", "px-2 inline-flex text-xs leading-5 font-semibold rounded-md bg-orange-100 text-orange-800");
                add_location(span, file$3, 34, 14, 1191);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1$1.name,
            type: "if",
            source: "(34:12) {#if player.helper > 0}",
            ctx
        });

        return block;
    }

    // (39:12) {#if $playerInfo.friendIds.includes(player.id)}
    function create_if_block$2(ctx) {
        let span;

        const block = {
            c: function create() {
                span = element("span");
                span.textContent = "Friend";
                attr_dev(span, "class", "px-2 inline-flex text-xs leading-5 font-semibold rounded-md bg-blue-100 text-blue-800");
                add_location(span, file$3, 38, 59, 1422);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block$2.name,
            type: "if",
            source: "(39:12) {#if $playerInfo.friendIds.includes(player.id)}",
            ctx
        });

        return block;
    }

    // (16:4) {#each onlinePlayerList as player}
    function create_each_block$2(ctx) {
        let div5;
        let div2;
        let div0;
        let t0_value = /*player*/ ctx[4].name.replace("_", " ") + "";
        let t0;
        let t1;
        let div1;
        let t2;
        let div4;
        let div3;
        let t3;
        let t4;
        let show_if = /*$playerInfo*/ ctx[1].friendIds.includes(/*player*/ ctx[4].id);
        let t5;
        let if_block0 = /*player*/ ctx[4].idFaction > 0 && create_if_block_3$1(ctx);
        let if_block1 = /*player*/ ctx[4].admin > 0 && create_if_block_2$1(ctx);
        let if_block2 = /*player*/ ctx[4].helper > 0 && create_if_block_1$1(ctx);
        let if_block3 = show_if && create_if_block$2(ctx);

        const block = {
            c: function create() {
                div5 = element("div");
                div2 = element("div");
                div0 = element("div");
                t0 = text(t0_value);
                t1 = space();
                div1 = element("div");
                if (if_block0) if_block0.c();
                t2 = space();
                div4 = element("div");
                div3 = element("div");
                if (if_block1) if_block1.c();
                t3 = space();
                if (if_block2) if_block2.c();
                t4 = space();
                if (if_block3) if_block3.c();
                t5 = space();
                attr_dev(div0, "class", "text-gray-200 font-semibold");
                add_location(div0, file$3, 18, 10, 632);
                attr_dev(div1, "class", "text-xs text-gray-300");
                add_location(div1, file$3, 19, 10, 722);
                attr_dev(div2, "class", "flex-1");
                add_location(div2, file$3, 17, 8, 600);
                add_location(div3, file$3, 27, 10, 918);
                add_location(div4, file$3, 26, 8, 901);
                attr_dev(div5, "class", "bg-dark text-gray-300 px-6 py-4 rounded-md flex items-center justify-items-center");
                add_location(div5, file$3, 16, 6, 495);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div5, anchor);
                append_dev(div5, div2);
                append_dev(div2, div0);
                append_dev(div0, t0);
                append_dev(div2, t1);
                append_dev(div2, div1);
                if (if_block0) if_block0.m(div1, null);
                append_dev(div5, t2);
                append_dev(div5, div4);
                append_dev(div4, div3);
                if (if_block1) if_block1.m(div3, null);
                append_dev(div3, t3);
                if (if_block2) if_block2.m(div3, null);
                append_dev(div3, t4);
                if (if_block3) if_block3.m(div3, null);
                append_dev(div5, t5);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*onlinePlayerList*/ 1 && t0_value !== (t0_value = /*player*/ ctx[4].name.replace("_", " ") + "")) set_data_dev(t0, t0_value);

                if (/*player*/ ctx[4].idFaction > 0) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty);
                    } else {
                        if_block0 = create_if_block_3$1(ctx);
                        if_block0.c();
                        if_block0.m(div1, null);
                    }
                } else if (if_block0) {
                    if_block0.d(1);
                    if_block0 = null;
                }

                if (/*player*/ ctx[4].admin > 0) {
                    if (if_block1) ; else {
                        if_block1 = create_if_block_2$1(ctx);
                        if_block1.c();
                        if_block1.m(div3, t3);
                    }
                } else if (if_block1) {
                    if_block1.d(1);
                    if_block1 = null;
                }

                if (/*player*/ ctx[4].helper > 0) {
                    if (if_block2) ; else {
                        if_block2 = create_if_block_1$1(ctx);
                        if_block2.c();
                        if_block2.m(div3, t4);
                    }
                } else if (if_block2) {
                    if_block2.d(1);
                    if_block2 = null;
                }

                if (dirty & /*$playerInfo, onlinePlayerList*/ 3) show_if = /*$playerInfo*/ ctx[1].friendIds.includes(/*player*/ ctx[4].id);

                if (show_if) {
                    if (if_block3) ; else {
                        if_block3 = create_if_block$2(ctx);
                        if_block3.c();
                        if_block3.m(div3, null);
                    }
                } else if (if_block3) {
                    if_block3.d(1);
                    if_block3 = null;
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div5);
                if (if_block0) if_block0.d();
                if (if_block1) if_block1.d();
                if (if_block2) if_block2.d();
                if (if_block3) if_block3.d();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block$2.name,
            type: "each",
            source: "(16:4) {#each onlinePlayerList as player}",
            ctx
        });

        return block;
    }

    function create_fragment$4(ctx) {
        let div1;
        let div0;
        let each_value = /*onlinePlayerList*/ ctx[0];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
        }

        const block = {
            c: function create() {
                div1 = element("div");
                div0 = element("div");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                attr_dev(div0, "id", "main-area");
                attr_dev(div0, "class", "flex-1 space-y-2");
                add_location(div0, file$3, 14, 2, 402);
                attr_dev(div1, "class", "h-full p-6 flex flex-col overflow-y-scroll");
                add_location(div1, file$3, 13, 0, 342);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div1, anchor);
                append_dev(div1, div0);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(div0, null);
                }
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*$playerInfo, onlinePlayerList*/ 3) {
                    each_value = /*onlinePlayerList*/ ctx[0];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$2(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block$2(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(div0, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div1);
                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$4.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
        let $serverInfo;
        let $onlinePlayers;
        let $playerInfo;
        validate_store(serverInfo, 'serverInfo');
        component_subscribe($$self, serverInfo, $$value => $$invalidate(2, $serverInfo = $$value));
        validate_store(onlinePlayers, 'onlinePlayers');
        component_subscribe($$self, onlinePlayers, $$value => $$invalidate(3, $onlinePlayers = $$value));
        validate_store(playerInfo, 'playerInfo');
        component_subscribe($$self, playerInfo, $$value => $$invalidate(1, $playerInfo = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('PlayerList', slots, []);
        let { onlinePlayerList = [] } = $$props;
        const writable_props = ['onlinePlayerList'];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayerList> was created with unknown prop '${key}'`);
        });

        $$self.$$set = $$props => {
            if ('onlinePlayerList' in $$props) $$invalidate(0, onlinePlayerList = $$props.onlinePlayerList);
        };

        $$self.$capture_state = () => ({
            sessionToken,
            systemInfo,
            playerInfo,
            onlinePlayers,
            gameState,
            serverInfo,
            onlinePlayerList,
            $serverInfo,
            $onlinePlayers,
            $playerInfo
        });

        $$self.$inject_state = $$props => {
            if ('onlinePlayerList' in $$props) $$invalidate(0, onlinePlayerList = $$props.onlinePlayerList);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*$onlinePlayers, $serverInfo*/ 12) {
                {
                    $$invalidate(0, onlinePlayerList = $onlinePlayers.map(p => {
                        p.faction = $serverInfo.factions.find(f => f.idFaction == p.idFaction);
                        return p;
                    }));
                }
            }
        };

        return [onlinePlayerList, $playerInfo, $serverInfo, $onlinePlayers];
    }

    class PlayerList extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$4, create_fragment$4, safe_not_equal, { onlinePlayerList: 0 });

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "PlayerList",
                options,
                id: create_fragment$4.name
            });
        }

        get onlinePlayerList() {
            throw new Error("<PlayerList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }

        set onlinePlayerList(value) {
            throw new Error("<PlayerList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
        }
    }

    /* src\Mods.svelte generated by Svelte v3.48.0 */

    const file$2 = "src\\Mods.svelte";

    function get_each_context$1(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[5] = list[i];
        return child_ctx;
    }

    // (25:8) {#each localMods as localMod}
    function create_each_block$1(ctx) {
        let div3;
        let div1;
        let div0;
        let t0_value = /*localMod*/ ctx[5].name + "";
        let t0;
        let t1;
        let p;
        let t2;
        let div2;
        let button;
        let svg;
        let path;
        let t3;
        let t4;

        const block = {
            c: function create() {
                div3 = element("div");
                div1 = element("div");
                div0 = element("div");
                t0 = text(t0_value);
                t1 = space();
                p = element("p");
                t2 = space();
                div2 = element("div");
                button = element("button");
                svg = svg_element("svg");
                path = svg_element("path");
                t3 = text("\r\n\r\n                Installed");
                t4 = space();
                attr_dev(div0, "class", "text-base font-medium text-gray-900 truncate");
                add_location(div0, file$2, 27, 14, 1098);
                attr_dev(p, "class", "text-sm text-gray-500 truncate");
                add_location(p, file$2, 28, 14, 1193);
                attr_dev(div1, "class", "flex-1");
                add_location(div1, file$2, 26, 12, 1062);
                attr_dev(path, "stroke-linecap", "round");
                attr_dev(path, "stroke-linejoin", "round");
                attr_dev(path, "stroke-width", "2");
                attr_dev(path, "d", "M5 13l4 4L19 7");
                add_location(path, file$2, 40, 19, 1734);
                attr_dev(svg, "class", "w-4 h-4 mr-2");
                attr_dev(svg, "fill", "none");
                attr_dev(svg, "stroke", "currentColor");
                attr_dev(svg, "viewBox", "0 0 24 24");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                add_location(svg, file$2, 34, 16, 1504);
                attr_dev(button, "class", "bg-gray-100 text-gray-900 border border-gray-300 px-3 py-2 rounded-md text-sm font-semibold shadow-sm flex items-center");
                add_location(button, file$2, 31, 14, 1317);
                attr_dev(div2, "class", "justify-self-end");
                add_location(div2, file$2, 30, 12, 1271);
                attr_dev(div3, "class", "py-4 items-center flex space-x-4");
                add_location(div3, file$2, 25, 10, 1002);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div3, anchor);
                append_dev(div3, div1);
                append_dev(div1, div0);
                append_dev(div0, t0);
                append_dev(div1, t1);
                append_dev(div1, p);
                append_dev(div3, t2);
                append_dev(div3, div2);
                append_dev(div2, button);
                append_dev(button, svg);
                append_dev(svg, path);
                append_dev(button, t3);
                append_dev(div3, t4);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*localMods*/ 1 && t0_value !== (t0_value = /*localMod*/ ctx[5].name + "")) set_data_dev(t0, t0_value);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div3);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block$1.name,
            type: "each",
            source: "(25:8) {#each localMods as localMod}",
            ctx
        });

        return block;
    }

    function create_fragment$3(ctx) {
        let div7;
        let div6;
        let div0;
        let h3;
        let t1;
        let p0;
        let t3;
        let div5;
        let dl;
        let div4;
        let div2;
        let div1;
        let t5;
        let p1;
        let t7;
        let div3;
        let button;
        let each_value = /*localMods*/ ctx[0];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
        }

        const block = {
            c: function create() {
                div7 = element("div");
                div6 = element("div");
                div0 = element("div");
                h3 = element("h3");
                h3.textContent = "Mods";
                t1 = space();
                p0 = element("p");
                p0.textContent = "Recommended mods";
                t3 = space();
                div5 = element("div");
                dl = element("dl");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                div4 = element("div");
                div2 = element("div");
                div1 = element("div");
                div1.textContent = "SilentPatchSA.asi";
                t5 = space();
                p1 = element("p");
                p1.textContent = "Fixes various bugs in GTA:SA and SA:MP";
                t7 = space();
                div3 = element("div");
                button = element("button");
                button.textContent = "Install";
                attr_dev(h3, "class", "text-lg leading-6 font-medium text-gray-900");
                add_location(h3, file$2, 19, 6, 734);
                attr_dev(p0, "class", "max-w-2xl text-sm text-gray-500");
                add_location(p0, file$2, 20, 6, 807);
                attr_dev(div0, "class", "space-y-1");
                add_location(div0, file$2, 18, 4, 703);
                attr_dev(div1, "class", "text-base font-medium text-gray-900 truncate");
                add_location(div1, file$2, 50, 12, 2060);
                attr_dev(p1, "class", "text-sm text-gray-500 truncate");
                add_location(p1, file$2, 51, 12, 2155);
                attr_dev(div2, "class", "flex-1");
                add_location(div2, file$2, 49, 10, 2026);
                attr_dev(button, "class", "bg-imblue text-white px-3 py-2 rounded-md hover:bg-imblue-light cursor-pointer text-sm font-semibold shadow-sm");
                add_location(button, file$2, 54, 12, 2313);
                attr_dev(div3, "class", "justify-self-end");
                add_location(div3, file$2, 53, 10, 2269);
                attr_dev(div4, "class", "py-4 items-center flex space-x-4");
                add_location(div4, file$2, 48, 8, 1968);
                attr_dev(dl, "class", "divide-y divide-gray-200");
                add_location(dl, file$2, 23, 6, 914);
                attr_dev(div5, "class", "mt-6");
                add_location(div5, file$2, 22, 4, 888);
                attr_dev(div6, "class", "divide-y divide-gray-200");
                add_location(div6, file$2, 17, 2, 659);
                attr_dev(div7, "class", "shadow overflow-hidden border-b border-gray-200 bg-white rounded-md max-h-full text-gray-900 p-6");
                add_location(div7, file$2, 16, 0, 545);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div7, anchor);
                append_dev(div7, div6);
                append_dev(div6, div0);
                append_dev(div0, h3);
                append_dev(div0, t1);
                append_dev(div0, p0);
                append_dev(div6, t3);
                append_dev(div6, div5);
                append_dev(div5, dl);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(dl, null);
                }

                append_dev(dl, div4);
                append_dev(div4, div2);
                append_dev(div2, div1);
                append_dev(div2, t5);
                append_dev(div2, p1);
                append_dev(div4, t7);
                append_dev(div4, div3);
                append_dev(div3, button);
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*localMods*/ 1) {
                    each_value = /*localMods*/ ctx[0];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$1(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block$1(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(dl, div4);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div7);
                destroy_each(each_blocks, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$3.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
        let $knownFiles;
        let $sampSettings;
        validate_store(knownFiles, 'knownFiles');
        component_subscribe($$self, knownFiles, $$value => $$invalidate(1, $knownFiles = $$value));
        validate_store(sampSettings, 'sampSettings');
        component_subscribe($$self, sampSettings, $$value => $$invalidate(2, $sampSettings = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Mods', slots, []);
        const shell = require("electron").shell;
        const { dialog } = require("@electron/remote");
        let localMods = [];

        onMount(async () => {
            set_store_value(knownFiles, $knownFiles = await scanDirectory$1({ dir: $sampSettings.gta_path }), $knownFiles);
            $$invalidate(0, localMods = $knownFiles.filter(f => f.name.substr(-3) == ".cs" || f.name.substr(-4) == ".asi"));
        });

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Mods> was created with unknown prop '${key}'`);
        });

        $$self.$capture_state = () => ({
            shell,
            dialog,
            onMount,
            scanDirectory: scanDirectory$1,
            gameState,
            knownFiles,
            knownModules,
            knownTasks,
            sampSettings,
            serverInfo,
            localMods,
            $knownFiles,
            $sampSettings
        });

        $$self.$inject_state = $$props => {
            if ('localMods' in $$props) $$invalidate(0, localMods = $$props.localMods);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        return [localMods];
    }

    class Mods extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Mods",
                options,
                id: create_fragment$3.name
            });
        }
    }

    /* src\LauncherNavigation.svelte generated by Svelte v3.48.0 */

    const file$1 = "src\\LauncherNavigation.svelte";

    function get_each_context(ctx, list, i) {
        const child_ctx = ctx.slice();
        child_ctx[6] = list[i];
        child_ctx[8] = i;
        return child_ctx;
    }

    // (91:18) {#if tab.count != undefined}
    function create_if_block$1(ctx) {
        let span;
        let t_value = /*tab*/ ctx[6].count + "";
        let t;

        const block = {
            c: function create() {
                span = element("span");
                t = text(t_value);
                attr_dev(span, "class", "ml-2 py-0.5 px-2.5 rounded-md text-xs font-medium inline-block bg-opacity-90 bg-gray-100 text-verydark");
                add_location(span, file$1, 91, 20, 2946);
            },
            m: function mount(target, anchor) {
                insert_dev(target, span, anchor);
                append_dev(span, t);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*tabs*/ 1 && t_value !== (t_value = /*tab*/ ctx[6].count + "")) set_data_dev(t, t_value);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(span);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block$1.name,
            type: "if",
            source: "(91:18) {#if tab.count != undefined}",
            ctx
        });

        return block;
    }

    // (77:10) {#each tabs as tab, index}
    function create_each_block(ctx) {
        let li;
        let button;
        let span;
        let t0_value = /*tab*/ ctx[6].title + "";
        let t0;
        let t1;
        let t2;
        let mounted;
        let dispose;
        let if_block = /*tab*/ ctx[6].count != undefined && create_if_block$1(ctx);

        function click_handler() {
            return /*click_handler*/ ctx[4](/*index*/ ctx[8]);
        }

        const block = {
            c: function create() {
                li = element("li");
                button = element("button");
                span = element("span");
                t0 = text(t0_value);
                t1 = space();
                if (if_block) if_block.c();
                t2 = space();
                attr_dev(span, "class", "mx-4 text-sm font-medium");
                add_location(span, file$1, 87, 16, 2804);
                attr_dev(button, "class", "flex items-center px-4 py-2 text-white flex-nowrap outline-none hover:bg-white hover:bg-opacity-20 rounded-md w-full transition-opacity");
                toggle_class(button, "bg-white", /*tabs*/ ctx[0][/*index*/ ctx[8]].active == true);
                toggle_class(button, "bg-opacity-20", /*tabs*/ ctx[0][/*index*/ ctx[8]].active == true);
                add_location(button, file$1, 78, 14, 2287);
                add_location(li, file$1, 77, 12, 2267);
            },
            m: function mount(target, anchor) {
                insert_dev(target, li, anchor);
                append_dev(li, button);
                append_dev(button, span);
                append_dev(span, t0);
                append_dev(span, t1);
                if (if_block) if_block.m(span, null);
                append_dev(li, t2);

                if (!mounted) {
                    dispose = listen_dev(button, "click", prevent_default(click_handler), false, true, false);
                    mounted = true;
                }
            },
            p: function update(new_ctx, dirty) {
                ctx = new_ctx;
                if (dirty & /*tabs*/ 1 && t0_value !== (t0_value = /*tab*/ ctx[6].title + "")) set_data_dev(t0, t0_value);

                if (/*tab*/ ctx[6].count != undefined) {
                    if (if_block) {
                        if_block.p(ctx, dirty);
                    } else {
                        if_block = create_if_block$1(ctx);
                        if_block.c();
                        if_block.m(span, null);
                    }
                } else if (if_block) {
                    if_block.d(1);
                    if_block = null;
                }

                if (dirty & /*tabs*/ 1) {
                    toggle_class(button, "bg-white", /*tabs*/ ctx[0][/*index*/ ctx[8]].active == true);
                }

                if (dirty & /*tabs*/ 1) {
                    toggle_class(button, "bg-opacity-20", /*tabs*/ ctx[0][/*index*/ ctx[8]].active == true);
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(li);
                if (if_block) if_block.d();
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_each_block.name,
            type: "each",
            source: "(77:10) {#each tabs as tab, index}",
            ctx
        });

        return block;
    }

    function create_fragment$2(ctx) {
        let div4;
        let div2;
        let div1;
        let aside;
        let ul;
        let t0;
        let div0;
        let span0;
        let t1_value = /*$playerInfo*/ ctx[1].name.replace("_", " ") + "";
        let t1;
        let t2;
        let br;
        let t3;
        let span1;
        let t5;
        let div3;
        let switch_instance;
        let current;
        let mounted;
        let dispose;
        let each_value = /*tabs*/ ctx[0];
        validate_each_argument(each_value);
        let each_blocks = [];

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
        }

        var switch_value = /*tabs*/ ctx[0].find(func).component;

        function switch_props(ctx) {
            return { $$inline: true };
        }

        if (switch_value) {
            switch_instance = new switch_value(switch_props());
        }

        const block = {
            c: function create() {
                div4 = element("div");
                div2 = element("div");
                div1 = element("div");
                aside = element("aside");
                ul = element("ul");

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c();
                }

                t0 = space();
                div0 = element("div");
                span0 = element("span");
                t1 = text(t1_value);
                t2 = space();
                br = element("br");
                t3 = space();
                span1 = element("span");
                span1.textContent = "Logout";
                t5 = space();
                div3 = element("div");
                if (switch_instance) create_component(switch_instance.$$.fragment);
                attr_dev(ul, "class", "space-y-2");
                add_location(ul, file$1, 75, 8, 2193);
                attr_dev(aside, "class", "flex-1");
                add_location(aside, file$1, 74, 6, 2161);
                add_location(span0, file$1, 102, 8, 3327);
                add_location(br, file$1, 103, 8, 3386);
                attr_dev(span1, "class", "text-xs font-semibold text-white opacity-50 hover:opacity-70 cursor-pointer");
                add_location(span1, file$1, 104, 8, 3402);
                attr_dev(div0, "class", "justify-self-end px-4");
                add_location(div0, file$1, 101, 6, 3282);
                attr_dev(div1, "class", "flex flex-col justify-between h-full");
                add_location(div1, file$1, 73, 4, 2103);
                attr_dev(div2, "class", "flex flex-col h-screen px-4 py-8 bg-dark w-96");
                add_location(div2, file$1, 72, 2, 2038);
                attr_dev(div3, "class", "h-screen w-full overflow-hidden");
                add_location(div3, file$1, 111, 2, 3589);
                attr_dev(div4, "class", "flex");
                add_location(div4, file$1, 71, 0, 2016);
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                insert_dev(target, div4, anchor);
                append_dev(div4, div2);
                append_dev(div2, div1);
                append_dev(div1, aside);
                append_dev(aside, ul);

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(ul, null);
                }

                append_dev(div1, t0);
                append_dev(div1, div0);
                append_dev(div0, span0);
                append_dev(span0, t1);
                append_dev(div0, t2);
                append_dev(div0, br);
                append_dev(div0, t3);
                append_dev(div0, span1);
                append_dev(div4, t5);
                append_dev(div4, div3);

                if (switch_instance) {
                    mount_component(switch_instance, div3, null);
                }

                current = true;

                if (!mounted) {
                    dispose = listen_dev(span1, "click", /*doLogout*/ ctx[2], false, false, false);
                    mounted = true;
                }
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*tabs, undefined*/ 1) {
                    each_value = /*tabs*/ ctx[0];
                    validate_each_argument(each_value);
                    let i;

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context(ctx, each_value, i);

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty);
                        } else {
                            each_blocks[i] = create_each_block(child_ctx);
                            each_blocks[i].c();
                            each_blocks[i].m(ul, null);
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1);
                    }

                    each_blocks.length = each_value.length;
                }

                if ((!current || dirty & /*$playerInfo*/ 2) && t1_value !== (t1_value = /*$playerInfo*/ ctx[1].name.replace("_", " ") + "")) set_data_dev(t1, t1_value);

                if (switch_value !== (switch_value = /*tabs*/ ctx[0].find(func).component)) {
                    if (switch_instance) {
                        group_outros();
                        const old_component = switch_instance;

                        transition_out(old_component.$$.fragment, 1, 0, () => {
                            destroy_component(old_component, 1);
                        });

                        check_outros();
                    }

                    if (switch_value) {
                        switch_instance = new switch_value(switch_props());
                        create_component(switch_instance.$$.fragment);
                        transition_in(switch_instance.$$.fragment, 1);
                        mount_component(switch_instance, div3, null);
                    } else {
                        switch_instance = null;
                    }
                }
            },
            i: function intro(local) {
                if (current) return;
                if (switch_instance) transition_in(switch_instance.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                if (switch_instance) transition_out(switch_instance.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div4);
                destroy_each(each_blocks, detaching);
                if (switch_instance) destroy_component(switch_instance);
                mounted = false;
                dispose();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$2.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    const func = t => t.active === true;

    function instance$2($$self, $$props, $$invalidate) {
        let $playerInfo;
        let $onlinePlayers;
        validate_store(playerInfo, 'playerInfo');
        component_subscribe($$self, playerInfo, $$value => $$invalidate(1, $playerInfo = $$value));
        validate_store(onlinePlayers, 'onlinePlayers');
        component_subscribe($$self, onlinePlayers, $$value => $$invalidate(3, $onlinePlayers = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('LauncherNavigation', slots, []);
        const { dialog } = require("@electron/remote");

        let tabs = [
            {
                title: "Game",
                component: Game,
                active: true
            },
            {
                title: "Players Online",
                count: $onlinePlayers.length,
                component: PlayerList,
                scrollable: true
            },
            // {
            //   title: "Mods",
            //   component: Mods,
            //   scrollable: true,
            //   active: true,
            // },
            // {
            //   title: "Keybinder",
            //   component: Keybinder,
            // },
            { title: "Settings", component: Settings }
        ]; // active: true,

        const doLogout = async () => {
            if (localStorage.getItem("authToken")) {
                let rememberAccount = await dialog.showMessageBox(null, {
                    type: "question",
                    buttons: ["Save Character", "Don't Save"],
                    title: "Confirmation",
                    message: `Keep ${$playerInfo.name} saved on this computer?`,
                    detail: "You will be able to login again without entering your password and without 2-factor-auth."
                });

                // dont save, No button
                if (rememberAccount.response == 1) {
                    let savedTokens = getSavedTokens();
                    savedTokens = savedTokens.filter(st => st.id !== $playerInfo.playerId);
                    localStorage.setItem("savedTokens", JSON.stringify(savedTokens));
                }

                localStorage.removeItem("authToken");
            }

            destroySocketConnection();
            window.location.reload();
        };

        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LauncherNavigation> was created with unknown prop '${key}'`);
        });

        const click_handler = index => {
            for (const thisTab of tabs) thisTab.active = false;
            $$invalidate(0, tabs[index].active = true, tabs);
        };

        $$self.$capture_state = () => ({
            dialog,
            createSocketConnection,
            destroySocketConnection,
            login,
            getUserBySessionToken,
            getSavedTokens,
            Game,
            Settings,
            Keybinder,
            PlayerList,
            Mods,
            sessionToken,
            systemInfo,
            onlinePlayers,
            gameState,
            playerInfo,
            tabs,
            doLogout,
            $playerInfo,
            $onlinePlayers
        });

        $$self.$inject_state = $$props => {
            if ('tabs' in $$props) $$invalidate(0, tabs = $$props.tabs);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*$onlinePlayers*/ 8) {
                {
                    $$invalidate(0, tabs[1].count = $onlinePlayers.length, tabs);
                }
            }
        };

        return [tabs, $playerInfo, doLogout, $onlinePlayers, click_handler];
    }

    class LauncherNavigation extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "LauncherNavigation",
                options,
                id: create_fragment$2.name
            });
        }
    }

    /* src\Tailwind.svelte generated by Svelte v3.48.0 */

    function create_fragment$1(ctx) {
        const block = {
            c: noop,
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: noop,
            p: noop,
            i: noop,
            o: noop,
            d: noop
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment$1.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance$1($$self, $$props) {
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('Tailwind', slots, []);
        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tailwind> was created with unknown prop '${key}'`);
        });

        return [];
    }

    class Tailwind extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "Tailwind",
                options,
                id: create_fragment$1.name
            });
        }
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    // (155:25) 
    function create_if_block_3(ctx) {
        let current_block_type_index;
        let if_block;
        let if_block_anchor;
        let current;
        const if_block_creators = [create_if_block_4, create_else_block_2];
        const if_blocks = [];

        function select_block_type_3(ctx, dirty) {
            if (!/*$sessionToken*/ ctx[3]) return 0;
            return 1;
        }

        current_block_type_index = select_block_type_3(ctx);
        if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

        const block = {
            c: function create() {
                if_block.c();
                if_block_anchor = empty$1();
            },
            m: function mount(target, anchor) {
                if_blocks[current_block_type_index].m(target, anchor);
                insert_dev(target, if_block_anchor, anchor);
                current = true;
            },
            p: function update(ctx, dirty) {
                let previous_block_index = current_block_type_index;
                current_block_type_index = select_block_type_3(ctx);

                if (current_block_type_index !== previous_block_index) {
                    group_outros();

                    transition_out(if_blocks[previous_block_index], 1, 1, () => {
                        if_blocks[previous_block_index] = null;
                    });

                    check_outros();
                    if_block = if_blocks[current_block_type_index];

                    if (!if_block) {
                        if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
                        if_block.c();
                    }

                    transition_in(if_block, 1);
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            },
            i: function intro(local) {
                if (current) return;
                transition_in(if_block);
                current = true;
            },
            o: function outro(local) {
                transition_out(if_block);
                current = false;
            },
            d: function destroy(detaching) {
                if_blocks[current_block_type_index].d(detaching);
                if (detaching) detach_dev(if_block_anchor);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_3.name,
            type: "if",
            source: "(155:25) ",
            ctx
        });

        return block;
    }

    // (117:0) {#if ready === false}
    function create_if_block(ctx) {
        let div;

        function select_block_type_1(ctx, dirty) {
            if (/*updating*/ ctx[0] === true) return create_if_block_1;
            return create_else_block_1;
        }

        let current_block_type = select_block_type_1(ctx);
        let if_block = current_block_type(ctx);

        const block = {
            c: function create() {
                div = element("div");
                if_block.c();
                attr_dev(div, "class", "launcher-wrapper h-screen select-none flex items-center justify-center text-white bg-verydark");
                add_location(div, file, 117, 2, 3319);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
                if_block.m(div, null);
            },
            p: function update(ctx, dirty) {
                if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
                    if_block.p(ctx, dirty);
                } else {
                    if_block.d(1);
                    if_block = current_block_type(ctx);

                    if (if_block) {
                        if_block.c();
                        if_block.m(div, null);
                    }
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
                if_block.d();
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block.name,
            type: "if",
            source: "(117:0) {#if ready === false}",
            ctx
        });

        return block;
    }

    // (158:2) {:else}
    function create_else_block_2(ctx) {
        let div;
        let launchernavigation;
        let current;
        launchernavigation = new LauncherNavigation({ $$inline: true });

        const block = {
            c: function create() {
                div = element("div");
                create_component(launchernavigation.$$.fragment);
                attr_dev(div, "class", "launcher-wrapper h-screen max-h-screen overflow-hidden select-none flex flex-col bg-verydark text-white");
                add_location(div, file, 158, 4, 4806);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
                mount_component(launchernavigation, div, null);
                current = true;
            },
            i: function intro(local) {
                if (current) return;
                transition_in(launchernavigation.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(launchernavigation.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
                destroy_component(launchernavigation);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block_2.name,
            type: "else",
            source: "(158:2) {:else}",
            ctx
        });

        return block;
    }

    // (156:2) {#if !$sessionToken}
    function create_if_block_4(ctx) {
        let login;
        let current;
        login = new Login({ $$inline: true });

        const block = {
            c: function create() {
                create_component(login.$$.fragment);
            },
            m: function mount(target, anchor) {
                mount_component(login, target, anchor);
                current = true;
            },
            i: function intro(local) {
                if (current) return;
                transition_in(login.$$.fragment, local);
                current = true;
            },
            o: function outro(local) {
                transition_out(login.$$.fragment, local);
                current = false;
            },
            d: function destroy(detaching) {
                destroy_component(login, detaching);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_4.name,
            type: "if",
            source: "(156:2) {#if !$sessionToken}",
            ctx
        });

        return block;
    }

    // (139:4) {:else}
    function create_else_block_1(ctx) {
        let svg;
        let circle;
        let path;

        const block = {
            c: function create() {
                svg = svg_element("svg");
                circle = svg_element("circle");
                path = svg_element("path");
                attr_dev(circle, "class", "opacity-25");
                attr_dev(circle, "cx", "12");
                attr_dev(circle, "cy", "12");
                attr_dev(circle, "r", "10");
                attr_dev(circle, "stroke", "currentColor");
                attr_dev(circle, "stroke-width", "4");
                add_location(circle, file, 145, 8, 4382);
                attr_dev(path, "class", "opacity-75");
                attr_dev(path, "fill", "currentColor");
                attr_dev(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
                add_location(path, file, 146, 8, 4483);
                attr_dev(svg, "class", "animate-spin mr-3 h-8 w-8 text-white");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg, "fill", "none");
                attr_dev(svg, "viewBox", "0 0 24 24");
                add_location(svg, file, 139, 6, 4211);
            },
            m: function mount(target, anchor) {
                insert_dev(target, svg, anchor);
                append_dev(svg, circle);
                append_dev(svg, path);
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(svg);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block_1.name,
            type: "else",
            source: "(139:4) {:else}",
            ctx
        });

        return block;
    }

    // (119:4) {#if updating === true}
    function create_if_block_1(ctx) {
        let svg;
        let circle;
        let path;
        let t;
        let if_block_anchor;

        function select_block_type_2(ctx, dirty) {
            if (/*dlProgress*/ ctx[2] > 99) return create_if_block_2;
            return create_else_block;
        }

        let current_block_type = select_block_type_2(ctx);
        let if_block = current_block_type(ctx);

        const block = {
            c: function create() {
                svg = svg_element("svg");
                circle = svg_element("circle");
                path = svg_element("path");
                t = space();
                if_block.c();
                if_block_anchor = empty$1();
                attr_dev(circle, "class", "opacity-25");
                attr_dev(circle, "cx", "12");
                attr_dev(circle, "cy", "12");
                attr_dev(circle, "r", "10");
                attr_dev(circle, "stroke", "currentColor");
                attr_dev(circle, "stroke-width", "4");
                add_location(circle, file, 125, 8, 3634);
                attr_dev(path, "class", "opacity-75");
                attr_dev(path, "fill", "currentColor");
                attr_dev(path, "d", "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z");
                add_location(path, file, 126, 8, 3735);
                attr_dev(svg, "class", "animate-spin mr-3 h-8 w-8 text-white");
                attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
                attr_dev(svg, "fill", "none");
                attr_dev(svg, "viewBox", "0 0 24 24");
                add_location(svg, file, 119, 6, 3463);
            },
            m: function mount(target, anchor) {
                insert_dev(target, svg, anchor);
                append_dev(svg, circle);
                append_dev(svg, path);
                insert_dev(target, t, anchor);
                if_block.m(target, anchor);
                insert_dev(target, if_block_anchor, anchor);
            },
            p: function update(ctx, dirty) {
                if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
                    if_block.p(ctx, dirty);
                } else {
                    if_block.d(1);
                    if_block = current_block_type(ctx);

                    if (if_block) {
                        if_block.c();
                        if_block.m(if_block_anchor.parentNode, if_block_anchor);
                    }
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(svg);
                if (detaching) detach_dev(t);
                if_block.d(detaching);
                if (detaching) detach_dev(if_block_anchor);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_1.name,
            type: "if",
            source: "(119:4) {#if updating === true}",
            ctx
        });

        return block;
    }

    // (136:6) {:else}
    function create_else_block(ctx) {
        let div;
        let t0;
        let t1;
        let t2;

        const block = {
            c: function create() {
                div = element("div");
                t0 = text("Downloading an update.. you're already ");
                t1 = text(/*dlProgress*/ ctx[2]);
                t2 = text("% done");
                attr_dev(div, "class", "text-lg");
                add_location(div, file, 136, 8, 4093);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
                append_dev(div, t0);
                append_dev(div, t1);
                append_dev(div, t2);
            },
            p: function update(ctx, dirty) {
                if (dirty & /*dlProgress*/ 4) set_data_dev(t1, /*dlProgress*/ ctx[2]);
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_else_block.name,
            type: "else",
            source: "(136:6) {:else}",
            ctx
        });

        return block;
    }

    // (134:6) {#if dlProgress > 99}
    function create_if_block_2(ctx) {
        let div;

        const block = {
            c: function create() {
                div = element("div");
                div.textContent = "Download complete, extracting and installing..";
                attr_dev(div, "class", "text-lg");
                add_location(div, file, 134, 8, 3995);
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor);
            },
            p: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(div);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_if_block_2.name,
            type: "if",
            source: "(134:6) {#if dlProgress > 99}",
            ctx
        });

        return block;
    }

    function create_fragment(ctx) {
        let tailwind;
        let t;
        let current_block_type_index;
        let if_block;
        let if_block_anchor;
        let current;
        tailwind = new Tailwind({ $$inline: true });
        const if_block_creators = [create_if_block, create_if_block_3];
        const if_blocks = [];

        function select_block_type(ctx, dirty) {
            if (/*ready*/ ctx[1] === false) return 0;
            if (/*ready*/ ctx[1] === true) return 1;
            return -1;
        }

        if (~(current_block_type_index = select_block_type(ctx))) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
        }

        const block = {
            c: function create() {
                create_component(tailwind.$$.fragment);
                t = space();
                if (if_block) if_block.c();
                if_block_anchor = empty$1();
            },
            l: function claim(nodes) {
                throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
            },
            m: function mount(target, anchor) {
                mount_component(tailwind, target, anchor);
                insert_dev(target, t, anchor);

                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].m(target, anchor);
                }

                insert_dev(target, if_block_anchor, anchor);
                current = true;
            },
            p: function update(ctx, [dirty]) {
                let previous_block_index = current_block_type_index;
                current_block_type_index = select_block_type(ctx);

                if (current_block_type_index === previous_block_index) {
                    if (~current_block_type_index) {
                        if_blocks[current_block_type_index].p(ctx, dirty);
                    }
                } else {
                    if (if_block) {
                        group_outros();

                        transition_out(if_blocks[previous_block_index], 1, 1, () => {
                            if_blocks[previous_block_index] = null;
                        });

                        check_outros();
                    }

                    if (~current_block_type_index) {
                        if_block = if_blocks[current_block_type_index];

                        if (!if_block) {
                            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
                            if_block.c();
                        } else {
                            if_block.p(ctx, dirty);
                        }

                        transition_in(if_block, 1);
                        if_block.m(if_block_anchor.parentNode, if_block_anchor);
                    } else {
                        if_block = null;
                    }
                }
            },
            i: function intro(local) {
                if (current) return;
                transition_in(tailwind.$$.fragment, local);
                transition_in(if_block);
                current = true;
            },
            o: function outro(local) {
                transition_out(tailwind.$$.fragment, local);
                transition_out(if_block);
                current = false;
            },
            d: function destroy(detaching) {
                destroy_component(tailwind, detaching);
                if (detaching) detach_dev(t);

                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].d(detaching);
                }

                if (detaching) detach_dev(if_block_anchor);
            }
        };

        dispatch_dev("SvelteRegisterBlock", {
            block,
            id: create_fragment.name,
            type: "component",
            source: "",
            ctx
        });

        return block;
    }

    function instance($$self, $$props, $$invalidate) {
        let $sessionToken;
        let $playerInfo;
        let $systemInfo;
        let $gameState;
        let $serverInfo;
        let $sampSettings;
        validate_store(sessionToken, 'sessionToken');
        component_subscribe($$self, sessionToken, $$value => $$invalidate(3, $sessionToken = $$value));
        validate_store(playerInfo, 'playerInfo');
        component_subscribe($$self, playerInfo, $$value => $$invalidate(5, $playerInfo = $$value));
        validate_store(systemInfo, 'systemInfo');
        component_subscribe($$self, systemInfo, $$value => $$invalidate(6, $systemInfo = $$value));
        validate_store(gameState, 'gameState');
        component_subscribe($$self, gameState, $$value => $$invalidate(7, $gameState = $$value));
        validate_store(serverInfo, 'serverInfo');
        component_subscribe($$self, serverInfo, $$value => $$invalidate(8, $serverInfo = $$value));
        validate_store(sampSettings, 'sampSettings');
        component_subscribe($$self, sampSettings, $$value => $$invalidate(9, $sampSettings = $$value));
        let { $$slots: slots = {}, $$scope } = $$props;
        validate_slots('App', slots, []);
        const { ipcRenderer } = require("electron");
        const { dialog } = require("@electron/remote");
        let updating = false;
        let ready = false;
        let gameWasRunning = false;
        let dlProgress = 0;

        ipcRenderer.on("updateDownloadProgress", function (event, data) {
            $$invalidate(2, dlProgress = parseFloat(data).toFixed(1));
        });

        onMount(async () => {
            log$2("onmount", `user agent = ${window.navigator.userAgent}`);

            if (window.navigator.userAgent.includes("imrpupdater/")) {
                $$invalidate(0, updating = true);
                return;
            }

            log$2("onmount", `getting system info..`);
            if (!$systemInfo) set_store_value(systemInfo, $systemInfo = await getSystemInfo(), $systemInfo);
            log$2("onmount", `getting samp settings..`);
            set_store_value(sampSettings, $sampSettings = await samp.getSampSettings(), $sampSettings);
            log$2("onmount", `gta_path => ${$sampSettings.gta_path}`);
            log$2("onmount", `getting server config..`);
            set_store_value(serverInfo, $serverInfo = await getServerInfo(), $serverInfo);
            log$2("onmount", `trying to restore session..`);
            await restoreSessionToken();

            setInterval(
                async () => {
                    set_store_value(gameState, $gameState = await getGameState(), $gameState);

                    if (gameWasRunning === true && $gameState.running === false) {
                        window.close();
                    }

                    if ($gameState.running === true) {
                        gameWasRunning = true;
                    }
                },
                2000
            ); // get game state every 2 seconds

            if (!$sessionToken) {
                $$invalidate(1, ready = true);
            } else {
                log$2("onmount", `create socket connection..`);
                createSocketConnection();
                log$2("onmount", `trying to restore existing session..`);
                await refreshSessionInfo();
            }
        });

        const restoreSessionToken = async () => {
            let hasAuthToken = localStorage.getItem("authToken");

            if (hasAuthToken) {
                const autoLoginResult = await tokenLogin({
                    token: hasAuthToken,
                    system_uuid: $systemInfo.system.uuid
                });

                if (autoLoginResult.success) {
                    set_store_value(sessionToken, $sessionToken = autoLoginResult.sessionToken, $sessionToken);
                } else {
                    // localStorage.removeItem("authToken");
                    alert("Automatic login has failed, please login again.");
                }
            }
        };

        const refreshSessionInfo = async () => {
            if ($sessionToken) {
                set_store_value(playerInfo, $playerInfo = await getUserBySessionToken({ token: $sessionToken }), $playerInfo);
                $$invalidate(1, ready = true);
            }
        };

        const unsubscribeTokenListener = sessionToken.subscribe(async newToken => {
            await refreshSessionInfo();
        });

        onDestroy(unsubscribeTokenListener);
        const writable_props = [];

        Object.keys($$props).forEach(key => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
        });

        $$self.$capture_state = () => ({
            ipcRenderer,
            dialog,
            updating,
            ready,
            getSampSettings: samp.getSampSettings,
            createSocketConnection,
            destroySocketConnection,
            getAutoHotkeyScripts,
            getSystemInfo,
            browseGameFolder,
            getGameState,
            readModules,
            log: log$2,
            sessionToken,
            sampSettings,
            systemInfo,
            playerInfo,
            knownTasks,
            knownFiles,
            knownModules,
            onlinePlayers,
            gameState,
            serverInfo,
            tokenLogin,
            getUserBySessionToken,
            getServerInfo,
            getSavedTokens,
            onDestroy,
            onMount,
            Login,
            LauncherNavigation,
            Tailwind,
            gameWasRunning,
            dlProgress,
            restoreSessionToken,
            refreshSessionInfo,
            unsubscribeTokenListener,
            $sessionToken,
            $playerInfo,
            $systemInfo,
            $gameState,
            $serverInfo,
            $sampSettings
        });

        $$self.$inject_state = $$props => {
            if ('updating' in $$props) $$invalidate(0, updating = $$props.updating);
            if ('ready' in $$props) $$invalidate(1, ready = $$props.ready);
            if ('gameWasRunning' in $$props) gameWasRunning = $$props.gameWasRunning;
            if ('dlProgress' in $$props) $$invalidate(2, dlProgress = $$props.dlProgress);
        };

        if ($$props && "$$inject" in $$props) {
            $$self.$inject_state($$props.$$inject);
        }

        return [updating, ready, dlProgress, $sessionToken];
    }

    class App extends SvelteComponentDev {
        constructor(options) {
            super(options);
            init(this, options, instance, create_fragment, safe_not_equal, {});

            dispatch_dev("SvelteRegisterComponent", {
                component: this,
                tagName: "App",
                options,
                id: create_fragment.name
            });
        }
    }

    const log = require("electron-log");

    window.onunhandledrejection = (e) => {
      console.error(e);
      log.scope("app").error(`unhandled rejection happened in the renderer`);
      log.scope("app").error(JSON.stringify(e, ["message", "arguments", "type", "name", "reason", "detail"]));
    };

    window.onerror = (e) => {
      log.scope("app").error(`error happened in the renderer`);
      log.scope("app").error(JSON.stringify(e, ["message", "arguments", "type", "name", "reason", "detail"]));
    };

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
