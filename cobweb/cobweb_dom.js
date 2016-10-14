//cobweb-dom access
//load after cobweb.js
$(function(){ // make sure jquery is ready 
	X3D(function(el){ // make sure X3D is ready, el has all x3d elements

//go through all passed x3dcanvas elements
for (i = 0; i < el.length; ++i) {
	relayDOM(el[i]);
}

function relayDOM (el) {
			
function processRemovedNode(removedEl){	
	
	// remove ROUTE
	if ( removedEl.nodeName == 'ROUTE' ) {
		//use more convenient browser.deleteRoute(), SAI onlyhas  deleteRoute(route)
		//ideally just removedEl.x3dRoute.getScene().deleteRoute(removedEl.x3dRoute);
		var
			sourceNodeName      = element .getAttribute ("fromNode"),
			sourceField         = element .getAttribute ("fromField"),
			destinationNodeName = element .getAttribute ("toNode"),
			destinationField    = element .getAttribute ("toField");
		//only for Routes in the main scene, not inlines
		// for inline routes, best to save route in el.x3droute property for easy later access
		var
			sourceNode      =  mybrowser.currentScene.getLocalNode (sourceNodeName),
			destinationNode =  mybrowser.currentScene.getLocalNode (destinationNodeName);

		mybrowser.deleteRoute (sourceNode, sourceField, destinationNode, destinationField);
		return;
	}
		
	removedEl.x3dnode.dispose(); // works also for root nodes since scene is effectively a MFNode in cobweb
	// all done! cobweb has TODO for Routes and such
}

function processAddedNode(addedEl, parser, mybrowser) {
	//only process element nodes
	if ( addedEl.nodeType !== Node.ELEMENT_NODE ) { return; }
	
	//first need to look for Inline doms to add to dom
	if (addedEl.nodeName == 'Inline') { processInlineDOM (addedEl); }
	var inlines = addedEl.querySelectorAll('Inline') ; // or recursive childnodes ?
	for ( var i = 0; i < inlines.length; i++ ) {
		processInlineDOM(inlines[i]) ;
	}
	
	//do not add to scene if already parsed as child of inline
	//although Scene does not have .x3dnode so should never happen ?
	if ( addedEl.xdnode || addedEl.nodeName == 'Scene' ) { 
		if (addedEl.nodeName == 'Inline') { processInlineDOM (addedEl); } //only add dom
		return; 
	}
	
	var parent = addedEl.parentNode;
	if ( parent.x3dnode ) { 
		var pnode = parent.x3dnode;
		parser.pushParent( pnode );
		parser.statement(addedEl);
		//still need to set Value
		var fieldName = addedEl.getAttribute("containerField"); // check for invalid names ?
		if (fieldName === null) {
			fieldName = addedEl.x3dnode.getContainerField ();
		}
		var field = parent.x3dnode.getField (fieldName);
		
		field.setValue(addedEl.x3dnode);
		parser.popParent();
	} // else leave parser.parents empty for root nodes
	else {	
		parser.statement(addedEl); 
	}
	//parser only adds uninitialized x3d nodes to scene
	//the setup function initializes only uninitialized nodes, but only root nodes ?
	mybrowser.currentScene.setup(); // consider a single setup() after all nodes are added
	
	//then attach event dispatchers
	//if (addedEl.matches(sensorSelector)){ addEventDispatchers(addedEl); } // matches() not well supported
	if(sensorSelector.split(",").includes(addedEl.nodeName)){ addEventDispatchers(addedEl); }
	var sensors = addedEl.querySelectorAll(sensorSelector);
	for (var i=0; i < sensors.length; i++) {
		var sensor = sensors[i];
		addEventDispatchers(sensor);
	}
	
}
		
function processInlineDOM (element) {
	// check for USE inline as it does not have dom
	if (element.x3dnode === undefined) { return; }
	// individual callback per inline
	//var callback = appendInlineDOM.bind(this, element, wList.getValue().slice()) ;
	var callback = appendInlineDOM.bind(this, element) ;
	isLoadedField.addFieldCallback("loaded" + element.x3dnode.getId(), callback) ;
	//just add to loadsensor watchlist; triggers isLoaded event after loading
	wList.push(element.x3dnode);
	
	return;
}
		
//function appendInlineDOM (element, wListValue, isLoadedValue) {
function appendInlineDOM (element, isLoadedValue) {
	//now loaded and in .dom
	//Inline must have Scene
	var node = element.x3dnode;
	element.appendChild(node.dom.querySelector('Scene')) ; // or root nodes ?
	//not needed any more, remove callback
	isLoadedField.removeFieldCallback("loaded" + node.getId()) ;
	//remove from watchlist
	// restore passed, original watchlist
	//wList.setValue(wListValue) ; // seems to work
	// instead look for node and remove it
	var wListUpdate = wList .getValue() .filter( 
		function(val) { return val .getValue() !== node ; }
		);
	wList .setValue(wListUpdate);
	//check if all inlines are appended and dispatch event; would be also dispatched later whenever
	if (wListUpdate.length === wList0.length && element.querySelector('Inline') === null) { // also check loadCount ?
		var evt = new Event("x3dload");
		evt.element = mybrowser.getElement();
		document.dispatchEvent(evt);
		console.log(evt);
	}
	//    new Event("X3Dload")); // or so, add .browser = browser ?
	//}
	
	//attach sensor callbacks
	//create processSensor, and use initially and here
	var sensors = element.querySelectorAll(sensorSelector);
	for (var i=0; i < sensors.length; i++) {
		var sensor = sensors[i];
		addEventDispatchers(sensor);
	}

	//any inlines in appended dom are picked up when Scene is a addedNode for Mutations
	return;
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
var myx3d = el.querySelector('Scene'); // avoid jquery to future proof; TODO multiple Scenes
if (myx3d === null) { return; } // if src or url was used
//mybrowser.importDocument(myx3d); //now also attached x3dnode property to each node element
//workaround to bind bindable nodes such as Viewpoint after importDocument() and loading of all inlines
//update to spec. conforming, latest use
var importScene = mybrowser.importDocument(myx3d); //now also attached x3dnode property to each node element
//var importScene = mybrowser.currentScene;
mybrowser.replaceWorld(importScene);

// create an observer instance
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		processMutation(mutation, mybrowser);
	});
});
		
//add internal inline DOMs to document DOM before starting to observe mutations.
		
//browser has attached LoadSensor; setup for use with inlines
var loadsensor = mybrowser.getLoadSensor();
var wList = loadsensor.getField('watchList'); // is used to detect when inline is loaded
var wList0 = wList.getValue();
var isLoadedField = loadsensor.getField("isLoaded"); // is used to add callbacks to

// configuration of the observer:
var config = { attributes: true, childList: true, characterData: false, subtree: true };
// pass in the target node, as well as the observer options
var target = myx3d ; // document.querySelector('Scene'); // reget target
observer.observe(target, config); //start observing only after DOM is fully populated

//events

//var allSensorNames='TouchSensor','DragSensor'.. // just list all sensors as selector, Anchor!
//use key in X3D.X3DConstants and match Sensor

//construct selector
var sensorSelector = "Anchor"; // other special names ?
for (var key in X3D.X3DConstants) {
	if (key.endsWith('Sensor')) {sensorSelector += "," + key;}
}

//add inline doms from initial scene
var inlines = myx3d.querySelectorAll('Inline');
for (var i = 0; i < inlines.length; i++) {
	processInlineDOM(inlines[i]);
}

var sensors = myx3d.querySelectorAll(sensorSelector);
for (var i=0; i < sensors.length; i++) {
	var sensor = sensors[i];
	addEventDispatchers(sensor);
}

function addEventDispatchers (sensor) {
	if (sensor.x3dnode === undefined) { return; } // check for USE sensors; they do not emit events
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

}

});
});

