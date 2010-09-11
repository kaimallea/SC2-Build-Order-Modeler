//
// Internet Explorer does not have a built-in
// indexOf method for it's Array type.
//
// Credit: StackOverflow.com
//
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] == obj) { return i; }
        }
        return -1;
    };
};


//
// Properly test for an array.
//
// Credit: Douglas Crockford
//
var is_array = function (value) {
    return Object.prototype.toString.apply(value) === '[object Array]';
}


// App's namespace.
// TODO: Use this, get rid of globals

var SC2BOM = {};

//
// Simple wrapper for throwing arbitrary
// exceptions.
//
var err = function (msg) {
    throw {
        name: "error",
        message: msg || "Unknown error"
    };
};


//
// General build order representation and
// constructor.
//
var BuildOrder = function (race) {
    this.race = race.toLowerCase() || err("BuildOrder constructor expected one argument.");
    this.init = function () {
        var that = this;
        this.total_cost = {
            "mineral": 0,
            "vespene": 0,
            "build_time": 0,
            "est_time": function () {
                var secs = that.total_cost.build_time;
                var mins = Math.floor(secs / 60);
                secs = secs % 60;
                return (mins < 10 ? "0" + mins : mins) + ":" + 
                    (secs < 10 ? "0" + secs : secs);
            }
        };
        this.build_order = [];
        this.total_cost.supply = function () {
            if (that.race == "protoss") {
                return {
                    "used": 6,
                    "total": 10  
                };
            }
            else if (that.race == "terran") {
                return {
                    "used": 6,
                    "total": 11 
                };
            }
            else if (that.race == "zerg") {
                return {
                    "used": 6,
                    "total": 10  
                };
            }   
        }();
    };
    
    // call init on instantiation
    // to set default supply values
    this.init();
};


//
// Generate a sharable url from a build order
//
BuildOrder.prototype.generate_url = function () {
    if (!this.build_order.length) {
        err("Build something first!");
    }
    
    var url = "",
        item,
        last_item,
        last_amount,
        new_amount;
        
    for (var i=0; i < this.build_order.length; i++) {
        // Determine what type of build item this is
        item = this.units[this.build_order[i]] || 
        this.structures[this.build_order[i]] ||
        this.upgrades[this.build_order[i]];
        
        // Valid build item?
        if (item) {

            // Did we just add this?
            if (item.uid == last_item) {
                // Set new amount
                new_amount = last_amount + 1;
                                
                // Update url with new amount + delimiter
                url = url.substr(0,
                    url.length - (last_amount.toString().length + 1)) +
                    new_amount.toString() + "|";
                
                // Increment last consecutive count
                last_amount += 1;
            }
            else
            {
                // New or non-consecutive item
                url += item.uid + "1|";
                last_item = item.uid;
                last_amount = 1;
            }
        }
    }
    
    // Return url based on current window's href
    return window.location.protocol + "//" + 
        window.location.host +
        window.location.pathname +
        "#" + this.race[0] + "|" + url.substr(0, url.length-1);
}


//
// Re-create build order from shared url.
// callback is called for each item (e.g., rendering)
//
BuildOrder.prototype.build_from_url = function (url, callback) {
    if (!url || !url.lastIndexOf("#")) {
        err("Please provide a valid build url");
    }
    
    // Reset build order and mineral/supply count
    this.init();
    
    // Only interested in the stuff after the last hash mark
    var uids = url.substr(url.lastIndexOf("#") + 1).split("|");
    
    // TODO: Create index of uids to units/structs/upgrades
    // TODO: Factor code -- not DRY; result of unit testing

    // Check for existence in unit/structure/upgrade objects
    // For every uid in the uids array...
    uidloop: for (var i=0; i < uids.length; i++) {
        // Look through every unit for a matching uid
        for (var x in this.units) {
            // A match?
            if (this.units[x].uid == uids[i].substr(0, 3)) {
                // Add to build order n times
                for (var n=0; n < parseInt(uids[i].substr(3)); n++) {
                    try
                    {
                        this.build(x);
                        if (callback && typeof callback == "function") {
                            callback(x);
                        }
                    }
                    catch(e)
                    {
                        err(e.message);
                    }
                }
                // Continue from outer most loop
                continue uidloop;
            }
        }
        
        // Look through every structure for a matching uid
        for (var x in this.structures) {
            // A match?
            if (this.structures[x].uid == uids[i].substr(0, 3)) {
                // Add to build order n times
                for (var n=0; n < parseInt(uids[i].substr(3)); n++) {
                    try
                    {
                        this.build(x);
                        if (callback && typeof callback == "function") {
                            callback(x);
                        }
                    }
                    catch(e)
                    {
                        err(e.message);
                    }
                }
                // Continue from outer most loop
                continue uidloop;
            }
        }
        
        // Look through every upgrade for a matching uid  
        for (var x in this.upgrades) {
            // A match?
            if (this.upgrades[x].uid == uids[i].substr(0, 3)) {
                // Add to build order n times
                for (var n=0; n < parseInt(uids[i].substr(3)); n++) {
                    try
                    {
                        this.build(x);
                        if (callback && typeof callback == "function") {
                            callback(x);
                        }
                    }
                    catch(e)
                    {
                        err(e.message);
                    }
                }
                // Continue from outer most loop
                continue uidloop;
            }
        }
    }
    return this.build_order;
    
}


