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

var CREATE_CHANGE_ORDER_URL = "/app/accounting/transactions/custom.nl?customtype=111&whence=";

define([ 'N/record', 'N/log' ],
function(record, currentRecord, context) {
	function pageInit() {
	}
	function newChangeOrder(recID) {
		var id = recID;
		console.log('id: ' + id);
		var coCreateUrl = CREATE_CHANGE_ORDER_URL + "&project=" + id;
        document.location = coCreateUrl;
    }
   
    return {
		pageInit : pageInit,
    	newChangeOrder: newChangeOrder
    };
    
});