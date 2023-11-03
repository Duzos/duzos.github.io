/* ===================================================================================================
* WARNING – This file is part of the base implementation for WebMaker, so it should not be edited or changed for any project.
* These files are replaced if a project is re-imported to the WebMaker Studio or migrated to a new version of the product.
* For guidance on 'How do I override or clone Hyfinity webapp files such as CSS & javascript?', please read the following relevant FAQ entry:
* http://www.hyfinity.net/faq/index/solution_id/1113
==================================================================================================== */

/*
 * DisplayUtils.js
 *
 * Utility functions for altering the display of HTML components from javascript
 *
 * Company: Hyfinity Ltd
 * Copyright (c) 2003
 */


if (typeof(dojo) != 'undefined')
{
    dojo.require("dojo.parser");
    dojo.require("dojo.fx");
    dojo.require("dojo.on");
}


/**
 * Root object to contain all hyfinity functions.
 * This should remove the chance of a name conflict with other functionality.
 * @private
 *
 */
var hyf =
{
    version: '2.0',
    pageLoaded: false,
    afterLoadOnLoadFunctions: {}
};

/**
 * Attaches the specified function to be called when the specified event occurs on the given object.
 * This removes the need to worry about browser complexities from the main code.
 * For now we delegate to dojo to handle this for us if possible.
 *
 * @param object {object) The object to attach the event to
 * @param event {string} Specifies the actual event that the function should be called for e.g. 'onclick'
 * @param func {function} The function that should be called when this event occurs.
 * @return An object that should be passed to detachEventHandler if you wish to remove this event handler.
 * @author Hyfinity Limited
 */
hyf.attachEventHandler = function(object, event, func)
{
    if (event.indexOf('on') != 0)
        event = 'on' + event;

    if ((object == window) && (event.indexOf('onload') == 0) && (hyf.pageLoaded))
    {
        if (event.indexOf('-') != -1)
        {
            var identifier = event.substr(event.indexOf('-') + 1);

            if (!hyf.afterLoadOnLoadFunctions[identifier])
                hyf.afterLoadOnLoadFunctions[identifier] = new Array();

            hyf.afterLoadOnLoadFunctions[identifier].push(func)
        }
        else
            func();

        return;
    }
    if (event.indexOf('onload') == 0) event = 'onload';

    //use dojo to attach the event if possible
    if ((typeof(dojo) != 'undefined') && (dojo.on))
    {
        if ((object == window) && (event == 'onload'))
            return dojo.addOnLoad(func)
        else
            return dojo.on(object, event.substring(2), func);
    }
    else if (typeof(object.attachEvent) != 'undefined') //IE format
        object.attachEvent(event, func);
    else if (typeof(object.addEventListener) != 'undefined') //W3C format
        object.addEventListener(event.substring(2), func, false);

    //return the hyf format remove handle
    return {hyf: true, obj: object, evt: event, func: func};
};

/**
 * Removes an event handler previously attached using attachEventHandler
 * @param detachObj The object returned from the attachEventHandler call.
 */
hyf.detachEventHandler = function(detachObj)
{
    if (!detachObj)
        return;

    if (detachObj.hyf)
    {
        //using native browser methods, so detachObj will be an HYF object
        //containing the relevant details.
        if (typeof(detachObj.obj.detachEvent) != 'undefined') //IE format
        {
            detachObj.obj.detachEvent(detachObj.evt, detachObj.func);
        }
        else if (typeof(obj.removeEventListener) != 'undefined') //W3C format
        {
            detachObj.obj.removeEventListener(detachObj.evt.substring(2), detachObj.func, false);
        }
    }
    else
    {
        //dojo approach so just call the remove method
        detachObj.remove();
    }
}

hyf.attachEventHandler(window, 'onload', function() {hyf.pageLoaded = true;});


//detect support for flex box functionality
if ((document.createElement("detect").style.flex === "") || (document.createElement("detect").style.msFlex === ""))
    document.getElementsByTagName("html")[0].className += " useFlexBox";
else
    document.getElementsByTagName("html")[0].className += " noFlexBox";



/**
 * Fires the given event on the provided object.
 * @param object {object) The object to fire the event against.
 * @param event {string} the name of the event to fire. Should not have the 'on' prefix e.g. 'click'
 * @author Hyfinity Limited
 */
hyf.fireEvent = function(object, event)
{
    if (event.indexOf('on') == 0)
        event = event.substring(2);

    if ((typeof(dojo) != 'undefined') && (dojo.on))
    {
        return dojo.on.emit(object, event, {bubbles: true, cancelable: true});
    }
    else if (document.createEventObject)
    {
        // dispatch for IE
        var evt = document.createEventObject();
        return object.fireEvent('on' + event, evt)
    }
    else
    {
        // dispatch for firefox + others
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type,bubbling,cancelable
        return !object.dispatchEvent(evt);
    }
}


/*
 * Object containing all Hyfinity utility functions
 */
hyf.util = {};


/**
 * Generic function for toggling the display of a component.
 * @param component {Group_Name | Field_Name} the field, group or HTML component (or its ID) to show/hide
 * @param method {string} (optional) An optional string specifying the required visibility of the
 *               component ('show' or 'hide'). A Null value will toggle from show/hide as appropriate.
 * @param animate {boolean} (optional) if true the show/hide will be performed gradually.
 * @param animateOnEndFunction {function} (optional) if animate is true the function that could be called when the animation completes.
 * @param animateMode {string} (optional) The mode of animation to use - 'wipe' (default) or 'fade'.
 * @author Hyfinity Limited
 */
hyf.util.toggleComponent = function(component, method, animate, animateOnEndFunction, animateMode)
{
    if (typeof(component) == 'string')
        component = document.getElementById(component);

    if ((component != null) && (typeof(component) != 'undefined'))
    {
        if ((method == null) || (typeof(method) == 'undefined'))
        {
            if (hyf.util.getCurrentStyle(component, 'display') == 'none')
            {
                hyf.util.showComponent(component, animate, animateOnEndFunction, animateMode);
            }
            else
            {
                hyf.util.hideComponent(component, animate, animateOnEndFunction, animateMode);
            }
        }
        else
        {
            if (method == 'hide')
            {
                hyf.util.hideComponent(component, animate, animateOnEndFunction, animateMode);
            }
            else
            {
                hyf.util.showComponent(component, animate, animateOnEndFunction, animateMode);
            }
        }
    }
}

/**
 * Generic utility function for hiding a specific component.
 * @param component {Group_Name | Field_Name} the field, group or HTML component (or its ID) to show/hide
 * @param animate {boolean} (optional) if true the hide will be performed gradually, otherwise it will disappear instantly.
 * @param animateOnEndFunction {function} (optional) if animate is true the function that could be called when the animation completes.
 * @param animateMode {string} (optional) The mode of animation to use - 'wipe' (default) or 'fade'.
 * @author Hyfinity Limited
 */
hyf.util.hideComponent = function(component, animate, animateOnEndFunction, animateMode)
{
    if (typeof(component) == 'string')
        component = document.getElementById(component);
    if (component == null)
        return;

    if ((animate == true) && (typeof(dojo) != 'undefined') && (typeof(dojo.fx) != 'undefined'))
    {
        var animOpts = {
                    node: component,
                    duration: 250,
                    onEnd: function() {
                        component.style.display = 'none';
                        component.style.opacity = 1;
                        hyf.hooks.containerHidden(component);
                        if (typeof(animateOnEndFunction) == 'function')
                            animateOnEndFunction();
                    }
                };

        if (animateMode == 'fade')
        {
            dojo.fadeOut(animOpts).play();
        }
        else
        {
            dojo.fx.wipeOut(animOpts).play();
        }
    }
    else
    {
        if ((typeof(component._oldCSSDisplay) == undefined) && (hyf.util.getCurrentStyle(component, 'display') != 'none'))
            component._oldCSSDisplay = hyf.util.getCurrentStyle(component, 'display');

        component.style.visibility = 'hidden';
        component.style.display = 'none';

        hyf.hooks.containerHidden(component);
    }
}

/**
 * Generic utility function for showing a specific component.
 * @param component {Group_Name | Field_Name} the field, group or HTML component (or its ID) to show/hide
 * @param animate {boolean} (optional) if true the show will be performed gradually, otherwise it will appear instantly.
 * @param animateOnEndFunction {function} (optional) if animate is true the function that could be called when the animation completes.
 * @param animateMode {string} (optional) The mode of animation to use - 'wipe' (default) or 'fade'.
 * @author Hyfinity Limited
 */
hyf.util.showComponent = function(component, animate, animateOnEndFunction, animateMode)
{
    if (typeof(component) == 'string')
        component = document.getElementById(component);
    if (component == null)
        return;

    //If the component is being hidden by a display setting in an external
    //css file then just clearing the inline display setting, or using the dojo
    //wipeIn command does not work correctly
    //Therefore we need to remove the class that is hiding it, and switch it to using
    //inline styles to hide.
    //This assumes use of one of the specific hide classes in the provided CSS file,
    //and may not work correclty if a different class name is being used.
    if ((hyf.util.getCurrentStyle(component, 'display') == 'none') && (typeof(dojo) != 'undefined'))
    {
        dojo.removeClass(component, 'hide');
        dojo.removeClass(component, 'hidden');
        component.style.display = 'none';
    }

    if ((animate == true) && (typeof(dojo) != 'undefined') && (typeof(dojo.fx) != 'undefined'))
    {
        var animOpts = {
                    node: component,
                    duration: 250,
                    onEnd: function() {
                        hyf.hooks.containerDisplayed(component);
                        if (typeof(animateOnEndFunction) == 'function')
                            animateOnEndFunction();
                    }
                };

        if (animateMode == 'fade')
        {
            if (typeof(component._oldCSSDisplay) != 'undefined')
                component.style.display= component._oldCSSDisplay;
            else
                component.style.display = '';
            component.style.opacity = 0;
            dojo.fadeIn(animOpts).play();
        }
        else
        {
            dojo.fx.wipeIn(animOpts).play();
        }
    }
    else
    {
        component.style.visibility = 'visible';
        if (typeof(component._oldCSSDisplay) != 'undefined')
            component.style.display= component._oldCSSDisplay;
        else
            component.style.display = '';

        hyf.hooks.containerDisplayed(component);
    }
}

/**
 * Checks if the given container contains any dojo widgets, and if so calls resize on them.
 * This is needed because the widgets do not always correctly render themselves
 * if they were not visible when first shown.
 * @param container The HTML component (e.g. div) to check for widgets.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.fixWidgetSizes = function(container)
{
    var widgets = hyf.util.getDijitWidgets(container);
    for (var i = 0; i < widgets.length; ++i)
    {
        var widget = widgets[i];
        if (typeof(widget.resize) == 'function')
            widget.resize();
    }

    //also check for any auto expanding textareas to make sure they appear correct
    dojo.query('.autoExpandTextarea', container).forEach(function(item){
            item.onkeyup();
    });
}
require(['dojo/topic'], function(topic) { topic.subscribe('hyf/hooks/containerDisplayed', hyf.util.fixWidgetSizes) });


/**
 * Returns the current value for the given style property on the given object
 * @param object The element to get the current style for
 * @param property The name of the property to retrieve.  This should be hypenated where
 *              needed, eg 'padding-top'
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getCurrentStyle = function(object, property)
{
    var currentDisplay;
    if (window.getComputedStyle)
        currentDisplay = document.defaultView.getComputedStyle(object,null).getPropertyValue(property);
    else if (object.currentStyle)
    {
        //convert hypenanted values to camel case
        var camelCased = property.replace(/-([a-z])/g, function (match, p1) {
                return p1.toUpperCase();
        });
        currentDisplay = object.currentStyle[camelCased];
    }
    return currentDisplay;
}

/** Stores the space in px to allow for the browser scrollbar.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.scrollbarWidth = 20;

/**
 * Restricts the vertical size of the specified table so that only the given number of rows are displayed
 * at one time, and adds scrollbars to see all the data.
 * @param row The DOM object for a row in the table
 * @param container The DOM object for the DIV containing the table (and nothing else)
 * @param body The DOM object representing the TBODY elemnt of the table.
 * @param headings The DOM object representing the heading row (TR) of the table.
 * @param numRows An integer value indicating the numebr of rows to display.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.setTableScrolling = function(row, container, body, headings, numRows)
{
    if ((row == null) || (container == null) || (body == null) || (headings == null))
    {
        //required components of the table are not present, so return
        return;
    }
    var rowHeight = hyf.util.getComputedHeight(row);
    var headingsHeight = hyf.util.getComputedHeight(headings);

    if (dojo.isIE < 8) //ie versions upto 7 support CSS expressions which makes this quite easy
    {
        container.style.overflow = 'hidden';
        container.style.overflowY = 'auto';
        var newHeight = ((rowHeight * numRows) + headingsHeight);
        if (newHeight < hyf.util.getComputedHeight(container))
        {
            var table = body.parentNode;
            table.style.marginTop = 0;
            container.style.height = newHeight + 'px';
            headings.style.setExpression('top', "document.getElementById('" + container.getAttribute('id') +"').scrollTop - 2");
            headings.style.position = 'relative';
            headings.style.left = 0;

            //make sure the scrollbar appaears next to the table (if not full width)
            if ((hyf.util.getComputedWidth(headings) + hyf.util.scrollbarWidth) < hyf.util.getViewportSize().width)
                container.style.width = hyf.util.getComputedWidth(headings) + hyf.util.scrollbarWidth;
            else
                container.style.width = hyf.util.getComputedWidth(headings);
        }
    }
    else if (dojo.isFF < 4) //firefox before version 4 supported scrollable tbody which makes this easy
    {
        var newHeight = (rowHeight * numRows);
        if (newHeight < hyf.util.getComputedHeight(body))
        {
            body.style.overflow = 'auto';
            body.style.overflowX = 'hidden';
            body.style.height = newHeight + 'px';
        }
    }
    else/* if (dojo.isWebKit || (dojo.isFF >= 4) || (dojo.isIE >= 8))*/
    {
        var newHeight = (rowHeight * numRows);
        if (newHeight < hyf.util.getComputedHeight(body))
        {
            //try and insert a new scrollable container, and position the heding row outside this
            var newContainer = document.createElement('div');
            //move existing container children into new container
            while (container.hasChildNodes())
            {
                newContainer.appendChild(container.firstChild);
            }

            container.appendChild(newContainer);

            container.style.position = 'relative';
            container.style.paddingTop = headingsHeight + 'px';
            newContainer.style.overflow = 'scroll';
            newContainer.style.overflowX = 'hidden';
            newContainer.style.height = newHeight + 'px';

            //set a specific width on each heading, as once it is moved outside, each one
            //will lose the connection to the table data
            if (dojo.isIE == 8)
            {
                for (var i = 0; i < headings.cells.length; i++)
                {
                    var headerCell = headings.cells.item(i);
                    var width = hyf.util.getComputedWidth(headerCell);

                    var dataCell = body.rows.item(0).cells.item(i);

                    headerCell.style.width = width;
                    dataCell.style.width = width;
                    headerCell.style.paddingLeft = dataCell.style.paddingLeft;
                    headerCell.style.paddingRight = dataCell.style.paddingRight;
                }
            }
            else
            {
                dojo.query('th', headings).forEach("item.style.width = hyf.util.getComputedWidth(item) + 'px';");
                dojo.query('td', row).forEach("item.style.width = hyf.util.getComputedWidth(item) + 'px';");
            }

            headings.style.borderSpacing = '0px';
            headings.style.position = 'absolute';
            headings.style.top = '0px';

            var headingWidth = hyf.util.getComputedWidth(headings);
            var table = body.parentNode;
            table.style.width = headingWidth;

            //make sure the scrollbar appaears next to the table (if not full width)
            if ((headingWidth + hyf.util.scrollbarWidth) < hyf.util.getViewportSize().width)
                container.style.width = (headingWidth + hyf.util.scrollbarWidth) + 'px';
        }
    }
    /*else
    {
        //fallback is to just scroll the container, and not keep the table headings fixed
        container.style.overflow = 'scroll';
        container.style.overflowX = 'auto';
        body.style.overflowX = 'hidden';
        var newHeight = (rowHeight * numRows) + headingsHeight;
        if (newHeight < hyf.util.getComputedHeight(container))
        {
            container.style.height = newHeight + 'px';
            container.style.width = (hyf.util.getComputedWidth(headings) + 20) + 'px';
        }
    }*/
}

/**
 * Returns the current height of the given source component
 * @param source The DOM component to return the current computed height for
 * @return {float} containing the current height value (pixels)
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getComputedHeight = function(source)
{
    var compHeight
    if (dojo.isIE)
    {
        compHeight = source.offsetHeight;
    }
    else
    {
        compHeight = hyf.util.getCurrentStyle(source,"height");
        if (isNaN(parseFloat(compHeight)))
        {
            compHeight = source.offsetHeight;
        }

    }
    return parseFloat(compHeight);
}

/**
 * Returns the current width of the given source component
 * @param source The DOM component to return the current computed width for
 * @return a float containing the current width value (pixels)
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getComputedWidth = function(source)
{
    var compWidth
    if (dojo.isIE < 9)
    {
        compWidth = source.offsetWidth;
    }
    else
    {
        compWidth = hyf.util.getCurrentStyle(source,"width");
        if (isNaN(parseFloat(compWidth)))
        {
            compWidth = source.offsetWidth;
        }
    }
    //special handling for opera which seems to return 0 from getCurrentStyle for the width for some reason.
    if ((parseFloat(compWidth) == 0) && (source.offsetWidth) && (source.offsetWidth > 0))
        compWidth = source.offsetWidth;

    return parseFloat(compWidth);
}


/**
 * Returns an object containing the coordinates of the mouse from the given event.
 * @param evt {object} The event object to get the mouse coordinates for. Can use the objEventSource.event within the script fragment.
 * @return {object} The returned coords object will have two properties, 'x' and 'y' in pixels.
 *
 * @author Hyfinity Limited
 */
hyf.util.getMouseCoords = function(e, base)
{
    var coords= new Object();

    var evt
    if (!e)
    {
        evt = window.event;
    }
    else //netscape
    {
        evt = e;
    }

    //get the mouse coords
    if (evt.pageX || evt.pageY)
    {
        //Gecko based
        coords.x = evt.pageX;
        coords.y = evt.pageY;
    }
    else if (evt.clientX || evt.clientY)
    {
        coords.x = evt.clientX
        coords.y = evt.clientY
        if ((document.body) && (document.body.scrollLeft || document.body.scrollTop))
        {
            //IE 4, 5, and 6 (Non standards compliant mode)
            coords.x += document.body.scrollLeft;
            coords.y += document.body.scrollTop;
        }
        else if ((document.documentElement) &&
                 ((document.documentElement.scrollLeft) ||
                 (document.documentElement.scrollTop)))
        {
            //IE 6 (Standards compliant mode)
            coords.x += document.documentElement.scrollLeft;
            coords.y += document.documentElement.scrollTop;
        }
    }

    if ((typeof(base) != 'undefined') && (typeof(base.x) != 'undefined') && (typeof(base.y) != 'undefined'))
    {
        coords.x += base.x;
        coords.y += base.y;
    }

    return coords;

}

/**
 * Returns the location of the left of the given object.
 * If the screen parameter is set to true, then the returned value will be in screen coords.
 * ie it adjusts for scrollable regions, to allow comparison with mouse coordinates
 * returned from getMouseCoords method
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getLeftPosition = function(obj, screen)
{
    var ol=obj.offsetLeft;
    while ((obj=obj.offsetParent) != null)
    {
        ol += obj.offsetLeft;
        if (screen)
        {
            if (obj.scrollLeft != 0)
            {
                ot -= obj.scrollLeft;
            }
        }
    }
    return ol;
}

/**
 * Returns the location of the right of the given object.
 * If the screen parameter is set to true, then the returned value will be in screen coords.
 * ie it adjusts for scrollable regions, to allow comparison with mouse coordinates
 * returned from getMouseCoords method
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getRightPosition = function(obj, screen)
{
    return hyf.util.getLeftPosition(obj, screen) + hyf.util.getComputedWidth(obj);
}

/**
 * Returns the location of the top of the given object.
 * If the screen parameter is set to true, then the returned value will be in screen coords.
 * ie it adjusts for scrollable regions, to allow comparison with mouse coordinates
 * @return returned from getMouseCoords method
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getTopPosition = function(obj, screen)
{
    var ot=obj.offsetTop;
    while ((obj=obj.offsetParent) != null)
    {
        ot += obj.offsetTop;
        if (screen)
        {
            if (obj.scrollTop != 0)
            {
                ot -= obj.scrollTop;
            }
        }
    }
    return ot;
}

/**
 * Returns the current location coordinates of the given object.
 * The returned object will have four properties, 'x' and 'y' coordinates which give
 * the position of the top left corner, and 'width' and 'height'
 * @param component {hyf.FieldName | hyf.GroupName} the field or group on the page.
 * @param screen {boolean} (optional) If the screen parameter is set to true, the returned values are in 'screen coords', ie they are
 * adjusted for scrollable regions, to allow comparison with the mouse coordinates returned from
 * the getMouseCoords method.
 *
 * @author Hyfinity Limited
 */
hyf.util.getComponentPosition = function(obj, screen)
{
    if (typeof(obj) == 'string')
    {
        obj = document.getElementById(obj);
    }
    var objCoords = new Object();
    objCoords.x = hyf.util.getLeftPosition(obj, screen);
    objCoords.y = hyf.util.getTopPosition(obj, screen);
    objCoords.width = hyf.util.getComputedWidth(obj);
    objCoords.height = hyf.util.getComputedHeight(obj);
    return objCoords;
}

/**
 * Returns the size of the available window viewport
 * @param includeScroll (Optional) If true the returned object will include scrollLeft and scrollTop properties.
 * @return an object containing two properties, width and height.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getViewportSize = function(includeScroll)
{
    var size = new Object();
    if (window.innerWidth)
    {
        size.width = window.innerWidth;
        size.height = window.innerHeight;
    }
    else if (document.documentElement && document.documentElement.clientWidth)
    {
        size.width = document.documentElement.clientWidth;
        size.height = document.documentElement.clientHeight;
    }
    else if (document.body && document.body.clientWidth)
    {
        size.width = document.body.clientWidth;
        size.height = document.body.clientHeight;
    }

    if (includeScroll)
    {
        size.scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0);
        size.scrollTop = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
    }

    return size;
}

/**
 * Returns the closest previous sibling to the given element
 * that is an element node. ie text nodes are ignored
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getPreviousElementSibling = function(elem)
{
    var prev = elem.previousSibling;
    //make sure we return an element type node, not a text node
    while (prev && prev.nodeType != 1)
    {
        prev = prev.previousSibling;
    }

    return prev;
}

/**
 * Returns the closest folowing sibling to the given element
 * that is an element node. ie text nodes are ignored
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getNextElementSibling = function(elem)
{
    var prev = elem.nextSibling;
    //make sure we return an element type node, not a text node
    while (prev && prev.nodeType != 1)
    {
        prev = prev.nextSibling;
    }

    return prev;
}

/**
 * Returns the first element child node of the provided element
 * or null if it does not have any element children
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getFirstElementChild = function(elem)
{
    for (var i = 0; i < elem.childNodes.length; ++i)
    {
        if (elem.childNodes[i].nodeType == 1)
            return elem.childNodes[i];
    }
    return null;
}


/**
 * Returns a boolean value indicating whether or not the given field is currently hidden
 * @param field {Field_Name} The HTML field to check.
 * @return true if the given field is within a hidden (display:none) component, false otherwise
 *
 * @author Hyfinity Limited
 */
