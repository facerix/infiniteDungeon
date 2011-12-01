// --------------------------------------------------------------------
// Set up constants & helper functions
// --------------------------------------------------------------------

var N = 1, S = 2, E = 4, W = 8, U = 16, D = 32,
    DIRECTIONS = { N: 1, S:  2, E:  4, W: 8, U: 16, D: 32 },
    DX         = { E: 1, W: -1, N:  0, S: 0 },
    DY         = { E: 0, W:  0, N: -1, S: 1 },
    OPPOSITE   = { E: W, W:  E, N:  S, S: N }

// do a little prototype sugaring (commented out: interferes with Dojo)
/*
Array.prototype.shuffle = function() {
    for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};

String.prototype.repeat = function(num) {
    return new Array(isNaN(num)? 1 : ++num).join(this);
}
*/

function getkeys(obj) {
    var k, keylist = [];
    for (k in obj) {
        if (obj.hasOwnProperty(k)) {
            keylist.push(k);
        }
    }
    return keylist;
}

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

function getNewMap(width, height, sx, sy) {
    width  = width  || 8;
    height = height || 8;
    sx     = sx || 0;
    sy     = sy || 0;

    var grid = initMatrix(width, height, {d:0,visited:false,roomStyle:-1});
    carve_passages_from(0, 0, grid);
    return grid;
}


//----------------------------
// Here's the MapQuest class itself

