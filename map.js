var Map = function(){
    var mapContext = null,
        floorContext = null,
        tileContext = null,
        scale = 2,
        mapdata = [],
        currentRoom = [-1,-1],

        doorSprites = {
            'N':{sx:20,sy: 0,w:32,h:20,dx:104,dy:  4},
            'S':{sx:20,sy:52,w:32,h:20,dx:104,dy:136},
            'E':{sx:52,sy:20,w:20,h:32,dx:216,dy: 64},
            'W':{sx: 0,sy:20,w:20,h:32,dx:  4,dy: 64}
        };

    function _getCurrentExits() {
        return getExits(mapdata[currentRoom[1]][currentRoom[0]]);
    }

    function _occupyRoom(x,y) {
        currentRoom = [x,y];
        _drawRoomOnMap(x,y);
    }

    function _move(dx,dy) {
        var x = 0, y = 0;
        if (dx || dy) {
            // redraw current room on map (clearing player dot in the process)
            _drawRoomOnMap(currentRoom[0], currentRoom[1]);

            currentRoom[0] += dx;
            currentRoom[1] += dy;

            // draw new room on map
            _drawRoomOnMap(currentRoom[0], currentRoom[1]);
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
            mapContext.fillRect(x, y, gapWidth, gapHeight);
        } else {
            // N-S door
            if (dy < 0) { y += scale; }
            mapContext.fillRect(x, y, gapHeight, gapWidth);
        }
    }

    function _drawRoomOnMap(room_x, room_y) {
        if (mapContext && room_x > -1) {
            // draw location on map scroll
            var x = ((room_x*8) + 33) * scale,
                y = ((room_y*8) + 9) * scale,
                roomSize = 6 * scale;

            mapContext.fillStyle = "rgb(0,0,0)";

            // draw the room
            mapContext.fillRect(x,y,roomSize,roomSize);

            // draw passageways out of this room
            var doors = _getCurrentExits();
            if (doors.N) { _drawPassage(room_x, room_y, 0, -1); }
            if (doors.S) { _drawPassage(room_x, room_y, 0,  1); }
            if (doors.E) { _drawPassage(room_x, room_y,  1, 0); }
            if (doors.W) { _drawPassage(room_x, room_y, -1, 0); }
        }
    }

    function _setMapIndicatorColor() {
        if (mapContext) {
            mapContext.fillStyle = "rgb(128,224,0)";   // default (green) dot color
            //mapContext.fillStyle = "rgb(184,184,248)"; // blue location dot
            //mapContext.fillStyle = "rgb(248,56,0)";    // red location dot
        }
    }

    return {

        init: function map_init(args) {
            // required arguments: mapCanvasID, floorCanvasID, tileCanvasID
            dojo.mixin(this, args);

            // init map canvas
            var map = dojo.byId(this.mapCanvasID);
            if (map && map.getContext){
                mapContext = map.getContext('2d');
                mapContext.mozImageSmoothingEnabled = false;
            }

            // init floor canvas
            var floor = dojo.byId(this.floorCanvasID);
            if (floor && floor.getContext){
                floorContext = floor.getContext('2d');
                floorContext.mozImageSmoothingEnabled = false;
            }

            // init tile canvas
            //var tiles = dojo.byId(this.tileCanvasID);
            //if (tiles && tiles.getContext){
            //    tileContext = tiles.getContext('2d');
            //    tileContext.mozImageSmoothingEnabled = false;
            //}

            //console.log('Map is initialized and ready');
        },

        generate: function map_generate(w,h) {
            mapdata = getNewMap(w,h);
        },

        dump: function map_dump() {
            return dumpMap(mapdata);
        },

        refreshTiles: function map_function() {
            if (mapContext) {
                mapContext.drawImage(this.mapImg, 0,0, 128,80, 0,0, 256,160);
            }

            //if (tileContext) {
            //    tileContext.drawImage(this.tileImg, 0,0, 72,72, 0,0, 144,144);
            //}

            if (floorContext) {
                floorContext.drawImage(this.floorImg, 0,0, 240,160, 0,0, 480,320);
            }
        },

        drawRoom: function map_drawRooom() {
            var sx,sy,dx,dy,w,h,
                roomData = _getCurrentExits();

            //this.refreshTiles();

            //console.log("roomData is:", roomData);
            if (roomData) {
                // draw base room
                floorContext.drawImage(this.floorImg, 0,0, 240,160, 0,0, 240*scale,160*scale);

                // draw doors
                dojo.forEach("NSEW", function(d) {
                    if ((roomData[d]) && doorSprites[d]) {
                        sx = doorSprites[d].sx;
                        sy = doorSprites[d].sy;
                        dx = doorSprites[d].dx * scale;
                        dy = doorSprites[d].dy * scale;
                        w  = doorSprites[d].w;
                        h  = doorSprites[d].h;
                        floorContext.drawImage(this.tileImg, sx,sy, w,h, dx,dy, w*scale,h*scale);
                    }
                }, this);

                // draw location on map scroll
                x = ((currentRoom[0]*8) + 34) * scale;
                y = ((currentRoom[1]*8) + 11) * scale;
                var dotSize = 3 * scale;
                _setMapIndicatorColor();
                mapContext.fillRect(x,y,dotSize,dotSize);
            }

        },

        goto: function map_goto(x, y) {
            _occupyRoom(x,y);
            this.drawRoom();
        },

        north: function map_goNorth() {
            var roomData = _getCurrentExits();

            if (roomData.N && (currentRoom[1] > 0)) {
                _move(0,-1);
                this.drawRoom();
            }
        },

        south: function map_goSouth() {
            var roomData = _getCurrentExits();

            if (roomData.S && (currentRoom[1] < 7)) {
                _move(0,1);
                this.drawRoom();
            }
        },

        east: function map_goEast() {
            var roomData = _getCurrentExits();

            if (roomData.E && (currentRoom[0] < 7)) {
                _move(1,0);
                this.drawRoom();
            }
        },

        west: function map_goWest() {
            var roomData = _getCurrentExits();

            if (roomData.W && (currentRoom[0] > 0)) {
                _move(-1,0);
                this.drawRoom();
            }
        }

    }
};