hyf.util.checkFieldHidden = function(field)
{
    if (typeof(field) == 'string')
    {
        field = document.getElementById(field);
    }
    if(hyf.util.findFieldHiddenParents(field).length > 0)
        return true;
    else
        return false;

}

/**
 * Searches the parents of the given field, and looks for any hidden (display:none) components.
 * This then returns an array of all the hidden components found.
 * If this field is not hidden, then an empty array will be returned
 * @param field The HTML field to check the parents of.
 * @param matches This param should not be passed in.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.findFieldHiddenParents = function(field, matches)
{
    if (typeof(matches) == 'undefined')
        matches = new Array();

    if (field.nodeType == 9)  //have reached the document node
    {
        return matches
    }

    var disp = hyf.util.getCurrentStyle(field,"display");

    if (disp == 'none')
    {
        matches[matches.length] = field;
    }

    if ((typeof(field.parentNode) != 'undefined') && (field.parentNode != null))
    {
        return hyf.util.findFieldHiddenParents(field.parentNode, matches);
    }
    else
    {
        return matches;
    }
}

/**
 * Searches through the parents of the given field to determine whether it is contained
 * in any layout containers that allow the user to choose whether the field is visble or not.
 * This currently checks for tabs, accordions, and collapsible content controls.
 * @param field {Field_Name} The HTML field to check the parents of.
 * @param matches {object} This param should not be passed in.
 * @return An array of all the parent elements found the represent these controls.
 *       If the field is not within any of these containers then an empty array is returned.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.findFieldLayoutContainerParents = function(field, matches)
{
    if (typeof(matches) == 'undefined')
        matches = new Array();

    if (field.nodeType == 9)  //have reached the document node
    {
        return matches
    }

    //first check for tabs
    if (field.getAttribute('_use') == 'tabPane')
    {
        //check that there is actually a tab button for this tab pane
        var tabFieldId = field.getAttribute('_tabField');
        if (document.getElementById(tabFieldId) != null)
            matches[matches.length] = field;
    }

    //check for collapsible content
    if (dojo.hasClass(field, 'collapsibleContent') || dojo.hasClass(field, 'collapsedContent'))
    {
        //Check for toggle button
        if (dojo.query("a.toggleHidden, a.toggleVisible", field.parentNode).length > 0)
            matches[matches.length] = field;
    }

    //check for accordion panes
    var accDetails = hyf.util.checkForAccordionPane(field);
    if (accDetails != null)
    {
        matches[matches.length] = field;
        //dojo (at least in 1.7.5) places a container div around the accordion pane that
        //also gets hidden when the pane is not selected.
        //Although this is not a proper widget that we need to do any processing with, we need
        //to include this in the response, as it will be returned by the findFieldHiddenParents
        //function but can be made visible by the user changing accordion panes.  If we didnt include it
        //then we wouldnt auto switch accordion panes on validation error for example.
        if (dojo.hasClass(field.parentNode, 'dijitAccordionChildWrapper') && (hyf.util.getCurrentStyle(field.parentNode, "display") == 'none'))
            matches[matches.length] = field.parentNode;

    }


    if ((typeof(field.parentNode) != 'undefined') && (field.parentNode != null))
    {
        return hyf.util.findFieldLayoutContainerParents(field.parentNode, matches);
    }
    else
    {
        return matches;
    }
}

/**
 * Adjusts the visibility of all the provided containers so that they are all set to the visible state.
 * This should be passed the output from the findFieldLayoutContainerParents method above.
 * This currently supports adjusting tabs, accordions, and collapsible content containers.
 * @param containers An array of all the container elements to make visible.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.makeLayoutContainersVisible = function(containers)
{
    //loop through each container element
    for (var i = containers.length - 1; i > -1; --i)
    {
        var c = containers[i];

        //check if it is a tab container
        if (c.getAttribute('_use') == 'tabPane')
        {
            var tabFieldId = c.getAttribute('_tabField');
            if (tabFieldId != null)
            {
                var tabBtn = document.getElementById(tabFieldId);
                //click the tab button to make sure the correct tab is visible.
                if (tabBtn != null)
                {
                    tabBtn.onclick();
                }
            }
        }

        //check if it is a collapsible content
        if (dojo.hasClass(c, 'collapsibleContent') || dojo.hasClass(c, 'collapsedContent'))
        {
            //make sure this group is hidden
            if (hyf.util.getCurrentStyle(c, "display") == 'none')
            {
                //find the toggel button
                var toggleBtn = dojo.query("a.toggleHidden, a.toggleVisible", c.parentNode)[0];
                if (toggleBtn != null)
                {
                    hyf.collapsiblecontent.toggle(toggleBtn);
                }
            }
        }

        //check if it is an accordion
        var accDetails = hyf.util.checkForAccordionPane(c);
        if (accDetails != null)
        {
            accDetails.containerWidget.selectChild(accDetails.paneWidget);
        }
    }
}

/**
 * Checks if the given HTML component (eg a div) represents a pane in an acoordion control.
 * @param component The HTML component to check.
 * @return null if not an accordion pane, or an object if it is.  This object will contain
 *              two properties, paneWidget and containerWidget contianer the respective dojo
 *              widget objects.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.checkForAccordionPane = function(component)
{
    var dojoType = component.getAttribute('dojoType');
    if (dojoType == null)
        dojoType = component.getAttribute('data-dojo-type');
    if ((dojoType != null) && ((dojoType == 'dijit.layout.ContentPane') || (dojoType == 'dijit.layout.AccordionPane')))
    {
        var widget = dijit.byNode(component);
        if (widget != null)
        {
            var retObj = {paneWidget: widget};

            //make sure widget is part of an accordion
            //With dojo 1.7.5 the parent widget of the content pane is an 'dijit.layout._AccordionInnerContainer' whose parent is then
            //the main accordion container, but just in case, we also check for the first parent being the accordion container.
            if (widget.getParent() && widget.getParent().declaredClass == 'dijit.layout.AccordionContainer')
                retObj.containerWidget = widget.getParent();
            else if (widget.getParent() && widget.getParent().getParent() &&  widget.getParent().getParent().declaredClass == 'dijit.layout.AccordionContainer')
                retObj.containerWidget = widget.getParent().getParent();

            return retObj;
        }
    }

    return null;
}


/**
 * Checks to see if the provided parent component does actually contain the
 * child element within it a some level.
 * If both params are the same, then this will return true.
 * @param child {Field_Name | Group_Name} The child element to check.
 * @param parent {Group_Name} The HTML component to check if it contains child.
 * @return {boolean} indicating whether or not parent contains child.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.isParent = function(child, parent)
{
    if ((child == null) || (typeof(child) == 'undefined') || (parent == null) || (typeof(parent) == 'undefined'))
    {
        return false;
    }
    if (child.nodeType == 9)  //have reached the document node
    {
        return false
    }
    if (child == parent)
    {
        return true
    }
    else
    {
        return hyf.util.isParent(child.parentNode, parent);
    }
}

/**
 * Attempts to get the current value for the given field.
 * This will attempt to determine the type of the given field name,
 * by checking dojo widgets, the form elements collection, and
 * display only containers with the given id.
 * @param fieldName {Field_Name} The name of the field to get the value for.
 * @param getDisplayValue {boolean} (optional) If provided and set to true, the returned value will be the displayed value
 *                  for the control rather than the underlying data value where appropriate (e.g. select controls)
 * @return {string | array} containing the current value, or null if the field couldn't be found.
 *         For multiple selection controls, an array of all current values will be returned.
 *
 * @author Hyfinity Limited
 */
hyf.util.getFieldValue = function(fieldName, getDisplayValue)
{
    if (typeof(getDisplayValue) != 'boolean')
        getDisplayValue = false;

    //first check for a dojo widget
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(fieldName) != null))
    {
        if (getDisplayValue)
            return dijit.byId(fieldName).get('displayedValue');
        else
            return dijit.byId(fieldName).get('value');
    }

    //check for form controls
    var nameMatches = dojo.query('*[name=' + fieldName + ']');
    if (nameMatches.length > 0)
    {
        var controlFound = true;
        var treatAsMultiElementControl = false;
        var values = new Array();
        if (nameMatches.length == 1)
        {
            var entry = nameMatches[0];

            if ((typeof(entry.type) == 'undefined') || (entry.type == ''))
            {
                //not actually a field control
                controlFound = false;
            }
            else
            {
                if (entry.type == 'select-multiple')
                { //for multi select we need to find all selected values
                    for (var i = 0; i < entry.options.length; ++i)
                    {
                        if (entry.options[i].selected)
                        {
                            if (getDisplayValue)
                                values[values.length] = entry.options[i].text;
                            else
                                values[values.length] = entry.options[i].value;
                        }
                    }
                }
                else if (entry.type == 'select-one')
                {
                    if (getDisplayValue)
                        values[values.length] = entry.options[entry.selectedIndex].text;
                    else
                        values[values.length] = entry.value;
                }
                else if (entry.type == 'checkbox')
                {
                    if (hyf.util.getWebMakerAttribute(entry, 'use') == 'selectMany')
                    {
                        treatAsMultiElementControl = true;
                    }
                    else
                    {
                        //for single checkbox, if not ticked, then we should return the unticked value
                        if (entry.checked)
                            values[values.length] = entry.value;
                        else
                            values[values.length] = document.getElementById(entry.id + '_value_if_not_submitted').value;
                    }
                }
                else if (entry.type == 'file')
                {
                    values = values.concat(hyf.fileUpload.getControlValue(entry));
                }
                else if (entry.type == 'range')
                {
                    values[values.length] = hyf.control.slider.getControlValue(entry, getDisplayValue);
                }
                else
                {
                    //if this is a rich text editor, make sure that the underlying text area is updated
                    //before we try to get its value
                    if ((entry.type == 'textarea') && hyf.richtext && hyf.richtext.isRichText(entry))
                        hyf.richtext.updateTextareaValue(entry);

                    //check if it is a date field
                    if (entry.getAttribute('_type') == 'date')
                    {
                        if (getDisplayValue)
                            values[values.length] = entry.value;
                        else
                            values[values.length] = hyf.validation.ValueConverter.performDateConversion(entry, entry.value);
                    }
                    else
                    {
                        //check for masking
                        if (!getDisplayValue && hyf.validation.isValueMasked(entry))
                            values[values.length] = hyf.validation.getUnmaskedValue(entry);
                        else
                            values[values.length] = entry.value;
                    }
                }
            }
        }
        if ((nameMatches.length > 1) || (treatAsMultiElementControl)) //is an array of controls, eg radio or multi check.
        {
            for (var i = 0; i < nameMatches.length; ++i)
            {
                if (nameMatches[i].checked)
                {
                    if (getDisplayValue)
                    {
                        //try and look for a label element for this control to get the
                        //text content of
                        var container = document.getElementById(nameMatches[i].name + '_container');
                        var labels = dojo.query('label[for="'+nameMatches[i].id+'"]', container);
                        if (labels.length > 0)
                        {
                            var label = labels[0];
                            if (typeof(label.textContent) != 'undefined')
                                values[values.length] = label.textContent;
                            else if (typeof(label.innerText) != 'undefined')
                                values[values.length] = label.innerText;
                        }
                        else
                            values[values.length] = nameMatches[i].value;
                    }
                    else
                        values[values.length] = nameMatches[i].value;
                }
            }
        }
        if (controlFound)
        {
            if (values.length == 0)
                return '';
            else if (values.length == 1)
                return values[0];
            else
                return values;
        }
    }

    //finally check for an id
    if (document.getElementById(fieldName) != null)
    {
        var cont = document.getElementById(fieldName);

        //check if this is an img tag to get the source for
        if (cont.tagName.toLowerCase() === 'img')
        {
            return cont.src;
        }
        else
        {
            //return the text contents of the container.
            if (!getDisplayValue && hyf.validation.isValueMasked(cont))
                return hyf.validation.getUnmaskedValue(cont);
            else if (typeof(cont.textContent) != 'undefined')
                return cont.textContent;
            else if (typeof(cont.innerText) != 'undefined')
                return cont.innerText;
        }
    }


    //final check in case this was a split date control
    if (document.getElementById(fieldName + '_container') != null)
    {
        var f = dojo.query('*[_originalFieldName=' + fieldName + ']', document.getElementById(fieldName + '_container'))[0];

        if (f)
        {
            //create a temp field to help get the combined value
            var tempField = document.createElement('input');
            tempField.value = hyf.validation.DateValidator.getConcatDateFieldParts(fieldName, 'values', true);
            tempField.setAttribute('_display_date_format', hyf.validation.DateValidator.getConcatDateFieldParts(fieldName, 'format', true));

            if (getDisplayValue)
                tempField.setAttribute('_data_date_format', hyf.validation.DateValidator.getConcatDateFieldParts(fieldName, 'format', false));
            else
                tempField.setAttribute('_data_date_format', f.getAttribute('_data_date_format'));


            return hyf.validation.ValueConverter.performDateConversion(tempField, tempField.value);
        }

    }

    //couldn't find a match so return null
    return null;
}

/**
 * Attempts to set the current value for the given field.
 * This will attempt to determine the type of the given field name,
 * by checking dojo widgets, the form elements collection, and
 * display only containers with the given id.
 * If the field supports multiple selections, then the provided value will be
 * added in addition to any others. Use a value of null to clear all values for the control.
 * @param fieldName {Field_Name} The name of the field to set the value for.
 * @param fieldValue {Field_Value | string} The value to set the field with.
 *
 * @author Hyfinity Limited
 */
hyf.util.setFieldValue = function(fieldName, fieldValue)
{
    //first check for a dojo widget
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(fieldName) != null))
    {
        return dijit.byId(fieldName).set('value', fieldValue);
    }

    //check for form controls
    var nameMatches = dojo.query('*[name=' + fieldName + ']');
    if (nameMatches.length > 0)
    {
        var controlFound = true;
        var valueToSet = hyf.util.processDateConstantsForField(fieldValue, nameMatches[0]);

        if (nameMatches.length == 1)
        {
            var entry = nameMatches[0];
            if ((typeof(entry.type) == 'undefined') || (entry.type == ''))
            {
                //not actually a field control
                controlFound = false;
            }
            else
            {
                if (entry.type == 'select-multiple')
                { //for multi select we need to find the matching option to select
                    for (var i = 0; i < entry.options.length; ++i)
                    {
                        if (entry.options[i].value == valueToSet)
                            entry.options[i].selected = true;
                        else if (valueToSet == null)
                            entry.options[i].selected = false;

                    }
                }
                else if (entry.type == 'checkbox')
                { //for single checkbox, we need to adjust the checked proeprty
                    if (entry.value == valueToSet)
                        entry.checked = true;
                    else
                        entry.checked = false;
                }
                else if (entry.type == 'file')
                {
                    //can only set a file value if clearing it out
                    if (valueToSet == '')
                    {
                        hyf.fileUpload.clearControl(entry);
                    }
                }
                else
                {
                    if (entry.getAttribute('_type') == 'date')
                    {
                        //convert provided value to the correct display format
                        if (entry.getAttribute('_display_date_format') && entry.getAttribute('_data_date_format') && (entry.getAttribute('_display_date_format') != entry.getAttribute('_data_date_format')))
                        {
                            valueToSet = convertDate(valueToSet, entry.getAttribute('_data_date_format'), entry.getAttribute('_display_date_format'));
                        }
                    }

                    entry.value = valueToSet;
                    //check for any masking requirements
                    hyf.validation.applyMask(entry);

                    //if this is a rich text editor, then make sure the editor gets notified of the changes
                    if ((entry.type == 'textarea') && hyf.richtext && hyf.richtext.isRichText(entry))
                        hyf.richtext.refreshEditorValue(entry);
                }

                //for single checkbox type controls, we will generally use click event for handling
                //so fire that here as well as change.
                if (entry.type == 'checkbox')
                    hyf.fireEvent(entry, 'click');

                hyf.fireEvent(entry, 'change');
            }
        }
        else  //is an array of controls, eg radio or multi check.
        {
            for (var i = 0; i < nameMatches.length; ++i)
            {
                var initialState = nameMatches[i].checked;
                if (nameMatches[i].value == valueToSet) {
                    nameMatches[i].checked = true;
                    if (initialState == false) {
                        hyf.fireEvent(nameMatches[i], 'click');
                        hyf.fireEvent(nameMatches[i], 'change');
                    }
                } else if (valueToSet == null) {
                    nameMatches[i].checked = false;
                    if (initialState == true) {
                        hyf.fireEvent(nameMatches[i], 'click');
                        hyf.fireEvent(nameMatches[i], 'change');
                    }
                }
            }
        }
        if (controlFound)
            return;
    }

    //finally check for an id
    if (document.getElementById(fieldName) != null)
    {
        //set the text contents of the container.
        var cont = document.getElementById(fieldName);

        //check if this is an img tag to update
        if (cont.tagName.toLowerCase() === 'img')
        {
            cont.src = fieldValue;
            hyf.fireEvent(cont, 'change');
        }
        else
        {
            var valueToSet = hyf.util.processDateConstantsForField(fieldValue, cont);

            //if the container has existing text node children then we just update the first one
            var textUpdated = false;
            var child = cont.firstChild;
            while (child != null)
            {
                if (child.nodeType == 3) //text node
                {
                    if (!textUpdated)
                    {
                        child.nodeValue = valueToSet;
                        textUpdated = true;
                        child = child.nextSibling;
                    }
                    else
                    {
                        var oldchild = child;
                        child = child.nextSibling;
                        cont.removeChild(oldchild);
                    }
                }
                else
                {
                    child = child.nextSibling;
                }
            }

            //otherwise we set the contents of the element, removing any existing content
            if (!textUpdated)
            {
                if (typeof(cont.textContent) != 'undefined')
                    cont.textContent = valueToSet;
                else if (typeof(cont.innerText) != 'undefined')
                    cont.innerText = valueToSet;
            }

            //check for any masking requirements
            hyf.validation.applyMask(cont);
        }
    }

    //final check in case this was a split date control
    if (document.getElementById(fieldName + '_container') != null)
    {
        var f = dojo.query('*[_originalFieldName=' + fieldName + ']', document.getElementById(fieldName + '_container'))[0];

        if (f)
        {
            var time = getDateFromFormat(fieldValue, f.getAttribute('_data_date_format'));
            hyf.calendar.setSplitDateControlValue(fieldName, new Date(time));
        }

    }
}

/**
 * Gets the current value of the given display variable.
 * @param dvName {Display_Variable} The name of the display variable to get the value for.
 * @return {string} The requested value, or null if the display varaiable doesn't exist.
 *
 * @author Hyfinity Limited
 */
hyf.util.getDisplayVariableValue = function(dvName)
{
    //all display variables are stored as hidden fields on the page using a defined
    //naming format, so we need to find this field, and get its value here.
    var dvField = document.getElementById('hyf_display_variable_' + dvName);
    if (dvField != null)
    {
        return dvField.value;
    }
    return null;
}

/**
 * Sets the current value of the given display variable.
 * @param dvName {Display_Variable} The name of the display variable to set the value for.
 * @param newValue {string} The new value to give the display variable
 * @return {boolean} true of the value was updated, false if the variable name couldn't be found.
 *
 * @author Hyfinity Limited
 */
hyf.util.setDisplayVariableValue = function(dvName, newValue)
{
    //all display variables are stored as hidden fields on the page using a defined
    //naming format, so we need to find this field, and get its value here.
    var dvField = document.getElementById('hyf_display_variable_' + dvName);
    if (dvField != null)
    {
        dvField.value = newValue;

        //display variable fields are disabled so they are not submitted,
        //but this means that events dont fire on them
        //So need to enable the field temporarily to fire the change.
        dvField.disabled = false;

        //for some reason we need to allow some time after enabling
        //for the fire event to work properly (at least in FF) so we
        //use a timeout here.
        window.setTimeout(function(){
                hyf.fireEvent(dvField, 'change');
                dvField.disabled = true;
        }, 100);

        return true;
    }
    return false;
}

/**
 * Checks if the provided value is actually one of the defined date constants
 * (in hyf.calendar.supportedKeywords).  If so, and the provided field is a date value,
 * then this returns the appropriate date string in the correct format for the field.
 * If not, then the provided value is returned as is.
 * @private
 */
hyf.util.processDateConstantsForField = function(value, field)
{
    if ((field.getAttribute('_type') == 'date') && (typeof(value) == 'string'))
    {
        if ((value.charAt(0) == '$') && (hyf.calendar.supportedKeywords[value.substr(1)] != null))
        {
            var dateToAdjust = new Date();

            if (hyf.calendar.supportedKeywords[value.substr(1)] != '')
                eval(hyf.calendar.supportedKeywords[value.substr(1)]);

            var dateFormat = (field.getAttribute('_display_date_format')) ? field.getAttribute('_display_date_format') : field.getAttribute('_data_date_format');

            value = formatDate(dateToAdjust, dateFormat);
        }
    }

    return value;
}


/**
 * Function to insert HTML content into the specified target container.
 * This also provides the option to evaluate any scripts present in the content
 *
 * @param target The HTML container into which the content will be inserted.
 *               Any existing content in this container will be lost.
 * @param content A string containing the HTML fragment to insert.
 * @param evalScripts an optional boolean flag to indicate whether scripts in the content should be evaluated
 *                  These will be evalauted only if true.
 * @private
 */
