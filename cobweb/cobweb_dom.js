//cobweb-dom access
//load after cobweb.js
$(function(){
console.log('after ready?')

	X3D(function(el){
		var mybrowser = X3D.getBrowser(el);
		//var myscene = mybrowser.createScene(); //probably not needed
		//myx3d = $('Scene')[0];
		var myx3d = document.querySelector('Scene');
		mybrowser.importDocument(myx3d); //now also attached x3dnode property to each node element
		// select the target node
		var target = myx3d;
		X3D.require(
			["cobweb/Parser/XMLParser"],
			function(XMLParser) {
				// create an observer instance
				var observer = new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
					//map attribute to x3dnode field
						console.log(mutation);
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
									parent.set(); // resets value of field to null
									if (isMFNode) {
										gp.addEvent();
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
									else {parent.addEvent();}
									// trigger update event for this field
								}
							}
						}
				  	});
				});
				// configuration of the observer:
				var config = { attributes: true, childList: true, characterData: true, subtree: true };
				// pass in the target node, as well as the observer options
				observer.observe(target, config);
			}
		);
		
		
	});
});