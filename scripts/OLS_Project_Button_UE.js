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
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 
var CLIENT_SCRIPT_FILE_PATH = "SuiteScripts/OLS_Project_Button_CL.js";

define([ 'N/record', 'N/log' ],
function(record, log) {
    
    function beforeLoad(scriptContext) {
        if(scriptContext.type == 'view') {
            var currentRecord = scriptContext.newRecord;
            var recId = currentRecord.id;
            var projectForm = scriptContext.form;
            projectForm.clientScriptModulePath = CLIENT_SCRIPT_FILE_PATH;
            projectForm.addButton({
                id : 'custpage_ols_changeorder_btn',
                label : 'New Change Order',
                functionName : 'newChangeOrder(' + recId + ')'
            });
        }
    }
    return {
        beforeLoad : beforeLoad
    };

});