hyf.util.insertContent = function(target, content, evalScripts)
{
    //if we dont have a target to insert into then stop
    if ((target == null) || (typeof(target) == 'undefined'))
        return;

    //if we dont have any content to insert then stop
    if ((content == null) || (typeof(content) != 'string'))
        return;

    scriptRegExp = '(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)';

    //separate out any script tags from the content passed in.
    var match = new RegExp(scriptRegExp, 'img');
    var pureHTML = content.replace(match, '');
    var scripts = [];
    var scriptMatch;
    while ((scriptMatch = match.exec(content)) !== null)
    {
        scripts.push(scriptMatch);
    }

    //attempt to destroy any existing widgets in the container
    hyf.util.destroyDojoWidgets(target);

    //insert the HTML into the target location
    target.innerHTML = pureHTML;

    //check if the script fragments that we have stripped out need to be evaluated
    if (evalScripts && (scripts != null) && (scripts.length > 0))
    {
        setTimeout(function() {
            var onLoadEventsIdentifier = new Date().getTime();
            var onloadEventsRegExp = /hyf.attachEventHandler\s*\(\s*window\s*,\s*['"]onload/img;

            //long variable name to try and avoid conflicts with the scripts being executed.
            for (var script_counter_unique_name = 0; script_counter_unique_name < scripts.length; script_counter_unique_name++)
            {
                try
                {
                    //extract the actual content (without the script tags) from the matched script
                    var scriptFragment = scripts[script_counter_unique_name][1];
                    //check to see if the fragment contains a function definition which needs to
                    //be properly registered with this window
                    var functionStart = scriptFragment.indexOf('function ');
                    while(functionStart != -1)
                    {
                        var functionEnd = scriptFragment.indexOf('(', functionStart + 9);
                        var functionName = scriptFragment.substring(functionStart + 9, functionEnd);
                        if (functionName != '')
                            scriptFragment += '; window.' + functionName + ' = ' + functionName + ';';
                        functionStart = scriptFragment.indexOf('function ', functionEnd);
                    }

                    //check if the script fragment contains any calls to find the last table output,
                    //and if so try and replace this with the actual ID of the table so that this call
                    //will still work correctly.
                    var gltIndex = scriptFragment.indexOf('getLastTableOutput');
                    if (gltIndex != -1)
                    {
                        //find the location of this script fragment in the original HTML
                        //so we can find the id of the closest table before this point
                        var tableStart = content.lastIndexOf('<table', scripts[script_counter_unique_name].index);
                        if (tableStart != -1)
                        {
                            var idStart = content.indexOf('id=', tableStart);
                            if (idStart != -1)
                            {
                                var idQuote = content.charAt(idStart + 3);
                                var idEnd = content.indexOf(idQuote, idStart + 4);
                                var idString = content.substring(idStart + 4, idEnd);
                                if (idString != '')
                                {
                                    //work out which part of the script fragment we need to replace
                                    var replaceStart = scriptFragment.lastIndexOf('hyf', gltIndex);
                                    var replaceEnd = scriptFragment.indexOf(')', gltIndex);
                                    //replace the section of the script fragment
                                    scriptFragment = scriptFragment.substring(0, replaceStart) +
                                                     "document.getElementById('" + idString + "')" +
                                                     scriptFragment.substring(replaceEnd + 1);
                                }
                            }
                        }
                    }

                    //check for any calls to attachEventHandler for onload events
                    //if so we need to add our unique identifier for this insertContent call
                    //so that we can evaluate these onload events at the right point below
                    while (onloadEventsRegExp.test(scriptFragment))
                    {
                        scriptFragment = scriptFragment.substr(0, onloadEventsRegExp.lastIndex)
                                                + '-' + onLoadEventsIdentifier
                                                + scriptFragment.substr(onloadEventsRegExp.lastIndex);
                    }

                    eval(scriptFragment);
                }
                catch(e)
                {
                    //ignore
                    console.log(e);
                }
            }

            //call the content inserted hooks
            hyf.hooks.contentInserted(target);

            //check for any dojo widgets in the inserted HTML
            hyf.util.parseWidgets(target);

            //call any 'onload' events found in the script
            if (hyf.afterLoadOnLoadFunctions[onLoadEventsIdentifier])
            {
                for(var i = 0; i < hyf.afterLoadOnLoadFunctions[onLoadEventsIdentifier].length; ++i)
                {
                    hyf.afterLoadOnLoadFunctions[onLoadEventsIdentifier][i]();
                }

                delete hyf.afterLoadOnLoadFunctions[onLoadEventsIdentifier];
            }

            hyf.util.layoutDialogAfterInsertContent(target);

        }, 10);
    }
    else
    {
        //call the content inserted hooks
        hyf.hooks.contentInserted(target);

        //check for any dojo widgets in the inserted HTML
        hyf.util.parseWidgets(target)


        hyf.util.layoutDialogAfterInsertContent(target);
    }
}
/**
 * If we have inserted content into a dijit dialog, then try and layout the dialog again to ensure its position is correct
 * @param target the element the content has just been inserted into.
 * @private
 */
hyf.util.layoutDialogAfterInsertContent = function(target)
{
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.getEnclosingWidget) == 'function'))
    {
        var parentDialog = dijit.getEnclosingWidget(target);

        while (parentDialog != null)
        {
            if (parentDialog.declaredClass.indexOf('dijit.Dialog') == 0)
            {
                //is a dialog
                if (typeof(parentDialog.layout) == 'function')
                    parentDialog.layout();
                else if (typeof(parentDialog.resize) == 'function')
                    parentDialog.resize();

                break;
            }

            //check if this dijit is itself inside a dialog
            parentDialog = dijit.getEnclosingWidget(parentDialog.domNode.parentNode);
        }
    }
}


/**
 * Creates an object containing the contents of all the input fields within the specified container
 *
 * @param cont The container DOM object to process.
 * @param actionName (optional) The name of the action being called.  If present, then the associated instance
 *                              field will be included in the returned object.
 * @param dataContainer (optional) Container object to place the data in to.  Can be either a plain object (for name to value mappings), or a FormData object.
 *                              If not provided this will be created automatically.
 * @return All the data from the specified container.  This will either be a FormData object, or an associative array object mapping param names to values,
 *                              depedning on the browser version, and any incoming dataContainer.
 *
 * @private
 */
hyf.util.encodeContainer = function(cont, actionName, dataContainer)
{
    if (cont == null || typeof(cont) == 'undefined')
        return;

    //work out which data container object to use to store the information in.
    var data;

    if (dataContainer)
        data = dataContainer;
    else
    {
        if (typeof(window.FormData) !== 'undefined')
            data = new FormData();
        else
            data = new Object();
    }

    //work out whether the data container should be treatd as a FormData object or not.
    var dataIsFormData = (typeof(data.append) === 'function');

    var inputs = cont.getElementsByTagName('input');

    for (var i = 0; i < inputs.length; ++i)
    {
        //look at the type of input
        switch (inputs[i].type)
        {
            case 'file'     :   //can only handle file controls if using FormData
                                if (dataIsFormData)
                                {
                                    for (var f = 0; f < inputs[i].files.length; ++f)
                                    {
                                        data.append(inputs[i].name, inputs[i].files[f]);
                                    }

                                    //check for dragged files
                                    hyf.fileUpload.addDraggedFilesToFormData(inputs[i], data);
                                }
                                break;
            case 'radio'    :
            case 'checkbox' :   if (inputs[i].checked)
                                {
                                    if (dataIsFormData)
                                        data.append(inputs[i].name, inputs[i].value);
                                    else
                                    {
                                        //handle multi check fields
                                        if (data[inputs[i].name])
                                        {
                                            if (typeof(data[inputs[i].name]) == 'string')
                                            {
                                                var values = new Array();
                                                values.push(data[inputs[i].name]);
                                                data[inputs[i].name] = values;
                                            }
                                            data[inputs[i].name].push(inputs[i].value);

                                        }
                                        else
                                            data[inputs[i].name] = inputs[i].value;
                                    }
                                }
                                break;
            //QUESTION: How should we handle these types?  Should they be submitted?
            case 'image'    :   break;
            case 'button'   :   break;
            case 'reset'    :   break;
            case 'submit'   :   break;
            default         :   var val = (hyf.validation.isValueMasked(inputs[i])) ? hyf.validation.getUnmaskedValue(inputs[i]) : inputs[i].value;
                                if (dataIsFormData)
                                    data.append(inputs[i].name, val);
                                else
                                    data[inputs[i].name] = val;
        }
    }

    inputs = cont.getElementsByTagName('textarea');
    for (var i = 0; i < inputs.length; ++i)
    {
        //if this is a rich text editor, update the underyling textarea before we take the value
        if (hyf.richtext && hyf.richtext.isRichText(inputs[i]))
            hyf.richtext.updateTextareaValue(inputs[i]);

        var val = (hyf.validation.isValueMasked(inputs[i])) ? hyf.validation.getUnmaskedValue(inputs[i]) : inputs[i].value;
        if (dataIsFormData)
            data.append(inputs[i].name, val);
        else
            data[inputs[i].name] = val;
    }

    inputs = cont.getElementsByTagName('select');
    for (var i = 0; i < inputs.length; ++i)
    {
        if (inputs[i].type == 'select-multiple')
        {
            var values = new Array();
            for (var j = 0; j < inputs[i].options.length; ++j)
            {
                if (inputs[i].options[j].selected)
                {
                    if (dataIsFormData)
                        data.append(inputs[i].name, inputs[i].options[j].value);
                    else
                        values.push(inputs[i].options[j].value);
                }
            }
            if (values.length > 0)
                data[inputs[i].name] = values;
        }
        else
        {
            if (dataIsFormData)
                data.append(inputs[i].name, inputs[i].value);
            else
                data[inputs[i].name] = inputs[i].value;
        }
    }

    //need to add the language value as this wont be included in the encoded group
    for (var i = 0; i < document.forms.length; ++i)
    {
        if (typeof(document.forms[i].Language) != 'undefined')
        {
            if (dataIsFormData)
                data.append('Language', document.forms[0].Language.value);
            else
                data['Language'] = document.forms[0].Language.value;
            break;
        }
    }

    //ensure the is_script_enabled flag is always present incase this is being checked on the server
    if (dataIsFormData)
        data.append('is_script_enabled', 'true');
    else
        data['is_script_enabled'] = 'true';

    //add the appropriate xform instance field if the action value has been provided
    if (typeof(actionName) != 'null')
    {
        //First check for the simple case where there is an instance field for this specific action.
        var xif = document.getElementById('xgf_xform_instance_xga_' + actionName);
        if (xif != null)
        {
            if (dataIsFormData)
                data.append(xif.name, xif.value);
            else
                data[xif.name] = xif.value;
        }
        else
        {
            //if not then loop through all the fields to see if we have an instance structure to use
            var possInstances = document.getElementsByTagName('input');

            var possInstance = null;

            for (var i = 0; i < possInstances.length; ++i)
            {
                if (possInstances[i].type == 'hidden')
                {
                    if ((possInstances[i].name == 'xform_instance') && (possInstance == null))
                        possInstance = possInstances[i]
                    else if (possInstances[i].name.indexOf('xgf_xform_instance') == 0)
                    {
                        if ((possInstances[i].name + '_').indexOf('_xga_' + actionName + '_') != -1)
                        {
                            possInstance = possInstances[i];
                            break;
                        }
                    }
                }
            }
            if (possInstance != null)
            {
                if (dataIsFormData)
                    data.append(possInstance.name, possInstance.value);
                else
                    data[possInstance.name] = possInstance.value;
            }
        }
    }

    return data;
};


/**
 * Resets all the form controls in the given container.
 * Depending on the provided mode value, this will either 'reset' their values to those shown when the
 * page was first displayed, or 'clear' the values completely.
 * @param container {Group_Name} The HTML container whose form controls should be processed.
 * @param mode {string} (optional) Indicates which type of reset should apply.
 * Either 'reset' (default) or 'clear'.
 * 'reset' will put the previous values from when the page was loaded including defaults.
 * 'clear' will remove all the values.
 *
 * @author Hyfinity Limited
 */
hyf.util.resetContainer = function(container, mode)
{
    if (typeof(container) == 'string')
        container = document.getElementById(container);
    if ((container == null) || (typeof(container) == 'undefined'))
        return;
    if ((typeof(mode) == 'undefined') || ((mode != 'reset') && (mode != 'clear')))
       mode = 'reset';

    var controls = new Array();
    var inputs = container.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; ++i)
        controls[controls.length] = inputs[i];
    inputs = container.getElementsByTagName('select');
    for (var i = 0; i < inputs.length; ++i)
        controls[controls.length] = inputs[i];
    inputs = container.getElementsByTagName('textarea');
    for (var i = 0; i < inputs.length; ++i)
        controls[controls.length] = inputs[i];

    //for radio and multicheck type controls, we will have multiple entries in the
    //controls array so store the values to set in this object to process at the end.
    //ach entry in this object will map control name to an array of values
    var objMultiPartControls = new Object();
    for (var i = 0; i < controls.length; ++i)
    {
        //look at the type of input
        if (mode == 'clear')
        {
            switch (controls[i].type)
            {
                case 'image'    :   break;
                case 'button'   :   break;
                case 'reset'    :   break;
                case 'submit'   :   break;
                case 'file'     :   hyf.fileUpload.clearControl(controls[i]);
                                    break;
                case 'hidden'   :   break;
                case 'select-one':  //want select one control to default to the first value?
                                    hyf.util.setFieldValue(controls[i].id, controls[i].options[0].value);
                                    break;
                case 'select-multiple': hyf.util.setFieldValue(controls[i].id, null);
                                        break;
                case 'radio'    :
                case 'checkbox' :   objMultiPartControls[controls[i].name] = [""];
                                    break;
                default         :   hyf.util.setFieldValue(controls[i].id, "");
            }
        }
        else
        {
            switch (controls[i].type)
            {
                case 'image'    :   break;
                case 'button'   :   break;
                case 'reset'    :   break;
                case 'submit'   :   break;
                case 'file'     :   hyf.fileUpload.clearControl(controls[i]);
                                    break;
                case 'hidden'   :   break;
                case 'select-one':  var selected = controls[i].options[0].value; //reset to first entry if no other one was selected
                                    for (var op = 0; op < controls[i].options.length; ++op)
                                    {
                                        if (controls[i].options[op].defaultSelected)
                                            selected = controls[i].options[op].value;
                                    }
                                    hyf.util.setFieldValue(controls[i].id, selected);
                                    break;
                case 'select-multiple':
                                    //clear out all current selections
                                    hyf.util.setFieldValue(controls[i].id, null);
                                    //select any entries that were default selected
                                    for (var op = 0; op < controls[i].options.length; ++op)
                                    {
                                        if (controls[i].options[op].defaultSelected)
                                            hyf.util.setFieldValue(controls[i].id, controls[i].options[op].value);
                                    }
                                    break;
                case 'radio'    :
                case 'checkbox' :   if (!objMultiPartControls[controls[i].name])
                                        objMultiPartControls[controls[i].name] = [];
                                    if (controls[i].defaultChecked)
                                        objMultiPartControls[controls[i].name].push(controls[i].value);
                                    break;
                default         :   hyf.util.setFieldValue(controls[i].id, controls[i].defaultValue);
            }
        }
    }

    //now handle any multiple input control (eg radio or multi check)
    for (var entry in objMultiPartControls)
    {
        //clear out all existing values
        hyf.util.setFieldValue(entry, null);

        //if resetting, then set the requiored values
        if (mode == 'reset')
        {
            for (var i = 0; i < objMultiPartControls[entry].length; ++i)
            {
                hyf.util.setFieldValue(entry, objMultiPartControls[entry][i]);
            }
        }
    }
}

/**
 * Checks to see if the given container contains any dojo widgets
 * or other widget type controls (eg autocomplete)
 * @param container The HTML container to look within. If not provided then the
 *              document body will be used instead.
 * @private
 * @return boolean value
 */
hyf.util.hasWidgets = function(container)
{
    if ((typeof(container) == 'undefined') || (container == null))
        container = document.body;

    var dojoWidgets = hyf.util.getDijitWidgets(container);
    if (dojoWidgets.length > 0)
        return true;

    if (hyf.autocomplete && hyf.autocomplete.hasAutocompletes(container))
        return true;

    return false;
}


/**
 * Attempts to destroy any dojo widgets that are present in the specified container
 * @param container The HTML container to destroy dojo widgets within. If not provided then the
 *              document body will be used instead, to destroy any widgets on the page.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.destroyDojoWidgets = function(container)
{
    if ((typeof(container) == 'undefined') || (container == null))
        container = document.body;

    var widgets = hyf.util.getDijitWidgets(container);
    for (var i = 0; i < widgets.length; ++i)
    {
        var widget = widgets[i];
        widget.destroyRecursive();
        delete widget;
    }


    //check if there were any dialog widgets added by this container
    //and of so also destroy these.
    //This is needed because these widgets are moved out of the container during
    //initialisation, and so wouldnt be found above.
    //This uses the _hyfAddedDialogIds array which is initialised in the widgetsParsed
    //code below whenever a new dialog has been created from a given container
    var containersToProcess = dojo.query('.hyf-added-dialog', container);
    containersToProcess.push(container);
    containersToProcess.forEach(function(item){

            if (item._hyfAddedDialogIds)
            {
                for (var i = 0; i < item._hyfAddedDialogIds.length; ++i)
                {
                    var id = item._hyfAddedDialogIds[i];
                    var d = dijit.byId(id);
                    if (d)
                    {
                        d.destroyRecursive();
                        delete d;
                    }
                }
            }
    });

    hyf.hooks.widgetsDestroyed(container);
}

/**
 * Connect to the contentInserted and widgetsParsed hooks to check if any newly inserted content
 * has created any new dialog widgets.
 * If so, this information is stored for later use in the destroyDojoWidgets method above.
 */
require(['dojo/topic'], function(topic) {

    //before parsing any new content work out how many dialog widgets there are already
    topic.subscribe('hyf/hooks/contentInserted', function(container) {

            var currentDialogs = hyf.util.getDijitWidgets(document.body, 'dijit.Dialog');

            var dialogIds = new Array();
            for (var i = 0; i < currentDialogs.length; ++i)
            {
                dialogIds.push(currentDialogs[i].id);
            }

            container._hyfCurrentDialogIds = dialogIds;
    });


    //after parsing widgets in new content, check again which dialogs exist
    //assume any new ones were added from this content so note them for correct removal later
    topic.subscribe('hyf/hooks/widgetsParsed', function(container) {

            var newDialogs = hyf.util.getDijitWidgets(document.body, 'dijit.Dialog');

            var newDialogIds = new Array();
            for (var i = 0; i < newDialogs.length; ++i)
            {
                var dialogId = newDialogs[i].id;

                var found = false;
                if (container._hyfCurrentDialogIds)
                {
                    for (var j = 0; j < container._hyfCurrentDialogIds.length; j++)
                    {
                        if (container._hyfCurrentDialogIds[j] == dialogId)
                        {
                            found = true;
                            break;
                        }
                    }
                }

                if (!found)
                    newDialogIds.push(dialogId)
            }

            if (typeof(container._hyfCurrentDialogIds) != 'undefined')
            {
                container._hyfCurrentDialogIds = null;
                //delete fails on earlier IE browsers
                try {
                    delete container._hyfCurrentDialogIds;
                } catch (e) { }
            }

            if (newDialogIds.length > 0)
            {
                container._hyfAddedDialogIds = newDialogIds;
                dojo.addClass(container, 'hyf-added-dialog');
            }
    });
});



/*
 * The hyf.textarea namespace contains all functionality relating to textarea field controls.
 */
hyf.textarea =
{
    desc : "Handles functionality relating to textareas, eg auto expanding fields."
};

/**
 * Handles automatically updating the size of the supplied textarea to support the current content.
 * This will increase the height of the textarea so that there is no scroll bar.
 * Use a max-height CSS setting if you need to set a maximum size.
 *
 * @param evt The event object that triggered the call.
 * @param field The textarea object to adjust
 * @private
 * @author Hyfinity Limited
 */
hyf.textarea.adjustHeight = function(evt, field)
{
    if ((evt != null) && (typeof(evt) != 'undefined'))
        var charCode = (evt.which) ? evt.which : event.keyCode;

    //ignore the arrow keys and shift/ctrl key
    if ((charCode >= 37 && charCode <= 40) || (charCode == 16) || (charCode == 17) || (evt && evt.ctrlKey))
    {
        return;
    }

    //ensure the textarea has been correctly initiated
    if (!field._clone)
        hyf.textarea.initTextarea(field);


    //make sure the clone has the same width as the actual field
    field._clone.style.width = field.offsetWidth + 'px';

    field._clone.value = field.value
    var newHeight = field._clone.scrollHeight + 5;


    //only make any changes if the new height is different to the last one we found
    if (newHeight != field._lastHeight)
    {
        field.style.height = newHeight + 'px';
        field._lastHeight = newHeight;
    }
};



/**
 * Initialises the given textarea so that the expanding functionality
 * will work correctly.
 * @param ta The textarea to initialise.
 * @private
 * @author Hyfinity Limited
 */
hyf.textarea.initTextarea = function(ta)
{
    //remove any current rows setting, as we will instead be adjusting the
    //height of the control
    ta.removeAttribute('rows');

    ta.style.overflow ='auto';

    //make a clone of the textarea that we can use to determine what height
    //the main textarea should be
    var clone = ta.cloneNode(true);
    ta._clone = clone;

    dojo.addClass(ta, 'autoExpandTextarea');
    dojo.addClass(clone, 'autoExpandClone');

    //ensure the clone doesn't appear or affect the working of the page
    clone.removeAttribute('id');
    clone.removeAttribute('name');
    clone.disabled = true;
    dojo.style(clone, {overflowY : 'auto', position: 'absolute', top: '0px', left : '-99999px', height : '1em'});
    ta.parentNode.appendChild(clone);

    ta._lastHeight = 0;

    //just to be sure, add another call to update the size, on focus of the field.
    dojo.connect(ta, 'onfocus', ta, new Function('this.onkeyup()'));
    dojo.connect(ta, 'onchange', ta, new Function('this.onkeyup()'));
}



/**
 * Checks the provided fieldId to see if it looks like it actually also contains the
 * repeatId info, and if so try and split it out
 * @param fieldId The full Id to split
 * @return An object containing fieldName and repeatId properties.  If the provided Id could not be split
 *         then the fieldName property will match that passed in, and the repeatId will be an empty string.
 * @private
 */
hyf.util.splitFullFieldId = function(fieldId)
{
    var retObj = {fieldName: fieldId, repeatId: ''};

    var r = new RegExp('^(\\w*[a-zA-Z])([0-9]+)(\\w+)$');
    var match = r.exec(fieldId);
    if (match != null)
    {
        retObj.repeatId = match[1] + match[2];
        retObj.fieldName = match[3];
    }

    return retObj;
}


/*
 * Namespace for all the calendar related functionality
 * The configuration options for each calendar should be populated by script fragments in the actual page.
 */
hyf.calendar =
{
    config: {},  //associative array of field ids to their configuration options.
    activeFieldId: null,
    activeFieldRepeatId: null
};

/**
 * Gets the calendar object for the field with the given ID
 * If this object has already been created it is just returned,
 * otherwise a new calendar object will be created using the configuration options for this field
 * @param fieldId The ID of the field to get the calendar for.  There must be an entry in the
 *                  hyf.calendar.config array for this field
 * @param repeatId (Optional) If the field we are getting the calendar for is in a repeat, this specifies the repeat id for the
 *                  specific field in the repeat that wants a calendar.
 * @return The CalendarPopup object, or null if one couldn't be created.
 * @private
 * @author Hyfinity Limited
 */
hyf.calendar.getCalendar = function(fieldId, repeatId)
{
    if (typeof(hyf.calendar.config[fieldId]) == 'undefined')
    {
        return null;
    }
    else if (typeof(hyf.calendar.config[fieldId].calendar) != 'undefined')
    {
        //check the calendar was created for this repeat
        if ((typeof(repeatId) == 'undefined') || (repeatId == ''))
        {
            //not in a repeat, so can just use the existing calendar
            return hyf.calendar.config[fieldId].calendar;
        }
        else
        {
            if (repeatId == hyf.calendar.config[fieldId].currentCalendarRepeatId)
            {
                //current calendar is for same repeatId so can return it
                return hyf.calendar.config[fieldId].calendar;
            }
        }
    }

    //need to create a new calendar
    var newCal = hyf.calendar.initNewCalendar(fieldId, repeatId);

    hyf.calendar.config[fieldId].calendar = newCal;

    if ((typeof(repeatId) != 'undefined') && (repeatId != ''))
        hyf.calendar.config[fieldId].currentCalendarRepeatId = repeatId;
    else
        delete hyf.calendar.config[fieldId].currentCalendarRepeatId;

    return hyf.calendar.config[fieldId].calendar;
}

