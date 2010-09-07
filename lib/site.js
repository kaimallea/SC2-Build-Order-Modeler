/****************************************************
 * Custom functions
 *
 ****************************************************/
 
//
// Render units, structures and upgrade into view
//
function render(what) {
    // Update supply display
    $("#" + race_view + "-supply")
        .html(
            window[race_view].total_cost.supply.used + " / " +
            window[race_view].total_cost.supply.total
        );

    // Update mineral display
    $("#" + race_view + "-mineral")
        .html(window[race_view].total_cost.mineral);

    // Update vespene display
    $("#" + race_view + "-vespene")
        .html(window[race_view].total_cost.vespene);

    var current_supply = $("#" + race_view + "-supply")[0].innerHTML;
    var trim = race_view + "-" + what.split(' ').join('').toLowerCase();
    
    var z;
    
    // Determine if unit, structure of upgrade
    if (window[race_view].units[what]) {
        z = $("<div class='unit'>" + current_supply + " | <b>" + what + "</b> | Mineral Supply | Build Time </div>");
    } else if (window[race_view].upgrades[what]) {
        z = $("<div class='upgrade'>" + current_supply + " | <b>" + what + "</b> | Mineral Supply | Build Time </div>");
    } else if (window[race_view].structures[what]) {
        z = $("<div class='structure'>" + current_supply + " | <b>" + what + "</b> | Mineral Supply | Build Time </div>");
    }

    z.attr("style", "background-image: url(../img/thumbs/" + trim + ".jpg);")
        .hide()
        .prependTo($("#" + race_view + "-build"))
        .fadeIn("slow");
}


//
// Error notification
//
function displayError(msg) {
    var child = $('#msg'),
        parent = $("#" + race_view);

    // Remove any existing notification from view
    if (child) { 
        child.remove();
        if (SC2BOM.last_timer) {
            clearTimeout(SC2BOM.last_timer);
        }
    }

    // Create new element and prepend to parent
    $('<div id="msg" class="error"></div>')
        .html(msg)
        .hide()
        .prependTo(parent)
        .fadeIn();

    // Fade out after 3 secs
    SC2BOM.last_timer = setTimeout(function () { 
        $('#msg').fadeOut("slow"); }, 
        3000
    );
}


//
// Reset race in view
//
function reset() {
    // Reset (re-initalize) race object
    window[race_view].init();

    // reset spent resources display
    $("#" + race_view + "-supply")
        .html(
            window[race_view].total_cost.supply.used + 
            " / " +
            window[race_view].total_cost.supply.total
        );

    // Update mineral display
    $("#" + race_view + "-mineral")
    .html(window[race_view].total_cost.mineral);

    // Update vespene display
    $("#" + race_view + "-vespene")
    .html(window[race_view].total_cost.vespene);

    // reset build view
    $("#" + race_view + "-build")[0].innerHTML = "";
}


//
// Share build in view
//
function share() {
    try {
        $("#shareable-url")[0].value = window[race_view].generate_url();
    }
    catch(e) {
        displayError(e.message);
        $("#shareable-url")[0].value = "";
        return;
    }
    $("#shorten-url")[0].style.visibility = "visible";
    $('#share-dialog').dialog('open');
}


//
// Undo last action
//
function undo() {
    try
    {
        window[race_view].undo();
    }
    catch(e)
    {
        displayError(e.message);
        return;
    }

    var parent = $("#" + race_view + "-build")[0];
    // Remove last element created
    $(parent.firstChild).remove();

    // Update supply display
    $("#" + race_view + "-supply")
    .html(
        window[race_view].total_cost.supply.used + 
        " / " + 
        window[race_view].total_cost.supply.total
    );

    // Update mineral display
    $("#" + race_view + "-mineral")
    .html(window[race_view].total_cost.mineral);

    // Update vespene display
    $("#" + race_view + "-vespene")
    .html(window[race_view].total_cost.vespene);
}


//
// A basic object with methods to shorten urls via bit.ly,
// using JSONP.
//
var bitly = {
    
    auth: {
        login: "kaimallea",
        apiKey: "R_134a45b9326fd277580471cd200d35d0"
    },
    
    shorten: function (url) {
        // Very simple validations
        if (!url) {
            throw new Error("bitly.shorten: expected an argument.");
        } else if (!url.match(/^https?:\/\/.+$/)) {
            throw new Error("bitly.shorten: invalid url specified.");
        }

        if (!this.auth.login || !this.auth.apiKey) {
            throw new Error("bitly.shorten: please set both login and apiKey.")
        }

        // Safe travels!
        url = encodeURIComponent(url);
        
        var e = document.createElement('script'),
            r = "http://api.bit.ly/v3/shorten?login=" +
            this.auth.login + "&apiKey=" + this.auth.apiKey +
            "&longUrl=" + url + "&format=json&callback=" +
            "bitly.callback";

        // Prevent caching
        e.src = r + "&" + Math.random();

        document.getElementsByTagName('head').item(0).appendChild(e);
    },
    
    callback: function (response) {
        if (response.status_code == 200) {
            $("#shareable-url")[0].value = response.data.url;
            $("#shorten-url")[0].style.visibility = "hidden";
        } else {

        }
    }
};


var protoss = new Protoss(),
    terran = new Terran(),
    zerg = new Zerg(),
    race_view = "protoss",
    hash = window.location.hash;

if (hash) {
    switch(hash[1])
    {
        case "p":
            race_view = "protoss";
            break;
        case "t":
            race_view = "terran";
            break;
        case "z":
            race_view = "zerg";
            break;
        default:
            race_view = "protoss";
    }
}

//
// Re-build from hash if necessary
//
if (hash) {
    try
    {
        window[race_view].build_from_url(
            window.location.href,
            function (x) {
                render(x);
        });
    }
    catch(e)
    {
        displayError(e.message);
    }
}


/****************************************************
 * Behavior and UI
 *
 ****************************************************/
 
//
//  Render accordian to default race view
//
$.ajax({
    url: race_view + ".html",
    success: function(data) {
        $('#accordion')
        .html(data)
        .accordion();
    }
});


//
// Render tabs to default race view
// and handle tab clicks
//
$('#tabs').tabs({
    select: function(event, ui) {
        $.ajax({
            url: ui.panel.id + ".html",          		
            success: function(data) {
                race_view = ui.panel.id;

                $('#accordion')
                .accordion('destroy')
                .html(data)
                .accordion();
            }
        });
    }
}).tabs('select', race_view);


//
// Render all buttons to theme
//
$("button").button();


//
// Dialog handler
//
$("#share-dialog").dialog({
    autoOpen: false,
    resizable: false,
    draggable: false,
    modal: true,
    height: 125,
    width: 600
});


//
// Reset button handler
//
$("#reset").click(function () {
    reset();
});


//
// Share button handler
//
$("#share").click(function () {
    share();
});


//
// Undo button handler
//
$("#undo").click(function () {
    undo();
});


//
// Shorten button handler
//
$("#shorten-url").click(function () {
    try 
    {
        bitly.shorten($("#shareable-url")[0].value);
    } 
    catch(e)
    {
        alert(e);
    }
});