//
// Validation that applies to all SC2 game objects, and must be
// passed before an object can be built.
//
BuildOrder.prototype.validate = function(x) {
    var o;
    var objtype;
    
    // Determine object type
    if (this.units[x]) {
        objtype = "unit";
        o = this.units[x];
    } else if (this.structures[x]) {
        objtype = "structure";
        o = this.structures[x];
    } else if (this.upgrades[x]) {
        objtype = "upgrade";
        o = this.upgrades[x];
    } else {
        err("Unknown object: " + x);
    }
    
    
    // Suppliers have no prereqs and can be built at any time
    // e.g., Pylon, Overlord, Command Center, Nexus, Hatchery
    if (o.supplier) {
        return o; // Skip remaining validation
    }
    
    
    // Unit-specific: has the structure that produces this object
    // been built?
    //
    if (objtype === "unit")  {
        if (this.default_build_order.indexOf(o.build_from) === -1 &&
            this.build_order.indexOf(o.build_from) === -1) {
            
            err(x + " requires " + o.build_from);
        }
    }

    
    // Are object's prerequisites satisfied?
    //
    if (o.prerequisite) {
       
        // Array = multiple prereqs
        if (is_array(o.prerequisite)) {
            for (var i = 0; i < o.prerequisite.length; i += 1) {
                if (this.default_build_order.indexOf(o.prerequisite[i]) === -1 &&
                    this.build_order.indexOf(o.prerequisite[i]) === -1) {
                    
                    err(x + " requires " + o.prerequisite);
                }
            }
        // Single prereq
        } else {
            if (this.default_build_order.indexOf(o.prerequisite) === -1 &&
                this.build_order.indexOf(o.prerequisite) === -1) {
                
                err(x + " requires " + o.prerequisite);
            }
        }
    }
    
    
    // Protoss require at least one Pylon before building any other
    // structures
    //
    if (objtype !== "unit" && this.race === "protoss" && x !== "Pylon" && 
        this.structures[x] && this.build_order.indexOf("Pylon") === -1) {
            
        err("At least one (1) Pylon is required to build a structure");
    }
    
    // Unit supply validation
    //
    if (objtype === "unit")  {
        // Have we already maxed out supply?
        if (this.total_cost.supply.used == 200 ||
            // Will we exceed supply by training this unit?
            (this.total_cost.supply.used + parseInt(o.supply, 10)) > 200) {
                
            err("Supply maximum (200) cannot be exceeded");
        }
        
        
        // Are we supply blocked?
        var limit = (this.total_cost.supply.total - this.total_cost.supply.used);
        if (parseInt(o.supply, 10) > limit) {
            switch(this.race) {
                case "protoss":
                    err("Construct additional Pylons (Supply Blocked)");
                    break;
                case "zerg":
                    err("Spawn more Overlords (Supply Blocked)");
                    break;
                case "terran":
                    err("Build additional Supply Depots (Supply Blocked)");
                    break;
                default:
                    err("You need more supply! (Supply Blocked)");
            }
        }
    }
    
    
    // If vespene is required for this object,
    // we must be collecting it
    //
    if (parseInt(o.vespene, 10) > 0) {
        if (this.build_order.indexOf("Extractor") == -1 &&
            this.build_order.indexOf("Assimilator") == -1 &&
            this.build_order.indexOf("Refinery") == -1) {
            
            switch(this.race) {
                case "protoss":
                    err(x + " requires vepense gas - build an Assimilator");
                    break;
                case "zerg":
                    err(x + " requires vepense gas - build an Extractor");
                    break;
                case "terran":
                    err(x + " requires vepense gas - build a Refinery");
                    break;
                default:
                    err(x + " requires vespene gas");
            }
        }
    }
    
    // Upgrades can only be performed once each
    if (objtype === "upgrade") {
        if (this.build_order.indexOf(x) >= 0) {
            err(x + " has already been researched");
        }
    }
    
    return o;
}


//
// Build an object by it's name (unit, structure or upgrade)
//
BuildOrder.prototype.build = function(name) {
    try {
        var o = this.validate(name); // An object is returned
    } catch (e) {
        err(e.message);
        return;
    }
    
    // Passed validation; add string to build order array
    this.build_order.push(name);
    
    if (o.supplier) { // Some objects increase supply
        this.total_cost.supply.total += parseInt(o.supply, 10);
        
    // Zerg buildings return 1x supply at the cost of a Drone
    } else if (this.race == "zerg" && this.structures[name]) {
        this.total_cost.supply.used -= 1;
    
    // All other objects with supply properties are consumers of supply
    } else if (o.supply) {
        this.total_cost.supply.used += parseInt(o.supply, 10);
    }
    
    // Increase total resources spent
    this.total_cost.mineral += parseInt(o.mineral, 10);
    this.total_cost.vespene += parseInt(o.vespene, 10); 
    
    // Increase total build time
    this.total_cost.build_time += parseInt(o.build_time);   
}


//
// Undo last action
//
BuildOrder.prototype.undo = function() {
    if (!this.build_order.length) {
        err("Nothing to undo.");
    }
    
    var last = this.build_order.pop(),
        item = 
            this.units[last] || 
            this.structures[last] || 
            this.upgrades[last];
    
    if (!item) {
        err("Unexpected error. Unable to undo last action for " + last);
    }
    
    // Refund resources
    this.total_cost.mineral -= item.mineral;
    this.total_cost.vespene -= item.vespene;
    if (item.supplier) {
        this.total_cost.supply.total -= item.supply;
    }
    // Refund supply, if refundable
    // Structures and upgrades don't have supply
    else if (item.supply) {
        this.total_cost.supply.used -= item.supply;
    }
    
    // Refund time
    this.total_cost.build_time -= item.build_time;
}


//
// Protoss specific Build Order
//
var Protoss = function () {};