/**
 * Initialise the calendar object for the field with the given ID
 * This should never be called directly, use the getCalendar function above.
 * @param fieldId The ID of the field to get the calendar for.  There must be an entry in the
 *                  hyf.calendar.config array for this field
 * @param repeatId (Optional) If the field we are getting the calendar for is in a repeat, this specifies the repeat id for the
 *                  specific field in the repeat that wants a calendar.
 * @return The CalendarPopup object, or null if one couldn't be created.
 * @private
 * @author Hyfinity Limited
 */
hyf.calendar.initNewCalendar = function(fieldId, repeatId)
{

    var options = hyf.calendar.config[fieldId];
    var cal = new CalendarPopup('calendarDiv', fieldId);

    switch (options.type)
    {
        case 'year_select'  :   cal.showYearNavigation();
                                break;
        case 'year_entry'   :   cal.showYearNavigation();
                                cal.showYearNavigationInput();
                                break;
        case 'navigation_dropdowns' :   cal.showNavigationDropdowns();
                                cal.setYearSelectStartOffset(100);
                                break;
    }

    if (options.hasDate && options.hasTime)
        cal.setDisplayType('datetime');
    else if (options.hasDate)
        cal.setDisplayType('date');
    else if (options.hasTime)
        cal.setDisplayType('time');

    //check if seconds should be shown
    if (options.hasTime && options.displayFormat.indexOf('s') != -1)
        cal.showSeconds(true);

    if (options.hasTime && ((options.displayFormat.indexOf('h') != -1) || (options.displayFormat.indexOf('K') != -1)))
        cal.set12HourMode(true);

    //check the relevant field to try and find contstaint values
    var minExc = options.minExclusive;
    var maxExc = options.maxExclusive;

    var minInc, maxInc;

    var field = document.getElementById(((repeatId) ? repeatId : '') + fieldId);
    if (field != null)
    {
        var val = hyf.util.getWebMakerAttribute(field, 'minExclusive');
        if (val != null)
            minExc = val;
        val = hyf.util.getWebMakerAttribute(field, 'maxExclusive');
        if (val != null)
            maxExc = val;
        val = hyf.util.getWebMakerAttribute(field, 'minInclusive');
        if (val != null)
            minInc = val;
        val = hyf.util.getWebMakerAttribute(field, 'maxInclusive');
        if (val != null)
            maxInc = val;
    }


    if ((typeof(minExc) != 'undefined') && (minExc != null))
    {
        cal.addDisabledDates(null, convertDate(minExc, options.dataFormat, 'y-M-d'));
    }
    if ((typeof(maxExc) != 'undefined') && (maxExc != null))
    {
        cal.addDisabledDates(convertDate(maxExc, options.dataFormat, 'y-M-d'), null);
    }
    if ((typeof(minInc) != 'undefined') && (minInc != null))
    {
        var d = new Date(getDateFromFormat(minInc, options.dataFormat));
        d.setDate(d.getDate() - 1);
        cal.addDisabledDates(null, formatDate(d, 'y-M-d'));
    }
    if ((typeof(maxInc) != 'undefined') && (maxInc != null))
    {
        var d = new Date(getDateFromFormat(maxInc, options.dataFormat));
        d.setDate(d.getDate() + 1);
        cal.addDisabledDates(formatDate(d, 'y-M-d'), null);
    }

    cal.setReturnFunction("hyf.calendar.handleCalendarSelection");

    return cal;
}

/**
 * Shows the calendar popup for the given field ID.
 * @param fieldId {Field_Name} The ID of the field to show the calendar for.
 * @param repeatId {Repeat_Name} (optional) The repeatId value for the field if it is within a repeat.
 * @param evt (Optional) If the event object is provided then this function will try and determine the
 *              repeatId value from the source component for the event.  Only if this can't be found will
 *              the value of the repeatId parameter be looked at.
 *
 * @author Hyfinity Limited
 */
hyf.calendar.showCalendar = function(fieldId, repeatId, evt)
{
    if ((typeof(repeatId) == 'undefined') || (repeatId == null))
        repeatId = '';

    if (evt)
        repeatId = hyf.util.findRepeatId((evt.target || evt.srcElement), repeatId);

    if ((repeatId == '') && (typeof(hyf.calendar.config[fieldId]) == 'undefined'))
    {
        var names = hyf.util.splitFullFieldId(fieldId);
        repeatId = names.repeatId;
        fieldId = names.fieldName;
    }

    var cal = hyf.calendar.getCalendar(fieldId, repeatId);
    if ((cal != null) && (typeof(cal) != 'undefined'))
    {
        var format = '', value = '';
        if (hyf.calendar.config[fieldId].isSplitControl)
        {
            format = hyf.validation.DateValidator.getConcatDateFieldParts(repeatId + fieldId, "format", true);
            value = hyf.validation.DateValidator.getConcatDateFieldParts(repeatId + fieldId, "values", true);
        }
        else
        {
            var field = document.getElementById(repeatId + fieldId);
            value = field.value;
            format = field.getAttribute('_display_date_format');
            if (format == null)
                format = field.getAttribute('_data_date_format');
        }

        var datePreset = null, timePreset = null;
        if ((format != '') && (value != ''))
        {
            if (hyf.calendar.config[fieldId].hasDate)
                datePreset = convertDate(value, format, 'y-M-d');
            if (hyf.calendar.config[fieldId].hasTime)
                timePreset = convertDate(value, format, 'HH:mm:ss');
        }
        cal.showCalendar(repeatId + fieldId + '_calendar_anchor', datePreset, timePreset);
    }
    hyf.calendar.activeFieldId = fieldId;
    hyf.calendar.activeFieldRepeatId = repeatId;
}

/**
 * Hides the calendar popup for the given field ID.
 * @param fieldId {Field_Name} The ID of the field to hide the calendar for.
 *
 * @author Hyfinity Limited
 */
hyf.calendar.hideCalendar = function(fieldId)
{
    var cal = hyf.calendar.getCalendar(fieldId);

    if (cal == null)
    {
        cal = hyf.calendar.getCalendar(hyf.util.splitFullFieldId(fieldId).fieldName);
    }

    if (cal != null)
        cal.hideCalendar();
}

/**
 * Handles selection of a value from the active calendar popup.
 * This stores the value in the relevant controls on screen.
 * @param y The year value of the selected date
 * @param m The month value of the selected date
 * @param d The day value of the selected date
 * @private
 * @author Hyfinity Limited
 */
hyf.calendar.handleCalendarSelection = function(y, m, d, hour, min, sec)
{
    var newDate;
    if (y && m && d)
    {
        newDate = new Date(y, m-1, d);
        if (y < 100) //the date constructor maps 2 digit years to the 19 hundreds
            newDate.setFullYear(y);
    }
    else
        newDate = new Date();

    if (typeof(hour) != 'undefined' && hour != null) newDate.setHours(hour);
    if (typeof(min) != 'undefined' && min != null) newDate.setMinutes(min);
    if (typeof(sec) != 'undefined' && sec != null) newDate.setSeconds(sec);

    if (hyf.calendar.config[hyf.calendar.activeFieldId].isSplitControl)
    {
        hyf.calendar.setSplitDateControlValue(hyf.calendar.activeFieldRepeatId + hyf.calendar.activeFieldId, newDate);
    }
    else
    {
        var field = document.getElementById(hyf.calendar.activeFieldRepeatId + hyf.calendar.activeFieldId);
        var format = field.getAttribute('_display_date_format');
        if (format == null)
            format = field.getAttribute('_data_date_format');

        field.value = formatDate(newDate, format);

        hyf.fireEvent(field, 'change');
    }
}

/**
 * Function that is used when there is a dropdown date format used in conjunction with a pop-up calendar script
 * @private
 * @author Hyfinity Limited
 */
hyf.calendar.setSplitDateControlValue = function(id, dateObj)
{
    missCounter = 0;
    partCounter = 1;
    while(missCounter<2)
    {
        var currentField = document.getElementById(id+"_datefield_part_"+partCounter);
        if(currentField == null)
        {
            missCounter++;
        }
        else
        {
            var convertedValue = formatDate(dateObj, currentField.getAttribute('_display_date_format'));

            if ((currentField.type == "select-one") && (currentField.getAttribute('_display_date_format') == 'yyyy'))
            {
                var opt = document.createElement('option');
                opt.value = convertedValue;
                opt.appendChild(document.createTextNode(convertedValue));
                opt.selected = true;
                currentField.appendChild(opt);
                hyf.calendar.refreshYearDropDown(currentField);
            }
            else
            {
                currentField.value=convertedValue;
            }

            hyf.fireEvent(currentField, 'change');

            missCounter = 0;
        }
        partCounter++;
    }
}

/**
 * Makes sure that a select box for displaying a 4 digit year value, always
 * allows selections of + or - 100 years from the current value.
 * @param select The select box to update.
 * @param includeBlankEntry (Optional) boolean indicating whether to include a blank entry at
 *              the start of the new list of options.  True if not provided
 */
hyf.calendar.refreshYearDropDown = function(select, includeBlankEntry)
{
    if ((typeof(includeBlankEntry) == 'undefined') || (includeBlankEntry == null))
        includeBlankEntry = true;

    //dont change the options if the current value is blank.
    if (select.options[select.selectedIndex].value == '')
        return;

    var selectedVal = Number(select.options[select.selectedIndex].value);

    //remove all the existing options
    for (var i = select.options.length; i > 0; --i)
    {
        select.removeChild(select.options[i-1]);
    }

    //first add a blank value
    if (includeBlankEntry)
    {
        var blankOption = document.createElement('option');
        blankOption.value = '';
        select.appendChild(blankOption);
    }

    //now add all the needed year values
    for (var i = (selectedVal - 100); i <= (selectedVal + 100); ++i)
    {
        var opt = document.createElement('option');
        opt.value = i;
        opt.appendChild(document.createTextNode(i));
        if (i == selectedVal)
            opt.selected = true;
        select.appendChild(opt);
    }
}

/*
 * Stores a list of the keywords that are supported for the setDateConstraint function below.
 * For each one a script fragment is provided that will adjust the 'dateToAdjust' date object as needed.
 * @author Hyfinity Limited
 */
hyf.calendar.supportedKeywords = {
    'Today'     : '',
    'Yesterday' : 'dateToAdjust.setTime(dateToAdjust.getTime() - 86400000)',
    'Tomorrow'  : 'dateToAdjust.setTime(dateToAdjust.getTime() + 86400000)',
    'LastWeek'  : 'dateToAdjust.setTime(dateToAdjust.getTime() - 604800000)',
    'NextWeek'  : 'dateToAdjust.setTime(dateToAdjust.getTime() + 604800000)',
    'LastMonth' : 'dateToAdjust.setMonth(dateToAdjust.getMonth() - 1)',
    'NextMonth' : 'dateToAdjust.setMonth(dateToAdjust.getMonth() + 1)',
    'LastYear'  : 'dateToAdjust.setFullYear(dateToAdjust.getFullYear() - 1)',
    'NextYear'  : 'dateToAdjust.setFullYear(dateToAdjust.getFullYear() + 1)'
};


/**
 * This function allows date constraints to be set for a Date Field. This can include resticting the valid date range.
 * Note: to constrain all the field entries in a repeat, use the hyf.calendar.setRepeatDateConstraint function.
 *
 * @param dateField {Field_Name} Set to the Date field to be constrained.
 * @param restrictionType {string} Set to 'Minimum' or 'Maximum' value. Default is 'Minimum'.
 * @param restrictionValue {string | Field_Name} Set to one of the supported keywords, another Date Fieldname, or a data date value. Default is 'Today'.
 * The keyword values are: 'Today', 'Yesterday', 'Tomorrow', 'LastWeek', 'NextWeek', 'LastMonth', 'NextMonth', 'LastYear' or 'NextYear'.
 * @return boolean indicating whether the constraint was successfulyl set up.
 * @author Hyfinity Limited
 */
hyf.calendar.setDateConstraint = function(dateField, restrictionType, restrictionValue, repeatId)
{
    if (typeof(repeatId) == 'undefined')
    {
        var names = hyf.util.splitFullFieldId(dateField);
        repeatId = names.repeatId;
        dateField = names.fieldName;
    }

    var calendarConfig = hyf.calendar.config[dateField];
    var restrictionDateValue = null;
    if ((restrictionType == '') || (typeof(restrictionType) == 'undefined'))
    {
        restrictionType = 'Minimum';
    }
    if ((restrictionValue == '') || (typeof(restrictionValue) == 'undefined'))
    {
        restrictionValue = 'Today';
    }

    if (typeof(hyf.calendar.supportedKeywords[restrictionValue]) != 'undefined')
    {
        var dateToAdjust = new Date();

        if (hyf.calendar.supportedKeywords[restrictionValue] != '')
            eval(hyf.calendar.supportedKeywords[restrictionValue]);

        if (restrictionType == 'Minimum')
        {
            restrictionDateValue = formatDate(new Date(dateToAdjust.getTime() - 86400000), calendarConfig.dataFormat);
        }
        if (restrictionType == 'Maximum')
        {
            restrictionDateValue = formatDate(new Date(dateToAdjust.getTime() + 86400000), calendarConfig.dataFormat);
        }
    }
    else
    {
       var restrictionDate = document.getElementById(restrictionValue);
       if (restrictionDate != null)
       {
           restrictionDateValue = hyf.validation.ValueConverter.performDateConversion(restrictionDate, restrictionDate.value);
       }
       else
       {
           restrictionDateValue = restrictionValue;
       }
    }

    //make sure the restriction value has been set
    if ((restrictionDateValue != null) && (restrictionDateValue != ''))
    {
        var fieldId = repeatId + dateField;
        if (document.getElementById(fieldId))
        {
            var fieldFormat = document.getElementById(fieldId).getAttribute("_data_date_format");

            //make sure the restrictionDateValue actually contains a valid date for this field
            //in some cases the format might be null (eg if called from an onbeforeload event before the attributes are added)
            //so we just allow the constraint if we cant yet confirm the field format.
            if ((fieldFormat == null) || (isDate(restrictionDateValue, fieldFormat)))
            {
                if (restrictionType == 'Minimum')
                {
                    document.getElementById(fieldId).setAttribute('_minExclusive', restrictionDateValue );
                }
                if (restrictionType == 'Maximum')
                {
                    document.getElementById(fieldId).setAttribute('_maxExclusive', restrictionDateValue );
                }
                delete calendarConfig.calendar;

                //indicate a change against the control so that any validation etc handling can be refreshed
                hyf.fireEvent(document.getElementById(fieldId), 'change');

                return true;
            }
        }
    }
    return false;
}


/**
 * This supports setting the appropriate constraint for a date field within a repeat (eg table) structure.
 * This will make sure that the constraint is applied to the date field for each repeat entry (row)
 * @param repeatName {Repeat_Name} The name of the repeat the date field is contained within.
 * @param fieldName {Field_Name} The name of the date field to set the restriction for.
 * @param restrictionType {string} Set to 'Minimum' or 'Maximum' value. Default is 'Minimum'.
 * @param restrictionValue {string | Field_Name} Set to one of the supported keywords, another Date Fieldname, or a data date value. Default is 'Today'.
 * The keyword values are: 'Today', 'Yesterday', 'Tomorrow', 'LastWeek', 'NextWeek', 'LastMonth', 'NextMonth', 'LastYear' or 'NextYear'.
 * @param restrictionValueFieldInRepeat {boolean} (Optional) If set to true, then the restrictionValue is assumed to be the name of a date field within
 *              the same repeat as the field being restricted, and so the appropriate repeat ID is automatically added so that each
 *              field being restricted is based on the field in the same repeat row.
 *
 * @author Hyfinity Limited
 */
hyf.calendar.setRepeatDateConstraint = function(repeatName, fieldName, restrictionType, restrictionValue, restrictionValueFieldInRepeat)
{

    //field name might actually come in with the repeatId at the start, so check for this, and strip it off
    if (fieldName.indexOf(repeatName) == 0)
        fieldName = hyf.util.splitFullFieldId(fieldName).fieldName;


    //loop through the repeat to set the constraint on each field found
    var count = 1;
    var field = document.getElementById(repeatName + count + fieldName);
    while (field != null)
    {
        if ((typeof(restrictionValueFieldInRepeat) != 'undefined') && (restrictionValueFieldInRepeat == true))
            hyf.calendar.setDateConstraint(fieldName, restrictionType, repeatName + count + restrictionValue, repeatName + count);
        else
            hyf.calendar.setDateConstraint(fieldName, restrictionType, restrictionValue, repeatName + count);
        count++;
        field = document.getElementById(repeatName + count + fieldName);
    }

    //now check for editable table insert rows
    field = document.getElementById(repeatName + 'BlankEntry' + fieldName);
    if (field != null)
    {
        if ((typeof(restrictionValueFieldInRepeat) != 'undefined') && (restrictionValueFieldInRepeat == true))
            hyf.calendar.setDateConstraint(fieldName, restrictionType, repeatName + 'BlankEntry' + restrictionValue, repeatName + 'BlankEntry');
        else
            hyf.calendar.setDateConstraint(fieldName, restrictionType, restrictionValue, repeatName + 'BlankEntry');
    }
}


/**
 * This function allows the Mandatory (required) Data Constraint to be set.
 * @param field {Field_Name} Set to the field to be constrained.
 * @param isMandatory {boolean} Set to true if required, and false if not. The Mandatory Marker will be altered as appropriate.
 *
 * @author Hyfinity Limited
 */
hyf.util.setMandatoryConstraint = function(field, isMandatory)
{
    //Escape if mandatory field(s) not populated
    if ((isMandatory == null) || (typeof(isMandatory) != 'boolean'))
        return;
    if (typeof(field) != 'string')
        field = hyf.validation.ErrorDisplay.getFieldName(field);
    if (field == null)
        return;

    //first check for a dojo widget, as the fields are moved
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(field) != null))
    {
        dijit.byId(field).required = isMandatory;
        //indicate a change against the control so that any validation etc handling can be refreshed
        if (typeof(dijit.byId(field).onChange) == 'function')
            dijit.byId(field).onChange();
    }
    else
    {
        //As Radio and multi-check controls are multiple inputs, we need to loop through with the name to update all of them.
        var nameMatches = dojo.query('*[name=' + field + ']');

        for (var i = 0; i < nameMatches.length; ++i)
        {
           nameMatches[i].setAttribute('_required',isMandatory);

            //indicate a change against the control so that any validation etc handling can be refreshed
            hyf.fireEvent(nameMatches[i], 'change');
        }
    }

    //add the isMandatory class
    var cb = hyf.util.getFieldControlBody(field)
    if (isMandatory)
        dojo.addClass(cb, 'isMandatory');
    else
        dojo.removeClass(cb, 'isMandatory');

    //Now we need to set the mandatory Markers appropriately if this option is enabled.
    if (hyf.validation.config.mandatoryMarker)
    {
        var mandatoryMarkerID = field + '_marker';
        var mandatoryMarker = document.getElementById(mandatoryMarkerID);

        if (mandatoryMarker != null)
        {
            // Mandatory market element already present, so change the details
            if (isMandatory == false)
            {
                mandatoryMarker.parentNode.removeChild(mandatoryMarker);
            }
        }
        else
        {
            // Mandatory marker not present, so create marker appropriately in the right location
            if (isMandatory == true)
            {
                //create the new marker span
                var newMarkerSpan = document.createElement('span');
                newMarkerSpan.id = mandatoryMarkerID;
                newMarkerSpan.title = 'Mandatory field marker';
                newMarkerSpan.className = hyf.validation.config.mandatoryMarker.className;
                newMarkerSpan.style.cssText = hyf.validation.config.mandatoryMarker.style;
                newMarkerSpan.innerHTML = hyf.validation.config.mandatoryMarker.content;

                //work out where to put it
                switch (hyf.validation.config.mandatoryMarker.location)
                {
                    case 'before_label':
                        var labelForField = hyf.util.getFieldLabel(field);
                        if (labelForField != null)
                            labelForField.insertBefore(newMarkerSpan, labelForField.firstChild);
                        break;
                    case 'after_label':
                        var labelForField = hyf.util.getFieldLabel(field);
                        if (labelForField != null)
                            labelForField.appendChild(newMarkerSpan);
                        break;
                    case 'before_control':
                        var cb = hyf.util.getFieldControlBody(field)
                        if (cb != null)
                            cb.insertBefore(newMarkerSpan, cb.firstChild);
                        break;
                    case 'after_control':
                        var cb = hyf.util.getFieldControlBody(field)
                        if (cb != null)
                            cb.appendChild(newMarkerSpan);
                        break;
                }
            }
        }
    }
}

/**
 * This function allows the Number Inclusive Range Minimum and Maximum Data constraints to be set.
 * @param field {Field_Name} Set to the field to be constrained (should be a number type field).
 * @param minInclusive {number} (optional) A negative or positive decimal number e.g. -10.00. If blank, an existing value will be removed. If null then the value won't be changed.
 * @param maxInclusive {number} (optional) A negative or positive decimal number e.g. 99999.99.  If blank, an existing value will be removed. If null then the value won't be changed.
 *
 * @author Hyfinity Limited
 */
hyf.util.setInclusiveRangeConstraint = function(field, minInclusive, maxInclusive)
{
    //Escape if mandatory field(s) not populated
    if (field == null)
        return;
    //Allow Numbers, null or blank, but not anything else.
    if ((isNaN(minInclusive)) || (isNaN(maxInclusive)))
        return;

    //first check for a dojo widget, as the fields are moved
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(field) != null))
    {
        if (typeof(field) == 'object')
            field = dijit.byId(field).id;
        if (typeof(field) != 'string')
            return;
        if (minInclusive != null)
            if (minInclusive != '')
                dijit.byId(field).constraints.min = minInclusive;
            else
                dijit.byId(field).constraints.min = -Infinity;
        if (maxInclusive != null)
            if (maxInclusive != '')
                dijit.byId(field).constraints.max = maxInclusive;
            else
                dijit.byId(field).constraints.max = +Infinity;

        //indicate a change against the control so that any validation etc handling can be refreshed
        if (typeof(dijit.byId(field).onChange) == 'function')
            dijit.byId(field).onChange();

    }
    else
    {
        if (typeof(field) == 'string')
            field = document.getElementById(field);
        if (field == null)
            return;

        if (minInclusive != null)
        {
            if (minInclusive != '') {
                field.setAttribute('_minInclusive',minInclusive);
                if (field.type == 'range')
                    field.setAttribute('min',minInclusive);
            }
            else {
                field.removeAttribute('_minInclusive');
                if (field.type == 'range')
                    field.removeAttribute('min');
            }
        }
        if (maxInclusive != null)
        {
            if (maxInclusive != '') {
                field.setAttribute('_maxInclusive',maxInclusive);
                if (field.type == 'range')
                    field.setAttribute('max', maxInclusive);
            }
            else {
                field.removeAttribute('_maxInclusive');
                if (field.type == 'range')
                    field.removeAttribute('max');
            }
        }

        //indicate a change against the control so that any validation etc handling can be refreshed
        hyf.fireEvent(field, 'change');
    }
}

/**
 * This function allows the Number Exclusive Range Minimum and Maximum Data constraints to be set.
 * @param field {Field_Name} Set to the field to be constrained (should be a number type field).
 * @param minExclusive {number} (optional) A negative or positive decimal number e.g. 0.00. If blank, an existing value will be removed. If null then the value won't be changed.
 * @param maxExclusive {number} (optional) A negative or positive decimal number e.g. 99999.99.  If blank, an existing value will be removed. If null then the value won't be changed.
 *
 * @author Hyfinity Limited
 */
