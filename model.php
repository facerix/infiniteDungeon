<?php

include('model_globals.php');

# DB access to be used throughout the code

function getRoomDefs() {
    $query = "SELECT name, json" .
             " FROM rooms" .
             " ORDER BY name";

    # get result
    $result = mysql_query($query) or die("Unable to retrieve room definitions");

    # init working variables
    $defs = array();

    # loop
    if (mysql_num_rows($result) != 0) {
        while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
            #print_r($row);
            
            $defs[ $row['name'] ] = $row['json'];

            /*
            array_push($session['speaking'], array(
                "name" => $name,
                "twitter" => $row['twitter'],
                "url" => $row['url']
            ));
            */

        }  # end while

    }  # endif

    return $defs;
}

function saveRoomDef($name, $json) {
    $query = "INSERT INTO rooms (name,json) VALUES ('" .
             $name . "', '" . $json . "');";

    # get result
    $result = mysql_query($query) or die("Unable to save room definition");

    return $result;
}

?>