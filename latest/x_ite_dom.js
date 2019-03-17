/* -*- Mode: JavaScript; coding: utf-8; tab-width: 3; indent-tabs-mode: tab; c-basic-offset: 3 -*- */

// X_ITE DOM Integration
// Load after x_ite.js

// Make sure X3D is ready.

X3D (function ()
{
	"use strict"; // Always use strict!

	X3D .require ([ // perhaps switch to importDocument() to avoid require; but creates new scenes
		"x_ite/Parser/XMLParser"
	],
	function (XMLParser)
	{
		console .info ("X_ITE XHTML DOM integration enabled");

		function DOMIntegration (X3DCanvas)
		{
			this .browser = X3D .getBrowser (X3DCanvas);
			this .browser .trace = X3DCanvas .attributes .getNamedItem('trace');
		}
	
		DOMIntegration .prototype =
		{
			preprocessScripts: function (dom)
			{
				var scripts = dom .querySelectorAll ('script');
				for (var i = 0, length = scripts. length; i < length; ++i)
					this .appendScriptChildren(scripts[i]);
				return dom;
			},
			
			appendScriptChildren: function (script)
			{
				var domParser = new DOMParser();
				var scriptDoc = domParser .parseFromString (script. outerHTML, 'application/xml');
				var scriptNodes = scriptDoc .children[0] .childNodes;
				script .textContent = '// content moved into childNodes';  
				for (var i = 0, length = scriptNodes .length; i < length; ++i)
					script.appendChild(scriptNodes[0]);	
			},
			
			setup: function ()
			{				
				//this .trace = this .browser .getElement () [0] .attributes .getNamedItem('trace');
				var dom = this .browser .getElement () [0] .querySelector ('X3D'); // avoid jquery to future proof; TODO multiple Scenes
				
				if (dom === null)
					return; // Nothing to do, hm, observer needs to be set up for empty browser as well ..
				
				//preprocess script nodes if not xhtml
				
				if (!document.URL.toLowerCase().includes('xhtml'))
					this .preprocessScripts(dom);

				//now also attached x3d property to each node element
				var onAfterImport = function (importedScene)
				{
					this .browser .replaceWorld (importedScene);

					this .loadSensor = importedScene .createNode ("LoadSensor") .getValue ();

					//events
					this .addEventDispatchersAll (dom); //has to happen after reimporting since dom.x3d
	
					// create an observer instance
					this .observer = new MutationObserver (function (mutations)
					{
						this. prepareMutations (mutations);
						mutations .forEach (function (mutation)
						{
							this .processMutation (mutation, new XMLParser (importedScene));
						},
						this);
					}
					.bind (this));
					
					//start observing, also catches inlined inlines
					this .observer .observe (dom, 
					 	{ attributes: true, childList: true, characterData: false, subtree: true, attributeOldValue: true });
	
					// Add internal inline DOMs to document DOM	
					// create LoadSensor for use with Inline nodes.

					//this .loadSensor = this .importedScene .createNode ("LoadSensor") .getValue ();
					
					// Add inline doms from initial scene.
					var inlines = dom .querySelectorAll ('Inline');

					for (var i = 0, length = inlines. length; i < length; ++i)
						this .processInlineDOM (inlines [i]);
				};

				var onError = function (error)
				{
					console .log ("Error importing document:", error);
				};
				
				this .browser .importDocument (dom, onAfterImport .bind(this), onError);
			},
			
			prepareMutations: function (mutations)
			{
				// in case of mutations affecting the same element-attribute
				// add .value by using oldValue of the next mutations
				var mutation, element, attributeName, value, i, j, length;
				for ( i = 0, length = mutations .length; i < length; ++i)
				{
					mutation = mutations[i];
					if ( mutation .type !== 'attributes' )  continue ;
					element = mutation .target;
					attributeName = mutation .attributeName;
					value = element .attributes .getNamedItem (attributeName) .value; //assume current
					for ( j = i + 1; j < length; ++j)
					{
						var futureMutation = mutations[j];
						if ( element === futureMutation .target 
						    && attributeName === futureMutation .attributeName )
						{
							value = futureMutation .oldValue;
							break;
						}
					}
					mutation .value = value;
				}
			},
			
			addEventDispatchersAll: function (element)
			{
				var elements = element.querySelectorAll('*');
				for (var i = 0, length = elements .length; i < length; ++i)
					this. addEventDispatchers (elements [i]);
			},
			
			addEventDispatchers: function (element)
			{
				// check for USE nodes; they do not emit events
				if (element .x3d === undefined)
					return;
	
				if (element .nodeName === 'ROUTE')
					return;

				var fields = element .x3d .getFields ();
	
				for (var key of fields .keys()) //fields now Map 
					this .bindFieldCallback (fields .get (key), element);
			},
			
			bindFieldCallback: function  (field, element)
			{
				/*var ctx = {};
				ctx. field = field;
				ctx. sensor = sensor;*/
				//only attach callbacks for output fields
				if (field. isOutput()) // both inputOutput and outputOnly
				{
					field .addFieldCallback (
						"DomIntegration." + field .getId (),
						this .fieldCallback .bind (null, field, element));
					if (element. x3d .getBrowser() .trace)
						field .addFieldCallback (
							"DomIntegrationTracer." + field .getId (),
							this .fieldTraceCallback .bind (null, field, element .x3d));
				}		
			},
			
			fieldCallback: function  (field, element, value)
			{
				//var evt = new Event (field.getName()); // better to use official custom event
	
				var node      = element .x3d;
				var prefix    = "x3d";
				//var eventType = prefix + element.nodeName + "_" + field .getName ();
				var eventType = prefix + "_" + field .getName ();

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
				element .dispatchEvent (event);
			},
			
			fieldTraceCallback: function  (field, node, value)
			{
				var now = performance.timing.navigationStart + performance.now();
				var timeStamp = node .getBrowser () .getCurrentTime ();
				var dt = now - timeStamp * 1000;
				console .log ( "%f: at %f dt of %s ms %s '%s' %s: %s", 
					      now, timeStamp, dt.toFixed(3), 
					      node .getTypeName (), node .getName(),
					      field .getName(), value );
			},
			
			processRemovedNode: function (element)
			{	
				// Works also for root nodes, as it has to be, since scene.rootNodes is effectively a MFNode in x-ite.
				// Also removes ROUTE elements.
				if (element .x3d)	
				{
					element .x3d .dispose ();
					if (element .nodeName === 'ROUTE') // dispatcher still needs .x3d when dispose processes events  
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
					if (element .nodeName === 'Inline' || element .nodeName === 'INLINE' )
						this .processInlineDOM (element); //only add dom

					return; 
				}
				else if (element .nodeName === 'Scene' || element .nodeName === 'SCENE')
					return;
				
				var parentNode = element .parentNode;

				// first get correct execution context
				var nodeScene = this .browser .currentScene ; // assume main Scene

				if 
				(
					parentNode .parentNode .nodeName === 'Inline' ||
			   		parentNode .parentNode .nodeName === 'INLINE'
				)
				{
					var nodeScene = parentNode .parentNode .x3d .getInternalScene ();
				}
				else if (parentNode .x3d)
				{
					// Use parent's scene if non-root, works for inline.
					var nodeScene = parentNode .x3d .getExecutionContext ();
				}
				
				parser .pushExecutionContext (nodeScene);
				
				// then check if root node
				if (parentNode .x3d)
				{
					//parser .parseIntoNode (parentNode .x3d, element);
					var node = parentNode .x3d ;
					//parser .pushExecutionContext (node .getExecutionContext ());
					parser .pushParent (node);
					var isProtoInstance = 	parentNode .nodeName === 'ProtoInstance' ||
					    			parentNode .nodeName === 'PROTOINSTANCE';
					
					parser .childElement (element); //, isProtoInstance);

					parser .popParent ();
					//parser .popExecutionContext ();
					//nodeScene .setup ();
				}
				else
				{
					// Inline or main root node.
					parser .childElement (element);
					//nodeScene .setup ();
				}
				
				parser .popExecutionContext ();
				nodeScene .setup ();
				//parser only adds uninitialized x3d nodes to scene
				//the setup function initializes only uninitialized nodes, but only root nodes ?
				//needed also after inline.setup(), should not hurt to redo if nodeScene = main Scene
				
				this .browser .currentScene .setup (); // Consider a single setup() after all nodes are added.
				
				// now after creating nodes need to look again for Inline doms.
				this .processInlineDOMs (element);

				//then attach event dispatchers
				//if (element .matches (this .sensorSelector)) { this .addEventDispatchers (element); } // matches() not well supported
				
				this. addEventDispatchers (element);
				this. addEventDispatchersAll (element); // also for childnodes	
			},
			
			processInlineDOMs: function (element)
			{
				if (element .nodeName === 'Inline' || element .nodeName === 'INLINE')
					this .processInlineDOM (element);

				var inlines = element .querySelectorAll ('Inline'); // or recursive childnodes ?

				for (var i = 0, length = inlines .length; i < length; ++ i)
					this .processInlineDOM (inlines [i]);
			},
			
			processInlineDOM: function (element)
			{
				// Check for USE inline as it does not have dom
				if (element .x3d === undefined)
					return;

				var watchList = this .loadSensor .getField ("watchList");

				// Individual callback per inline

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

				element .appendChild (node .dom .querySelector ('Scene')) ; // XXX: or root nodes? HO: Think, Scene is better.

				//not needed any more, remove callback
				isLoaded .removeFieldCallback ("loaded" + node .getId ());

				// Remove from watchlist
				
				var wListUpdate = watchList .getValue () .filter ( 
					function (value) { return value .getValue () !== node; }
				);

				watchList .setValue (wListUpdate);

				//check if all inlines are appended and dispatch event; 
				//would be also dispatched later whenever a new inline was completely appended
				if (element .querySelector ('Inline') === null) // no more internal inlines
				{
					// also check loadCount ?

					var event = new Event ("x3dload");

					// new Event("X3Dload")); // or so, add .browser = browser ?
					event .element = this .browser .getElement ();

					document .dispatchEvent (event);
				}
				
				// Attach dom event callbacks.
				this .addEventDispatchersAll (element); 
			},
			
			processAttribute: function (mutation, element, parser)
			{
				var attributeName = mutation .attributeName;
				var attribute = element .attributes .getNamedItem (attributeName) .cloneNode(); // clone to avoid mutation observation
				
				attribute .value = mutation .value ; // mutation .value is custom;
				
				if (element .x3d)
				{ // is a field
					parser .nodeAttribute (attribute, element .x3d); //almost there

					//only underscore gets update
					var field = element .x3d .getField ( parser .attributeToCamelCase (attributeName) ); //containerField is not a field, check for it?

					field .addEvent (); // set_field event, updates real property
					this .browser .processEvents(); // necessary for multiple mutations
				}
				else
				{ // is an attribute of non-node child such as fieldValue (or ROUTE)
					var parentNode = element .parentNode; //should always be a node (?)
					var node = parentNode .x3d; // need to attach .x3d to ProtoInstance
					var nodeScene = node .getExecutionContext ();
					parser .pushExecutionContext (node .getExecutionContext ());
					parser .pushParent (node);
					
					var isProtoInstance = 	parentNode .nodeName === 'ProtoInstance' ||
					    			parentNode .nodeName === 'PROTOINSTANCE';
					// may need to try..catch in case "name" field does not exist
					parser .childElement (element); //, isProtoInstance);
					
					parser .popParent ();
					parser .popExecutionContext ();
					if (isProtoInstance)
					{
						var field = node .getField (element .getAttribute ("name"));
					    	field .addEvent ();
					}
				}
			},
			
			processMutation: function (mutation, parser)
			{
				var element = mutation .target;
					
				switch (mutation .type)
				{
					case "attributes":
					{
						try // performance hit for animations ?
						{
							this .processAttribute (mutation, element, parser);
						}
						catch (error)
						{
							// Unknown attribute.
						}
		
						break;
					}
					case "childList":
					{					
						var addedNodes = mutation.addedNodes;
	
						for (var i = 0; i < addedNodes .length; ++ i)
							this .processAddedNode (addedNodes[i], parser);
		
						var removedNodes = mutation .removedNodes;
	
						for (var i = 0; i < removedNodes .length; ++ i)
							this .processRemovedNode (removedNodes[i]);
	
						break;
					}
				}
			},
		};

		var
			X3DCanvases  = document.querySelectorAll("X3DCanvas"),
			integrations = [ ];

		// Go through all passed x3dcanvas elements.
		for (var i = 0, length = X3DCanvases .length; i < length; ++ i)
		{
			var integration = new DOMIntegration (X3DCanvases [i]);

			integration .setup ();
			
			integrations .push (integration);
		}
	});
});