hyf.util.setExclusiveRangeConstraint = function(field, minExclusive, maxExclusive)
{
    //Escape if mandatory field(s) not populated
    if (field == null)
        return;
    //Allow Numbers, null or blank, but not anything else.
    if ((isNaN(minExclusive)) || (isNaN(maxExclusive)))
        return;

    //first check for a dojo widget, as the fields are moved
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(field) != null))
    {
        if (typeof(field) == 'object')
            field = dijit.byId(field).id;
        if (typeof(field) != 'string')
            return;
    	if (minExclusive != null)
            if (minExclusive != '')
            {
                var fixedMinPlaces = Number(minExclusive).toFixed(dijit.byId(field).constraints.places);
                dijit.byId(field).constraints.min = Number(fixedMinPlaces) - 1.00;
            }
            else
                dijit.byId(field).constraints.min = -Infinity;
        if (maxExclusive != null)
            if (maxExclusive != '')
            {
                var fixedMaxPlaces = Number(maxExclusive).toFixed(dijit.byId(field).constraints.places);
                dijit.byId(field).constraints.max = Number(fixedMaxPlaces) + 1.00;
            }
            else
                dijit.byId(field).constraints.max = +Infinity;

        //indicate a change against the control so that any validation etc handling can be refreshed
        if (typeof(dijit.byId(field).onChange) == 'function')
            dijit.byId(field).onChange();
    }
    else
    {
        if (typeof(field) == 'string')
            field = document.getElementById(field);
        if (field == null)
            return;

        if (minExclusive != null)
            if (minExclusive != '')
                field.setAttribute('_minExclusive',minExclusive);
            else
                field.removeAttribute('_minExclusive');
        if (maxExclusive != null)
            if (maxExclusive != '')
                field.setAttribute('_maxExclusive',maxExclusive);
            else
                field.removeAttribute('_maxExclusive');

        //indicate a change against the control so that any validation etc handling can be refreshed
        hyf.fireEvent(field, 'change');
    }
}

/**
 * This function allows the String Length Range Minimum and Maximum Data constraints to be set.
 * @param field {Field_Name} Set to the field to be constrained (should be a string type field).
 * @param minimumLength {number} (optional) A positive number e.g. 0. If blank, an existing value will be removed. If null then the value won't be changed.
 * @param maximumLength {number} (optional) A positive decimal number e.g. 99.  If blank, an existing value will be removed. If null then the value won't be changed.
 * @param fixedLength   {number} (optional) A positive decimal number e.g. 10.  If blank, an existing value will be removed. If null then the value won't be changed.
 *
 * @author Hyfinity Limited
 */
hyf.util.setStringLengthConstraint = function(field, minimumLength, maximumLength, fixedLength)
{
    //Escape if mandatory field(s) not populated
    if (typeof(field) == 'string')
        field = document.getElementById(field);
    if (field == null)
        return;
    //Allow Numbers, null or blank, but not anything else.
    if ((isNaN(minimumLength)) || (isNaN(maximumLength)) || (isNaN(fixedLength)))
        return;

    if ((minimumLength != null) && (minimumLength != '') && (minimumLength >= 0))
    {
        field.setAttribute('_minLength',minimumLength);
    }
    if ((maximumLength != null) && (maximumLength != '') && (maximumLength >= 0))
    {
        field.setAttribute('_maxLength',maximumLength);
        field.setAttribute('maxLength',maximumLength);
    }
    if ((fixedLength != null) && (fixedLength != '') && (fixedLength >= 0))
    {
        field.setAttribute('_length',fixedLength);
        field.setAttribute('maxLength',fixedLength);
    }

    if (minimumLength = '')
    {
        field.removeAttribute('_minLength');
    }
    if (maximumLength = '')
    {
        field.removeAttribute('_maxLength');
    }
    if ((fixedLength = '') && (maximumLength = ''))
    {
        field.removeAttribute('maxLength');
    }

    //indicate a change against the control so that any validation etc handling can be refreshed
    hyf.fireEvent(field, 'change');
}

/**
 * This function allows the Field Pattern (Regular Expression) Data constraints to be set.
 * @param field {Field_Name} Set to the field to be constrained (should be a string or number type field).
 * @param pattern {string} A string with a regular expression. If blank, an existing value will be removed.
 *
 * @author Hyfinity Limited
 */
hyf.util.setFieldPatternConstraint = function(field, pattern)
{
    //Escape if mandatory field(s) not populated
    if (typeof(field) == 'string')
        field = document.getElementById(field);
    if ((field == null) || (pattern == null))
        return;
    //Allow only strings.
    if (typeof(pattern) != 'string')
        return;

    if (pattern != '')
        field.setAttribute('_regularExpression',pattern);
    else
        field.removeAttribute('_regularExpression');

    //indicate a change against the control so that any validation etc handling can be refreshed
    hyf.fireEvent(field, 'change');
}

/**
 * This function allows the focus to be placed on a specific field. This will place the cursor in the relvant field.
 * @param field {Field_Name} The name of the field to focus. (or its HTML component)
 * @return boolean indicating whether focus has successfully been set.
 *
 * @author Hyfinity Limited
 */
hyf.util.setFocusOnField = function(field)
{
    var fieldName = field;
    //Escape if mandatory field(s) not populated
    if (typeof(field) == 'string')
        field = document.getElementById(field);
    else
        fieldName = hyf.validation.ErrorDisplay.getFieldName(field);

    //check if this is actually a dojo widget
    if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(fieldName) != null))
    {
        try
        {
            var widget = dijit.byId(fieldName);
            //try and open up any hidden layout containers (eg tabs, accordions) first if needed
            hyf.util.makeLayoutContainersVisible(hyf.util.findFieldLayoutContainerParents(widget.domNode));

            widget.focus();
            return true;
        }
        catch (e)
        {
            return false;
        }
    }


    if (field == null)
    {
        //Check if radio or multi-checkbox button as the id of the first option will be the name + 1.
        field = document.getElementById(fieldName + '1');
        if (field == null)
            return false;
        if ((field.getAttribute('type') != 'radio') && (field.getAttribute('type') != 'checkbox'))
            return false;
    }


    try
    {
        //try and open up any hidden layout containers (eg tabs, accordions) first if needed
        hyf.util.makeLayoutContainersVisible(hyf.util.findFieldLayoutContainerParents(field));

        //if still hidden we can't focus, so return false
        if (hyf.util.checkFieldHidden(field))
        {
            return false;
        }

        field.focus();
        //if focus is successful we return true
        return true;
    }
    catch (e)
    {
        //couldn't focus so just return false
        return false;
    }
}

require(["dojo/query", "dojo/NodeList-traverse"], function(query){

    /**
     * Attempts to set focus on the first control found in the given container
     * @param container (Optional) The HTML element (or its id) to focus the first control within.
     *                  If not provided, the document body will be assumed.
     * @return boolean indicating whether focussing was successful or not.
     * @author Hyfinity Limited
     */
    hyf.util.setFocusOnFirstField = function(container)
    {
        if (typeof(container) == 'undefined')
            container = document.body;

        if (typeof(container) == 'string')
            container = dojo.byId(container);

        if (container == null)
            return false;

        //find all the control container elements in the given container, making sure they each have a controlBody inside
        var controlBackgrounds = dojo.query('*[id$="_container"] .controlBody', container).closest('*[id$="_container"]');

        //check if we should add the passed in container as well
        if ((container.id.indexOf('_container', container.id.length - 10) != -1) && (dojo.query('.controlBody', container).length > 0))
            controlBackgrounds.push(container);

        for (var i = 0; i < controlBackgrounds.length; ++i)
        {
            var cbi = controlBackgrounds[i].id;
            var controlId = cbi.substr(0, cbi.length - 10)//remove the _container ending

            if (hyf.util.setFocusOnField(controlId))
                return true;
        }

        return false;
    }

});


/**
 * This function should be called when loading the page for any select box that
 * is being rendered as a dojo filtering select, and has an initial 'please select'
 * entry defined.
 * This function removes this option form the HTML, and ensures that the dojo placeholder
 * value will be initially displayed as needed.
 * @param field The HTML select object before it has been converted to the dojo widget.
 * @private
 * @author Hyfinity Limited
*/
hyf.util.initFilteringSelect = function(field)
{
    if (field.type == 'select-one')
    {
        //check if the intial 'please select' entry is currently selected
        //if so, we need to make sure the select has a value attribute
        //set to '' so that dojo correctly displays the placeholder value instead
        if (field.value == '')
        {
            field = hyf.util.addHtmlAttribute(field, 'value', '');
        }

        //remove the 'please select' option tag so it cant be selected
        field.removeChild(field.getElementsByTagName('option')[0]);
    }
}

/**
 * This method attempts to add an HTML attribute to the given field,
 * rather than setting a object property.
 * For browsers that correctly support setAttribute, this is used,
 * but for older IE browsers the outerHTML string is updated directly.
 * As a result, the reference to the field object could be outdated,
 * and so the new reference is always returned
 * @param field The object representing the HTML field to add the attribute to
 * @param attribute The name of the attribute to add
 * @param value The value to give the new attribute
 * @return The updated field object
 * @private
 * @author Hyfinity Limited
 */
hyf.util.addHtmlAttribute = function(field, attribute, value)
{
    //IE versions before 8 do not correctly support set attribute,
    //so instead we need to update the HTML string
    if (dojo.isIE < 8)
    {
        var id = field.id;
        var oh = field.outerHTML;
        var insertPoint = oh.indexOf('>');
        oh = oh.substring(0, insertPoint) + ' '+attribute+'="'+value+'"' + oh.substr(insertPoint);
        field.outerHTML = oh;
        field = document.getElementById(id);
    }
    else
    {
        field.setAttribute(attribute, value);
    }
    return field;
}

/**
 * This method attempts to remove an HTML attribute from the given field.
 * For browsers that correctly support removeAttribute, this is used,
 * but for older IE browsers the outerHTML string is updated directly.
 * As a result, the reference to the field object could be outdated,
 * and so the new reference is always returned
 * @param field The object representing the HTML field to remove the attribute from
 * @param attribute The name of the attribute to remove
 * @return The updated field object
 * @private
 * @author Hyfinity Limited
 */
hyf.util.removeHtmlAttribute = function(field, attribute)
{
    //IE versions before 8 do not correctly support set attribute,
    //so instead we need to update the HTML string
    if (dojo.isIE < 8)
    {
        var id = field.id;
        var oh = field.outerHTML;
        var elementEnd = oh.indexOf('>');
        var attLoc = oh.indexOf(attribute + '=');
        if ((attLoc == -1) || (attLoc > elementEnd))
            return field;

        var quote = oh.substr(attLoc + 1, 1)
        if ((quote != '"') && (quote != "'"))
            quote = ' ';

        var attEnd = oh.indexOf(quote, attLoc + attribute.length + 2);
        oh = oh.substring(0, attLoc) + oh.substr(attEnd + 1);
        field.outerHTML = oh;
        if(id)
            field = document.getElementById(id);
    }
    else
    {
        field.removeAttribute(attribute);
    }
    return field;
}


/**
 * Checks the given event to see if it represents a backspace key event
 * that should be disabled to stop the browser going back to the previous page.
 * @return true if the event represents a backspace key that will trigger the previous page,
 *          false otherwise
 * @private
 * @author Hyfinity Limited
 */
hyf.util.checkDisableBackspace = function(e)
{
    if (!e)
        e = window.event;

    var key;

     //return when the key is not backspace key
    if(e) {
        key = e.which? e.which : e.keyCode;
        if(key == null || ( key != 8 && key != 13)){
            return false;
        }
    }
    else
    {
        return false;
    }

    //Code is either 8 or 13
    var tag, type, readOnly = false;
    if (e.srcElement)
    {
        //ie
        tag = e.srcElement.tagName.toUpperCase();
        type = e.srcElement.type;
        readOnly =e.srcElement.readOnly;
        if( type == null){ //Type is null means the mouse focus on a non-form field. Disable backspace button
            return true;
        }
        else
        {
            type = e.srcElement.type.toUpperCase();
        }
    } else {
        //firefox
        tag = e.target.nodeName.toUpperCase();
        type = (e.target.type) ? e.target.type.toUpperCase() : "";
    }

    //DO NOT disable backspace ever if focus is not in an input control
    if (tag == 'INPUT' || type == 'TEXT' || type == 'TEXTAREA')
    {
        if(readOnly == true)
        {
            return true;  //if the field is disabled, disable the back space button
        }

        if(((tag == 'INPUT' && type == 'RADIO') || (tag == 'INPUT' && type == 'CHECKBOX')) && (key == 8))
        {
            return true; //disable the backspace button when radio or checkbox
        }

        if((tag == 'INPUT' && type != 'BUTTON') && (key == 13))
        {
            return true; //disable the enter key to prevent issues on single field forms
        }

        return false;

    }

    //if none of above cases, disable the backspace
    return (key == 8);
}

/**
 * This checks the configuration on load to see if we should prevent the backspace key from going back a page.
 * By default we do prevent this, unless the hyf.validation.config.preventBackspace property is set to false.
 * @private
 * @author Hyfinity Limited
 */
hyf.attachEventHandler(window, 'onload', function(){
        if ((typeof(hyf.validation.config.preventBackspace) == 'undefined') ||
            (hyf.validation.config.preventBackspace == true))
        {
            if(dojo.isFF)
            {
                document.onkeypress = function(e){ return !hyf.util.checkDisableBackspace(e)};
            }
            else //IE or Chrome
            {
                document.onkeydown = function(e){ return !hyf.util.checkDisableBackspace(e)};
            }
        }
});


/**
 * This object contains a number of no-op functions that can be connected to
 * to perform custom functionality at appropriate times.
 * Eg for dojo 1.7+
 *  require(['dojo/topic'], function(topic) {
 *      topic.subscribe('hyf/hooks/contentInserted', function(container){....});
 *  });
 * for older dojo versions
 *  dojo.connect(hyf.hooks, 'contentInserted', myCustomFunction)
 *
 * @private
 * @author Hyfinity Limited
 */
hyf.hooks =
{
    /**
     * This will be called whenever content has been inserted into a given container,
     * This will be called after the onbeforeload events have fired, but
     * before any widgets have been parsed, and before onload events have fired.
     * @param container The HTML container that the content has been inseted into.
     * @private
     * @author Hyfinity Limited
     */
    contentInserted: function(container)
    {
        if (typeof(require) == 'function') //dojo 1.7+
        {
            require(["dojo/topic"], function(topic){
                    topic.publish("hyf/hooks/contentInserted", container);
            });
        }
    },
    /**
     * This will be called whenever a container has been parsed for dojo widgets
     * @param container The HTML container that has been parsed.
     * @private
     * @author Hyfinity Limited
     */
    widgetsParsed: function(container)
    {
        if (typeof(require) == 'function') //dojo 1.7+
        {
            require(["dojo/topic"], function(topic){
                    topic.publish("hyf/hooks/widgetsParsed", container);
            });
        }
    },
    /**
     * This will be called whenever the dojo widgets in a container have been destoryed
     * @param container The HTML container that has been parsed.
     * @private
     * @author Hyfinity Limited
     */
    widgetsDestroyed: function(container)
    {
        if (typeof(require) == 'function') //dojo 1.7+
        {
            require(["dojo/topic"], function(topic){
                    topic.publish("hyf/hooks/widgetsDestroyed", container);
            });
        }
    },

    /**
     * This will be called when the provided container has been made visible after
     * previously being hidden (display : none)
     * @param container The HTML container now displayed.
     * @private
     * @author Hyfinity Limited
     */
    containerDisplayed: function(container)
    {
        if (typeof(require) == 'function') //dojo 1.7+
        {
            require(["dojo/topic"], function(topic){
                    topic.publish("hyf/hooks/containerDisplayed", container);
            });
        }
    },
    /**
     * This will be called when the provided container has been hidden after
     * previously being visible
     * @param container The HTML container now hidden.
     * @private
     * @author Hyfinity Limited
     */
    containerHidden: function(container)
    {
        if (typeof(require) == 'function') //dojo 1.7+
        {
            require(["dojo/topic"], function(topic){
                    topic.publish("hyf/hooks/containerHidden", container);
            });
        }
    }
}


/**
 * This will store a list of all the components for which require() calls have been made.
 * This is done so that on a future parse call we can make sure that we wait for all required components
 * to be loaded before triggering the parse.  This should resolve problems with dijits (eg accordions) on
 * partial pages, where otherwise the loading triggered by the require call may not have completed before
 * the new content is parsed, leading to the widget not being correctly initialised.
 * @private.
 */
hyf.util.dojoRequiresList = ['dojo/parser'];

/**
 * Connect to the global require function so that we can identify all the modules and widgets that have been required
 * These are then stored in the dojoRequiresList above for later use.
 */
require(['dojo/aspect'], function (aspect) {
            aspect.after(window, 'require', function(reqArr) {
                    //check we have an array as the first param
                    if (reqArr && reqArr.length)
                    {
                        for (var i = 0; i < reqArr.length; ++i)
                        {
                            if (dojo.indexOf(hyf.util.dojoRequiresList, reqArr[i]) == -1)
                            {
                                hyf.util.dojoRequiresList.push(reqArr[i]);
                            }
                        }
                    }

            }, true);
    });

/**
 * Attempts to parse any dojo widigets (dijits) in the provided container.
 * @param container The HTML element to look for widgets in.  If not provided, the whole document body will be used instead.
 */
hyf.util.parseWidgets = function(container)
{
    if ((typeof(container) == 'undefined') || (container == null))
        container = document.body;

    if ((typeof(dojo) != 'undefined') && (typeof(dojo.parser) != 'undefined'))
    {
        //make sure all the required modules are loaded before parsing.
        //this stops issues where widgets on partial pages were being parsed before
        //the required code had been loaded.
        require(hyf.util.dojoRequiresList, function() {
                dojo.parser.parse(container);
        });
    }
}




/** Connected to the dojo parser call below to handle calling our hooks function
 * @private
 * @author Hyfinity Limited
 */
hyf.util.dojoParserHandler = function(rootNode, args)
{
    var root;
    if (!args && rootNode && rootNode.rootNode)
        root = rootNode.rootNode;
    else
        root = rootNode;
    root = root ? dojo.byId(root) : document.body;

    hyf.hooks.widgetsParsed(root);
}

//connect up the widgets parsed hook - for now this only handles dojo widgets
if (typeof(require) == 'function') //dojo 1.7+
{
    require(['dojo/parser', 'dojo/aspect'], function (parser, aspect) {
            aspect.after(parser, 'parse', hyf.util.dojoParserHandler, true);
    });
}
else
{
    dojo.ready(function(){
            dojo.connect(dojo.parser, 'parse', hyf.util.dojoParserHandler);
            //initial onload parse will aready have happened by now, so call the hook manually
            hyf.hooks.widgetsParsed(document.body);
    });
}


//ensure the container visibility hooks are correctly called when the selected pane
//in an accordion container is changed
require(['dojo/topic', 'dojo/on'], function(topic, on) {
        topic.subscribe('hyf/hooks/widgetsParsed', function(container) {

                //find all the accordions in the container
                var accs = hyf.util.getDijitWidgets(container, 'dijit.layout.AccordionContainer');

                for (var i = 0; i < accs.length; ++i)
                {
                    //if we are not already watching this accordion then connect to it
                    if (!accs[i]._wmStateWatched)
                    {
                        accs[i].watch("selectedChildWidget", function(attr, oldVal, newVal){
                                hyf.hooks.containerHidden(oldVal.domNode);
                                //if the accordion chaneg is animating, wait for the animation to finish before
                                //calling the displayed hook so that any position details found will be correct
                                if (this._animation && (this._animation.status() == 'playing'))
                                {
                                    dojo.connect(this._animation, 'onEnd', function() {
                                            hyf.hooks.containerDisplayed(newVal.domNode);
                                    });
                                }
                                else
                                    hyf.hooks.containerDisplayed(newVal.domNode);
                        });

                        accs[i]._wmStateWatched = true;
                    }
                }

        });

});


/**
 * Adds the given function to be called on form submit.
 * If the form param is not provided, then the main webmaker form will be used.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.addOnFormSubmit = function(func, form)
{
    hyf.attachEventHandler(window, 'onload', function(){

            if (!form)
                form = hyf.FMAction.getFormValidator().getForm();

            if (!form.hyfOnSubmitFuncs)
            {
                form.hyfOnSubmitFuncs = new Array();
                if (typeof(form.onsubmit) == "function")
                    form.hyfOnSubmitFuncs.push(form.onsubmit)

                form.onsubmit = function() {return hyf.util.formOnSubmitHandler(form);}
            }

            form.hyfOnSubmitFuncs.push(func)
        });
}

hyf.util.formOnSubmitHandler = function(form)
{
    if (form.hyfOnSubmitFuncs)
    {
        for (var i = 0; i < form.hyfOnSubmitFuncs.length; ++i)
        {
            var resp = form.hyfOnSubmitFuncs[i]();
            if (resp == false)
                return false;
        }
    }
    return true;
}

/**
 * Returns all the dojo dijit widgets in the given container that match the specified class.
 * @param container The container to look in. If not provided the document body will be used.
 * @param dijitClass (Optional) The class of widgets to find (e.g. 'dijit.Dialog').  If not provided, all
 *          widgets in the container will be returned.
 * @param recursive (Optional) If true then widgets that are contained within other layout widgets will also
 *          be returned.  If false (the default) any widgets inside an accordion (for example) will not be returned.
 * @return An array of the found widgets.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getDijitWidgets = function(container, dijitClass, recursive)
{
    if ((typeof(container) == 'undefined') || (container == null))
        container = document.body;

    var returned = [];

    if ((typeof(dijit) != 'undefined') && (typeof(dijit.findWidgets) == 'function'))
    {
        //check if the container itself is actually the HTML for a widget
        var widgets;
        var recursiveCheckChildren = false;
        if (container.id && dijit.byId(container.id))
        {
            widgets = [dijit.byId(container.id)];
            recursiveCheckChildren = true;
        }
        else
        {
            widgets = dijit.findWidgets(container);
        }

        //if a specific class has been supplied, then remove any widgets that dont match
        if (recursive || ((typeof(dijitClass) != 'undefined') && (dijitClass != null)))
        {
            for (var i = 0; i < widgets.length; ++i)
            {

                if ((typeof(dijitClass) == 'undefined') || (dijitClass == null)
                    || (widgets[i].declaredClass.indexOf(dijitClass) != -1))
                {
                    returned.push(widgets[i]);
                }

                if (recursive && (typeof(widgets[i].getChildren) == 'function') && (widgets[i].getChildren().length > 0))
                {
                    if (recursiveCheckChildren)
                    {
                        for (var j = 0; j < widgets[i].domNode.childNodes.length; ++j)
                        {
                            returned = returned.concat(hyf.util.getDijitWidgets(widgets[i].domNode.childNodes[j], dijitClass, recursive));
                        }
                    }
                    else
                    {
                        returned = returned.concat(hyf.util.getDijitWidgets(widgets[i].domNode, dijitClass, recursive));
                    }
                }
            }
        }
        else
        {
            returned = widgets;
        }
    }

    return returned;
}

/**
 * Move dijit.dialog content back into the form on submit so that the data
 * it contains will be submitted to the server.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.addOnFormSubmit(function(){

    var form = hyf.FMAction.getFormValidator().getForm();
    var widgets = hyf.util.getDijitWidgets(document.body, 'dijit.Dialog');
    for (var i = 0; i < widgets.length; ++i)
    {
        var widget = widgets[i];
        if (widget.containerNode)
        {
            //make sure the content remains hidden, and move it back into the main form
            widget.containerNode.style.display = 'none';
            form.appendChild(widget.containerNode);
        }
    }
});


hyf.util.conditionalDisplay =
{
    desc:   'Handles functioanlity for hiding and showing groups or fields as field values change on screen',
    settings: new Array(), //stores all the conditional settings objects that have been processed.
    version: 1.1
}

/**
 * Should be called to setup a new component for conditional display.
 * @private
 * @author Hyfinity Limited
 * @param details An object describing the component, and the conditions for when
 *                it should be displayed. Format:

{
    type: 'field|group',
    name: '' //field or group name
    repeatId: '',   //optional
    condition: comparison|comparisonOperator,
    invert: boolean //optional - by default condition sets when to hide component, if this true, sets when to show.
}

comparisonOperator = {
    type: 'and|or',
    values: [comparison|comparisonOperator, comparison|comparisonOperator, ...] //array of length >= 2
}

comparison = {
    type: 'check',
    values: [firstValueObject, comparisonObject, secondValueObject] //array of length = 3
        //objects in the format used for event parameters, in particular for hyf.FMCondition.checkFieldValue
}


 */