//
// Inherits from BuildOrder
//
Protoss.prototype = new BuildOrder("Protoss");

Protoss.prototype.default_build_order = [
    'Nexus',
    'Probe',
    'Probe',
    'Probe',
    'Probe',
    'Probe',
    'Probe'
];


//
// Represents all Protoss units.
//
Protoss.prototype.units = {
    "Probe": {
        "build_from": "Nexus",
        "race": "Protoss",
        "health": "20",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "20",
        "build_time": "17",
        "vespene": "0",
        "uid": "001"
    },
    "Zealot": {
        "build_from": "Gateway",
        "race": "Protoss",
        "health": "100",
        "mineral": "100",
        "supply": "2",
        "armor": "0",
        "energy": "50",
        "build_time": "33",
        "vespene": "0",
        "uid": "002"
    },
    "Stalker": {
        "build_from": "Gateway",
        "race": "Protoss",
        "health": "80",
        "mineral": "125",
        "supply": "2",
        "armor": "0",
        "energy": "80",
        "build_time": "42",
        "prerequisite": "Cybernetics Core",
        "vespene": "50",
        "uid": "003"
    },
    "Sentry": {
        "build_from": "Gateway",
        "race": "Protoss",
        "health": "40",
        "mineral": "50",
        "supply": "2",
        "armor": "200",
        "energy": "40",
        "build_time": "42",
        "prerequisite": "Cybernetics Core",
        "vespene": "100",
        "uid": "004"
    },
    "Observer": {
        "build_from": "Robotics Facility",
        "race": "Protoss",
        "health": "40",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "20",
        "build_time": "40",
        "vespene": "100",
        "uid": "005"
    },
    "Immortal": {
        "build_from": "Robotics Facility",
        "race": "Protoss",
        "health": "200",
        "mineral": "250",
        "supply": "4",
        "armor": "0",
        "energy": "100",
        "build_time": "55",
        "vespene": "100",
        "uid": "006"
    },
    "Warp Prism": {
        "build_from": "Robotics Facility",
        "race": "Protoss",
        "health": "100",
        "mineral": "200",
        "supply": "2",
        "armor": "0",
        "energy": "40",
        "build_time": "50",
        "vespene": "0",
        "uid": "007"
    },
    "Colossus": {
        "build_from": "Robotics Facility",
        "race": "Protoss",
        "health": "200",
        "mineral": "300",
        "supply": "6",
        "armor": "0",
        "energy": "150",
        "build_time": "75",
        "prerequisite": "Robotics Bay",
        "vespene": "200",
        "uid": "008"
    },
    "Phoenix": {
        "build_from": "Stargate",
        "race": "Protoss",
        "health": "120",
        "mineral": "150",
        "supply": "2",
        "armor": "200",
        "energy": "60",
        "build_time": "45",
        "vespene": "100",
        "uid": "009"
    },
    "Void Ray": {
        "build_from": "Stargate",
        "race": "Protoss",
        "health": "150",
        "mineral": "250",
        "supply": "3",
        "armor": "0",
        "energy": "100",
        "build_time": "60",
        "vespene": "150",
        "uid": "010"
    },
    "High Templar": {
        "build_from": "Gateway",
        "race": "Protoss",
        "health": "40",
        "mineral": "50",
        "supply": "2",
        "armor": "200",
        "energy": "40",
        "build_time": "55",
        "prerequisite": "Templar Archives",
        "vespene": "150",
        "uid": "011"
    },
    "Dark Templar": {
        "build_from": "Gateway",
        "race": "Protoss",
        "health": "40",
        "mineral": "125",
        "supply": "2",
        "armor": "0",
        "energy": "80",
        "build_time": "55",
        "prerequisite": "Dark Shrine",
        "vespene": "125",
        "uid": "012"
    },
    "Archon": {
        "build_from": "High Templar",
        "race": "Protoss",
        "health": "10",
        "mineral": "0",
        "supply": "0",
        "armor": "0",
        "energy": "350",
        "build_time": "12",
        "vespene": "0",
        "uid": "013"
    },
    "Carrier": {
        "build_from": "Stargate",
        "race": "Protoss",
        "health": "300",
        "mineral": "350",
        "supply": "6",
        "armor": "0",
        "energy": "150",
        "build_time": "120",
        "prerequisite": "Fleet Beacon",
        "vespene": "250",
        "uid": "014"
    },
    "Inteceptors": {
        "build_from": "Carrier",
        "race": "Protoss",
        "health": "40",
        "mineral": "25",
        "supply": "0",
        "armor": "0",
        "energy": "40",
        "build_time": "8",
        "vespene": "250",
        "uid": "015"
    },
    "Mothership": {
        "build_from": "Nexus",
        "race": "Protoss",
        "health": "350",
        "mineral": "400",
        "supply": "8",
        "armor": "200",
        "energy": "350",
        "build_time": "160",
        "prerequisite": "Fleet Beacon",
        "vespene": "400",
        "uid": "016"
    }
};


