<?php
//require '/home/buyog/buyog.com/bin/h2o/h2o.php';

// load db functions
include('model.php');

// connect to the DB in readonly mode
db_connect();

$defs = getRoomDefs();

# return the proper output
header('Content-type: application/json');
#header('Content-type: text/plain');

$jsonEncoded = json_encode( $defs );
$jsonFixed = str_replace('\\/', '/', $jsonEncoded);   # see http://www.php.net/manual/en/function.json-encode.php#100679
echo $jsonFixed;

# done!
?>