hyf.util.conditionalDisplay.setup = function(details)
{
    var id = hyf.util.conditionalDisplay.settings.length;
    hyf.util.conditionalDisplay.settings[id] = details;

    hyf.util.conditionalDisplay.updateDisplay(details);

    return id;
}

require(['dojo/topic'], function(topic) {
        topic.subscribe('hyf/hooks/widgetsParsed', function(container){
                for (var i = 0; i < hyf.util.conditionalDisplay.settings.length; ++i)
                {
                    var details = hyf.util.conditionalDisplay.settings[i];
                    if (!details.initialised)
                    {
                        hyf.util.conditionalDisplay.setupCondition(details.condition, i);
                        details.initialised = true;
                    }
                }
        });
});



/**
 * Processes the given condition to ensure that all contained
 * source fields are correctly initialised.
 * @param cond The condition object to process from the passed in setup details.
 * @param id the ID in the settings collection for this particular setup.
 * @param mode (Optional) If provided indicates whether we are setting up for conditional display or disabling
 *                      Values are 'display' or 'disable', defaults to 'display'.
 * @private
 * @author Hyfinity Limited
  */
hyf.util.conditionalDisplay.setupCondition = function(cond, id, mode)
{
    //find all fields used within the conditions to add events to them where needed
    if ((cond.type == 'and') || (cond.type == 'or'))
    {
        //is a complex condition with multiple checks.
        for (var i = 0; i < cond.values.length; ++i)
        {
            hyf.util.conditionalDisplay.setupCondition(cond.values[i], id, mode);
        }

    }
    else
    {
        //is a simple condition with a single check
        for (var i = 0; i < cond.values.length; ++i)
        {
            hyf.util.conditionalDisplay.setupSourceField(cond.values[i], id, mode);
        }
    }
}

/**
 * Processes the given condition value to check if it is a field or display variable.
 * If so events are added to the field so that any changes to its value will be detected.
 * @param cv The condition value object to process from the passed in setup details.
 * @param id the ID in the settings collection for this particualr setup.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.conditionalDisplay.setupSourceField = function(cv, id, mode)
{
    if (typeof(cv) == 'string')
        return;

    if (cv.multiple)
    {
        var valArray = cv.value;
        for (var i = 0; i < valArray.length; ++i)
        {
            hyf.util.conditionalDisplay.setupSourceFieldImpl(valArray[i], id, mode);
        }
    }
    else
    {
        hyf.util.conditionalDisplay.setupSourceFieldImpl(cv, id, mode);
    }
}

hyf.util.conditionalDisplay.setupSourceFieldImpl = function(cv, id, mode)
{
    //work out the name of the array to add to the field to store the list of ids
    //for the setups that depend on this field
    var idArrayName = (mode == 'disable') ? '_hyfCondDisableIds' : '_hyfCondDisplayIds';

    if (cv.option == 'PageField')
    {
        var fieldname = cv.value;
        if (cv.repeatId)
            fieldname = cv.repeatId + fieldname;

        var field = null;

        var connectEvent = 'onchange';

        //check for dojo widgets
        if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(fieldname) != null))
        {
            field = dijit.byId(fieldname);
            connectEvent = 'onChange';
        }
        else
        {
            field = document.getElementById(fieldname)
            //IE in non standards modes will return name matches from getElementById
            //which is not what we want, so make sure the id does actually match
            if ((field != null) && (field.id != fieldname))
                field = null;
        }

        if (field)
        {
            if ((!field._hyfCondDisplayIds)  && (!field._hyfCondDisableIds))
            {
                if ((field.type == 'checkbox') || (field.type == 'radio'))
                    connectEvent = 'onclick';

                hyf.attachEventHandler(field, connectEvent, hyf.util.conditionalDisplay.handleValueChange);
            }
            if (!field[idArrayName])
                field[idArrayName] = new Array();

            field[idArrayName].push(id);
        }
        else
        {
            //likely to be a radio or multi check control so need to add events to multiple fields
            var nameMatches = dojo.query('*[name=' + fieldname + ']');
            for (var i = 0; i < nameMatches.length; ++i)
            {
                if ((!nameMatches[i]._hyfCondDisplayIds)  && (!nameMatches[i]._hyfCondDisableIds))
                {
                    hyf.attachEventHandler(nameMatches[i], 'onclick', hyf.util.conditionalDisplay.handleValueChange);
                }
                if (!nameMatches[i][idArrayName])
                    nameMatches[i][idArrayName] = new Array();

                nameMatches[i][idArrayName].push(id);
            }
        }

    }
    else if (cv.option == 'DisplayVariable')
    {
        var field = document.getElementById('hyf_display_variable_' + cv.value);
        if (field)
        {
            if ((!field._hyfCondDisplayIds)  && (!field._hyfCondDisableIds))
            {
                hyf.attachEventHandler(field, 'onchange', hyf.util.conditionalDisplay.handleValueChange);
            }

            if (!field[idArrayName])
                field[idArrayName] = new Array();

            field[idArrayName].push(id);
        }
    }
}

/**
 * Will be called from a watched field when the value changes.
 * This will recheck all the components conditionally displayed based on this field
 * and update the display as needed.
 * @param e The change event triggering the call.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.conditionalDisplay.handleValueChange = function(e)
{
    if (this._hyfCondDisplayIds)
    {
        for (var i = 0; i < this._hyfCondDisplayIds.length; ++i)
        {
            hyf.util.conditionalDisplay.updateDisplay(hyf.util.conditionalDisplay.settings[this._hyfCondDisplayIds[i]]);
        }
    }
    if (this._hyfCondDisableIds)
    {
        for (var i = 0; i < this._hyfCondDisableIds.length; ++i)
        {
            hyf.util.conditionalDisable.updateDisplay(hyf.util.conditionalDisable.settings[this._hyfCondDisableIds[i]]);
        }
    }
}

/**
* Calculates the postion of the current table column.
* @param elem The element for which the postion is required.
*/
hyf.util.tableColPos = function(elem) {
    var colPos = 0;
    var prev = elem.previousSibling;

    while (prev) {
        if (prev.nodeType == 1 && prev.nodeName.match(/t[dh]/i)) {
            colPos++;
        }
        prev = prev.previousSibling;
    }

    return colPos;
}

/**
 * Updates the display of the component on screen so that it is hidden if the
 * specified conditions are true.
 * Alternatively, if invert is true, it will only be visible if the conditions are true.
 * @param details The conditional setup details object specifying the component and conditions.
 *                See the setup method for the structure.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.conditionalDisplay.updateDisplay = function(details)
{
    var conditionTruth = hyf.util.conditionalDisplay.getConditionTruth(details.condition);
    var makeVisible;

    if (details.invert)
        makeVisible = conditionTruth;
    else
        makeVisible = !conditionTruth;

    var compName = details.name;
    if (details.repeatId)
        compName = details.repeatId + compName;

    var componentsToAdjust = new Array();

    var fieldContainer, labelContainer;



    if (details.type == 'group')
    {
        var fieldContainer = document.getElementById(compName);

        var groupLabel = document.getElementById(compName + '_label_container');

        if (groupLabel && !hyf.util.isParent(groupLabel, fieldContainer))
            labelContainer = groupLabel;
    }
    else if (details.type == 'field')
    {
        fieldContainer = document.getElementById(compName + '_container');
        labelContainer = document.getElementById(compName + '_label_container');
    }


    if (fieldContainer == null)  //shouldn't ever happen, but if it does there's not a lot we can do
        return;

    //if there is a formElement container, then just hide that
    if (dojo.hasClass(fieldContainer.parentNode, 'formElement') || dojo.hasClass(fieldContainer.parentNode, 'controlContainer'))
    {
        fieldContainer = fieldContainer.parentNode;
        labelContainer = null;
    }
    else if (dojo.hasClass(fieldContainer.parentNode, 'controlRow') && dojo.hasClass(fieldContainer.parentNode.parentNode, 'controlContainer'))
    {
        fieldContainer = fieldContainer.parentNode.parentNode;
        labelContainer = null;
    }
    else if (dojo.hasClass(fieldContainer.parentNode, 'groupContainer') && dojo.hasClass(fieldContainer.parentNode.parentNode, 'controlRow') && dojo.hasClass(fieldContainer.parentNode.parentNode.parentNode, 'controlContainer'))
    {
        fieldContainer = fieldContainer.parentNode.parentNode.parentNode;
        labelContainer = null;
    }


    //if the component being hidden is within a layout container, then need to hide the
    //layoutContainerContent parent element instead
    if (dojo.hasClass(fieldContainer.parentNode, 'layoutContainerContent'))
        fieldContainer = fieldContainer.parentNode;



    var hideContents = false;

    //need to handle tables though - just hide the contents rather than the cell??
    if (fieldContainer.tagName.toLowerCase() == 'td')
    {
        var table = fieldContainer.parentNode;
        var tr;
        while(table && table.tagName.toLowerCase() != 'table')
        {
            if (table.tagName.toLowerCase() == 'tr')
                tr = table;
            table = table.parentNode;
        }

        if (table)
        {
            //if this is a grid, then we cant hide the tds as it
            //would affect the layout
            if (dojo.hasClass(table, 'grid'))
                hideContents = true;

            //if this is a repeating table then check if any of the condition fields
            //are within the same repeat context.
            //If so, then also dont hide the cell itself as otherwise the remaining cells
            //would not line up with the column headings
            //If all the conditions are outside of the repeat, then we do want to hide the cell,
            //so that the whole column gets removed.
            if (dojo.hasClass(tr, 'table'))
            {
                if ((typeof(details.repeatId) != 'undefined') && (details.repeatId != ''))
                {
                    var conditionsToCheck = new Array();
                    conditionsToCheck.push(details.condition);

                    var item;
                    while ((item = conditionsToCheck.shift()) != null)
                    {
                        if (item.type == 'or' || item.type == 'and')
                        {
                            conditionsToCheck = conditionsToCheck.concat(item.values);
                        }
                        else
                        {
                            for (var i = 0; i < item.values.length; ++i)
                            {
                                if (item.values[i].repeatId && item.values[i].repeatId.indexOf(details.repeatId) == 0)
                                {
                                    //condition is in same repeat, so should just hide this one cell.
                                    hideContents = true;
                                    break;
                                }

                                if (item.values[i].option.indexOf('Dynamic') == 0)
                                {
                                    //dynamic check values may or may not use relative xpaths, so cant assume that the same
                                    //value applies to every entry in the table, so just hide contents
                                    hideContents = true;
                                    break;
                                }
                            }
                            if (hideContents)
                                break;
                        }
                    }
                    if (!hideContents)
                    {
                        //not hiding the contents so want to hide the whole cell
                        //in this case, also want to make sure the column heading label is hidden
                        //as well.  This will not have the repeat Id component on the name
                        labelContainer = document.getElementById(details.name + '_label_container');
                        if (labelContainer == null) {
                            //Table column without a label, includes layout groups acting as table columns
                            var iHiddenContentPos = hyf.util.tableColPos(fieldContainer);
                            labelContainer = dojo.query("th:nth-child("+(iHiddenContentPos+1)+")", table)[0];
                        }
                    }
                }
                else
                    hideContents = true;
            }
        }
    }


    if (hideContents)
    {
        //find all children to hide instead
        for (var i = 0; i < fieldContainer.childNodes.length; ++i)
        {
            componentsToAdjust.push(fieldContainer.childNodes[i]);
        }

        if (labelContainer)
        {
            for (var i = 0; i < labelContainer.childNodes.length; ++i)
            {
                componentsToAdjust.push(labelContainer.childNodes[i]);
            }
        }
    }
    else
    {
        componentsToAdjust.push(fieldContainer);
        if (labelContainer)
            componentsToAdjust.push(labelContainer);
    }



    if (makeVisible)
    {
        for (var i = 0; i < componentsToAdjust.length; ++i)
        {
            hyf.util.showComponent(componentsToAdjust[i]);
        }
    }
    else
    {
        for (var i = 0; i < componentsToAdjust.length; ++i)
        {
            hyf.util.hideComponent(componentsToAdjust[i]);
        }
    }

}

/**
 * Checks whether the given condition object currently evalautes to a true value.
 * This will process all the checks in the condition and return the final result.
 * @param cond The condition object from the setup details structure to process.
 * @return boolean result.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.conditionalDisplay.getConditionTruth = function(cond)
{

    if (cond.type == 'and')
    {
        //all nested conditions must be true
        for (var i = 0; i < cond.values.length; ++i)
        {
            if (!hyf.util.conditionalDisplay.getConditionTruth(cond.values[i]))
                return false;
        }
        return true;
    }
    else if (cond.type == 'or')
    {
        //one nested condition must be true
        var result = false;
        for (var i = 0; i < cond.values.length; ++i)
        {
            if (hyf.util.conditionalDisplay.getConditionTruth(cond.values[i]))
            {
                result = true;
                break;
            }
        }
        return result;
    }
    else
    {
        //is a simple condition with a single check


        //create objEventSource object to pass to events checkFieldValue method
        //we set the field proeprty to the window, as this is used as the context for any
        //custom script value checks.
        var objEventSource = {name: 'EventSource', option: 'conditional_display', field: window};


        //determine function reference
        var funcRef = eval(cond.funcName);
        if (typeof(funcRef) != 'function')
        {
            return false;
        }

        //use slice on the values array first so that adding the objEventSoruce wont affect the original array.
        var args = cond.values.slice();
        args.push(objEventSource);
        return funcRef.apply(this, args)

    }
}


hyf.util.conditionalDisable =
{
    desc:   'Handles functionality for disabling groups or fields as field values change on screen.  This works in the same way as for conditionalDisplay',
    settings: new Array(), //stores all the conditional settings objects that have been processed.
    version: 1.0
}

/**
 * Should be called to setup a new component for conditional disabling.
 * @private
 * @author Hyfinity Limited
 * @param details An object describing the component, and the conditions for when
 *                it should be disabled. format matches that for conditional display.
 */
hyf.util.conditionalDisable.setup = function(details)
{
    var id = hyf.util.conditionalDisable.settings.length;
    hyf.util.conditionalDisable.settings[id] = details;

    hyf.util.conditionalDisable.updateDisplay(details);

    return id;
}

require(['dojo/topic'], function(topic) {
        topic.subscribe('hyf/hooks/widgetsParsed', function(container){
                for (var i = 0; i < hyf.util.conditionalDisable.settings.length; ++i)
                {
                    var details = hyf.util.conditionalDisable.settings[i];
                    if (!details.initialised)
                    {
                        hyf.util.conditionalDisplay.setupCondition(details.condition, i, 'disable');
                        details.initialised = true;
                    }
                    else
                    {
                        //if already initialised, but for a group that is/contains the container
                        //in which content has just been inserted, then we need to refresh
                        if (details.type == 'group')
                        {
                            var grpName = details.name;
                            if (details.repeatId)
                                grpName = details.repeatId + grpName;

                            if (hyf.util.isParent(container, dojo.byId(grpName)))
                            {
                                hyf.util.conditionalDisable.updateDisplay(details);
                            }
                        }
                    }
                }
        });
});


/**
 * Updates the display of the component on screen so that it is disable/enabled as required
 * @param details The conditional setup details object specifying the component and conditions.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.conditionalDisable.updateDisplay = function(details)
{
    var conditionTruth = hyf.util.conditionalDisplay.getConditionTruth(details.condition);

    var compName = details.name;
    if (details.repeatId)
        compName = details.repeatId + compName;


    //call the disable process with the container name instead for fields
    //so that in situations where there are multiple controls (eg radio buttions)
    //they will still get correctly disabled.
    //every control always has an '..._container' element around it, so this should
    //always work ok.  The disable/enable methods themselves will handle processing
    //all the required child elements
    if (details.type == 'field')
    {
        compName = compName + '_container';
    }

    if (conditionTruth)
    {
        hyf.util.disableComponent(compName, (details.type == 'group'));
    }
    else
    {
        hyf.util.enableComponent(compName);
    }
}


/**
 * Compares two values and returns the true or false result
 * @param val1 The first value to compare
 * @param val2 The second value to compare
 * @param comparison the type of comparison. Must be one of '==', '!=', '<', '>', '<=', '>=', 'contains'
 * @param dataType (Optional) the data type of the values. Supported options 'string', 'number', 'date'
 * @param val1Format (Optional) If the dataType is data, this should be used to set the format of the val1 date
 * @param val2Format (Optional) If the dataType is data, this should be used to set the format of the val2 date
 *                   If both dates are in the same format this is not needed.
 * @return boolean value indicating the result of the comparison.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.compareValues = function(val1, val2, comparison, dataType, val1Format, val2Format)
{
    try
    {
        comparison = comparison.replace('&lt;', '<').replace('&gt;', '>');

        if (dataType == 'date')
        {
            //make sure we have at least one format string
            if (!val1Format && !val2Format)
                return false;

            //check for the defined date keywords
            if ((val1.charAt(0) == '$') && (hyf.calendar.supportedKeywords[val1.substr(1)] != null))
            {
                var dateToAdjust = new Date();

                if (hyf.calendar.supportedKeywords[val1.substr(1)] != '')
                    eval(hyf.calendar.supportedKeywords[val1.substr(1)]);

                val1 = formatDate(dateToAdjust, ((val1Format) ? val1Format : val2Format));
            }

            if ((val2.charAt(0) == '$') && (hyf.calendar.supportedKeywords[val2.substr(1)] != null))
            {
                var dateToAdjust = new Date();

                if (hyf.calendar.supportedKeywords[val2.substr(1)] != '')
                    eval(hyf.calendar.supportedKeywords[val2.substr(1)]);

                val2 = formatDate(dateToAdjust, ((val2Format) ? val2Format : val1Format));
            }

            var compareResult;
            if (val1Format && val2Format)
            {
                compareResult = compareDates(val1, val1Format, val2, val2Format);
            }
            else
            {
                var f = (val1Format) ? val1Format : val2Format;
                compareResult = compareDates(val1, f, val2, f);
            }

            //compareResult will be -1, 0, 1
            if (compareResult == 'error')
                return false;

            switch (comparison)
            {
                case '=='   :   return (compareResult == 0);
                case '!='   :   return (compareResult != 0);
                case '<'    :   return (compareResult == -1);
                case '>'    :   return (compareResult == 1);
                case '<='   :   return (compareResult < 1);
                case '>='   :   return (compareResult > -1);
                case 'contains' : return false;
            }

            //invalid comparison
            return false;
        }
        else
        {
            if (comparison == 'contains')
                return (val1.indexOf(val2) != -1)
            else if (comparison == 'doesnt_contain')
                return (val1.indexOf(val2) == -1)
            else
            {
                //check if both values are numbers, and if so try and do numeric comparison
                //We need to have the isNaN check as for display variable checks we dont have a dataType
                //However if we have a string dataType then we should treat as strings even if they are both numbers
                try
                {
                    if ((dataType == 'number') || ((dataType != 'string') && !isNaN(val1) && !isNaN(val2)))
                    {
                        return eval('Number(val1) ' + comparison + ' Number(val2)');
                    }
                }
                catch (e) {}

                return eval('val1 ' + comparison + ' val2');
            }
        }
    }
    catch (e)
    {
        //if anything has gone wrong in the comparison, then just return false.
        return false;
    }

}

hyf.util.BASE_CONTROL_TAG_NAMES = ['input', 'textarea', 'select', 'a'];

/**
 * Utility function for disabling a given component.  This handles disabling fields, groups or Dojo widgets.
 * If a group is passed in, then all controls within the group will be disabled.
 * @param component {Group_Name | Field_Name} the field, group or HTML component (or its ID) to disable
 * @param markContainer {boolean} (Optional) If set to true, and the given component is a container rather than an actual control
 *                  Then the isDisabled class will be added to this component as well as disabling all container controls.
 *                  Defaults to false.
 * @author Hyfinity Limited
 */
