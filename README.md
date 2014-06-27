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
        <link rel="import" href="/element/file-input.html">
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


### Attributes
#### `accept`
If you want to restrict the types of files that the file chooser will allow your user's to select, you can make use of an `accept` attribute, passing one or more MIME types as comma-separated values.  Please note that [browser support for this attribute is very poor and implementations vary wildly](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#Browser_compatibility).  

For example, to allow allow your users to select images and videos:  
```html
<file-input accept="image/*,video/*">Select Files</file-input>
```

#### `directory`
Some browsers (currently only Chrome and Opera) allow you to select folders for upload.  To turn on this feature (ignored if not supported by the UA), just include this attribute on the element.
```html
<file-input directory>Select Files</file-input>
```

Note: Using this feature may not be a great idea for large directories (or high-latency file systems) since the UI thread is blocked while the file tree is parsed.  This is an unfortunate native implementation detail in the browser.


#### `extensions`
This is a validation attribute that allows you to filter out any files that do not contain a specific extension.  The value of this attribute is a JSON array string, containing all extensions to keep.  You can also negate your extension array by including a `!` sign just before the array's opening bracket.

For example, to only accept "jpeg" files:
```html
<file-input extensions='["jpeg", "jpg"]'>Select Files</file-input>
```

To allow any extension EXCEPT "jpeg" files:
```html
<file-input extensions='!["jpeg", "jpg"]'>Select Files</file-input>
```

For information on accessing valid and invalid selected files, see the [API][#api] and [events][#events] sections.


#### `maxFiles`
If you'd like to limit the number of files to accept from your users, specify this as an integer value for the `maxFiles` attribute.

For example, to only accept 3 files:
```html
<file-input maxFiles="3">Select Files</file-input>
```

If you'd like to completely prevent users from selecting more than one file from the file chooser, you can simply set `maxFiles` to 1:
```html
<file-input maxFiles="1">Select Files</file-input>
```

For information on accessing valid and invalid selected files, see the [API][#api] and [events][#events] sections.


#### `maxSize` and `minSize`
You can also specify maximum and minimum acceptable file sizes for the purposes of validation.  The values of each attribute are expected to be in bytes.

For example, to only allow files that are 1000 bytes or greater but not greater than 3000 bytes:

```html
<file-input minSize="1000" maxSize="3000">Select Files</file-input>
```

For information on accessing valid and invalid selected files, see the [API][#api] and [events][#events] sections.



When files are selected by the user, valid files will be made available via the `files` array on the element's instance, and via a `files` property on the triggered `change` event's `detail` object.  Invalid files will be made available via the `invalidFiles` property on the trigg
