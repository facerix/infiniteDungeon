var Map = function(){
    var mapCtx = null,
        floorCtx = null,
        spriteCtx = null,
        scale = 2,
        _level = 0,
        _compass = true,
        mapdata = [],
        breadcrumbs = [],
        currentRoom = {x:-1,y:-1},
        exitRoom    = {x:-1,y:-1},
        stairRoom   = {x:-1,y:-1},
        _inventory  = {},

        doorPositions = {
            'N':{x:104,y:  4},
            'S':{x:104,y:136},
            'E':{x:216,y: 64},
            'W':{x:  4,y: 64}
        },
        itemSprites = {
            'compass': {x:136,y:40,w:16,h:16},
            'map':     {x:136,y:56,w: 8,h:16}
        }
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
            'stairs': {
                'stairs_d': [{ x: 6, y: 3 }],
                'block': [
                    {x: 4,y: 3}, {x: 5,y: 2}, {x: 6,y: 1}, {x: 7,y: 2},
                    {x: 8,y: 3}, {x: 7,y: 4}, {x: 6,y: 5}, {x: 5,y: 4}
                ]
            },
            'exit': {
                'stairs_u': [{ x: 11, y: 0 }],
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

            mapCtx.fillStyle = "rgb(0,0,0)";

            // draw the room
            mapCtx.fillRect(x,y,roomSize,roomSize);

            // draw passageways out of this room
            var doors = getExits(mapdata[_level][room_y][room_x]);
            if (doors.N) { _drawPassage(room_x, room_y, 0, -1); }
            if (doors.S) { _drawPassage(room_x, room_y, 0,  1); }
            if (doors.E) { _drawPassage(room_x, room_y,  1, 0); }
            if (doors.W) { _drawPassage(room_x, room_y, -1, 0); }
        }
    }

    function _revealMap() {
        //_inventory.map = true;
        for (var x=0; x<8; x++) {
            for (var y=0; y<8; y++) {
                _drawRoomOnMap(x,y);
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

        // draw blocked door
        var door = tileSprites.closedDoor.S,
            tgt = doorPositions.S;
        floorCtx.drawImage(tileImg, door.x,door.y, door.w,door.h, tgt.x*scale,tgt.y*scale, door.w*scale,door.h*scale);
    }

    function _positionTile(t) {
        return {
            x: (t.x*16) + 24,
            y: (t.y*16) + 24
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
        stairRoom = _getRandomRoom();

        var p = _getRandomRoom();
        mapdata[_level][p.x][p.y].items = ['compass'];

        p = _getRandomRoom();
        mapdata[_level][p.x][p.y].items = ['map'];
    }

    function _getRandomRoom() {
        return {
            x:Math.floor(Math.random()*8),
            y:Math.floor(Math.random()*8)
        };
    }

    function _drawRoomContents(room, itemsImg, msg_callback) {
        var c, sq, itm;
        if (typeof msg_callback == "undefined") { msg_callback = function(msg) {console.log(msg);}; }

        spriteCtx.clearRect(0,0,480,320);
        if (room.items) {
            for (var i in room.items) {
                itm = room.items[i];
                c = itemSprites[itm];
                sq = _positionTile({x:6,y:3});

                spriteCtx.drawImage(itemsImg, c.x,c.y,  c.w,c.h, sq.x*scale,sq.y*scale, c.w*scale,c.h*scale);

                _inventory[itm] = true;

                switch (itm) {
                    case 'map':
                        msg_callback("You found the map!");
                        _revealMap();
                        break;
                    case 'compass':
                        msg_callback("You found the compass!\nExits are now marked on your map.");
                        break;
                    default:
                        msg_callback("You found a " + itm + "!");
                        break;
                } // end switch
            } // end for

            room.items = [];

        } // end if
    }

    function __getMapDotPos(x,y) {
        return {
            x: ((x*8) + 35) * scale,
            y: ((y*8) + 10) * scale
        };
    }
    function _drawMapDots() {
        var pos, dotSize = 3 * scale;

        // stair positions (if you have the compass)
        if (_inventory.compass) {
            mapCtx.fillStyle = "rgb(248,248,248)";
            if (_level > 0) {
                p = __getMapDotPos(exitRoom.x,exitRoom.y);
            } else {
                p = __getMapDotPos(3,7);
            }
            mapCtx.fillRect(p.x,p.y,dotSize,dotSize);

            mapCtx.fillStyle = "rgb(64,64,64)";
            p = __getMapDotPos(stairRoom.x,stairRoom.y);
            mapCtx.fillRect(p.x,p.y,dotSize,dotSize);
        }

        // player position
        x = ((currentRoom.x*8) + 34) * scale,
        y = ((currentRoom.y*8) + 11) * scale;
        _setMapIndicatorColor();
        mapCtx.fillRect(x,y,dotSize,dotSize);
    }

    function _newMap(level) {
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
        // dump inventory & reset level
        _inventory.compass = false;
        _inventory.map     = false;
        _level = 0;

        // generate level 0 map
        _newMap(_level);

        this.refreshTiles();
        this.goto(3,7);
        this.message('Welcome to the underworld.');
    }

    function cheat() {
        _inventory.compass = true;
        _revealMap();
        _drawMapDots();
        this.message("Cheaters never prosper!");
    }

    function message(msg) {
        //console.log(msg); -- handled up the call stack in the calling page
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
            roomData = _getCurrentExits(),
            cx = currentRoom.x,
            cy = currentRoom.y;

        //console.log("roomData is:", roomData);
        if (roomData) {
            // draw base room
            floorCtx.drawImage(this.floorImg, 0,0, 240,160, 0,0, 240*scale,160*scale);

            // draw doors
            dojo.forEach("NSEW", function(d) {
                if ((roomData[d]) && tileSprites.openDoor[d]) {
                    door = tileSprites.openDoor[d];
                    pos = doorPositions[d];
                    floorCtx.drawImage(this.tileImg, door.x,door.y, door.w,door.h, pos.x*scale,pos.y*scale, door.w*scale,door.h*scale);
                }
            }, this);

            // draw other room features
            // (e.g. entrance hall, exit stairs, etc)
            if (_level == 0 && cx == 3 && cy == 7) {
                _drawEntrance(this.tileImg);
            }
            if ((cx == exitRoom.x) && (cy == exitRoom.y)) {
                // draw exit
                _drawRoomTiles(this.tileImg, __roomLayouts.exit);
                this.message("Press < to climb the stairs.");
            }
            if ((cx == stairRoom.x) && (cy == stairRoom.y)) {
                // draw stairs down
                _drawRoomTiles(this.tileImg, __roomLayouts.stairs);
                this.message("Press > to go down the stairs.");
            }

            _drawRoomContents(mapdata[_level][cx][cy], this.itemsImg, this.message);

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
        if (currentRoom.x == exitRoom.x && currentRoom.y == exitRoom.y) {
            _level -= 1;
            this.refreshTiles();
            _drawRoomOnMap(currentRoom.x, currentRoom.y);
            this.drawRoom();

            this.message('Returning to level '+_level+'.');
        }
    }

    function goDown() {
        if (currentRoom.x == stairRoom.x && currentRoom.y == stairRoom.y) {
            _level += 1;
            _newMap(_level);
            this.refreshTiles();
            exitRoom = {x:currentRoom.x, y:currentRoom.y};
            _drawRoomOnMap(currentRoom.x, currentRoom.y);
            this.drawRoom();

            this.message('Descending to level '+_level+'.');
        }
    }

    // return the public functions to the caller
    return {
        level: _level,
        init: init,
        data: debugData,
        generate: generate,
        cheat: cheat,
        message: message,
        dump: dump,
        refreshTiles: refreshTiles,
        drawRoom: drawCurrentRoom,
        goto: goto,
        north: goNorth,
        south: goSouth,
        east: goEast,
        west: goWest,
        up: goUp,
        down: goDown
    }
};

