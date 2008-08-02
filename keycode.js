(function() {

var modifiers = ['ctrl', 'alt', 'shift'],
    keymap = {},
    shifted_symbols = {
        58: 59,     // : -> ;
        43: 61,     // = -> +
        60: 44,     // < -> ,
        95: 45,     // _ -> -
        62: 46,     // > -> .
        63: 47,     // ? -> /
        96: 192,    // ` -> ~
        124: 92,    // | -> \
        39: 222,    // ' -> 222
        34: 222,    // " -> 222
        33: 49,     // ! -> 1
        64: 50,     // @ -> 2
        35: 51,     // # -> 3
        36: 52,     // $ -> 4
        37: 53,     // % -> 5
        94: 54,     // ^ -> 6
        38: 55,     // & -> 7
        42: 56,     // * -> 8
        40: 57,     // ( -> 9
        41: 58,     // ) -> 0
        123: 91,    // { -> [
        125: 93     // } -> ]
    };

function isLower(ascii) { 
    return ascii >= 97 && ascii <= 122; 
};
function capitalize(str) { 
    return str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase(); 
};

// Browser detection taken from quirksmode.org
if(navigator.userAgent.indexOf('Gecko') != -1 || // Mozilla/Gecko
   navigator.userAgent.indexOf('MSIE') != -1) {  // Internet Explorer 
    // These two are close enough that we can use the same map for both
    key_map = {
        186: 59, // ;: in IE
        187: 61, // =+ in IE
        188: 44, // ,<
        109: 45, // -_ in Mozilla
        189: 45, // -_ in IE
        190: 62, // .>
        191: 47, // /?
        192: 126, // `~
        219: 91, // {[
        220: 92, // \|
        221: 93 // }]
    };
} else if(window.opera && navigator.platform.indexOf('Win') != -1) { // Windows Opera
    key_map = { 39: 222, 46: 62 };
} else if(window.opera ||                           // Other Opera
          navigator.vendor.indexOf('KDE') != -1 ||  // Konqueror
          navigator.vendor.indexOf('iCab') != -1) { // iCab
    var unshift = [33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 
                   58, 43, 60, 95, 62, 63, 96, 124, 34];
    for(var i = 0; i < unshift.length; ++i) {
        key_map[unshift[i]] = shifted_symbols[unshift[i]];
    }
}

var key_names = {
    32: 'SPACE',
    13: 'ENTER',
    9: 'TAB',
    8: 'BACKSPACE',
    16: 'SHIFT',
    17: 'CTRL',
    18: 'ALT',
    20: 'CAPS_LOCK',
    144: 'NUM_LOCK',
    145: 'SCROLL_LOCK',
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
    33: 'PAGE_UP',
    34: 'PAGE_DOWN',
    36: 'HOME',
    35: 'END',
    45: 'INSERT',
    46: 'DELETE',
    27: 'ESCAPE',
    19: 'PAUSE',
    222: "'"
};
function fn_name(code) {
    if(code >= 112 && code <= 123) return 'F' + (code - 111);
    return false;
};
function num_name(code) {
    if(code >= 96 && code < 106) return 'Num' + (code - 96);
    return false;
};

var current_keys = {
    codes: {},
    ctrl: false,
    alt: false,
    shift: false
};

function update_current_modifiers(key) {
    current_keys.ctrl = key.ctrl;
    current_keys.alt = key.alt;
    current_keys.shift = key.shift;
};

function same_modifiers(key1, key2) {
    return key1.ctrl === key2.ctrl
        && key1.alt === key2.alt
        && key1.shift === key2.shift;
};

if(typeof window.KeyCode != "undefined") {
    var _KeyCode = window.KeyCode;
}

var KeyCode = window.KeyCode = {
    no_conflict: function() {
        window.KeyCode = _KeyCode;
        return KeyCode;
    },

    /** Generates a function key code from a number between 1 and 12 */
    fkey: function(num) { return 111 + num; },

    /** Generates a numeric keypad code from a number between 0 and 9 */
    numkey: function(num) { return 96 + num; },

    /** Generates a key code from the ASCII code of (the first character of) a string. */
    key: function(str) { 
        var c = str.charCodeAt(0); 
        if(isLower(c)) return c - 32;
        return shifted_symbols[c] || c;
    },

    /** Checks if two keycode objects are equal */
    key_equals: function(key1, key2) {
        return key1.code == key2.code && same_modifiers(key1, key2);
    },

    /** Translates a keycode to its normalized value */
    translate_key_code: function(code) {
        return key_map[code] || code;
    },

    /** Translates a keyDown event to a normalized key event object.  The
     * object has the following fields:
     * { int code; boolean shift, boolean alt, boolean ctrl }
     */
    translate_event: function(e) {
        e = e || window.event;
        var code = e.which || e.keyCode;
        return {
            code: KeyCode.translate_key_code(code),
            shift: e.shiftKey,
            alt: e.altKey,
            ctrl: e.ctrlKey
        };
    },

    /**
     * Keydown event listener to update internal state of which keys are
     * currently pressed.
     */ 
    key_down: function(e) {
        var key = KeyCode.translate_event(e);
        current_keys.codes[key.code] = key.code;
        update_current_modifiers(key);
    },

    /**
     * Keyup event listener to update internal state.
     */
    key_up: function(e) {
        var key = KeyCode.translate_event(e);
        delete current_keys.codes[key.code];
        update_current_modifiers(key);
    },

    /**
     * Returns true if the key spec (as returned by translate_event) is
     * currently held down.
     */
    is_down: function(key) {
        var code = key.code;
        if(code == KeyCode.CTRL) return current_keys.ctrl;
        if(code == KeyCode.ALT) return current_keys.alt;
        if(code == KeyCode.SHIFT) return current_keys.shift;

        return current_keys.codes[code] !== undefined
            && same_modifiers(key, current_keys);
    },

    /** Returns a string representation of a key event suitable for the
     * shortcut.js or JQuery HotKeys plugins.  Also makes a decent UI display.
     */
    hot_key: function(key) {
        var pieces = [];
        for(var i = 0; i < modifiers.length; ++i) {
            var modifier = modifiers[i];
            if(key[modifier] && modifier.toUpperCase() != key_names[key.code]) {
                pieces.push(capitalize(modifier));
            }
        }

        var c = key.code;
        var key_name = key_names[c] || fn_name(c) || num_name(c) || String.fromCharCode(c);
        pieces.push(capitalize(key_name))
        return pieces.join('+');
    }
};

// Add key constants 
for(var code in key_names) {
    KeyCode[key_names[code]] = code;
}
})();