//
// Represents all Protoss structures.
//
Protoss.prototype.structures = {
    "Assimilator": {
        "mineral": "75",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "",
        "uid": "017"
    },
    "Cybernetics Core": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "50",
        "prerequisite": "Gateway",
        "uid": "018"
    },
    "Dark Shrine": {
        "mineral": "100",
        "vespene": "250",
        "build_time": "100",
        "prerequisite": "Twilight Council",
        "uid": "019"
    },
    "Fleet Beacon": {
        "mineral": "300",
        "vespene": "200",
        "build_time": "60",
        "prerequisite": "Stargate",
        "uid": "020"
    },
    "Forge": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "45",
        "prerequisite": "",
        "uid": "021"
    },
    "Gateway": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "65",
        "prerequisite": "Nexus",
        "uid": "022"
    },
    "Nexus": {
        "mineral": "400",
        "vespene": "0",
        "build_time": "100",
        "prerequisite": "",
        "supplier": true,
        "supply": "10",
        "uid": "023"
    },
    "Photon Cannon": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "40",
        "prerequisite": "Forge",
        "uid": "024"
    },
    "Pylon": {
        "mineral": "100",
        "vespene": "0",
        "build_time": "25",
        "prerequisite": "",
        "supplier": true,
        "supply": "8",
        "uid": "025"
    },
    "Robotics Bay": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "65",
        "prerequisite": "Robotics Facility",
        "uid": "026"
    },
    "Robotics Facility": {
        "mineral": "200",
        "vespene": "100",
        "build_time": "65",
        "prerequisite": "Cybernetics Core",
        "uid": "027"
    },
    "Stargate": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "60",
        "prerequisite": "Cybernetics Core",
        "uid": "028"
    },
    "Templar Archives": {
        "mineral": "150",
        "vespene": "200",
        "build_time": "50",
        "prerequisite": "Twilight Council",
        "uid": "029"
    },
    "Twilight Council": {
        "mineral": "150",
        "vespene": "100",
        "build_time": "50",
        "prerequisite": "Cybernetics Core",
        "uid": "030"
    }
};


//
// Represents all Protoss upgrades.
//
Protoss.prototype.upgrades = {
    "Air Weapons Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "170",
        "prerequisite": "Cybernetics Core",
        "uid": "031"
    },
    "Air Weapons Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "170",
        "prerequisite": "Air Weapons Level 1",
        "uid": "032"
    },
    "Air Weapons Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "200",
        "prerequisite": "Air Weapons Level 2",
        "uid": "033"
    },
    "Air Armor Level 1": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "140",
        "prerequisite": "Cybernetics Core",
        "uid": "034"
    },
    "Air Armor Level 2": {
        "mineral": "225",
        "vespene": "225",
        "build_time": "170",
        "prerequisite": "Air Armor Level 1",
        "uid": "035"
    },
    "Air Armor Level 3": {
        "mineral": "300",
        "vespene": "300",
        "build_time": "200",
        "prerequisite": "Air Armor Level 2",
        "uid": "036"
    },
    "Warpgate": {
        "mineral": "50",
        "vespene": "50",
        "build_time": "140",
        "prerequisite": "Cybernetics Core",
        "uid": "037"
    },
    "Hallucination": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": "Cybernetics Core",
        "uid": "038"
    },
    "Shields Level 1": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "140",
        "prerequisite": "Forge",
        "uid": "039"
    },
    "Shields Level 2": {
        "mineral": "300",
        "vespene": "300",
        "build_time": "170",
        "prerequisite": ["Shields Level 1", "Twilight Council"],
        "uid": "040"
    },
    "Shields Level 3": {
        "mineral": "400",
        "vespene": "400",
        "build_time": "200",
        "prerequisite": "Shields Level 2",
        "uid": "041"
    },
    "Ground Weapons Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": "Forge",
        "uid": "042"
    },
    "Ground Weapons Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "170",
        "prerequisite": ["Ground Weapons Level 1", "Twilight Council"],
        "uid": "043"
    },
    "Ground Weapons Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "200",
        "prerequisite": "Ground Weapons Level 2",
        "uid": "044"
    },
    "Ground Armor Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": "Forge",
        "uid": "045"
    },
    "Ground Armor Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "170",
        "prerequisite": ["Ground Armor Level 1", "Twilight Council"],
        "uid": "046"
    },
    "Ground Armor Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "200",
        "prerequisite": "Ground Armor Level 2",
        "uid": "047"
    },
    "Charge": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "140",
        "prerequisite": "Twilight Council",
        "uid": "048"
    },
    "Blink": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Twilight Council",
        "uid": "049"
    },
    "Psionic Storm": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "110",
        "prerequisite": "Templar Archives",
        "uid": "050"
    },
    "Khaydarin Amulet": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Templar Archives",
        "uid": "051"
    },
    "Extended Thermal Lances": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "140",
        "prerequisite": "Robotics Bay",
        "uid": "052"
    },
    "Grativic Booster": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": "Robotics Bay",
        "uid": "053"
    },
    "Grativic Drive": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": "Robotics Bay",
        "uid": "054"
    },
    "Flux Vanes": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "80",
        "prerequisite": "Fleet Beacon",
        "uid": "055"
    },
    "Graviton Catapult": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "80",
        "prerequisite": "Fleet Beacon",
        "uid": "056"
    }
};



//
// Terran specific Build Order
//
var Terran = function () {};


//
// Inherits from BuildOrder
//
Terran.prototype = new BuildOrder("Terran");

Terran.prototype.default_build_order = [
    'Command Center',
    'SCV',
    'SCV',
    'SCV',
    'SCV',
    'SCV',
    'SCV'
]


