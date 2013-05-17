
    /*======================================================================*\
    || #################################################################### ||
    || # vBulletin 3.8.7
    || # ---------------------------------------------------------------- # ||
    || # Copyright �2000-2011 vBulletin Solutions, Inc. All Rights Reserved. ||
    || # This file may not be redistributed in whole or significant part. # ||
    || # ---------------- VBULLETIN IS NOT FREE SOFTWARE ---------------- # ||
    || # http://www.vbulletin.com | http://www.vbulletin.com/license.html # ||
    || #################################################################### ||
    \*======================================================================*/

    function vB_Text_Editor(editorid, mode, parsetype, parsesmilies, initial_text, ajax_extra) {
        this.editorid = editorid;
        this.wysiwyg_mode = parseInt(mode, 10) ? 1 : 0;
        this.initialized = false;
        this.parsetype = (typeof parsetype == "undefined" ? "nonforum" : parsetype);
        this.ajax_extra = (typeof parsetype == "undefined" ? "" : ajax_extra);
        this.parsesmilies = (typeof parsesmilies == "undefined" ? 1 : parsesmilies);
        this.popupmode = (typeof vBmenu == "undefined" ? false : true);
        this.controlbar = fetch_object(this.editorid + "_controls");
        this.textobj = fetch_object(this.editorid + "_textarea");
        this.buttons = new Array();
        this.popups = new Array();
        this.prompt_popup = null;
        this.fontstate = null;
        this.sizestate = null;
        this.colorstate = null;
        this.clipboard = "";
        this.disabled = false;
        this.history = new vB_History();
        this.influx = 0;
        this.allowbasicbbcode = ((typeof allowbasicbbcode != "undefined" && allowbasicbbcode) ? true : false);
        this.ltr = ((typeof ltr != "undefined" && ltr == "right") ? "right" : "left");
        this.init = function () {
            if (this.initialized) {
                return
            }
            this.textobj.disabled = false;
            if (this.tempiframe) {
                this.tempiframe.parentNode.removeChild(this.tempiframe)
            }
            this.set_editor_contents(initial_text);
            this.set_editor_functions();
            this.init_controls();
            this.init_smilies(fetch_object(this.editorid + "_smiliebox"));
            if (typeof smilie_window != "undefined" && !smilie_window.closed) {
                this.init_smilies(smilie_window.document.getElementById("smilietable"))
            }
            this.captcha = document.getElementById("imagestamp");
            if (this.captcha != null) {
                this.captcha.setAttribute("tabIndex", 1)
            }
            this.initialized = true
        };
        this.check_focus = function () {
            if (!this.editwin.hasfocus || (is_moz && is_mac)) {
                this.editwin.focus();
                if (is_opera) {
                    this.editwin.focus()
                }
            }
        };
        this.init_controls = function () {
            var controls = new Array();
            var i, j, buttons, imgs, control;
            if (this.controlbar == null) {
                return
            }
            buttons = fetch_tags(this.controlbar, "div");
            for (i = 0; i < buttons.length; i++) {
                if (buttons[i].className == "imagebutton" && buttons[i].id) {
                    controls[controls.length] = buttons[i].id;
                    if (is_ie) {
                        imgs = buttons[i].getElementsByTagName("img");
                        for (j = 0; j < imgs.length; j++) {
                            if (imgs[j].alt == "") {
                                imgs[j].title = buttons[i].title
                            }
                        }
                    }
                }
            }
            for (i = 0; i < controls.length; i++) {
                control = fetch_object(controls[i]);
                if (control.id.indexOf(this.editorid + "_cmd_") != -1) {
                    this.init_command_button(control)
                } else {
                    if (control.id.indexOf(this.editorid + "_popup_") != -1) {
                        this.init_popup_button(control)
                    }
                }
            }
            set_unselectable(this.controlbar)
        };
        this.init_smilies = function (smilie_container) {
            if (smilie_container != null) {
                var smilies = fetch_tags(smilie_container, "img");
                for (var i = 0; i < smilies.length; i++) {
                    if (smilies[i].id && smilies[i].id.indexOf("_smilie_") != false) {
                        smilies[i].style.cursor = pointer_cursor;
                        smilies[i].editorid = this.editorid;
                        smilies[i].onclick = vB_Text_Editor_Events.prototype.smilie_onclick;
                        smilies[i].unselectable = "on"
                    }
                }
            }
        };
        this.init_command_button = function (obj) {
            obj.cmd = obj.id.substr(obj.id.indexOf("_cmd_") + 5);
            obj.editorid = this.editorid;
            this.buttons[obj.cmd] = obj;
            if (obj.cmd == "switchmode") {
                if (AJAX_Compatible) {
                    obj.state = this.wysiwyg_mode ? true : false;
                    this.set_control_style(obj, "button", this.wysiwyg_mode ? "selected" : "normal")
                } else {
                    obj.parentNode.removeChild(obj)
                }
            } else {
                obj.state = false;
                obj.mode = "normal";
                if (obj.cmd == "bold" || obj.cmd == "italic" || obj.cmd == "underline") {
                    this.allowbasicbbcode = true
                }
            }
            obj.onclick = obj.onmousedown = obj.onmouseover = obj.onmouseout = vB_Text_Editor_Events.prototype.command_button_onmouseevent
        };
        this.init_popup_button = function (obj) {
            obj.cmd = obj.id.substr(obj.id.indexOf("_popup_") + 7);
            if (this.popupmode) {
                vBmenu.register(obj.id, true);
                vBmenu.menus[obj.id].open_steps = 5;
                obj.editorid = this.editorid;
                obj.state = false;
                this.buttons[obj.cmd] = obj;
                var option, div;
                if (obj.cmd == "fontname") {
                    this.fontout = fetch_object(this.editorid + "_font_out");
                    this.fontout.innerHTML = obj.title;
                    this.fontoptions = {
                        "": this.fontout
                    };
                    for (option in fontoptions) {
                        if (YAHOO.lang.hasOwnProperty(fontoptions, option)) {
                            div = document.createElement("div");
                            div.id = this.editorid + "_fontoption_" + fontoptions[option];
                            div.style.width = this.fontout.style.width;
                            div.style.display = "none";
                            div.innerHTML = fontoptions[option];
                            this.fontoptions[fontoptions[option]] = this.fontout.parentNode.appendChild(div)
                        }
                    }
                } else {
                    if (obj.cmd == "fontsize") {
                        this.sizeout = fetch_object(this.editorid + "_size_out");
                        this.sizeout.innerHTML = obj.title;
                        this.sizeoptions = {
                            "": this.sizeout
                        };
                        for (option in sizeoptions) {
                            if (YAHOO.lang.hasOwnProperty(sizeoptions, option)) {
                                div = document.createElement("div");
                                div.id = this.editorid + "_sizeoption_" + sizeoptions[option];
                                div.style.width = this.sizeout.style.width;
                                div.style.display = "none";
                                div.innerHTML = sizeoptions[option];
                                this.sizeoptions[sizeoptions[option]] = this.sizeout.parentNode.appendChild(div)
                            }
                        }
                    }
                }
                obj._onmouseover = obj.onmouseover;
                obj._onclick = obj.onclick;
                obj.onmouseover = obj.onmouseout = obj.onclick = vB_Text_Editor_Events.prototype.popup_button_onmouseevent;
                vBmenu.menus[obj.id]._show = vBmenu.menus[obj.id].show;
                vBmenu.menus[obj.id].show = vB_Text_Editor_Events.prototype.popup_button_show
            } else {
                this.build_select(obj)
            }
        };
        this.build_select = function (obj) {
            var sel = document.createElement("select");
            sel.id = this.editorid + "_select_" + obj.cmd;
            sel.editorid = this.editorid;
            sel.cmd = obj.cmd;
            var opt = document.createElement("option");
            opt.value = "";
            opt.text = obj.title;
            sel.add(opt, is_ie ? sel.options.length : null);
            opt = document.createElement("option");
            opt.value = "";
            opt.text = " ";
            sel.add(opt, is_ie ? sel.options.length : null);
            var i;
            switch (obj.cmd) {
            case "fontname":
                for (i = 0; i < fontoptions.length; i++) {
                    opt = document.createElement("option");
                    opt.value = fontoptions[i];
                    opt.text = (fontoptions[i].length > 10 ? (fontoptions[i].substr(0, 10) + "...") : fontoptions[i]);
                    sel.add(opt, is_ie ? sel.options.length : null)
                }
                sel.onchange = vB_Text_Editor_Events.prototype.formatting_select_onchange;
                break;
            case "fontsize":
                for (i = 0; i < sizeoptions.length; i++) {
                    opt = document.createElement("option");
                    opt.value = sizeoptions[i];
                    opt.text = sizeoptions[i];
                    sel.add(opt, is_ie ? sel.options.length : null)
                }
                sel.onchange = vB_Text_Editor_Events.prototype.formatting_select_onchange;
                break;
            case "forecolor":
                for (i in coloroptions) {
                    if (YAHOO.lang.hasOwnProperty(coloroptions, i)) {
                        opt = document.createElement("option");
                        opt.value = coloroptions[i];
                        opt.text = PHP.trim((coloroptions[i].length > 5 ? (coloroptions[i].substr(0, 5) + "...") : coloroptions[i]).replace(new RegExp("([A-Z])", "g"), " $1"));
                        opt.style.backgroundColor = i;
                        sel.add(opt, is_ie ? sel.options.length : null)
                    }
                }
                sel.onchange = vB_Text_Editor_Events.prototype.formatting_select_onchange;
                break;
            case "smilie":
                for (var cat in smilieoptions) {
                    if (!YAHOO.lang.hasOwnProperty(smilieoptions, cat)) {
                        continue
                    }
                    for (var smilieid in smilieoptions[cat]) {
                        if (!YAHOO.lang.hasOwnProperty(smilieoptions[cat], smilieid)) {
                            continue
                        }
                        if (smilieid != "more") {
                            opt = document.createElement("option");
                            opt.value = smilieoptions[cat][smilieid][1];
                            opt.text = smilieoptions[cat][smilieid][1];
                            opt.smilieid = smilieid;
                            opt.smiliepath = smilieoptions[cat][smilieid][0];
                            opt.smilietitle = smilieoptions[cat][smilieid][2];
                            sel.add(opt, is_ie ? sel.options.length : null)
                        }
                    }
                }
                sel.onchange = vB_Text_Editor_Events.prototype.smilieselect_onchange;
                break;
            case "attach":
                sel.onmouseover = vB_Text_Editor_Events.prototype.attachselect_onmouseover;
                sel.onchange = vB_Text_Editor_Events.prototype.attachselect_onchange;
                break
            }
            while (obj.hasChildNodes()) {
                obj.removeChild(obj.firstChild)
            }
            this.buttons[obj.cmd] = obj.appendChild(sel)
        };
        this.init_popup_menu = function (obj) {
            if (this.disabled) {
                return false
            }
            var menu;
            switch (obj.cmd) {
            case "fontname":
                menu = this.init_menu_container("fontname", "200px", "250px", "auto");
                this.build_fontname_popup(obj, menu);
                break;
            case "fontsize":
                menu = this.init_menu_container("fontsize", "auto", "auto", "visible");
                this.build_fontsize_popup(obj, menu);
                break;
            case "forecolor":
                menu = this.init_menu_container("forecolor", "auto", "auto", "visible");
                this.build_forecolor_popup(obj, menu);
                break;
            case "smilie":
                menu = this.init_menu_container("smilie", "175px", "250px", "auto");
                this.build_smilie_popup(obj, menu);
                break;
            case "attach":
                if (typeof vB_Attachments != "undefined" && vB_Attachments.has_attachments()) {
                    menu = this.init_menu_container("attach", "auto", "auto", "visible");
                    this.build_attachments_popup(menu, obj)
                } else {
                    fetch_object("manage_attachments_button").onclick();
                    return false
                }
            }
            this.popups[obj.cmd] = this.controlbar.appendChild(menu);
            set_unselectable(menu);
            return true
        };
        this.init_menu_container = function (cmd, width, height, overflow) {
            var menu = document.createElement("div");
            menu.id = this.editorid + "_popup_" + cmd + "_menu";
            menu.className = "vbmenu_popup";
            menu.style.display = "none";
            menu.style.cursor = "default";
            menu.style.padding = "3px";
            menu.style.width = width;
            menu.style.height = height;
            menu.style.overflow = overflow;
            return menu
        };
        this.build_fontname_popup = function (obj, menu) {
            for (var n in fontoptions) {
                if (YAHOO.lang.hasOwnProperty(fontoptions, n)) {
                    var option = document.createElement("div");
                    option.innerHTML = '<font face="' + fontoptions[n] + '">' + fontoptions[n] + "</font>";
                    option.className = "ofont";
                    option.style.textAlign = "left";
                    option.title = fontoptions[n];
                    option.cmd = obj.cmd;
                    option.controlkey = obj.id;
                    option.editorid = this.editorid;
                    option.onmouseover = option.onmouseout = option.onmouseup = option.onmousedown = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                    option.onclick = vB_Text_Editor_Events.prototype.formatting_option_onclick;
                    menu.appendChild(option)
                }
            }
        };
        this.build_fontsize_popup = function (obj, menu) {
            for (var n in sizeoptions) {
                if (YAHOO.lang.hasOwnProperty(sizeoptions, n)) {
                    var option = document.createElement("div");
                    option.innerHTML = '<font size="' + sizeoptions[n] + '">' + sizeoptions[n] + "</font>";
                    option.className = "osize";
                    option.style.textAlign = "center";
                    option.title = sizeoptions[n];
                    option.cmd = obj.cmd;
                    option.controlkey = obj.id;
                    option.editorid = this.editorid;
                    option.onmouseover = option.onmouseout = option.onmouseup = option.onmousedown = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                    option.onclick = vB_Text_Editor_Events.prototype.formatting_option_onclick;
                    menu.appendChild(option)
                }
            }
        };
        this.build_forecolor_popup = function (obj, menu) {
            var colorout = fetch_object(this.editorid + "_color_out");
            colorout.editorid = this.editorid;
            colorout.onclick = vB_Text_Editor_Events.prototype.colorout_onclick;
            var table = document.createElement("table");
            table.cellPadding = 0;
            table.cellSpacing = 0;
            table.border = 0;
            var i = 0;
            for (var hex in coloroptions) {
                if (!YAHOO.lang.hasOwnProperty(coloroptions, hex)) {
                    continue
                }
                if (i % 8 == 0) {
                    var tr = table.insertRow(-1)
                }
                i++;
                var div = document.createElement("div");
                div.style.backgroundColor = coloroptions[hex];
                var option = tr.insertCell(-1);
                option.style.textAlign = "center";
                option.className = "ocolor";
                option.appendChild(div);
                option.cmd = obj.cmd;
                option.editorid = this.editorid;
                option.controlkey = obj.id;
                option.colorname = coloroptions[hex];
                option.id = this.editorid + "_color_" + coloroptions[hex];
                option.onmouseover = option.onmouseout = option.onmouseup = option.onmousedown = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                option.onclick = vB_Text_Editor_Events.prototype.coloroption_onclick
            }
            menu.appendChild(table)
        };
        this.build_smilie_popup = function (obj, menu) {
            for (var cat in smilieoptions) {
                if (!YAHOO.lang.hasOwnProperty(smilieoptions, cat)) {
                    continue
                }
                var option;
                var category = document.createElement("div");
                category.className = "thead";
                category.innerHTML = cat;
                menu.appendChild(category);
                for (var smilieid in smilieoptions[cat]) {
                    if (!YAHOO.lang.hasOwnProperty(smilieoptions[cat], smilieid)) {
                        continue
                    }
                    if (smilieid == "more") {
                        option = document.createElement("div");
                        option.className = "thead";
                        option.innerHTML = smilieoptions[cat][smilieid];
                        option.style.cursor = pointer_cursor;
                        option.editorid = this.editorid;
                        option.controlkey = obj.id;
                        option.onclick = vB_Text_Editor_Events.prototype.smiliemore_onclick
                    } else {
                        option = document.createElement("div");
                        option.editorid = this.editorid;
                        option.controlkey = obj.id;
                        option.smilieid = smilieid;
                        option.smilietext = smilieoptions[cat][smilieid][1];
                        option.smilietitle = smilieoptions[cat][smilieid][2];
                        option.className = "osmilie";
                        option.innerHTML = '<img src="' + smilieoptions[cat][smilieid][0] + '" alt="' + PHP.htmlspecialchars(smilieoptions[cat][smilieid][2]) + '" /> ' + PHP.htmlspecialchars(smilieoptions[cat][smilieid][2]);
                        option.onmouseover = option.onmouseout = option.onmousedown = option.onmouseup = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                        option.onclick = vB_Text_Editor_Events.prototype.smilieoption_onclick
                    }
                    menu.appendChild(option)
                }
            }
        };
        this.build_attachments_popup = function (menu, obj) {
            var id, div;
            if (this.popupmode) {
                while (menu.hasChildNodes()) {
                    menu.removeChild(menu.firstChild)
                }
                div = document.createElement("div");
                div.editorid = this.editorid;
                div.controlkey = obj.id;
                div.className = "thead";
                div.style.cursor = pointer_cursor;
                div.style.whiteSpace = "nowrap";
                div.innerHTML = fetch_object("manage_attachments_button").value;
                div.title = fetch_object("manage_attachments_button").title;
                div.onclick = vB_Text_Editor_Events.prototype.attachmanage_onclick;
                menu.appendChild(div);
                var attach_count = 0;
                for (id in vB_Attachments.attachments) {
                    if (!YAHOO.lang.hasOwnProperty(vB_Attachments.attachments, id)) {
                        continue
                    }
                    div = document.createElement("div");
                    div.editorid = this.editorid;
                    div.controlkey = obj.id;
                    div.className = "osmilie";
                    div.attachmentid = id;
                    div.style.whiteSpace = "nowrap";
                    div.innerHTML = '<img src="' + vB_Attachments.attachments[id]["imgpath"] + '" alt="" /> ' + vB_Attachments.attachments[id]["filename"];
                    div.onmouseover = div.onmouseout = div.onmousedown = div.onmouseup = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                    div.onclick = vB_Text_Editor_Events.prototype.attachoption_onclick;
                    menu.appendChild(div);
                    attach_count++
                }
                if (attach_count > 1) {
                    div = document.createElement("div");
                    div.editorid = this.editorid;
                    div.controlkey = obj.id;
                    div.className = "osmilie";
                    div.style.fontWeight = "bold";
                    div.style.paddingLeft = "25px";
                    div.style.whiteSpace = "nowrap";
                    div.innerHTML = vbphrase.insert_all;
                    div.onmouseover = div.onmouseout = div.onmousedown = div.onmouseup = vB_Text_Editor_Events.prototype.menuoption_onmouseevent;
                    div.onclick = vB_Text_Editor_Events.prototype.attachinsertall_onclick;
                    menu.appendChild(div)
                }
            } else {
                while (menu.options.length > 2) {
                    menu.remove(menu.options.length - 1)
                }
                for (id in vB_Attachments.attachments) {
                    if (!YAHOO.lang.hasOwnProperty(vB_Attachments.attachments, id)) {
                        continue
                    }
                    var opt = document.createElement("option");
                    opt.value = id;
                    opt.text = vB_Attachments.attachments[id]["filename"];
                    menu.add(opt, is_ie ? menu.options.length : null)
                }
            }
            set_unselectable(menu)
        };
        this.menu_context = function (obj, state) {
            if (this.disabled) {
                return
            }
            switch (obj.state) {
            case true:
                this.set_control_style(obj, "button", "down");
                break;
            default:
                switch (state) {
                case "mouseout":
                    this.set_control_style(obj, "button", "normal");
                    break;
                case "mousedown":
                    this.set_control_style(obj, "popup", "down");
                    break;
                case "mouseup":
                case "mouseover":
                    this.set_control_style(obj, "button", "hover");
                    break
                }
            }
        };
        this.button_context = function (obj, state, controltype) {
            if (this.disabled) {
                return
            }
            if (typeof controltype == "undefined") {
                controltype = "button"
            }
            switch (obj.state) {
            case true:
                switch (state) {
                case "mouseover":
                case "mousedown":
                case "mouseup":
                    this.set_control_style(obj, controltype, "down");
                    break;
                case "mouseout":
                    this.set_control_style(obj, controltype, "selected");
                    break
                }
                break;
            default:
                switch (state) {
                case "mouseover":
                case "mouseup":
                    this.set_control_style(obj, controltype, "hover");
                    break;
                case "mousedown":
                    this.set_control_style(obj, controltype, "down");
                    break;
                case "mouseout":
                    this.set_control_style(obj, controltype, "normal");
                    break
                }
                break
            }
        };
        this.set_control_style = function (obj, controltype, mode) {
            if (obj.mode != mode) {
                obj.mode = mode;
                istyle = "pi_" + controltype + "_" + obj.mode;
                if (typeof istyles != "undefined" && typeof istyles[istyle] != "undefined") {
                    obj.style.background = istyles[istyle][0];
                    obj.style.color = istyles[istyle][1];
                    if (controltype != "menu") {
                        obj.style.padding = istyles[istyle][2]
                    }
                    obj.style.border = istyles[istyle][3];
                    var tds = fetch_tags(obj, "td");
                    for (var i = 0; i < tds.length; i++) {
                        switch (tds[i].className) {
                        case "popup_feedback":
                            if ("left" == this.ltr) {
                                tds[i].style.borderRight = (mode == "normal" ? istyles.pi_menu_normal[3] : istyles[istyle][3])
                            } else {
                                tds[i].style.borderLeft = (mode == "normal" ? istyles.pi_menu_normal[3] : istyles[istyle][3])
                            }
                            break;
                        case "popup_pickbutton":
                            tds[i].style.borderColor = (mode == "normal" ? istyles.pi_menu_normal[0] : istyles[istyle][0]);
                            break;
                        case "alt_pickbutton":
                            if (obj.state) {
                                if ("left" == this.ltr) {
                                    tds[i].style.paddingLeft = istyles.pi_button_normal[2];
                                    tds[i].style.borderLeft = istyles.pi_button_normal[3]
                                } else {
                                    tds[i].style.paddingRight = istyles.pi_button_normal[2];
                                    tds[i].style.borderRight = istyles.pi_button_normal[3]
                                }
                            } else {
                                if ("left" == this.ltr) {
                                    tds[i].style.paddingLeft = istyles[istyle][2];
                                    tds[i].style.borderLeft = istyles[istyle][3]
                                } else {
                                    tds[i].style.paddingRight = istyles[istyle][2];
                                    tds[i].style.borderRight = istyles[istyle][3]
                                }
                            }
                        }
                    }
                }
            }
        };
        this.format = function (e, cmd, arg) {
            e = do_an_e(e);
            if (this.disabled) {
                return false
            }
            if (cmd != "redo") {
                this.history.add_snapshot(this.get_editor_contents())
            }
            if (cmd == "switchmode") {
                switch_editor_mode(this.editorid);
                return
            } else {
                if (cmd.substr(0, 6) == "resize") {
                    var size_change = parseInt(cmd.substr(9), 10);
                    var change_direction = parseInt(cmd.substr(7, 1), 10) == "1" ? 1 : -1;
                    this.resize_editor(size_change * change_direction);
                    return
                }
            }
            this.check_focus();
            var ret;
            if (cmd.substr(0, 4) == "wrap") {
                ret = this.wrap_tags(cmd.substr(6), (cmd.substr(4, 1) == "1" ? true : false))
            } else {
                if (this[cmd]) {
                    ret = this[cmd](e)
                } else {
                    try {
                        ret = this.apply_format(cmd, false, (typeof arg == "undefined" ? true : arg))
                    } catch (e) {
                        this.handle_error(cmd, e);
                        ret = false
                    }
                }
            } if (cmd != "undo") {
                this.history.add_snapshot(this.get_editor_contents())
            }
            this.set_context(cmd);
            this.check_focus();
            return ret
        };
        this.insertimage = function (e, img) {
            if (typeof img == "undefined") {
                img = this.show_prompt(vbphrase.enter_image_url, "http://", true)
            }
            if (img = this.verify_prompt(img)) {
                return this.apply_format("insertimage", false, img)
            } else {
                return false
            }
        };
        this.wrap_tags = function (tagname, useoption, selection) {
            tagname = tagname.toUpperCase();
            switch (tagname) {
            case "CODE":
            case "HTML":
            case "PHP":
                this.apply_format("removeformat");
                break
            }
            if (typeof selection == "undefined") {
                selection = this.get_selection();
                if (selection === false) {
                    selection = ""
                } else {
                    selection = new String(selection)
                }
            }
            var opentag;
            if (useoption === true) {
                var option = this.show_prompt(construct_phrase(vbphrase.enter_tag_option, ("[" + tagname + "]")), "", false);
                if (option = this.verify_prompt(option)) {
                    opentag = "[" + tagname + '="' + option + '"]'
                } else {
                    return false
                }
            } else {
                if (useoption !== false) {
                    opentag = "[" + tagname + '="' + useoption + '"]'
                } else {
                    opentag = "[" + tagname + "]"
                }
            }
            var closetag = "[/" + tagname + "]";
            var text = opentag + selection + closetag;
            this.insert_text(text, opentag.vBlength(), closetag.vBlength());
            return false
        };
        this.spelling = function () {
            if (is_ie) {
                try {
                    eval("new ActiveXObject('ieSpell.ieSpellExtension').CheckDocumentNode(this.spellobj);")
                } catch (e) {
                    if (e.number == -2146827859 && confirm(vbphrase.iespell_not_installed)) {
                        window.open("http://www.iespell.com/download.php")
                    }
                }
            } else {
                if (is_moz) {}
            }
        };
        this.handle_error = function (cmd, e) {};
        this.show_prompt = function (dialogtxt, defaultval, forceltr) {
            var returnvalue;
            if (YAHOO.env.ua.ie >= 7) {
                var base_tag = fetch_tags(document, "base");
                var modal_prefix;
                if (base_tag && base_tag[0] && base_tag[0].href) {
                    modal_prefix = base_tag[0].href
                } else {
                    modal_prefix = ""
                }
                returnvalue = window.showModalDialog(modal_prefix + "clientscript/ieprompt.html?", {
                    value: defaultval,
                    label: dialogtxt,
                    dir: document.dir,
                    title: document.title,
                    forceltr: (typeof (forceltr) != "undefined" ? forceltr : false)
                }, "dialogWidth:320px; dialogHeight:150px; dialogTop:" + (parseInt(window.screenTop) + parseInt(window.event.clientY) + parseInt(document.body.scrollTop) - 100) + "px; dialogLeft:" + (parseInt(window.screenLeft) + parseInt(window.event.clientX) + parseInt(document.body.scrollLeft) - 160) + "px; resizable: No;")
            } else {
                returnvalue = prompt(dialogtxt, defaultval)
            } if (typeof (returnvalue) == "undefined") {
                return false
            } else {
                if (returnvalue == false || returnvalue == null) {
                    return returnvalue
                } else {
                    return PHP.trim(new String(returnvalue))
                }
            }
        };
        this.verify_prompt = function (str) {
            switch (str) {
            case "http://":
            case "null":
            case "undefined":
            case "false":
            case "":
            case null:
            case false:
                return false;
            default:
                return str
            }
        };
        this.open_smilie_window = function (width, height) {
            smilie_window = openWindow("misc.php?" + SESSIONURL + "do=getsmilies&editorid=" + this.editorid, width, height, "smilie_window");
            window.onunload = vB_Text_Editor_Events.prototype.smiliewindow_onunload
        };
        this.resize_editor = function (change) {
            var newheight = parseInt(this.editbox.style.height, 10) + change;
            if (newheight >= 60) {
                this.editbox.style.height = newheight + "px";
                if (change % 99 != 0) {
                    set_cookie("editor_height", newheight)
                }
            }
        };
        this.destroy_popup = function (popupname) {
            this.popups[popupname].parentNode.removeChild(this.popups[popupname]);
            this.popups[popupname] = null
        };
        this.destroy = function () {
            var i;
            for (i in this.buttons) {
                if (YAHOO.lang.hasOwnProperty(this.buttons, i)) {
                    this.set_control_style(this.buttons[i], "button", "normal")
                }
            }
            for (var menu in this.popups) {
                if (YAHOO.lang.hasOwnProperty(this.popups, menu)) {
                    this.destroy_popup(menu)
                }
            }
            if (this.fontoptions) {
                for (i in this.fontoptions) {
                    if (YAHOO.lang.hasOwnProperty(this.fontoptions, i) && i != "") {
                        this.fontoptions[i].parentNode.removeChild(this.fontoptions[i])
                    }
                }
                this.fontoptions[""].style.display = ""
            }
            if (this.sizeoptions) {
                for (i in this.sizeoptions) {
                    if (YAHOO.lang.hasOwnProperty(this.sizeoptions, i) && i != "") {
                        this.sizeoptions[i].parentNode.removeChild(this.sizeoptions[i])
                    }
                }
                this.sizeoptions[""].style.display = ""
            }
        };
        this.collapse_selection_end = function () {
            var range;
            if (this.editdoc.selection) {
                range = this.editdoc.selection.createRange();
                eval("range.move('character', -1);");
                range.collapse(false);
                range.select()
            } else {
                if (document.selection && document.selection.createRange) {
                    range = document.selection.createRange();
                    range.collapse(false);
                    range.select()
                } else {
                    if (typeof (this.editdoc.selectionStart) != "undefined") {
                        var sel_text = this.editdoc.value.substr(this.editdoc.selectionStart, this.editdoc.selectionEnd - this.editdoc.selectionStart);
                        this.editdoc.selectionStart = this.editdoc.selectionStart + sel_text.vBlength()
                    } else {
                        if (window.getSelection) {}
                    }
                }
            }
        };
        if (this.wysiwyg_mode) {
            this.disable_editor = function (text) {
                if (!this.disabled) {
                    this.disabled = true;
                    var hider = fetch_object(this.editorid + "_hider");
                    if (hider) {
                        hider.parentNode.removeChild(hider)
                    }
                    var div = document.createElement("div");
                    div.id = this.editorid + "_hider";
                    div.className = "wysiwyg";
                    div.style.border = "2px inset";
                    div.style.margin = "0px";
                    div.style.padding = "0px";
                    div.style.width = this.editbox.style.width;
                    div.style.height = this.editbox.style.height;
                    var childdiv = document.createElement("div");
                    childdiv.style.margin = "8px";
                    childdiv.innerHTML = text;
                    div.appendChild(childdiv);
                    this.editbox.parentNode.appendChild(div);
                    this.editbox.style.width = "0px";
                    this.editbox.style.height = "0px";
                    this.editbox.style.border = "none"
                }
            };
            this.enable_editor = function (text) {
                if (typeof text != "undefined") {
                    this.set_editor_contents(text)
                }
                var hider = fetch_object(this.editorid + "_hider");
                if (hider) {
                    hider.parentNode.removeChild(hider)
                }
                this.disabled = false
            };
            this.write_editor_contents = function (text, doinit) {
                if (text == "") {
                    if (is_ie) {
                        text = "<p></p>"
                    } else {
                        if (is_moz) {
                            text = "<br />"
                        }
                    }
                }
                if (this.editdoc && this.editdoc.initialized) {
                    this.editdoc.body.innerHTML = text
                } else {
                    this.editdoc = this.editwin.document;
                    this.editdoc.open("text/html", "replace");
                    this.editdoc.write(text);
                    this.editdoc.close();
                    if (doinit) {
                        if (is_moz) {
                            this.editdoc.designMode = "on"
                        } else {
                            this.editdoc.body.contentEditable = true
                        }
                    }
                    this.editdoc.body.spellcheck = true;
                    this.editdoc.initialized = true;
                    this.set_editor_style()
                }
                this.set_direction()
            };
            this.set_editor_contents = function (initial_text) {
                if (fetch_object(this.editorid + "_iframe")) {
                    this.editbox = fetch_object(this.editorid + "_iframe")
                } else {
                    var iframe = document.createElement("iframe");
                    if (is_ie && window.location.protocol == "https:") {
                        iframe.src = "clientscript/index.html"
                    }
                    this.editbox = this.textobj.parentNode.appendChild(iframe);
                    this.editbox.id = this.editorid + "_iframe";
                    this.editbox.tabIndex = 1
                } if (!is_ie) {
                    this.editbox.style.border = "2px inset"
                }
                this.set_editor_width(typeof (this.textobj.style.oWidth) != "undefined" ? this.textobj.style.oWidth : this.textobj.style.width);
                this.editbox.style.height = this.textobj.style.height;
                this.textobj.style.display = "none";
                this.editwin = this.editbox.contentWindow;
                this.editdoc = this.editwin.document;
                this.write_editor_contents((typeof initial_text == "undefined" ? this.textobj.value : initial_text), true);
                if (this.editdoc.dir == "rtl") {}
                this.spellobj = this.editdoc.body;
                this.editdoc.editorid = this.editorid;
                this.editwin.editorid = this.editorid
            };
            this.set_editor_width = function (width, overwrite_original) {
                this.editbox.style.width = width
            };
            this.set_direction = function () {
                this.editdoc.dir = this.textobj.dir
            };
            this.set_editor_style = function () {
                var wysiwyg_csstext = "";
                var have_usercss = false;
                var all_stylesheets = fetch_all_stylesheets(document.styleSheets);
                for (var ss = 0; ss < all_stylesheets.length; ss++) {
                    try {
                        var rules = (all_stylesheets[ss].cssRules ? all_stylesheets[ss].cssRules : all_stylesheets[ss].rules);
                        if (rules.length <= 0) {
                            continue
                        }
                    } catch (e) {
                        continue
                    }
                    for (var i = 0; i < rules.length; i++) {
                        if (!rules[i].selectorText) {
                            continue
                        }
                        var process = false;
                        var selectors = new Array();
                        if (rules[i].selectorText.indexOf(".wysiwyg") >= 0) {
                            var split_selectors = rules[i].selectorText.split(",");
                            for (var selid = 0; selid < split_selectors.length; selid++) {
                                if (split_selectors[selid].indexOf(".wysiwyg") >= 0) {
                                    selectors.push(split_selectors[selid])
                                }
                                if (split_selectors[selid].indexOf("#usercss") >= 0) {
                                    have_usercss = true
                                }
                            }
                            process = true
                        }
                        if (process) {
                            var css_rules = "{ " + rules[i].style.cssText + " }";
                            if (is_moz) {
                                css_rules = css_rules.replace(/; /g, " !important; ")
                            }
                            wysiwyg_csstext += selectors.join(", ") + " " + css_rules + "\n"
                        }
                    }
                }
                wysiwyg_csstext += " p { margin: 0px; } .inlineimg { vertical-align: middle; }";
                if (is_ie) {
                    this.editdoc.createStyleSheet().cssText = wysiwyg_csstext
                } else {
                    var newss = this.editdoc.createElement("style");
                    newss.type = "text/css";
                    newss.innerHTML = wysiwyg_csstext;
                    this.editdoc.documentElement.childNodes[0].appendChild(newss)
                } if (have_usercss) {
                    this.editdoc.body.parentNode.id = "usercss"
                }
                this.editdoc.body.className = "wysiwyg"
            };
            this.set_editor_functions = function () {
                this.editdoc.onmouseup = vB_Text_Editor_Events.prototype.editdoc_onmouseup;
                this.editdoc.onkeyup = vB_Text_Editor_Events.prototype.editdoc_onkeyup;
                if (this.editdoc.attachEvent) {
                    this.editdoc.body.attachEvent("onresizestart", vB_Text_Editor_Events.prototype.editdoc_onresizestart)
                }
                this.editwin.onfocus = vB_Text_Editor_Events.prototype.editwin_onfocus;
                this.editwin.onblur = vB_Text_Editor_Events.prototype.editwin_onblur
            };
            this.set_context = function (cmd) {
                for (var i in contextcontrols) {
                    if (!YAHOO.lang.hasOwnProperty(contextcontrols, i)) {
                        continue
                    }
                    var obj = fetch_object(this.editorid + "_cmd_" + contextcontrols[i]);
                    if (obj != null) {
                        var state = this.editdoc.queryCommandState(contextcontrols[i]);
                        if (obj.state != state) {
                            obj.state = state;
                            this.button_context(obj, (obj.cmd == cmd ? "mouseover" : "mouseout"))
                        }
                    }
                }
                this.set_font_context();
                this.set_size_context();
                this.set_color_context()
            };
            this.set_font_context = function (fontstate) {
                if (this.buttons.fontname) {
                    if (typeof fontstate == "undefined") {
                        fontstate = this.editdoc.queryCommandValue("fontname")
                    }
                    switch (fontstate) {
                    case "":
                        if (!is_ie && window.getComputedStyle) {
                            fontstate = this.editdoc.body.style.fontFamily
                        }
                        break;
                    case null:
                        fontstate = "";
                        break
                    }
                    if (fontstate != this.fontstate) {
                        this.fontstate = fontstate;
                        var thingy = PHP.ucfirst(this.fontstate, ",");
                        var i;
                        if (this.popupmode) {
                            for (i in this.fontoptions) {
                                if (YAHOO.lang.hasOwnProperty(this.fontoptions, i)) {
                                    this.fontoptions[i].style.display = (i == thingy ? "" : "none")
                                }
                            }
                        } else {
                            for (i = 0; i < this.buttons.fontname.options.length; i++) {
                                if (this.buttons.fontname.options[i].value == thingy) {
                                    this.buttons.fontname.selectedIndex = i;
                                    break
                                }
                            }
                        }
                    }
                }
            };
            this.set_size_context = function (sizestate) {
                if (this.buttons.fontsize) {
                    if (typeof sizestate == "undefined") {
                        sizestate = this.editdoc.queryCommandValue("fontsize")
                    }
                    switch (sizestate) {
                    case null:
                    case "":
                        if (is_moz) {
                            sizestate = this.translate_fontsize(this.editdoc.body.style.fontSize)
                        }
                        break
                    }
                    if (sizestate != this.sizestate) {
                        this.sizestate = sizestate;
                        var i;
                        if (this.popupmode) {
                            for (i in this.sizeoptions) {
                                if (YAHOO.lang.hasOwnProperty(this.sizeoptions, i)) {
                                    this.sizeoptions[i].style.display = (i == this.sizestate ? "" : "none")
                                }
                            }
                        } else {
                            for (i = 0; i < this.buttons.fontsize.options.length; i++) {
                                if (this.buttons.fontsize.options[i].value == this.sizestate) {
                                    this.buttons.fontsize.selectedIndex = i;
                                    break
                                }
                            }
                        }
                    }
                }
            };
            this.set_color_context = function (colorstate) {
                if (this.buttons.forecolor) {
                    if (typeof colorstate == "undefined") {
                        colorstate = this.editdoc.queryCommandValue("forecolor")
                    }
                    if (colorstate != this.colorstate) {
                        if (this.popupmode) {
                            var obj = fetch_object(this.editorid + "_color_" + this.translate_color_commandvalue(this.colorstate));
                            if (obj != null) {
                                obj.state = false;
                                this.button_context(obj, "mouseout", "menu")
                            }
                            this.colorstate = colorstate;
                            elmid = this.editorid + "_color_" + this.translate_color_commandvalue(colorstate);
                            obj = fetch_object(elmid);
                            if (obj != null) {
                                obj.state = true;
                                this.button_context(obj, "mouseout", "menu")
                            }
                        } else {
                            this.colorstate = colorstate;
                            colorstate = this.translate_color_commandvalue(this.colorstate);
                            for (var i = 0; i < this.buttons.forecolor.options.length; i++) {
                                if (this.buttons.forecolor.options[i].value == colorstate) {
                                    this.buttons.forecolor.selectedIndex = i;
                                    break
                                }
                            }
                        }
                    }
                }
            };
            this.translate_color_commandvalue = function (forecolor) {
                return this.translate_silly_hex((forecolor & 255).toString(16), ((forecolor >> 8) & 255).toString(16), ((forecolor >> 16) & 255).toString(16))
            };
            this.translate_silly_hex = function (r, g, b) {
                return coloroptions["#" + (PHP.str_pad(r, 2, 0) + PHP.str_pad(g, 2, 0) + PHP.str_pad(b, 2, 0)).toUpperCase()]
            };
            this.apply_format = function (cmd, dialog, argument) {
                this.editdoc.execCommand(cmd, (typeof dialog == "undefined" ? false : dialog), (typeof argument == "undefined" ? true : argument));
                return false
            };
            this.createlink = function (e, url) {
                return this.apply_format("createlink", is_ie, (typeof url == "undefined" ? true : url))
            };
            this.email = function (e, email) {
                if (typeof email == "undefined") {
                    email = this.show_prompt(vbphrase.enter_email_link, "", true)
                }
                email = this.verify_prompt(email);
                if (email === false) {
                    return this.apply_format("unlink")
                } else {
                    var selection = this.get_selection();
                    return this.insert_text('<a href="mailto:' + email + '">' + (selection ? selection : email) + "</a>", (selection ? true : false))
                }
            };
            this.insert_smilie = function (e, smilietext, smiliepath, smilieid) {
                this.check_focus();
                return this.insert_text('<img src="' + smiliepath + '" border="0" class="inlineimg" alt="0" smilieid="' + smilieid + '" />', false)
            };
            this.get_editor_contents = function () {
                return this.editdoc.body.innerHTML
            };
            this.get_selection = function () {
                var range = this.editdoc.selection.createRange();
                if (range.htmlText && range.text) {
                    return range.htmlText
                } else {
                    var do_not_steal_this_code_html = "";
                    for (var i = 0; i < range.length; i++) {
                        do_not_steal_this_code_html += range.item(i).outerHTML
                    }
                    return do_not_steal_this_code_html
                }
            };
            this.insert_text = function (text, movestart, moveend) {
                this.check_focus();
                if (typeof (this.editdoc.selection) != "undefined" && this.editdoc.selection.type != "Text" && this.editdoc.selection.type != "None") {
                    movestart = false;
                    this.editdoc.selection.clear()
                }
                var sel = this.editdoc.selection.createRange();
                sel.pasteHTML(text);
                if (text.indexOf("\n") == -1) {
                    if (movestart === false) {} else {
                        if (typeof movestart != "undefined") {
                            sel.moveStart("character", -text.vBlength() + movestart);
                            sel.moveEnd("character", -moveend)
                        } else {
                            sel.moveStart("character", -text.vBlength())
                        }
                    }
                    sel.select()
                }
            };
            this.prepare_submit = function (subjecttext, minchars) {
                this.textobj.value = this.get_editor_contents();
                var returnvalue = validatemessage(stripcode(this.textobj.value, true), subjecttext, minchars);
                if (returnvalue) {
                    return returnvalue
                } else {
                    if (this.captcha != null && this.captcha.failed) {
                        return false
                    } else {
                        this.check_focus();
                        return false
                    }
                }
            };
            if (is_moz) {
                this._set_editor_contents = this.set_editor_contents;
                this.set_editor_contents = function (initial_text) {
                    this._set_editor_contents(initial_text);
                    this.editdoc.addEventListener("keypress", vB_Text_Editor_Events.prototype.editdoc_onkeypress, true)
                };
                this.translate_color_commandvalue = function (forecolor) {
                    if (forecolor == "" || forecolor == null) {
                        forecolor = window.getComputedStyle(this.editdoc.body, null).getPropertyValue("color")
                    }
                    if (forecolor.toLowerCase().indexOf("rgb") == 0) {
                        var matches = forecolor.match(/^rgb\s*\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)$/);
                        if (matches) {
                            return this.translate_silly_hex((matches[1] & 255).toString(16), (matches[2] & 255).toString(16), (matches[3] & 255).toString(16))
                        } else {
                            return this.translate_color_commandvalue(null)
                        }
                    } else {
                        return forecolor
                    }
                };
                this.translate_fontsize = function (csssize) {
                    switch (csssize) {
                    case "7.5pt":
                    case "10px":
                        return 1;
                    case "10pt":
                        return 2;
                    case "12pt":
                        return 3;
                    case "14pt":
                        return 4;
                    case "18pt":
                        return 5;
                    case "24pt":
                        return 6;
                    case "36pt":
                        return 7;
                    default:
                        return ""
                    }
                };
                this._apply_format = this.apply_format;
                this.apply_format = function (cmd, dialog, arg) {
                    this.editdoc.execCommand("useCSS", false, true);
                    return this._apply_format(cmd, dialog, arg)
                };
                this._createlink = this.createlink;
                this.createlink = function (e, url) {
                    if (typeof url == "undefined") {
                        url = this.show_prompt(vbphrase.enter_link_url, "http://", true)
                    }
                    if ((url = this.verify_prompt(url)) !== false) {
                        if (this.get_selection()) {
                            this.apply_format("unlink");
                            this._createlink(e, url)
                        } else {
                            this.insert_text('<a href="' + url + '">' + url + "</a>")
                        }
                    }
                    return true
                };
                this.insert_smilie = function (e, smilietext, smiliepath, smilieid) {
                    this.check_focus();
                    try {
                        this.apply_format("InsertImage", false, smiliepath);
                        var smilies = fetch_tags(this.editdoc.body, "img");
                        for (var i = 0; i < smilies.length; i++) {
                            if (smilies[i].src == smiliepath) {
                                smilies[i].className = "inlineimg";
                                if (smilies[i].getAttribute("smilieid") < 1) {
                                    smilies[i].setAttribute("smilieid", smilieid);
                                    smilies[i].setAttribute("border", "0")
                                }
                            }
                        }
                    } catch (e) {}
                };
                this.get_selection = function () {
                    selection = this.editwin.getSelection();
                    this.check_focus();
                    var range = selection ? selection.getRangeAt(0) : this.editdoc.createRange();
                    return this.read_nodes(range.cloneContents(), false)
                };
                this.insert_text = function (str) {
                    this.editdoc.execCommand("insertHTML", false, str)
                };
                this.set_editor_functions = function () {
                    this.editdoc.addEventListener("mouseup", vB_Text_Editor_Events.prototype.editdoc_onmouseup, true);
                    this.editdoc.addEventListener("keyup", vB_Text_Editor_Events.prototype.editdoc_onkeyup, true);
                    this.editwin.addEventListener("focus", vB_Text_Editor_Events.prototype.editwin_onfocus, true);
                    this.editwin.addEventListener("blur", vB_Text_Editor_Events.prototype.editwin_onblur, true)
                };
                this.add_range = function (node) {
                    this.check_focus();
                    var sel = this.editwin.getSelection();
                    var range = this.editdoc.createRange();
                    range.selectNodeContents(node);
                    sel.removeAllRanges();
                    sel.addRange(range)
                };
                this.read_nodes = function (root, toptag) {
                    var html = "";
                    var moz_check = /_moz/i;
                    switch (root.nodeType) {
                    case Node.ELEMENT_NODE:
                    case Node.DOCUMENT_FRAGMENT_NODE:
                        var closed;
                        var i;
                        if (toptag) {
                            closed = !root.hasChildNodes();
                            html = "<" + root.tagName.toLowerCase();
                            var attr = root.attributes;
                            for (i = 0; i < attr.length; ++i) {
                                var a = attr.item(i);
                                if (!a.specified || a.name.match(moz_check) || a.value.match(moz_check)) {
                                    continue
                                }
                                html += " " + a.name.toLowerCase() + '="' + a.value + '"'
                            }
                            html += closed ? " />" : ">"
                        }
                        for (i = root.firstChild; i; i = i.nextSibling) {
                            html += this.read_nodes(i, true)
                        }
                        if (toptag && !closed) {
                            html += "</" + root.tagName.toLowerCase() + ">"
                        }
                        break;
                    case Node.TEXT_NODE:
                        html = PHP.htmlspecialchars(root.data);
                        break
                    }
                    return html
                };
                this.insert_node_at_selection = function (text) {
                    this.check_focus();
                    var sel = this.editwin.getSelection();
                    var range = sel ? sel.getRangeAt(0) : this.editdoc.createRange();
                    sel.removeAllRanges();
                    range.deleteContents();
                    var node = range.startContainer;
                    var pos = range.startOffset;
                    switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        if (text.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
                            selNode = text.firstChild
                        } else {
                            selNode = text
                        }
                        node.insertBefore(text, node.childNodes[pos]);
                        this.add_range(selNode);
                        break;
                    case Node.TEXT_NODE:
                        if (text.nodeType == Node.TEXT_NODE) {
                            var text_length = pos + text.length;
                            node.insertData(pos, text.data);
                            range = this.editdoc.createRange();
                            range.setEnd(node, text_length);
                            range.setStart(node, text_length);
                            sel.addRange(range)
                        } else {
                            node = node.splitText(pos);
                            var selNode;
                            if (text.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
                                selNode = text.firstChild
                            } else {
                                selNode = text
                            }
                            node.parentNode.insertBefore(text, node);
                            this.add_range(selNode)
                        }
                        break
                    }
                }
            } else {
                if (is_opera) {
                    this._createlink = this.createlink;
                    this.createlink = function (e, url) {
                        if (typeof url == "undefined") {
                            url = this.show_prompt(vbphrase.enter_link_url, "http://", true)
                        }
                        if ((url = this.verify_prompt(url)) !== false) {
                            if (this.get_selection()) {
                                this.apply_format("unlink");
                                this._createlink(e, url)
                            } else {
                                this.insert_text('<a href="' + url + '">' + url + "</a>")
                            }
                        }
                        return true
                    };
                    this.insert_smilie = function (e, smilietext, smiliepath, smilieid) {
                        this.check_focus();
                        try {
                            this.apply_format("InsertImage", false, smiliepath);
                            var smilies = fetch_tags(this.editdoc.body, "img");
                            for (var i = 0; i < smilies.length; i++) {
                                if (smilies[i].src == smiliepath) {
                                    smilies[i].className = "inlineimg";
                                    if (smilies[i].getAttribute("smilieid") < 1) {
                                        smilies[i].setAttribute("smilieid", smilieid);
                                        smilies[i].setAttribute("border", "0")
                                    }
                                }
                            }
                        } catch (e) {}
                    };
                    this.get_selection = function () {
                        selection = this.editwin.getSelection();
                        this.check_focus();
                        range = selection ? selection.getRangeAt(0) : this.editdoc.createRange();
                        var lsserializer = document.implementation.createLSSerializer();
                        return lsserializer.writeToString(range.cloneContents())
                    };
                    this.insert_text = function (str) {
                        this.editdoc.execCommand("insertHTML", false, str)
                    }
                }
            }
        } else {
            this.disable_editor = function (text) {
                if (!this.disabled) {
                    this.disabled = true;
                    if (typeof text != "undefined") {
                        this.editbox.value = text
                    }
                    this.editbox.disabled = true
                }
            };
            this.enable_editor = function (text) {
                if (typeof text != "undefined") {
                    this.editbox.value = text
                }
                this.editbox.disabled = false;
                this.disabled = false
            };
            this.write_editor_contents = function (text) {
                this.textobj.value = text
            };
            this.set_editor_contents = function (initial_text) {
                var iframe = this.textobj.parentNode.getElementsByTagName("iframe")[0];
                if (iframe) {
                    this.textobj.style.display = "";
                    this.textobj.style.width = iframe.style.width;
                    this.textobj.style.height = iframe.style.height;
                    iframe.style.width = "0px";
                    iframe.style.height = "0px";
                    iframe.style.border = "none"
                }
                this.editwin = this.textobj;
                this.editdoc = this.textobj;
                this.editbox = this.textobj;
                this.spellobj = this.textobj;
                this.set_editor_width(this.textobj.style.width);
                if (typeof initial_text != "undefined") {
                    this.write_editor_contents(initial_text)
                }
                this.editdoc.editorid = this.editorid;
                this.editwin.editorid = this.editorid;
                this.history.add_snapshot(this.get_editor_contents())
            };
            this.set_editor_width = function (width, overwrite_original) {
                if (typeof (this.textobj.style.oWidth) == "undefined" || overwrite_original) {
                    this.textobj.style.oWidth = width
                }
                if (is_ie) {
                    this.textobj.style.width = this.textobj.style.oWidth;
                    var orig_offset = this.textobj.offsetWidth;
                    if (orig_offset > 0) {
                        this.textobj.style.width = orig_offset + "px";
                        this.textobj.style.width = (orig_offset + orig_offset - this.textobj.offsetWidth) + "px"
                    }
                } else {
                    this.textobj.style.width = width
                }
            };
            this.set_editor_style = function () {};
            this.set_editor_functions = function () {
                if (this.editdoc.addEventListener) {
                    this.editdoc.addEventListener("keypress", vB_Text_Editor_Events.prototype.editdoc_onkeypress, false)
                } else {
                    if (is_ie) {
                        this.editdoc.onkeydown = vB_Text_Editor_Events.prototype.editdoc_onkeypress
                    }
                }
                this.editwin.onfocus = vB_Text_Editor_Events.prototype.editwin_onfocus;
                this.editwin.onblur = vB_Text_Editor_Events.prototype.editwin_onblur
            };
            this.set_context = function () {};
            this.apply_format = function (cmd, dialog, argument) {
                switch (cmd) {
                case "bold":
                case "italic":
                case "underline":
                    this.wrap_tags(cmd.substr(0, 1), false);
                    return;
                case "justifyleft":
                case "justifycenter":
                case "justifyright":
                    this.wrap_tags(cmd.substr(7), false);
                    return;
                case "indent":
                    this.wrap_tags(cmd, false);
                    return;
                case "fontname":
                    this.wrap_tags("font", argument);
                    return;
                case "fontsize":
                    this.wrap_tags("size", argument);
                    return;
                case "forecolor":
                    this.wrap_tags("color", argument);
                    return;
                case "createlink":
                    var sel = this.get_selection();
                    if (sel) {
                        this.wrap_tags("url", argument)
                    } else {
                        this.wrap_tags("url", argument, argument)
                    }
                    return;
                case "insertimage":
                    this.wrap_tags("img", false, argument);
                    return;
                case "removeformat":
                    return
                }
            };
            this.undo = function () {
                this.history.add_snapshot(this.get_editor_contents());
                this.history.move_cursor(-1);
                var str;
                if ((str = this.history.get_snapshot()) !== false) {
                    this.editdoc.value = str
                }
            };
            this.redo = function () {
                this.history.move_cursor(1);
                var str;
                if ((str = this.history.get_snapshot()) !== false) {
                    this.editdoc.value = str
                }
            };
            this.strip_simple = function (tag, str, iterations) {
                var opentag = "[" + tag + "]";
                var closetag = "[/" + tag + "]";
                if (typeof iterations == "undefined") {
                    iterations = -1
                }
                while ((startindex = PHP.stripos(str, opentag)) !== false && iterations != 0) {
                    iterations--;
                    if ((stopindex = PHP.stripos(str, closetag)) !== false) {
                        var text = str.substr(startindex + opentag.length, stopindex - startindex - opentag.length);
                        str = str.substr(0, startindex) + text + str.substr(stopindex + closetag.length)
                    } else {
                        break
                    }
                }
                return str
            };
            this.strip_complex = function (tag, str, iterations) {
                var opentag = "[" + tag + "=";
                var closetag = "[/" + tag + "]";
                if (typeof iterations == "undefined") {
                    iterations = -1
                }
                while ((startindex = PHP.stripos(str, opentag)) !== false && iterations != 0) {
                    iterations--;
                    if ((stopindex = PHP.stripos(str, closetag)) !== false) {
                        var openend = PHP.stripos(str, "]", startindex);
                        if (openend !== false && openend > startindex && openend < stopindex) {
                            var text = str.substr(openend + 1, stopindex - openend - 1);
                            str = str.substr(0, startindex) + text + str.substr(stopindex + closetag.length)
                        } else {
                            break
                        }
                    } else {
                        break
                    }
                }
                return str
            };
            this.removeformat = function (e) {
                var simplestrip = new Array("b", "i", "u");
                var complexstrip = new Array("font", "color", "size");
                var str = this.get_selection();
                if (str === false) {
                    return
                }
                var tag;
                for (tag in simplestrip) {
                    if (YAHOO.lang.hasOwnProperty(simplestrip, tag)) {
                        str = this.strip_simple(simplestrip[tag], str)
                    }
                }
                for (tag in complexstrip) {
                    if (YAHOO.lang.hasOwnProperty(complexstrip, tag)) {
                        str = this.strip_complex(complexstrip[tag], str)
                    }
                }
                this.insert_text(str)
            };
            this.createlink = function (e, url) {
                this.prompt_link("url", url, vbphrase.enter_link_url, "http://")
            };
            this.unlink = function (e) {
                var sel = this.get_selection();
                sel = this.strip_simple("url", sel);
                sel = this.strip_complex("url", sel);
                this.insert_text(sel)
            };
            this.email = function (e, email) {
                this.prompt_link("email", email, vbphrase.enter_email_link, "")
            };
            this.insertsketchfab = function(e, url) {
                var promptText = 'Please enter a valid model url.\n\n' +
                                 '(example: https://sketchfab.com/show/x4ATBGtYWDF0yOyoi13xTwG9gkm)';

                if (typeof url == "undefined") {
                    url = this.show_prompt(promptText, "http://", true)
                }
                if (url = this.verify_prompt(url)) {
                    url = url.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    var regexp = /^(http|https):\/\/sketchfab.com\/show\/(.+)$/;
                    if (!regexp.test(url)) {
                        alert(promptText);
                        return false;
                    }
                    var modelId = url.substring(url.lastIndexOf('/') + 1);
                    return this.wrap_tags("sketchfab", false, modelId);
                } else {
                    return false
                }
            };
            this.insert_smilie = function (e, smilietext) {
                this.check_focus();
                return this.insert_text(smilietext, smilietext.length, 0)
            };
            this.prompt_link = function (tagname, value, phrase, iprompt) {
                if (typeof value == "undefined") {
                    value = this.show_prompt(phrase, iprompt, true)
                }
                if ((value = this.verify_prompt(value)) !== false) {
                    if (this.get_selection()) {
                        this.apply_format("unlink");
                        this.wrap_tags(tagname, value)
                    } else {
                        this.wrap_tags(tagname, value, value)
                    }
                }
                return true
            };
            this.insertorderedlist = function (e) {
                this.insertlist(vbphrase.insert_ordered_list, "1")
            };
            this.insertunorderedlist = function (e) {
                this.insertlist(vbphrase.insert_unordered_list, "")
            };
            this.insertlist = function (phrase, listtype) {
                var opentag = "[LIST" + (listtype ? ("=" + listtype) : "") + "]\n";
                var closetag = "[/LIST]";
                var txt;
                if (txt = this.get_selection()) {
                    var regex = new RegExp("([\r\n]+|^[\r\n]*)(?!\\[\\*\\]|\\[\\/?list)(?=[^\r\n])", "gi");
                    txt = opentag + PHP.trim(txt).replace(regex, "$1[*]") + "\n" + closetag;
                    this.insert_text(txt, txt.vBlength(), 0)
                } else {
                    this.insert_text(opentag + closetag, opentag.length, closetag.length);
                    if (YAHOO.env.ua.ie >= 7) {
                        var base_tag = fetch_tags(document, "base");
                        var modal_prefix;
                        if (base_tag && base_tag[0] && base_tag[0].href) {
                            modal_prefix = base_tag[0].href
                        } else {
                            modal_prefix = ""
                        }
                        var listvalue = window.showModalDialog(modal_prefix + "clientscript/ieprompt.html?", {
                            value: "",
                            label: vbphrase.enter_list_item,
                            dir: document.dir,
                            title: document.title,
                            listtype: listtype
                        }, "dialogWidth:320px; dialogHeight:232px; dialogTop:" + (parseInt(window.screenTop) + parseInt(window.event.clientY) + parseInt(document.body.scrollTop) - 100) + "px; dialogLeft:" + (parseInt(window.screenLeft) + parseInt(window.event.clientX) + parseInt(document.body.scrollLeft) - 160) + "px; resizable: No;");
                        if (this.verify_prompt(listvalue)) {
                            this.insert_text(listvalue, listvalue.vBlength(), 0)
                        }
                    } else {
                        while (listvalue = this.show_prompt(vbphrase.enter_list_item, "", false)) {
                            listvalue = "[*]" + listvalue + "\n";
                            this.insert_text(listvalue, listvalue.vBlength(), 0)
                        }
                    }
                }
            };
            this.outdent = function (e) {
                var sel = this.get_selection();
                sel = this.strip_simple("indent", sel, 1);
                this.insert_text(sel)
            };
            this.get_editor_contents = function () {
                return this.editdoc.value
            };
            this.get_selection = function () {
                if (typeof (this.editdoc.selectionStart) != "undefined") {
                    return this.editdoc.value.substr(this.editdoc.selectionStart, this.editdoc.selectionEnd - this.editdoc.selectionStart)
                } else {
                    if (document.selection && document.selection.createRange) {
                        return document.selection.createRange().text
                    } else {
                        if (window.getSelection) {
                            return window.getSelection() + ""
                        } else {
                            return false
                        }
                    }
                }
            };
            this.insert_text = function (text, movestart, moveend) {
                var selection_changed = false;
                this.check_focus();
                if (typeof (this.editdoc.selectionStart) != "undefined") {
                    var opn = this.editdoc.selectionStart + 0;
                    var scrollpos = this.editdoc.scrollTop;
                    this.editdoc.value = this.editdoc.value.substr(0, this.editdoc.selectionStart) + text + this.editdoc.value.substr(this.editdoc.selectionEnd);
                    if (movestart === false) {} else {
                        if (typeof movestart != "undefined") {
                            this.editdoc.selectionStart = opn + movestart;
                            this.editdoc.selectionEnd = opn + text.vBlength() - moveend
                        } else {
                            this.editdoc.selectionStart = opn;
                            this.editdoc.selectionEnd = opn + text.vBlength()
                        }
                    }
                    this.editdoc.scrollTop = scrollpos
                } else {
                    if (document.selection && document.selection.createRange) {
                        var sel = document.selection.createRange();
                        sel.text = text.replace(/\r?\n/g, "\r\n");
                        if (movestart === false) {} else {
                            if (typeof movestart != "undefined") {
                                if ((movestart - text.vBlength()) != 0) {
                                    sel.moveStart("character", movestart - text.vBlength());
                                    selection_changed = true
                                }
                                if (moveend != 0) {
                                    sel.moveEnd("character", -moveend);
                                    selection_changed = true
                                }
                            } else {
                                sel.moveStart("character", -text.vBlength());
                                selection_changed = true
                            }
                        } if (selection_changed) {
                            sel.select()
                        }
                    } else {
                        this.editdoc.value += text
                    }
                }
            };
            this.prepare_submit = function (subjecttext, minchars) {
                var returnvalue = validatemessage(this.textobj.value, subjecttext, minchars);
                if (returnvalue) {
                    return returnvalue
                } else {
                    if (this.captcha != null && this.captcha.failed) {
                        return returnvalue
                    } else {
                        this.check_focus();
                        return false
                    }
                }
            };
            if (is_saf || (is_opera && (!opera.version || opera.version() < 8))) {
                this.insertlist = function (phrase, listtype) {
                    var opentag = "[LIST" + (listtype ? ("=" + listtype) : "") + "]\n";
                    var closetag = "[/LIST]";
                    var txt;
                    if (txt = this.get_selection()) {
                        var regex = new RegExp("([\r\n]+|^[\r\n]*)(?!\\[\\*\\]|\\[\\/?list)(?=[^\r\n])", "gi");
                        txt = opentag + PHP.trim(txt).replace(regex, "$1[*]") + "\n" + closetag;
                        this.insert_text(txt, txt.vBlength(), 0)
                    } else {
                        this.insert_text(opentag, opentag.length, 0);
                        while (listvalue = prompt(vbphrase.enter_list_item, "")) {
                            listvalue = "[*]" + listvalue + "\n";
                            this.insert_text(listvalue, listvalue.vBlength(), 0)
                        }
                        this.insert_text(closetag, closetag.length, 0)
                    }
                }
            }
        }
        this.init()
    }
    function vB_Text_Editor_Events() {}
    vB_Text_Editor_Events.prototype.smilie_onclick = function (A) {
        vB_Editor[this.editorid].insert_smilie(A, this.alt, this.src, this.id.substr(this.id.lastIndexOf("_") + 1));
        if (typeof smilie_window != "undefined" && !smilie_window.closed) {
            smilie_window.focus()
        }
        return false
    };
    vB_Text_Editor_Events.prototype.command_button_onmouseevent = function (A) {
        A = do_an_e(A);
        if (A.type == "click") {
            vB_Editor[this.editorid].format(A, this.cmd, false, true)
        }
        vB_Editor[this.editorid].button_context(this, A.type)
    };
    vB_Text_Editor_Events.prototype.popup_button_onmouseevent = function (A) {
        A = do_an_e(A);
        if (A.type == "click") {
            this._onclick(A);
            vB_Editor[this.editorid].menu_context(this, "mouseover")
        } else {
            vB_Editor[this.editorid].menu_context(this, A.type)
        }
    };
    vB_Text_Editor_Events.prototype.popup_button_show = function (C, B) {
        var A = true;
        if (typeof vB_Editor[C.editorid].popups[C.cmd] == "undefined" || vB_Editor[C.editorid].popups[C.cmd] == null) {
            A = vB_Editor[C.editorid].init_popup_menu(C)
        } else {
            if (C.cmd == "attach" && (typeof vB_Attachments == "undefined" || !vB_Attachments.has_attachments())) {
                fetch_object("manage_attachments_button").onclick();
                return
            }
        } if (A) {
            this._show(C, B)
        }
    };
    vB_Text_Editor_Events.prototype.formatting_select_onchange = function (B) {
        var A = this.options[this.selectedIndex].value;
        if (A != "") {
            vB_Editor[this.editorid].format(B, this.cmd, A)
        }
        this.selectedIndex = 0
    };
    vB_Text_Editor_Events.prototype.smilieselect_onchange = function (A) {
        if (this.options[this.selectedIndex].value != "") {
            vB_Editor[this.editorid].insert_smilie(A, this.options[this.selectedIndex].value, this.options[this.selectedIndex].smiliepath, this.options[this.selectedIndex].smilieid)
        }
        this.selectedIndex = 0
    };
    vB_Text_Editor_Events.prototype.attachselect_onchange = function (B) {
        var A = this.options[this.selectedIndex].value;
        if (A != "") {
            vB_Editor[this.editorid].wrap_tags("attach", false, A)
        }
        this.selectedIndex = 0
    };
    vB_Text_Editor_Events.prototype.attachselect_onmouseover = function (A) {
        if (this.options.length <= 2) {
            vB_Editor[this.editorid].build_attachments_popup(this);
            return true
        }
    };
    vB_Text_Editor_Events.prototype.menuoption_onmouseevent = function (A) {
        A = do_an_e(A);
        vB_Editor[this.editorid].button_context(this, A.type, "menu")
    };
    vB_Text_Editor_Events.prototype.formatting_option_onclick = function (A) {
        vB_Editor[this.editorid].format(A, this.cmd, this.firstChild.innerHTML);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.coloroption_onclick = function (A) {
        fetch_object(this.editorid + "_color_bar").style.backgroundColor = this.colorname;
        vB_Editor[this.editorid].format(A, this.cmd, this.colorname);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.colorout_onclick = function (A) {
        A = do_an_e(A);
        vB_Editor[this.editorid].format(A, "forecolor", fetch_object(this.editorid + "_color_bar").style.backgroundColor);
        return false
    };
    vB_Text_Editor_Events.prototype.smilieoption_onclick = function (A) {
        vB_Editor[this.editorid].button_context(this, "mouseout", "menu");
        vB_Editor[this.editorid].insert_smilie(A, this.smilietext, fetch_tags(this, "img")[0].src, this.smilieid);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.smiliemore_onclick = function (A) {
        vB_Editor[this.editorid].open_smilie_window(smiliewindow_x, smiliewindow_y);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.attachmanage_onclick = function (A) {
        vBmenu.hide();
        fetch_object("manage_attachments_button").onclick()
    };
    vB_Text_Editor_Events.prototype.attachoption_onclick = function (A) {
        vB_Editor[this.editorid].button_context(this, "mouseout", "menu");
        vB_Editor[this.editorid].wrap_tags("attach", false, this.attachmentid);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.attachinsertall_onclick = function (C) {
        var B = "";
        var A = (vB_Editor[this.editorid].wysiwyg_mode ? "<br /><br />" : "\r\n\r\n");
        for (var D in vB_Attachments.attachments) {
            if (YAHOO.lang.hasOwnProperty(vB_Attachments.attachments, D)) {
                B += B != "" ? A : "";
                B += "[ATTACH]" + D + "[/ATTACH]"
            }
        }
        vB_Editor[this.editorid].insert_text(B);
        vBmenu.hide()
    };
    vB_Text_Editor_Events.prototype.smiliewindow_onunload = function (A) {
        if (typeof smilie_window != "undefined" && !smilie_window.closed) {
            smilie_window.close()
        }
    };
    vB_Text_Editor_Events.prototype.editwin_onfocus = function (A) {
        this.hasfocus = true
    };
    vB_Text_Editor_Events.prototype.editwin_onblur = function (A) {
        this.hasfocus = false
    };
    vB_Text_Editor_Events.prototype.editdoc_onmouseup = function (A) {
        vB_Editor[this.editorid].set_context();
        if (vB_Editor[this.editorid].popupmode) {
            vBmenu.hide()
        }
    };
    vB_Text_Editor_Events.prototype.editdoc_onkeyup = function (A) {
        vB_Editor[this.editorid].set_context()
    };
    vB_Text_Editor_Events.prototype.editdoc_onkeypress = function (C) {
        if (!C) {
            C = window.event
        }
        if (C.ctrlKey && !C.altKey) {
            if (vB_Editor[this.editorid].allowbasicbbcode == false) {
                return
            }
            var A = C.charCode ? C.charCode : C.keyCode;
            var B;
            switch (String.fromCharCode(A).toLowerCase()) {
            case "b":
                B = "bold";
                break;
            case "i":
                B = "italic";
                break;
            case "u":
                B = "underline";
                break;
            default:
                return
            }
            C = do_an_e(C);
            vB_Editor[this.editorid].apply_format(B, false, null);
            return false
        } else {
            if (C.keyCode == 9) {
                if (C.shiftKey || (C.modifiers && (C.modifiers & 4))) {
                    return
                }
                if (is_opera) {
                    return
                }
                if (fetch_object("tag_add_input") != null) {
                    fetch_object("tag_add_input").focus()
                } else {
                    if (fetch_object("rb_iconid_0") != null) {
                        fetch_object("rb_iconid_0").focus()
                    } else {
                        if (fetch_object(this.editorid + "_save") != null) {
                            fetch_object(this.editorid + "_save").focus()
                        } else {
                            if (fetch_object("qr_submit") != null) {
                                fetch_object("qr_submit").focus()
                            } else {
                                return
                            }
                        }
                    }
                }
                C = do_an_e(C);
                return
            }
        }
    };
    vB_Text_Editor_Events.prototype.editdoc_onresizestart = function (A) {
        if (A.srcElement.tagName == "IMG") {
            return false
        }
    };

    function save_iframe_to_textarea() {
        for (var A in vB_Editor) {
            if (!YAHOO.lang.hasOwnProperty(vB_Editor, A)) {
                continue
            }
            if (vB_Editor[A].wysiwyg_mode && vB_Editor[A].initialized) {
                vB_Editor[A].textobj.value = vB_Editor[A].get_editor_contents()
            }
        }
    }
    if (window.attachEvent) {
        window.attachEvent("onbeforeunload", save_iframe_to_textarea)
    } else {
        if (window.addEventListener) {
            window.addEventListener("unload", save_iframe_to_textarea, true)
        }
    }
    function switch_editor_mode(A) {
        if (AJAX_Compatible) {
            var B = (vB_Editor[A].wysiwyg_mode ? 0 : 1);
            if (vB_Editor[A].influx == 1) {
                return
            } else {
                vB_Editor[A].influx = 1
            } if (typeof vBmenu != "undefined") {
                vBmenu.hide()
            }
            YAHOO.util.Connect.asyncRequest("POST", "ajax.php?do=editorswitch", {
                success: do_switch_editor_mode,
                timeout: vB_Default_Timeout,
                argument: [A, B]
            }, SESSIONURL + "securitytoken=" + SECURITYTOKEN + "&do=editorswitch&towysiwyg=" + B + "&parsetype=" + vB_Editor[A].parsetype + "&allowsmilie=" + vB_Editor[A].parsesmilies + "&message=" + PHP.urlencode(vB_Editor[A].get_editor_contents()) + (vB_Editor[A].ajax_extra ? ("&" + vB_Editor[A].ajax_extra) : "") + (typeof vB_Editor[A].textobj.form["options[allowbbcode]"] != "undefined" ? "&allowbbcode=" + vB_Editor[A].textobj.form["options[allowbbcode]"].checked : ""))
        }
    }
    function do_switch_editor_mode(H) {
        if (H.responseXML) {
            var C = vB_Editor[H.argument[0]].parsetype;
            var D = vB_Editor[H.argument[0]].parsesmilies;
            var G = vB_Editor[H.argument[0]].ajax_extra;
            vB_Editor[H.argument[0]].destroy();
            var A = H.responseXML.getElementsByTagName("message")[0];
            if (typeof A != "undefined") {
                A = A.firstChild
            }
            var F = (A ? A.nodeValue : "");
            var E = F.match(/&#([0-9]+);/g);
            if (E) {
                for (var B = 0; typeof E[B] != "undefined"; B++) {
                    if (submatch = E[B].match(/^&#([0-9]+);$/)) {
                        F = F.replace(submatch[0], String.fromCharCode(submatch[1]))
                    }
                }
            }
            vB_Editor[H.argument[0]] = new vB_Text_Editor(H.argument[0], H.argument[1], C, D, F, G);
            vB_Editor[H.argument[0]].check_focus();
            fetch_object(H.argument[0] + "_mode").value = H.argument[1]
        }
    }
    var contextcontrols = new Array("bold", "italic", "underline", "justifyleft", "justifycenter", "justifyright", "insertorderedlist", "insertunorderedlist");
    var coloroptions = new Array();
    coloroptions = {
        "#000000": "Black",
        "#A0522D": "Sienna",
        "#556B2F": "DarkOliveGreen",
        "#006400": "DarkGreen",
        "#483D8B": "DarkSlateBlue",
        "#000080": "Navy",
        "#4B0082": "Indigo",
        "#2F4F4F": "DarkSlateGray",
        "#8B0000": "DarkRed",
        "#FF8C00": "DarkOrange",
        "#808000": "Olive",
        "#008000": "Green",
        "#008080": "Teal",
        "#0000FF": "Blue",
        "#708090": "SlateGray",
        "#696969": "DimGray",
        "#FF0000": "Red",
        "#F4A460": "SandyBrown",
        "#9ACD32": "YellowGreen",
        "#2E8B57": "SeaGreen",
        "#48D1CC": "MediumTurquoise",
        "#4169E1": "RoyalBlue",
        "#800080": "Purple",
        "#808080": "Gray",
        "#FF00FF": "Magenta",
        "#FFA500": "Orange",
        "#FFFF00": "Yellow",
        "#00FF00": "Lime",
        "#00FFFF": "Cyan",
        "#00BFFF": "DeepSkyBlue",
        "#9932CC": "DarkOrchid",
        "#C0C0C0": "Silver",
        "#FFC0CB": "Pink",
        "#F5DEB3": "Wheat",
        "#FFFACD": "LemonChiffon",
        "#98FB98": "PaleGreen",
        "#AFEEEE": "PaleTurquoise",
        "#ADD8E6": "LightBlue",
        "#DDA0DD": "Plum",
        "#FFFFFF": "White"
    };

    function vB_History() {
        this.cursor = -1;
        this.stack = new Array()
    }
    vB_History.prototype.move_cursor = function (A) {
        var B = this.cursor + A;
        if (B >= 0 && this.stack[B] != null && typeof this.stack[B] != "undefined") {
            this.cursor += A
        }
    };
    vB_History.prototype.add_snapshot = function (A) {
        if (this.stack[this.cursor] == A) {
            return
        } else {
            this.cursor++;
            this.stack[this.cursor] = A;
            if (typeof this.stack[this.cursor + 1] != "undefined") {
                this.stack[this.cursor + 1] = null
            }
        }
    };
    vB_History.prototype.get_snapshot = function () {
        if (typeof this.stack[this.cursor] != "undefined" && this.stack[this.cursor] != null) {
            return this.stack[this.cursor]
        } else {
            return false
        }
    };