//cobweb-dom access
//load after cobweb.js
$(function(){ // make sure jquery is ready 
	X3D(function(el){ // make sure X3D is ready

function processRemovedNode(removedEl){
	
	removedEl.x3dnode.dispose(); // works also for root nodes since scene is effectively a MFNode in cobweb
	// all done! cobweb has TODO for Routes and such
}

function processAddedNode(addedEl, parser, mybrowser) {
	parser.statement(addedEl);
	//parser only adds uninitialized x3d nodes to scene
	//the setup function initializes only uninitialized nodes
	mybrowser.currentScene.setup(); // consider a single setup() after all nodes are added
}

function processAttributes(mutation, el, parser){
	var name = mutation.attributeName; // TODO: check if mutation can have multiple changed attributes
	var attribute = el.attributes.getNamedItem(name);
	parser.attribute(attribute, el.x3dnode); //almost there
	//only underscore gets update
	var field = el.x3dnode.getField(name);
	field.addEvent(); // set_field event, updates real property
	//may not work for Routes, check
}

function processMutation(mutation, mybrowser) {
	X3D.require(
		["cobweb/Parser/XMLParser"], // needed for attributes and new nodes
		function(XMLParser) {
					var el = mutation.target;
					var parser = new XMLParser (mybrowser.currentScene, el);
					if (mutation.type == 'attributes') {
						processAttributes(mutation, el, parser);
						}
					if (mutation.type == 'childList') {
						var addedNodes = mutation.addedNodes;
						for (var i = 0; i < addedNodes.length; i++) {
							processAddedNode(addedNodes[i], parser, mybrowser);
						}
						
						//forEach removedNodes: TODO
						var removedNodes = mutation.removedNodes;
						for (var i = 0; i < removedNodes.length; i++) {
							processRemovedNode(removedNodes[i]);
						}
						/*
						var removedEl = mutation.removedNodes[0];
						if (removedEl) {
							processRemovedNode(removedEl)
						}
						*/
					}
		}
	);
}
		
var mybrowser = X3D.getBrowser(el);
var myx3d = document.querySelector('Scene'); // avoid jquery to future proof; TODO multiple Scenes
mybrowser.importDocument(myx3d); //now also attached x3dnode property to each node element
// select the target node
var target = myx3d;
// create an observer instance
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		processMutation(mutation, mybrowser);
	});
});
// configuration of the observer:
var config = { attributes: true, childList: true, characterData: false, subtree: true };
// pass in the target node, as well as the observer options
observer.observe(target, config); //start observing

//events
var sensors = myx3d.querySelectorAll('TouchSensor'); //TODO any kind of Sensor
var x3dsensor = sensors[0].x3dnode ;
var fields = x3dsensor.getFields();
for (var key in fields) {doFieldCallback(fields[key])};
function doFieldCallback (field) {
	field.addFieldCallback(field.getName(),
	function fieldcallback (value){
		var evt = new Event(field.getName());
		evt.value = value;
		evt.fields = x3dsensor.getFields(); // copy ?
		evt.x3dnode = x3dsensor; 
		sensors[0].dispatchEvent(evt);
	});
}
});
});


//define callbacks for all fields in all sensor nodes
//find all sensor nodes by looking for isActive field ?
//or just match Sensor in name of elements ?
//then go through all (relevant?) fields
//getFields().forEach
//and define callbacks
//field.addCallback('callback'+fieldname, callbackfunction)
//function callbackfunction(eventvalue) {
	// now dispatch dom event with name fieldname
	// and provide eventvalue
	// plus useful other fieldvalues
	// get parent of field: field.getParents()
	// key in parents
	// or x3dnode from sensor element if in scope
	// return {value: eventvalue; fields: x3dnode.getFields()}
	//first mak new event
	//ev = new Event(fieldname)
	//add properties
	//ev.value = eventvalue
	//ev.fields = x3dnode.getFields()
	//ev.x3dnode = x3dnode
	//then dispatch
	//element.dispatch(Event)
	// then it should be possible to use Eventlistener
