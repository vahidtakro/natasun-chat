(function () {
  "use strict";

  // -------- Configuration from script tag data attributes --------
  var script = document.currentScript;
  var domain = (script && script.getAttribute("data-domain")) || window.location.hostname.replace(/^www\./, "");
  var baseUrl = (script && script.getAttribute("data-base-url")) || "http://localhost:3000";
  var wsUrl = (script && script.getAttribute("data-ws-url")) || "http://localhost:3001";
  var primaryColor = (script && script.getAttribute("data-color")) || "#00A76F";

  if (window.__natasunChatLoaded) return;
  window.__natasunChatLoaded = true;

  window.NatasunChat = { config: { domain: domain, baseUrl: baseUrl, wsUrl: wsUrl, primaryColor: primaryColor } };

  // -------- State --------
  var state = {
    open: false,
    initialized: false,
    socket: null,
    website: null,
    visitor: null,
    conversation: null,
    messages: [],
  };

  // Prepend base URL without trailing slash
  baseUrl = baseUrl.replace(/\/$/, "");
  wsUrl = wsUrl.replace(/\/$/, "");

  // -------- Styles --------
  var styles = "#natasun-chat-root *,#natasun-chat-root *:before,#natasun-chat-root *:after{box-sizing:border-box;margin:0;padding:0}" +
    "#natasun-chat-root{position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#212B36;line-height:1.5}" +
    "#nc-launcher{width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:transform .18s ease,box-shadow .18s ease}" +
    "#nc-launcher:hover{transform:scale(1.06);box-shadow:0 12px 28px rgba(0,0,0,.24)}" +
    "#nc-launcher svg{width:28px;height:28px;fill:#fff}" +
    "#nc-launcher .nc-close{display:none;width:22px;height:22px;fill:#fff}" +
    "#nc-launcher.nc-open .nc-chat{display:none}#nc-launcher.nc-open .nc-close{display:block}" +
    "#nc-window{position:absolute;bottom:80px;right:0;width:380px;max-width:calc(100vw - 40px);height:600px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.2);display:none;flex-direction:column;overflow:hidden;transform:translateY(12px);opacity:0;transition:transform .22s ease,opacity .22s ease}" +
    "#nc-window.nc-visible{display:flex;transform:translateY(0);opacity:1}" +
    "#nc-header{display:flex;align-items:center;gap:12px;padding:16px;color:#fff}" +
    "#nc-header .nc-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0}" +
    "#nc-header .nc-title{font-weight:700;font-size:16px}" +
    "#nc-header .nc-status{font-size:12px;opacity:.9;display:flex;align-items:center;gap:5px}" +
    "#nc-header .nc-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;box-shadow:0 0 0 3px rgba(74,222,128,.25)}" +
    "#nc-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F6F7F9}" +
    "#nc-body .nc-welcome{text-align:center;color:#637381;font-size:13px;padding:8px 0}" +
    ".nc-msg{max-width:78%;padding:10px 14px;border-radius:16px;font-size:14px;word-break:break-word;white-space:pre-wrap;animation:ncIn .2s ease}" +
    ".nc-msg.nc-agent{background:#00A76F;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}" +
    ".nc-msg.nc-visitor{background:#fff;color:#212B36;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,.06);border:1px solid rgba(145,158,171,.16)}" +
    ".nc-msg .nc-time{display:block;font-size:10px;opacity:.7;margin-top:4px;text-align:right}" +
    "@keyframes ncIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
    "#nc-input-bar{display:flex;align-items:flex-end;gap:8px;padding:12px;border-top:1px solid rgba(145,158,171,.16);background:#fff}" +
    "#nc-input{flex:1;border:1px solid rgba(145,158,171,.3);border-radius:20px;padding:10px 14px;font-size:14px;outline:none;font-family:inherit;resize:none;max-height:96px;color:#212B36;background:#F6F7F9}" +
    "#nc-input:focus{border-color:" + primaryColor + ";background:#fff}" +
    "#nc-send{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}" +
    "#nc-send svg{width:18px;height:18px;fill:#fff}" +
    "#nc-send:disabled{opacity:.5;cursor:not-allowed}" +
    ".nc-loading{text-align:center;color:#919EAB;font-size:12px;padding:4px}" +
    "#nc-typing{font-size:12px;color:#919EAB;padding:2px 4px;align-self:flex-start;display:none}.nc-typing-dot{animation:ncBlink 1.2s infinite}@keyframes ncBlink{0%,80%,100%{opacity:.2}40%{opacity:1}}" +
    "@media(max-width:500px){#natasun-chat-root{right:12px;bottom:12px}#nc-window{width:calc(100vw - 24px);max-height:calc(100vh - 100px)}}";

  var css = document.createElement("style");
  css.textContent = styles;
  document.head.appendChild(css);

  // -------- Root elements --------
  var root = document.createElement("div");
  root.id = "natasun-chat-root";
  document.body.appendChild(root);

  // -------- Launcher --------
  var launcher = document.createElement("button");
  launcher.id = "nc-launcher";
  launcher.style.background = primaryColor;
  launcher.innerHTML =
    '<svg class="nc-chat" viewBox="0 0 24 24"><path d="M12 3C6.486 3 2 6.804 2 11.5c0 2.53 1.198 4.797 3.156 6.387-.045 1.337-.553 2.843-1.531 4.113-.21.243-.065.646.254.707.99.185 2.103-.024 3.374-.784.804.224 1.66.344 2.551.344 5.514 0 10-3.804 10-8.5S17.514 3 12 3zm-5.5 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5.5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>' +
    '<svg class="nc-close" viewBox="0 0 24 24"><path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/></svg>';
  root.appendChild(launcher);

  // -------- Window --------
  var window_ = document.createElement("div");
  window_.id = "nc-window";
  root.appendChild(window_);

  var header = document.createElement("div");
  header.id = "nc-header";
  header.style.background = primaryColor;
  header.innerHTML =
    '<div class="nc-avatar">S</div>' +
    '<div><div class="nc-title">Support</div>' +
    '<div class="nc-status"><span class="nc-dot"></span><span id="nc-status-text">Online</span></div></div>';
  window_.appendChild(header);

  var body = document.createElement("div");
  body.id = "nc-body";
  body.innerHTML = '<div class="nc-loading">Connecting…</div>';
  window_.appendChild(body);

  var inputBar = document.createElement("div");
  inputBar.id = "nc-input-bar";
  inputBar.innerHTML =
    '<textarea id="nc-input" rows="1" placeholder="Type your message…"></textarea>' +
    '<button id="nc-send" disabled><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>';
  window_.appendChild(inputBar);

  var input = document.getElementById("nc-input");
  var send = document.getElementById("nc-send");

  // -------- Typing indicator element --------
  var typingEl = document.createElement("div");
  typingEl.id = "nc-typing";
  typingEl.innerHTML = 'Agent is typing<span class="nc-typing-dot">.</span><span class="nc-typing-dot">.</span><span class="nc-typing-dot">.</span>';
  body.appendChild(typingEl);

  // Replace body content but keep the typing indicator as a child, so
  // message insertion (insertBefore wrap, typingEl) never fails.
  function setBodyContent(html) {
    body.innerHTML = html;
    if (!body.contains(typingEl)) body.appendChild(typingEl);
  }

  // -------- Helpers --------
  function formatTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function addMessage(msg) {
    // Ignore exact duplicates (e.g. our own optimistic message echoed back).
    for (var i = 0; i < state.messages.length; i++) {
      if (state.messages[i].id === msg.id) return;
    }
    // Replace an optimistic ("temp") placeholder with the server-confirmed
    // message that has the same content and sender, instead of adding a copy.
    if (msg.id && String(msg.id).indexOf("temp") === -1) {
      for (var j = 0; j < state.messages.length; j++) {
        var prev = state.messages[j];
        if (String(prev.id).indexOf("temp") === 0 && prev.content === msg.content && prev.isAgent === msg.isAgent) {
          var oldEls = body.querySelectorAll(".nc-msg.nc-visitor");
          var toRemove = null;
          for (var k = 0; k < oldEls.length; k++) {
            if (oldEls[k].textContent === msg.content) { toRemove = oldEls[k]; break; }
          }
          if (toRemove) toRemove.remove();
          state.messages.splice(j, 1);
          break;
        }
      }
    }
    var wrap = document.createElement("div");
    wrap.className = "nc-msg " + (msg.isAgent ? "nc-agent" : "nc-visitor");
    wrap.style.background = msg.isAgent ? primaryColor : undefined;
    wrap.textContent = msg.content;
    var time = document.createElement("span");
    time.className = "nc-time";
    time.textContent = formatTime(msg.createdAt);
    wrap.appendChild(time);
    if (!body.contains(typingEl)) body.appendChild(typingEl);
    body.insertBefore(wrap, typingEl);
    body.scrollTop = body.scrollHeight;
    state.messages.push(msg);
  }

  function showOnline(count) {
    var el = document.getElementById("nc-status-text");
    if (count > 0) {
      el.textContent = "Online";
      el.parentNode.querySelector(".nc-dot").style.background = "#4ade80";
    } else {
      el.textContent = "Away — we'll reply soon";
      el.parentNode.querySelector(".nc-dot").style.background = "#fbbf24";
    }
  }

  function initSocket() {
    if (state.socket) return;
    if (!window.io) {
      setBodyContent('<div class="nc-loading">Could not load chat. Please refresh.</div>');
      return;
    }
    var socket = window.io(wsUrl, { transports: ["websocket", "polling"] });
    state.socket = socket;

    socket.on("connect", function () {
      setBodyContent('<div class="nc-welcome">👋 Welcome! How can we help you today?</div>');
      socket.emit("visitor:auth", {
        websiteId: state.website.id,
        visitorId: state.visitor.id,
        conversationId: state.conversation.id,
      }, function (res) {
        if (res && res.ok) socket.emit("conversation:open", { conversationId: state.conversation.id });
      });
    });

    socket.on("message:new", function (msg) {
      addMessage(msg);
      send.disabled = false;
    });

    socket.on("conversation:typing", function (d) {
      if (d.role === "agent") {
        typingEl.style.display = d.isTyping ? "block" : "none";
        body.scrollTop = body.scrollHeight;
      }
    });

    socket.on("disconnect", function () {
      // nothing needed
    });
  }

  // -------- Open/close --------
  function open() {
    state.open = true;
    launcher.classList.add("nc-open");
    window_.classList.add("nc-visible");
    if (!state.initialized) {
      init();
    }
  }

  function close() {
    state.open = false;
    launcher.classList.remove("nc-open");
    window_.classList.remove("nc-visible");
  }

  function init() {
    state.initialized = true;
    fetch(baseUrl + "/api/widget/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error);
        state.website = res.website;
        state.visitor = res.visitor;
        state.conversation = res.conversation;
        header.querySelector(".nc-title").textContent = state.website.name || "Support";
        header.querySelector(".nc-avatar").textContent = (state.website.name || "S").charAt(0).toUpperCase();
        header.style.background = state.website.primaryColor || primaryColor;
        launcher.style.background = state.website.primaryColor || primaryColor;

        var img = state.website.logo;
        if (img) {
          header.querySelector(".nc-avatar").innerHTML = "<img src='" + img + "' style='width:100%;height:100%;border-radius:50%;object-fit:cover' />";
        }

        if (window.io) {
          initSocket();
        } else {
          // Fallback to script loading
          loadSocketLib();
        }
      })
      .catch(function (err) {
        setBodyContent('<div class="nc-loading">Error: ' + (err.message || "Could not connect") + "</div>");
      });
  }

  function loadSocketLib() {
    var s = document.createElement("script");
    s.src = baseUrl + "/socket.io-client.js";
    s.onload = initSocket;
    s.onerror = function () {
      setBodyContent('<div class="nc-loading">Could not load chat.</div>');
    };
    document.head.appendChild(s);
  }

  // -------- Input handling --------
  function canSend() {
    return state.socket && state.socket.connected && input.value.trim() && state.conversation;
  }

  function sendMessage() {
    var content = input.value.trim();
    if (!content || !canSend()) return;
    var optimistic = {
      id: "temp" + Date.now(),
      content: content,
      isAgent: false,
      type: "text",
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    state.socket.emit("visitor:message", {
      conversationId: state.conversation.id,
      content: content,
    }, function (res) {
      if (!res || !res.ok) {
        // Remove optimistic on failure
        state.messages = state.messages.filter(function (m) { return m.id !== optimistic.id; });
        var els = body.querySelectorAll(".nc-msg.nc-visitor");
        var last = els[els.length - 1];
        if (last && last.querySelector(".nc-time").textContent === formatTime(optimistic.createdAt)) {
          last.remove();
        }
      }
    });
    input.value = "";
    autoResize();
    send.disabled = true;
    input.focus();
  }

  function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  }

  input.addEventListener("input", function () {
    autoResize();
    send.disabled = !canSend();
    var text = input.value.trim();
    if (state.socket && state.socket.connected) {
      state.socket.emit("conversation:typing", { conversationId: state.conversation.id, isTyping: !!text });
    }
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  send.addEventListener("click", sendMessage);
  launcher.addEventListener("click", function () {
    if (state.open) close();
    else open();
  });
})();