//
// Represents all Terran units
//
Terran.prototype.units = {
    "SCV": {
        "build_from": "Command Center",
        "race": "Terran",
        "health": "45",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "0",
        "build_time": "17",
        "vespene": "0",
        "uid": "057"
    },
    "MULE": {
        "build_from": "Orbital Command",
        "race": "Terran",
        "health": "60",
        "mineral": "0",
        "supply": "0",
        "armor": "0",
        "energy": "0",
        "build_time": "0",
        "vespene": "0",
        "uid": "058"
    },
    "Marine": {
        "build_from": "Barracks",
        "race": "Terran",
        "health": "45",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "0",
        "build_time": "25",
        "vespene": "0",
        "uid": "059"
    },
    "Marauder": {
        "build_from": "Barracks",
        "race": "Terran",
        "health": "125",
        "mineral": "100",
        "supply": "2",
        "armor": "1",
        "energy": "0",
        "build_time": "30",
        "prerequisite": "Tech Lab",
        "vespene": "25",
        "uid": "060"
    },
    "Reaper": {
        "build_from": "Barracks",
        "race": "Terran",
        "health": "50",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "0",
        "build_time": "40",
        "prerequisite": "Tech Lab",
        "vespene": "50",
        "uid": "061"
    },
    "Ghost": {
        "build_from": "Barracks",
        "race": "Terran",
        "health": "100",
        "mineral": "150",
        "supply": "2",
        "armor": "0",
        "energy": "200",
        "build_time": "40",
        "prerequisite": ["Ghost Academy", "Tech Lab"],
        "vespene": "150",
        "uid": "062"
    },
    "Hellion": {
        "build_from": "Factory",
        "race": "Terran",
        "health": "90",
        "mineral": "100",
        "supply": "2",
        "armor": "0",
        "energy": "0",
        "build_time": "30",
        "vespene": "0",
        "uid": "063"
    },
    "Siege Tank": {
        "build_from": "Factory",
        "race": "Terran",
        "health": "160",
        "mineral": "150",
        "supply": "3",
        "armor": "1",
        "energy": "0",
        "build_time": "45",
        "prerequisite": "Tech Lab",
        "vespene": "125",
        "uid": "064"
    },
    "Thor": {
        "build_from": "Factory",
        "race": "Terran",
        "health": "400",
        "mineral": "300",
        "supply": "6",
        "armor": "1",
        "energy": "200",
        "build_time": "60",
        "prerequisite": ["Armory", "Tech Lab"],
        "vespene": "200",
        "uid": "065"
    },
    "Viking": {
        "build_from": "Starport",
        "race": "Terran",
        "health": "125",
        "mineral": "150",
        "supply": "2",
        "armor": "0",
        "energy": "0",
        "build_time": "42",
        "vespene": "75",
        "uid": "066"
    },
    "Medivac": {
        "build_from": "Starport",
        "race": "Terran",
        "health": "150",
        "mineral": "100",
        "supply": "2",
        "armor": "1",
        "energy": "200",
        "build_time": "42",
        "vespene": "100",
        "uid": "067"
    },
    "Raven": {
        "build_from": "Starport",
        "race": "Terran",
        "health": "140",
        "mineral": "100",
        "supply": "2",
        "armor": "1",
        "energy": "200",
        "build_time": "60",
        "prerequisite": "Tech Lab",
        "vespene": "200",
        "uid": "068"
    },
    "Banshee": {
        "build_from": "Starport",
        "race": "Terran",
        "health": "140",
        "mineral": "150",
        "supply": "3",
        "armor": "0",
        "energy": "200",
        "build_time": "60",
        "prerequisite": "Tech Lab",
        "vespene": "100",
        "uid": "069"
    },
    "Battlecruiser": {
        "build_from": "Starport",
        "race": "Terran",
        "health": "550",
        "mineral": "400",
        "supply": "6",
        "armor": "3",
        "energy": "200",
        "build_time": "90",
        "prerequisite": ["Fusion Core", "Tech Lab"],
        "vespene": "300",
        "uid": 70
    }
};


//
// Represents all Terran structues
//
Terran.prototype.structures = {
    "Command Center": {
        "mineral": "400",
        "vespene": "0",
        "build_time": "100",
        "prerequisite": "",
        "supplier": true,
        "supply": "11",
        "uid": "071"
    },
    "Supply Depot": {
        "mineral": "100",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "",
        "supplier": true,
        "supply": "8",
        "uid": "072"
    },
    "Refinery": {
        "mineral": "75",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "",
        "uid": "073"
    },
    "Barracks": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "60",
        "prerequisite": "",
        "uid": "074"
    },
    "Engineering Bay": {
        "mineral": "125",
        "vespene": "0",
        "build_time": "35",
        "prerequisite": "",
        "uid": "077"
    },
    "Bunker": {
        "mineral": "100",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "Barracks",
        "uid": "078"
    },
    "Missile Turret": {
        "mineral": "100",
        "vespene": "0",
        "build_time": "25",
        "prerequisite": "Engineering Bay",
        "uid": "079"
    },
    "Sensor Tower": {
        "mineral": "125",
        "vespene": "100",
        "build_time": "25",
        "prerequisite": "Engineering Bay",
        "uid": "080"
    },
    "Factory": {
        "mineral": "150",
        "vespene": "100",
        "build_time": "60",
        "prerequisite": "Barracks",
        "uid": "081"
    },
    "Ghost Academy": {
        "mineral": "150",
        "vespene": "50",
        "build_time": "40",
        "prerequisite": "Barracks",
        "uid": "082"
    },
    "Armory": {
        "mineral": "150",
        "vespene": "100",
        "build_time": "65",
        "prerequisite": "Factory",
        "uid": "083"
    },
    "Starport": {
        "mineral": "150",
        "vespene": "100",
        "build_time": "50",
        "prerequisite": "Factory",
        "uid": "084"
    },
    "Fusion Core": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "65",
        "prerequisite": "Starport",
        "uid": "085"
    },
    "Tech Lab": {
        "mineral": "50",
        "vespene": "25",
        "build_time": "25",
        "prerequisite": "Barracks", // TODO: Account for any one
        "uid": "086"
    },
    "Reactor": {
        "mineral": "50",
        "vespene": "50",
        "build_time": "50",
        "prerequisite": "Barracks",
        "uid": "087"
    }
};


