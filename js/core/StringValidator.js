/* ===================================================================================================
* WARNING – This file is part of the base implementation for WebMaker, so it should not be edited or changed for any project.
* These files are replaced if a project is re-imported to the WebMaker Studio or migrated to a new version of the product.
* For guidance on 'How do I override or clone Hyfinity webapp files such as CSS & javascript?', please read the following relevant FAQ entry:
* http://www.hyfinity.net/faq/index/solution_id/1113
==================================================================================================== */

/*
 * StringValidator.js
 *
 * Company: Hyfinity Ltd
 * Copyright (c) 2003
 *
 * Wrapper object that contains a check method for validating a given field for conforming with the string type
 *
 * @author Gerard Smyth
 * @version 1.0
 *
 */


hyf.validation.StringValidator = function()
{

}


/*
 * Main method for the validation check
 * Delegates the work to the appropriate method depending on the type of control
 *
 * @return an array of ValidationError objects for the tests failed
 */
hyf.validation.StringValidator.prototype.check = function(field)
{

    //alert('checking string field : '+field.name);

    var failedChecks = new Array();

    switch (field.type)
    {
        case "text":
        case "textarea":
        case "password":
        case "hidden":
        case "file":
            failedChecks = hyf.validation.StringValidator.checkTextField(field);
            break;
        case "select-one":
        case "select-multiple":
            failedChecks = hyf.validation.StringValidator.checkSelectField(field);
            break;
        case "checkbox":
            failedChecks = hyf.validation.StringValidator.checkCheckBoxField(field);
            break;
        case "radio":
            failedChecks = hyf.validation.StringValidator.checkRadioField(field);
            break;
        default:
            break;
    }
    return failedChecks;
}

/**
 * Static method to validate a given text box field as a string value
 * @param field The text field to validate
 * @return an array of all the errors found
 * @private
 */
hyf.validation.StringValidator.checkTextField = function(field)
{
    var failedChecks = new Array();

    if (field.getAttribute("_required") == 'true')
    {
        if (field.value=='')
            failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
    }

    if (field.value != '')
        failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, field.value));

    return failedChecks;
}

/**
 * Static method to validate a given select box field as a string value
 * @param field The select box field to validate
 * @return an array of all the errors found
 * @private
 */
hyf.validation.StringValidator.checkSelectField = function(field)
{
    var failedChecks = new Array();
    var checkVal = '';

    if (field.type == "select-multiple") //need to check every selected value
    {
        var selected = false;
        for (var i = 0 ; i < field.options.length; ++i)
        {
            if (field.options[i].selected == true)
            {
                //May not want this to check text as well
                //eg, may have the text saying 'Please Select a Value'
                /*if (field.options[i].value=='')
                    checkVal = field.options[i].text;
                else*/
                    checkVal = field.options[i].value;

                if (checkVal != '')
                    selected = true;
                failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, checkVal));
            }
        }
        if (field.getAttribute("_required") == 'true')
        {
            if (!selected)
               failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
        }
    }
    else //only need to check the one selected value
    {
        //check if value required and if so is one selected
        if (field.getAttribute("_required") == 'true')
        {
            if (field.selectedIndex == -1)
                failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
            else
            {
                //May not want this to check text as well
                //eg, may have the text saying 'Please Select a Value'
                /*if (field.options[field.selectedIndex].value=='')
                    checkVal = field.options[field.selectedIndex].text;
                else*/
                    checkVal = field.options[field.selectedIndex].value;

                if (checkVal == '')
                    failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
            }
        }
        if (checkVal != '')
            failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, checkVal));
    }

    return failedChecks;
}

/**
 * Static method to validate a given check box field as a string value
 * @param field The checkbox field to validate
 * @return an array of all the errors found
 * @private
 */
