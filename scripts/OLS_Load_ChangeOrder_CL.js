// 
// Copyright (c) 2019 OrangeLight Solutions, LLC 
// 1050 N Stuart Street 325 Arlington, VA 22201
// www.orangelightsolutions.com 
// All Rights Reserved. 
//  
// @author  OrangeLight Solutions
// @version 4.0
// @date    12 Jul 2019
//


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 
define([ 'N/record', 'N/url' ],
function(record, url, context) {
	function pageInit() {
	}
	function loadChangeOrder(recID) {
		var id = recID;
		console.log('id: ' + id);
        document.location = url.resolveScript({
            scriptId : 'customscript_ols_load_changeorder_sl',
            deploymentId : 'customdeploy_ols_load_changeorder_sl',
            params : {
                'soID' : id
            }
        });
    }

    return {
		pageInit : pageInit,
    	loadChangeOrder: loadChangeOrder
    };
    
});