//
// Represents all Terran upgrades
//
Terran.prototype.upgrades = {
    "Orbital Command": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "35",
        "prerequisite": "Barracks",
        "uid": "075"
    },
    "Planetary Fortress": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "50",
        "prerequisite": "Engineering Bay",
        "uid": "076"
    },
    "Infantry Weapons Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "160",
        "prerequisite": "Engineering Bay",
        "uid": "088"
    },
    "Infantry Weapons Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "190",
        "prerequisite": ["Infantry Weapons Level 1", "Armory"],
        "uid": "089"
    },
    "Infantry Weapons Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "220",
        "prerequisite": "Infantry Weapons Level 2",
        "uid": "090"
    },
    "Infantry Armor Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "160",
        "prerequisite": "Engineering Bay",
        "uid": "091"
    },
    "Infantry Armor Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "190",
        "prerequisite": ["Infantry Armor Level 1", "Armory"],
        "uid": "092"
    },
    "Infantry Armor Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "220",
        "prerequisite": "Infantry Armor Level 2",
        "uid": "093"
    },
    "Building Armor": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "140",
        "prerequisite": "Engineering Bay",
        "uid": "094"
    },
    "Hi-Sec Auto Tracking": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": "Engineering Bay",
        "uid": "095"
    },
    "Neosteel Frames": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": "Engineering Bay",
        "uid": "096"
    },
    "Moebius Reactor": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": "Ghost Academy",
        "uid": "097"
    },
    "Personal Cloaking": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "120",
        "prerequisite": "Ghost Academy",
        "uid": "098"
    },
    "Arm Silo with Nuke": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "60",
        "prerequisite": ["Ghost Academy", "Armory"],
        "uid": "099"
    },
    "Vehicle Weapons Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "160",
        "prerequisite": "Armory",
        "uid": "100"
    },
    "Vehicle Weapons Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "190",
        "prerequisite": "Vehicle Weapons Level 1",
        "uid": "101"
    },
    "Vehicle Weapons Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "220",
        "prerequisite": "Vehicle Weapons Level 3",
        "uid": "102"
    },
    "Vehicle Plating Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "160",
        "prerequisite": "Armory",
        "uid": "103"
    },
    "Vehicle Plating Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "190",
        "prerequisite": "Vehicle Plating Level 1",
        "uid": "104"
    },
    "Vehicle Plating Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "220",
        "prerequisite": "Vehicle Plating Level 2",
        "uid": "105"
    },
    "Ship Weapons Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "160",
        "prerequisite": "Armory",
        "uid": "106"
    },
    "Ship Weapons Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "190",
        "prerequisite": "Ship Weapons Level 1",
        "uid": "107"
    },
    "Ship Weapons Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "220",
        "prerequisite": "Ship Weapons Level 2",
        "uid": "108"
    },
    "Ship Plating Level 1": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "160",
        "prerequisite": "Armory",
        "uid": "109"
    },
    "Ship Plating Level 2": {
        "mineral": "225",
        "vespene": "225",
        "build_time": "190",
        "prerequisite": "Ship Plating Level 1",
        "uid": "110"
    },
    "Ship Plating Level 3": {
        "mineral": "300",
        "vespene": "300",
        "build_time": "220",
        "prerequisite": "Ship Plating Level 2",
        "uid": "111"
    },
    "Behemoth Reactor": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "80",
        "prerequisite": "Fusion Core",
        "uid": "112"
    },
    "Weapon Refit": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "60",
        "prerequisite": "Fusion Core",
        "uid": "113"
    },
    "Stimpack": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": ["Barracks", "Tech Lab"],
        "uid": "114"
    },
    "Combat Shield": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": ["Barracks", "Tech Lab"],
        "uid": "115"
    },
    "Infernal Pre-Igniter": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": ["Factory", "Tech Lab"],
        "uid": "116"
    },
    "Siege Tech": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": ["Factory", "Tech Lab"],
        "uid": "117"
    },
    "Corvid Reactor": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": ["Starport", "Tech Lab"],
        "uid": "118"
    },
    "Caduceus Reactor": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": ["Starport", "Tech Lab"],
        "uid": "119"
    },
    "Seeker Missile": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": ["Starport", "Tech Lab", "Fusion Core"],
        "uid": "120"
    },
    "Durable Materials": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": ["Starport", "Tech Lab"],
        "uid": "121"
    },
    "Cloaking Field": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "110",
        "prerequisite": ["Starport", "Tech Lab", "Fusion Core"],
        "uid": "122"
    },
    "Nitro Packs": {
        "mineral": "50",
        "vespene": "50",
        "build_time": "100",
        "prerequisite": ["Barracks", "Tech Lab"],
        "uid": "123"
    },
    "Concussive Shells": {
        "mineral": "50",
        "vespene": "50",
        "build_time": "60",
        "prerequisite": ["Barracks", "Tech Lab"],
        "uid": "124"
    },
    "250mm Strike Cannons": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": ["Factory", "Tech Lab"],
        "uid": "125"
    }
};


//
// Zerg specific build order.
//
var Zerg = function () {};


//
// Inherits from BuildOrder
//
Zerg.prototype = new BuildOrder("Zerg");

Zerg.prototype.default_build_order = [
    'Hatchery',
    "Overlord",
    'Drone',
    'Drone',
    'Drone',
    'Drone',
    'Drone',
    "Drone"
];


