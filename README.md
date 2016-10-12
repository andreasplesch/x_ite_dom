# cobweb_dom

## Summary

cobweb_dom.js is intended to be used with the cobweb X3D browser cobweb.js (create3000/cobweb). cobweb_dom links the X3D DOM nodes to the X3D scene graph and thereby allows for control of the X3D scene using regular DOM manipulation methods.
Please be aware that X3D requires a well defined organisation of the scene. If modifying the DOM results in an invalid scene graph, errors result.

## Design

The design is based around the idea that cobweb_dom.js is an optional, thin bridge layer which only requires minimal or no modification to cobweb as a X3D browser. To a large extent it tries to use the external SAI as it is defined for standard conforming X3D browsers.

The overall idea is to use the DOM mutation observer facility to relay changes in the DOM to the X3D scene graph which is internal to cobweb. After creating an initial X3D scene from X3D XML under the X3DCanvas tag, the bridge code installs a mutation observer to catch all changes within a Scene element. Depending on what was changed, then X3D SAI as well as some internal cobweb.js methods are invoked to realize these changes within the parallel scene graph.

A design goal is to keep the code lines count small enough to keep all code in a single file. If the code base grows larger, I would not be able to support development, and it would indicate that there are too many features.

## Usage

See index.xhtml and the examples in tests/ for usage of the code.

## Limitations

Since X3D uses an XML encoding, xhtml encoded web pages are required.

- Most attributes of X3D elements should be controllable. 
- ProtoInstances currently cannot be modified, added or removed.
- Most other X3D nodes can be added or removed.
- Routes cannot be removed. It may be possible to add Routes.
- Manipulation of USE and DEF attributes do not have the desired or any effect.
- Inline: X3D nodes added to the scene graph via a inline node are appended to the inline element and can be manipulated there.
- Script: X3D script nodes require a type='application/x-myscript' attribute. See tests/x3d_script.xhtml. Otherwise they are interpreted by the web browser as dom script nodes. 
- Muliple scenes on a web page can coexist and can be controlled.
- Events: see below

## Events

Event handling currently covers most(all?) sensor events.

Events originate from x3d sensor nodes. This means that the x3d scene has to have such a sensor node (TouchSensor) for any mouse events to be dispatched.

See tests/cobweb_d3.js for an example.

Event type names parallel x3d field names for sensors. The name construction is "x3d" + sensor_type + "_" + x3d event name.

This means the usual events such as 'click' or 'mouseover' are not available. However, there are similar events for x3d sensors albeit with other names (for example x3dTouchSensor_isOver).

The onevent attributes are not available. Use el.addEventListener() instead.

The evt parameter provided to the callback function has these properties:
- detail.value: the value of the x3d field
- detail.name: The DEF name of the sensor node; empty if there is no DEF name.
- detail.fields: an array of al fields of the x3d node with current values
- detail.x3dnode: the x3d node object which originated the event (for advanced use)

The dispatched events do not bubble back up, eg. usually there should be no need to stop propagation. The event listeners should be attached to the Sensor DOM elements.

Needs testing: [Event listeners attached to elements above the sensor element the hierarchy can receive the event. This means if there are multiple sensor (say TouchSensors) below a listener, the listener receives the events from all of the sensors of the type requested (TouchSensors). The detail.name property then can be used to identify which sensor emitted the event.]

To help with attaching listeners to sensors within inlines, a new 'x3dload' event is dispatched on the document target to signal when all inlines per scene are appended to the document.

## TODO

- working on access to Inline scenes: done
- Prototype handling
- allow hook into render loop ?
- allow mutated attributes to be parsed objects, eg. skip parsing; useful if X3D math function are used on native types
- multiple scenes per page: done
- perhaps add onevent properties to DOM nodes.
- adapt more x3dom examples: done inline_reflection, addremoveNodes, jquery
- clean up and organise tests

## Releases

0.4 : support for inline access, multiple scenes, adding child nodes, x3dload event, cobweb > v2.1
