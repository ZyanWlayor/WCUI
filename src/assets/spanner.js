(function () {
    'use strict';

    /**
     * @description Handle file size readability
     * @param {Integer} value file size of byte unit
     * @returns {String} readable file size
     */
    function readableSize(value){
        if(null==value||value==''){
            return "0 Bytes";
        }
        var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
        var index=0;
        var srcsize = parseFloat(value);
        index=Math.floor(Math.log(srcsize)/Math.log(1024));
        var size =srcsize/Math.pow(1024,index);
        size=size.toFixed(2);// decimal digit to keep
        return size+unitArr[index];
    }

    /**
     * @description random num between min and max (include min and max)
     * @param {Integer} rMi min
     * @param {Integer} rMa max
     * @returns {Integer}
     */
    function random(rMi, rMa) { return ~~((Math.random() * (rMa - rMi + 1)) + rMi); }

    /**
     * @description a guid generator
     * @returns {String} a guid eg. '9a9681bb-4dfa-6750-5ae4-9530209d8a9d'
     */
    function newGuid() {
        var guid = "";
        for (var i = 1; i <= 32; i++) {
            var n = Math.floor(Math.random() * 16.0).toString(16);
            guid += n;
            if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
                guid += "-";
        }
        return guid;
    }

    /**
     * @description datetime formatter
     * @param {Date} value a date object struct by `new Date(*)`
     * @param {String} fmt a fmt string like "MM-dd ..."
     * @returns {String}
     */
    function dateTimeFormat(value, fmt) {
        var o = {
            "M+": value.getMonth() + 1, //月份
            "d+": value.getDate(), //日
            "h+": value.getHours(), //小时
            "m+": value.getMinutes(), //分
            "s+": value.getSeconds(), //秒
            "q+": Math.floor((value.getMonth() + 3) / 3), //季度
            "S": value.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (value.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    /**
     * @description TypedArray concat helper
     * @param {TypedArray} resultConstructor TypedArray Constructor eg.Uint8Array
     * @param  {...typedArray} arrays TypedArray instance array to concat
     * @returns 
     */
    function concatenate(resultConstructor, ...arrays) {
        let totalLength = 0;
        for (let arr of arrays) {
            totalLength += arr.length;
        }
        let result = new resultConstructor(totalLength);
        let offset = 0;
        for (let arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    /**
     * @description retry helpers regenerator promise object every time
     * @param promiseFn Promise function to reExecute each retry time
     * @param times times
     * @returns Promise<T>
     */
    function retryPromise(promiseFn, times = 5, retryInterval = 0) {
        return new Promise((resolve, reject) => {
            let runtimes = 0;
            function retryWrapperFn() {
                promiseFn().then((result) => {
                    resolve(result);
                }).catch((err) => {
                    // detect strike reject to whole, it ignore retry times option and reject directly
                    if (err.mode === 'strike') {
                        reject(err);
                        return
                    }
                    if (!times) {
                        setTimeout(() => retryWrapperFn(), retryInterval);
                    } else if (runtimes < times) {
                        setTimeout(() => retryWrapperFn(), retryInterval);
                    } else {
                        const retryError = new Error(`retryPromise exceed ${times} times : ${err.toString()}`);
                        reject(retryError);
                    }

                }).finally(() => {
                    runtimes++;
                });
            }

            retryWrapperFn();

        })
    }

    /**
     * @description wait ms millisecond
     * @param {integer} ms duration for wait in millisecond
     * @returns {Promise}
     */
    function wait(ms){
        return new Promise((resolve)=>{
            setTimeout(resolve,ms);
        })
    }

    var spannerGeneric = /*#__PURE__*/Object.freeze({
        __proto__: null,
        readableSize: readableSize,
        random: random,
        guid: newGuid,
        dateTimeFormat: dateTimeFormat,
        concatenate: concatenate,
        retryPromise: retryPromise,
        wait: wait
    });

    /**
     * @description test if parentObj is parent of obj
     * @param {DomElement} obj target dom element
     * @param {DomElement} parentObj test parent dom element
     * @returns 
     */
    function isParent(obj, parentObj) {
        while (obj != undefined && obj != null && obj.tagName.toUpperCase() != 'BODY') {
            if (obj == parentObj) {
                return true;
            }
            obj = obj.parentNode;
        }
        return false;
    }

    /**
     * @description a simple wrapper for fetch raw content for a asset
     * @param {String|Request} input target to request
     * @param {requestInit} init request params
     * @returns 
     */
    function requestRaw(input, init) {
        return fetch(input, init).then(function (response) {
            if (response.ok) {
                return response.text()
            } else {
                return Promise.reject()
            }
        })
    }
    /**
     * @description wait for web components finish register
     * @param {integer} componentsCount 
     * @returns {Promise}
     */
    function waitForComponentsLoaded(componentsCount){
        return new Promise(async (res)=>{
            while(window.customElementsLoadedCount !== componentsCount){
                await wait(500);
            }
            res();
        })
    }

    /**
        * @description util function to load web components,recommand to invoke this function before body parse
        * @param string[] web componets name array to load
        */
    function loadComponents(components) {
        let componentsLoadQueue = components.map(component => {
            return new Promise((resolve) => {
                return requestRaw(`/components/templates/${component}.html`).then(templateContent => {
                    // inject web component template
                    const templateElement = document.createElement("template");
                    templateElement.setAttribute("id", `${component}-template`);
                    templateElement.innerHTML = templateContent;
                    document.querySelector('head').appendChild(templateElement);

                    // inject web component definition class
                    const scriptElement = document.createElement('script');
                    scriptElement.setAttribute('src', `/components/${component}.js`);
                    document.querySelector("head").append(scriptElement);
                    resolve();
                }).catch((error) => {
                    console.log(`load component [${component}] error :`, error);
                    resolve();
                })
            })
        });
        componentsLoadQueue.push(waitForComponentsLoaded(components.length));
        return Promise.all(componentsLoadQueue)
    }

    /**
         * @description infinite wait before module loaded
         * @param {string[]} modules name arrays for module injected window
         * @returns {module[]} modules loaded
         */
    function loadPublicModule(modules) {
        return Promise.all(modules.map(module => {
            return new Promise(async (resolve) => {
                while (true) {
                    if (window[module]) {
                        resolve(window[module]);
                        break;
                    } else {
                        await Utils.wait(500);
                    }
                }

            })
        }))
    }

    /**
     * @description resolve query params current page
     * @returns {Object} querystring object eg {id:1}
     */
    function resolveQueryString(){
        var query = location.href.split('?')[1] || '';
        var re = /([^&=]+)=?([^&]*)/g,
        decodeRE = /\+/g,
        decode = function (str) { return decodeURIComponent( str.replace(decodeRE, " ") ); };
        var params = {}, e;
        while ( e = re.exec(query) ){
           params[ decode(e[1]) ] = decode( e[2] );
        }    return params;
     
     }

    /**
     * 
     * @param {Element} node current dom element
     * @param {String} className className for parent element to find
     * @returns {Element} dom node to find
     */
    function getParentByClassName(node, className) {
        let parentNode = node, currentNode = node;
        while (!(parentNode && parentNode.classList && parentNode.classList.contains(className))) {
            if (currentNode.parentNode) {
                currentNode = parentNode;
                parentNode = currentNode.parentNode;
            } else {
                return null
            }

        }
        return parentNode
    }

    var spannerWebRestrict = /*#__PURE__*/Object.freeze({
        __proto__: null,
        isParent: isParent,
        loadWebComponents: loadComponents,
        loadPublicModule: loadPublicModule,
        resolveQueryString: resolveQueryString,
        getParentByClassName: getParentByClassName
    });

    window.spanner = Object.assign({},spannerGeneric,spannerWebRestrict);

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLWluZGV4LmpzIiwic291cmNlcyI6WyIuLi9saWJzL2dlbmVyaWMvcmVhZGFibGVTaXplLmpzIiwiLi4vbGlicy9nZW5lcmljL3JhbmRvbS5qcyIsIi4uL2xpYnMvZ2VuZXJpYy9ndWlkLmpzIiwiLi4vbGlicy9nZW5lcmljL2RhdGVUaW1lRm9ybWF0LmpzIiwiLi4vbGlicy9nZW5lcmljL2NvbmNhdGVuYXRlLmpzIiwiLi4vbGlicy9nZW5lcmljL3JldHJ5UHJvbWlzZS5qcyIsIi4uL2xpYnMvZ2VuZXJpYy93YWl0LmpzIiwiLi4vbGlicy93ZWItcmVzdHJpY3QvaXNQYXJlbnQuanMiLCIuLi9saWJzL3dlYi1yZXN0cmljdC9sb2FkV2ViQ29tcG9uZW50cy5qcyIsIi4uL2xpYnMvd2ViLXJlc3RyaWN0L2xvYWRQdWJsaWNNb2R1bGUuanMiLCIuLi9saWJzL3dlYi1yZXN0cmljdC9yZXNvbHZlUXVlcnlTdHJpbmcuanMiLCIuLi9saWJzL3dlYi1yZXN0cmljdC9nZXRQYXJlbnRCeUNsYXNzTmFtZS5qcyIsIi4uL3dlYi1pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBkZXNjcmlwdGlvbiBIYW5kbGUgZmlsZSBzaXplIHJlYWRhYmlsaXR5XG4gKiBAcGFyYW0ge0ludGVnZXJ9IHZhbHVlIGZpbGUgc2l6ZSBvZiBieXRlIHVuaXRcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHJlYWRhYmxlIGZpbGUgc2l6ZVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZWFkYWJsZVNpemUodmFsdWUpe1xuICAgIGlmKG51bGw9PXZhbHVlfHx2YWx1ZT09Jycpe1xuICAgICAgICByZXR1cm4gXCIwIEJ5dGVzXCI7XG4gICAgfVxuICAgIHZhciB1bml0QXJyID0gbmV3IEFycmF5KFwiQnl0ZXNcIixcIktCXCIsXCJNQlwiLFwiR0JcIixcIlRCXCIsXCJQQlwiLFwiRUJcIixcIlpCXCIsXCJZQlwiKTtcbiAgICB2YXIgaW5kZXg9MDtcbiAgICB2YXIgc3Jjc2l6ZSA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICAgIGluZGV4PU1hdGguZmxvb3IoTWF0aC5sb2coc3Jjc2l6ZSkvTWF0aC5sb2coMTAyNCkpO1xuICAgIHZhciBzaXplID1zcmNzaXplL01hdGgucG93KDEwMjQsaW5kZXgpO1xuICAgIHNpemU9c2l6ZS50b0ZpeGVkKDIpOy8vIGRlY2ltYWwgZGlnaXQgdG8ga2VlcFxuICAgIHJldHVybiBzaXplK3VuaXRBcnJbaW5kZXhdO1xufSIsIi8qKlxuICogQGRlc2NyaXB0aW9uIHJhbmRvbSBudW0gYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVkZSBtaW4gYW5kIG1heClcbiAqIEBwYXJhbSB7SW50ZWdlcn0gck1pIG1pblxuICogQHBhcmFtIHtJbnRlZ2VyfSByTWEgbWF4XG4gKiBAcmV0dXJucyB7SW50ZWdlcn1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmFuZG9tKHJNaSwgck1hKSB7IHJldHVybiB+figoTWF0aC5yYW5kb20oKSAqIChyTWEgLSByTWkgKyAxKSkgKyByTWkpOyB9IiwiLyoqXG4gKiBAZGVzY3JpcHRpb24gYSBndWlkIGdlbmVyYXRvclxuICogQHJldHVybnMge1N0cmluZ30gYSBndWlkIGVnLiAnOWE5NjgxYmItNGRmYS02NzUwLTVhZTQtOTUzMDIwOWQ4YTlkJ1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBuZXdHdWlkKCkge1xuICAgIHZhciBndWlkID0gXCJcIjtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSAzMjsgaSsrKSB7XG4gICAgICAgIHZhciBuID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTYuMCkudG9TdHJpbmcoMTYpO1xuICAgICAgICBndWlkICs9IG47XG4gICAgICAgIGlmICgoaSA9PSA4KSB8fCAoaSA9PSAxMikgfHwgKGkgPT0gMTYpIHx8IChpID09IDIwKSlcbiAgICAgICAgICAgIGd1aWQgKz0gXCItXCI7XG4gICAgfVxuICAgIHJldHVybiBndWlkO1xufSIsIi8qKlxuICogQGRlc2NyaXB0aW9uIGRhdGV0aW1lIGZvcm1hdHRlclxuICogQHBhcmFtIHtEYXRlfSB2YWx1ZSBhIGRhdGUgb2JqZWN0IHN0cnVjdCBieSBgbmV3IERhdGUoKilgXG4gKiBAcGFyYW0ge1N0cmluZ30gZm10IGEgZm10IHN0cmluZyBsaWtlIFwiTU0tZGQgLi4uXCJcbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRhdGVUaW1lRm9ybWF0KHZhbHVlLCBmbXQpIHtcbiAgICB2YXIgbyA9IHtcbiAgICAgICAgXCJNK1wiOiB2YWx1ZS5nZXRNb250aCgpICsgMSwgLy/mnIjku71cbiAgICAgICAgXCJkK1wiOiB2YWx1ZS5nZXREYXRlKCksIC8v5pelXG4gICAgICAgIFwiaCtcIjogdmFsdWUuZ2V0SG91cnMoKSwgLy/lsI/ml7ZcbiAgICAgICAgXCJtK1wiOiB2YWx1ZS5nZXRNaW51dGVzKCksIC8v5YiGXG4gICAgICAgIFwicytcIjogdmFsdWUuZ2V0U2Vjb25kcygpLCAvL+enklxuICAgICAgICBcInErXCI6IE1hdGguZmxvb3IoKHZhbHVlLmdldE1vbnRoKCkgKyAzKSAvIDMpLCAvL+Wto+W6plxuICAgICAgICBcIlNcIjogdmFsdWUuZ2V0TWlsbGlzZWNvbmRzKCkgLy/mr6vnp5JcbiAgICB9O1xuICAgIGlmICgvKHkrKS8udGVzdChmbXQpKSBmbXQgPSBmbXQucmVwbGFjZShSZWdFeHAuJDEsICh2YWx1ZS5nZXRGdWxsWWVhcigpICsgXCJcIikuc3Vic3RyKDQgLSBSZWdFeHAuJDEubGVuZ3RoKSk7XG4gICAgZm9yICh2YXIgayBpbiBvKVxuICAgICAgICBpZiAobmV3IFJlZ0V4cChcIihcIiArIGsgKyBcIilcIikudGVzdChmbXQpKSBmbXQgPSBmbXQucmVwbGFjZShSZWdFeHAuJDEsIChSZWdFeHAuJDEubGVuZ3RoID09IDEpID8gKG9ba10pIDogKChcIjAwXCIgKyBvW2tdKS5zdWJzdHIoKFwiXCIgKyBvW2tdKS5sZW5ndGgpKSk7XG4gICAgcmV0dXJuIGZtdDtcbn0iLCIvKipcbiAqIEBkZXNjcmlwdGlvbiBUeXBlZEFycmF5IGNvbmNhdCBoZWxwZXJcbiAqIEBwYXJhbSB7VHlwZWRBcnJheX0gcmVzdWx0Q29uc3RydWN0b3IgVHlwZWRBcnJheSBDb25zdHJ1Y3RvciBlZy5VaW50OEFycmF5XG4gKiBAcGFyYW0gIHsuLi50eXBlZEFycmF5fSBhcnJheXMgVHlwZWRBcnJheSBpbnN0YW5jZSBhcnJheSB0byBjb25jYXRcbiAqIEByZXR1cm5zIFxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb25jYXRlbmF0ZShyZXN1bHRDb25zdHJ1Y3RvciwgLi4uYXJyYXlzKSB7XG4gICAgbGV0IHRvdGFsTGVuZ3RoID0gMDtcbiAgICBmb3IgKGxldCBhcnIgb2YgYXJyYXlzKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoICs9IGFyci5sZW5ndGg7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBuZXcgcmVzdWx0Q29uc3RydWN0b3IodG90YWxMZW5ndGgpO1xuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGZvciAobGV0IGFyciBvZiBhcnJheXMpIHtcbiAgICAgICAgcmVzdWx0LnNldChhcnIsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSBhcnIubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufSIsIi8qKlxuICogQGRlc2NyaXB0aW9uIHJldHJ5IGhlbHBlcnMgcmVnZW5lcmF0b3IgcHJvbWlzZSBvYmplY3QgZXZlcnkgdGltZVxuICogQHBhcmFtIHByb21pc2VGbiBQcm9taXNlIGZ1bmN0aW9uIHRvIHJlRXhlY3V0ZSBlYWNoIHJldHJ5IHRpbWVcbiAqIEBwYXJhbSB0aW1lcyB0aW1lc1xuICogQHJldHVybnMgUHJvbWlzZTxUPlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZXRyeVByb21pc2UocHJvbWlzZUZuLCB0aW1lcyA9IDUsIHJldHJ5SW50ZXJ2YWwgPSAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IHJ1bnRpbWVzID0gMFxuICAgICAgICBmdW5jdGlvbiByZXRyeVdyYXBwZXJGbigpIHtcbiAgICAgICAgICAgIHByb21pc2VGbigpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGRldGVjdCBzdHJpa2UgcmVqZWN0IHRvIHdob2xlLCBpdCBpZ25vcmUgcmV0cnkgdGltZXMgb3B0aW9uIGFuZCByZWplY3QgZGlyZWN0bHlcbiAgICAgICAgICAgICAgICBpZiAoZXJyLm1vZGUgPT09ICdzdHJpa2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmV0cnlXcmFwcGVyRm4oKSwgcmV0cnlJbnRlcnZhbClcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bnRpbWVzIDwgdGltZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXRyeVdyYXBwZXJGbigpLCByZXRyeUludGVydmFsKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJldHJ5RXJyb3IgPSBuZXcgRXJyb3IoYHJldHJ5UHJvbWlzZSBleGNlZWQgJHt0aW1lc30gdGltZXMgOiAke2Vyci50b1N0cmluZygpfWApXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXRyeUVycm9yKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcnVudGltZXMrK1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHJ5V3JhcHBlckZuKClcblxuICAgIH0pXG59IiwiLyoqXG4gKiBAZGVzY3JpcHRpb24gd2FpdCBtcyBtaWxsaXNlY29uZFxuICogQHBhcmFtIHtpbnRlZ2VyfSBtcyBkdXJhdGlvbiBmb3Igd2FpdCBpbiBtaWxsaXNlY29uZFxuICogQHJldHVybnMge1Byb21pc2V9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHdhaXQobXMpe1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSk9PntcbiAgICAgICAgc2V0VGltZW91dChyZXNvbHZlLG1zKVxuICAgIH0pXG59IiwiLyoqXG4gKiBAZGVzY3JpcHRpb24gdGVzdCBpZiBwYXJlbnRPYmogaXMgcGFyZW50IG9mIG9ialxuICogQHBhcmFtIHtEb21FbGVtZW50fSBvYmogdGFyZ2V0IGRvbSBlbGVtZW50XG4gKiBAcGFyYW0ge0RvbUVsZW1lbnR9IHBhcmVudE9iaiB0ZXN0IHBhcmVudCBkb20gZWxlbWVudFxuICogQHJldHVybnMgXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGlzUGFyZW50KG9iaiwgcGFyZW50T2JqKSB7XG4gICAgd2hpbGUgKG9iaiAhPSB1bmRlZmluZWQgJiYgb2JqICE9IG51bGwgJiYgb2JqLnRhZ05hbWUudG9VcHBlckNhc2UoKSAhPSAnQk9EWScpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBwYXJlbnRPYmopIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG9iaiA9IG9iai5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59IiwiaW1wb3J0IHdhaXQgZnJvbSAnLi4vZ2VuZXJpYy93YWl0J1xuLyoqXG4gKiBAZGVzY3JpcHRpb24gYSBzaW1wbGUgd3JhcHBlciBmb3IgZmV0Y2ggcmF3IGNvbnRlbnQgZm9yIGEgYXNzZXRcbiAqIEBwYXJhbSB7U3RyaW5nfFJlcXVlc3R9IGlucHV0IHRhcmdldCB0byByZXF1ZXN0XG4gKiBAcGFyYW0ge3JlcXVlc3RJbml0fSBpbml0IHJlcXVlc3QgcGFyYW1zXG4gKiBAcmV0dXJucyBcbiAqL1xuZnVuY3Rpb24gcmVxdWVzdFJhdyhpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBmZXRjaChpbnB1dCwgaW5pdCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKVxuICAgICAgICB9XG4gICAgfSlcbn1cbi8qKlxuICogQGRlc2NyaXB0aW9uIHdhaXQgZm9yIHdlYiBjb21wb25lbnRzIGZpbmlzaCByZWdpc3RlclxuICogQHBhcmFtIHtpbnRlZ2VyfSBjb21wb25lbnRzQ291bnQgXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqL1xuZnVuY3Rpb24gd2FpdEZvckNvbXBvbmVudHNMb2FkZWQoY29tcG9uZW50c0NvdW50KXtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlcyk9PntcbiAgICAgICAgd2hpbGUod2luZG93LmN1c3RvbUVsZW1lbnRzTG9hZGVkQ291bnQgIT09IGNvbXBvbmVudHNDb3VudCl7XG4gICAgICAgICAgICBhd2FpdCB3YWl0KDUwMClcbiAgICAgICAgfVxuICAgICAgICByZXMoKVxuICAgIH0pXG59XG5cbi8qKlxuICAgICogQGRlc2NyaXB0aW9uIHV0aWwgZnVuY3Rpb24gdG8gbG9hZCB3ZWIgY29tcG9uZW50cyxyZWNvbW1hbmQgdG8gaW52b2tlIHRoaXMgZnVuY3Rpb24gYmVmb3JlIGJvZHkgcGFyc2VcbiAgICAqIEBwYXJhbSBzdHJpbmdbXSB3ZWIgY29tcG9uZXRzIG5hbWUgYXJyYXkgdG8gbG9hZFxuICAgICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsb2FkQ29tcG9uZW50cyhjb21wb25lbnRzKSB7XG4gICAgbGV0IGNvbXBvbmVudHNMb2FkUXVldWUgPSBjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0UmF3KGAvY29tcG9uZW50cy90ZW1wbGF0ZXMvJHtjb21wb25lbnR9Lmh0bWxgKS50aGVuKHRlbXBsYXRlQ29udGVudCA9PiB7XG4gICAgICAgICAgICAgICAgLy8gaW5qZWN0IHdlYiBjb21wb25lbnQgdGVtcGxhdGVcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIilcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVsZW1lbnQuc2V0QXR0cmlidXRlKFwiaWRcIiwgYCR7Y29tcG9uZW50fS10ZW1wbGF0ZWApXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlQ29udGVudFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZUVsZW1lbnQpXG5cbiAgICAgICAgICAgICAgICAvLyBpbmplY3Qgd2ViIGNvbXBvbmVudCBkZWZpbml0aW9uIGNsYXNzXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAgICAgICAgICAgc2NyaXB0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3NyYycsIGAvY29tcG9uZW50cy8ke2NvbXBvbmVudH0uanNgKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoZWFkXCIpLmFwcGVuZChzY3JpcHRFbGVtZW50KVxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYGxvYWQgY29tcG9uZW50IFske2NvbXBvbmVudH1dIGVycm9yIDpgLCBlcnJvcilcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBjb21wb25lbnRzTG9hZFF1ZXVlLnB1c2god2FpdEZvckNvbXBvbmVudHNMb2FkZWQoY29tcG9uZW50cy5sZW5ndGgpKVxuICAgIHJldHVybiBQcm9taXNlLmFsbChjb21wb25lbnRzTG9hZFF1ZXVlKVxufVxuXG4iLCIvKipcbiAgICAgKiBAZGVzY3JpcHRpb24gaW5maW5pdGUgd2FpdCBiZWZvcmUgbW9kdWxlIGxvYWRlZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IG1vZHVsZXMgbmFtZSBhcnJheXMgZm9yIG1vZHVsZSBpbmplY3RlZCB3aW5kb3dcbiAgICAgKiBAcmV0dXJucyB7bW9kdWxlW119IG1vZHVsZXMgbG9hZGVkXG4gICAgICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBsb2FkUHVibGljTW9kdWxlKG1vZHVsZXMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kdWxlcy5tYXAobW9kdWxlID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3dbbW9kdWxlXSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHdpbmRvd1ttb2R1bGVdKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBVdGlscy53YWl0KDUwMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSlcbiAgICB9KSlcbn0iLCIvKipcbiAqIEBkZXNjcmlwdGlvbiByZXNvbHZlIHF1ZXJ5IHBhcmFtcyBjdXJyZW50IHBhZ2VcbiAqIEByZXR1cm5zIHtPYmplY3R9IHF1ZXJ5c3RyaW5nIG9iamVjdCBlZyB7aWQ6MX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVzb2x2ZVF1ZXJ5U3RyaW5nKCl7XG4gICAgdmFyIHF1ZXJ5ID0gbG9jYXRpb24uaHJlZi5zcGxpdCgnPycpWzFdIHx8ICcnXG4gICAgdmFyIHJlID0gLyhbXiY9XSspPT8oW14mXSopL2csXG4gICAgZGVjb2RlUkUgPSAvXFwrL2csXG4gICAgZGVjb2RlID0gZnVuY3Rpb24gKHN0cikgeyByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KCBzdHIucmVwbGFjZShkZWNvZGVSRSwgXCIgXCIpICk7IH07XG4gICAgdmFyIHBhcmFtcyA9IHt9LCBlO1xuICAgIHdoaWxlICggZSA9IHJlLmV4ZWMocXVlcnkpICl7XG4gICAgICAgcGFyYW1zWyBkZWNvZGUoZVsxXSkgXSA9IGRlY29kZSggZVsyXSApXG4gICAgfTtcbiAgICByZXR1cm4gcGFyYW1zO1xuIFxuIH0iLCIvKipcbiAqIFxuICogQHBhcmFtIHtFbGVtZW50fSBub2RlIGN1cnJlbnQgZG9tIGVsZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgY2xhc3NOYW1lIGZvciBwYXJlbnQgZWxlbWVudCB0byBmaW5kXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gZG9tIG5vZGUgdG8gZmluZFxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRQYXJlbnRCeUNsYXNzTmFtZShub2RlLCBjbGFzc05hbWUpIHtcbiAgICBsZXQgcGFyZW50Tm9kZSA9IG5vZGUsIGN1cnJlbnROb2RlID0gbm9kZVxuICAgIHdoaWxlICghKHBhcmVudE5vZGUgJiYgcGFyZW50Tm9kZS5jbGFzc0xpc3QgJiYgcGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnROb2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZVxuICAgICAgICAgICAgcGFyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgIH1cbiAgICByZXR1cm4gcGFyZW50Tm9kZVxufSIsImltcG9ydCAqIGFzIHNwYW5uZXJHZW5lcmljIGZyb20gJy4vbGlicy9nZW5lcmljL2luZGV4J1xuaW1wb3J0ICogYXMgc3Bhbm5lcldlYlJlc3RyaWN0IGZyb20gJy4vbGlicy93ZWItcmVzdHJpY3QvaW5kZXgnXG5cbndpbmRvdy5zcGFubmVyID0gT2JqZWN0LmFzc2lnbih7fSxzcGFubmVyR2VuZXJpYyxzcGFubmVyV2ViUmVzdHJpY3QpXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBQUE7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUMzQyxJQUFJLEdBQUcsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO0lBQzlCLFFBQVEsT0FBTyxTQUFTLENBQUM7SUFDekIsS0FBSztJQUNMLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3RSxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNoQixJQUFJLElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksSUFBSSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0I7O0lDaEJBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDOztJQ045RjtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsT0FBTyxHQUFHO0lBQ2xDLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNsQyxRQUFRLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM5RCxRQUFRLElBQUksSUFBSSxDQUFDLENBQUM7SUFDbEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0QsWUFBWSxJQUFJLElBQUksR0FBRyxDQUFDO0lBQ3hCLEtBQUs7SUFDTCxJQUFJLE9BQU8sSUFBSSxDQUFDO0lBQ2hCOztJQ2JBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsY0FBYyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7SUFDbkQsSUFBSSxJQUFJLENBQUMsR0FBRztJQUNaLFFBQVEsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO0lBQ2xDLFFBQVEsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUU7SUFDN0IsUUFBUSxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRTtJQUM5QixRQUFRLElBQUksRUFBRSxLQUFLLENBQUMsVUFBVSxFQUFFO0lBQ2hDLFFBQVEsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUU7SUFDaEMsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELFFBQVEsR0FBRyxFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUU7SUFDcEMsS0FBSyxDQUFDO0lBQ04sSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDaEgsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsUUFBUSxJQUFJLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3SixJQUFJLE9BQU8sR0FBRyxDQUFDO0lBQ2Y7O0lDcEJBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsTUFBTSxFQUFFO0lBQ2xFLElBQUksSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7SUFDNUIsUUFBUSxXQUFXLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxLQUFLO0lBQ0wsSUFBSSxJQUFJLE1BQU0sR0FBRyxJQUFJLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3BELElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7SUFDNUIsUUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNoQyxRQUFRLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQzdCLEtBQUs7SUFDTCxJQUFJLE9BQU8sTUFBTSxDQUFDO0lBQ2xCOztJQ2xCQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDZSxTQUFTLFlBQVksQ0FBQyxTQUFTLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxhQUFhLEdBQUcsQ0FBQyxFQUFFO0lBQzlFLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEtBQUs7SUFDNUMsUUFBUSxJQUFJLFFBQVEsR0FBRyxFQUFDO0lBQ3hCLFFBQVEsU0FBUyxjQUFjLEdBQUc7SUFDbEMsWUFBWSxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUs7SUFDekMsZ0JBQWdCLE9BQU8sQ0FBQyxNQUFNLEVBQUM7SUFDL0IsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLO0lBQzlCO0lBQ0EsZ0JBQWdCLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7SUFDM0Msb0JBQW9CLE1BQU0sQ0FBQyxHQUFHLEVBQUM7SUFDL0Isb0JBQW9CLE1BQU07SUFDMUIsaUJBQWlCO0lBQ2pCLGdCQUFnQixJQUFJLENBQUMsS0FBSyxFQUFFO0lBQzVCLG9CQUFvQixVQUFVLENBQUMsTUFBTSxjQUFjLEVBQUUsRUFBRSxhQUFhLEVBQUM7SUFDckUsaUJBQWlCLE1BQU0sSUFBSSxRQUFRLEdBQUcsS0FBSyxFQUFFO0lBQzdDLG9CQUFvQixVQUFVLENBQUMsTUFBTSxjQUFjLEVBQUUsRUFBRSxhQUFhLEVBQUM7SUFDckUsaUJBQWlCLE1BQU07SUFDdkIsb0JBQW9CLE1BQU0sVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFDO0lBQzFHLG9CQUFvQixNQUFNLENBQUMsVUFBVSxFQUFDO0lBQ3RDLGlCQUFpQjtBQUNqQjtJQUNBLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNO0lBQzdCLGdCQUFnQixRQUFRLEdBQUU7SUFDMUIsYUFBYSxFQUFDO0lBQ2QsU0FBUztBQUNUO0lBQ0EsUUFBUSxjQUFjLEdBQUU7QUFDeEI7SUFDQSxLQUFLLENBQUM7SUFDTjs7SUNuQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNoQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEdBQUc7SUFDbEMsUUFBUSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBQztJQUM5QixLQUFLLENBQUM7SUFDTjs7Ozs7Ozs7Ozs7OztJQ1RBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUU7SUFDakQsSUFBSSxPQUFPLEdBQUcsSUFBSSxTQUFTLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLE1BQU0sRUFBRTtJQUNuRixRQUFRLElBQUksR0FBRyxJQUFJLFNBQVMsRUFBRTtJQUM5QixZQUFZLE9BQU8sSUFBSSxDQUFDO0lBQ3hCLFNBQVM7SUFDVCxRQUFRLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO0lBQzdCLEtBQUs7SUFDTCxJQUFJLE9BQU8sS0FBSyxDQUFDO0lBQ2pCOztJQ2JBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLFNBQVMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUU7SUFDakMsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsUUFBUSxFQUFFO0lBQ3ZELFFBQVEsSUFBSSxRQUFRLENBQUMsRUFBRSxFQUFFO0lBQ3pCLFlBQVksT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFO0lBQ2xDLFNBQVMsTUFBTTtJQUNmLFlBQVksT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFO0lBQ25DLFNBQVM7SUFDVCxLQUFLLENBQUM7SUFDTixDQUFDO0lBQ0Q7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLFNBQVMsdUJBQXVCLENBQUMsZUFBZSxDQUFDO0lBQ2pELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEdBQUcsR0FBRztJQUNwQyxRQUFRLE1BQU0sTUFBTSxDQUFDLHlCQUF5QixLQUFLLGVBQWUsQ0FBQztJQUNuRSxZQUFZLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBQztJQUMzQixTQUFTO0lBQ1QsUUFBUSxHQUFHLEdBQUU7SUFDYixLQUFLLENBQUM7SUFDTixDQUFDO0FBQ0Q7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsY0FBYyxDQUFDLFVBQVUsRUFBRTtJQUNuRCxJQUFJLElBQUksbUJBQW1CLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUk7SUFDMUQsUUFBUSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLO0lBQ3hDLFlBQVksT0FBTyxVQUFVLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJO0lBQ2pHO0lBQ0EsZ0JBQWdCLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFDO0lBQzFFLGdCQUFnQixlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFDO0lBQzNFLGdCQUFnQixlQUFlLENBQUMsU0FBUyxHQUFHLGdCQUFlO0lBQzNELGdCQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUM7QUFDM0U7SUFDQTtJQUNBLGdCQUFnQixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBQztJQUN0RSxnQkFBZ0IsYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0lBQ2hGLGdCQUFnQixRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUM7SUFDcEUsZ0JBQWdCLE9BQU8sR0FBRTtJQUN6QixhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEtBQUs7SUFDaEMsZ0JBQWdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFDO0lBQzNFLGdCQUFnQixPQUFPLEdBQUU7SUFDekIsYUFBYSxDQUFDO0lBQ2QsU0FBUyxDQUFDO0lBQ1YsS0FBSyxFQUFDO0lBQ04sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFDO0lBQ3hFLElBQUksT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0lBQzNDOztJQ3pEQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ2UsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7SUFDbEQsSUFBSSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUk7SUFDN0MsUUFBUSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sT0FBTyxLQUFLO0lBQzlDLFlBQVksT0FBTyxJQUFJLEVBQUU7SUFDekIsZ0JBQWdCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0lBQ3BDLG9CQUFvQixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFDO0lBQzNDLG9CQUFvQixNQUFNO0lBQzFCLGlCQUFpQixNQUFNO0lBQ3ZCLG9CQUFvQixNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO0lBQ3pDLGlCQUFpQjtJQUNqQixhQUFhO0FBQ2I7SUFDQSxTQUFTLENBQUM7SUFDVixLQUFLLENBQUMsQ0FBQztJQUNQOztJQ25CQTtJQUNBO0lBQ0E7SUFDQTtJQUNlLFNBQVMsa0JBQWtCLEVBQUU7SUFDNUMsSUFBSSxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFFO0lBQ2pELElBQUksSUFBSSxFQUFFLEdBQUcsb0JBQW9CO0lBQ2pDLElBQUksUUFBUSxHQUFHLEtBQUs7SUFDcEIsSUFBSSxNQUFNLEdBQUcsVUFBVSxHQUFHLEVBQUUsRUFBRSxPQUFPLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3pGLElBQUksSUFBSSxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2QixJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFDaEMsT0FBTyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRTtJQUM5QyxLQUNBLElBQUksT0FBTyxNQUFNLENBQUM7SUFDbEI7SUFDQTs7SUNmQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDZSxTQUFTLG9CQUFvQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7SUFDOUQsSUFBSSxJQUFJLFVBQVUsR0FBRyxJQUFJLEVBQUUsV0FBVyxHQUFHLEtBQUk7SUFDN0MsSUFBSSxPQUFPLEVBQUUsVUFBVSxJQUFJLFVBQVUsQ0FBQyxTQUFTLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRTtJQUM5RixRQUFRLElBQUksV0FBVyxDQUFDLFVBQVUsRUFBRTtJQUNwQyxZQUFZLFdBQVcsR0FBRyxXQUFVO0lBQ3BDLFlBQVksVUFBVSxHQUFHLFdBQVcsQ0FBQyxXQUFVO0lBQy9DLFNBQVMsTUFBTTtJQUNmLFlBQVksT0FBTyxJQUFJO0lBQ3ZCLFNBQVM7QUFDVDtJQUNBLEtBQUs7SUFDTCxJQUFJLE9BQU8sVUFBVTtJQUNyQjs7Ozs7Ozs7Ozs7SUNmQSxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0I7Ozs7OzsifQ==