//
// Represents all Zerg units
//
Zerg.prototype.units = {
    "Larva": {
        "build_from": "",
        "race": "Zerg",
        "health": "25",
        "mineral": "-",
        "supply": "0",
        "armor": "10",
        "energy": "0",
        "build_time": "-",
        "vespene": "0",
        "uid": "126"
    },
    "Drone": {
        "build_from": "Hatchery",
        "race": "Zerg",
        "health": "40",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "0",
        "build_time": "17",
        "vespene": "0",
        "uid": "127"
    },
    "Overlord": {
        "build_from": "Hatchery",
        "race": "Zerg",
        "health": "200",
        "mineral": "100",
        "supplier": true,
        "supply": "8",
        "armor": "0",
        "energy": "0",
        "build_time": "25",
        "vespene": "0",
        "uid": "128"
    },
    "Zergling": {
        "build_from": "Spawning Pool",
        "race": "Zerg",
        "health": "35",
        "mineral": "50",
        "supply": "1",
        "armor": "0",
        "energy": "0",
        "build_time": "24",
        "vespene": "0",
        "uid": "129"
    },
    "Queen": {
        "build_from": "Spawning Pool",
        "race": "Zerg",
        "health": "175",
        "mineral": "150",
        "supply": "2",
        "armor": "1",
        "energy": "200",
        "build_time": "50",
        "vespene": "0",
        "uid": "130"
    },
    "Hydralisk": {
        "build_from": "Hydralisk Den",
        "race": "Zerg",
        "health": "80",
        "mineral": "100",
        "supply": "2",
        "armor": "0",
        "energy": "0",
        "build_time": "33",
        "vespene": "50",
        "uid": "131"
    },
    "Baneling": {
        "build_from": "Zergling",
        "race": "Zerg",
        "health": "30",
        "mineral": "25",
        "supply": "0",
        "armor": "0",
        "energy": "0",
        "build_time": "20",
        "prerequisite": "Baneling Nest",
        "vespene": "25",
        "uid": "132"
    },
    "Overseer": {
        "build_from": "Overlord",
        "race": "Zerg",
        "health": "200",
        "mineral": "50",
        "supply": "0",
        "armor": "1",
        "energy": "200",
        "build_time": "17",
        "prerequisite": "Lair",
        "vespene": "100",
        "uid": "133"
    },
    "Roach": {
        "build_from": "Roach Warren",
        "race": "Zerg",
        "health": "145",
        "mineral": "75",
        "supply": "2",
        "armor": "1",
        "energy": "0",
        "build_time": "27",
        "vespene": "25",
        "uid": "134"
    },
    "Infestor": {
        "build_from": "Infestation Pit",
        "race": "Zerg",
        "health": "90",
        "mineral": "100",
        "supply": "2",
        "armor": "0",
        "energy": "200",
        "build_time": "50",
        "vespene": "150",
        "uid": "135"
    },
    "Mutalisk": {
        "build_from": "Spire",
        "race": "Zerg",
        "health": "120",
        "mineral": "100",
        "supply": "2",
        "armor": "0",
        "energy": "0",
        "build_time": "33",
        "vespene": "100",
        "uid": "136"
    },
    "Corruptor": {
        "build_from": "Spire",
        "race": "Zerg",
        "health": "200",
        "mineral": "150",
        "supply": "2",
        "armor": "2",
        "energy": "200",
        "build_time": "40",
        "vespene": "100",
        "uid": "137"
    },
    "Nydus Worm": {
        "build_from": "Nydus Network",
        "race": "Zerg",
        "health": "200",
        "mineral": "100",
        "supply": "0",
        "armor": "1",
        "energy": "0",
        "build_time": "20",
        "vespene": "100",
        "uid": "138"
    },
    "Ultralisk": {
        "build_from": "Ultralisk Cavern",
        "race": "Zerg",
        "health": "500",
        "mineral": "300",
        "supply": "6",
        "armor": "1",
        "energy": "0",
        "build_time": "70",
        "vespene": "200",
        "uid": "139"
    },
    "Brood Lord": {
        "build_from": "Corruptor",
        "race": "Zerg",
        "health": "225",
        "mineral": "150",
        "supply": "4",
        "armor": "1",
        "energy": "0",
        "build_time": "34",
        "prerequisite": "Greater Spire",
        "vespene": "150",
        "uid": "140"
    }
};


//
// Represents all Zerg structures
//
Zerg.prototype.structures = {
    "Hatchery": {
        "mineral": "300",
        "vespene": "0",
        "build_time": "100",
        "prerequisite": "",
        "supplier": true,
        "supply": "2",
        "uid": "141"
    },
    "Extractor": {
        "mineral": "25",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "",
        "uid": "142",
        "supply": "-1"
    },
    "Spawning Pool": {
        "mineral": "200",
        "vespene": "0",
        "build_time": "65",
        "prerequisite": "",
        "uid": "143",
        "supply": "-1"
    },
    "Evolution Chamber": {
        "mineral": "75",
        "vespene": "0",
        "build_time": "35",
        "prerequisite": "",
        "uid": "144",
        "supply": "-1"
    },
    "Spine Crawler": {
        "mineral": "100",
        "vespene": "0",
        "build_time": "50",
        "prerequisite": "Spawning Pool",
        "uid": "145",
        "supply": "-1"
    },
    "Spore Crawler": {
        "mineral": "75",
        "vespene": "0",
        "build_time": "30",
        "prerequisite": "Evolution Chamber",
        "uid": "146",
        "supply": "-1"
    },
    "Hydralisk Den": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "40",
        "prerequisite": "Lair",
        "uid": "147"
    },
    "Baneling Nest": {
        "mineral": "100",
        "vespene": "50",
        "build_time": "60",
        "prerequisite": "Spawning Pool",
        "uid": "148"
    },
    "Roach Warren": {
        "mineral": "150",
        "vespene": "0",
        "build_time": "55",
        "prerequisite": "Spawning Pool",
        "uid": "150"
    },
    "Infestation Pit": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "50",
        "prerequisite": "Lair",
        "uid": "151"
    },
    "Spire": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "100",
        "prerequisite": "Lair",
        "uid": "152"
    },
    "Nydus Network": {
        "mineral": "150",
        "vespene": "200",
        "build_time": "50",
        "prerequisite": "Lair",
        "uid": "153"
    },
    "Ultralisk Cavern": {
        "mineral": "150",
        "vespene": "200",
        "build_time": "65",
        "prerequisite": "Hive",
        "uid": "155"
    },
    "Creep Tumor": {
        "mineral": "0",
        "vespene": "0",
        "build_time": "15",
        "prerequisite": "Queen",
        "uid": "157"
    }
};


