<?php
// nbt library
require("nbt.class.php");
// various massive arrays
require("idToDataValues.php");
require("IdToTexture.php");
require("blockTypeArrays.php");

// I should turn this into an actual array, but it works for now
// this loads all the blocks, filters thigns out, and then makes an array
$csvArray = array_map('str_getcsv', file('../res/blocks.csv'));
$blockId = array_column($csvArray, 0);
$blockName = array_column($csvArray, 1);
$blockNameToId = array_combine($blockName, $blockId);

$target = "../uploads/";
$file = $target . basename($_FILES["file"]["name"]);
$success = true;
// if the file succeeded
if (move_uploaded_file($_FILES["file"]["tmp_name"], $file)) {
    // need to handle errors here
    $nbt = new NBT();
    $nbt->loadFile($file);
    $nbtData = $nbt->root[0]['value'];
    // get the data from the file
    $blocks = findNBTSection($nbtData, "blocks")["value"];
    $palette = findNBTSection($nbtData, "palette")["value"];
    $size = findNBTSection($nbtData, "size")["value"];
    $author = findNBTSection($nbtData, "author");
    $version = findNBTSection($nbtData, "version");

    $formatted_blocks = [];
    // loop through the blocks and format them nicely
    foreach ($blocks as $block) {
        $new_block = decodeBlock($block);
        $formatted_blocks[] = $new_block;
    }

    $formatted_palette = [];

    // loop through palette items
    // if they're a special block (ex stair or slab etc) then mark them as such
    foreach ($palette as $paletteItem) {
        $choice = decodePalette($paletteItem);
        $blockId = $choice["id"];
        $foundType = false;
        if (isOfSpecifiedType($blockId, $stairs)) {
            $foundType = true;
            $choice["model"] = "stair";
            // strip out the shape property because it's causing trouble, and not needed
            $choice["properties"] = array_filter($choice["properties"], function ($k, $v) {
                return !(strpos($k, "shape") !== false);
            }, ARRAY_FILTER_USE_BOTH);
        }

        if (!$foundType && isOfSpecifiedType($blockId, $slabs)) {
            $foundType = true;
            $choice["model"] = "slab";
        }

        if (!$foundType && isOfSpecifiedType($blockId, $fences)) {
            $foundType = true;
            $choice["model"] = "fence";
        }

        if (!$foundType && isOfSpecifiedType($blockId, $walls)) {
            $foundType = true;
            //$choice["model"] = "wall";

        }

        if (!$foundType && isOfSpecifiedType($blockId, $panes)) {
            $foundType = true;
            //$choice["model"] = "pane";
        }

        if (!$foundType && $blockId == 145) {
            $foundType = true;
            $choice["model"] = "anvil";
        }

        if (isset($choice["properties"])) {
            $choice["dataValue"] = getDataValues($choice["id"], $choice["properties"]);
        }

        if (isOfSpecifiedType($blockId, $lightSources)) {
            $choice["isLightSource"] = true;
        }


        $formatted_palette[] = $choice;
    }

    $result = [
        "blocks" => $formatted_blocks,
        "palette" => $formatted_palette,
        "size" => $size,
        "author" => $author,
        "version" => $version
    ];

    $result_json = json_encode($result);

    echo $result_json;

} else {
    // I really need better error handling
    var_dump("error");
}
/**
 * @param $block - data from the NBT file
 * @return array - nicely formatted block data
 */
function decodeBlock($block)
{
    $new_block = [
        "pos" => [
            "x" => $block[0]['value']['value'][0],
            "y" => $block[0]['value']['value'][1],
            "z" => $block[0]['value']['value'][2]
        ],
        "state" => $block[1]['value']
    ];

    return $new_block;
}

/**
 * @param $paletteItem - palette data from the nbt file
 * @return array - nicely formatted data about each palette item
 */
function decodePalette($paletteItem)
{

    global $blockNameToId;
    // if there are two items, properties exist and we need to mess with them
    if (count($paletteItem) == 2) {
        $new_item = [
            "properties" => [],
            "name" => $paletteItem[1]['value']

        ];

        foreach ($paletteItem[0]['value'] as $property) {
            $new_item["properties"][] = $property["name"] . ":" . $property["value"];
        }
        // otherwise, we can just set the name and be done
    } else {
        $new_item = [
            "name" => $paletteItem[0]['value'],

        ];
    }
    // get the id from that massive array
    $new_item["id"] = $blockNameToId[$new_item["name"]];
    // find the texture file
    $new_item["textureFile"] = constructTextureName($new_item);
    return $new_item;
}

/**
 * @param $palette_item - the already formatted paletteItem
 * @return string - the texture name
 */
function constructTextureName($palette_item)
{
    global $blockIdToTexture;
    $id = $palette_item["id"];

    if (!isset($blockIdToTexture[$id])) {
        return null;
    }

    $result = $blockIdToTexture[$id];

    if (!is_array($result)) {
        return $result;
    }
    $dataValue = 0;
    if (isset($palette_item["dataValue"])) {
        $dataValue = $palette_item["dataValue"];
    }
    return $result[$dataValue];

}

/**
 * getting the data values associated with a particular blocktype is important for finding textures and stuff
 * this function does all that, but in an interesting way.
 *  * @param $blockId - the id of the block to find the data values for
 * @param $properties - the properties associated with said block
 * @return int - the data value of the specified block (will default to 0)
 */
function getDataValues($blockId, $properties)
{
    global $blockIdToDataValues;
    // if there are data values associated with the block id at hand
    if (isset($blockIdToDataValues[$blockId])) {
        // sort the properties we've been given
        asort($properties);
        // rebase the array to start at 0
        $properties = array_values($properties);
        // hash a serialized version of the array
        // yes, I'm using sha1, no, that doesn't matter, this isn't a password
        $propHash = sha1(serialize($properties));
        // now get all the different possibilities for this block id
        $variants = $blockIdToDataValues[$blockId];
        // loop through all of them
        foreach ($variants as $key => $variant) {
            // sort the variants so they are in the same order as the properties from above
            asort($variant);
            // hash using the same algo as above
            $variantHash = sha1(serialize($variant));
            // if the hashes match, we're done here!
            if ($variantHash === $propHash) {
                return $key;
            }
        }
    }
    // default case of 0, because that's Minecraft's default case too.
    return 0;
}

/**
 * general purpose function for seeing if a specific block is of a specified type
 * this is used for seeing if it's a stair or somethingl ike that
 * @param $blockId - id of the block we want to test
 * @param $arrayToSearch - array containing blockids of the same type
 * @return bool - true if it's one of those, false if not
 */
function isOfSpecifiedType($blockId, $arrayToSearch)
{
    return in_array($blockId, $arrayToSearch);
}

/**
 * since we don't know the order of the data in the nbt file, we need to search for a specific section
 * @param $data - the nbt data blob chunk thing
 * @param $sectionName - the part of the data we want
 * @return mixed - the section we want
 */
function findNBTSection($data, $sectionName)
{

    foreach ($data as $section) {
        if ($section["name"] === $sectionName) {
            return $section["value"];
        }
    }
    // return null if nothing found
    return null;
}
