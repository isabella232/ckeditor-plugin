Sketchfab CKEditor Plugin
=========================

The Sketchfab CKEditor plugin adds a Sketchfab button in a CKEeditor text-editing toolbar.
This button allows to embed Sketchfab models right in your text.

Overview
--------

- Add a sketchfab button in your toolbar
![Add a sketchfab button in your toolbar](/examples/blenderartist/button.png)

- Paste a sketchfab url
![Sketchfab CKE Plugin dialog](/examples/blenderartist/dialog.png)

- Embed a model in one click
![Sketchfab embed in a post](/examples/blenderartist/preview.png)


Supported editors
-----------------
The CKE plugin can be used on any backend using CKEditor as a frontend text-editor, and able to parse [sketchfab] bbCode
See examples for implementation details (currently: vBulletin 3.8 & vBulletin 4)

Getting started
---------------

Implementation may vary depending on your backend system (vBulletin, phpBB, wordpress ...).
Specific implementation details are provided when available, but the main steps are basically the same:

- Copy the src/ckeditor-plugin/sketchfab directory inside the plugins/ folder of CKEditor
- Edit 'siteName' in plugin.js
- Edit CKEditor's config (often found in config.js) to enable the plugin and efine the position of the Sketchfab button in your toolbar


[sketchfab] bbCode
------------------
Your text-editor / backend must support the [sketchfab] bbCode.
The [sketchfab] bbCode converts a string such as [sketchfab]modelId[/sketchfab] into a Sketchfab embed (iframe).
Implementation details may vary depending on your backend

Contact
-------
Please send your questions or feedback to support@sketchfab.com