//
// Represents all Zerg upgrades
//
Zerg.prototype.upgrades = {
    "Lair": {
        "mineral": "150",
        "vespene": "100",
        "build_time": "80",
        "prerequisite": ["Hatchery", "Spawning Pool"],
        "uid": "149"
    },
    "Hive": {
        "mineral": "200",
        "vespene": "150",
        "build_time": "100",
        "prerequisite": "Infestation Pit",
        "uid": "154"
    },
    "Greater Spire": {
        "mineral": "100",
        "vespene": "150",
        "build_time": "100",
        "prerequisite": ["Spire", "Hive"],
        "uid": "156"
    },
    "Adrenal Glands": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "130",
        "prerequisite": ["Spawning Pool", "Hive"],
        "uid": "158"
    },
    "Metabolic Boost": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": "Spawning Pool",
        "uid": "159"
    },
    "Melee Attacks Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": "Evolution Chamber",
        "uid": "160"
    },
    "Melee Attacks Level 2": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "170",
        "prerequisite": ["Melee Attacks Level 1", "Lair"],
        "uid": "161"
    },
    "Melee Attacks Level 3": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "200",
        "prerequisite": ["Melee Attacks Level 2", "Hive"],
        "uid": "162"
    },
    "Ground Carapace Level 1": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "140",
        "prerequisite": "Evolution Chamber",
        "uid": "163"
    },
    "Ground Carapace Level 2": {
        "mineral": "225",
        "vespene": "225",
        "build_time": "170",
        "prerequisite": ["Ground Carapace Level 1", "Lair"],
        "uid": "164"
    },
    "Ground Carapace Level 3": {
        "mineral": "300",
        "vespene": "300",
        "build_time": "200",
        "prerequisite": ["Ground Carapace Level 2", "Hive"],
        "uid": "165"
    },
    "Missile Attacks Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": "Evolution Chamber",
        "uid": "166"
    },
    "Missile Attacks Level 2": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "170",
        "prerequisite": ["Missile Attacks Level 1", "Lair"],
        "uid": "167"
    },
    "Missile Attacks Level 3": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "200",
        "prerequisite": ["Missile Attacks Level 2", "Hive"],
        "uid": "168"
    },
    "Grooved Spines": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "80",
        "prerequisite": "Hydralisk Den",
        "uid": "169"
    },
    "Centrifugal Hooks": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Baneling Nest",
        "uid": "170"
    },
    "Pneumatized Carapace": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "60",
        "prerequisite": "Lair",
        "uid": "171"
    },
    "Ventral Sacs": {
        "mineral": "200",
        "vespene": "200",
        "build_time": "130",
        "prerequisite": "Lair",
        "uid": "172"
    },
    "Gilal Reconstitution": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "110",
        "prerequisite": "Roach Warren",
        "uid": "173"
    },
    "Tunneling Claws": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Roach Warren",
        "uid": "174"
    },
    "Pathogen Glands": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "80",
        "prerequisite": "Infestation Pit",
        "uid": "175"
    },
    "Neural Parasite": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Infestation Pit",
        "uid": "176"
    },
    "Flyer Attack Level 1": {
        "mineral": "100",
        "vespene": "100",
        "build_time": "140",
        "prerequisite": "Spire",
        "uid": "177"
    },
    "Flyer Attack Level 2": {
        "mineral": "175",
        "vespene": "175",
        "build_time": "170",
        "prerequisite": ["Flyer Attack Level 1", "Lair"],
        "uid": "178"
    },
    "Flyer Attack Level 3": {
        "mineral": "250",
        "vespene": "250",
        "build_time": "200",
        "prerequisite": ["Flyer Attack Level 2", "Hive"],
        "uid": "179"
    },
    "Flyer Carapace Level 1": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "140",
        "prerequisite": "Spire",
        "uid": "180"
    },
    "Flyer Carapace Level 2": {
        "mineral": "225",
        "vespene": "225",
        "build_time": "170",
        "prerequisite": ["Flyer Carapace Level 1", "Lair"],
        "uid": "181"
    },
    "Flyer Carapace Level 3": {
        "mineral": "300",
        "vespene": "300",
        "build_time": "200",
        "prerequisite": ["Flyer Carapace Level 2", "Hive"],
        "uid": "182"
    },
    "Chitinous Plating": {
        "mineral": "150",
        "vespene": "150",
        "build_time": "110",
        "prerequisite": "Ultralisk Cavern",
        "uid": "183"
    }
};