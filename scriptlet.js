// ==UserScript==
// @name         Exam Cheat Bypass Scriptlets for uBlock Origin
// @description  Disable anti-cheat APIs before page script runs
// @version      1.0
// ==/UserScript==

// Scriptlet: noop-history
// Mengganti history.pushState dan replaceState dengan fungsi kosong
window.history.pushState = function() {};
window.history.replaceState = function() {};

// Scriptlet: block-event-listeners
// Menghentikan pendaftaran listener untuk event‑event tertentu
(function() {
    var origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        var blocked = ['popstate', 'blur', 'visibilitychange', 'keydown',
                       'contextmenu', 'selectstart', 'fullscreenchange'];
        if (blocked.indexOf(type) !== -1) {
            return;
        }
        return origAdd.apply(this, arguments);
    };
})();

// Scriptlet: fake-fullscreen
// Menipu halaman agar mengira selalu dalam fullscreen
(function() {
    Object.defineProperty(document, 'fullscreenElement', {
        get: function() { return true; },
        configurable: false
    });
    Object.defineProperty(document, 'webkitFullscreenElement', {
        get: function() { return true; },
        configurable: false
    });
    // Nonaktifkan exitFullscreen
    Document.prototype.exitFullscreen = function() { return Promise.resolve(); };
    // Nonaktifkan requestFullscreen (biarkan seolah sukses)
    Element.prototype.requestFullscreen = function() { return Promise.resolve(); };
})();

// Scriptlet: freeze-time
// Membekukan Date.now agar timer tidak berkurang
(function() {
    var now = Date.now();
    Date.now = function() { return now; };
})();

// Scriptlet: no-timer-interval
// Mencegah setInterval untuk delay 1000 ms (timer ujian)
(function() {
    var origSetInterval = window.setInterval;
    window.setInterval = function(fn, delay) {
        if (delay === 1000) {
            return -1; // ID palsu
        }
        return origSetInterval.apply(this, arguments);
    };
})();

// Scriptlet: block-integrity-fetch
// Blokir fetch ke endpoint integrity-log
(function() {
    var origFetch = window.fetch;
    window.fetch = function(url, init) {
        if (typeof url === 'string' && url.indexOf('/integrity-log') !== -1) {
            console.log('[Bypass] Integrity log blocked');
            return Promise.resolve(new Response(null, { status: 200 }));
        }
        return origFetch.apply(this, arguments);
    };
})();

// Scriptlet: mute-mutation-observer
// Lumpuhkan MutationObserver
(function() {
    var OrigMutationObserver = window.MutationObserver;
    window.MutationObserver = function() {
        return {
            observe: function() {},
            disconnect: function() {},
            takeRecords: function() { return []; }
        };
    };
})();

// Scriptlet: disable-variable-polling (opsional)
// Hentikan polling variabel global (setiap 4 detik) - bisa dengan mematikan setInterval dengan delay 4000
// Script di atas sudah menangani setInterval 1000, kita perlu blok juga 4000.
// Tambahkan di setInterval handler:
(function() {
    var origSetInterval = window.setInterval; // sudah ditimpa? hati-hati urutan
    // lebih baik kita tangkap semua interval dan matikan yang delay 4000
    var _origSetInterval = window.setInterval; // ambil yang asli sebelum modifikasi kita? 
    // Kita akan modifikasi langsung fungsi yang sudah dimodifikasi di atas? 
    // Karena kita akan menggabungkan semua, perlu hati-hati.
    // Solusi: buat satu handler setInterval yang memblokir kedua delay.
})();

// Karena scriptlet dijalankan berurutan, kita bisa buat satu fungsi komplit saja.
// Di bawah ini versi gabungan yang lebih aman:

(function() {
    'use strict';

    // 1. Noop history
    history.pushState = history.replaceState = function() {};

    // 2. Blok event listener
    var origAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type) {
        if (/^(popstate|blur|visibilitychange|keydown|contextmenu|selectstart|fullscreenchange)$/.test(type)) return;
        return origAdd.apply(this, arguments);
    };

    // 3. Fake fullscreen
    Object.defineProperty(document, 'fullscreenElement', { get: function() { return true; } });
    Object.defineProperty(document, 'webkitFullscreenElement', { get: function() { return true; } });
    Document.prototype.exitFullscreen = Element.prototype.requestFullscreen = function() { return Promise.resolve(); };

    // 4. Freeze time
    var frozen = Date.now();
    Date.now = function() { return frozen; };

    // 5. Blok interval 1000 dan 4000 (timer + polling)
    var _setInterval = window.setInterval;
    window.setInterval = function(fn, delay) {
        if (delay === 1000 || delay === 4000) {
            console.log('[Bypass] Blocked interval with delay ' + delay);
            return -1;
        }
        return _setInterval.apply(this, arguments);
    };

    // 6. Blok fetch integrity
    var _fetch = window.fetch;
    window.fetch = function(url) {
        if (typeof url === 'string' && url.indexOf('/integrity-log') > -1) {
            return Promise.resolve(new Response(null, { status: 200 }));
        }
        return _fetch.apply(this, arguments);
    };

    // 7. Lumpuhkan MutationObserver
    var _MO = window.MutationObserver;
    window.MutationObserver = function() {
        return { observe: function() {}, disconnect: function() {}, takeRecords: function() { return []; } };
    };

    console.log('[Bypass] All client-side anti-cheat disabled.');
})();
