# cobweb_dom
fuzzy ideas on how to link cobweb to the dom

This exists is only to collect ideas.

- use X3D.createBrowser('x3dcanvas') to create browser at x3dcanvas tag as a placeholder
- use cobweb SAI to create Scene
- use cobweb XMLParser to parseIntoScene children of x3dcanvas
- use MutationObserver on children to monitor attribute changes since it works on UnknownElements
- (x3dom redefines .setattribute to trigger changes to scenegraph)
- while parsing build global map linking dom nodes to x3d nodes
- better just add a property to dom node: domNode._x3dnode = x3dnode; !;
- statements (routes, import,export, proto) probably in separate maps
- in mutation observer, use map to find x3d node and use SAI to update/remove/add