hyf.validation.StringValidator.checkCheckBoxField = function(field)
{
    var failedChecks = new Array();

    //see if this checkbox is being used as part of a selectMany control or just a single entry
    if (field.getAttribute('_use') == 'selectMany')
    {
        var selectManyName = field.getAttribute('_element');
        //find all checkboxes that make up the selectMany control
        var checkBoxes = new Array();
        var inputs = document.getElementById(selectManyName + '_container').getElementsByTagName("input");
        for (var i=0; i<inputs.length; ++i)
        {
            if ((inputs.item(i).type == "checkbox") && (inputs.item(i).getAttribute('_use') == 'selectMany'))
            {
                if (inputs.item(i).getAttribute('_element') == selectManyName)
                {
                    checkBoxes[checkBoxes.length] = inputs.item(i);
                }
            }
        }

        //alert(checkBoxes.length+" checkboxes in this select many control");

        //check if value required - a selectMany checkbox being required means at least one of the checkboxes must be checked!!!
        if (field.getAttribute("_required") == 'true')
        {
            var oneChecked = false;
            for (var i=0; i<checkBoxes.length; ++i)
            {
                //alert(checkBoxes[i].checked);
                if (checkBoxes[i].checked==true)
                {
                    oneChecked = true;
                    break;
                }
            }
            //alert(oneChecked);
            if (!oneChecked)
                failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
        }

        if (field.checked == true)
            failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, field.value));

    }
    else
    {
        //check if value required - a checkbox being required means it must be checked!!!
        if (field.getAttribute("_required") == 'true')
        {
            if (field.checked==false)
                failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
        }

        if (field.checked == true)
            failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, field.value));
    }

    return failedChecks;
}

/**
 * Static method to validate a given radio button field as a string value
 * @param field The radio field to validate
 * @return an array of all the errors found
 * @private
 */
hyf.validation.StringValidator.checkRadioField = function(field)
{
    var failedChecks = new Array();
    var name = field.name;
    var radioArray;
    if (eval("field.form") != null)
    {
        radioArray = eval("field.form."+name);
    }
    else
    {
        //This handles the case where the info might reside outside the main form, e.g. a dialog control.
        radioArray = dojo.query('input[type=radio][name='+name+']');
    }

    var checkVal = '';
    var checked = false;

    if (radioArray.length == undefined)
    {
        if (radioArray.checked == true)
        {
            checked = true;
            checkVal = radioArray.value;
        }
    }
    else
    {
        for (var i = 0; i < radioArray.length; ++i)
        {
            if (radioArray[i].checked == true)
            {
                checked = true;
                checkVal = radioArray[i].value;
            }
        }
    }

    //check if value required - ie one radio button must be selected
    if (field.getAttribute("_required") == 'true')
    {
        if (!checked)
            failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REQUIRED));
    }

    //check constriants on value
    failedChecks = failedChecks.concat(hyf.validation.StringValidator.checkString(field, checkVal));

    return failedChecks;
}

/* Checks the length, minLength, maxLength and regularExpression
 * attributes against the value if they are present
 */
hyf.validation.StringValidator.checkString = function(field, value)
{
    var failedChecks = new Array();

    //check if any conversions are required on the value
    value = hyf.validation.ValueConverter.performStringConversion(field, value);

    //alert(value.length);
    if ((field.getAttribute("_length") != undefined) && (field.getAttribute("_length") != null) && (field.getAttribute("_length") != ''))
    {
        if (Number(value.length) != Number(field.getAttribute("_length")))
            failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_LENGTH));
    }
    if ((field.getAttribute("_minLength") != undefined) && (field.getAttribute("_minLength") != null) && (field.getAttribute("_minLength") != ''))
    {
        if (Number(value.length) < Number(field.getAttribute("_minLength")))
            failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_MIN_LENGTH));
    }
    if ((field.getAttribute("_maxLength") != undefined) && (field.getAttribute("_maxLength") != null) && (field.getAttribute("_maxLength") != ''))
    {
        if (Number(value.length) > Number(field.getAttribute("_maxLength")))
            failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_MAX_LENGTH));
    }
    if ((field.getAttribute("_regularExpression") != undefined) && (field.getAttribute("_regularExpression") != null) && (field.getAttribute("_regularExpression") != ''))
    {
        //_regularExpression attribute can contain multiple REs, all of which must match
        //Most normal seperator characters can occur in REs so use obscure seperator (*@*@*) between REs, and split the string into an array

        var regExps = field.getAttribute("_regularExpression");
        var REArray = regExps.split('*@*@*');

        //alert(regExps);
        //alert(REArray.length);

        for(var i=0; i<REArray.length; ++i)
        {
            //alert(i);
            //alert(REArray[i]);
            if (value.search(REArray[i]) == -1)
            {
                failedChecks = failedChecks.concat(new hyf.validation.ValidationError(field, hyf.validation.ValidationError.ERROR_REGULAR_EXPRESSION));
                break;
            }
        }

        /* if (value.search(field._regularExpression) == -1)
            failedChecks = failedChecks.concat(new ValidationError(field, ValidationError.ERROR_REGULAR_EXPRESSION)); */
    }

    return failedChecks;
}
