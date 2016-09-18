# cobweb_dom
fuzzy ideas on how to link cobweb to the dom converted to first code

Ideas and refinements:

- use X3D.createBrowser('x3dcanvas') to create browser at x3dcanvas tag as a placeholder
 - difficult, needs internal changes; just <x3d> as intended
- use cobweb SAI to create Scene
 - not necessary, scene reference from browser
- use cobweb XMLParser to parseIntoScene children of x3dcanvas
 - instead use loadDocument(doc.querySelector('Scene'); document needs to be xhtml
- use MutationObserver on children to monitor attribute changes since it works on UnknownElements
 - works well
- (x3dom redefines .setattribute to trigger changes to scenegraph): faster ?
- while parsing build global map linking dom nodes to x3d nodes
- better just add a property to dom node: domNode._x3dnode = x3dnode; !;
 - works well
- statements (routes, import,export, proto) probably in separate maps: TODO
- in mutation observer, use map to find x3d node and use SAI to update/remove/add
 - attribute changes handled
 - uses cobweb parser to convert from string to correct type, then set value to field
 - also reflect back to DOM after internal changes?
 - would need conversion from type to string per type ...
 - perhaps hook into whenever any value is set ? get dom node, set dom attribute

TODO:

- add/remove nodes: done
 - SAI: Scene.createNode, .rootNodeHandling.createRootNode or so
 - SAI: node.dispose()
 - o-------------------o
 - instead ended up using Parser for creation
 - dispose does not seem implemented
 - set container(parent) field to null, emit set event
 - check mfnode and rootnodes and handle 
- mouse EVENTS:
 - canvas events all captured and stopped by cobweb; it then checks if over Shapes in traverse type POINTER
 - need to emit event back to DOM node, somehow, with useful properties 
 - needs reverse mapping of DOM node to x3d node
 - o--------------------o
 - discovered field.addFieldCallback() SAI function
 - use it on all (output?) sensor fields
 - callback then dispatches DOM event with useful properties
 - TODO: howto best find all sensor nodes
 - TODO: ignore input only fields (though may be useful to listen to input to)
 - TODO: thinkabout names for DOM events: probably same as field names, but in parallel classic html names as well ?
 - TODO: howto add field callbacks for dynamically added nodes: via DOM just do it after parsing, but via SAI ?
 - hack cobweb createNode() ?
 - is there a node created x3d event ?



