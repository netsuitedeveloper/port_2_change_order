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
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/ui/dialog'],
    function(record, search, dialog) {

        function fieldChanged(context){

            var strLoggerTitle = 'OLS_Init_ChangeOrder_CL fieldChanged';
            console.log(strLoggerTitle + ' Started Successfully');

            var currentRecord = context.currentRecord;
            console.log(JSON.stringify(context));

            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;

            // When line is selected
            if (sublistName === 'line'){

                // when line "Item" field is selected
                if ( sublistFieldName === 'custcol_ols_co_item_internalid'){

                    // Initiate item "Account" field as default value - 54 "Sales"
                    var itemAccount = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'account'
                    });
                    if (!itemAccount){
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'account',
                            'value': 54,
                            'ignoreFieldChange':true
                        });
                    }

                    // Initiate item "Total Cost" field as default value - 0
                    var itemTotalCost = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_totalcost'
                    });
                    if (!itemTotalCost){
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'custcol_ols_co_item_totalcost',
                            'value': "0.00",
                            'ignoreFieldChange':true
                        });
                    }


                    // based on item's internalid, 
                    // check if the selected item is "Inventory Item" and it has 0 quantity avaialble
                    var currentItemLabel = currentRecord.getCurrentSublistText({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_internalid'
                    });
                    var currentItemID = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_internalid'
                    });

                    // look up item record's type, quantity available, quantity back ordered, quantity on order
                    var itemFieldLookUp = search.lookupFields({
                        type: search.Type.ITEM,
                        id: currentItemID,
                        columns: ['type', 'quantityavailable', 'quantitybackordered', 'quantityonorder']
                    });

                    var currType = itemFieldLookUp.type[0].value;

                    // if selected new item's type is "Inventory Item" and it has 0 quantity avaialble, 
                    // open a dialog for warning message
                    if (currType == 'InvtPart') {
                        var qtyAvailable = itemFieldLookUp.quantityavailable;
                        var qtyBackordered = itemFieldLookUp.quantitybackordered;
                        var qtyOnorder = itemFieldLookUp.quantityonorder;

                        if ( !qtyAvailable || qtyAvailable == "" ) qtyAvailable = 0;
                        if ( !qtyBackordered || qtyBackordered == "" ) qtyBackordered = 0;
                        if ( !qtyOnorder || qtyOnorder == "" ) qtyOnorder = 0;

                        if ( qtyAvailable == 0 ){
                            dialog.alert({
                                title: 'Selected New Item, Warning!',
                                message: currentItemLabel + ': You have only ' 
                                + qtyAvailable + ' available (' 
                                + qtyBackordered + ' back ordered, ' 
                                + qtyOnorder + ' on order).'
                            }); 
                        }
                    }
                }
                // when line "Quantity" field is changed
                else if ( sublistFieldName === 'custcol_ols_co_item_quantity'){

                    // update line "Amount"
                    var itemQty = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_quantity'
                    });
                    var itemUnitsell = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_unitsell'
                    });
                    if (itemUnitsell){
                        var valueAmount = itemQty * itemUnitsell;
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'custcol_ols_co_item_amount',
                            'value': valueAmount,
                            'ignoreFieldChange':true
                        });
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'amount',
                            'value': Math.abs(valueAmount),
                            'ignoreFieldChange':true
                        });
                    }

                    // update line "Total Cost"
                    var itemUnitcost = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_unitcost'
                    });
                    var valueTotalcost = itemQty * itemUnitcost;
                    currentRecord.setCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_totalcost',
                        'value': valueTotalcost,
                        'ignoreFieldChange':true
                    });

                }
                // when line "Unit Sell" field is changed
                else if ( sublistFieldName === 'custcol_ols_co_item_unitsell'){

                    // update line "Amount"
                    var itemQty = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_quantity'
                    });
                    var itemUnitsell = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_unitsell'
                    });
                    if (itemUnitsell){
                        var valueAmount = itemQty * itemUnitsell;
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'custcol_ols_co_item_amount',
                            'value': valueAmount,
                            'ignoreFieldChange':true
                        });
                        currentRecord.setCurrentSublistValue({
                            'sublistId':'line',
                            'fieldId':'amount',
                            'value': Math.abs(valueAmount),
                            'ignoreFieldChange':true
                        });
                    }

                }
                // when line "Unit Cost" field is changed
                else if ( sublistFieldName === 'custcol_ols_co_item_unitcost'){

                    // update line "Total Cost"
                    var itemQty = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_quantity'
                    });
                    var itemUnitcost = currentRecord.getCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_unitcost'
                    });
                    var valueTotalcost = itemQty * itemUnitcost;
                    currentRecord.setCurrentSublistValue({
                        'sublistId':'line',
                        'fieldId':'custcol_ols_co_item_totalcost',
                        'value': valueTotalcost,
                        'ignoreFieldChange':true
                    });


                }

            }

            console.log(strLoggerTitle + ' Ended Successfully');

        }

        function sublistChanged(context){

            var strLoggerTitle = 'OLS_Init_ChangeOrder_CL sublistChanged';
            console.log(strLoggerTitle + ' Started Successfully');

            // when add line, calculate the following fields
            // "TOTAL CHANGE ORDER AMOUNT"
            // "TOTAL CHANGE ORDER BUDGET"
            // "GROSS PROFIT"
            // "GROSS MARGIN"
            var currentRecord = context.currentRecord;
            // var coAmount = currentRecord.getValue({fieldId: 'custbody_ols_co_totalamount'});
            // var coBudget = currentRecord.getValue({fieldId: 'custbody_ols_co_totalbudget'});

            var itemCount = currentRecord.getLineCount('line');

            var totalAmount = 0;
            var totalCost = 0;

            for (var i = 0; i < itemCount; i++) {

                var itemTotalAmount = currentRecord.getSublistValue({
                    sublistId: 'line', 
                    fieldId: 'custcol_ols_co_item_amount',
                    line: i
                });
                var itemTotalCost = currentRecord.getSublistValue({
                    sublistId: 'line', 
                    fieldId: 'custcol_ols_co_item_totalcost',
                    line: i
                });

                // console.log(itemTotalAmount + ' itemTotalAmount');
                // console.log(itemTotalCost + ' itemTotalCost');

                totalAmount += itemTotalAmount;
                totalCost +=  itemTotalCost;
            }

            var coGrossprofit = totalAmount - totalCost;
            var coGrossmargin = (coGrossprofit / totalAmount * 100).toFixed(2);

            // console.log(totalAmount + ' totalAmount');
            // console.log(totalCost + ' totalCost');
            // console.log(coGrossprofit + ' coGrossprofit');
            // console.log(coGrossmargin + ' coGrossmargin');

            currentRecord.setValue({
                fieldId: 'custbody_ols_co_totalamount',
                value: totalAmount
            });
            currentRecord.setValue({
                fieldId: 'custbody_ols_co_totalbudget',
                value: totalCost
            });
            currentRecord.setValue({
                fieldId: 'custbody_ols_co_grossprofit',
                value: coGrossprofit
            });
            currentRecord.setValue({
                fieldId: 'custbody_ols_co_grossmargin',
                value: coGrossmargin.toString() + '%'
            });

            console.log(strLoggerTitle + ' Ended Successfully');

        }

        function validateField(context) {

            // When user tries to change line "Quantity" / "Unit Sell", do the following check
            // if selected item's type is "Inventory Item" / "Assemblies" and updated field has value less than 0, 
            // open a dialog for warning message
            var strLoggerTitle = 'OLS_Init_ChangeOrder_CL validateField';
            console.log(strLoggerTitle + ' Started Successfully');

            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var line = context.line;
            if (sublistName === 'line') {
                if (sublistFieldName === 'custcol_ols_co_item_quantity' 
                || sublistFieldName === 'custcol_ols_co_item_unitsell') {

                    var lineItem = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custcol_ols_co_item_internalid'
                    });

                    // look up item record's type
                    var itemFieldLookUp = search.lookupFields({
                        type: search.Type.ITEM,
                        id: lineItem,
                        columns: ['type']
                    });

                    var currType = itemFieldLookUp.type[0].value;

                    // if selected item's type is "Inventory Item" / "Assemblies" and updated field has value less than 0, 
                    // open a dialog for warning message
                    if ( (currType == 'InvtPart' || currType == 'Assembly') 
                    && (currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: sublistFieldName }) < 0)) {

                        dialog.alert({
                            title: 'Warning!',
                            message: 'Assemblies or Inventory Items must have a positive amount. Please input positive value.'
                        }); 
                        // return false;
                    }
                }
            }

            console.log(strLoggerTitle + ' Ended Successfully');

            return true;
        }

        function validateLine(context) {

            // When user tries to insert new line and check 'amount' field validation
            // if selected item's type is "Inventory Item" / "Assemblies" and 'amount' field has value less than 0, 
            // open a dialog for warning message
            var strLoggerTitle = 'OLS_Init_ChangeOrder_CL validateLine';
            console.log(strLoggerTitle + ' Started Successfully');

            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            if (sublistName === 'line') {

                var lineItem = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_ols_co_item_internalid'
                });

                // look up item record's type
                var itemFieldLookUp = search.lookupFields({
                    type: search.Type.ITEM,
                    id: lineItem,
                    columns: ['type']
                });

                var currType = itemFieldLookUp.type[0].value;

                // if selected item's type is "Inventory Item" / "Assemblies" and 'amount' field has value less than 0, 
                // open a dialog for warning message
                if ( (currType == 'InvtPart' || currType == 'Assembly') 
                && (currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_ols_co_item_amount' }) < 0)) {

                    dialog.alert({
                        title: 'Warning!',
                        message: 'Assemblies or Inventory Items must have a positive amount.'
                    }); 
                    return false;
                }
            }

            console.log(strLoggerTitle + ' Ended Successfully');

            return true;
        }

        // function lineInit(context){

        //     var strLoggerTitle = 'OLS_Init_ChangeOrder_CL lineInit';
        //     console.log(strLoggerTitle + ' Started Successfully');

        //     if (context.mode = 'edit'){
        //         console.log(JSON.stringify(context));
        //         var currentRecord = context.currentRecord;
        //         var sublistName = context.sublistId;

        //         var coLoadCheck = currentRecord.getValue({fieldId: 'custbody_ols_co_loadcheck'})

        //         // Disable 'Item' if 'Loaded' is checked
        //         if (coLoadCheck == true && sublistName == "line"){

        //             var coItemLoaded = currentRecord.getCurrentSublistValue({
        //                 sublistId : sublistName,
        //                 fieldId : 'custcol_ols_co_item_loaded'
        //             });
        //             var coLineNum = currentRecord.getCurrentSublistIndex({sublistId : sublistName});
        //             var coItem = currentRecord.getSublistField({
        //                 sublistId : sublistName,
        //                 fieldId : 'custcol_ols_co_item_internalid',
        //                 line : line
        //             });

        //             if (coItemLoaded) {
        //                 coItem.isDisabled = true;
        //             } else {
        //                 coItem.isDisabled = false;
        //             }
        //         }
        //     }

        //     console.log(strLoggerTitle + ' Ended Successfully');

        // }

        // function saveRecord(context){

        //     var strLoggerTitle = 'OLS_Init_ChangeOrder_CL saveRecord';
        //     console.log(strLoggerTitle + ' Started Successfully');

        //     if (context.mode = 'edit'){
        //         console.log(JSON.stringify(context));
        //         var currentRecord = context.currentRecord;
        //         var coStatus = currentRecord.getValue({fieldId: 'status'})

        //         // Do not able to edit & save "Approved" Change Order, only display a alert
        //         if (coStatus == 'Approved'){
        //             dialog.alert({
        //                 title: 'Attention!',
        //                 message: 'It is not allowed to edit Approved Change Orders'
        //             }); 

        //             // return false;
        //         } else {

        //             return true;

        //         }
        //     }

        //     console.log(strLoggerTitle + ' Ended Successfully');

        // }

        return {
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged,
            validateField: validateField,
            validateLine: validateLine
            // lineInit: lineInit
            // saveRecord: saveRecord
        };
    }
);