# x_ite_dom

## Summary

x_ite_dom.js is intended to be used with the X3D browser x_ite.js (https://github.com/create3000/x_ite). x_ite_dom links the X3D DOM nodes to the X3D scene graph and thereby allows for control of the X3D scene using regular DOM manipulation methods.
Please be aware that X3D requires a well defined organisation of the scene. If modifying the DOM results in an invalid scene graph, errors result.

## Design

The design is based around the idea that x_ite_dom.js is an optional, thin bridge layer which only requires minimal or no modification to x_ite as a X3D browser. To a large extent it tries to use the external SAI as it is defined for standard conforming X3D browsers.

The overall idea is to use the DOM mutation observer facility to relay changes in the DOM to the X3D scene graph which is internal to x_ite. After creating an initial X3D scene from X3D XML under the X3DCanvas tag, the bridge code installs a mutation observer to catch all changes within a Scene element. Depending on what was changed, then X3D SAI as well as some internal x_ite.js methods are invoked to realize these changes within the parallel scene graph.

A design goal is to keep the code lines count small enough to keep all code in a single file. If the code base grows larger, I would not be able to support development, and it would indicate that there are too many features.

## Usage

See index.xhtml and the examples in tests/ and tests/html5 for usage of the code.

## Capabilities and Limitations

Since X3D uses an XML encoding, xhtml encoded web pages are preferred. Regular html case-insensitive encoding can be used as well but is less well tested. 

- Most attributes of X3D elements should be controllable. 
- ProtoDeclarations cannot be modified, added or removed.
- Most other X3D nodes can be modified, added or removed, including ProtoInstances.
- Routes can be added and removed.
- Modifying Route attributes does not have the desired or any effect. Remove and add Routes instead.
- Manipulation of USE and DEF attributes do not have the desired or any effect.
- Inline: X3D nodes added to the scene graph via a inline node are appended to the inline element and can be manipulated there. internal attribute manipulations work, adding internal root nodes and one level child nodes work, but adding deeper level nodes does not. Adding and removing routes inside Inlines may not work.
- Script: X3D script nodes require a type='application/x-myscript' attribute. See tests/x3d_script.xhtml. Otherwise they are interpreted by the web browser as dom script nodes.
- Script node content is interpreted as XML even in HTML documents. This means that a cdata section declaration should be used.
- Multiple scenes on a web page can coexist and can be controlled.
- Each attribute mutation leads to a complete x3d event cascade to preserve sequencing. This avoids unexpected behavior but may impact performance slightly.
- Events: see below
- on demand loading of required components if profile is given in X3D element; otherwise 'Full' profile is loaded: for faster loading specify correct profile (or components) such as 'Interactive', 'Full' is rarely needed.

## Events

Event handling currently covers all inputOutput and outputOnly fields, which includes all sensor and interpolator events.

Mouse events originate from x3d sensor nodes. This means that the x3d scene has to have such a sensor node (TouchSensor) for any mouse events to be dispatched.

See tests/interactiveTransformations.xhtml and other for examples.

Event type names parallel x3d field names. The name construction is "x3d" + "_" + x3d event name.

This means the usual events such as 'click' or 'mouseover' are not available. However, there are similar events for x3d sensors albeit with other names (for example x3d_isOver).

The onevent attributes or properties are not available. Use element.addEventListener() instead.

The event parameter provided to the callback function has these properties:
- detail.value: the value of the x3d field
- detail.name: The DEF name of the dispatching node; empty if there is no DEF name.
- detail.fields: an array of all fields of the x3d node with current values
- detail.x3dnode: the x3d node object which originated the event (for advanced use)

The dispatched events do not bubble back up, eg. usually there should be no need to stop propagation. The event listeners should be attached to the specific DOM elements which is the dispatch target of the event.

To help with attaching listeners to sensors within inlines, a new 'x3dload' event is dispatched on the document target to signal when all inlines per scene are appended to the document.

To help with debugging x3d event flow, a 'trace' attribute for the X3DCanvas element enables detailed logging of output events to the console. This is particularly helpful for ROUTE, Interpolator and event utility debugging. Since all output events are logged, tracing impacts performance. Remove the trace attribute to switch off.


## TODO

- Prototype handling: ProtoInstances work, ProtoDeclarations undecided
- allow hook into render loop ?
- allow mutated attributes to be parsed objects, eg. skip parsing; useful if X3D math function are used on native types
- perhaps add onevent properties to DOM nodes.
- clean up and organise tests: updated all to latest, added proto tests

## Releases

* 1.1 : updates for x_ite >= 4.4.4: async loading of required components, X3D tag now required
* 1.0 : small updates for x_ite >= 4.4.3
* 0.9x: renamed to x_ite_dom
* 0.9 : no functional changes, works with cobweb 3.3; jekyll generation of example list
* 0.8 : full html support, preserve mutation sequencing, requires cobweb 2.5 or 2.6, does not work with cobweb dev (master)
* 0.75: internal improvements: parser reuse, no penalty for trace when off
* 0.7 : modification and addition of ProtoInstances, basic event trace functionality, requires cobweb > v2.3
* 0.6 : many more events, eg. all output fields, shortened event names to x3d_fieldname
* 0.5 : major internal restructuring, route removal support, requires cobweb >= v2.2
* 0.4 : support for inline access, multiple scenes, adding child nodes, x3dload event, cobweb > v2.1
