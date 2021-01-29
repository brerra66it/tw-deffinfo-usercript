// ==UserScript==
// @name           Deffinfo
// @author         Boggler, Skype: boggler2306
// @version        2.2
// @description	   Zaehlt auf der Seite >Truppen-Verteidigung< die Unterstuetzungen jedes Spielers zusammen und bietet eine Funktion um diese zu exportieren und die Truppen spielerweise zurueckzuschicken, fasst auf der Seite >Truppen-Unterstuetzungen< die Truppen ausserhalb Doerfer- und Spielerweise zusammen (auch hier kann man die Infos exportieren und Spieler/Doerferweise Truppen abziehen) und zeigt auf den Seiten >Uebersicht-Truppen-Im Dorf<, >Versammlungsplatz-Truppen< und in der Dorfansicht an, wieviele Truppen im Dorf sind oder zum Dorf laufen. Auf der VP-Seite >Truppen< wird zusaetzlich die Entfernung zum Herkunftsdorf jeder Unterstuetzung eingefuegt und man kann die Doerfer danach sortieren.
// @include 	   https://ru*.voyna-plemyon.ru/game.php*screen=settings*
// @include 	   https://ru*.voyna-plemyon.ru/game.php*view*screen=report*
// @include 	   https://ru*.voyna-plemyon.ru/game.php*screen=overview*
// @include 	   https://ru*.voyna-plemyon.ru/game.php*screen=overview*t=*
// @include 	   https://ru*.voyna-plemyon.ru/game.php*t=*screen=overview*
// @exclude 	   https://ru*.voyna-plemyon.ru/game.php*screen=place
// @exclude 	   https://ru*.voyna-plemyon.ru/game.php*mode=notify*
// ==/UserScript==
//Script registrieren
var api = typeof unsafeWindow != 'undefined' ? unsafeWindow.ScriptAPI: window.ScriptAPI;
api.register('170-Deffinfo', true, 'Boggler', 'Support-nur-ueber-Skype--boggler2306@trash-mail.com');

// Storage-Klasse von Hypix
var storage = new Storage("prefix", false);
function Storage(prefix, forceGM) {
    var gm = typeof(unsafeWindow) != "undefined" && navigator.userAgent.indexOf("Firefox") > -1
    var win = gm ? unsafeWindow: window;
    var ls = false;
    var intGetValue;
    var intSetValue;
    var prefix = prefix;
    try {
        ls = typeof(win.localStorage) != "undefined";
    } catch(e) {}
    if (!ls && !gm)
        throw ("Keine geeignete Speicherm&ouml;glichgkeit gefunden");
    if (forceGM && gm || !ls) {
        if (gm) {
            prefix = prefix + "_" + document.location.host.split('.')[0];
            intSetValue = function(key, value) {
                GM_setValue(prefix + "_" + key, value);
            };
            intGetValue = function(key, defaultValue) {
                return GM_getValue(prefix + "_" + key, defaultValue);
            }
            this.deleteValue = function(key) {
                GM_deleteValue(prefix + "_" + key);
            }
            this.listValues = function(re) {
                var allkeys = GM_listValues();
                var serverKeys = [];
                var rePrefix = new RegExp("^" + prefix + "_(.*)$");
                if (typeof(re) != "undefined")
                    var reKey = new RegExp(re);
                for (var i = 0; i < allkeys.length; i++) {
                    var res = allkeys[i].match(rePrefix);
                    if (res) {
                        if (reKey) {
                            res = res[1].match(reKey);
                            if (res)
                                serverKeys.push(res);
                        } else
                            serverKeys.push(res[1]);
                    }
                }
                return serverKeys;
            }
        }
    } else if (ls) {
        intSetValue = function(key, value) {
            localStorage.setItem(prefix + "_" + key, value);
        };
        intGetValue = function(key, defaultValue) {
            var value = localStorage.getItem(prefix + "_" + key);
            if (value)
                return value;
            else
                return defaultValue;
        };
        this.deleteValue = function(key) {
            localStorage.removeItem(prefix + "_" + key);
        }
        this.listValues = function(re) {
            var keys = [];
            var rePrefix = new RegExp("^" + prefix + "_(.*)$");
            if (typeof(re) != "undefined")
                var reKey = new RegExp(re);
            for (var i = 0; i < win.localStorage.length; i++) {
                var res = localStorage.key(i).match(rePrefix);
                if (res) {
                    if (reKey) {
                        res = res[1].match(reKey);
                        if (res)
                            keys.push(res);
                    } else
                        keys.push(res[1]);
                }
            }
            return keys;
        }
    }
    this.clear = function(re) {
        var keys = this.listValues(re);
        for (var i = 0; i < keys.length; i++)
            this.deleteValue(keys[i]);
    }
    this.setValue = function(key, value) {
        switch (typeof(value)) {
        case "object":
        case "function":
            intSetValue(key, "j" + JSON.stringify(value));
            break;
        case "number":
            intSetValue(key, "n" + value);
            break;
        case "boolean":
            intSetValue(key, "b" + (value ? 1: 0));
            break;
        case "string":
            intSetValue(key, "s" + value);
            break;
        case "undefined":
            intSetValue(key, "u");
            break;
        }
    }
    this.getValue = function(key, defaultValue) {
        var str = intGetValue(key);
        if (typeof(str) != "undefined") {
            switch (str[0]) {
            case "j":
                return JSON.parse(str.substring(1));
            case "n":
                return parseFloat(str.substring(1));
            case "b":
                return str[1] == "1";
            case "s":
                return str.substring(1);
            default:
                this.deleteValue(key);
            }
        }
        return defaultValue;
    }
    this.getString = function(key) {
        return intGetValue(key);
    }
    this.setString = function(key, value) {
        intSetValue(key, value);
    }
}
/*
 *
 * Allgemeine Definitionen
 *
 */

//Gibt bei gegebenen Truppen und gespeichertem Deffmuster die Deffanzahl zurueck
function deffanzahl(sp, sw, ax, bo, spy, lk, bb, sk, ra, ka, pa, ag) {
    var deffzahl = 0;

    AllgZ = sp * deffallg[0] + sw * deffallg[1] + ax * deffallg[2] + bo * deffallg[3] + spy * deffallg[4] + lk * deffallg[5] + bb * deffallg[6] + sk * deffallg[7] + ra * deffallg[8] + ka * deffallg[9] + pa * deffallg[10] + ag * deffallg[11];
    KavZ = sp * deffkav[0] + sw * deffkav[1] + ax * deffkav[2] + bo * deffkav[3] + spy * deffkav[4] + lk * deffkav[5] + bb * deffkav[6] + sk * deffkav[7] + ra * deffkav[8] + ka * deffkav[9] + pa * deffkav[10] + ag * deffkav[11];
    BogZ = sp * deffbog[0] + sw * deffbog[1] + ax * deffbog[2] + bo * deffbog[3] + spy * deffbog[4] + lk * deffbog[5] + bb * deffbog[6] + sk * deffbog[7] + ra * deffbog[8] + ka * deffbog[9] + pa * deffbog[10] + ag * deffbog[11];

    AllgZ = AllgZ / allgwert;
    KavZ = KavZ / kavwert;
    BogZ = BogZ / bogwert;
    deffzahl = (bogen) ? AllgZ + KavZ + BogZ: AllgZ + KavZ;
    deffzahl = (bogen) ? deffzahl / 3: deffzahl / 2;
    deffzahl = deffzahl * 100;
    deffzahl = Math.round(deffzahl);
    deffzahl = deffzahl / 100;
    return deffzahl;
}

//Funktionen zum Berechnen der Entfernung zwischen zwei Doerfern
function hypot(x, y) {
    return Math.sqrt(x * x + y * y) || 0;
}
function village_distance(x1, x2, y1, y2) {
    var distance = Math.round(hypot(x1 - x2, y1 - y2) * 100);
    var distance = distance / 100;
    return distance;
}

