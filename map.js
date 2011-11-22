// --------------------------------------------------------------------
// Set up constants & helper functions
// --------------------------------------------------------------------

var N = 1, S = 2, E = 4, W = 8, U = 16, D = 32,
    DIRECTIONS = { N: 1, S:  2, E:  4, W: 8, U: 16, D: 32 },
    DX         = { E: 1, W: -1, N:  0, S: 0 },
    DY         = { E: 0, W:  0, N: -1, S: 1 },
    OPPOSITE   = { E: W, W:  E, N:  S, S: N }

// do a little prototype sugaring
/*
Array.prototype.shuffle = function() {
    for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};

String.prototype.repeat = function(num) {
    return new Array(isNaN(num)? 1 : ++num).join(this);
}
*/

function shuffle(array)
{ // from http://stackoverflow.com/questions/5150665/generate-random-list-of-unique-rows-columns-javascript
    for(var j, x, i = array.length; i; j = parseInt(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x);
    return array;
};

function repeat(str, num) {
    return new Array(isNaN(num)? 1 : ++num).join(str);
}

// --------------------------------------------------------------------
// Here's the recursive-backtracking algorithm,
//   ported from Jamis Buck's Ruby implementation:
//   http://weblog.jamisbuck.org/2011/2/7/maze-generation-algorithm-recap
// --------------------------------------------------------------------

function carve_passages_from(cx, cy, grid) {
    //dir_keys = "NSEW".split('').shuffle();
    dir_keys = shuffle("NSEW".split(''));

    for (var d=0; d<dir_keys.length; d++) {
        var dir = dir_keys[d];
        var nx = cx + DX[dir];
        var ny = cy + DY[dir];

        if ((ny >= 0 && ny <= grid.length-1) && (nx >= 0 && nx <= grid[ny].length-1) && (grid[ny][nx].d == 0)) {
            grid[cy][cx].d |= DIRECTIONS[dir];
            grid[ny][nx].d |= OPPOSITE[dir];

            carve_passages_from(nx, ny, grid)
        }
    }
}

// --------------------------------------------------------------------
// A simple routine to emit the maze as ASCII (for debugging mainly)
// --------------------------------------------------------------------

function dumpMap(g) {
    var height = g.length,
        width = g[0].length,
        line = null,
        output = " " + repeat("_", width * 2 - 1);

    for (var y=0; y<height; y++) {
        line = "\n|";
        for (var x=0; x<width; x++) {
            line += ((g[y][x].d & S) != 0) ? " " : "_";
            if ((g[y][x].d & E) != 0) {
                line += (((g[y][x].d | g[y][x+1].d) & S) != 0) ? " " : "_";
            } else {
                line += "|";
            }
        }
        output += line;
    }

    return output;
}


// --------------------------------------------------------------------
// Public functions for handling mazes
// --------------------------------------------------------------------
function getExits(roomDef) {
    return exits = {
        'N': (roomDef.d & N),
        'S': (roomDef.d & S),
        'E': (roomDef.d & E),
        'W': (roomDef.d & W),
        'U': (roomDef.d & U),
        'D': (roomDef.d & D)
    };
}

function initMatrix(w,h, defaultVal) {
    var grid = [];
    for (var x=0; x<w; x++) {
        grid[x] = [];
        for (var y=0; y<h; y++) {
            grid[x][y] = dojo.clone(defaultVal);
        }
    }

    return grid;
}

function getNewMap(width, height) {
    width  = width  || 8;
    height = height || 8;

    var grid = initMatrix(width, height, {d:0,visited:false,roomStyle:0});
    carve_passages_from(0, 0, grid);
    return grid;
}


//----------------------------
// Here's the Map class itself

var Map = function(){
    var mapCtx = null,
        floorCtx = null,
        spriteCtx = null,
        scale = 2,
        _level = 0,
        _target = null,
        mapdata = [],
        currentRoom  = {x:-1,y:-1},
        exitRoom     = {x:-1,y:-1},
        stairRoom    = {x:-1,y:-1},
        treasureRoom = {x:-1,y:-1},
        _inventory   = {},

        doorPositions = {
            'N':{x:104,y:  4},
            'S':{x:104,y:136},
            'E':{x:216,y: 64},
            'W':{x:  4,y: 64}
        },
        treasures = {
            'book':     "Book of Magic",
            'wand':     "Wand of Uizurobu",
            'ring1':    "Ring of Errol"
        },
        itemSprites = {
            'compass':  {x:136,y:40,w:16,h:16},
            'map':      {x:136,y:56,w: 8,h:16},
            'book':     {x:104,y: 8,w: 8,h:16},
            'wand':     {x:104,y:56,w: 8,h:16},
            'ring1':    {x: 80,y:24,w: 8,h:16}
        },
        tileSprites = {
            'face_r':   {x: 0,y:32,w:16,h:16},
            'face_l':   {x:16,y:32,w:16,h:16},
            'stairs_d': {x: 0,y:48,w:16,h:16},
            'stairs_u': {x:16,y:48,w:16,h:16},
            'block':    {x: 0,y:64,w:16,h:16},
            'sand':     {x:40,y:56,w:16,h:16},
            'rug':      {x:40,y:40,w:16,h:16},
            'water':    {x:56,y:40,w:16,h:16},
            'dark':     {x:56,y:56,w:16,h:16},
            'openDoor':{
                'N':{x:40,y: 0,w:32,h:20},
                'S':{x:40,y:20,w:32,h:20},
                'E':{x:20,y: 0,w:20,h:32},
                'W':{x: 0,y: 0,w:20,h:32}
            },
            'lockedDoor':{
                'N':{x: 72,y:32,w:32,h:20},
                'S':{x: 72,y:52,w:32,h:20},
                'E':{x:124,y:40,w:20,h:32},
                'W':{x:104,y:40,w:20,h:32}
            },
            'closedDoor':{
                'N':{x:112,y: 0,w:32,h:20},
                'S':{x:112,y:20,w:32,h:20},
                'E':{x: 92,y: 0,w:20,h:32},
                'W':{x: 72,y: 0,w:20,h:32}
            }
        },
        __roomLayouts = {
            'entrance': {
                'face_r': [
                    {x:1,y:1},{x:1,y:3},{x:1,y:5},
                    {x:4,y:1},{x:4,y:3},{x:4,y:5}
                ],
                'face_l': [
                    {x: 7,y:1},{x: 7,y:3},{x: 7,y:5},
                    {x:10,y:1},{x:10,y:3},{x:10,y:5}
                ],
                'rug': [
                    {x:3,y:5}, {x:3,y:6}, {x:4,y:6},
                    {x:5,y:4}, {x:5,y:5}, {x:5,y:6},
                    {x:6,y:4}, {x:6,y:5}, {x:6,y:6},
                    {x:7,y:6}, {x:8,y:5}, {x:8,y:6}
                ]
            },
            'treasure': {
                'stairs_d': [{ x: 6, y: 3 }],
                'block': [
                    {x: 4,y: 3}, {x: 5,y: 2}, {x: 6,y: 1}, {x: 7,y: 2},
                    {x: 8,y: 3}, {x: 7,y: 4}, {x: 6,y: 5}, {x: 5,y: 4}
                ]
            },
            'stairs': {
                'stairs_d': [{ x: 11, y: 0 }]
            },
            'exit': {
                'stairs_u': [{ x: 11, y: 0 }]
            }
        };

    function _getCurrentExits() {
        return getExits(mapdata[_level][currentRoom.y][currentRoom.x]);
    }

    function _move(dx,dy) {
        if (dx || dy) {
            // redraw current room on map (clearing player dot in the process)
            _drawRoomOnMap(currentRoom.x, currentRoom.y);

            currentRoom.x += dx;
            currentRoom.y += dy;
            mapdata[_level][currentRoom.y][currentRoom.x].visited = true;

            // draw new room on map
            _drawRoomOnMap(currentRoom.x, currentRoom.y);
        }
    }

    function _drawPassage(cx, cy, dx, dy) {
        var gapWidth = scale,
            gapHeight = 2 * scale,
            x = ((cx * 8) + (dx * 4) + 35) * scale,
            y = ((cy * 8) + (dy * 4) + 11) * scale;
        if (dx) {
            // E-W door
            if (dx < 0) { x += scale; }
            mapCtx.fillRect(x, y, gapWidth, gapHeight);
        } else {
            // N-S door
            if (dy < 0) { y += scale; }
            mapCtx.fillRect(x, y, gapHeight, gapWidth);
        }
    }

    function _drawRoomOnMap(room_x, room_y) {
        if (mapCtx && room_x > -1) {
            // draw location on map scroll
            var x = ((room_x*8) + 33) * scale,
                y = ((room_y*8) + 9) * scale,
                roomSize = 6 * scale;

            if (mapdata[_level][room_y][room_x].visited) {
                mapCtx.fillStyle = "rgb(0,0,0)";
            } else {
                mapCtx.fillStyle = "rgb(32,32,64)";
            }

            // draw the room
            mapCtx.fillRect(x,y,roomSize,roomSize);

            // draw passageways & stairs out of this room
            var doors = getExits(mapdata[_level][room_y][room_x]);
            if (doors.N) { _drawPassage(room_x, room_y, 0, -1); }
            if (doors.S) { _drawPassage(room_x, room_y, 0,  1); }
            if (doors.E) { _drawPassage(room_x, room_y,  1, 0); }
            if (doors.W) { _drawPassage(room_x, room_y, -1, 0); }
        }
    }

    function _revealMap() {
        var showAll = _inventory.map[_level];
        for (var x=0; x<8; x++) {
            for (var y=0; y<8; y++) {
                if (showAll || mapdata[_level][y][x].visited) { _drawRoomOnMap(x,y); }
            }
        }
    }

    function _setMapIndicatorColor() {
        if (mapCtx) {
            mapCtx.fillStyle = "rgb(128,224,0)";   // default (green) dot color
            //mapCtx.fillStyle = "rgb(184,184,248)"; // blue location dot
            //mapCtx.fillStyle = "rgb(248,56,0)";    // red location dot
        }
    }

    function _drawEntrance(tileImg) {
        // draw rug
        _drawRoomTiles(tileImg, __roomLayouts.entrance);

        // draw blocked door (or open it, if you've got the treasure)
        var door = tileSprites.closedDoor.S,
            tgt = doorPositions.S;
        if (_inventory[_target]) {
            door = tileSprites.openDoor.S;
        }
        floorCtx.drawImage(tileImg, door.x,door.y, door.w,door.h, tgt.x*scale,tgt.y*scale, door.w*scale,door.h*scale);
    }

    function _positionTile(t) {
        var dx = 24, dy = 24;
        if (t.w) {
            dx = (8 - t.w/2) + 24;
        }
        if (t.h) {
            dy = (8 - t.h/2) + 24;
        }
        return {
            x: (t.x*16) + dx,
            y: (t.y*16) + dy
        }
    }

    function _drawRoomTiles(tileImg, roomInfo) {
        var tileType = null,
            tileSquares = [],
            tileInfo = null,
            i = 0;
        for (tileType in roomInfo) {
            if (tileType in tileSprites) {
                tileSquares = roomInfo[tileType];
                tileInfo = tileSprites[tileType];
                for (i=0; i<tileSquares.length; i++) {
                    sq = _positionTile(tileSquares[i]);
                    floorCtx.drawImage(tileImg, tileInfo.x,tileInfo.y, tileInfo.w,tileInfo.h, sq.x*scale,sq.y*scale, tileInfo.w*scale,tileInfo.h*scale);
                }
            } else {
                console.error('Unknown tile type: {', tileType, '} in _drawRoomTiles');
            }
        }
    }

    function _placeRoomContents() {
        // for now, just randomly pick an x,y for the stairs;
        // in the future, use maze traversal to make it as far as possible from the starting point

        _addItem(_getRandomRoom(), 'compass');
        _addItem(_getRandomRoom(), 'map');

        if (_level == 2) {
            treasureRoom = _getRandomRoom();
            _addItem(treasureRoom, _target);
        } else {
            // place downward stairs
            stairRoom = _getRandomRoom();
            mapdata[_level][stairRoom.y][stairRoom.x].d |= D;
        }
    }

    function _getRandomRoom() {
        return {
            x:Math.floor(Math.random()*8),
            y:Math.floor(Math.random()*8)
        };
    }

    function _addItem(pos, item) {
        var room = mapdata[_level][pos.x][pos.y];
        if (room.items) {
            room.items.push(item);
        } else {
            room.items = [item];
        }
    }

    function _drawRoomContents(room, map) {
        var c, sq, itm;

        spriteCtx.clearRect(0,0,480,320);
        if (room.items && room.items.length) {
            for (var i in room.items) {
                itm = room.items[i];
                c = itemSprites[itm];
                sq = _positionTile({x:6,y:3,w:c.w});

                spriteCtx.drawImage(map.itemsImg, c.x,c.y,  c.w,c.h, sq.x*scale,sq.y*scale, c.w*scale,c.h*scale);


                switch (itm) {
                    case 'map':
                        map.message("You found the map!");
                        _inventory.map[_level] = true;
                        _revealMap();
                        break;
                    case 'compass':
                        _inventory.compass[_level] = true;
                        map.message("You found the compass!\nExits are now marked on your map.");
                        break;
                    default:
                        _inventory[itm] = true;
                        if (itm in treasures) {
                            map.message("You found the " + itm + "!\nTime to head back to the surface.");
                        } else {
                            map.message("You found a " + itm + ".");
                        }
                        break;
                } // end switch
            } // end for

            room.items = [];
            map.getItem(itm);

        } // end if
    }

    function _getMapDotPos(x,y) {
        return {
            x: ((x*8) + 35) * scale,
            y: ((y*8) + 10) * scale
        };
    }
    function _drawMapDots() {
        var pos, dotSize = 3 * scale;

        // stair positions (if you have the compass)
        if (_inventory.compass[_level]) {
            // white dot
            mapCtx.fillStyle = "rgb(248,248,248)";
            if (_level == 0) {
                pos = _getMapDotPos(3,7);
            } else {
                pos = _getMapDotPos(exitRoom.x,exitRoom.y);
            }
            mapCtx.fillRect(pos.x,pos.y,dotSize,dotSize);

            // red dot
            mapCtx.fillStyle = "rgb(248,56,0)";
            if (_level == 2) {
                pos = _getMapDotPos(treasureRoom.x,treasureRoom.y);
            } else {
                pos = _getMapDotPos(stairRoom.x,stairRoom.y);
            }
            mapCtx.fillRect(pos.x,pos.y,dotSize,dotSize);
        }

        // player position
        x = ((currentRoom.x*8) + 34) * scale,
        y = ((currentRoom.y*8) + 11) * scale;
        _setMapIndicatorColor();
        mapCtx.fillRect(x,y,dotSize,dotSize);

        // level indicator
        mapCtx.fillStyle = "rgb(0,0,0)";
        mapCtx.fillText('level '+(_level+1), 5*scale,10*scale)
    }

    function _newMap(level) {
        // dump inventory
        _inventory.compass = [];
        _inventory.map     = [];

        mapdata[level] = getNewMap(8,8);

        // pick random locations for stairs, map, compass, etc
        _placeRoomContents();
    }


// PUBLIC FUNCTION DEFINITIONS
    function init(args) {
        // required arguments: mapCanvasID, floorCanvasID, spriteCanvasID
        dojo.mixin(this, args);

        // init map canvas
        var map = dojo.byId(this.mapCanvasID);
        if (map && map.getContext){
            mapCtx = map.getContext('2d');
            mapCtx.mozImageSmoothingEnabled = false;
            mapCtx.font = "8pt 'SilkscreenNormal', Arial, sans-serif";
        }

        // init floor canvas
        var floor = dojo.byId(this.floorCanvasID);
        if (floor && floor.getContext){
            floorCtx = floor.getContext('2d');
            floorCtx.mozImageSmoothingEnabled = false;
        }

        // init tile canvas
        var tiles = dojo.byId(this.spriteCanvasID);
        if (tiles && tiles.getContext){
            spriteCtx = tiles.getContext('2d');
            spriteCtx.mozImageSmoothingEnabled = false;
        }

        this.refreshTiles();

        //console.log('Map is initialized and ready');
    }

    function debugData() {
        return mapdata[_level];
    }

    function generate() {
        // reset level & inventory, and pick a new treasure goal
        _level = 0;
        _inventory = {};
        _target = 'wand';

        // generate level 0 map
        _newMap(_level);

        this.refreshTiles();
        this.goto(3,7);

        // emit welcome message
        msg = "You have entered the underworld.\n";
        msg += "Your prize: the "+treasures[_target]+" on level 3.\n";
        msg += "Retrieve it and return successfully, and you will have the gratitude of the kingdom.\nGood luck!";
        this.message(msg);
    }

    function cheat() {
        _inventory.compass[_level] = true;
        _inventory.map[_level] = true;
        _revealMap();
        _drawMapDots();
        this.message("Cheaters never prosper!");
    }

    function dump() {
        return dumpMap(mapdata[_level]);
    }

    function refreshTiles() {
        if (mapCtx) {
            mapCtx.drawImage(this.mapImg, 0,0, 128,80, 0,0, 256,160);
        }

        if (floorCtx) {
            floorCtx.drawImage(this.floorImg, 0,0, 240,160, 0,0, 480,320);
        }
    }

    function drawCurrentRoom() {
        var sx,sy,dx,dy,w,h,
            roomExits = _getCurrentExits(),
            cx = currentRoom.x,
            cy = currentRoom.y;

        if (roomExits) {
            // draw room floor
            floorCtx.drawImage(this.floorImg, 0,0, 240,160, 0,0, 240*scale,160*scale);

            // draw doors
            dojo.forEach("NSEW", function(d) {
                if ((roomExits[d]) && tileSprites.openDoor[d]) {
                    door = tileSprites.openDoor[d];
                    pos = doorPositions[d];
                    floorCtx.drawImage(this.tileImg, door.x,door.y, door.w,door.h, pos.x*scale,pos.y*scale, door.w*scale,door.h*scale);
                }
            }, this);

            // draw stairs
            if (roomExits.U) {
                _drawRoomTiles(this.tileImg, __roomLayouts.exit);
                this.message("Press < to climb the stairs.");
            } else if (roomExits.D) {
                _drawRoomTiles(this.tileImg, __roomLayouts.stairs);
                this.message("Press > to go down the stairs.");
            }


            // draw other room features
            // (e.g. entrance hall, etc)
            if (_level == 0 && cx == 3 && cy == 7) {
                _drawEntrance(this.tileImg);
                if (_inventory[_target]) {
                    this.message("You made it out with the treasure!\nWell done!");
                    this.gameover();
                }
            }

            _drawRoomContents(mapdata[_level][cx][cy], this);

            // draw location on map scroll
            _drawMapDots();
        }
    }

    function goto(x, y) {
        _move(x-currentRoom.x,y-currentRoom.y);
        this.drawRoom();
    }

    function goNorth() {
        var roomData = _getCurrentExits();

        if (roomData.N && (currentRoom.y > 0)) {
            _move(0,-1);
            this.drawRoom();
        }
    }

    function goSouth() {
        var roomData = _getCurrentExits();

        if (roomData.S && (currentRoom.y < 7)) {
            _move(0,1);
            this.drawRoom();
        }
    }

    function goEast() {
        var roomData = _getCurrentExits();

        if (roomData.E && (currentRoom.x < 7)) {
            _move(1,0);
            this.drawRoom();
        }
    }

    function goWest() {
        var roomData = _getCurrentExits();

        if (roomData.W && (currentRoom.x > 0)) {
            _move(-1,0);
            this.drawRoom();
        }
    }

    function goUp() {
        var roomData = _getCurrentExits();
        if (roomData.U) {
            _level -= 1;
            this.refreshTiles();
            _revealMap();
            this.drawRoom();

            this.message('Returning to level '+(_level+1)+'.');

            return true;
        } else {
            return false;
        }
    }

    function goDown() {
        var roomData = _getCurrentExits();
        if (roomData.D) {
            _level += 1;

            if (!(mapdata[_level])) { _newMap(_level); }
            exitRoom = {x:currentRoom.x,y:currentRoom.y};
            var room = mapdata[_level][currentRoom.y][currentRoom.x];
            room.visited = true;
            room.d |= U;

            this.refreshTiles();
            _revealMap();
            this.drawRoom();

            this.message('Descending to level '+(_level+1)+'.');

            return true;
        } else {
            return false;
        }
    }


    // emittable events
    function message(msg) {};
    function getItem(itm) {};
    function gameover() {};


    // return the public functions to the caller
    return {
        level: _level,
        init: init,
        data: debugData,
        generate: generate,
        cheat: cheat,
        dump: dump,
        refreshTiles: refreshTiles,
        drawRoom: drawCurrentRoom,
        goto: goto,
        north: goNorth,
        south: goSouth,
        east: goEast,
        west: goWest,
        up: goUp,
        down: goDown,
        message: message,
        getItem: getItem,
        gameover: gameover,
    }
};

