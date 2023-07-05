// 
// Copyright (c) 2019 OrangeLight Solutions, LLC 
// 1050 N Stuart Street 325 Arlington, VA 22201
// www.orangelightsolutions.com 
// All Rights Reserved. 
//
// A Suitelet form is created to approve "Pending Approval" Change Orders.
// Filters are:
//  Status - "Pending Approval"
//  
// @author  OrangeLight Solutions
// @version 4.0
// @date    12 Jul 2019
//


/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
var CLIENT_SCRIPT_FILE_PATH = "SuiteScripts/OLS_Approve_ChangeOrder_CL.js";
var CHANGE_ORDER_URL = "/app/accounting/transactions/transaction.nl?customtype=111&id=";

define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/record'],
    function(serverWidget, search, log, record) {

        function onRequest(context) {
            if (context.request.method === 'GET') {

                var strLoggerTitle = 'OLS_Approve_ChangeOrder_SL GET';
                log.debug({
                    title: strLoggerTitle,
                    details: 'Started Successfully'
                });

                log.debug({
                    title:'request parameters',
                    details: JSON.stringify(context.request.parameters)
                });

                // Create "Approve Change Order" Form
                var form = serverWidget.createForm({
                    title: 'Approve Change Order'
                });

                form.clientScriptModulePath = CLIENT_SCRIPT_FILE_PATH;

                // Get parameters from Client Script
                var scriptId        = context.request.parameters.script;
                var deploymentId    = context.request.parameters.deploy;
                var actionId        = parseInt(context.request.parameters.action);
                var countId         = parseInt(context.request.parameters.count);
                
                // Set countId to correct value if out of count
                if (!countId || countId == '' || countId < 0) {
                    countId = 0;
                }

                // if there were approved/rejected Change Orders, display confirmation message
                if (countId > 0){

                    var confirmMsg = "( " + countId.toString() + " Change Order";

                    if (countId == 1) confirmMsg += " is ";
                    else if (countId > 1) confirmMsg += "s are ";

                    if (actionId == 1) confirmMsg += "successfully approved )";
                    else if (actionId == 2) confirmMsg += "successfully rejected )";

                    // Confirmatin Message on form
                    var coConfirmMessage = form.addField({
                        id: 'custpage_confirmmsg',
                        type: serverWidget.FieldType.LABEL,
                        label: confirmMsg
                    });
                }

                // Add "Change Orders" Sublist
                var sublist = form.addSublist({
                    id: 'sublist_co',
                    type: serverWidget.SublistType.LIST,
                    label: 'Pending Approval Change Orders'
                });

                // Create Search for "Pending Approved Change Orders"
                var searchFilters = [];
                searchFilters.push( search.createFilter({name: 'type', operator: search.Operator.ANYOF, values: ["Custom111"]}));
                searchFilters.push( search.createFilter({name: 'mainline', operator: search.Operator.IS, values: ["T"]}));
                searchFilters.push( search.createFilter({name: 'status', operator: search.Operator.ANYOF, values: ["Custom111:A"]}));

                var searchColumns = [];
                searchColumns.push( search.createColumn({name: 'tranid', label: 'Document Number', sort: search.Sort.ASC}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_project', label : 'Project'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_so', label : 'Sales Order'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_number', label: 'CO#'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_submittedby', label : 'Submitted By'}));
                searchColumns.push( search.createColumn({name: 'status', label : 'Status'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_totalamount', label : 'Total Amount'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_totalbudget', label : 'Total Cost'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_grossprofit', label : 'Gross Profit'}));
                searchColumns.push( search.createColumn({name: 'custbody_ols_co_grossmargin', label : 'Gross Margin'}));
                searchColumns.push( search.createColumn({name: 'memo', label : 'Memo'}));

                var srch_pendingCOList = search.create({
                    type: "customtransaction_ols_changeorder",
                    filters: searchFilters,
                    columns: searchColumns
                });

                // Add Select checkbox to the sublist
                sublist.addField({
                    id:'update_co_box',
                    type:serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });
                // Add the search columns to the sublist
                sublist.addField({
                    id: 'custpage_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Internal ID'
                });
                for (var i=0; i< searchColumns.length; i++) {
                    sublist.addField({
                        id: searchColumns[i].name,
                        type: serverWidget.FieldType.TEXT,
                        label: searchColumns[i].label
                    });
                }

                // Add Search results to each column
                var lineNum = 0;
                srch_pendingCOList.run().each(function(result){
                    log.debug({
                        title:'Change Order',
                        details: JSON.stringify(result)
                    });

                    var coRecID = result.id;
                    var coUrl = '<a href="' + CHANGE_ORDER_URL + coRecID + '" style="color: #255599; text-decoration: none; border-bottom: none;">' + result.getValue('tranid') + '</a>';

                    sublist.setSublistValue({
                        id : 'custpage_id',
                        line : lineNum,
                        value : coRecID
                    });                    
                    sublist.setSublistValue({
                        id : 'tranid',
                        line : lineNum,
                        value : coUrl
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_project',
                        line : lineNum,
                        value : result.getText('custbody_ols_co_project')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_so',
                        line : lineNum,
                        value : result.getText('custbody_ols_co_so')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_number',
                        line : lineNum,
                        value : result.getValue('custbody_ols_co_number')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_submittedby',
                        line : lineNum,
                        value : result.getText('custbody_ols_co_submittedby')
                    });
                    sublist.setSublistValue({
                        id : 'status',
                        line : lineNum,
                        value : result.getText('status')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_totalamount',
                        line : lineNum,
                        value : result.getValue('custbody_ols_co_totalamount')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_totalbudget',
                        line : lineNum,
                        value : result.getValue('custbody_ols_co_totalbudget')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_grossprofit',
                        line : lineNum,
                        value : result.getValue('custbody_ols_co_grossprofit')
                    });
                    sublist.setSublistValue({
                        id : 'custbody_ols_co_grossmargin',
                        line : lineNum,
                        value : result.getValue('custbody_ols_co_grossmargin')
                    });
                    var strMemo = result.getValue('memo');
                    if (strMemo){
                        sublist.setSublistValue({
                            id : 'memo',
                            line : lineNum,
                            value : strMemo
                        });
                    }

                    lineNum++;
                    return true;
                });       

                sublist.addRefreshButton();
                sublist.addMarkAllButtons();

                //Add "Approve" Button
                form.addButton({
                    id: 'custpage_approve_btn',
                    label: 'Approve',
                    functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + 1 + ')'
                });
                //Add "Reject" Button
                form.addButton({
                    id: 'custpage_reject_btn',
                    label: 'Reject',
                    functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + 2 + ')'
                });

                // Add "Approve" Submit Button
                // form.addSubmitButton('Approve');

                context.response.writePage(form);

                log.debug({
                    title: strLoggerTitle,
                    details: 'Ended Successfully'
                });

            } 
        }

    return {
        onRequest: onRequest
    };
});