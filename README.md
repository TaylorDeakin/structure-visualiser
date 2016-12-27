# Structure Visualiser
A web based viewer for Minecraft Structures

## Getting Started
Before getting started, there are a couple of requirements
### Requirements
* a browser that supports WebGL ([caniuse](http://caniuse.com/#search=webGL))
* a PHP server of some description (MAMP/WAMP/LAMP/etc or PHPStorm (or just install PHP))

 Once you've done that, it's fairly easy to get started - just chuck the files on a server, then navigate to it in your browser. 

## Glossary
A summary of terms relating to the project that will hopefully help explain my code

* NBT - "Named Binary Tag" - a file format created by Notch for Minecraft. 
* Palette - Structure files have a "palette", which is an array of all the different block types that appear in a structure. Other blocks can then reference an element in this palette, rather than having to keep a copy of what block they are. 
* Block Ids - each blocktype in Minecraft has a unique id. For example, **Stone** has the id of **1**. You can see a full list at **[minecraft-ids.grahamedgecombe.com](http://minecraft-ids.grahamedgecombe.com/ "minecraft-ids.grahamedgecombe.com")**
* Data Values - Some blocks also have a 'Data Value', which corresponds to a specific state that a block can be in (different from a palette state). For example, stairs can be facing different directions, slab blocks can be different materials (which gets really annoying fast). You can see a list of the different data values on the **[Minecraft Wiki](http://minecraft.gamepedia.com/Data_values#Data)**. I typed this list out into a custom format, which you can see if you go to `/res/textData/props.txt`. The format is as follows:
```<Block ID>:<Data Value>|<Property Name>:<Property Value>...```
where properties are separated by a comma. This list is can also be found in PHP Array Structure, in the `/php/idToDataValues.php` file. 

