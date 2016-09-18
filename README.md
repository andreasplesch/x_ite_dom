# cobweb_dom

## Summary

cobweb_dom.js is intended to be used with the cobweb X3D browser cobweb.js (create3000/cobweb). cobweb_dom links the X3D DOM nodes to the X3D scene graph and thereby allows for control of the X3D scene using regular DOM manipulation methods.
Please be aware that X3D requires a well defined organisation of the scene. If modifying the DOM results in an invalid scene graph, errors result.

## Usage

See the example index.xhtml page for usage of the code.

## Limitations

Since X3D uses an XML encoding, xhtml encoded web pages are required.

- Most attributes of X3D elements should be controllable. 
- ProtoInstances currently cannot be modified, added or removed.
- Most other X3D nodes can be added or removed.
- Routes cannot be removed. It may be possible to add Routes.
- Inline: X3D nodes added to the scene graph via a inline node cannot be accessed since they are not part of the DOM.
- Script: X3D script nodes are interpreted by the web browser as dom script nodes; cobweb will execute them in parallel as x3d scripts. 
- Only the first scene on a web page can be controlled.
- Events: see below

## Events

Event handling is currently limited to TouchSensor (similar to DOM mouse events).

See index.xhtml for an example.

Events originate from x3d sensor nodes. This means that the x3d scene has to have such a sensor node (TouchSensor) for any mouse events to be dispatched.

Event names parallel x3d field names for sensors. This means the usual events such as 'click' or 'mouseover' are not available. However, there are similar events for x3d sensors albeit with other names.

The onevent attributes are not available. Use el.addEventListener() instead.

The evt parameter provided to the callback function has these properties:
- .value: the value of the x3d field
- .fields: an array of al fields of the x3d node with current values
- .x3dnode: the x3d node object which originated the event (for advanced use)




