var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone = {};
  for (const key in obj) {
    clone[key.toLowerCase()] = obj[key];
  }
  return clone;
}
function error$1(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error$1(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error$1(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
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
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
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
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
const s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
const s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
const absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
class ReadOnlyFormData {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of __privateGet(this, _map))
      yield key;
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
}
_map = new WeakMap();
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var root_svelte_svelte_type_style_lang = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$2 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$2);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
let base = "";
let assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
let options = null;
const default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-272f8817.js",
      css: [assets + "/_app/assets/start-61d1577b.css"],
      js: [assets + "/_app/start-272f8817.js", assets + "/_app/chunks/vendor-09e7e79c.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
const empty = () => ({});
const manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }],
  layout: ".svelte-kit/build/components/layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: [".svelte-kit/build/components/layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/callback\/?$/,
      params: empty,
      a: [".svelte-kit/build/components/layout.svelte", "src/routes/callback.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    }
  ]
};
const get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
  externalFetch: hooks.externalFetch || fetch
});
const module_lookup = {
  ".svelte-kit/build/components/layout.svelte": () => Promise.resolve().then(function() {
    return layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/callback.svelte": () => Promise.resolve().then(function() {
    return callback;
  })
};
const metadata_lookup = { ".svelte-kit/build/components/layout.svelte": { "entry": "layout.svelte-189aae29.js", "css": [], "js": ["layout.svelte-189aae29.js", "chunks/vendor-09e7e79c.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-7552ece2.js", "css": [], "js": ["error.svelte-7552ece2.js", "chunks/vendor-09e7e79c.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-25690570.js", "css": ["assets/pages/index.svelte-d547bbe8.css"], "js": ["pages/index.svelte-25690570.js", "chunks/vendor-09e7e79c.js"], "styles": [] }, "src/routes/callback.svelte": { "entry": "pages/callback.svelte-e3bcc007.js", "css": ["assets/pages/callback.svelte-f219dbf1.css"], "js": ["pages/callback.svelte-e3bcc007.js", "chunks/vendor-09e7e79c.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``}`;
});
var layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Layout
});
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error2 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load
});
var client_id = "afa9997612b7433cbe97f0ec4858f90d";
var redirect_uri = "http://localhost:3000/callback";
var index_svelte_svelte_type_style_lang = ".logo.svelte-1tugjtz{left:35%;position:relative;top:55%;max-width:33%;height:auto}.text.svelte-1tugjtz{color:white;-webkit-text-stroke:2px black;font-family:monospace;text-align:center;font-size:17 px}.glow-on-hover.svelte-1tugjtz{text-decoration:none;padding:20px;font-family:monospace;width:220px;height:50px;color:white;background:green;cursor:pointer;position:relative;z-index:0;border-radius:10px;left:29%}.glow-on-hover.svelte-1tugjtz:before{content:'';background:linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);position:absolute;top:-2px;left:-2px;background-size:400%;z-index:-1;filter:blur(5px);width:calc(100% + 4px);height:calc(100% + 4px);animation:svelte-1tugjtz-glowing 20s linear infinite;opacity:0;transition:opacity .3s ease-in-out;border-radius:10px}.glow-on-hover.svelte-1tugjtz:active{color:#000\n}.glow-on-hover.svelte-1tugjtz:active:after{background:transparent}.glow-on-hover.svelte-1tugjtz:hover:before{opacity:1}.glow-on-hover.svelte-1tugjtz:after{z-index:-1;content:'';position:absolute;width:100%;height:100%;background:#111;left:0;top:0;border-radius:10px}@keyframes svelte-1tugjtz-glowing{0%{background-position:0 0}50%{background-position:400% 0}100%{background-position:0 0}}";
const css$1 = {
  code: ".logo.svelte-1tugjtz{left:35%;position:relative;top:55%;max-width:33%;height:auto}.text.svelte-1tugjtz{color:white;-webkit-text-stroke:2px black;font-family:monospace;text-align:center;font-size:17 px}.glow-on-hover.svelte-1tugjtz{text-decoration:none;padding:20px;font-family:monospace;width:220px;height:50px;color:white;background:green;cursor:pointer;position:relative;z-index:0;border-radius:10px;left:29%}.glow-on-hover.svelte-1tugjtz:before{content:'';background:linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);position:absolute;top:-2px;left:-2px;background-size:400%;z-index:-1;filter:blur(5px);width:calc(100% + 4px);height:calc(100% + 4px);animation:svelte-1tugjtz-glowing 20s linear infinite;opacity:0;transition:opacity .3s ease-in-out;border-radius:10px}.glow-on-hover.svelte-1tugjtz:active{color:#000\n}.glow-on-hover.svelte-1tugjtz:active:after{background:transparent}.glow-on-hover.svelte-1tugjtz:hover:before{opacity:1}.glow-on-hover.svelte-1tugjtz:after{z-index:-1;content:'';position:absolute;width:100%;height:100%;background:#111;left:0;top:0;border-radius:10px}@keyframes svelte-1tugjtz-glowing{0%{background-position:0 0}50%{background-position:400% 0}100%{background-position:0 0}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["\\n<script>\\nimport {client_id, client_secret, redirect_uri} from '../../secrets.js'\\n\\nvar scopes = 'user-read-private user-read-email user-library-read';\\nvar url = 'https://accounts.spotify.com/authorize' +\\n  '?response_type=token' +\\n  '&client_id=' + client_id +\\n  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +\\n  '&redirect_uri=' + encodeURIComponent(redirect_uri) + '&state=123';\\n// function handleClick(){\\n//     location.href = 'https://accounts.spotify.com/authorize' +\\n//   '?response_type=code' +\\n//   '&client_id=' + client_id +\\n//   (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +\\n//   '&redirect_uri=' + encodeURIComponent(redirect_uri);\\n// }\\n\\n<\/script>\\n<body>\\n<div class=\\"container\\">\\n<h1 class=\\"text\\">Welcome to the Soundsthetic Generator</h1>\\n<img src=\\"../../assets/sounsthetic.png\\" alt=\\"soundsthetic logo\\" class=\\"logo\\">\\n<br><br><br>\\n<a class=\\"glow-on-hover button\\" href={url}>Log in with Spotify</a>\\n</div>\\n</body>\\n<style>\\n\\n    \\n.logo{\\n    left: 35%;\\n    position: relative; \\n    top:55%;\\n    max-width: 33%;\\n    height: auto;\\n}\\n.container {\\n\\n}\\n.text{\\n    \\n  color: white;\\n  -webkit-text-stroke: 2px black;\\n  font-family: monospace;\\n  \\n  text-align: center;\\n  font-size: 17 px;\\n\\n}\\n.glow-on-hover {\\n    \\n    text-decoration: none;\\n    padding: 20px;\\n    font-family: monospace;\\n    width: 220px;\\n    height: 50px;\\n    \\n    color: white;\\n    background: green;\\n    cursor: pointer;\\n    position: relative;\\n    z-index: 0;\\n    border-radius: 10px;\\n    left: 29%;\\n    \\n}\\n\\n.glow-on-hover:before {\\n    content: '';\\n    background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);\\n    position: absolute;\\n    top: -2px;\\n    left:-2px;\\n    background-size: 400%;\\n    z-index: -1;\\n    filter: blur(5px);\\n    width: calc(100% + 4px);\\n    height: calc(100% + 4px);\\n    animation: glowing 20s linear infinite;\\n    opacity: 0;\\n    transition: opacity .3s ease-in-out;\\n    border-radius: 10px;\\n}\\n\\n.glow-on-hover:active {\\n    color: #000\\n}\\n\\n.glow-on-hover:active:after {\\n    background: transparent;\\n}\\n\\n.glow-on-hover:hover:before {\\n    opacity: 1;\\n}\\n\\n.glow-on-hover:after {\\n    z-index: -1;\\n    content: '';\\n    position: absolute;\\n    width: 100%;\\n    height: 100%;\\n    background: #111;\\n    left: 0;\\n    top: 0;\\n    border-radius: 10px;\\n}\\n\\n@keyframes glowing {\\n    0% { background-position: 0 0; }\\n    50% { background-position: 400% 0; }\\n    100% { background-position: 0 0; }\\n}\\n</style>"],"names":[],"mappings":"AA8BA,oBAAK,CAAC,AACF,IAAI,CAAE,GAAG,CACT,QAAQ,CAAE,QAAQ,CAClB,IAAI,GAAG,CACP,SAAS,CAAE,GAAG,CACd,MAAM,CAAE,IAAI,AAChB,CAAC,AAID,oBAAK,CAAC,AAEJ,KAAK,CAAE,KAAK,CACZ,mBAAmB,CAAE,GAAG,CAAC,KAAK,CAC9B,WAAW,CAAE,SAAS,CAEtB,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,EAAE,CAAC,EAAE,AAElB,CAAC,AACD,cAAc,eAAC,CAAC,AAEZ,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,SAAS,CACtB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CAEZ,KAAK,CAAE,KAAK,CACZ,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,OAAO,CACf,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CACV,aAAa,CAAE,IAAI,CACnB,IAAI,CAAE,GAAG,AAEb,CAAC,AAED,6BAAc,OAAO,AAAC,CAAC,AACnB,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,gBAAgB,KAAK,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CACnH,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,IAAI,CACT,KAAK,IAAI,CACT,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,KAAK,GAAG,CAAC,CACjB,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACxB,SAAS,CAAE,sBAAO,CAAC,GAAG,CAAC,MAAM,CAAC,QAAQ,CACtC,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,OAAO,CAAC,GAAG,CAAC,WAAW,CACnC,aAAa,CAAE,IAAI,AACvB,CAAC,AAED,6BAAc,OAAO,AAAC,CAAC,AACnB,KAAK,CAAE,IAAI;AACf,CAAC,AAED,6BAAc,OAAO,MAAM,AAAC,CAAC,AACzB,UAAU,CAAE,WAAW,AAC3B,CAAC,AAED,6BAAc,MAAM,OAAO,AAAC,CAAC,AACzB,OAAO,CAAE,CAAC,AACd,CAAC,AAED,6BAAc,MAAM,AAAC,CAAC,AAClB,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,IAAI,CAChB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,aAAa,CAAE,IAAI,AACvB,CAAC,AAED,WAAW,sBAAQ,CAAC,AAChB,EAAE,AAAC,CAAC,AAAC,mBAAmB,CAAE,CAAC,CAAC,CAAC,AAAE,CAAC,AAChC,GAAG,AAAC,CAAC,AAAC,mBAAmB,CAAE,IAAI,CAAC,CAAC,AAAE,CAAC,AACpC,IAAI,AAAC,CAAC,AAAC,mBAAmB,CAAE,CAAC,CAAC,CAAC,AAAE,CAAC,AACtC,CAAC"}`
};
var scopes = "user-read-private user-read-email user-library-read";
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var url = "https://accounts.spotify.com/authorize?response_type=token&client_id=" + client_id + ("&scope=" + encodeURIComponent(scopes)) + "&redirect_uri=" + encodeURIComponent(redirect_uri) + "&state=123";
  $$result.css.add(css$1);
  return `<body><div class="${"container svelte-1tugjtz"}"><h1 class="${"text svelte-1tugjtz"}">Welcome to the Soundsthetic Generator</h1>
<img src="${"../../assets/sounsthetic.png"}" alt="${"soundsthetic logo"}" class="${"logo svelte-1tugjtz"}">
<br><br><br>
<a class="${"glow-on-hover button svelte-1tugjtz"}"${add_attribute("href", url, 0)}>Log in with Spotify</a></div>
</body>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
var callback_svelte_svelte_type_style_lang = ".logo.svelte-md749j.svelte-md749j{left:50%;position:absolute;top:55%;max-width:33%;height:auto;transform:translate(-50%, -50%)}.text.svelte-md749j.svelte-md749j{inline-size:auto;line-height:normal !important;color:white;-webkit-text-stroke:2px black;margin-bottom:0px;font-family:monospace;position:absolute;text-align:center;font-size:17 px;top:32%;left:50%;transform:translate(-50%, -50%)}.rainbow.svelte-md749j.svelte-md749j{margin-top:0;font-family:monospace;text-shadow:2px 2px 4px #000000;font-size:40px;-webkit-animation:svelte-md749j-rainbow 5s infinite;-ms-animation:svelte-md749j-rainbow 5s infinite;animation:svelte-md749j-rainbow 5s infinite}@-webkit-keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}@-ms-keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}@keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}#photos.svelte-md749j.svelte-md749j{padding:0;margin-top:-2%;margin-right:-2%;margin-left:-2%;line-height:0;-webkit-column-count:4;-webkit-column-gap:0px;-moz-column-count:4;-moz-column-gap:0px;column-count:4;column-gap:0px}#photos.svelte-md749j img.svelte-md749j{width:100% !important;height:auto !important}";
const css = {
  code: ".logo.svelte-md749j.svelte-md749j{left:50%;position:absolute;top:55%;max-width:33%;height:auto;transform:translate(-50%, -50%)}.text.svelte-md749j.svelte-md749j{inline-size:auto;line-height:normal !important;color:white;-webkit-text-stroke:2px black;margin-bottom:0px;font-family:monospace;position:absolute;text-align:center;font-size:17 px;top:32%;left:50%;transform:translate(-50%, -50%)}@import url(https://fonts.googleapis.com/css?family=Pacifico);@import url('https://fonts.googleapis.com/css?family=Anton');.rainbow.svelte-md749j.svelte-md749j{margin-top:0;font-family:monospace;text-shadow:2px 2px 4px #000000;font-size:40px;-webkit-animation:svelte-md749j-rainbow 5s infinite;-ms-animation:svelte-md749j-rainbow 5s infinite;animation:svelte-md749j-rainbow 5s infinite}@-webkit-keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}@-ms-keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}@keyframes svelte-md749j-rainbow{0%{color:orange}10%{color:purple}20%{color:red}30%{color:CadetBlue}40%{color:yellow}50%{color:coral}60%{color:green}70%{color:cyan}80%{color:DeepPink}90%{color:DodgerBlue}100%{color:orange}}#photos.svelte-md749j.svelte-md749j{padding:0;margin-top:-2%;margin-right:-2%;margin-left:-2%;line-height:0;-webkit-column-count:4;-webkit-column-gap:0px;-moz-column-count:4;-moz-column-gap:0px;column-count:4;column-gap:0px}#photos.svelte-md749j img.svelte-md749j{width:100% !important;height:auto !important}",
  map: `{"version":3,"file":"callback.svelte","sources":["callback.svelte"],"sourcesContent":["<script>\\r\\n    import { page } from '$app/stores'\\r\\n    import {client_id, client_secret, redirect_uri} from '../../secrets.js'\\r\\n   \\r\\n    // const access_token = $page.query.get('access_token')\\r\\n    import {onMount} from 'svelte'\\r\\nimport { text } from 'svelte/internal';\\r\\n    let access_token =null;\\r\\n    let ret = null;\\r\\n    let user = null;\\r\\n    let albumArt, albumName, albumsdata, user_name;\\r\\n    let albums = []\\r\\n\\r\\n    function saveAlbumInfo(data, response){\\r\\n        response = data;\\r\\n       // return response;\\r\\n    }\\r\\n\\r\\n    onMount(async ()=>{\\r\\n        var hash = window.location.hash.substring(1);\\r\\n    var accessString = hash.indexOf(\\"&\\");\\r\\n\\r\\n    /* 13 because that bypasses 'access_token' string */\\r\\n    access_token = hash.substring(13, accessString);\\r\\n\\r\\n\\r\\n    const res = await fetch(\\"https://api.spotify.com/v1/me/albums?limit=24&offset=5&market=US\\", {\\r\\n    headers: {\\r\\n    Accept: \\"application/json\\",\\r\\n    Authorization: \\"Bearer \\" + access_token,\\r\\n    \\"Content-Type\\": \\"application/json\\"\\r\\n  }\\r\\n    })\\r\\n    const userdata = await fetch(\\"https://api.spotify.com/v1/me\\", {\\r\\n    headers: {\\r\\n    Accept: \\"application/json\\",\\r\\n    Authorization: \\"Bearer \\" + access_token,\\r\\n    \\"Content-Type\\": \\"application/json\\"\\r\\n  }\\r\\n    })\\r\\n\\r\\n    ret = await res.json();\\r\\n    user = await userdata.json();\\r\\n    user_name = user.display_name;\\r\\n    \\r\\n    \\r\\n    albumName = ret.items[0].album.name;\\r\\n   albumArt = ret.items[0].album.images[0].url;\\r\\n   //saveAlbumInfo(ret, ret);\\r\\nconsole.log(\\"here it is: \\"+ret.items[0])\\r\\nconsole.log(albumArt)\\r\\n\\r\\nalbumsdata = ret.items\\r\\n\\r\\nfor(let album of albumsdata){\\r\\n    //console.log(album.album.images[0].url)\\r\\n    albums.push({'url':album.album.images[0].url})\\r\\n}\\r\\n    albums = albums\\r\\nconsole.log(albums)\\r\\n   \\r\\n    // console.log(\\"Access Token: \\" + access_token);\\r\\n})\\r\\n   \\r\\n  \\r\\n   \\r\\n\\r\\n\\r\\n\\r\\n<\/script>\\r\\n\\r\\n\\r\\n\\r\\n\\r\\n<div id=\\"photos\\" style=\\"position: relative;\\">\\r\\n{#each albums as {url}}\\r\\n<img src={url} alt=\\"arts\\">\\r\\n{/each}\\r\\n\\r\\n<div class=\\"text\\">\\r\\n    \\r\\n    <h1>I'm {user_name} and this is my</h1>\\r\\n    <h1 class=\\"rainbow\\">Soundsthetic</h1>\\r\\n    \\r\\n</div>\\r\\n<img src=\\"../../assets/sounsthetic.png\\" alt=\\"soundsthetic logo\\" class=\\"logo\\">\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n.logo{\\r\\n\\r\\n    left: 50%;\\r\\n    position: absolute; \\r\\n    top:55%;\\r\\n    max-width: 33%;\\r\\n    height: auto;\\r\\n    transform: translate(-50%, -50%);\\r\\n}\\r\\n\\r\\n.text{\\r\\n    inline-size: auto;\\r\\n    line-height: normal !important;\\r\\n  color: white;\\r\\n  -webkit-text-stroke: 2px black;\\r\\n  margin-bottom: 0px;\\r\\n  font-family: monospace;\\r\\n  position: absolute; \\r\\n  text-align: center;\\r\\n  font-size: 17 px;\\r\\n  top: 32%;\\r\\n  left: 50%;\\r\\n  transform: translate(-50%, -50%);\\r\\n}\\r\\n@import url(https://fonts.googleapis.com/css?family=Pacifico);\\r\\n@import url('https://fonts.googleapis.com/css?family=Anton');\\r\\n\\r\\n\\r\\n.rainbow {\\r\\n  margin-top:0;\\r\\n   /* Font options */\\r\\n  font-family: monospace;\\r\\n  text-shadow: 2px 2px 4px #000000;\\r\\n  font-size:40px;\\r\\n  \\r\\n   /* Chrome, Safari, Opera */\\r\\n  -webkit-animation: rainbow 5s infinite; \\r\\n  \\r\\n  /* Internet Explorer */\\r\\n  -ms-animation: rainbow 5s infinite;\\r\\n  \\r\\n  /* Standar Syntax */\\r\\n  animation: rainbow 5s infinite; \\r\\n}\\r\\n\\r\\n/* Chrome, Safari, Opera */\\r\\n@-webkit-keyframes rainbow{\\r\\n  0%{color: orange;}\\t\\r\\n  10%{color: purple;}\\t\\r\\n\\t20%{color: red;}\\r\\n  30%{color: CadetBlue;}\\r\\n\\t40%{color: yellow;}\\r\\n  50%{color: coral;}\\r\\n\\t60%{color: green;}\\r\\n  70%{color: cyan;}\\r\\n  80%{color: DeepPink;}\\r\\n  90%{color: DodgerBlue;}\\r\\n\\t100%{color: orange;}\\r\\n}\\r\\n\\r\\n/* Internet Explorer */\\r\\n@-ms-keyframes rainbow{\\r\\n   0%{color: orange;}\\t\\r\\n  10%{color: purple;}\\t\\r\\n\\t20%{color: red;}\\r\\n  30%{color: CadetBlue;}\\r\\n\\t40%{color: yellow;}\\r\\n  50%{color: coral;}\\r\\n\\t60%{color: green;}\\r\\n  70%{color: cyan;}\\r\\n  80%{color: DeepPink;}\\r\\n  90%{color: DodgerBlue;}\\r\\n\\t100%{color: orange;}\\r\\n}\\r\\n\\r\\n/* Standar Syntax */\\r\\n@keyframes rainbow{\\r\\n    0%{color: orange;}\\t\\r\\n  10%{color: purple;}\\t\\r\\n\\t20%{color: red;}\\r\\n  30%{color: CadetBlue;}\\r\\n\\t40%{color: yellow;}\\r\\n  50%{color: coral;}\\r\\n\\t60%{color: green;}\\r\\n  70%{color: cyan;}\\r\\n  80%{color: DeepPink;}\\r\\n  90%{color: DodgerBlue;}\\r\\n\\t100%{color: orange;}\\r\\n}\\r\\n#photos {\\r\\n  /* Prevent vertical gaps */\\r\\n  padding:0;\\r\\n  margin-top: -2%;\\r\\n  margin-right: -2%;\\r\\n  margin-left: -2%;\\r\\n  line-height: 0;\\r\\n  -webkit-column-count: 4;\\r\\n  -webkit-column-gap:   0px;\\r\\n  -moz-column-count:    4;\\r\\n  -moz-column-gap:      0px;\\r\\n  column-count:         4;\\r\\n  column-gap:           0px;  \\r\\n}\\r\\n\\r\\n#photos img {\\r\\n  /* Just in case there are inline attributes */\\r\\n  \\r\\n  width: 100% !important;\\r\\n  height: auto !important;\\r\\n  \\r\\n}\\r\\n    \\r\\n</style>"],"names":[],"mappings":"AAyFA,iCAAK,CAAC,AAEF,IAAI,CAAE,GAAG,CACT,QAAQ,CAAE,QAAQ,CAClB,IAAI,GAAG,CACP,SAAS,CAAE,GAAG,CACd,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,UAAU,IAAI,CAAC,CAAC,IAAI,CAAC,AACpC,CAAC,AAED,iCAAK,CAAC,AACF,WAAW,CAAE,IAAI,CACjB,WAAW,CAAE,MAAM,CAAC,UAAU,CAChC,KAAK,CAAE,KAAK,CACZ,mBAAmB,CAAE,GAAG,CAAC,KAAK,CAC9B,aAAa,CAAE,GAAG,CAClB,WAAW,CAAE,SAAS,CACtB,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,EAAE,CAAC,EAAE,CAChB,GAAG,CAAE,GAAG,CACR,IAAI,CAAE,GAAG,CACT,SAAS,CAAE,UAAU,IAAI,CAAC,CAAC,IAAI,CAAC,AAClC,CAAC,AACD,QAAQ,IAAI,gDAAgD,CAAC,CAAC,AAC9D,QAAQ,IAAI,+CAA+C,CAAC,CAAC,AAG7D,QAAQ,4BAAC,CAAC,AACR,WAAW,CAAC,CAEZ,WAAW,CAAE,SAAS,CACtB,WAAW,CAAE,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,OAAO,CAChC,UAAU,IAAI,CAGd,iBAAiB,CAAE,qBAAO,CAAC,EAAE,CAAC,QAAQ,CAGtC,aAAa,CAAE,qBAAO,CAAC,EAAE,CAAC,QAAQ,CAGlC,SAAS,CAAE,qBAAO,CAAC,EAAE,CAAC,QAAQ,AAChC,CAAC,AAGD,mBAAmB,qBAAO,CAAC,AACzB,EAAE,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AAClB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACpB,GAAG,CAAC,KAAK,CAAE,GAAG,AAAC,CAAC,AACf,GAAG,CAAC,KAAK,CAAE,SAAS,AAAC,CAAC,AACvB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AAClB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACnB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,IAAI,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,QAAQ,AAAC,CAAC,AACrB,GAAG,CAAC,KAAK,CAAE,UAAU,AAAC,CAAC,AACxB,IAAI,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACrB,CAAC,AAGD,eAAe,qBAAO,CAAC,AACpB,EAAE,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACnB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACpB,GAAG,CAAC,KAAK,CAAE,GAAG,AAAC,CAAC,AACf,GAAG,CAAC,KAAK,CAAE,SAAS,AAAC,CAAC,AACvB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AAClB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACnB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,IAAI,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,QAAQ,AAAC,CAAC,AACrB,GAAG,CAAC,KAAK,CAAE,UAAU,AAAC,CAAC,AACxB,IAAI,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACrB,CAAC,AAGD,WAAW,qBAAO,CAAC,AACf,EAAE,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACpB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACpB,GAAG,CAAC,KAAK,CAAE,GAAG,AAAC,CAAC,AACf,GAAG,CAAC,KAAK,CAAE,SAAS,AAAC,CAAC,AACvB,GAAG,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AAClB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACnB,GAAG,CAAC,KAAK,CAAE,KAAK,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,IAAI,AAAC,CAAC,AACjB,GAAG,CAAC,KAAK,CAAE,QAAQ,AAAC,CAAC,AACrB,GAAG,CAAC,KAAK,CAAE,UAAU,AAAC,CAAC,AACxB,IAAI,CAAC,KAAK,CAAE,MAAM,AAAC,CAAC,AACrB,CAAC,AACD,OAAO,4BAAC,CAAC,AAEP,QAAQ,CAAC,CACT,UAAU,CAAE,GAAG,CACf,YAAY,CAAE,GAAG,CACjB,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,CAAC,CACd,oBAAoB,CAAE,CAAC,CACvB,kBAAkB,CAAI,GAAG,CACzB,iBAAiB,CAAK,CAAC,CACvB,eAAe,CAAO,GAAG,CACzB,YAAY,CAAU,CAAC,CACvB,UAAU,CAAY,GAAG,AAC3B,CAAC,AAED,qBAAO,CAAC,GAAG,cAAC,CAAC,AAGX,KAAK,CAAE,IAAI,CAAC,UAAU,CACtB,MAAM,CAAE,IAAI,CAAC,UAAU,AAEzB,CAAC"}`
};
const Callback = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let user_name;
  let albums = [];
  $$result.css.add(css);
  return `<div id="${"photos"}" style="${"position: relative;"}" class="${"svelte-md749j"}">${each(albums, ({ url }) => `<img${add_attribute("src", url, 0)} alt="${"arts"}" class="${"svelte-md749j"}">`)}

<div class="${"text svelte-md749j"}"><h1>I&#39;m ${escape(user_name)} and this is my</h1>
    <h1 class="${"rainbow svelte-md749j"}">Soundsthetic</h1></div>
<img src="${"../../assets/sounsthetic.png"}" alt="${"soundsthetic logo"}" class="${"logo svelte-md749j"}">
</div>`;
});
var callback = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Callback
});
export { init, render };