var MapQuest = function(){
    var mapCtx = null,
        mainCtx = null,
        spriteCtx = null,
        scale = 2,
        screenWidth  = 240*scale,
        screenHeight = 160*scale,
        halfWidth    = 120*scale,
        halfHeight   =  80*scale,
        _level = 0,
        _targetLevel = 2,
        _target = null,
        mapdata = [],
        currentRoom  = {x:-1,y:-1},
        exitRoom     = [{x:3,y:7}],
        goalRoom     = [{x:-1,y:-1}],

        _inventory   = {},

        _state = 0,
        states = {
            'title'  : 0,
            'intro'  : 1,
            'play'   : 2,
            'win'    : 3
        }
        doorPositions = {
            'N':{x:104,y:  4},
            'S':{x:104,y:136},
            'E':{x:216,y: 64},
            'W':{x:  4,y: 64}
        },
        treasures = {
            'book': "Book of Magic",
            'wand': "Wand of Uizurobu",
            'ring': "Ring of Errol"
        },
        _itemSprites = {
            'compass':  {x:136,y:40,w:16,h:16},
            'map'    :  {x:136,y:56,w: 8,h:16},
            'book':     {x:104,y: 8,w: 8,h:16},
            'wand':     {x:104,y:56,w: 8,h:16},
            'ring':     {x: 80,y:24,w: 8,h:16}
        },
        _tileSprites = {
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
        _specialRooms = {
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
            }
        },
        _roomDefs = {'empty': {}};

    var _curtainPos = 0, curtainStep = 5*scale;
    function _closeCurtains() {
        if (_curtainPos <= halfWidth) {
            mainCtx.fillStyle = "rgb(0,0,0)";
            mainCtx.fillRect(_curtainPos, 0, curtainStep, screenHeight);
            mainCtx.fillRect(screenWidth-_curtainPos-curtainStep, 0, curtainStep, screenHeight);

            _curtainPos += curtainStep;
            setTimeout(_closeCurtains, 100);
        }
    }
    function _openCurtains() {
        _curtainPos = halfWidth;
        _openCurtains_recursive();
    }
    function _openCurtains_recursive() {
        if (_curtainPos >= 0) {
            spriteCtx.clearRect(_curtainPos, 0, curtainStep, screenHeight);
            spriteCtx.clearRect(screenWidth-_curtainPos-curtainStep, 0, curtainStep, screenHeight);

            _curtainPos -= curtainStep;
            setTimeout(_openCurtains_recursive, 100);
        } else {
            _setState(states.play);
        }
    }


    function _setState(st) {
        //console.log('_setState(',st,')');
        if (st in getkeys(states)) {
            _state = st;

            switch(st) {
                case states.title:
                    var titleImg = window.imageCache.getImage('title');
                    mainCtx.drawImage(titleImg, 0,0, 240,160, 0,0, screenWidth,screenHeight);

                    //mainCtx.fillStyle = "rgb(236, 155, 0)";
                    //mainCtx.font = "16pt 'SilkscreenNormal', Arial, sans-serif";
                    //mainCtx.fillText("Infinite Dungeon", 56*scale, 96*scale);
                    break;

                case states.intro:
                    _redrawCanvasBGs();

                    // animate the "curtains" opening on the sprite layer (uncovering the map floor)
                    spriteCtx.fillStyle = "rgb(0,0,0)";
                    spriteCtx.fillRect(0, 0, screenWidth, screenHeight);
                    _openCurtains();
                    break;

                case states.play:
                    game.gameStart();
                    break;

                case states.win:
                    var linkImg  = window.imageCache.getImage('link'),
                        itemsImg = window.imageCache.getImage('items');
                    game.message("You made it out with the treasure!\nWell done!");

                    // show Link holding up the treasure
                    var c = {x:128,y:16,w:16,h:16},
                        p = _positionTile({x:5.5,y:6,w:16});
                    spriteCtx.drawImage(linkImg, c.x,c.y,  c.w,c.h, p.x*scale,p.y*scale, c.w*scale,c.h*scale);

                    c = _itemSprites[_target];
                    sq = _positionTile({x:5.2,y:5,w:c.w});
                    spriteCtx.drawImage(itemsImg, c.x,c.y,  c.w,c.h, sq.x*scale,sq.y*scale, c.w*scale,c.h*scale);

                    // animate the "curtains" drawing closed behind the sprite
                    _closeCurtains();

                    break;
            }
        } else {
            console.log('state ', st, ' not in states');
        }
    }

    function _getCurrentExits() {
        return getExits(mapdata[_level][currentRoom.y][currentRoom.x]);
    }

    function _move(dx,dy) {
        if (dx || dy) {
            // redraw current room on map (clearing player dot in the process)
            _drawRoomOnMap(currentRoom.x, currentRoom.y);

            currentRoom.x += dx;
            currentRoom.y += dy;
            _visitRoom(currentRoom.x,currentRoom.y);
        }
    }

    function _visitRoom(x,y) {
        var room = mapdata[_level][currentRoom.y][currentRoom.x], roomTypes;

        // if floor hasn't been defined yet, do it now
        if (room.roomStyle == -1) {
            roomTypes = getkeys(_roomDefs);
            room.roomStyle = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        }

        // mark the room as visited (for the map)
        room.visited = true;

        // draw new room on map
        _drawRoomOnMap(currentRoom.x, currentRoom.y);

        // ... and draw it on the main screen
        _drawCurrentRoom();
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

    function _drawEntrance() {
        var tileImg = window.imageCache.getImage("tiles");

        // draw room layout
        _drawRoomTiles(tileImg, _specialRooms.entrance);

        // draw blocked door (or open it, if you've got the treasure)
        var door = _tileSprites.closedDoor.S,
            tgt = doorPositions.S;
        if (_inventory[_target]) {
            door = _tileSprites.openDoor.S;
        }
        mainCtx.drawImage(tileImg, door.x,door.y, door.w,door.h, tgt.x*scale,tgt.y*scale, door.w*scale,door.h*scale);
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
            if (tileType in _tileSprites) {
                tileSquares = roomInfo[tileType];
                tileInfo = _tileSprites[tileType];
                for (i=0; i<tileSquares.length; i++) {
                    sq = _positionTile(tileSquares[i]);
                    mainCtx.drawImage(tileImg, tileInfo.x,tileInfo.y, tileInfo.w,tileInfo.h, sq.x*scale,sq.y*scale, tileInfo.w*scale,tileInfo.h*scale);
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

        var p = _getRandomRoom();
        goalRoom[_level] = p;
        if (_level != _targetLevel) {
            // place downward stairs
            mapdata[_level][p.y][p.x].d |= D;
        } else {
            // add the treasure to the goal room (instead of more stairs)
            _addItem(p, _target);
        }
    }

    function _getRandomRoom() {
        var p = null;
        do {
            p = {
                x:Math.floor(Math.random()*8),
                y:Math.floor(Math.random()*8)
            }
        } while (mapdata[_level][p.y][p.x].item);
        return p;
    }

    function _addItem(pos, item) {
        mapdata[_level][pos.x][pos.y].item = item;
    }

    function _drawRoomContents(room) {
        var c, sq, itm, msg,
            itemsImg = window.imageCache.getImage("items");

        spriteCtx.clearRect(0,0,480,320);
        if (room.item) {
            itm = room.item;
            c = _itemSprites[itm];
            sq = _positionTile({x:6,y:3,w:c.w});

            spriteCtx.drawImage(itemsImg, c.x,c.y,  c.w,c.h, sq.x*scale,sq.y*scale, c.w*scale,c.h*scale);

            switch (itm) {
                case 'map':
                    game.message("You found the map!");
                    _inventory.map[_level] = true;
                    _revealMap();
                    break;
                case 'compass':
                    _inventory.compass[_level] = true;
                    msg = "You found the compass!\n";
                    if (_level == _targetLevel) {
                        msg += "The treasure is ";
                    } else {
                        msg += "Stairs are ";
                    }
                    game.message(msg + " now marked on your map.");
                    break;
                default:
                    _inventory[itm] = true;
                    if (itm in treasures) {
                        game.message("You found the " + itm + "!\nTime to head back to the surface.");
                    } else {
                        game.message("You found a " + itm + ".");
                    }
                    break;
            } // end switch

            room.item = null;
            game.getItem(itm);

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
            pos = _getMapDotPos(exitRoom[_level].x,exitRoom[_level].y);
            mapCtx.fillRect(pos.x,pos.y,dotSize,dotSize);

            // red dot
            mapCtx.fillStyle = "rgb(248,56,0)";
            pos = _getMapDotPos(goalRoom[_level].x,goalRoom[_level].y);
            mapCtx.fillRect(pos.x,pos.y,dotSize,dotSize);
        }

        // player position
        x = ((currentRoom.x*8) + 34) * scale,
        y = ((currentRoom.y*8) + 11) * scale;
        mapCtx.fillStyle = "rgb(128,224,0)";   // default (green) dot color
        mapCtx.fillRect(x,y,dotSize,dotSize);

        // level indicator
        mapCtx.fillStyle = "rgb(0,0,0)";
        mapCtx.fillText('level '+(_level+1), 5*scale,10*scale)
    }

    function _newMap(level) {
        // dump inventory
        _inventory.compass[level] = false;
        _inventory.map[level]     = false;

        if (level > 0) {
            mapdata[level] = getNewMap(8,8, currentRoom.x, currentRoom.y);
        } else {
            mapdata[level] = getNewMap(8,8);
        }

        // pick random locations for stairs, map, compass, etc
        _placeRoomContents();
    }

    function _ensureRoomExit() {
        carve_passages_from(currentRoom.x, currentRoom.y, mapdata[_level]);
    }

    function _drawCurrentRoom() {
        var spr, pos,
            roomExits = _getCurrentExits(),
            cx = currentRoom.x,
            cy = currentRoom.y,
            floorImg = window.imageCache.getImage("floor"),
            tileImg  = window.imageCache.getImage("tiles");

        if (roomExits) {
            // draw room floor
            mainCtx.drawImage(floorImg, 0,0, 240,160, 0,0, 240*scale,160*scale);

            // draw doors
            dojo.forEach("NSEW", function(d) {
                if ((roomExits[d]) && _tileSprites.openDoor[d]) {
                    spr = _tileSprites.openDoor[d];
                    pos = doorPositions[d];
                    mainCtx.drawImage(tileImg, spr.x,spr.y, spr.w,spr.h, pos.x*scale,pos.y*scale, spr.w*scale,spr.h*scale);
                }
            }, this);

            // draw other room features (e.g. entrance hall, etc)
            var room = mapdata[_level][cx][cy];
            if (_level == 0 && cx == 3 && cy == 7) {
                _drawEntrance();
                if (_inventory[_target]) {
                    _setState(states.win);
                    game.gameover();
                    return;
                }
            } else {
                // draw room layout
                var tileImg = window.imageCache.getImage("tiles");
                _drawRoomTiles(tileImg, _roomDefs[room.roomStyle]);
            }

            // draw room's sprites (items, etc)
            _drawRoomContents(room);

            // draw stairs
            if (roomExits.U) {
                spr = _tileSprites.stairs_u;
                pos = _positionTile({ x: 11, y: 0 });
                mainCtx.drawImage(tileImg, spr.x,spr.y, spr.w,spr.h, pos.x*scale,pos.y*scale, spr.w*scale,spr.h*scale);

                game.message("Press < to climb the stairs.");

            } else if (roomExits.D) {
                spr = _tileSprites.stairs_d;
                pos = _positionTile({ x: 11, y: 0 });
                mainCtx.drawImage(tileImg, spr.x,spr.y, spr.w,spr.h, pos.x*scale,pos.y*scale, spr.w*scale,spr.h*scale);

                game.message("Press > to go down the stairs.");
            }

            // draw location on map scroll
            _drawMapDots();
        }
    }


// PUBLIC FUNCTION DEFINITIONS
    function init(args) {
        // required arguments: mapCanvasID, floorCanvasID, spriteCanvasID
        dojo.mixin(this, args);

        // grab the room defs
        dojo.xhrGet( {
            url: "rooms.json",
            handleAs: "json",
            preventCache: false,
            load: function(response){
                _roomDefs = response;
            },
            error: function(response, ioArgs) {
                console.log("Error getting room data:", response, ioArgs);
            }
        });

        // get images from the cache
        this.titleImg = window.imageCache.getImage("title");
        this.floorImg = window.imageCache.getImage("floor");
        this.mapImg   = window.imageCache.getImage("map");
        this.tileImg  = window.imageCache.getImage("tiles");
        this.itemsImg = window.imageCache.getImage("items");
        this.linkImg  = window.imageCache.getImage("link");

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
            mainCtx = floor.getContext('2d');
            mainCtx.mozImageSmoothingEnabled = false;
        }

        // init tile canvas
        var tiles = dojo.byId(this.spriteCanvasID);
        if (tiles && tiles.getContext){
            spriteCtx = tiles.getContext('2d');
            spriteCtx.mozImageSmoothingEnabled = false;
        }

        // go to title screen and wait for input
        this.reset();
    }

    function debugData() {
        return mapdata[_level];
    }

    function dump() {
        return dumpMap(mapdata[_level]);
    }

    function _startGame() {
        // pick a new treasure goal
        var treasureList = getkeys(treasures),
            treasureIndex = Math.floor(Math.random() * treasureList.length);
        _target = treasureList[treasureIndex];

        // reset level & inventory
        _level = 0;
        _inventory = {compass:[],map:[]};

        _setState(states.intro);

        // generate level 0 map
        mapdata = [];
        _newMap(_level);
    }

    function gameStart() {
        _redrawCanvasBGs();
        this.goto(3,7);

        // emit welcome message
        var msg = "You have entered the underworld.\n";
            msg += "Your prize: the "+treasures[_target]+" on level " + (_targetLevel+1) + ".\n";
            msg += "Retrieve it and return successfully, and you will have the gratitude of the kingdom.\nGood luck!";
        this.message(msg);
    }

    function cheat() {
        if (_state != states.play) { return false; }

        _inventory.compass[_level] = true;
        _inventory.map[_level] = true;
        _revealMap();
        _drawMapDots();
        this.message("Cheaters never prosper!");
    }

    function _redrawCanvasBGs() {
        var mapImg   = window.imageCache.getImage('map'),
            floorImg = window.imageCache.getImage('floor');

        if (mapCtx) {
            mapCtx.drawImage(mapImg, 0,0, 128,80, 0,0, 256,160);
        }

        if (mainCtx) {
            mainCtx.drawImage(floorImg, 0,0, 240,160, 0,0, screenWidth,screenHeight);
        }
    }

    function goto(x, y) {
        if (_state != states.play) { return false; }

        _move(x-currentRoom.x,y-currentRoom.y);
        _visitRoom(currentRoom.x,currentRoom.y);
    }

    function goNorth() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();

        if (roomData.N && (currentRoom.y > 0)) {
            _move(0,-1);
        }
    }

    function goSouth() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();

        if (roomData.S && (currentRoom.y < 7)) {
            _move(0,1);
        }
    }

    function goEast() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();

        if (roomData.E && (currentRoom.x < 7)) {
            _move(1,0);
        }
    }

    function goWest() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();

        if (roomData.W && (currentRoom.x > 0)) {
            _move(-1,0);
        }
    }

    function goUp() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();
        if (roomData.U) {
            _level -= 1;
            _redrawCanvasBGs();
            _revealMap();
            _visitRoom(currentRoom.x,currentRoom.y);
            _ensureRoomExit();

            this.message('Returning to level '+(_level+1)+'.');

            return true;
        } else {
            return false;
        }
    }

    function doStart() {
        switch (_state) {
            case states.title:
                _startGame();
                break;
            case states.intro:
                break;
            case states.play:
                break;
            case states.win:
                _startGame();
                break;
            default:
                break;
        }
    }

    function goDown() {
        if (_state != states.play) { return false; }

        var roomData = _getCurrentExits();
        if (roomData.D) {
            _level += 1;

            if (!(mapdata[_level])) {
                _newMap(_level);
                exitRoom[_level] = {x:currentRoom.x,y:currentRoom.y};
            }
            var room = mapdata[_level][currentRoom.y][currentRoom.x];
            room.visited = true;
            room.d |= U;

            _redrawCanvasBGs();
            _revealMap();
            _visitRoom(currentRoom.x,currentRoom.y);
            _ensureRoomExit();

            this.message('Descending to level '+(_level+1)+'.');

            return true;
        } else {
            return false;
        }
    }

    function reset() {
        _setState(states.title);
    }

    // emittable events
    function message(msg) {};
    function getItem(itm) {};
    function gameover() {};

    // return the public functions to the caller
    return {
        gameStart: gameStart,
        cheat: cheat,
        init: init,
        reset: reset,
        goto: goto,
        north: goNorth,
        south: goSouth,
        east: goEast,
        west: goWest,
        up: goUp,
        down: goDown,
        start: doStart,
        message: message,
        getItem: getItem,
        gameover: gameover,
        getState: function _getState() { return _state; },
        getLevel: function _getLevel() { return _level; },
        foo: function foo(st) { _setState(st); },
        outFromHere: function bar() { _ensureRoomExit(); _revealMap(); _visitRoom(currentRoom.x,currentRoom.y); }
    }
};