//erzeugt ein DOM-Element und fï¿½gt Attribute und Anzeigetext an
function createElement(type, attributes, html) {
    var node = document.createElement(type);
    for (var attr in attributes)
        if (attributes.hasOwnProperty(attr)) {
        node.setAttribute(attr, attributes[attr]);
    }
    if (html != null) {
        node.innerHTML = html;
    }
    return node;
}

//Allgemeine Infos ueber Spieler, Dorf und Welt auslesen
var spielername = document.getElementsByTagName('html')[0].innerHTML.split('"name":"')[1].split('"')[0];
var spielerid = document.getElementsByTagName('html')[0].innerHTML.split('"id":"')[1].split('"')[0];
var welt = document.location.href.split('https://')[1].split('.')[0];
var villageid = Number(document.location.href.split('village=')[1].split('&')[0]);
/*var spielername = game_data.player.name;
var spielerid = game_data.player.id;
var welt = game_data.world;
var villageid = game_data.village.id;
alert(welt+spielername+spielerid+'__'+villageid);*/
var table = document.getElementById('units_table');
try {
    var bogen = table.innerHTML.indexOf('archer') > 0;
    var paladin = table.innerHTML.indexOf('knight') > 0;
    storage.setValue('deffscript' + welt + '_bogen', bogen);
    storage.setValue('deffscript' + welt + '_paladin', paladin);
    var dorfzahl = Number(table.innerHTML.split('Dorf (')[1].split(')')[0]);
} catch(e) {}

//Deffwerte und BH-Plaetze aller Einheiten definieren
var deffallg = new Array(15, 50, 10, 50, 2, 30, 40, 200, 20, 100, 250, 100)
    var deffkav = new Array(45, 15, 5, 40, 1, 40, 30, 80, 50, 50, 400, 50)
    var deffbog = new Array(20, 40, 10, 5, 2, 30, 50, 180, 20, 100, 150, 100)
    var bhplaetze = new Array(1, 1, 1, 1, 2, 4, 5, 6, 5, 8, 10, 100);
var bhplaetze1 = new Array(1, 1, 1, 2, 4, 6, 5, 8, 10, 100);

