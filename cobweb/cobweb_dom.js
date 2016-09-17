//cobweb-dom access
//load after cobweb.js
	function processMutation(mutation, mybrowser) {
		X3D.require(
			["cobweb/Parser/XMLParser"], // needed for attributes
			function(XMLParser) {
						//map attribute to x3dnode field
						//console.log(mutation);
						var el = mutation.target;
						var parser = new XMLParser (mybrowser.currentScene, el);
						if (mutation.type == 'attributes') {
							//attributes
							var name = mutation.attributeName;
							var attribute = el.attributes.getNamedItem(name);
							var val  = el.attributes.getNamedItem(name).value ;
							parser.attribute(attribute, el.x3dnode);//almost there
							//only underscore gets update
							var field = el.x3dnode.getField(name);
							field.addEvent(); // set_field event
							//el.x3dnode[name] = val.split(" ");
							}
						if (mutation.type == 'childList') {
							//elements
							//parser.statement (el) should work for all new nodes
							//forEach addedNodes
							var addedEl = mutation.addedNodes[0];
							if (addedEl) {
								parser.statement(addedEl);
								//parser only adds uninitialized x3d nodes to scene
								//the setup function initializes only uninitialized nodes
								mybrowser.currentScene.setup();
							}
							//forEach removedNodes
							//removedNodes still has the removed nodes
							//probably best to find parent
							//
							//or find correct field in parent and emit set event like above
							//
							var removedEl = mutation.removedNodes[0];
							if (removedEl) {
								var parents = removedEl.x3dnode.getParents(); //parent should be field in parent node
								//deal with root nodes TODO
								for (var key in parents) { // only way to find property in parents object
									var parent = parents[key];
									//SFNode field or member of MFNode field or rootNode?
									var grandparents = parent.getParents();
									for (var k2 in grandparents){
										var gp = grandparents[k2];
										if (gp.getTypeName == 'MFNode') {
											var isMFNode = true;
											if (gp.getName = 'rootNodes') {
												var isRootNode = true;
											}
										}
									}
									parent.setValue(null); // resets value of field to null
									if (isMFNode) {
										//gp.addEvent();
										if (isRootNode) { // also remove from rootnodes
											var rootNodes = mybrowser.currentScene.getRootNodes();
											//find in array
											for (var key in parents) { // look through all parents
												parent = parents[key];
												var i = rootNodes.indexOf(parent);
												if (i !== -1) { break } // found it
											}																											
											rootNodes.splice(i,1); 
										}
									}
									else {
										//parent.addEvent();
										
									}
									// trigger update event for this field
								}
							}
						}
			}
		);
	}
		
$(function(){ // make sure jquery is ready 
	X3D(function(el){ // make sure X3D is ready
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
				var config = { attributes: true, childList: true, characterData: true, subtree: true };
				// pass in the target node, as well as the observer options
				observer.observe(target, config);
			}
		);
		//events
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
		var sensors = myx3d.querySelectorAll('TouchSensor');
		var x3dsensor = sensors[0].x3dnode ;
		var fields = x3dsensor.getFields();
		for (var key in fields) {doFieldCallback(fields[key])};
		function doFieldCallback (field) {
			field.addFieldCallback(field.getName(),
			function fieldcallback (value){
				var evt = new Event(field.getName());
				evt.value = value;
				evt.fields = x3dsensor.getFields(); // copy ?
				evt.x3dnode = x3dsensor
				sensors[0].dispatchEvent(evt);
			});
		}
});

