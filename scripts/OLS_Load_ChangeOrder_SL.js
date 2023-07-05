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
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

define(['N/search', 'N/log', 'N/record', 'N/url', 'N/http'],
    function(search, log, record, url, http) {

        function onRequest(context) {
            if (context.request.method === 'GET') {

                // Get parameters from Client Script
                var soRecordId        = context.request.parameters.soID;

                log.debug({
                    title:'request parameters',
                    details: JSON.stringify(context.request.parameters)
                });

                // Create Search for "Approved Change Orders"
                var searchFilters = [];
                searchFilters.push( search.createFilter({name: 'type', operator: search.Operator.ANYOF, values: ["Custom111"]}));
                searchFilters.push( search.createFilter({name: 'mainline', operator: search.Operator.IS, values: ["F"]}));
                searchFilters.push( search.createFilter({name: 'status', operator: search.Operator.ANYOF, values: ["Custom111:B"]}));
                searchFilters.push( search.createFilter({name: 'custbody_ols_co_loadcheck', operator: search.Operator.IS, values: ["F"]}));
                searchFilters.push( search.createFilter({name: 'custcol_ols_co_item_loaded', operator: search.Operator.IS, values: ["F"]}));
                searchFilters.push( search.createFilter({name: 'custbody_ols_co_so', operator: search.Operator.ANYOF, values: soRecordId}));

                var searchColumns = [];
                // searchColumns.push( search.createColumn({name: 'id', label: 'Internal ID', sort: search.Sort.ASC}));
                searchColumns.push( search.createColumn({name: 'tranid', label: 'Change Order Number', sort: search.Sort.ASC}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_amount', label: 'Amount'}));
                searchColumns.push( search.createColumn({name: 'account', label: 'Account'}));
                searchColumns.push( search.createColumn({name: 'line', label : 'Line ID'}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_internalid', label : 'Item'}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_quantity', label : 'Quantity'}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_description', label : 'Description'}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_unitsell', label : 'Description'}));
                searchColumns.push( search.createColumn({name: 'custcol_ols_co_item_unit', label : 'Unit'}));

                var srch_approvedCOList = search.create({
                    type: "customtransaction_ols_changeorder",
                    filters: searchFilters,
                    columns: searchColumns
                });

                // Add new change orders' items into sales order item line
                var soRecOld = record.load({
                    type: 'salesorder',
                    id: soRecordId,
                    isDynamic: true
                });

                var soOldItemCount = soRecOld.getLineCount({sublistId: 'item'});

                srch_approvedCOList.run().each(function(result){
                    log.debug({
                        title:'Change Order',
                        details: JSON.stringify(result)
                    });
                    
                    // var coItemAmount = result.getValue('amount');
                    // if (coItemAmount < 0) coItemAmount = coItemAmount * -1;

                    soRecOld.selectNewLine({ sublistId: 'item'});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_ols_so_item_co',value: result.id});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: result.getValue('custcol_ols_co_item_internalid')});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_ols_co_item_unit',value: result.getValue('custcol_ols_co_item_unit')});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: result.getValue('custcol_ols_co_item_quantity')});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'description', value: result.getValue('custcol_ols_co_item_description')});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'rate', value: result.getValue('custcol_ols_co_item_unitsell')});
                    // soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: coItemAmount});
                    soRecOld.setCurrentSublistValue({sublistId: 'item', fieldId: 'amount', value: result.getValue('custcol_ols_co_item_amount')});
                    soRecOld.commitLine({ sublistId: 'item'});

                    return true;
                });

                soRecOld.save();

                // Add new change orders' items into sales order item line
                var soNewRec = record.load({
                    type: 'salesorder',
                    id: soRecordId,
                    isDynamic: true
                });

                var coRecord;
                var coTranID = '';
                var soNewItemCount = 0;
                // Add Search results to each column
                srch_approvedCOList.run().each(function(result){

                    var newCOTranID = result.getValue('tranid');                      
                    if (coTranID == ''){
                        coRecord = record.load({
                            type: 'customtransaction_ols_changeorder',
                            id: result.id,
                            isDynamic: true
                        });
                        
                    } else if (coTranID != newCOTranID) {
                        var updateCORecID = coRecord.save();
                        log.debug({
                            title:'Updated Change Order ID',
                            details: updateCORecID
                        });

                        coRecord = record.load({
                            type: 'customtransaction_ols_changeorder',
                            id: result.id,
                            isDynamic: true
                        });
                    }

                    coTranID = newCOTranID;

                    var soItemSpecID = soNewRec.getSublistValue({sublistId: 'item', fieldId: 'id', line: soOldItemCount + soNewItemCount});
                    
                    coRecord.setValue({fieldId:'custbody_ols_co_loadcheck',value:true});
                    var lineNumber = parseInt(result.getValue('line')) - 1;
                    coRecord.selectLine({ sublistId: 'line', line: lineNumber});
                    coRecord.setCurrentSublistValue({sublistId: 'line', fieldId: 'custcol_ols_co_item_loaded', value:true});
                    coRecord.setCurrentSublistValue({sublistId: 'line', fieldId: 'custcol_ols_co_item_so_itemid', value: soItemSpecID});
                    coRecord.commitLine({ sublistId: 'line'});

                    soNewItemCount++;

                    return true;
                });

                // Only when there was Change Order record load done, save Change Order record
                if (coTranID != ''){
                    var updateCORecID = coRecord.save();
                    log.debug({
                        title:'Last Updated Change Order ID',
                        details: updateCORecID
                    });
                }


               context.response.sendRedirect({
                    type: http.RedirectType.RECORD,
                    identifier: record.Type.SALES_ORDER,
                    id: soRecordId
                });
            }
        }
    return {
        onRequest: onRequest
    };
});