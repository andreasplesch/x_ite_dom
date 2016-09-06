# cobweb_dom
fuzzy ideas on how to link cobweb to the dom

This exists is only to collect ideas.

- use X3D.createBrowser('x3dcanvas') to create browser at x3dcanvas tag as a placeholder
 -- difficult, needs internal changes; just <x3d> as intended
- use cobweb SAI to create Scene
 -- not necessary, scene reference from browser
- use cobweb XMLParser to parseIntoScene children of x3dcanvas
 -- instead use loadDocument(doc.querySelector('Scene'); document needs to be xhtml
- use MutationObserver on children to monitor attribute changes since it works on UnknownElements
 -- works well
- (x3dom redefines .setattribute to trigger changes to scenegraph): faster ?
- while parsing build global map linking dom nodes to x3d nodes
- better just add a property to dom node: domNode._x3dnode = x3dnode; !;
 -- works well
- statements (routes, import,export, proto) probably in separate maps: TODO
- in mutation observer, use map to find x3d node and use SAI to update/remove/add
 -- attribute changes handled
 -- uses cobweb parser to convert from string to correct type, then set value to field