hyf.util.disableComponent = function(component, markContainer)
{
    //if a string is passed in, find the relevant component object
    if (typeof(component) == 'string')
    {
        if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(component) != null))
            component = dijit.byId(component);
        else
            component = dojo.byId(component);
    }

    if (component == null)
        return;

    //make sure we are allowed to disable this component
    if (!hyf.util.canComponentBeDisabled(component))
        return;


    //if it is a dojo widget, use the dijit disabled method
    //QUESTION: How best to determine if the object is a dijit widget
    if (component.declaredClass && component.declaredClass.indexOf('dijit') != -1)
    {
        //if it is a layout widget then just recursively process child widgets
        //as we dont want to disable you from opening an accordion for example.
        if (component.declaredClass.indexOf('dijit.layout') == 0)
        {
            if (typeof(component.getChildren) == 'function')
            {
                var children = component.getChildren();
                for (var i = 0; i < children.length; ++i)
                {
                    hyf.util.disableComponent(children[i]);
                }
            }
        }
        else
        {
            //use readOnly rather than disabled for most controls so that you can still get and set values from it
            var disableAttr = 'readOnly';

            //for menus need to use disabled instead
            if ((component.declaredClass == 'dijit.MenuBar') || (component.declaredClass == 'dijit.DropDownMenu'))
            {
                disableAttr = 'disabled';
            }

            if ((component.get(disableAttr) == false) || (typeof(component.get(disableAttr)) == 'undefined'))
            {
                component.set(disableAttr, true);

                dojo.addClass(component.domNode, 'disabled');

                //add class to the controlBody element
                var cb = hyf.util.getFieldControlBody(component.id);
                if (cb != null)
                    dojo.addClass(cb, 'isDisabled');
                //add class to the label element
                var lc = hyf.util.getFieldLabelContainer(component.id);
                if (lc != null)
                    dojo.addClass(lc, 'isDisabled');

                //special handling for menus, as all child items need to be disabled, not just the menu itself
                if ((component.declaredClass == 'dijit.MenuBar') || (component.declaredClass == 'dijit.DropDownMenu'))
                {
                    component.getChildren().forEach(function(item) {
                            item.set(disableAttr, true);
                    });
                }
            }
        }
    }
    //if it is a control then disable it
    else if (dojo.indexOf(hyf.util.BASE_CONTROL_TAG_NAMES, component.tagName.toLowerCase()) != -1)
    {
        var disableMethod = hyf.util.getWebMakerAttribute(component, 'disable-method')
        if (disableMethod == null)
        {
            if (component.type == 'text' || component.type == 'password' || component.type == 'textarea')
                disableMethod = 'read_only';
            else
                disableMethod = 'disabled';
        }

        if (component.tagName.toLowerCase() == 'a')
            disableMethod = 'anchor';


        //only need to continue with the disabling process if it is currently enabled
        if (((disableMethod == 'disabled') && !component.disabled) ||
            ((disableMethod == 'read_only') && !component.readOnly) ||
            ((disableMethod == 'anchor') && (component.getAttribute('disabled') != 'disabled')))
        {

            if (disableMethod == 'read_only')
                component.readOnly = true;
            else
                component.disabled = true;

            //need special handling for anchors to remove the event definitions
            if (disableMethod == 'anchor')
            {
                var href = component.getAttribute('href');
                if ((href != null) && (href != ''))
                    hyf.util.setWebMakerAttribute(component, 'disable-base-href', href);
                component.setAttribute('href', '#');

                var onclick = component.getAttribute('onclick');
                if ((onclick != null) && (onclick != ''))
                    hyf.util.setWebMakerAttribute(component, 'disable-base-onclick', onclick);
                component.setAttribute('onclick', 'return false;');

                var onkeypress = component.getAttribute('onkeypress');
                if ((onkeypress != null) && (onkeypress != ''))
                    hyf.util.setWebMakerAttribute(component, 'disable-base-onkeypress', onkeypress);
                component.setAttribute('onkeypress', '');

                component.setAttribute('disabled', 'disabled');
            }

            //add the disabled class
            dojo.addClass(component, 'disabled');

            //add class to the controlBody element
            var cb = hyf.util.getFieldControlBody(component);
            if (cb != null)
                dojo.addClass(cb, 'isDisabled');
            //add class to the label element
            var lc = hyf.util.getFieldLabelContainer(component);
            if (lc != null)
                dojo.addClass(lc, 'isDisabled');


            //check if this field also has a linked calendar button to disable
            if ((hyf.util.getWebMakerAttribute(component, 'type') == 'date') && (dojo.byId(component.id + '_calendar_anchor')))
            {
                hyf.util.disableComponent(dojo.byId(component.id + '_calendar_anchor'));
            }

            //handle special disabling of rich text editors
            if ((component.type == 'textarea') && hyf.richtext && hyf.richtext.isRichText(component))
                hyf.richtext.disableEditor(component);
        }
    }
    //otherwise call again for all controls within the component
    else
    {
        //Check if it is a group and add the isDisabled class to it
        if (markContainer)
        {
            dojo.addClass(component, 'isDisabled');
            //check for a gorup label
            var lc = hyf.util.getFieldLabelContainer(component);
            if (lc != null)
                dojo.addClass(lc, 'isDisabled');
        }


        //first handle widgets
        if ((typeof(dijit) != 'undefined') && (typeof(dijit.findWidgets) == 'function'))
        {
            var widgets = dijit.findWidgets(component);
            for (var i = 0; i < widgets.length; ++i)
            {
                hyf.util.disableComponent(widgets[i]);
            }
        }

        for (var tn = 0; tn < hyf.util.BASE_CONTROL_TAG_NAMES.length; ++tn)
        {
            var controls = component.getElementsByTagName(hyf.util.BASE_CONTROL_TAG_NAMES[tn]);
            for (var i = 0; i < controls.length; ++i)
            {
                //check it is not within a widget
                var parentWidget = null;
                if ((typeof(dijit) != 'undefined') && (typeof(dijit.getEnclosingWidget) == 'function'))
                {
                    parentWidget = dijit.getEnclosingWidget(controls[i]);
                    //only stop processing if this is a form control widget
                    if ((parentWidget != null) && (parentWidget.declaredClass.indexOf('dijit.form') == -1))
                        parentWidget = null;
                }


                if (parentWidget == null)
                    hyf.util.disableComponent(controls[i]);
            }
        }
    }
}

/**
 * Checks if it is actually allowed to disable the given component.
 * For example anchors that represent tab buttons can't be disabled.
 * @param component The HTML component to check.
 * @return boolean indicating whether the component can be disabled or not.
 * @private
 */
hyf.util.canComponentBeDisabled = function(component)
{
    //dojo widgets dont have a tagName property, so make sure it exists before trying to check it
    if (component.tagName && (component.tagName.toLowerCase() == 'a'))
    {
        //if this is a tab button we dont want to disable it.
        if (dojo.hasClass(component, 'selectedTab') || dojo.hasClass(component, 'unselectedTab'))
            return false;

        //if this is a collapsible control toggle button we dont want to disable it.
        if (dojo.hasClass(component, 'toggleHidden') || dojo.hasClass(component, 'toggleVisible'))
            return false;
    }

    if (component.tagName && (component.tagName.toLowerCase() == 'input') && (component.type == 'hidden'))
    {
        //if this is the hidden field for a tab control dont disable it so that we can still change it to switch tabs
        var fc = hyf.util.getFieldContainer(component);
        if ((component.id.indexOf('tab_control') != -1) || (fc != null && dojo.hasClass(fc.parentNode.parentNode, 'tabContainer')))
            return false;

        //if it is a hidden xpath field dont disable it
        if ((component.name.indexOf('_xpath', component.name.length - 6) != -1) || (component.name.indexOf('_xpath_xga_') != -1))
            return false;

        //dont disable any conversion control fields
        if (component.name.indexOf('_date_conversion_input', component.name.length - 22) != -1)
            return false;
        if (component.name.indexOf('_date_conversion_output', component.name.length - 23) != -1)
            return false;
        if (component.name.indexOf('_case_conversion', component.name.length - 16) != -1)
            return false;
        if (component.name.indexOf('_whitespace_conversion', component.name.length - 22) != -1)
            return false;

        //dont disable repeat or group control values
        if (((component.name.indexOf('hyfrepeat-') == 0) || (component.name.indexOf('xgf_hyfrepeat-') == 0)) ||
            ((component.name.indexOf('hyfgroup-') == 0) || (component.name.indexOf('xgf_hyfgroup-') == 0)))
            return false;

    }

    //default is that disabling is allowed
    return true;
}

/**
 * Utility function for enabling a given component.  This handles enabling fields, groups or Dojo widgets.
 * If a group is passed in, then all controls withing the group will be enabled.
 * @param component {Group_Name | Field_Name} the field, group or HTML component (or its ID) to enable
 * @author Hyfinity Limited
 */
hyf.util.enableComponent = function(component)
{
    //if a string is passed in, find the relevant component object
    if (typeof(component) == 'string')
    {
        if ((typeof(dijit) != 'undefined') && (typeof(dijit.byId) == 'function') && (dijit.byId(component) != null))
            component = dijit.byId(component);
        else
            component = dojo.byId(component);
    }

    if (component == null)
        return;


    //if it is a dojo widget, use the dijit disabled method
    //QUESTION: How best to determine if the object is a dijit widget
    if (component.declaredClass && component.declaredClass.indexOf('dijit') != -1)
    {
        //if it is a layout widget then just recursively process child widgets
        //as we dont want to disable you from opening an accordion for example.
        if (component.declaredClass.indexOf('dijit.layout') == 0)
        {
            if (typeof(component.getChildren) == 'function')
            {
                var children = component.getChildren();
                for (var i = 0; i < children.length; ++i)
                {
                    hyf.util.enableComponent(children[i]);
                }
            }
        }
        else
        {
            //use readOnly rather than disabled for most controls so that you can still get and set values from it
            var disableAttr = 'readOnly';

            //for menus need to use disabled instead
            if ((component.declaredClass == 'dijit.MenuBar') || (component.declaredClass == 'dijit.DropDownMenu'))
            {
                disableAttr = 'disabled';
            }

            if (component.get(disableAttr) == true)
            {
                //use readOnly rather than disabled so that you can still get and set values from it
                component.set(disableAttr, false);

                dojo.removeClass(component.domNode, 'disabled');

                //remove class from the controlBody element
                var cb = hyf.util.getFieldControlBody(component.id);
                if (cb != null)
                    dojo.removeClass(cb, 'isDisabled');
                //remove class from the label element
                var lc = hyf.util.getFieldLabelContainer(component.id);
                if (lc != null)
                    dojo.removeClass(lc, 'isDisabled');

                //special handling for menus, as all child items need to be disabled, not just the menu itself
                if ((component.declaredClass == 'dijit.MenuBar') || (component.declaredClass == 'dijit.DropDownMenu'))
                {
                    component.getChildren().forEach(function(item) {
                            item.set(disableAttr, false);
                    });
                }
            }
        }
    }
    //if it is a control then enable it
    else if (dojo.indexOf(hyf.util.BASE_CONTROL_TAG_NAMES, component.tagName.toLowerCase()) != -1)
    {
        var disableMethod = hyf.util.getWebMakerAttribute(component, 'disable-method')
        if (disableMethod == null)
        {
            if (component.type == 'text' || component.type == 'password' || component.type == 'textarea')
                disableMethod = 'read_only';
            else
                disableMethod = 'disabled';
        }

        if (component.tagName.toLowerCase() == 'a')
            disableMethod = 'anchor';

        //only need to continue with the enabling process if it is currently disabled
        if (((disableMethod == 'disabled') && component.disabled) ||
            ((disableMethod == 'read_only') && component.readOnly) ||
            ((disableMethod == 'anchor') && (component.getAttribute('disabled') == 'disabled')))
        {

            if (disableMethod == 'read_only')
                component.readOnly = false;
            else
                component.disabled = false;

            //need special handling for anchors to reset the event definitions
            if (disableMethod == 'anchor')
            {
                var href = hyf.util.getWebMakerAttribute(component, 'disable-base-href');
                if ((href != null) && (href != ''))
                    component.setAttribute('href', href);

                var onclick = hyf.util.getWebMakerAttribute(component, 'disable-base-onclick');
                if ((onclick != null) && (onclick != ''))
                    component.setAttribute('onclick', onclick);
                else if (component.getAttribute('onclick') != null)
                    //component.removeAttribute('onclick');
                    component.setAttribute('onclick', 'return true;');

                var onkeypress = hyf.util.getWebMakerAttribute(component, 'disable-base-onkeypress');
                if ((onkeypress != null) && (onkeypress != ''))
                    component.setAttribute('onkeypress', onkeypress);

                component.removeAttribute('disabled');
            }


            //now remove the disabled styling
            dojo.removeClass(component, 'disabled');

            //remove class from the controlBody element
            var cb = hyf.util.getFieldControlBody(component);
            if (cb != null)
                dojo.removeClass(cb, 'isDisabled');
            //remove class from the label element
            var lc = hyf.util.getFieldLabelContainer(component);
            if (lc != null)
                dojo.removeClass(lc, 'isDisabled');

            //check if this field also has a linked calendar button to enable
            if ((hyf.util.getWebMakerAttribute(component, 'type') == 'date') && (dojo.byId(component.id + '_calendar_anchor')))
            {
                hyf.util.enableComponent(dojo.byId(component.id + '_calendar_anchor'));
            }

            //handle special enabling of rich text editors
            if ((component.type == 'textarea') && hyf.richtext && hyf.richtext.isRichText(component))
                hyf.richtext.enableEditor(component);
        }
    }
    //otherwise call again for all controls within the component
    else
    {
        //If this container has the isdisabled class on it then remove it
        //This should only be the case when disabling/enabling a group
        if (dojo.hasClass(component, 'isDisabled'))
        {
            dojo.removeClass(component, 'isDisabled');
            //check for a gorup label
            var lc = hyf.util.getFieldLabelContainer(component);
            if (lc != null)
                dojo.removeClass(lc, 'isDisabled');
        }

        //first handle widgets
        if ((typeof(dijit) != 'undefined') && (typeof(dijit.findWidgets) == 'function'))
        {
            var widgets = dijit.findWidgets(component);
            for (var i = 0; i < widgets.length; ++i)
            {
                hyf.util.enableComponent(widgets[i]);
            }
        }

        for (var tn = 0; tn < hyf.util.BASE_CONTROL_TAG_NAMES.length; ++tn)
        {
            var controls = component.getElementsByTagName(hyf.util.BASE_CONTROL_TAG_NAMES[tn]);
            for (var i = 0; i < controls.length; ++i)
            {
                //check it is not within a widget
                var parentWidget = null;
                if ((typeof(dijit) != 'undefined') && (typeof(dijit.getEnclosingWidget) == 'function'))
                {
                    parentWidget = dijit.getEnclosingWidget(controls[i]);
                    //only stop processing if this is a form control widget
                    if ((parentWidget != null) && (parentWidget.declaredClass.indexOf('dijit.form') == -1))
                        parentWidget = null;
                }


                if (parentWidget == null)
                    hyf.util.enableComponent(controls[i]);
            }
        }
    }
}

/**
 * Gets the value of the specified WebMaker control attribute from the given component.
 * Historically we stored these values as attributes starting with an underscore, eg _required
 * but going forward we will use standard data attributes, eg data-wm-required.
 * This method checks for both options and returns the found value, or null if no value found.
 * @param component The HTML object for the component.
 * @param attrName {String} the name of the attribute to get.
 * @returns The returned string value or null if not found.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.getWebMakerAttribute = function(component, attrName)
{
    if (!component || !component.getAttribute)
        return null

    if (component.getAttribute('data-wm-' + attrName))
        return component.getAttribute('data-wm-' + attrName);

    if (component.getAttribute('_' + attrName))
        return component.getAttribute('_' + attrName);

    return null;
}

/**
 * Sets a WebMaker control attribute on the given component with the priovided value
 * Historically we stored these values as attributes starting with an underscore, eg _required
 * but going forward we will use standard data attributes, eg data-wm-required.
 * This method always creates the attribute in the new format, and will remove an existing old format attribute if present.
 * @param component The HTML object for the component.
 * @param attrName {String} the name of the attribute to set.
 * @param value {String} the string value to set.
 * @private
 * @author Hyfinity Limited
 */
hyf.util.setWebMakerAttribute = function(component, attrName, value)
{
    component.setAttribute('data-wm-' + attrName, value)

    if (component.getAttribute('_' + attrName))
        component.removeAttribute('_' + attrName);
}



/**
 * Returns the controlBody element for the given field.
 * @param field {Field_Name}  The field HTML element (eg input) or its id to get the controlBody for.
 * @return The span that represents the controlBody for this field, or null if it could not be found.
 * @private
 */
hyf.util.getFieldControlBody = function(field)
{
    if (typeof(field) != 'string')
        field = hyf.validation.ErrorDisplay.getFieldName(field);

    var matches = dojo.query('#' + field + '_container .controlBody');

    if (matches.length > 0)
        return matches[0];
    else
        return null;
}

/**
 * Returns the label container element for the given field
 * @param field {Field_Name}  The field HTML element (eg input) or its id to get the label for.
 * @return The HTML element that represents the label container linked to this field, or null if it could not be found.
 * @private
 */
hyf.util.getFieldLabel = function(field)
{
    if (typeof(field) != 'string')
        field = hyf.validation.ErrorDisplay.getFieldName(field);

    return document.getElementById(field + '_label');
}

/**
 * Returns the label container element for the given field
 * @param field {Field_Name}  The field HTML element (eg input) or its id to get the label for.
 * @return The HTML element that represents the label container linked to this field, or null if it could not be found.
 * @private
 */
hyf.util.getFieldLabelContainer = function(field)
{
    if (typeof(field) != 'string')
        field = hyf.validation.ErrorDisplay.getFieldName(field);

    return document.getElementById(field + '_label_container');
}

/**
 * Returns the container element for the given field
 * @param field {Field_Name}  The field HTML element (eg input) or its id to get the container for.
 * @return The HTML element that represents the container for this field, or null if it could not be found.
 * @private
 */
hyf.util.getFieldContainer = function(field)
{
    if (typeof(field) != 'string')
        field = hyf.validation.ErrorDisplay.getFieldName(field);

    return document.getElementById(field + '_container');
}


/**
 * Returns the version number of the internet explorer
 * version in use, or null if the current browser is not IE.
 * This is needed because with IE11, microsoft changed the user agent etc to not be
 * identified as IE, so dojo.isIE returns false.  Instead you can check the version of
 * the trident rendering engine being used.
 * This function is a wrapper around these different options, and so will return the IE version number
 * regardless of whetehr it is the new or old type.
 * @return The IE version number in use, or null if not IE
 */
hyf.util.getIEVersion = function()
{
    if (dojo.isIE)
        return dojo.isIE
    else
    {
        //check for the trident token.
        //See http://msdn.microsoft.com/en-us/library/ie/ms537503.aspx
        var tridentVersion = parseFloat(navigator.appVersion.split("Trident/")[1]);
        if (!isNaN(tridentVersion))
        {
            //this seems to give a value 4 less than the IE version
            //eg trident 7 is IE11, 6 IE10, etc
            //not sure if we can rely on this going forward, but we will for now.
            return (tridentVersion + 4);
        }
    }
    return null;
}


/**
 * Tries to find the repeat Id for the given component by looking for a WebMaker repeatId custom
 * attribute in the HTML DOM.  This could be on the given element or any parent elements in the tree.
 * If this cant be determined the provided value is returned instead.
 * @param component The HTML component to get the repeat Id for.
 * @param repeatId (Optional) String to return if a repeatId value could not be found in the HTML
 */
hyf.util.findRepeatId = function(component, repeatId)
{
    if ((component == null) || (typeof(component) == 'undefined'))
        return repeatId;

    if (hyf.util.getWebMakerAttribute(component, 'repeatId'))
        return hyf.util.getWebMakerAttribute(component, 'repeatId');
    else if (component.parentNode)
        return hyf.util.findRepeatId(component.parentNode, repeatId);
    else
        return repeatId;
}



/**
 * Sets the width of the specified component, so that it fills the space provided, or that
 * of the provided reference component as appropriate.
 * This allows for margins, paddings, borders etc on either component as needed.
 * @param compToSet the component to set the width on.
 * @param value Either the size in pixels of the overall space to fill, or the HTML component
 *      to use as a reference for getting the available space.
 * @param forceOverride (Optional) if true this value will be added with the !important flag
 *      to make sure it overrides any settings from the CSS files.
 */
hyf.util.setComponentWidth = function(compToSet, value, forceOverride)
{
    if ((compToSet == null) || (typeof(compToSet) == 'undefined'))
        return;

    if (typeof(value) != 'number')
        value = hyf.util.getComponentContentWidth(value);

    var availableSpace
    if (hyf.util.getCurrentStyle(compToSet, 'box-sizing') == 'border-box')
        availableSpace = value
    else
        availableSpace = value - hyf.util.getComponentExtrasWidth(compToSet);

    //now set the width to use up the remaining space
    if (forceOverride)
    {
        compToSet.style.width = null;
        compToSet.style.cssText += '; width : ' + availableSpace + 'px !important';
    }
    else
        compToSet.style.width = availableSpace + 'px';
}

/**
 * Returns the amount of space available for the content of the specified component.
 * This starts with the component's clientWidth, and then removes space for padding.
 * @param comp The component to get the width for.
 * @return The available width.
 */
hyf.util.getComponentContentWidth = function(comp)
{
    if ((comp == null) || (typeof(comp) == 'undefined'))
        return 0;

    var availableSpace = comp.clientWidth;

    //if there is any padding on the refComp need to remove this
    var lp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-left'));
    var rp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-right'));
    if (!isNaN(lp))
        availableSpace -= lp;
    if (!isNaN(rp))
        availableSpace -= rp;

    return availableSpace;
}

/**
 * Returns the combined size of all the different parts for this component
 * except the actual content width.
 * This returns the sum of the left and right padding, border and margin sizes.
 * Therefore you could add this to the value returned from getComponentContentWidth
 * to get the full amount of horizontal space required by this component.
 * @param comp The component to get the value for.
 * @return The total width used by this component's extra properties.
 */
hyf.util.getComponentExtrasWidth = function(comp)
{
    if ((comp == null) || (typeof(comp) == 'undefined'))
        return 0;

    var extraWidth = 0;
    //now check for margin on the compToSet
    var lm = parseInt(hyf.util.getCurrentStyle(comp, 'margin-left'));
    var rm = parseInt(hyf.util.getCurrentStyle(comp, 'margin-right'));
    if (!isNaN(lm))
        extraWidth += lm;
    if (!isNaN(rm))
        extraWidth += rm;

    //now check for padding on the compToSet
    var lp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-left'));
    var rp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-right'));
    if (!isNaN(lp))
        extraWidth += lp;
    if (!isNaN(rp))
        extraWidth += rp;

    //now check for borders on the compToSet
    var lb = parseInt(hyf.util.getCurrentStyle(comp, 'border-left-width'));
    var rb = parseInt(hyf.util.getCurrentStyle(comp, 'border-right-width'));
    if (!isNaN(lb))
        extraWidth += lb;
    if (!isNaN(rb))
        extraWidth += rb;

    return extraWidth;
}


/**
 * Sets the height of the specified component, so that it fills the space provided, or that
 * of the provided reference component as appropriate.
 * This allows for margins, paddings, borders etc on either component as needed, by reducing the amount to
 * set for the actual height value accordingly.
 * @param compToSet the component to set the height on.
 * @param value Either the size in pixels of the overall space to fill, or the HTML component
 *      to use as a reference for getting the available space.
 * @param forceOverride (Optional) if true this value will be added with the !important flag
 *      to make sure it overrides any settings from the CSS files.
 */
hyf.util.setComponentHeight = function(compToSet, value, forceOverride)
{
    if ((compToSet == null) || (typeof(compToSet) == 'undefined'))
        return;

    if (typeof(value) != 'number')
        value = hyf.util.getComponentContentHeight(value);

    var availableSpace
    if (hyf.util.getCurrentStyle(compToSet, 'box-sizing') == 'border-box')
        availableSpace = value
    else
        availableSpace = value - hyf.util.getComponentExtrasHeight(compToSet);

    //now set the width to use up the remaining space
    if (forceOverride)
    {
        compToSet.style.height = null;
        compToSet.style.cssText += '; height : ' + availableSpace + 'px !important';
    }
    else
        compToSet.style.height = availableSpace + 'px';
}

/**
 * Returns the amount of space available for the content of the specified component.
 * This starts with the component's clientHeight, and then removes space for padding.
 * @param comp The component to get the height for.
 * @return The available height.
 */
hyf.util.getComponentContentHeight = function(comp)
{
    if ((comp == null) || (typeof(comp) == 'undefined'))
        return 0;

    var availableSpace = comp.clientHeight;

    //if there is any padding on the refComp need to remove this
    var lp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-top'));
    var rp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-bottom'));
    if (!isNaN(lp))
        availableSpace -= lp;
    if (!isNaN(rp))
        availableSpace -= rp;

    return availableSpace;
}

/**
 * Returns the combined size of all the different parts for this component
 * except the actual content height.
 * This returns the sum of the top and bottom padding, border and margin sizes.
 * Therefore you could add this to the value returned from getComponentContentHeight
 * to get the full amount of vertical space required by this component.
 * @param comp The component to get the value for.
 * @return The total height used by this component's extra properties.
 */
