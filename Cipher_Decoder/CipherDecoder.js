/*
  Author: Dean Serenevy  2013

  This software is hereby placed into the public domain.

  WISHLIST/TODO
  -------------

  * UI for customizing "unknown_char"

  * "Flag" column (<i class="icon-flag" />) of checkboxes, will style via *_flagged

  * <span> class of individual characters in solution by their state:

    - cipher_known (grey), cipher_unknown (grey), cipher_flagged (red)
    - plain_known (blue), plain_unknown (yellow), plain_flagged (red)

*/


jQuery(function($) {

    var CipherApp = {

        'default_alphabet': [],
        'unknown_char': ' ',
        'ignore_chars': [ " ", "\n", "\t" ],
        'checkboxes': [ "include_cipher", "allow_dups" ],
        'elements':   [ "ciphertext", "plaintext", "alert_container", "lookup_table_head", "lookup_table_body", "digraph_freq", "letter_freq" ],

        'init': function() {
            this.cache_elements();
            this.reset();
            this.bind_events();
        },

        'cache_elements': function() {
            this.$root = $('#CipherDecoder');

            var i;
            for (i in this.elements) {
                this['$' + this.elements[i]] = this.$root.find('#'+this.elements[i]);
            }

            this.lookup_table_template = Handlebars.compile(this.$root.find("#lookup_table_template").html());
            this.alert_template = Handlebars.compile(this.$root.find("#alert_template").html());
        },

        'reset': function() {
            var i;
            for (i in this.checkboxes) {
                var $cb = this.$root.find('#'+this.checkboxes[i]).get(0);
                $cb.checked = this[this.checkboxes[i]] = $cb.defaultChecked;
            }

            this.reset_map();

            this.$ciphertext.val("");
            this.$plaintext.text("");

            this.refresh_histogram();

            this.$lookup_table_body.html("");
            for (i in this.default_alphabet) { this.add_to_lookup_table(this.default_alphabet[i], ""); }
            this.sort_lookup_table();
        },

        'bind_events': function() {
            this.$lookup_table_body.on("change keyup mouseup", ".lu_p input", { "app": this }, this.on_change_lookup_table);
            this.$ciphertext.on("change keyup mouseup", { "app": this }, this.on_change_ciphertext);

            // paste event happens before paste, so nothing there yet -
            // wait for a bit before looking for ciphertext.
            var app = this;
            this.$ciphertext.on("paste", { "app": this }, function(e) { setTimeout($.proxy(app.on_change_ciphertext, this), 200, e); });

            var $root = this.$root;
            $root.find("#options").on("change", "input[type=checkbox]", { "app": this }, this.on_toggle_checkbox);
            $root.find("#clear_lookup_table").on("click", { "app": this }, this.on_clear_lookup_table);
            $root.find("#lookup_table_head").on("mouseup", "th", { "app": this }, this.on_click_th);
        },

        'load': function(text) {
            this.reset();
            this.$ciphertext.val(text);
            this.refresh();
        },

        'refresh': function() {
            this.refresh_conversion();
            this.refresh_histogram();
            this.update_lookup_table_frequencies();

            // Need to re-sort the table if we are sorted by frequency
            var $th = this.$lookup_table_head.find("th").eq(this.sort_index);
            if (/^F/.test($th.text())) {
                this.sort_lookup_table();
            }
        },

        'update_lookup_table_frequencies': function() {
            var app = this;
            var clone = $.extend({}, app.histogram);

            app.$lookup_table_body.find("tr").each(function(idx, item) {
                var $item = $(item);
                var c = $item.find(".lu_c").text();
                $(item).find(".lu_f").text( clone[c] || 0 );
                delete clone[c];
            });

            if (!$.isEmptyObject(clone)) {
                var c;
                for (c in clone) {
                    app.add_to_lookup_table(c);
                }
                app.sort_lookup_table();
            }

            var letters = Object.keys(app.histogram).sort(function(a,b) { return app.histogram[b] - app.histogram[a]; });
            app.$letter_freq.text( letters.join(", ") );

            var digraphs = Object.keys(app.digraph_histogram).sort(function(a,b) { return app.digraph_histogram[b] - app.digraph_histogram[a]; });
            app.$digraph_freq.text( digraphs.join(", ") );
        },

        'add_to_lookup_table': function(c, p) {
            var count = 0;
            if (c in this.histogram) {
                count = this.histogram[c];
            }
            this.$lookup_table_body.append(this.lookup_table_template({ 'ciphersymbol': c, 'plainsymbol': p, 'frequency': count }));
        },


        'ciphertext': function() { return this.$ciphertext.val().toUpperCase(); },

        'refresh_histogram': function() {
            var hists = this.compute_histogram(this.ciphertext());
            this.histogram = hists[0];
            this.digraph_histogram = hists[1];
            return this.histogram;
        },

        'compute_histogram': function(text) {
            var hist = {};
            var digr = {};
            var idx = 0;
            var last;

            var ignore = {};
            for (var i in this.ignore_chars) {
                ignore[this.ignore_chars[i]] = true;
            }

            while (idx < text.length) {
                var c = text.charAt(idx);

                if (!ignore[c]) {
                    if (c in hist) { hist[c] += 1; }
                    else           { hist[c] = 1; }

                    if (idx > 0 && !ignore[last]) {
                        d = last + c;
                        if (d in digr) { digr[d] += 1; }
                        else           { digr[d] = 1; }
                    }
                }

                last = c;
                idx += 1;
            }
            return [ hist, digr ];
        },

        'reset_map': function() {
            this.map = {};
            for (i in this.ignore_chars) { this.map[this.ignore_chars[i]] = this.ignore_chars[i]; }
        },

        'reverse_map': function() {
            var rev_map = {};
            var c;
            for (c in this.map) {
                rev_map[this.map[c]] = c;
            }
            return rev_map;
        },

        'lookup_plain': function(plain) {
            var c;
            for (c in this.map) {
                if (plain === this.map[c]) {
                    return c;
                }
            }
            return null;
        },

        'encode': function(plain)  { return this.transcode(plain, this.reverse_map()); },
        'decode': function(cipher) { return this.transcode(cipher, this.map); },

        'transcode': function(text, map) {
            var idx = 0;
            var coded = "";
            while (idx < text.length) {
                if (text.charAt(idx) in map) {
                    coded += map[text.charAt(idx)];
                } else {
                    coded += this.unknown_char;
                }
                idx += 1;
            }
            return coded;
        },

        'refresh_conversion': function(event) {
            var lines = this.ciphertext().split("\n");
            this.$plaintext.text("");
            var i;
            for (i in lines) {
                if (this.include_cipher) {
                    var c = $("<span />", { "class": "ciphertext" });
                    c.text(lines[i] + "\n");
                    this.$plaintext.append(c);
                }
                var p = $("<span />", { "class": "plaintext" });
                p.text(this.decode(lines[i]) + "\n");
                this.$plaintext.append(p);
            }
        },


        // ================================================================
        // Event Callbacks. "this" will be the element which triggered the
        // callback. The app will be available from event.data.app.
        // ================================================================

        'on_toggle_checkbox': function(event) {
            var app = event.data.app;
            app[$(this).attr("id")] = this.checked;
            app.refresh_conversion();
        },

        'on_change_ciphertext': function(event) {
            event.data.app.refresh();
        },

        'on_change_lookup_table': function(event) {
            var app = event.data.app;
            var $tr = $(this).closest('tr');
            var $input = $tr.find('.lu_p input');
            var lastval = $input.data("lastval");
            var has_lastval = app.is_set(lastval);

            var ciphersymbol = $tr.find('.lu_c').text().toUpperCase();
            var plainsymbol  = $input.val().toLowerCase();

            // What happens if we create a replacement of more than one char:
            if (plainsymbol.length > 1) {
                if (has_lastval) {
                    plainsymbol.replace(lastval, "");
                }
                plainsymbol = plainsymbol.substr(plainsymbol.length - 1);
                if (has_lastval && plainsymbol.length == 0) {
                    plainsymbol = lastval;
                }
                $input.val(plainsymbol);
            }

            // What happens if we try to map N-to-1
            if (! app.allow_dups) {
                var old_c = app.lookup_plain(plainsymbol);
                if (app.is_set(old_c)) {
                    // Oh..., it was us :)
                    if (old_c === ciphersymbol) {
                        return true;
                    }

                    // reject the exchange, reset to old value, and alert
                    $input.val(app.map[ciphersymbol]);
                    app.alert({
                        "alert": "Cipher symbol '" + old_c + "' already maps to '" + plainsymbol + "'",
                        "class": "alert-error",
                        "duration": 3000
                    });
                    return false;
                }
            }

            // Finally what we came here to do
            if (plainsymbol.length < 1) {
                $input.data("lastval", null);
                delete app.map[ciphersymbol];
            } else {
                $input.data("lastval", plainsymbol);
                app.map[ciphersymbol] = plainsymbol;
            }

            app.refresh_conversion();
        },

        'on_clear_lookup_table': function(event) {
            var app = event.data.app;
            app.$lookup_table_body.find('.lu_p input').val("");
            app.reset_map();
            app.refresh_conversion();
        },

        'on_click_th': function(event) {
            var $this = $(this);
            var app = event.data.app;
            if ($this.index() === app.sort_index) {
                app.sort_order = -1 * app.sort_order;
            } else {
                app.sort_order = 1;
                if ($this.attr("sort-default")) {
                    app.sort_order = parseInt($this.attr("sort-default"));
                }
                app.sort_index = $this.index();
            }

            $this.closest("tr").find('i').attr("class", "icon-sortable");

            var updown = app.sort_order > 0 ? "up" : "down";
            $this.find('i').attr("class", "icon-sortable-"+updown);

            app.sort_lookup_table();
        },


        // ================================================================
        // Fairly standard components ripe for moving to a module.
        // ================================================================

        '$html_escape': $("<span />"),
        'html_escape': function(text) {
            return this.$html_escape.text(text).html();
        },

        'sort_index': 1,
        'sort_order': 1,
        'sort_int_format':  function(a) { return parseInt($.text([a])) || 0; },
        'sort_text_format': function(a) { return $.text([a]); },
        'sort_val_format':  function(a) { return $(a).find("input").val(); },

        'sort_lookup_table': function() {
            var index = this.sort_index;
            var order = this.sort_order;

            var $th = this.$lookup_table_head.find("th").eq(index);

            var emptylast = $th.attr("sort-empty-last");
            var sorttype  = $th.attr("sort-type") || "text";
            var formatter = this["sort_" + sorttype + "_format"];

            this.$lookup_table_body.find("td").filter(
                function(){ return $(this).index() === index; }
            ).sortElements(
                function(a, b){
                    var A = formatter(a);
                    var B = formatter(b);
                    if (A == B) return 0;
                    if (emptylast) {
                        if (A == "") return 1;
                        if (B == "") return -1;
                    }
                    return order * (A > B ? 1 : -1);
                },
                function(){ return this.parentNode; }
            );
        },

        'is_set': function(val) { return (typeof val !== 'undefined' && val != null && val != NaN); },

        'alert': function(vars) {
            var $alert = $(this.alert_template(vars));
            this.$alert_container.append($alert);
            $alert.slideDown("fast");

            if (this.is_set(vars.duration)) {
                $alert.delay(vars.duration).slideUp("slow", function() { $(this).remove(); });
            }
        },

    };


    CipherApp.init();
});
