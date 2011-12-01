// --------------------------------------------------------------------
// Set up constants & helper functions
// --------------------------------------------------------------------

"use strict";

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

//----------------------------
// Here's the RoomBuilder class itself

var RoomBuilder = function(){
    var tileCtx = null,
        roomCtx = null,
        scale = 2,
        screenWidth  = 240*scale,
        screenHeight = 160*scale,
        halfWidth    = 120*scale,
        halfHeight   =  80*scale,
        roomdata = [],

        _tileSprites = {
            'face_r':   {x: 0,y:32,w:16,h:16},
            'face_l':   {x:16,y:32,w:16,h:16},
            'block':    {x: 0,y:64,w:16,h:16},
            'sand':     {x:40,y:56,w:16,h:16},
            'rug':      {x:40,y:40,w:16,h:16},
            'water':    {x:56,y:40,w:16,h:16},
            'dark':     {x:56,y:56,w:16,h:16}
        },
        _tilePaletteSprites = [[
            'face_r',
            'block',
            'face_l',
            'rug',
            'sand',
            'dark',
            'water'
        ]],
        _roomDefs = {'empty': {}},
        _currentTile = null,
        _currentRoom = {},
        _tileX = 0, _tileY = 0;

    function m_positionTile(t) {
        var dx = 0, dy = 0; // was 24px offset
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


    function m_drawRoomTiles(tileImg, roomInfo) {
        var tileType = null,
            tileImg  = window.imageCache.getImage("tiles"),
            tileSquares = [],
            tileInfo = null,
            i = 0,
            sq = null;
        for (tileType in roomInfo) {
            if (tileType in _tileSprites) {
                tileSquares = roomInfo[tileType];
                tileInfo = _tileSprites[tileType];
                for (i=0; i<tileSquares.length; i++) {
                    sq = m_positionTile(tileSquares[i]);
                    roomCtx.drawImage(tileImg, tileInfo.x,tileInfo.y, tileInfo.w,tileInfo.h, sq.x*scale,sq.y*scale, tileInfo.w*scale,tileInfo.h*scale);
                }
            } else {
                console.error('Unknown tile type: {', tileType, '} in _drawRoomTiles');
            }
        }
    }


// PUBLIC FUNCTION DEFINITIONS
    function init(args) {
        // required arguments: canvasID, tileImg
        dojo.mixin(this, args);

        // grab the room defs
        dojo.xhrGet( {
            url: "rooms.json",
            handleAs: "json",
            preventCache: false,
            load: function(response){
                _roomDefs = response;
                dojo.publish("builder:loadedRooms", [getkeys(response)]);
            },
            error: function(response, ioArgs) {
                console.log("Error getting room data:", response, ioArgs);
            }
        });

        // init canvases
        var canvas1 = dojo.byId(this.tileCanvasID);
        if (canvas1 && canvas1.getContext){
            tileCtx = canvas1.getContext('2d');
            tileCtx.fillStyle = "rgba(255,0,0,0.75)";
        }
        var canvas2 = dojo.byId(this.roomCanvasID);
        if (canvas2 && canvas2.getContext){
            roomCtx = canvas2.getContext('2d');
            roomCtx.mozImageSmoothingEnabled = false;
        }
    }

    function setTile(x,y) {
        if (x == 0 && y >= 0 && y <= 6) {
            // set locals
            var cx = x * 32,
                cy = y * 32;

            // set globals (in the closure)
            _currentTile = _tilePaletteSprites[x][y];
            _tileX = x;
            _tileY = y;

            tileCtx.clearRect(0,0,32,224);
            //tileCtx.fillRect(cx,cy,32,32);

            tileCtx.fillRect(cx,cy,4,4);
            tileCtx.fillRect(cx+28,cy,4,4);
            tileCtx.fillRect(cx,cy+28,4,4);
            tileCtx.fillRect(cx+28,cy+28,4,4);
        }
    }

    function placeTile(x,y) {
        if (x >= 0 && x <= 11 && y >= 0 && y <= 6) {
            var sx = _tileX * 16,
                sy = _tileY * 16,
                dx = x * 32,
                dy = y * 32;
            roomCtx.clearRect(dx,dy,32,32);
            //roomCtx.fillRect(dx,dy,32,32);
            if (!(_currentTile in _currentRoom)) {
                _currentRoom[_currentTile] = [];
            }
            _currentRoom[_currentTile].push({"x": x,"y": y});

            roomCtx.drawImage(this.tileImg, sx,sy,16,16, dx,dy,32,32);
        }
    }

    function clear() {
        roomCtx.clearRect(0,0,384,224);
        _currentRoom = {};
    }

    function load(roomName) {
        if (roomName && roomName in _roomDefs) {
            var tileImg = window.imageCache.getImage("tiles");
            clear();

            // draw room layout
            _currentRoom = _roomDefs[roomName];
            m_drawRoomTiles(tileImg, _currentRoom);
        }
    }

    function save(roomName) {
        if (roomName) {
            _roomDefs[roomName] = _currentRoom;
            return true;
        } else {
            alert('Please enter a name for your room.');
            return false;
        }
    }


    function serializeRooms() {
        console.log(dojo.toJson(_roomDefs));
    }


    // return the public functions to the caller
    return {
        init: init,
        setTile: setTile,
        placeTile: placeTile,
        clear: clear,
        roomNames: function getRoomNames() { return getkeys(_roomDefs); },
        load: load,
        save: save,
        dump: serializeRooms
    }
};
