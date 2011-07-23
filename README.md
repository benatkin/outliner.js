# outliner.js

I'm working on a way to present JSON data, besides serializing it to a string. I'm also trying to build up a corpus of sample JSON documents to make it easy to play around with different presentation styles.

## TODO

* Make API async
* Render bigger objects (CouchOne pages)
* Render multiline in a &lt;pre&gt;
* Add autolink option
* Collapsing and Expanding
* Syntax highlighting post-render example
* load URLs with a spinner
* Edit leaf values
* Add items to objects
* Add items to arrays
* Remove items from objects and arrays
* Wrap a node in a list
* Unwrap node(s) in a list

I'm using [pomo](https://github.com/langhorst/pomo), and have added my .pomo file to this repo.

## Dependencies

### Current

* underscore.js

### Under consideration

* backbone.js
* DOMBuilder
* Traverse
* Eco templates

## Credits

* [js-naturalsort](http://code.google.com/p/js-naturalsort/source/browse/trunk/naturalSort.js): Jim Palmer, [Mike Grier](http://mgrier.com/), Clint Priest, Kyle Adams, guillermo

## License

Copyright (c) 2010-2011 Ben Atkin. Licensed under the terms of the MIT license.