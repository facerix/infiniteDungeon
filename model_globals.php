<?php

# begin global variables (customize as appropriate)

$db = array(
    'hostname' => 'mysql.buyog.com',
    'dbname' => 'infinite_dungeon',
    'username_rw' => 'buyog_inserts',   // read/write connection (for inserts/updates)
    'password_rw' => 'all0wMe!n',
    'username_ro' => 'buyog_public',    // read-only mode (for reads)
    'password_ro' => '1234temp!'
);

# end global vars



# offline short-circuits (uncomment to develop offline)
/*

function mysql_connect($host,$user,$pass) {
    return true;
}

function mysql_query($query) {
    return true;
}

function mysql_select_db($db) {
    return true;
}

function mysql_num_rows($cursor) {
    return 0;
}

*/
#end offline short-circuits



# global functions

function db_connect($rw = 0) {
    global $db;
    if ($rw == 1) {
        // read/write connection (for inserts/updates)
        $username = $db['username_rw'];
        $password = $db['password_rw'];
    } else {
        // read-only mode (for reads)
        $username = $db['username_ro'];
        $password = $db['password_ro'];
    }

    mysql_connect($db['hostname'],$username,$password);
    @mysql_select_db($db['dbname']) or die("Unable to select database");
}

function db_close() {
    mysql_close();
}

# useful little function cribbed from http://snipplr.com/view/1358/mysql-fetch-all/
function mysql_fetch_all($result) {
    $all = array();
    while ($row = mysql_fetch_assoc($result)){ $all[] = $row; }
    return $all;
}

# end global functions

?>