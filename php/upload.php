<?php

require("nbt.class.php");
require("idToDataValues.php");
require("IdToTexture.php");
$csvArray = array_map('str_getcsv', file('../res/blocks.csv'));
$blockId = array_column($csvArray, 0);
$blockName = array_column($csvArray, 1);
$blockNameToId = array_combine($blockName, $blockId);

$target = "../uploads/";
$file = $target . basename($_FILES["file"]["name"]);
$success = true;

$slabs = [
    43,
    44,
    125,
    126,
    181,
    182,
    204,
    205
];
$stairs = [
    53,
    67,
    108,
    109,
    114,
    128,
    134,
    135,
    136,
    156,
    163,
    164,
    180,
    203
];

if (move_uploaded_file($_FILES["file"]["tmp_name"], $file)) {
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
    foreach ($palette as $paletteItem) {
        $choice = decodePalette($paletteItem);
        if (isOfSpecifiedType($choice["id"], $stairs)) {
            $choice["isStair"] = true;
            $choice["properties"] = array_filter($choice["properties"], function ($k, $v) {
                return !(strpos($k, "shape") !== false);
            }, ARRAY_FILTER_USE_BOTH);


        }

        if (isOfSpecifiedType($choice["id"], $slabs)) {
            $choice["isSlab"] = true;

        }
        if (isset($choice["properties"])) {
            $choice["dataValue"] = getDataValues($choice["id"], $choice["properties"]);
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
    var_dump("error");
}

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


function decodePalette($paletteItem)
{

    global $blockNameToId;

    if (count($paletteItem) == 2) {
        $new_item = [
            "properties" => [],
            "name" => $paletteItem[1]['value']

        ];

        foreach ($paletteItem[0]['value'] as $property) {
            $new_item["properties"][] = $property["name"] . ":" . $property["value"];
        }

    } else {
        $new_item = [
            "name" => $paletteItem[0]['value'],

        ];
    }

    $new_item["id"] = $blockNameToId[$new_item["name"]];
    $new_item["textureFile"] = constructTextureName($new_item);
    return $new_item;
}

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
 * @param $blockId - the id of the block to find the data values for
 * @param $properties - the properties associated with said block
 * @return int - the data value of the specified block (will default to 0)
 */
function getDataValues($blockId, $properties)
{
    global $blockIdToDataValues;
    // if this exists
    if (isset($blockIdToDataValues[$blockId])) {
        // sort the properties
        asort($properties);
        // rebase the array to start at 0
        $properties = array_values($properties);
        $propHash = sha1(serialize($properties));

        $variants = $blockIdToDataValues[$blockId];
        foreach ($variants as $key => $variant) {
            // sort the variants so they are in the same order as the properties from above
            asort($variant);
            $variantHash = sha1(serialize($variant));
            if ($variantHash === $propHash) {
                return $key;
            }
        }
    }
    // default case
    return 0;
}

function isOfSpecifiedType($blockId, $arrayToSearch)
{

    if (in_array($blockId, $arrayToSearch)) {
        return true;
    }

    return false;
}


function findNBTSection($data, $sectionName)
{

    foreach ($data as $section) {
        if ($section["name"] === $sectionName) {
            return $section["value"];
        }
    }

}