hyf.util.getComponentExtrasHeight = function(comp)
{
    if ((comp == null) || (typeof(comp) == 'undefined'))
        return 0;

    var extraHeight = 0;
    //now check for margin on the compToSet
    var tm = parseInt(hyf.util.getCurrentStyle(comp, 'margin-top'));
    var bm = parseInt(hyf.util.getCurrentStyle(comp, 'margin-bottom'));
    if (!isNaN(tm))
        extraHeight += tm;
    if (!isNaN(bm))
        extraHeight += bm;

    //now check for padding on the compToSet
    var tp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-top'));
    var bp = parseInt(hyf.util.getCurrentStyle(comp, 'padding-bottom'));
    if (!isNaN(tp))
        extraHeight += tp;
    if (!isNaN(bp))
        extraHeight += bp;

    //now check for borders on the compToSet
    var tb = parseInt(hyf.util.getCurrentStyle(comp, 'border-top-width'));
    var bb = parseInt(hyf.util.getCurrentStyle(comp, 'border-bottom-width'));
    if (!isNaN(tb))
        extraHeight += tb;
    if (!isNaN(bb))
        extraHeight += bb;

    return extraHeight;
}





/**
 * This handles radio and multi check controls, to make sure that there is a 'selected'
 * class added to the HTML structure for each selected option.  This then provides greater
 * flexibility with theming to set how these controls will look.
 */
hyf.util.multiOptionControls = {

    /** Initialise any relevant controls in the given container.
     * @param container The HTML container to check for controls in.
     * @private
     */
    setup: function(container)
    {
        dojo.query('input[type=radio], input[type=checkbox][_use=selectMany]', container).forEach(function(item) {

            hyf.util.multiOptionControls.controlChanged(item, true);
            dojo.on(item, 'click', function(e) { hyf.util.multiOptionControls.controlChanged(item) });
        });
    },

    /**
     * Handles a new option being selected for a multi option control.
     * This makes sure that the HTML classes match the new state.
     * @param input The HTML input tag whose state has been changed.
     * @param skipRecursive. For radio controls, setting one will remove classes from all others
     *                  in the group.  Set this to true to stop this from happening.
     * @private
     */
    controlChanged: function(input, skipRecursive)
    {
        var sb;
        var sbEntry = input.parentNode;
        while ((sbEntry != null) && (!dojo.hasClass(sbEntry, 'selectBooleanEntry')))
        {
            if (dojo.hasClass(sbEntry, 'selectBoolean'))
                sb = sbEntry;
            sbEntry = sbEntry.parentNode;
        }

        if (sbEntry)
        {
            if (input.checked)
            {
                dojo.addClass(sbEntry, 'selected');
            }
            else
            {
                dojo.removeClass(sbEntry, 'selected');
            }
        }
        else if (sb)
        {
            //assume using table structure instead so add class to selectBoolean and selectBooleanCaption elements
            var label = dojo.query('label[for=' + input.id + ']', sb.parentNode)[0];
            var sbc = label.parentNode;
            while ((sbc != null) && (!dojo.hasClass(sbc, 'selectBooleanCaption')))
            {
                sbc = sbc.parentNode;
            }

            if (input.checked)
            {
                dojo.addClass(sb, 'selected');
                dojo.addClass(sbc, 'selected');
            }
            else
            {
                dojo.removeClass(sb, 'selected');
                dojo.removeClass(sbc, 'selected');
            }
        }

        //if this is a radio control, then we need to
        //adjust all others in the group.
        if (!skipRecursive && input.type == 'radio')
        {
            var allRadios = input.form[input.name];
            for (var i = 0; i < allRadios.length; ++i)
            {
                if (allRadios[i] != input)
                    hyf.util.multiOptionControls.controlChanged(allRadios[i], true);
            }
        }
    }
}
//Connect up the multiOptionControls.setup function to be called when content is inserted.
require(['dojo/topic'], function(topic) {
    topic.subscribe('hyf/hooks/contentInserted', hyf.util.multiOptionControls.setup);
});




/**
 * Contains the specific processing for file upload controls.
 */
hyf.fileUpload = {

    //note whether we have added page level drag events yet - dont want to do this multiple times
    pageDragEventsAdded: false,

    /**
     * Initialises all file uplaod controls in the container so that our 'nice' button will
     * trigger the underlying file control.  Also sets up any required drag events etc.
     * @param container The HTML container to look in.
     */
    setup: function(container) {

        dojo.query('input[type=file]', container).forEach(function(item) {

                var btn = dojo.byId(item.id + '_button');
                if (btn)
                {
                    dojo.on(btn, 'click', function(e) { item.click() });

                    dojo.on(item, 'change', function(e) { hyf.fileUpload.fileSelected(item) });

                    //now check for a file drag area, and if so initilise accordingly
                    var dropbox = document.getElementById(item.id + "_dragArea");
                    if (dropbox)
                    {
                        var controlBody = hyf.util.getFieldControlBody(item);
                        //make sure browser supports drag
                        if ('draggable' in document.createElement('span') && typeof(window.FileReader) != 'undefined')
                        {
                            dojo.addClass(controlBody, 'dragEnabled');

                            dropbox.addEventListener("dragenter", hyf.fileUpload.dragPreventDefault, false);
                            dropbox.addEventListener("dragover", hyf.fileUpload.dragPreventDefault, false);
                            dropbox.addEventListener("dragleave", hyf.fileUpload.dragPreventDefault, false);
                            dropbox.addEventListener("drop", hyf.fileUpload.dragCompleted, false);

                            //add the page level drag events too if they havent already been added by another control
                            if (!hyf.fileUpload.pageDragEventsAdded)
                            {
                                document.body.addEventListener("drop", hyf.fileUpload.dragPreventDefault, false);
                                document.body.addEventListener("dragenter", hyf.fileUpload.dragPreventDefault, false);
                                document.body.addEventListener("dragover", hyf.fileUpload.dragPreventDefault, false);
                                document.body.addEventListener("dragleave", hyf.fileUpload.dragPreventDefault, false);
                                hyf.fileUpload.pageDragEventsAdded = true;
                            }
                        }
                        else
                        {
                            //file drag not supported, so hide the drag area
                            hyf.util.hideComponent(dropbox);
                            dojo.addClass(controlBody, 'dragNotSupported');
                        }
                    }
                }
        });

    },

    /**
     * Returns the current 'value' of the provided file uplaod control.
     * In most modern browsers this will return an array of File objects indicating all the
     * files selected.  If drag is enabled for the control, this will include both files selected
     * in the standard way, and those dragged on.
     * In older browsers (eg IE9-) this will return an array with a single string value.
     * @param control The HTML file input element.
     * @return array of current values.
     */
    getControlValue: function(control) {
        var values = new Array();
        if (control.files)
        {
            for (var i = 0; i < control.files.length; ++i)
            {
                values[values.length] = control.files[i];
            }

            //check for a drag option, and if so also return any dragged files
            var dropbox = document.getElementById(control.id + "_dragArea");
            if (dropbox && dropbox.selectedFiles)
            {
                for (var i = 0; i < dropbox.selectedFiles.length; ++i)
                {
                    values[values.length] = dropbox.selectedFiles[i];
                }
            }

        }
        else
        {
            //old browser that doesnt support the new File API
            values[values.length] = control.value;
        }

        return values;
    },

    /**
     * Removes all selected files for the given control.
     * This removes both selected, and dragged on files if appropriate.
     * @param control The HTML file input element.
     */
    clearControl: function(control) {
        control.value = '';
        hyf.fileUpload.fileSelected(control) //clear out any displayed message
        //check for drag capabilities, to also clear out
        var dropbox = document.getElementById(control.id + "_dragArea");
        if (dropbox)
        {
            dropbox.selectedFiles = null;
            hyf.fileUpload.renderDraggedFilesList(dropbox);
        }
    },

    /** Checks if the given HTMl container contains any file upload controls for which
     * files have been selected.
     * This will check both selected files and dragged on files where appropriate, but only
     * deals with the new File API, so will always return false in older browsers, even if a file
     * has been selected.
     * This could be used to determine whether files will be uploaded in an ajax call for example.
     * @param container The HTML element to check in.
     * @return true if the container contains selected files, false otherwise.
     */
    containerHasSelectedFiles: function(container) {
        var controls = dojo.query('input[type=file]', container);

        for (var i = 0; i < controls.length; ++i)
        {
            if (controls[i].files && (controls[i].files.length > 0))
            {
                return true;
            }

            var dropbox = document.getElementById(controls[i].id + "_dragArea");
            if (dropbox && dropbox.selectedFiles && (dropbox.selectedFiles.length > 0))
            {
                return true;
            }
        }

        return false;
    },

    /**
     * Adds the details of any dragged on files for the given control
     * into the provided FormData object.
     * This is useful as these will nto be included when creating a FormData
     * object from a form for example.
     * @param control The HTML file input element.
     * @param formData The FormData object to add to.
     */
    addDraggedFilesToFormData: function(control, formData) {

        var dropbox = document.getElementById(control.id + "_dragArea");
        if (dropbox && dropbox.selectedFiles)
        {
            for (var f = 0; f < dropbox.selectedFiles.length; ++f)
            {
                formData.append(control.name, dropbox.selectedFiles[f]);
            }
        }
    },


    /**
     * Called when a file has been selected by the user.
     * @param control The browser file upload control that has been used.
     */
    fileSelected: function (control) {

        var output = dojo.byId(control.id + '_output');
        if (output)
        {
            //the value returned from the controls may include a fake path in some browsers (eg C:\fakepath\myfile.txt)
            //so we clean it up here to get just the filename

            output.setAttribute('title', '');
            //if multiple selection we just show a 'count' message, with the file names placed in a tooltip
            if (control.files && control.files.length > 1)
            {
                output.innerHTML = hyf.fileUpload.getMultipleSelectionMessage(control, control.files);

                var titleMsg = ''
                for (var i = 0; i < control.files.length; ++i)
                {
                    if (i > 0)
                        titleMsg += ', ';
                    titleMsg += control.files[i].name.replace(/.*[\/\\]/, '');
                }
                output.setAttribute('title', titleMsg);
            }
            else
            {
                var fn = control.value;
                fn = fn.replace(/.*[\/\\]/, '');
                output.innerHTML = fn;
            }
        }
    },

    /**
     * Get the display message to use when multiple files have been selected.  This can return a message for
     * multiple files selected via the main button, or multiple files dragged on.
     * This will first look for a custom attribute containing the name, but has a default to use if not found.
     * The name of the custom attribute checked is data-wm-multiple-<type>-msg
     * @param control  The HTML file input element.
     * @param files The set of currently selected files (with a length property).
     * @param type Optional 'selection' (the default)  or 'drag' to indicate which type of message to return.
     * @return The mmessage string to display.
     */
    getMultipleSelectionMessage: function(control, files, type) {
        if (!type) type = 'selection';

        var message = hyf.util.getWebMakerAttribute(control, 'multiple-' + type + '-msg')
        if (message == null)
        {
            message = (type == 'drag') ? " file(s) ready to upload:" : " files selected";
        }

        var insertPoint = message.indexOf('$');
        if (insertPoint != -1)
            message = message.substr(0, insertPoint) + files.length + message.substr(insertPoint + 1);
        else
            message = files.length + message;
        return message;
    },

    /** Common function to stop the default behaviouor of drag events. */
    dragPreventDefault: function(e) {
        e.stopPropagation();
        e.preventDefault();
        hyf.fileUpload.higlightDropBox(e);
    },

    /**
     * Handles a completed file drag event.
     */
    dragCompleted: function(e) {
        e.stopPropagation();
        e.preventDefault();
        hyf.fileUpload.higlightDropBox(e);

        var dt = e.dataTransfer;
        var files = dt.files;

        var dropbox = e.target;
        while ((dropbox != null) && !dojo.hasClass(dropbox, 'dragArea'))
        {
            dropbox = dropbox.parentNode;
        }

        if (dropbox == null)
            return;

        var control = document.getElementById(dropbox.id.substr(0, dropbox.id.indexOf('_dragArea')));

        //convert filelist to array to allow future concat easily
        files = Array.prototype.slice.call(files);


        if (dropbox.selectedFiles)
        {
            dropbox.selectedFiles = dropbox.selectedFiles.concat(files);
        }
        else
        {
            dropbox.selectedFiles = files;
        }

        hyf.fileUpload.renderDraggedFilesList(dropbox);
        hyf.fireEvent(control, 'change')
    },

    /**
     * Renders the display of the dropbox text indicating which files are ready to upload.
     * @param dropbox The HTML element representing the drop box, and whiose content will be changed.
     */
    renderDraggedFilesList: function(dropbox) {

        var container = document.getElementById(dropbox.id + '_selectedDisp');
        if (!container)
        {
            container = document.createElement('div');
            container.id = dropbox.id + '_selectedDisp';
            container.className = 'dragSelection';
            dropbox.appendChild(container);
        }

        var dragMsg = dojo.query('.dragMsg', dropbox)[0];

        if (dropbox.selectedFiles && (dropbox.selectedFiles.length > 0))
        {
            var control = document.getElementById(dropbox.id.substr(0, dropbox.id.indexOf('_dragArea')));
            var msg = '<span class="dragSummary">' + hyf.fileUpload.getMultipleSelectionMessage(control, dropbox.selectedFiles, 'drag') + '</span>';
            msg += '<ul>'
            for (var i = 0; i < dropbox.selectedFiles.length; ++i)
            {
                msg += '<li>' + dropbox.selectedFiles[i].name + '</li>';
            }
            msg += '</ul>'

            container.innerHTML = msg;
            hyf.util.showComponent(container);
            hyf.util.hideComponent(dragMsg);
        }
        else
        {
            hyf.util.hideComponent(container);
            hyf.util.showComponent(dragMsg);
        }
    },

    /**
     * Adds a class name to the dropbox when a drag is over it.
     * @param e The drag event object.
     */
    higlightDropBox: function(e) {

        var dropbox = e.target;
        while ((dropbox != null) && !dojo.hasClass(dropbox, 'dragArea'))
        {
            dropbox = dropbox.parentNode;
        }

        if (dropbox == null)
            return;

        if (e.type == "dragover")
            dojo.addClass(dropbox, "dragActive");
        else
            dojo.removeClass(dropbox, "dragActive");
    }

}
//Make sure we setup any file upload controls when new content is inserted
require(['dojo/topic'], function(topic) {
    topic.subscribe('hyf/hooks/contentInserted', hyf.fileUpload.setup);
});



/**
 * Contains the specific processing for menu controls.
 */
hyf.menuControl = {

    /**
     * Initialises all menu controls in the container so that they will ensure the hidden field is kept
     * up-to-date with menu selections.
     * This should eb called after widgets have been parsed
     * @param container The HTML container to look in.
     */
    setup: function(container) {

        //make sure that any menus are visible
        dojo.query('.menuControl .menu', container).style('visibility', 'visible');

        var topMenus = hyf.util.getDijitWidgets(container, 'dijit.MenuBar');

        for (var i = 0; i < topMenus.length; ++i)
        {
            //remove the _menu suffix from the dijit id to get the actual name of the control
            var menuControlId = topMenus[i].id.substr(0, topMenus[i].id.length - 5);

            //find any popup sub menus for this
            var menusToProcess = hyf.menuControl.findChildMenus(topMenus[i]);
            menusToProcess.push(topMenus[i]);

            //now attach to onclick of each menu
            for (var j = 0; j < menusToProcess.length; ++j)
            {
                hyf.util.setWebMakerAttribute(menusToProcess[j].domNode, 'menu-control-id', menuControlId);

                menusToProcess[j].on("itemClick", hyf.menuControl.handleMenuItemClick);
            }

            hyf.menuControl.setupMenuState(topMenus[i].id);
        }
    },

    /**
     * Checks the state of the given menu, and applies the expanded/collapsed classes accordingly.
     * @param {String} menuId The Id of the menu to process
     */
    setupMenuState: function(menuId) {
        var toggler = document.getElementById(menuId + '_toggle');
        if (hyf.util.getCurrentStyle(toggler, 'display') == 'none')
        {
            //toggle is hidden, so menu is in expanded state
            dojo.addClass(document.getElementById(menuId), 'expanded');
            dojo.removeClass(document.getElementById(menuId), 'collapsed');
        }
        else
        {
            //toggler is visible so menu is collapsed
            dojo.addClass(document.getElementById(menuId), 'collapsed');
            dojo.removeClass(document.getElementById(menuId), 'expanded');
        }

        //now set the default visibility of the menu accordingly
        if (dojo.hasClass(document.getElementById(menuId), 'expanded'))
        {
            //menu should be in expanded mode, so make sure it is visible
            hyf.util.showComponent(menuId);
        }
        else
        {
            //menu is collapsed, so want to be hidden by default
            hyf.util.hideComponent(menuId);
        }
    },

    /**
     * Finds all popup menus that are attached to items in the provided menu.
     * This checks recursively to handled multiple layers of popup menus
     * @param menu The Dijit menu (dijit.MenuBar or dijit.DropDownMenu) object to find any submenus for.
     * @return array of found menu (dijit.DropDownMenu) objects.
     */
    findChildMenus: function(menu) {

        var found = [];

        menu.getChildren().forEach(function(item) {

                if ((item.declaredClass == 'dijit.PopupMenuBarItem') || (item.declaredClass == 'dijit.PopupMenuItem'))
                {
                    if (item.popup)
                    {
                        found.push(item.popup);
                        found = found.concat(hyf.menuControl.findChildMenus(item.popup));
                    }
                }

        });

        return found;
    },

    /**
     * Handles selection of an item form a menu control.
     * This ensures that the hidden field is kept in sync.
     * @param item The selected MenuItem dijit.
     */
    handleMenuItemClick: function(item) {

        var itemId = hyf.util.getWebMakerAttribute(item.domNode, 'menu-item-id');
        var controlId = hyf.util.getWebMakerAttribute(item.getParent().domNode, 'menu-control-id');

        hyf.util.setFieldValue(controlId, itemId);
    },

    /**
     * Toggle the visibility of the relevant menu.
     * This is used when the menu is in the collapsed state.
     * @param {Object} e Event object
     * @param {Object} toggle The toggle button that initated the call
     */
    toggleVisibility: function(e, toggle) {
        menuId = toggle.id.substring(0, toggle.id.length - 7);
        var menu = document.getElementById(menuId);
        hyf.util.toggleComponent(menu, null, true);

        e.stopPropagation();
        e.preventDefault();
    },

    /**
     * This should be called on screen resize to recheck the expanded/collapsed state of each menu.
     */
    processScreenResize: function() {
        var topMenus = hyf.util.getDijitWidgets(document.body, 'dijit.MenuBar');
        for (var i = 0; i < topMenus.length; ++i)
        {
            //check if the menu toggle is now visible, and if so hide the menu
            hyf.menuControl.setupMenuState(topMenus[i].id);
        }
    },

    /**
     * When the user clicks on the page background, this checks for any
     * menus that are in the collapsed state, and if so makes sure
     * that the menu is hidden.
     */
    checkMenusToHide: function() {
        var topMenus = hyf.util.getDijitWidgets(document.body, 'dijit.MenuBar');
        for (var i = 0; i < topMenus.length; ++i)
        {
            //check if the menu is collapsed, and if so hide the menu
            if (dojo.hasClass(document.getElementById(topMenus[i].id), 'collapsed'))
            {
                hyf.util.hideComponent(topMenus[i].id);
            }
        }
    }

}

//Make sure we setup any menu controls when new content is inserted, screen resized, etc
require(['dojo/topic', 'dojo/on'], function(topic, on) {
    topic.subscribe('hyf/hooks/widgetsParsed', hyf.menuControl.setup);
    on(window, 'resize', hyf.menuControl.processScreenResize);
    on(document, 'click', hyf.menuControl.checkMenusToHide);
});





/**
 * Converts an XML DOM node to a JSON object representing the same data.
 * This was originally based on code from https://davidwalsh.name/convert-xml-json
 * @param xml the DOM Node to convert.
 * @return the created JSON object.
 */
hyf.util.xmlToJson = function(xml) {

	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@" + attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (item.nodeType == 3) //use 'content' as the property name for text content, instead of '#text'
                nodeName = 'content';
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = hyf.util.xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(hyf.util.xmlToJson(item));
			}
		}
    }

    //if we only have one property, and it is the text content, then just return the content instead of
    //the full object
    if ((Object.keys(obj).length ==1) && (typeof(obj.content) != 'undefined'))
        obj = obj.content;

	return obj;
};

/**
 * Get a DataField object for the control with the given name.
 * @param fieldName the name of the data field to get the object for.
 * @return hyf.control.DataField instance, or null if no matching control found.
 */
hyf.util.getDataField = function(fieldName)
{
    var f = document.getElementById(fieldName);
    if (f && (f.getAttribute('_use') == 'dataField'))
    {
        return new hyf.control.DataField(f);
    }

    return null;
}

if (typeof(hyf.control) == 'undefined') {
    hyf.control = {};
}

/**
 * This represents a data field control on the page.
 */
hyf.control.DataField = function(field)
{
    this.name = field.id;
    this.field = field;
}

/**
 * Get the contents of this data field as an XML Document.
 * @return XML Document.
 */
hyf.control.DataField.prototype.getAsXML = function()
{
    var dom = (new DOMParser()).parseFromString(this.field.value, "text/xml");
    return dom
}

/**
 * Get the contents of this data field as a JSON object.
 * @return JSON object.
 */
hyf.control.DataField.prototype.getAsJSON = function()
{
    var asXML = this.getAsXML();
    var json = hyf.util.xmlToJson(asXML);
    return json;
}



/**
 * Functionality relating to slider controls.
 */
hyf.control.slider = {
    /**
     * Initialises any sliders in the given container.
     * @param {DOM Node} container The container to check in.
     */
    setup: function(container) {
        dojo.query('input[type=range]', container).forEach(function(item) {

            hyf.attachEventHandler(item, 'oninput', function(){hyf.control.slider.processValueChange(item.id);});
            hyf.attachEventHandler(item, 'onchange', function(){hyf.control.slider.processValueChange(item.id);});
            hyf.control.slider.processValueChange(item.id);

        });
    },

    /**
     * Processes a change to the value of the specified control
     * so that the display text is updated accordingly.
     * @param {String} id ID of the control to process.
     */
    processValueChange: function(id) {
        var dispContainer = document.getElementById(id + '_display');
        if (dispContainer) {
            var val = hyf.control.slider.getControlValue(id, true);
            dispContainer.innerHTML = val;
        }

    },

    /**
     * Gets the current value of the specified slider control.
     * @param {String | Object} control The ID or HTML element for the slider control
     * @param {boolean} getDisplayValue True if this should return the display value rather than the data value, if different.
     */
    getControlValue: function(control, getDisplayValue) {

        if (typeof(control) == 'string') {
            control = document.getElementById(control);
        }

        if (getDisplayValue) {
            if (hyf.util.getWebMakerAttribute(control, 'display-suffix')) {
                return control.value + hyf.util.getWebMakerAttribute(control, 'display-suffix');
            }
        }

        return control.value;
    }
}
//Make sure we setup any slider controls when new content is inserted
require(['dojo/topic'], function(topic) {
    topic.subscribe('hyf/hooks/contentInserted', hyf.control.slider.setup);
});