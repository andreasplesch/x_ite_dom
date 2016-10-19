/* -*- Mode: JavaScript; coding: utf-8; tab-width: 3; indent-tabs-mode: tab; c-basic-offset: 3 -*- */

// Cobweb DOM Integration
// Load after cobweb.js

// Make sure X3D is ready, X3DCanvases has all X3DCanvas elements
X3D (function (X3DCanvases)
{
	"use strict"; // Allways use strict!

	X3D .require ([ // perhaps switch to importDocument() to avoid require; but creates new scenes
		"cobweb/Parser/XMLParser"
	],
	function (XMLParser)
	{
		console .info ("Cobweb XHTML DOM integration enabled");

		function DOMIntegration (X3DCanvas)
		{
			this .browser = X3D .getBrowser (X3DCanvas);
		}
	
		DOMIntegration .prototype =
		{
			setup: function ()
			{
				var dom = this .browser .getElement () [0] .querySelector ('Scene'); // avoid jquery to future proof; TODO multiple Scenes
	
				if (dom === null)
					return; // Nothing to do, hm, observer needs to be set up for empty broser as well ..
	
				//mybrowser.importDocument(dom); //now also attached x3d property to each node element
				//update to spec. conforming, latest use
	
				var importedScene = this .browser .importDocument (dom); //now also attached x3d property to each node element
	
				this .browser .replaceWorld (importedScene);
				
				// create an observer instance
				this .observer = new MutationObserver (function (mutations)
				{
					mutations .forEach (function (mutation)
					{
						this .processMutation (mutation);
					},
					this);
				}
				.bind (this));
				
				//start observing, also catches inlined inlines
				this .observer .observe (dom, 
				 	{ attributes: true, childList: true, characterData: false, subtree: true });
	
				// Add internal inline DOMs to document DOM	
				// create LoadSensor for use with Inline nodes.

				this .loadSensor = importedScene .createNode ("LoadSensor") .getValue ();
				
				// Add inline doms from initial scene.
				var inlines = dom .querySelectorAll ('Inline');

				for (var i = 0; i < inlines .length; ++ i)
					this .processInlineDOM (inlines [i]);
				
				//events
				
				//var allSensorNames='TouchSensor','DragSensor'.. // just list all sensors as selector, Anchor!
				//use key in X3D.X3DConstants and match Sensor
				
				// Construct selector

				this .sensorSelector = "Anchor"; // Other special names? (ViewpointGroup has a proxy inside, consider?)

				for (var key in X3D .X3DConstants)
				{
					if (key .endsWith ('Sensor'))
						this .sensorSelector += "," + key;
				}

				var sensors = dom .querySelectorAll (this .sensorSelector);

				for (var i = 0; i < sensors .length; ++ i)
					this .addEventDispatchers (sensors [i]);
			},
			addEventDispatchers: function  (sensor)
			{
				// check for USE sensors; they do not emit events
				if (sensor .x3d === undefined)
					return;
	
				var fields = sensor .x3d .getFields ();
	
				for (var key in fields) 
					this .bindFieldCallback (fields [key], sensor);
			},
			bindFieldCallback: function  (field, sensor)
			{
				/*var ctx = {};
				ctx. field = field;
				ctx. sensor = sensor;*/
				field .addFieldCallback (field .getName (),
					                      this .fieldCallback .bind (null, field, sensor));
			},
			fieldCallback: function  (field, sensor, value)
			{
				//var evt = new Event (field.getName()); // better to use official custom event
	
				var node      = sensor .x3d;
				var prefix    = "x3d";
				var eventType = prefix + sensor.nodeName + "_" + field .getName ();
	
				var event = new CustomEvent (eventType, { 
					detail: {
						value: value,
						fields: node .getFields (),
						name: node .getName (),
						x3d: node
					} 
				});
	
				//event.value = value;
				//event.fields = sensor.x3d.getFields(); // copy ?
				//event.x3d = sensor.x3d; 
				sensor .dispatchEvent (event);
			},
			processRemovedNode: function (element)
			{	
				// Works also for root nodes, as it has to be, since scene.rootNodes is effectively a MFNode in cobweb.
				// All done! Cobweb has to do for routes and such.
				// Also removes ROUTE elements.
				if (element .x3d)	
				{
					element .x3d .dispose ();
					delete element .x3d;
				}
			},
			processAddedNode: function (element, parser)
			{
				// Only process element nodes.
				if (element .nodeType !== Node .ELEMENT_NODE)
					return;
				
				// First need to look for Inline doms to add to dom.
				this .processInlineDOMs (element);
				
				// Do not add to scene if already parsed as child of inline,
				// although Scene does not have .x3d so should never happen?
				if (element .x3d)
				{ 
					if (element .nodeName == 'Inline')
						this .processInlineDOM (element); //only add dom

					return; 
				}
				else if (element .nodeName === 'Scene')
					return;
				
				//create new parser in here to use the correct executioncontext in case of inline
				//how does inline execution context get merged into main execution context ?
				//like this: this = inline node
				/* // eg. nothing needed for non root nodes; .rootNodes needs to be updated if root node added
				this .scene .rootNodes .addInterest (this .group .children_, "setValue");
				this .group .children_ = this .scene .rootNodes;
			
				this .getBrowser () .addBrowserEvent ();


					this .scene .rootNodes .addFieldInterest (this .group .children_); ???
				*/

				var parentNode = element .parentNode;

				// first get correct execution context
				var nodeScene = this .browser .currentScene ; // assume main Scene

				if (parentNode .parentNode .nodeName === 'Inline')
				{
					var nodeScene = parentNode .parentNode .x3d.getInternalScene ();
				}
				else if (parentNode .x3d)
				{
					// Use parent's scene if non-root, works for inline.
					var nodeScene = parentNode .x3d .getExecutionContext ();
				}
				
				parser .pushExecutionContext (nodeScene);
				
				// Then check if root node
				if (parentNode .x3d)
				{
					parser .parseIntoNode (parentNode .x3d, element);
					nodeScene .setup ();
				}
				else
				{
					// Inline or main root node.
					parser .statement (element);
					nodeScene .setup ();
				}
				
				parser .popExecutionContext ();
				
				//parser only adds uninitialized x3d nodes to scene
				//the setup function initializes only uninitialized nodes, but only root nodes ?
				//needed also after inline.setup(), should not hurt to redo if nodeScene = main Scene
				
				this .browser .currentScene .setup (); // Consider a single setup() after all nodes are added.
				
				// now after creating nodes need to look again for Inline doms.
				this .processInlineDOMs (element);

				//then attach event dispatchers
				//if (element .matches (this .sensorSelector)) { this .addEventDispatchers (element); } // matches() not well supported

				if (this .sensorSelector .split (",") .includes (element .nodeName))
					this .addEventDispatchers (elements);

				var sensors = element .querySelectorAll (this .sensorSelector);

				for (var i = 0; i < sensors.length; ++ i)
					this .addEventDispatchers (sensors[i]);
			},
			
			processInlineDOMs: function (element)
			{
				if (element .nodeName == 'Inline')
					this .processInlineDOM (element);

				var inlines = element .querySelectorAll ('Inline'); // or recursive childnodes ?

				for (var i = 0; i < inlines.length; ++ i)
					this .processInlineDOM (inlines [i]);
			},
			
			processInlineDOM: function (element)
			{
				// Check for USE inline as it does not have dom
				if (element .x3d === undefined)
					return;

				var watchList = this .loadSensor .getField ("watchList");

				// Individual callback per inline

				//var callback = this .appendInlineDOM .bind (this, element, watchList .getValue () .slice());
				var callback = this .appendInlineDOM .bind (this, element);

				this .loadSensor .getField ("isLoaded") .addFieldCallback ("loaded" + element .x3d .getId (), callback);

				//just add to loadsensor watchlist; triggers isLoaded event after loading
				watchList .push (element .x3d);
			},
			appendInlineDOM: function (element, loaded)
			{
				// Now loaded and in .dom
				// Inline must have Scene
				var
					node      = element .x3d,
					watchList = this .loadSensor .getField ("watchList"),
					isLoaded  = this .loadSensor .getField ("isLoaded");

				// XXX: node .dom .querySelector ('Scene') is always null, probably node .getInternalScene () .dom?
				element .appendChild (node .dom .querySelector ('Scene')) ; // XXX: or root nodes? HO: Think, Scene is better.

				//not needed any more, remove callback
				isLoaded .removeFieldCallback ("loaded" + node .getId ());

				// Remove from watchlist
				// Restore passed, original watchlist

				var wListUpdate = watchList .getValue () .filter ( 
					function (value) { return value .getValue () !== node; }
				);

				watchList .setValue (wListUpdate);

				//check if all inlines are appended and dispatch event; would be also dispatched later whenever
				if (element .querySelector ('Inline') === null)
				{
					// also check loadCount ?

					var event = new Event ("x3dload");

					// new Event("X3Dload")); // or so, add .browser = browser ?
					event .element = this .browser .getElement ();

					document .dispatchEvent (event);

					console .log (event);
				}
				
				// Attach sensor callbacks.
				// Create processSensor, and use initially and here.

				var sensors = element .querySelectorAll (this .sensorSelector);

				for (var i = 0; i < sensors .length; ++ i)
					this .addEventDispatchers (sensors [i]);

				// Any inlines in appended dom are picked up when Scene is a addedNode for Mutations
			},
			processAttributes: function (mutation, element, parser)
			{
				var attributeName = mutation .attributeName; // TODO: check if mutation can have multiple changed attributes

				this .processAttribute (attributeName, element, parser)
			},
			processAttribute: function (attributeName, element, parser)
			{
				var attribute = element .attributes .getNamedItem (attributeName);

				parser .attribute (attribute, element .x3d); //almost there

				//only underscore gets update
				var field = element .x3d .getField (attributeName);

				field .addEvent (); // set_field event, updates real property
				//may not work for Routes, check
			},
			processMutation: function (mutation)
			{
				var
					element = mutation .target,
					parser  = new XMLParser (this .browser .currentScene);
				
				switch (mutation .type)
				{
					case "attributes":
					{
						try
						{
							this .processAttributes (mutation, element, parser);
						}
						catch (error)
						{
							// Unknown attriute.
						}
		
						break;
					}
					case "childList":
					{					
						var addedNodes = mutation.addedNodes;
	
						for (var i = 0; i < addedNodes.length; ++ i)
							this .processAddedNode (addedNodes[i], parser);
		
						var removedNodes = mutation .removedNodes;
	
						for (var i = 0; i < removedNodes .length; ++ i)
							this .processRemovedNode (removedNodes[i]);
	
						break;
					}
				}
			},
		};

		var integrations = [ ];

		// Go through all passed x3dcanvas elements.
		for (var i = 0; i < X3DCanvases .length; ++ i)
		{
			var integration = new DOMIntegration (X3DCanvases [i]);

			integration .setup ();
			
			integrations .push (integration);
		}
	});
});
