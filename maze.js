// --------------------------------------------------------------------
// Recursive backtracking algorithm for maze generation. Requires that
// the entire maze be stored in memory, but is quite fast, easy to
// learn and implement, and (with a few tweaks) gives fairly good mazes.
// Can also be customized in a variety of ways.
// --------------------------------------------------------------------

/* sample output from (modified) Ruby version by Jamis Buck:

m = [
    [ 4,12,12,12,12,12,12,10 ],
    [ 6,12,12,12,12,10, 6, 9 ],
    [ 3, 6,10, 6,12,11, 5,10 ],
    [ 3, 3, 3, 3, 4,13, 8, 3 ],
    [ 3, 3, 5, 9, 6,10, 6, 9 ],
    [ 3, 3, 6,12, 9, 3, 5,10 ],
    [ 3, 5, 9, 6,12, 9, 6, 9 ],
    [ 5,12, 8, 5,12,12,13, 8 ]
];
 _______________
|_____________  |
|  _______  |  _|
| |   |  _  |_  |
| | | | |_____| |
| | |___|   |  _|
| | |  ___| |_  |
| |___|  ___|  _|
|_____|_________|

*/



// --------------------------------------------------------------------
// 2. Set up constants & helper functions
// --------------------------------------------------------------------

var N = 1, S = 2, E = 4, W = 8,
    DIRECTIONS = { N: 1, S:  2, E:  4, W: 8 },
    DX         = { E: 1, W: -1, N:  0, S: 0 },
    DY         = { E: 0, W:  0, N: -1, S: 1 },
    OPPOSITE   = { E: W, W:  E, N:  S, S: N }

function shuffle(array)
{ // from http://stackoverflow.com/questions/5150665/generate-random-list-of-unique-rows-columns-javascript
    for(var j, x, i = array.length; i; j = parseInt(Math.random() * i), x = array[--i], array[i] = array[j], array[j] = x);
    return array;
};

// --------------------------------------------------------------------
// 3. The recursive-backtracking algorithm itself
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
// 4. A simple routine to emit the maze as ASCII
// --------------------------------------------------------------------

function _repeat(str, num) {
    return new Array(isNaN(num)? 1 : ++num).join(str);
}

function dumpMap(g) {
    var height = g.length,
        width = g[0].length,
        line = null,
        output = " " + _repeat("_", width * 2 - 1);

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

function getExits(roomDef) {
    return exits = {
        'N': (roomDef.d & N),
        'S': (roomDef.d & S),
        'E': (roomDef.d & E),
        'W': (roomDef.d & W)
    };
}

function getNewMap(width, height) {
    width  = width  || 8;
    height = height || 8;

    var grid = [];
    for (var x=0; x<height; x++) {
        grid[x] = [];
        for (var y=0; y<width; y++) {
            grid[x][y] = {d:0};
        }
    }

    carve_passages_from(0, 0, grid);
    return grid;
}