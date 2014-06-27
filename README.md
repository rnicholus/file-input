file-input
==========

A better `<input type="file">`.

[![Build Status](https://travis-ci.org/garstasio/file-input.svg?branch=master)](https://travis-ci.org/garstasio/file-input)
[![Coverage Status](https://coveralls.io/repos/garstasio/file-input/badge.png?branch=master)](https://coveralls.io/r/garstasio/file-input?branch=master)


### What's wrong with `<input type="file">`?

1. It's difficult to skin/style as the look and feel of the element is mostly determined by the user agent.
2. Access to the selected files are provided via `FileList` object, which is a pseudo-array (not a "real" array, with useful sugar like `forEach`, etc.
3. You want any sort of file validation?  Do it yourself!


**Now, a new, better, evolved (and evolving) element to take its place: `<file-input>`!**


### Styling
Want to make your `<input type="file">` look like a bootstrap button (for example)?  Simple!

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="../bower_components/platform/platform.js"></script>
        <link rel="import" href="../element/file-input.html">
        <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">
    </head>

    <body>
        <file-input class="btn btn-primary">
            <span class="glyphicon glyphicon-file"></span> Select a file
        </file-input>
    </body>
</html>
```

The underlying `<input type="file">` will look this this:  
![upload button](http://i.imgur.com/xEIQPSV.png?1)

Any text or elments that you would like to appear on the button can be defined as content of your `<file-input>` element.  Clicking the button will, of course, reveal the browser's file chooser!


