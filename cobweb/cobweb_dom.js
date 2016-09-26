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
	//attach fieldcallbacks to new sensor nodes
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
				
				var removedNodes = mutation.removedNodes;
				for (var i = 0; i < removedNodes.length; i++) {
					processRemovedNode(removedNodes[i]);
				}
			}
		}
	);
}
		
var mybrowser = X3D.getBrowser(el);
var myx3d = document.querySelector('Scene'); // avoid jquery to future proof; TODO multiple Scenes
mybrowser.importDocument(myx3d); //now also attached x3dnode property to each node element

//add internal inline DOMs to document DOM before starting to observe mutations.

//browser has attached LoadSensor
var loadsensor = mybrowser.getLoadSensor();
//use isLoaded field to detect when all inlines are loaded
//actually does not sense inlines by default
var isLoadedField = loadsensor.getField("isLoaded");
isLoadedField.addFieldCallback("isLoaded", appendInternalDoms);

function appendInternalDoms (isLoadedValue) {
	//still need to wait a bit since Loader has a bit of a timeout for async
	//importDocument for some reason
	var TIMEOUT = 1000; // 17 for importDocument
	setTimeout (function() {
		if (isLoadedValue) { //probably better to also try if isLoaded = false
			var inlines = document.querySelectorAll('Inline');
			for (var i = 0; i < inlines.length; i++) {
				var iEl = inlines[i];
				//var lF = iEl.x3dnode.getField('load');
				//lF.setValue(true);
				//iEl.x3dnode.requestImmediateLoad();
				//are loaded async, so not yet available ?
				if (iEl.x3dnode.dom)
					iEl.appendChild(iEl.x3dnode.dom.querySelector('Scene'));
			}
			//remove FieldCallback
			//start observing here
		}
	}, TIMEOUT);
}
		
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
//var allSensorNames='TouchSensor','DragSensor'.. // just list all sensors as selector, Anchor!
//use key in X3D.X3DConstants and match Sensor

//construct selector
var selector = "Anchor"; // other special names ?
for (var key in X3D.X3DConstants) {
	if (key.endsWith('Sensor')) {selector += "," + key;}
}

var sensors = myx3d.querySelectorAll(selector); //TODO any kind of Sensor
for (var i=0; i < sensors.length; i++) {
	var sensor = sensors[i];
	//var x3dsensor = sensor.x3dnode ;
	var fields = sensor.x3dnode.getFields();
	for (var key in fields) {bindFieldCallback(fields[key], sensor)};
}
function bindFieldCallback (field, sensor) {
	/*var ctx = {};
	ctx. field = field;
	ctx. sensor = sensor;*/
	field.addFieldCallback(
		field.getName(),
		fieldcallback.bind(null, field, sensor));
}
		
function fieldcallback (field, sensor, value){
	//var evt = new Event(field.getName()); // better to use official custom event
	var node = sensor.x3dnode;
	var prefix = "x3d";
	var event_type = prefix + sensor.nodeName + "_" + field.getName();
	var evt = new CustomEvent(event_type, { 
		detail: {
			value: value,
			fields: node.getFields(),
			name: node.getName(),
			x3dnode: node
		} 
	});
	//evt.value = value;
	//evt.fields = sensor.x3dnode.getFields(); // copy ?
	//evt.x3dnode = sensor.x3dnode; 
	sensor.dispatchEvent(evt);
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