//Falls nicht vorhanden, Standardwerte fuer das Deffmuster setzen
if (bogen) {
    var einedeff = new Array(6000, 6000, 0, 8001, 129, 0, 0, 0, 0, 50);
    if (storage.getValue('deffscript' + welt + '_allgwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_allgwert', 795308);
    if (storage.getValue('deffscript' + welt + '_kavwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_kavwert', 682669);
    if (storage.getValue('deffscript' + welt + '_bogwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_bogwert', 405263);
} else {
    var einedeff = new Array(10000, 10000, 0, 100, 0, 0, 0, 50);
    if (storage.getValue('deffscript' + welt + '_allgwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_allgwert', 655200);
    if (storage.getValue('deffscript' + welt + '_kavwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_kavwert', 602600);
    if (storage.getValue('deffscript' + welt + '_bogwert', 'nv') == 'nv')
        storage.setValue('deffscript' + welt + '_bogwert', 605200);
}
for (i = 0; i < einedeff.length; i++) {
    if (storage.getValue('deffscript' + welt + '_einedeff_' + i, 'nicht vorhanden') == 'nicht vorhanden')
        storage.setValue('deffscript' + welt + '_einedeff_' + i, einedeff[i]);
}

//Gespeicherte Standardwerte auslesen
var bogen = storage.getValue('deffscript' + welt + '_bogen', true);
var paladin = storage.getValue('deffscript' + welt + '_paladin', true);
var allgwert = storage.getValue('deffscript' + welt + '_allgwert', 795308);
var kavwert = storage.getValue('deffscript' + welt + '_kavwert', 682669);
var bogwert = storage.getValue('deffscript' + welt + '_bogwert', 405263);

//Auslesen, auf welcher Seite man sich befindet
var url = document.location.href;
var mode;
//Dorfansicht
if (url.match(/screen=overview/g) != null && url.match(/screen=overview_villages/g) == null)
    mode = 'overview';
//Einstellungen
if (url.match(/screen=settings/g) != null)
    mode = 'settings';
//Truppen-Verteidigung
if (url.match(/mode=units/g) != null && url.match(/type=support_detail/g) != null)
    mode = 'units&type=support_detail';
//Truppen-Im Dorf
if (url.match(/mode=units/g) != null && url.match(/type=there/g) != null)
    mode = 'units&type=there';
//Truppen-Unterstuetzungen
if (url.match(/mode=units/g) != null && url.match(/type=away_detail/g) != null)
    mode = 'units&type=away_detail';
//Versammlungsplatz-Truppen
if (url.match(/mode=units/g) != null && url.match(/screen=place/g) != null)
    mode = 'units';

switch (mode) {
    /*
 *
 * Einstellungen
 *
 */
    case 'settings':
    //Speichert in die Felder eingegebene Werte, wird beim Start und wird bei jeder Aenderung aufgerufen
    function changed() {
        var bh = (bogen) ? bhplaetze: bhplaetze1;
        var einedeffallg = 0;
        var einedeffkav = 0;
        var einedeffbog = 0;
        var einedeffbh = 0;
        for (i = 0; i < 14; i++) {
            try {
                einedeffallg = einedeffallg + Number(document.getElementById('trp' + i).value) * deffallg[i];
                einedeffkav = einedeffkav + Number(document.getElementById('trp' + i).value) * deffkav[i];
                einedeffbog = einedeffbog + Number(document.getElementById('trp' + i).value) * deffbog[i];
                einedeffbh = einedeffbh + Number(document.getElementById('trp' + i).value) * bh[i];
                storage.setValue('deffscript' + welt + '_einedeff_' + i, document.getElementById('trp' + i).value);
            } catch(e) {}
        }
        document.getElementById('deffallg').value = einedeffallg;
        document.getElementById('deffkav').value = einedeffkav;
        try {
            document.getElementById('deffbog').value = einedeffbog;
        } catch(e) {}
        document.getElementById('deffbh').value = einedeffbh;
        storage.setValue('deffscript' + welt + '_allgwert', einedeffallg);
        storage.setValue('deffscript' + welt + '_kavwert', einedeffkav);
        storage.setValue('deffscript' + welt + '_bogwert', einedeffbog);

    }
    //Einheitentypen fuer Tabelle je nach Welttyp bestimmen
    var units = new Array('spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult');
    if (bogen)
        var units = new Array('spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult');

    var image_base = '{graphic}';
    //Links fuer Einheitensymbole zusammenstellen
    for (i = 0; i < units.length; i++) {
        units[i] = image_base + '/unit/unit_' + units[i] + '.png';
    }
    units[units.length] = image_base + '/unit/Def.png';
    units[units.length] = image_base + '/unit/Def_cav.png';
    if (bogen)
        units[units.length] = image_base + '/unit/Def_archer.png';

    //div-Kontainer und Tabelle erzeugen
    var settings = createElement('div', {
        id: 'deffsettings'
    });

    var table = createElement('table', {
        class: 'vis overview_table',
        style: 'min-width:950px'
    });

    var thead = createElement('thead');
    var tr = createElement('tr');

    tr.appendChild(createElement('th', {
        style: 'text-align:center'
    }, 'Deffvorgabe'));
    for (i = 0; i < units.length; i++) {
        var th = createElement('th', {
            style: 'text-align:center'
        });
        var img = createElement('img', {
            src: units[i]
            });
        th.appendChild(img);
        tr.appendChild(th);
    }
    tr.appendChild(createElement('th', {
        style: 'text-align:center'
    }, 'BH-Pl&auml;tze'));
    thead.appendChild(tr);
    table.appendChild(thead);

    //Eingabefelder + Inhalt einfuegen
    var tr = createElement('tr', {});
    tr.appendChild(createElement('td', {}, 'f&uuml;r eine Deff'));
    var anzahl = (bogen) ? 10: 8;

    for (i = 0; i < anzahl; i++) {
        var td = createElement('td', {
            style: 'text-align:center'
        });
        var input = createElement('input', {
            size: '3',
            type: 'text',
            value: storage.getValue('deffscript' + welt + '_einedeff_' + i, '0'),
            id: 'trp' + i,
            name: 'einedeff'
        });
        input.addEventListener('keyup', changed, false);
        td.appendChild(input);
        tr.appendChild(td);

    }

    var td = createElement('td', {
        style: 'text-align:center'
    });
    var input = createElement('input', {
        size: '10',
        type: 'text',
        id: 'deffallg',
        disabled: true
    });
    td.appendChild(input);
    tr.appendChild(td);

    var td = createElement('td', {
        style: 'text-align:center'
    });
    var input = createElement('input', {
        size: '10',
        type: 'text',
        id: 'deffkav',
        disabled: true
    });
    td.appendChild(input);
    tr.appendChild(td);
    if (bogen) {
        var td = createElement('td', {
            style: 'text-align:center'
        });
        var input = createElement('input', {
            size: '10',
            type: 'text',
            id: 'deffbog',
            disabled: true
        });
        td.appendChild(input);
        tr.appendChild(td);
    }

    var td = createElement('td', {
        style: 'text-align:center'
    });
    var input = createElement('input', {
        size: '5',
        type: 'text',
        id: 'deffbh',
        disabled: true
    });
    td.appendChild(input);
    tr.appendChild(td);

    table.appendChild(tr);
    settings.appendChild(createElement('br', {}));
    var h3 = createElement('h3', {});

    h3.appendChild(createElement('a', {
        href: 'https://forum.die-staemme.de/showthread.php?169850'
    }, 'Deffinfo'));

    settings.appendChild(h3);
    settings.appendChild(table);

    document.getElementsByClassName('vis settings')[0].parentNode.appendChild(settings);

    changed();

    break;
    /*
 *
 * Uebersicht->Truppen->Im Dorf
 *
 */
    case 'units&type=there':

    for (i = 1; i <= dorfzahl; i++) {
        var bereich = document.getElementsByTagName('body')[0].innerHTML.split('<!-- troop data -->')[i].split('</tr>')[0];
        var sp = Number(bereich.split('<td class="unit-')[1].split('">')[1].split("</td>")[0]);
        var sw = Number(bereich.split('<td class="unit')[2].split('">')[1].split("</td>")[0]);
        var ax = Number(bereich.split('<td class="unit')[3].split('">')[1].split("</td>")[0]);
        if (bogen && paladin) {
            var bo = Number(bereich.split('<td class="unit')[4].split('">')[1].split("</td>")[0]);
            var spy = Number(bereich.split('<td class="unit')[5].split('">')[1].split("</td>")[0]);
            var lk = Number(bereich.split('<td class="unit')[6].split('">')[1].split("</td>")[0]);
            var bb = Number(bereich.split('<td class="unit')[7].split('">')[1].split("</td>")[0]);
            var sk = Number(bereich.split('<td class="unit')[8].split('">')[1].split("</td>")[0]);
            var ra = Number(bereich.split('<td class="unit')[9].split('">')[1].split("</td>")[0]);
            var ka = Number(bereich.split('<td class="unit')[10].split('">')[1].split("</td>")[0]);
            var pa = Number(bereich.split('<td class="unit')[11].split('">')[1].split("</td>")[0]);
            var ag = Number(bereich.split('<td class="unit')[12].split('">')[1].split("</td>")[0]);
        } else if (bogen && !paladin) {
            var bo = Number(bereich.split('<td class="unit')[4].split('">')[1].split("</td>")[0]);
            var spy = Number(bereich.split('<td class="unit')[5].split('">')[1].split("</td>")[0]);
            var lk = Number(bereich.split('<td class="unit')[6].split('">')[1].split("</td>")[0]);
            var bb = Number(bereich.split('<td class="unit')[7].split('">')[1].split("</td>")[0]);
            var sk = Number(bereich.split('<td class="unit')[8].split('">')[1].split("</td>")[0]);
            var ra = Number(bereich.split('<td class="unit')[9].split('">')[1].split("</td>")[0]);
            var ka = Number(bereich.split('<td class="unit')[10].split('">')[1].split("</td>")[0]);
            var pa = 0;
            var ag = Number(bereich.split('<td class="unit')[11].split('">')[1].split("</td>")[0]);
        } else if (!bogen && paladin) {
            var bo = 0;
            var spy = Number(bereich.split('<td class="unit')[4].split('">')[1].split("</td>")[0]);
            var lk = Number(bereich.split('<td class="unit')[5].split('">')[1].split("</td>")[0]);
            var bb = 0;
            var sk = Number(bereich.split('<td class="unit')[6].split('">')[1].split("</td>")[0]);
            var ra = Number(bereich.split('<td class="unit')[7].split('">')[1].split("</td>")[0]);
            var ka = Number(bereich.split('<td class="unit')[8].split('">')[1].split("</td>")[0]);
            var pa = Number(bereich.split('<td class="unit')[9].split('">')[1].split("</td>")[0]);
            var ag = Number(bereich.split('<td class="unit')[10].split('">')[1].split("</td>")[0]);
        } else {
            var bo = 0;
            var spy = Number(bereich.split('<td class="unit')[4].split('">')[1].split("</td>")[0]);
            var lk = Number(bereich.split('<td class="unit')[5].split('">')[1].split("</td>")[0]);
            var bb = 0;
            var sk = Number(bereich.split('<td class="unit')[6].split('">')[1].split("</td>")[0]);
            var ra = Number(bereich.split('<td class="unit')[7].split('">')[1].split("</td>")[0]);
            var ka = Number(bereich.split('<td class="unit')[8].split('">')[1].split("</td>")[0]);
            var pa = 0;
            var ag = Number(bereich.split('<td class="unit')[9].split('">')[1].split("</td>")[0]);
        }
        var villageid = bereich.split('<td><a href="/game.php?village=')[1].split("&amp;")[0];

        document.getElementsByTagName('body')[0].innerHTML = document.getElementsByTagName('body')[0].innerHTML.replace('<a href="/game.php?village=' + villageid + '&amp;screen=place&amp;mode=units">Truppen</a>', '<a href="/game.php?village=' + villageid + '&amp;screen=place&amp;mode=units">Truppen (' + String(deffanzahl(sp, sw, ax, bo, spy, lk, bb, sk, ra, ka, pa, ag)) + ' Deffs)</a>');
    }
    break;
    /*
 *
 * Uebersicht->Truppen->Unterstuetzungen
 *
 */
    case 'units&type=away_detail':
    //Vielen Dank an xXNo M3rcyXx, fuer das Einverstaendnis zur Verwendung des Scriptes >Liste der unterstuetzten Doerfer in der Truppenuebersicht< als Vorlage
    function trim(str, chars) {
        return ltrim(rtrim(str, chars), chars);
    }

    function ltrim(str, chars) {
        chars = chars || "s";
        return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
    }

    function rtrim(str, chars) {
        chars = chars || "s";
        return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
    }

    //Gibt den Index des Arrays zurueck, an dem sich der gesuchte Spieler befindet
    function findPlayer(array, name) {
        for (i = 0; i < array.length; i++) {
            try {
                if (array[i][0] == name) {
                    return i;
                    break;
                }
            } catch(e) {
                return null;
            }
        }
    }

    var villages = new Array(0);
    var villages1 = new Array();
    var defence = new Array(0);
    var links = new Array(0);
    var players = new Array();
    var gesamt = new Array();
    var b = (bogen) ? 12: 10
    for (a = 0; a <= b; a++) {
        gesamt[a] = 0;
    }
    var villagesTable = document.getElementById('units_table');

    //Liest Infos ueber gedeffte Doerfer ein
    function summarize() {
        villagesTable.deleteRow(0);
        var rows = villagesTable.getElementsByTagName('tr');
        // rows.deleteRow(0);
        for (var i = 1; i < rows.length - 1; i++) {
            if (rows[i].lastChild.previousSibling.getElementsByTagName('a').length == 0) {
                //Unterstuetztes Dorf
                var village = rows[i].getElementsByTagName('span')[0].textContent;
                var j = 0;
                //Suche, ob das Dorf bereits in villages[] gespeichert ist
                for (j = 0; j < villages.length; j++) {
                    if (villages[j] == village)
                        break;
                }
                try {
                    //Besitzer des Dorfes herausfinden und speichern
                    if (rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[1].innerHTML.length == 0) {
                        player = '<a href="' + rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[2].href + '">' + rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[2].innerHTML + '</a>';
                        rows[i].getElementsByTagName('span')[0].getElementsByTagName('input')[0].alt = rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[2].innerHTML;
                    } else {
                        player = '<a href="' + rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[1].href + '">' + rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[1].innerHTML + '</a>';
                        rows[i].getElementsByTagName('span')[0].getElementsByTagName('input')[0].alt = rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[1].innerHTML;
                    }
                } catch(e) {
                    player = '<a href="/game.php?village=' + villageid + '&id=' + spielerid + '&screen=info_player">' + spielername + '</a>';
                    rows[i].getElementsByTagName('span')[0].getElementsByTagName('input')[0].alt = spielername;
                }
                //Index des Spielers in players[] definieren
                var playernr = findPlayer(players, player);
                //Wenn der Spieler noch nicht angelegt ist, das Array erzeugen
                if (playernr == null) {
                    playernr = players.length;
                    players[playernr] = new Array();
                    players[playernr][0] = player;
                    for (var d = 0; d <= rows[0].getElementsByTagName('th').length - 3; d++) {
                        players[playernr][d + 1] = 0;
                    }
                    players[playernr]['anzahl'] = 0;
                }
                //Wenn das Dorf noch nicht in villages[] vorhanden ist, Dorf eintragen
                if (j == villages.length) {
                    villages[j] = village;
                    villages1[j] = new Array();
                    villages1[j][j] = rows[i].getElementsByTagName('span')[0].innerHTML;
                    //Besitzername in Klartext zusammen mit dem Dorf speichern
                    try {
                        if (navigator.userAgent.indexOf('Firefox') > 0) {
                            var player1 = rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[1].innerHTML;
                        } else {
                            var player1 = rows[i].getElementsByTagName('span')[0].getElementsByTagName('a')[2].innerHTML;
                        }
                    } catch(e) {
                        var player1 = spielername;
                    }
                    villages1[j]['name'] = player1;
                    //Array fuer die Einheiten erstellen
                    defence[j] = new Array(0);
                    for (k = 0; k < rows[0].getElementsByTagName('th').length - 3; k++)
                        defence[j][k] = 0;
                    links[j] = rows[i].getElementsByTagName('a')[0];
                    //Anzahl an gedefften Doerfern je Spieler erhoehen
                    players[playernr][1] = players[playernr][1] + 1;
                }
                //Anzahl an gedefften Doerfern erhoehen
                players[playernr]['anzahl'] = players[playernr]['anzahl'] + 1;

                //Jede Einheit einer Unterstuertzung dem Dorfarray, Spielerarray und Gesamtarray hinzufuegen
                cells = rows[i].getElementsByTagName('td');
                gesamt[0] += 1;
                for (var k = 1; k <= defence[j].length; k++) {
                    defence[j][k - 1] += parseInt(cells[k].textContent);
                    players[playernr][k + 1] += parseInt(cells[k].textContent);
                    gesamt[k] += parseInt(cells[k].textContent);
                }

            }
        }
    }

    //Erzeugt die Tabelle und listet die einzelnen gedefften Doerfer auf
    function display() {
        //Einheitentabelle erstellen
        var div = document.getElementById("paged_view_content");
        var stat = createElement('table', {
            id: 'Statistik',
            style: 'width:100%'
        });
        var div2 = createElement('div', {
            style: 'width:100%;display:none',
            id: 'exportbereich',
            rows: '10'
        }, '<br><b>Tabelle in BB-Code (f&uuml;r Forum etc.):</b><br><textarea style="width:100%" id="Exportfeld" rows="10"></textarea>');

        //Behebt den Fehler, dass nichts angezeigt wird, wenn man in einer einzelnen Gruppe Doerfer filtert (leere Eintraege ausblendet)
        try {
            div.insertBefore(stat, document.forms[document.forms.length - 2]);
            div.insertBefore(div2, document.forms[document.forms.length - 2]);
        } catch(e) {
            div.insertBefore(stat, document.forms[document.forms.length - 1]);
            div.insertBefore(div2, document.forms[document.forms.length - 1]);
        }
        //Einheiten je nach Welttyp
        var units = new Array('spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob');
        if (bogen)
            var units = new Array('spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob');
        //Export-"Button"
        var thead = createElement('thead', {});
        var tr = createElement('tr', {});
        var th = createElement('th', {
            style: 'text-align:center',
            colspan: '2'
        }, 'Spieler [<a id="exportieren">Export</a>]');
        tr.appendChild(th);
        var th = createElement('th', {
            style: 'text-align:center'
        });
        var img = createElement('img', {
            src: image_base + '/command/support.png'
        });
        th.appendChild(img);
        tr.appendChild(th);
        var th = createElement('th', {
            style: 'text-align:center'
        });
        var a = createElement('a', {
            href: '/game.php?village=' + villageid + '&screen=settings'
        }, 'Deffs');
        th.appendChild(a);
        tr.appendChild(th);
        for (i = 0; i < units.length; i++) {
            units[i] = image_base + '/unit/unit_' + units[i] + '.png';
        }
        for (i = 0; i < units.length; i++) {
            var th = createElement('th', {
                style: 'text-align:center'
            });
            var img = createElement('img', {
                src: units[i]
                });
            th.appendChild(img);
            tr.appendChild(th);
        }
        thead.appendChild(tr);

        document.getElementById('Statistik').appendChild(thead);
        //Statistiken ueber einzelne Spieler einfuegen
        for (i = 0; i < players.length; i++) {
            deffzahl = (bogen) ? deffanzahl(players[i][2], players[i][3], players[i][4], players[i][5], players[i][6], players[i][7], players[i][8], players[i][9], players[i][10], players[i][11], players[i][12], players[i][13]) : deffanzahl(players[i][2], players[i][3], players[i][5], 0, players[i][6], players[i][8], 0, players[i][9], players[i][10], players[i][11], players[i][12], players[i][13]);
            var tr = createElement('tr', {});
            var td = createElement('td', {
                style: 'text-align:center'
            }, '<input type="checkbox" name="indenstats" value="' + players[i][0].split('>')[1].split('<')[0] + '">');
            tr.appendChild(td);
            var td = createElement('td', {
                style: 'text-align:center'
            }, players[i][0]);
            tr.appendChild(td);
            var td = createElement('td', {
                style: 'text-align:center'
            }, players[i]['anzahl'] + ' in ' + players[i][1] + ' D&ouml;rfern');
            tr.appendChild(td);
            var td = createElement('td', {
                style: 'text-align:center'
            }, deffzahl);
            tr.appendChild(td);
            var b = (bogen) ? 13: 11;
            for (a = 2; a <= b; a++) {

                var td = createElement('td', {
                    style: 'text-align:center'
                }, players[i][a])
                    tr.appendChild(td);

            }
            document.getElementById('Statistik').appendChild(tr);
        }

        //Gesamtwerte einfuegen
        var tr = createElement('tr', {});
        var th = createElement('th', {
            style: 'text-align:center',
            colspan: '2'
        }, '<strong>Gesamt (' + players.length + ')</strong>')
            tr.appendChild(th);
        var th = createElement('th', {
            style: 'text-align:center'
        }, gesamt[0] + ' in ' + villages.length + ' D&ouml;rfern')
            tr.appendChild(th);
        if (bogen) {
            var th = createElement('th', {
                style: 'text-align:center'
            }, deffanzahl(gesamt[1], gesamt[2], gesamt[3], gesamt[4], gesamt[5], gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11], gesamt[12]))
                tr.appendChild(th);
        } else {
            var th = createElement('th', {
                style: 'text-align:center'
            }, deffanzahl(gesamt[1], gesamt[2], gesamt[3], 0, gesamt[4], gesamt[5], 0, gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10]))
                tr.appendChild(th);
        }
        var b = (bogen) ? 13: 11;
        for (a = 1; a < b; a++) {

            var th = createElement('th', {
                style: 'text-align:center'
            }, gesamt[a])
                tr.appendChild(th);

        }
        document.getElementById('Statistik').appendChild(tr);

        //Bei Klick auf den Exportieren-"Button"
        document.getElementById('exportieren').addEventListener('click', function exporten() {
            //Tabellenkopf
            var text = '[table][**]Spieler[||]Unterstuetzungen[||]Deffs[||][unit]spear[/unit][||][unit]sword[/unit][||][unit]axe[/unit][||]';
			
            if (bogen)
                text += '[unit]archer[/unit][||]';
            text += '[unit]spy[/unit][||][unit]light[/unit][||]';
            if (bogen)
                text += '[unit]marcher[/unit][||]';
            text += '[unit]heavy[/unit][||][unit]ram[/unit][||][unit]catapult[/unit][||]';
            if (paladin)
                text += '[unit]knight[/unit][||]';
            text += '[unit]snob[/unit][/**]';
            //Spieler und unterstuetzte Einheiten
            for (i = 0; i < players.length; i++) {
                deffzahl = (bogen) ? deffanzahl(players[i][2], players[i][3], players[i][4], players[i][5], players[i][6], players[i][7], players[i][8], players[i][9], players[i][10], players[i][11], players[i][12], players[i][13]) : deffanzahl(players[i][2], players[i][3], players[i][5], 0, players[i][6], players[i][8], 0, players[i][9], players[i][10], players[i][11], players[i][12], players[i][13]);

                var text1 = '[*][player]' + players[i][0].split('>')[1].split('<')[0] + '[/player][|]' + players[i]['anzahl'] + ' in ' + players[i][1] + ' Doerfern' + '[|]' + deffzahl;
                var b = (bogen) ? 13: 11;
                for (a = 2; a <= b; a++) {

                    text1 += '[|]' + String(players[i][a]);

                }
                text += text1 + '[/*]';
            }
            //Gesamte Unterstuetzung
            deffzahl = (bogen) ? deffanzahl(gesamt[1], gesamt[2], gesamt[3], gesamt[4], gesamt[5], gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11], gesamt[12]) : deffanzahl(gesamt[1], gesamt[2], gesamt[3], 0, gesamt[4], gesamt[5], 0, gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10]);
            var text1 = '[**]Gesamt (' + players.length + ')[||]' + gesamt[0] + ' in ' + villages.length + ' Doerfern[||]' + deffzahl;
            var b = (bogen) ? 13: 11;
            for (a = 1; a < b; a++) {

                text1 += '[||]' + gesamt[a];

            }
            //Einzelne gedeffte Doerfer mit Truppen
            text += text1 + '[/**][/table]' + '\r\n\r\nGedeffte Doerfer:\r\n';
            text += '[table][**]Dorf[||]Spieler[||][unit]spear[/unit][||][unit]sword[/unit][||][unit]axe[/unit][||]';
			
            if (bogen)
                text += '[unit]archer[/unit][||]';
            text += '[unit]spy[/unit][||][unit]light[/unit][||]';
            if (bogen)
                text += '[unit]marcher[/unit][||]';
            text += '[unit]heavy[/unit][||][unit]ram[/unit][||][unit]catapult[/unit][||]';
            if (paladin)
                text += '[unit]knight[/unit][||]';
            text += '[unit]snob[/unit][||]Deffs[/**]'; 
            for (var i = 0; i < villages.length; i++) {

                var newCell = document.createElement('td');
                if (villages1[i][i].split('<a')[1].split('(')[villages1[i][i].split('<a')[1].split('(').length - 1].split(')')[0].length == 0) {
                    koord = villages1[i][i].split('<a')[1].split('(')[villages1[i][i].split('<a')[1].split('(').length - 2].split(')')[0];
                } else {
                    koord = villages1[i][i].split('<a')[1].split('(')[villages1[i][i].split('<a')[1].split('(').length - 1].split(')')[0];
                }
                text += '[*][coord]' + koord + '[/coord][|][player]' + villages1[i]['name'] + '[/player]';
                for (var j = 0; j <= defence[i].length; j++) {
                    switch (j) {

                    case defence[i].length:

                        if (storage.getValue('deffscript' + welt + '_bogen', true) && storage.getValue('deffscript' + welt + '_paladin', true)) {

                            text += '[|]' + deffanzahl(defence[i][0], defence[i][1], defence[i][2], defence[i][3], defence[i][4], defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9], defence[i][10], defence[i][11]);
                        } else if (storage.getValue('deffscript' + welt + '_bogen', true) && !storage.getValue('deffscript' + welt + '_paladin', true)) {
                            text += '[|]' + deffanzahl(defence[i][0], defence[i][1], defence[i][2], defence[i][3], defence[i][4], defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9], 0, defence[i][10]);
                        } else if (!storage.getValue('deffscript' + welt + '_bogen', true) && storage.getValue('deffscript' + welt + '_paladin', true)) {
                            text += '[|]' + deffanzahl(defence[i][0], defence[i][1], defence[i][2], 0, defence[i][3], defence[i][4], 0, defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9]);
                        } else {
                            text += '[|]' + deffanzahl(defence[i][0], defence[i][1], defence[i][2], 0, defence[i][3], defence[i][4], 0, defence[i][5], defence[i][6], defence[i][7], 0, defence[i][8]);
                        }

                        break;

                    default:
                        text += '[|]' + String(defence[i][j]);
                        break;
                    }
                }
                text += '[/*]';

            }
            text += '[/table]';

            document.getElementById('exportbereich').style.display = '';
            document.getElementById('Exportfeld').value = text;

        }, false);

        //Einzelne gedeffte Doerfer aufzaehlen
        var newTable = createElement('table', {
            class: 'vis',
            style: 'min-width:950px',
            id: 'einzeldoerfer'
        });
        var tables = document.getElementsByTagName('table');
        var headerRow = document.getElementById('units_table').getElementsByTagName('tr')[0].cloneNode(true);
        headerRow.id = 'headerRow';
        newTable.appendChild(headerRow);
        for (var i = 0; i < villages.length; i++) {
            var newRow = document.createElement('tr');
            var newCell = document.createElement('td');
            var checkBox = createElement('input', {
                type: 'checkbox',
                id: villages[i],
                });
            checkBox.alt = villages1[i]['name'];
            newCell.appendChild(checkBox);
            newCell.innerHTML += "<a href=" + links[i] + ">" + villages[i] + "</a>";
            newRow.appendChild(newCell);

            //Truppen einer Einheit anzeigen
            for (var j = 0; j <= defence[i].length; j++) {
                switch (j) {
                    //Deffzahl
                    case defence[i].length:
                    var troopCell = document.createElement('td');
                    if (storage.getValue('deffscript' + welt + '_bogen', true) && storage.getValue('deffscript' + welt + '_paladin', true)) {
                        troopCell.innerHTML = deffanzahl(defence[i][0], defence[i][1], defence[i][2], defence[i][3], defence[i][4], defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9], defence[i][10], defence[i][11]);
                    } else if (storage.getValue('deffscript' + welt + '_bogen', true) && !storage.getValue('deffscript' + welt + '_paladin', true)) {
                        troopCell.innerHTML = deffanzahl(defence[i][0], defence[i][1], defence[i][2], defence[i][3], defence[i][4], defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9], 0, defence[i][10]);
                    } else if (!storage.getValue('deffscript' + welt + '_bogen', true) && storage.getValue('deffscript' + welt + '_paladin', true)) {
                        troopCell.innerHTML = deffanzahl(defence[i][0], defence[i][1], defence[i][2], 0, defence[i][3], defence[i][4], 0, defence[i][5], defence[i][6], defence[i][7], defence[i][8], defence[i][9]);
                    } else {
                        troopCell.innerHTML = deffanzahl(defence[i][0], defence[i][1], defence[i][2], 0, defence[i][3], defence[i][4], 0, defence[i][5], defence[i][6], defence[i][7], 0, defence[i][8]);
                    }
                    newRow.appendChild(troopCell);
                    break;
                    //Untertuetzung einer Einheit
                    default:
                    var troopCell = document.createElement('td');
                    if (defence[i][j] == 0)
                        troopCell.className = "hidden";
                    troopCell.innerHTML = defence[i][j];
                    newRow.appendChild(troopCell);
                    break;
                }
            }
            newTable.appendChild(newRow);
        }
        //Beim Checken einer Checkbox, die passenden Doerfer und Unterstuetzungen auch checken
        div.insertBefore(newTable, document.forms[document.forms.length - 2]);
        var eventname = (navigator.userAgent.indexOf('Firefox') > 0) ? 'mouseup': 'click';
        window.addEventListener(eventname, function(event) {
            if (event.target.type == "checkbox") {
                //Beim Checken einer Checkbox aus der Doerferliste
                var rows = document.getElementsByTagName('tr');
                for (var i = 1; i < rows.length - 1; i++) {
                    try {
                        if ((rows[i].getElementsByTagName("td")[rows[i].getElementsByTagName('td').length - 1].textContent != "Wojska") && trim(rows[i].getElementsByTagName('span')[0].textContent) == event.target.id || rows[i].getElementsByTagName('span')[0].innerHTML.split('value="')[1].split('"')[0] == event.target.value && event.target.name == 'indenstats') {
                            rows[i].getElementsByTagName("input")[0].checked = event.target.checked;
                        }
                    } catch(e) {}
                }
                //Beim Checken einer Checkbox aus der Spielertabelle
                var boxes = document.getElementById('einzeldoerfer').getElementsByTagName('input');
                if (event.target.name == 'indenstats') {
                    for (i = 0; i < boxes.length; i++) {
                        if (boxes[i].alt == event.target.value) {
                            boxes[i].checked = event.target.checked;
                        }
                    }
                }
            }
        }, true);
    }

    summarize();
    display();

    //Hochkopierter Button, um Truppen zurueckzuziehen
    document.getElementById('headerRow').removeChild(document.getElementById('headerRow').getElementsByTagName('th')[1]);
    document.getElementById('headerRow').innerHTML = document.getElementById('headerRow').innerHTML.replace('Aktion', '<a href="/game.php?village=' + villageid + '&screen=settings">Deffs</a>'); (function() {
        var button = document.getElementsByName("submit_units_back")[0];
        var table = document.getElementById("units_table");
        var newButton = createElement('input', {
            type: 'submit',
            value: 'Zurueckziehen'
        });
        table.childNodes[1].childNodes[1].childNodes[1].appendChild(newButton);
        newButton.addEventListener("click", function() {
            button.click();
        }, false);
    })();

    break;
    /*
 *
 * Uebersicht->Truppen->Verteidigung
 *
 */
    case 'units&type=support_detail':

    //Infos auslesen & Arrays erzeugen
    var spieler = new Array();
    var gesamt = new Array();
    var spielernr = new Array();
    spielernr[0] = new Array();
    spielernr[1] = new Array();

    //Liest die Unterstuetzungstruppen aus und schreibt Werte in die Arrays
    function zusammenrechnen(i, row) {
        //a oder b Zeile
        var rownr = (row == 'row_a') ? 0: 1;
        //Name des Unterstuetzenden Spielers
        try {
					if(navigator.userAgent.indexOf('Firefox') < 0){
            var name = '<a href="' + table.getElementsByClassName(row)[i].getElementsByTagName('a')[2].href + '">' + table.getElementsByClassName(row)[i].getElementsByTagName('a')[2].innerHTML + '</a>';
            var nameklartext = table.getElementsByClassName(row)[i].getElementsByTagName('a')[2].innerHTML;
			}else{
			var name = '<a href="' + table.getElementsByClassName(row)[i].getElementsByTagName('a')[1].href + '">' + table.getElementsByClassName(row)[i].getElementsByTagName('a')[1].innerHTML + '</a>';
            var nameklartext = table.getElementsByClassName(row)[i].getElementsByTagName('a')[1].innerHTML;
			
			}
			
        } catch(e) {
            name = '<a href="/game.php?screen=info_player&id=' + spielerid + '">' + spielername + '</a>';
            nameklartext = spielername;
        }
        //Prueft ob und an welcher Stelle der Spieler im Array gespeichert ist bzw schreibt ihn rein
        for (a = 0; a <= spieler.length; a++) {
            switch (a) {
            case spieler.length:
                if (spielernr[rownr][i] == null) {
                    spieler[a] = new Array();
                    spieler[a][0] = name;
                    spielernr[rownr][i] = a;
                }
                break;

            default:
                if (spieler[a][0] == name && spielernr[rownr][i] == null) {
                    spielernr[rownr][i] = a;
                }
                break;

            }

        }
        spieler[spielernr[rownr][i]][42] = nameklartext;
        table.getElementsByClassName(row)[i].getElementsByTagName('input')[0].src = nameklartext;

        //Truppen auslesen, in Spieler- und Gesamtarray speichern
        var b = (bogen) ? 13: 11;
        for (zelle = 2; zelle <= b; zelle++) {

            try {
                spieler[spielernr[rownr][i]][zelle] = (spieler[spielernr[rownr][i]][zelle] == null) ? Number(table.getElementsByClassName(row)[i].getElementsByTagName('td')[zelle - 1].innerHTML) : Number(spieler[spielernr[rownr][i]][zelle]) + Number(table.getElementsByClassName(row)[i].getElementsByTagName('td')[zelle - 1].innerHTML);
                gesamt[zelle] = (gesamt[zelle] == null) ? Number(table.getElementsByClassName(row)[i].getElementsByTagName('td')[zelle - 1].innerHTML) : gesamt[zelle] + Number(table.getElementsByClassName(row)[i].getElementsByTagName('td')[zelle - 1].innerHTML);
            } catch(e) {}

        }

        //Unterstuetzungszahl erhoehen
        spieler[spielernr[rownr][i]][1] = (spieler[spielernr[rownr][i]][1] == null) ? 1: spieler[spielernr[rownr][i]][1] + 1;
        gesamt[1] = (gesamt[1] == null) ? 1: gesamt[1] + 1;
    }

    //Funktion fuer a- und b-Zeilen ausfuehren
    for (i = 0; i < table.getElementsByClassName('row_a').length; i++) {
        zusammenrechnen(i, 'row_a');
    }
    for (i = 0; i < table.getElementsByClassName('row_b').length; i++) {
        zusammenrechnen(i, 'row_b');
    }

    //Zaehlen, in wievielen Doerfern Unterstuetzungen stehen
    var gedefftedoerfer = 0;
    for (i = 0; i < document.getElementById('units_table').getElementsByClassName('row_a').length; i++) {
        if (document.getElementById('units_table').getElementsByClassName('row_a')[i].previousSibling.previousSibling.className == ' units_away') {
            gedefftedoerfer++;
        }
    }
    for (i = 0; i < document.getElementById('units_table').getElementsByClassName('row_b').length; i++) {
        if (document.getElementById('units_table').getElementsByClassName('row_b')[i].previousSibling.previousSibling.className == ' units_away') {
            gedefftedoerfer++;
        }
    }

    //Tabelle erzeugen
    var div = document.getElementById("paged_view_content");
    var stat = createElement('table', {
        id: 'Statistik',
        style: 'width:100%'
    });
    var div2 = createElement('div', {
        style: 'width:100%;display:none',
        id: 'exportbereich',
        rows: '10'
    }, '<br><b>Tabelle in BB-Code (f&uuml;r Forum etc.):</b><br><textarea style="width:100%" id="Exportfeld" rows="10"></textarea>');
    //Behebt den Fehler, dass nichts angezeigt wird, wenn man in einer einzelnen Gruppe Doerfer filtert (leere Eintraege ausblendet)
    try {
        div.insertBefore(stat, document.forms[document.forms.length - 2]);
        div.insertBefore(div2, document.forms[document.forms.length - 2]);
    } catch(e) {
        div.insertBefore(stat, document.forms[document.forms.length - 1]);
        div.insertBefore(div2, document.forms[document.forms.length - 1]);
    }
    //Einheiten je nach Welttyp
    var units = new Array('spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob');
    if (bogen)
        var units = new Array('spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob');

    var thead = createElement('thead', {});
    var tr = createElement('tr', {});
    var th = createElement('th', {
        style: 'text-align:center',
        colspan: '2'
    }, 'Spieler [<a id="exportieren">Export</a>]');
    tr.appendChild(th);
    var th = createElement('th', {
        style: 'text-align:center'
    });
    var img = createElement('img', {
        src: image_base + '/command/support.png'
    });
    th.appendChild(img);
    tr.appendChild(th);
    var th = createElement('th', {
        style: 'text-align:center'
    });
    var a = createElement('a', {
        href: '/game.php?village=' + villageid + '&screen=settings'
    }, 'Deffs');
    th.appendChild(a);
    tr.appendChild(th);
    for (i = 0; i < units.length; i++) {
        units[i] = image_base + '/unit/unit_' + units[i] + '.png';
    }
    for (i = 0; i < units.length; i++) {
        var th = createElement('th', {
            style: 'text-align:center'
        });
        var img = createElement('img', {
            src: units[i]
            });
        th.appendChild(img);
        tr.appendChild(th);
    }
    thead.appendChild(tr);

    document.getElementById('Statistik').appendChild(thead);
    //Statistiken ueber einzelne Spieler einfuegen
    for (i = 0; i < spieler.length; i++) {
        deffzahl = (bogen) ? deffanzahl(spieler[i][2], spieler[i][3], spieler[i][4], spieler[i][5], spieler[i][6], spieler[i][7], spieler[i][8], spieler[i][9], spieler[i][10], spieler[i][11], spieler[i][12], spieler[i][13]) : deffanzahl(spieler[i][2], spieler[i][3], spieler[i][4], 0, spieler[i][5], spieler[i][6], 0, spieler[i][7], spieler[i][8], spieler[i][9], spieler[i][10], spieler[i][11]);
        var tr = createElement('tr', {});
        var td = createElement('td', {
            style: 'text-align:center'
        }, '<input type="checkbox" name="indenstats" alt="' + spieler[i][42] + '">');
        tr.appendChild(td);

        var td = createElement('td', {
            style: 'text-align:center'
        }, spieler[i][0])
            tr.appendChild(td);
        var td = createElement('td', {
            style: 'text-align:center'
        }, spieler[i][1])
            tr.appendChild(td);
        var td = createElement('td', {
            style: 'text-align:center'
        }, deffzahl)
            tr.appendChild(td);
        var b = (bogen) ? 13: 11;
        for (a = 2; a <= b; a++) {

            var td = createElement('td', {
                style: 'text-align:center'
            }, spieler[i][a])
                tr.appendChild(td);

        }
        document.getElementById('Statistik').appendChild(tr);
    }

    //Gesamtwerte einfuegen
    var tr = createElement('tr', {});
    var th = createElement('th', {
        style: 'text-align:center',
        colspan: '2'
    }, '<strong>Gesamt (' + spieler.length + ')</strong>')
        tr.appendChild(th);
    var gedefftedoerfer = (navigator.userAgent.indexOf('Firefox') > 0) ? gedefftedoerfer + 1: gedefftedoerfer
    var th = createElement('th', {
        style: 'text-align:center'
    }, gesamt[1] + ' in ' + gedefftedoerfer + ' D&ouml;rfern')
        tr.appendChild(th);
    if (bogen) {
        var th = createElement('th', {
            style: 'text-align:center'
        }, deffanzahl(gesamt[2], gesamt[3], gesamt[4], gesamt[5], gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11], gesamt[12], gesamt[13]))
            tr.appendChild(th);
    } else {
        var th = createElement('th', {
            style: 'text-align:center'
        }, deffanzahl(gesamt[2], gesamt[3], gesamt[4], 0, gesamt[5], gesamt[6], 0, gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11]))
            tr.appendChild(th);
    }
    var b = (bogen) ? 13: 11;
    for (a = 2; a <= b; a++) {

        var th = createElement('th', {
            style: 'text-align:center'
        }, gesamt[a])
            tr.appendChild(th);

    }
    document.getElementById('Statistik').appendChild(tr);

    //Beim Klick auf den Export-"Button"
    document.getElementById('exportieren').addEventListener('click', function exporten() {
        //Tabellenkopf
        var text = '[table][**]Spieler[||]Verteidigung[||]Deffs[||][unit]spear[/unit][||][unit]sword[/unit][||][unit]axe[/unit][||]';
        if (bogen)
            text += '[unit]archer[/unit][||]';
        text += '[unit]spy[/unit][||][unit]light[/unit][||]';
        if (bogen)
            text += '[unit]marcher[/unit][||]';
        text += '[unit]heavy[/unit][||][unit]ram[/unit][||][unit]catapult[/unit][||]';
        if (paladin)
            text += '[unit]knight[/unit][||]';
        text += '[unit]snob[/unit][/**]';
        //Pro Spieler den Namen, die unterstuetzten Truppen, Deffzahlen etc einfuegen
        for (i = 0; i < spieler.length; i++) {
            deffzahl = (bogen) ? deffanzahl(spieler[i][2], spieler[i][3], spieler[i][4], spieler[i][5], spieler[i][6], spieler[i][7], spieler[i][8], spieler[i][9], spieler[i][10], spieler[i][11], spieler[i][12], spieler[i][13]) : deffanzahl(spieler[i][2], spieler[i][3], spieler[i][4], 0, spieler[i][5], spieler[i][6], 0, spieler[i][7], spieler[i][8], spieler[i][9], spieler[i][10], spieler[i][11]);

            var text1 = '[*][player]' + spieler[i][0].split('>')[1].split('<')[0] + '[/player][|]' + spieler[i][1] + '[|]' + deffzahl;
            var b = (bogen) ? 13: 11;
            for (a = 2; a <= b; a++) {

                text1 += '[|]' + spieler[i][a];

            }
            text += text1 + '[/*]';
        }
        //Gesamtdeffzahl, Unterstuetzungen etc. einfuegen
        deffzahl = (bogen) ? deffanzahl(gesamt[2], gesamt[3], gesamt[4], gesamt[5], gesamt[6], gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11], gesamt[12], gesamt[13]) : deffanzahl(gesamt[2], gesamt[3], gesamt[4], 0, gesamt[5], gesamt[6], 0, gesamt[7], gesamt[8], gesamt[9], gesamt[10], gesamt[11]);
        var text1 = '[**]Gesamt (' + spieler.length + ')[||]' + gesamt[1] + ' in ' + gedefftedoerfer + ' Doerfern[||]' + deffzahl;
        var b = (bogen) ? 13: 11;
        for (a = 2; a <= b; a++) {

            text1 += '[||]' + gesamt[a];

        }

        text += text1 + '[/**][/table]';
        document.getElementById('exportbereich').style.display = '';
        document.getElementById('Exportfeld').value = text;

    }, false);

    //Beim Checken einer Checkbox die zugehoerigen Checkboxen in den anderen Bereichen auch anhaken
    var eventname = (navigator.userAgent.indexOf('Firefox') > 0) ? 'mouseup': 'click';
    window.addEventListener(eventname, function(event) {
        if (event.target.type == "checkbox") {
            var rows = document.getElementById('units_table').getElementsByTagName('tr');
            for (var i = 1; i < rows.length - 1; i++) {
                try {
                    if (rows[i].getElementsByTagName('input')[0].src.split('/')[3] == event.target.alt && event.target.name == 'indenstats') {
                        rows[i].getElementsByTagName('input')[0].checked = event.target.checked;
                    }
                } catch(e) {}
            }
        }
    }, true);

    break;
    /*
 *
 * Versammlungsplatz->Truppen
 *
 */
    case 'units':
    var table = document.getElementById('units_home');
    var bereiche = new Array();
    bereiche[0] = new Array();
    bereiche[1] = new Array();
    bereiche[2] = new Array();
    var villages = new Array();

    //Deffzahlen auslesen
    function auslesen(a) {
        b = bereiche[a];
        if (bogen && paladin) {
            for (i = 1; i < 13; i++) {
                b[i] = Number(b[0][i].innerHTML);
            }
            return deffanzahl(b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11], b[12]);
        } else if (bogen && !paladin) {
            for (i = 1; i < 12; i++) {
                b[i] = Number(b[0][i].innerHTML);
            }
            return deffanzahl(b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10], 0, b[11]);
        } else if (!bogen && paladin) {
            for (i = 1; i < 11; i++) {
                b[i] = Number(b[0][i].innerHTML);
            }
            return deffanzahl(b[1], b[2], b[3], 0, b[4], b[5], 0, b[6], b[7], b[8], b[9], b[10]);
        } else if (!bogen && !paladin) {
            for (i = 1; i < 10; i++) {
                b[i] = Number(b[0][i].innerHTML);
            }
            return deffanzahl(b[1], b[2], b[3], 0, b[4], b[5], 0, b[6], b[7], b[8], 0, b[9]);
        }

    }

    //Um die Herkunftsdoerfer nach Entfernung zu sortieren
    function sortieren() {
        if (villages.length > 3) {
            villages.sort(function(a, b) {
                return (villages[2]['distance'] > villages[3]['distance']) ? a.distance - b.distance: b.distance - a.distance
            });
            for (i = 2; i < villages.length; i++) {
                table.getElementsByTagName('tr')[i].innerHTML = villages[i - 2]['code'];
            }
        }
    }
    //Nur, wenn das Dorf wirklich unterstuetzt wird
    if (table.getElementsByTagName('tr').length > 3) {

        bereiche[0][0] = table.getElementsByTagName('tr')[1].getElementsByTagName('td');
        table.getElementsByTagName('tr')[1].getElementsByTagName('td')[0].innerHTML = 'Aus diesem Dorf (' + auslesen(0) + ' Deffs)';
        try {
            bereiche[1][0] = table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 2].getElementsByTagName('th');
            table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 2].getElementsByTagName('th')[0].innerHTML = '<input name="all" type="checkbox" class="selectAll" onclick="selectAll(this.form, this.checked)" /> Von au&szlig;erhalb (' + auslesen(1) + ' Deffs)';
        } catch(e) {}
        bereiche[2][0] = table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].getElementsByTagName('th');
        table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].getElementsByTagName('th')[0].innerHTML = 'Insgesamt (' + auslesen(2) + ' Deffs)';

        //Eigene Koordinaten fuer Entfernungsberechnung auslesen
        var ownx = document.getElementsByTagName('html')[0].innerHTML.split('"coord":"')[1].split('|')[0];
        var owny = document.getElementsByTagName('html')[0].innerHTML.split('"coord":"')[1].split('|')[1].split('"')[0];

        //Fuer jede Zeile zusaetzliche Zellen einfuegen
        for (i = 0; i < table.getElementsByTagName('tr').length - 1; i++) {
            switch (i) {
            case 0:
                var th = createElement('th', {}, '<a>Entfernung</a>');
                th.addEventListener('click', sortieren, false);
                table.getElementsByTagName('tr')[0].insertBefore(th, table.getElementsByTagName('tr')[0].getElementsByTagName('th')[1]);
                break;
            case 1:
                var td = createElement('td', {
                    style: 'text-align:center',
                    class: 'unit-item hidden'
                }, '0');
                table.getElementsByTagName('tr')[1].insertBefore(td, table.getElementsByTagName('tr')[1].getElementsByTagName('td')[1]);
                break;
            default:
                try {
                    table.getElementsByTagName('tr')[i].getElementsByTagName('td')[0].style = 'min-width:250px';
                    var x = table.getElementsByTagName('tr')[i].getElementsByTagName('td')[0].innerHTML.split('(')[1].split('|')[0];
                    var y = table.getElementsByTagName('tr')[i].getElementsByTagName('td')[0].innerHTML.split('|')[1].split(')')[0];
                    var td = createElement('td', {
                        style: 'text-align:center',
                        class: 'unit-item hidden'
                    }, village_distance(ownx, x, owny, y));
                    table.getElementsByTagName('tr')[i].insertBefore(td, table.getElementsByTagName('tr')[i].getElementsByTagName('td')[1]);
                    villages[i] = {};
                    villages[i]['distance'] = village_distance(ownx, x, owny, y);
                    villages[i]['code'] = table.getElementsByTagName('tr')[i].innerHTML;
                } catch(e) {}
                break;
            }
        }
        var th = document.createElement('th');
        table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].insertBefore(th, table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].getElementsByTagName('th')[1]);
        var th = document.createElement('th');
        table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 2].insertBefore(th, table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 2].getElementsByTagName('th')[1]);
    }
    break;
    /*
 *
 * Dorfansicht
 *
 */
    case 'overview':

    //Truppen auslesen
    var bereich = document.getElementsByTagName('body')[0].innerHTML.split('<div id="show_units" class="vis moveable widget">')[1].split('<td><a href="')[0];

    var sp = (bereich.indexOf('unit_spear.png?') < 0) ? 0: Number(bereich.split('unit_spear.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var sw = (bereich.indexOf('unit_sword.png?') < 0) ? 0: Number(bereich.split('unit_sword.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var ax = (bereich.indexOf('unit_axe.png?') < 0) ? 0: Number(bereich.split('unit_axe.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var bo = (bereich.indexOf('unit_archer.png?') < 0) ? 0: Number(bereich.split('unit_archer.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var spy = (bereich.indexOf('unit_spy.png?') < 0) ? 0: Number(bereich.split('unit_spy.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var lk = (bereich.indexOf('unit_light.png?') < 0) ? 0: Number(bereich.split('unit_light.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var bb = (bereich.indexOf('unit_marcher.png?') < 0) ? 0: Number(bereich.split('unit_marcher.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var sk = (bereich.indexOf('unit_heavy.png?') < 0) ? 0: Number(bereich.split('unit_heavy.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var ra = (bereich.indexOf('unit_ram.png?') < 0) ? 0: Number(bereich.split('unit_ram.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var ka = (bereich.indexOf('unit_catapult.png?') < 0) ? 0: Number(bereich.split('unit_catapult.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var pa = (bereich.indexOf('unit_knight.png?') < 0) ? 0: Number(bereich.split('unit_knight.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    var ag = (bereich.indexOf('unit_snob.png?') < 0) ? 0: Number(bereich.split('unit_snob.png?')[1].split("</strong>")[0].split('<strong>')[1]);
    //Deffanzahl berechnen und einfuegen
    document.getElementById('show_units').getElementsByTagName('h4')[0].innerHTML = '<img style="float: right; cursor: pointer;" onclick="return VillageOverview.toggleWidget( \'show_units\', this );" src="graphic/minus.png" />		Einheiten (' + String(deffanzahl(sp, sw, ax, bo, spy, lk, bb, sk, ra, ka, pa, ag)) + ' Deffs)';

    break;

}
